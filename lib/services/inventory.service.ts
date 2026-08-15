import { InventoryRepository } from "@/lib/repositories/inventory.repository";
import { OrderRepository } from "@/lib/repositories";
import { AuditLogService } from "./audit-log.service";
import { MOVEMENT_REASON } from "@/lib/inventory/types";
import type {
  AdjustStockParams,
  CheckoutStockItem,
  StockInfo,
} from "@/lib/inventory/types";

export interface OrderStockItem {
  productId: string;
  productName: string;
  requested: number;
  available: number;
  sufficient: boolean;
}

export interface ValidateOrderStockResult {
  valid: boolean;
  items: OrderStockItem[];
}

export interface DeductOrderStockItem {
  productId: string;
  productName: string;
  deducted: number;
  newStock: number;
}

export interface DeductOrderStockResult {
  success: boolean;
  items: DeductOrderStockItem[];
  message?: string;
}

export interface RestoreOrderStockItem {
  productId: string;
  productName: string;
  restored: number;
  newStock: number;
}

export interface RestoreOrderStockResult {
  success: boolean;
  items: RestoreOrderStockItem[];
  message?: string;
}

export const InventoryService = {
  async validateOrderStock(
    orderId: string,
  ): Promise<ValidateOrderStockResult> {
    const order = await OrderRepository.findDetailByOrderId(orderId);

    if (!order || !order.order_items.length) {
      throw new Error("ORDER_NOT_FOUND");
    }

    const items: OrderStockItem[] = await Promise.all(
      order.order_items.map(async (item) => {
        const { available, currentStock } =
          await InventoryRepository.validateStock(item.product_id, item.quantity);

        return {
          productId: item.product_id,
          productName: item.product_name,
          requested: item.quantity,
          available: currentStock,
          sufficient: available,
        };
      }),
    );

    return {
      valid: items.every((i) => i.sufficient),
      items,
    };
  },

  async validateCheckoutStock(
    checkoutItems: CheckoutStockItem[],
  ): Promise<ValidateOrderStockResult> {
    const items: OrderStockItem[] = await Promise.all(
      checkoutItems.map(async (item) => {
        const { available, currentStock } =
          await InventoryRepository.validateStock(item.productId, item.quantity);

        return {
          productId: item.productId,
          productName: item.productName,
          requested: item.quantity,
          available: currentStock,
          sufficient: available,
        };
      }),
    );

    return {
      valid: items.every((i) => i.sufficient),
      items,
    };
  },

  async deductOrderStock(orderId: string): Promise<DeductOrderStockResult> {
    const order = await OrderRepository.findDetailByOrderId(orderId);

    if (!order || !order.order_items.length) {
      throw new Error("ORDER_NOT_FOUND");
    }

    const succeeded: DeductOrderStockItem[] = [];

    for (const item of order.order_items) {
      try {
        const newStock = await InventoryRepository.deductStock({
          productId: item.product_id,
          quantity: item.quantity,
          reason: MOVEMENT_REASON.ORDER_CONFIRM,
          actor: "system",
        });

        succeeded.push({
          productId: item.product_id,
          productName: item.product_name,
          deducted: item.quantity,
          newStock,
        });
      } catch (err) {
        await rollbackDeduct(succeeded);
        return {
          success: false,
          items: succeeded,
          message: err instanceof Error ? err.message : "DEDUCT_FAILED",
        };
      }
    }

    return { success: true, items: succeeded };
  },

  async restoreOrderStock(orderId: string): Promise<RestoreOrderStockResult> {
    const order = await OrderRepository.findDetailByOrderId(orderId);

    if (!order || !order.order_items.length) {
      throw new Error("ORDER_NOT_FOUND");
    }

    const items: RestoreOrderStockItem[] = [];
    let hasFailure = false;

    for (const item of order.order_items) {
      try {
        const newStock = await InventoryRepository.restoreStock({
          productId: item.product_id,
          quantity: item.quantity,
          reason: MOVEMENT_REASON.ORDER_CANCEL,
          actor: "system",
        });

        items.push({
          productId: item.product_id,
          productName: item.product_name,
          restored: item.quantity,
          newStock,
        });
      } catch (err) {
        hasFailure = true;
        await AuditLogService.logPaymentEvent({
          orderId,
          event: AuditLogService.events.ROLLBACK,
          fromStatus: "inventory.restore",
          toStatus: "inventory.restore_failed",
          metadata: {
            productId: item.product_id,
            productName: item.product_name,
            quantity: item.quantity,
            error: err instanceof Error ? err.message : "RESTORE_FAILED",
          },
        });
      }
    }

    return {
      success: true,
      items,
      message: hasFailure ? "PARTIAL_RESTORE_FAILURE" : undefined,
    };
  },

  async adjustProductStock(params: AdjustStockParams): Promise<void> {
    await InventoryRepository.adjustStock(params);
  },

  async resumeOrderStock(orderId: string): Promise<DeductOrderStockResult> {
    const order = await OrderRepository.findDetailByOrderId(orderId);

    if (!order || !order.order_items.length) {
      throw new Error("ORDER_NOT_FOUND");
    }

    const succeeded: DeductOrderStockItem[] = [];

    for (const item of order.order_items) {
      try {
        const newStock = await InventoryRepository.deductStock({
          productId: item.product_id,
          quantity: item.quantity,
          reason: MOVEMENT_REASON.RESUME_FULFILLMENT,
          actor: "system",
        });

        succeeded.push({
          productId: item.product_id,
          productName: item.product_name,
          deducted: item.quantity,
          newStock,
        });
      } catch (err) {
        await rollbackDeduct(succeeded);
        return {
          success: false,
          items: succeeded,
          message: err instanceof Error ? err.message : "RESUME_FAILED",
        };
      }
    }

    return { success: true, items: succeeded };
  },

  async getStock(productId: string): Promise<StockInfo> {
    return InventoryRepository.getStock(productId);
  },
};

async function rollbackDeduct(succeeded: DeductOrderStockItem[]): Promise<void> {
  for (const s of succeeded) {
    try {
      await InventoryRepository.restoreStock({
        productId: s.productId,
        quantity: s.deducted,
        reason: MOVEMENT_REASON.DEDUCT_ROLLBACK,
        actor: "system",
      });
    } catch {
      // Restore failure during rollback must not block the rollback
      // of other items. Manual intervention required for this item.
    }
  }
}
