import { OrderRepository, NotificationLogRepository, InventoryRepository } from "@/lib/repositories";
import { normalizeWaTarget } from "./channels/whatsapp/normalize-phone";
import { createFonnteProvider } from "./channels/whatsapp/fonnte-provider";
import { LOW_STOCK_ALERT_THRESHOLD } from "./channels/whatsapp/admin-formatter";
import { formatStockShortageWaMessage, formatLowStockWaMessage } from "./channels/whatsapp/admin-formatter";
import type { WhatsAppMessage, WhatsAppSendResult } from "./channels/whatsapp/types";
import type { OrderDetailRow } from "@/lib/repositories/order.repository";

export { LOW_STOCK_ALERT_THRESHOLD };

export const ADMIN_WA_CHANNEL_ID = "whatsapp-admin";

function resolveAdminTarget(logContext?: Record<string, unknown>): string | null {
  const rawNumber = process.env.ADMIN_WHATSAPP_NUMBER;
  if (!rawNumber) {
    console.warn("[notify] ADMIN_WHATSAPP_NUMBER kosong; skip notif admin", logContext);
    return null;
  }

  const adminTarget = normalizeWaTarget(rawNumber);
  if (!adminTarget) {
    console.warn("[notify] ADMIN_WHATSAPP_NUMBER format invalid; skip notif admin", logContext);
    return null;
  }

  return adminTarget;
}

function buildDashboardUrl(): string | null {
  const raw = process.env.ADMIN_DASHBOARD_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? null;
  if (!raw) return null;
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

async function sendAdminWa(message: WhatsAppMessage): Promise<WhatsAppSendResult> {
  const provider = createFonnteProvider(process.env.FONNTE_API_KEY ?? "");
  return provider.send(message);
}

/**
 * Shared fire-and-forget WhatsApp notification to the store admin. Runs
 * entirely outside the request-critical path: it never throws and is always
 * invoked without `await` (inside `after()`), so a failure here can never
 * fail, retry or roll back the triggering flow.
 *
 * Notification failures are swallowed and recorded in `notification_log`
 * (status 'failed') so they are visible via the Supabase dashboard without
 * ever disturbing the flow that triggered them. Idempotency is enforced per
 * (event, order_id, channel_id) via `isSent`.
 */
export async function maybeNotifyAdmin(params: {
  orderId: string;
  event: string;
  channelId: string;
  logContext?: Record<string, unknown>;
  buildMessage: (
    order: OrderDetailRow,
    target: string,
    dashboardUrl: string | null,
  ) => WhatsAppMessage | Promise<WhatsAppMessage>;
}): Promise<void> {
  const { orderId, event, channelId, logContext, buildMessage } = params;
  try {
    const adminTarget = resolveAdminTarget({ orderId, ...logContext });
    if (!adminTarget) return;

    const alreadySent = await NotificationLogRepository.isSent(
      event,
      orderId,
      channelId,
    );
    if (alreadySent) {
      return;
    }

    const order = await OrderRepository.findDetailByOrderId(orderId);
    if (!order) {
      console.warn("[notify] order tidak ditemukan; skip notif admin", { orderId, ...logContext });
      return;
    }

    const dashboardUrl = buildDashboardUrl();

    let logId: string | null = null;
    try {
      logId = await NotificationLogRepository.insertPending(
        event,
        orderId,
        channelId,
      );

      const message = await buildMessage(
        order,
        adminTarget,
        dashboardUrl ? dashboardUrl.replace(/\/+$/, "") : null,
      );

      const result = await sendAdminWa(message);

      if (result.success) {
        await NotificationLogRepository.tryMarkSent(logId);
      } else {
        await NotificationLogRepository.markFailed(logId);
        console.error("[notify] WA admin send failed", { orderId, error: result.error });
      }
    } catch (err) {
      console.error("[notify] admin notif error (swallowed)", { orderId, error: err instanceof Error ? err.message : String(err) });
      if (logId) {
        try {
          await NotificationLogRepository.markFailed(logId);
        } catch (cleanupErr) {
          console.error("[notify] cleanup markFailed gagal (ignored)", { orderId, error: cleanupErr });
        }
      }
    }
  } catch (err) {
    console.error("[notify] admin notif unexpected error (swallowed)", { orderId, error: err instanceof Error ? err.message : String(err) });
  }
}

/**
 * Fire-and-forget WhatsApp alert to the admin when an order cannot be
 * fulfilled because requested quantities exceed current stock. Idempotent
 * per (event='order.stock_shortage', order_id, channel_id) via
 * `notification_log`, so repeated transitions to
 * `waiting_for_restock` for the same order never re-send.
 *
 * Never sent to the customer — admin target only.
 */
export async function maybeNotifyAdminOfStockShortage(orderId: string): Promise<void> {
  await maybeNotifyAdmin({
    orderId,
    event: "order.stock_shortage",
    channelId: ADMIN_WA_CHANNEL_ID,
    buildMessage: async (order, target, dashboardUrl) => {
      const batch = await InventoryRepository.validateStockBatch(
        (order.order_items ?? []).map((item) => ({
          productId: item.product_id,
          quantity: item.quantity,
        })),
      );

      const nameMap = new Map(
        (order.order_items ?? []).map((item) => [
          item.product_id,
          item.product_name,
        ]),
      );

      const shortages = batch
        .filter((item) => !item.sufficient)
        .map((item) => ({
          productName: nameMap.get(item.productId) ?? item.productId,
          requested: item.requested,
          available: item.available,
        }));

      return formatStockShortageWaMessage(order, shortages, target, dashboardUrl);
    },
  });
}

/**
 * Fire-and-forget WhatsApp alert to the admin when a product's stock crosses
 * below the low-stock threshold after an order deduction. Called only on a
 * downward threshold crossing (previousStock > threshold && newStock <=
 * threshold), so repeated deductions while already below the threshold do not
 * re-send — no `notification_log` row is used for this event (the schema's
 * unique sent index is keyed on order_id, which is not available here).
 *
 * Never sent to the customer — admin target only.
 */
export async function maybeNotifyAdminLowStock(params: {
  productId: string;
  productName: string;
  newStock: number;
}): Promise<void> {
  try {
    const adminTarget = resolveAdminTarget({ productId: params.productId });
    if (!adminTarget) return;

    const dashboardUrl = buildDashboardUrl();
    const message = formatLowStockWaMessage(
      params,
      adminTarget,
      dashboardUrl ? dashboardUrl.replace(/\/+$/, "") : null,
    );

    const result = await sendAdminWa(message);
    if (result.success) {
      console.info("[notify] low-stock alert sent", {
        productId: params.productId,
        productName: params.productName,
        newStock: params.newStock,
      });
    } else {
      console.error("[notify] WA low-stock send failed", {
        productId: params.productId,
        error: result.error,
      });
    }
  } catch (err) {
    console.error("[notify] low-stock alert error (swallowed)", {
      productId: params.productId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
