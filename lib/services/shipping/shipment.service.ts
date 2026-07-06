import { OrderRepository } from "@/lib/repositories";
import { AuditLogService } from "@/lib/services/audit-log.service";
import { createShipment as biteshipCreateShipment } from "./biteship";
import { getTracking as biteshipGetTracking } from "./biteship";
import {
  mapOrderToBiteshipRequest,
  mapBiteshipResponse,
  mapWebhookToAuditPayload,
  mapBiteshipStatusToFulfillment,
} from "./mapper";
import { getShipperConfig, getCourierConfig } from "./constants";
import type {
  CreateShipmentResult,
  BiteshipWebhookPayload,
  TrackingInfo,
} from "./types";
import type { OrderDetailRow } from "@/lib/repositories/order.repository";
import type { FulfillmentStatus } from "@/lib/services/payment/types";

function validateShipmentReady(order: OrderDetailRow): string | null {
  if (!order.postal_code) {
    return "POSTAL_CODE_REQUIRED";
  }
  if (!order.shipping_address) {
    return "SHIPPING_ADDRESS_REQUIRED";
  }
  if (!order.customer_phone) {
    return "CUSTOMER_PHONE_REQUIRED";
  }

  const items = order.order_items ?? [];
  for (const item of items) {
    if (item.weight_grams == null) {
      return `PRODUCT_WEIGHT_REQUIRED: ${item.product_name}`;
    }
  }

  return null;
}

export const ShipmentService = {
  async createShipment(orderId: string): Promise<CreateShipmentResult> {
    try {
      const order = await OrderRepository.findDetailByOrderId(orderId);
      if (!order) {
        return { success: false, shipmentId: null, waybillId: null, error: "ORDER_NOT_FOUND" };
      }

      if (order.shipment_id) {
        return {
          success: true,
          shipmentId: order.shipment_id,
          waybillId: order.waybill_id,
        };
      }

      const validationError = validateShipmentReady(order);
      if (validationError) {
        return { success: false, shipmentId: null, waybillId: null, error: validationError };
      }

      const shipper = getShipperConfig();
      const courier = getCourierConfig();

      const params = mapOrderToBiteshipRequest(order, shipper, courier.deliveryType);

      const response = await biteshipCreateShipment(params);

      const result = mapBiteshipResponse(response);

      await OrderRepository.updateShipmentInfo(order.id, {
        shipment_id: result.shipmentId!,
        waybill_id: result.waybillId!,
      });

      await OrderRepository.updateShippingStatus(order.id, {
        shipping_status: "confirmed",
      });

      await OrderRepository.updateFulfillmentStatus(order.id, "waybill_created");

      await AuditLogService.logFulfillmentEvent({
        orderId,
        event: AuditLogService.events.ORDER_WAYBILL_CREATED,
        fromStatus: order.fulfillment_status ?? "confirmed",
        toStatus: "waybill_created",
        metadata: {
          shipment_id: result.shipmentId,
          waybill_id: result.waybillId,
        },
      });

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create shipment";
      return { success: false, shipmentId: null, waybillId: null, error: message };
    }
  },

  async handleWebhook(payload: BiteshipWebhookPayload): Promise<void> {
    try {
      const order = await OrderRepository.findByWaybillId(payload.waybill_id);
      if (!order) {
        console.error(`Webhook: order not found for waybill ${payload.waybill_id}`);
        return;
      }

      const targetStatus = mapBiteshipStatusToFulfillment(payload.status);
      const audit = mapWebhookToAuditPayload(payload);

      await OrderRepository.updateShippingStatus(order.id, {
        shipping_status: payload.status,
        delivered_at: payload.status === "delivered" ? new Date().toISOString() : undefined,
      });

      await OrderRepository.updateFulfillmentStatus(order.id, targetStatus as FulfillmentStatus);

      await AuditLogService.logFulfillmentEvent({
        orderId: order.order_id,
        event: audit.event as never,
        fromStatus: order.fulfillment_status ?? "waybill_created",
        toStatus: targetStatus,
        metadata: audit.metadata,
      });
    } catch (err) {
      console.error("Webhook handler error:", err);
    }
  },

  async getTrackingInfo(orderId: string): Promise<TrackingInfo | { error: string }> {
    try {
      const order = await OrderRepository.findDetailByOrderId(orderId);
      if (!order) {
        return { error: "ORDER_NOT_FOUND" };
      }

      if (!order.waybill_id) {
        return { error: "NO_WAYBILL" };
      }

      const tracking = await biteshipGetTracking(order.waybill_id);

      return {
        status: tracking.status,
        waybillId: tracking.waybill_id,
        history: tracking.history,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to get tracking info";
      return { error: message };
    }
  },
};
