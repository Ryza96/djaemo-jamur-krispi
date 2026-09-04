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

    const batchItems = order.order_items.map(
      (item: { product_id: string; product_name: string; quantity: number }) => ({
        productId: item.product_id,
        quantity: item.quantity,
      }),
    );

    const results = await InventoryRepository.validateStockBatch(batchItems);

    const nameMap = new Map(
      order.order_items.map(
        (item: { product_id: string; product_name: string }) => [
          item.product_id,
          item.product_name,
        ],
      ),
    );

    const items: OrderStockItem[] = results.map((r) => ({
      ...r,
      productName: nameMap.get(r.productId) ?? "",
    }));

    return {
      valid: items.every((i) => i.sufficient),
      items,
    };
  },

  async validateCheckoutStock(
    checkoutItems: CheckoutStockItem[],
  ): Promise<ValidateOrderStockResult> {
    const batchItems = checkoutItems.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));

    const results = await InventoryRepository.validateStockBatch(batchItems);

    const nameMap = new Map(
      checkoutItems.map((item) => [item.productId, item.productName]),
    );

    const items: OrderStockItem[] = results.map((r) => ({
      ...r,
      productName: nameMap.get(r.productId) ?? "",
    }));

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

    const batchItems = order.order_items.map(
      (item: { product_id: string; quantity: number }) => ({
        productId: item.product_id,
        quantity: item.quantity,
      }),
    );

    try {
      const result = await InventoryRepository.deductStockBatch(
        batchItems,
        MOVEMENT_REASON.ORDER_CONFIRM,
        orderId,
        `order:${orderId}:confirm`,
      );

      if (!result.success) {
        return { success: false, items: [], message: "DEDUCT_FAILED" };
      }

      const nameMap = new Map(
        order.order_items.map(
          (item: { product_id: string; product_name: string }) => [
            item.product_id,
            item.product_name,
          ],
        ),
      );

      const items: DeductOrderStockItem[] = result.items.map((r) => ({
        productId: r.productId,
        productName: nameMap.get(r.productId) ?? "",
        deducted: r.deducted,
        newStock: r.newStock,
      }));

      return { success: true, items };
    } catch (err) {
      return {
        success: false,
        items: [],
        message: err instanceof Error ? err.message : "DEDUCT_FAILED",
      };
    }
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

    const batchItems = order.order_items.map(
      (item: { product_id: string; quantity: number }) => ({
        productId: item.product_id,
        quantity: item.quantity,
      }),
    );

    try {
      const result = await InventoryRepository.deductStockBatch(
        batchItems,
        MOVEMENT_REASON.RESUME_FULFILLMENT,
        orderId,
        `order:${orderId}:resume`,
      );

      if (!result.success) {
        return { success: false, items: [], message: "RESUME_FAILED" };
      }

      const nameMap = new Map(
        order.order_items.map(
          (item: { product_id: string; product_name: string }) => [
            item.product_id,
            item.product_name,
          ],
        ),
      );

      const items: DeductOrderStockItem[] = result.items.map((r) => ({
        productId: r.productId,
        productName: nameMap.get(r.productId) ?? "",
        deducted: r.deducted,
        newStock: r.newStock,
      }));

      return { success: true, items };
    } catch (err) {
      return {
        success: false,
        items: [],
        message: err instanceof Error ? err.message : "RESUME_FAILED",
      };
    }
  },

  async getStock(productId: string): Promise<StockInfo> {
    return InventoryRepository.getStock(productId);
  },
};
