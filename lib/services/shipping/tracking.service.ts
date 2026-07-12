import { OrderRepository } from "@/lib/repositories";
import { AuditLogService } from "@/lib/services/audit-log.service";
import { getTracking as biteshipGetTracking } from "./biteship";
import type { BiteshipTrackingResponse, TrackingInfo } from "./types";

export interface TrackingResult {
  success: boolean;
  data?: TrackingInfo & { lastTrackingAt: string | null };
  error?: string;
}

const TRACKING_EVENT_MAP: Record<string, string> = {
  picking_up: "shipment.picking_up",
  dropping_off: "shipment.dropping_off",
  in_transit: "shipment.in_transit",
  delivered: "shipment.delivered",
  cancelled: "shipment.cancelled",
  retry: "shipment.retry",
};

function mapHistoryToEvents(
  waybillId: string,
  oldStatus: string | null,
  history: BiteshipTrackingResponse["history"],
  knownStatuses: Set<string>,
): Array<{ event: string; status: string; updatedAt: string }> {
  const newEvents: Array<{ event: string; status: string; updatedAt: string }> = [];

  for (const entry of history) {
    const status = entry.status;
    const mappedEvent = TRACKING_EVENT_MAP[status];
    if (!mappedEvent) continue;
    if (knownStatuses.has(status)) continue;

    knownStatuses.add(status);
    newEvents.push({
      event: mappedEvent,
      status,
      updatedAt: entry.updated_at,
    });
  }

  return newEvents;
}

export const TrackingService = {
  async fetchAndPersist(orderId: string): Promise<TrackingResult> {
    try {
      const order = await OrderRepository.findDetailByOrderId(orderId);
      if (!order) {
        return { success: false, error: "ORDER_NOT_FOUND" };
      }

      if (!order.waybill_id) {
        return { success: false, error: "NO_WAYBILL" };
      }

      if (!order.shipping_tracking_id) {
        return { success: false, error: "NO_TRACKING_ID" };
      }

      const tracking = await biteshipGetTracking(order.shipping_tracking_id);

      const previousTrackingPayload = order.tracking_payload as { history?: Array<{ status: string }> } | null;
      const previousHistory = previousTrackingPayload?.history ?? [];
      const knownStatuses = new Set(previousHistory.map((h: { status: string }) => h.status));

      const newEvents = mapHistoryToEvents(
        order.waybill_id,
        order.shipping_status,
        tracking.history,
        knownStatuses,
      );

      for (const ev of newEvents) {
        await AuditLogService.logFulfillmentEvent({
          orderId,
          event: ev.event as never,
          fromStatus: order.shipping_status ?? "shipped",
          toStatus: ev.status,
          metadata: {
            waybill_id: order.waybill_id,
            shipping_status: ev.status,
          },
        });
      }

      const now = new Date().toISOString();

      await OrderRepository.updateTrackingInfo(order.id, {
        shipping_status: tracking.status,
        last_tracking_at: now,
        tracking_payload: tracking,
      });

      return {
        success: true,
        data: {
          status: tracking.status,
          waybillId: tracking.waybill_id,
          history: tracking.history,
          lastTrackingAt: now,
        },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch tracking info";
      return { success: false, error: message };
    }
  },
};
