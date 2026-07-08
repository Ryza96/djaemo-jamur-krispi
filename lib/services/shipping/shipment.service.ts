import { OrderRepository } from "@/lib/repositories";
import { FulfillmentService } from "@/lib/services/fulfillment.service";
import { createShipment as biteshipCreateShipment } from "./biteship";
import { getTracking as biteshipGetTracking } from "./biteship";
import {
  mapOrderToBiteshipRequest,
  mapBiteshipResponse,
  mapBiteshipStatusToFulfillment,
} from "./mapper";
import { getShipperConfig, getCourierConfig } from "./constants";
import type {
  CreateShipmentResult,
  BiteshipWebhookPayload,
  TrackingInfo,
} from "./types";
import type { OrderDetailRow } from "@/lib/repositories/order.repository";

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
        return { success: false, shipmentId: null, waybillId: null, trackingId: null, trackingLink: null, error: "ORDER_NOT_FOUND" };
      }

      if (order.shipment_id) {
        const ord = order as OrderDetailRow & { shipping_tracking_id: string | null };
        return {
          success: true,
          shipmentId: order.shipment_id,
          waybillId: order.waybill_id,
          trackingId: ord.shipping_tracking_id ?? null,
          trackingLink: null,
        };
      }

      const validationError = validateShipmentReady(order);
      if (validationError) {
        return { success: false, shipmentId: null, waybillId: null, trackingId: null, trackingLink: null, error: validationError };
      }

      const shipper = getShipperConfig();
      const courier = getCourierConfig();

      const params = mapOrderToBiteshipRequest(order, shipper, courier.deliveryType);

      console.log("=== CREATE SHIPMENT PARAMS ===");
      console.log(JSON.stringify({
        delivery_type: params.deliveryType,
        courier_company: params.courierCompany,
        courier_type: params.courierService,
        destination_postal_code: params.destination.postalCode,
      }, null, 2));

      const response = await biteshipCreateShipment(params);

      const result = mapBiteshipResponse(response);

      await OrderRepository.updateShipmentInfo(order.id, {
        shipment_id: result.shipmentId!,
        waybill_id: result.waybillId!,
        tracking_id: result.trackingId,
      });

      await OrderRepository.updateShippingStatus(order.id, {
        shipping_status: "confirmed",
      });

      const waybillResult = await FulfillmentService.createWaybill(orderId);
      if (!waybillResult.success) {
        throw new Error(waybillResult.message);
      }

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create shipment";
      return { success: false, shipmentId: null, waybillId: null, trackingId: null, trackingLink: null, error: message };
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

      await OrderRepository.updateShippingStatus(order.id, {
        shipping_status: payload.status,
        delivered_at: payload.status === "delivered" ? new Date().toISOString() : undefined,
      });

      const fulfillmentCalls = {
        picked_up: FulfillmentService.markAsPickedUp,
        shipped: FulfillmentService.ship,
        delivered: FulfillmentService.complete,
        cancelled: FulfillmentService.cancel,
      };

      const fulfillmentCall = fulfillmentCalls[targetStatus as keyof typeof fulfillmentCalls];
      if (fulfillmentCall) {
        const r = await fulfillmentCall(order.order_id);
        if (!r.success) {
          console.error(`Fulfillment transition failed for ${order.order_id}: ${r.message}`);
        }
      }
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
