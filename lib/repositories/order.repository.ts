import crypto from "crypto";
import { supabase } from "@/lib/supabase";
import type { PaymentStatus, FulfillmentStatus } from "@/lib/services/payment/types";

export interface OrderRow {
  id: string;
  order_id: string;
  customer_id: number;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  transaction_id: string | null;
  subtotal: number;
  shipping_fee: number;
  total_amount: number;
  status: string | null;
  payment_status: string | null;
  fulfillment_status: string | null;
  payment_method: string | null;
  courier_company: string | null;
  courier_type: string | null;
  shipping_cost: number | null;
  destination: string | null;
  postal_code: string | null;
  shipping_address: string | null;
  notes: string | null;
  admin_notes: string | null;
  waybill_id: string | null;
  shipment_id: string | null;
  shipping_tracking_id: string | null;
  destination_area_id: string | null;
  shipping_status: string | null;
  shipment_error: string | null;
  delivered_at: string | null;
  last_tracking_at: string | null;
  tracking_payload: unknown;
  courier_etd: string | null;
  paid_at: string | null;
  shipped_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  access_token: string;
  created_at: string;
  updated_at: string | null;
}

export interface OrderDetailRow extends OrderRow {
  order_items: Array<{
    id: number;
    order_id: string;
    product_id: string;
    product_name: string;
    price: number;
    quantity: number;
    subtotal: number;
    weight_grams: number | null;
    created_at: string;
    products: { stock: number } | null;
  }>;
}

export interface InsertOrderParams {
  order_id: string;
  customer_id: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  subtotal: number;
  shipping_fee: number;
  total_amount: number;
  destination: string;
  shipping_service: string;
  courier_company: string;
  courier_type: string;
  shipping_cost: number;
  shipping_address: string;
  postal_code: string;
  notes: string | null;
  payment_status: PaymentStatus;
  fulfillment_status: FulfillmentStatus;
  destination_area_id?: string | null;
}

export interface InsertOrderItemParams {
  order_id: string;
  product_id: string;
  product_name: string;
  price: number;
  quantity: number;
  subtotal: number;
  weight_grams?: number;
}

export interface PaginatedOrdersParams {
  search?: string;
  payment_status?: string;
  fulfillment_status?: string;
  date_from?: string;
  date_to?: string;
  sort: "newest" | "oldest";
  page: number;
  limit: number;
}

export interface PaginatedOrderItem {
  id: string;
  order_id: string;
  customer_id: number;
  customer_name: string | null;
  customer_email: string | null;
  total_amount: number;
  subtotal: number;
  shipping_fee: number;
  payment_status: string | null;
  fulfillment_status: string | null;
  payment_method: string | null;
  waybill_id: string | null;
  created_at: string;
}

export interface PaginatedOrdersResult {
  data: PaginatedOrderItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const OrderRepository = {
  async findByOrderId(orderId: string): Promise<OrderRow | null> {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("order_id", orderId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async findByWaybillId(waybillId: string): Promise<OrderRow | null> {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("waybill_id", waybillId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async findById(id: string): Promise<OrderRow | null> {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getPaginated(params: PaginatedOrdersParams): Promise<PaginatedOrdersResult> {
    const { search, payment_status, fulfillment_status, date_from, date_to, sort, page, limit } = params;

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let countQuery = supabase.from("orders").select("id", { count: "exact", head: true });
    let dataQuery = supabase
      .from("orders")
      .select("id, order_id, customer_id, customer_name, customer_email, total_amount, subtotal, shipping_fee, payment_status, fulfillment_status, payment_method, waybill_id, created_at");

    if (search) {
      const searchFilter = `%${search}%`;
      const conditions = [
        `order_id.ilike.${searchFilter}`,
        `customer_name.ilike.${searchFilter}`,
        `customer_email.ilike.${searchFilter}`,
      ];
      countQuery = countQuery.or(conditions.join(","));
      dataQuery = dataQuery.or(conditions.join(","));
    }

    if (payment_status) {
      countQuery = countQuery.eq("payment_status", payment_status);
      dataQuery = dataQuery.eq("payment_status", payment_status);
    }

    if (fulfillment_status) {
      countQuery = countQuery.eq("fulfillment_status", fulfillment_status);
      dataQuery = dataQuery.eq("fulfillment_status", fulfillment_status);
    }

    if (date_from) {
      countQuery = countQuery.gte("created_at", date_from);
      dataQuery = dataQuery.gte("created_at", date_from);
    }

    if (date_to) {
      countQuery = countQuery.lte("created_at", date_to);
      dataQuery = dataQuery.lte("created_at", date_to);
    }

    const { count: total, error: countError } = await countQuery;
    if (countError) throw countError;

    const { data: rawData, error } = await dataQuery
      .order("created_at", { ascending: sort === "oldest" })
      .range(from, to);

    if (error) throw error;

    const data: PaginatedOrderItem[] = (rawData ?? []).map((item: Record<string, unknown>) => ({
      id: item.id as string,
      order_id: item.order_id as string,
      customer_id: item.customer_id as number,
      customer_name: item.customer_name as string | null,
      customer_email: item.customer_email as string | null,
      total_amount: item.total_amount as number,
      subtotal: item.subtotal as number,
      shipping_fee: item.shipping_fee as number,
      payment_status: item.payment_status as string | null,
      fulfillment_status: item.fulfillment_status as string | null,
      payment_method: item.payment_method as string | null,
      waybill_id: item.waybill_id as string | null,
      created_at: item.created_at as string,
    }));

    return {
      data,
      total: total ?? 0,
      page,
      limit,
      totalPages: Math.ceil((total ?? 0) / limit),
    };
  },

  async findDetailByOrderId(orderId: string): Promise<OrderDetailRow | null> {
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("order_id", orderId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const items = data.order_items ?? [];
    const productIds = [...new Set(items.map((item: { product_id: string }) => item.product_id))];

    if (productIds.length === 0) return data as OrderDetailRow;

    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, stock")
      .in("id", productIds);

    if (productsError) throw productsError;

    const stockMap = new Map((products ?? []).map((p: { id: string; stock: number }) => [p.id, p.stock]));

    const enrichedItems = items.map((item: Record<string, unknown>) => ({
      ...item,
      products: stockMap.get(item.product_id as string) !== undefined
        ? { stock: stockMap.get(item.product_id as string) }
        : null,
    }));

    return { ...data, order_items: enrichedItems } as OrderDetailRow;
  },

  async findDetailById(id: string): Promise<OrderDetailRow | null> {
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const items = data.order_items ?? [];
    const productIds = [...new Set(items.map((item: { product_id: string }) => item.product_id))];

    if (productIds.length === 0) return data as OrderDetailRow;

    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, stock")
      .in("id", productIds);

    if (productsError) throw productsError;

    const stockMap = new Map((products ?? []).map((p: { id: string; stock: number }) => [p.id, p.stock]));

    const enrichedItems = items.map((item: Record<string, unknown>) => ({
      ...item,
      products: stockMap.get(item.product_id as string) !== undefined
        ? { stock: stockMap.get(item.product_id as string) }
        : null,
    }));

    return { ...data, order_items: enrichedItems } as OrderDetailRow;
  },

  async insert(params: InsertOrderParams): Promise<OrderRow> {
    const { data, error } = await supabase
      .from("orders")
      .insert({
        order_id: params.order_id,
        customer_id: params.customer_id,
        customer_name: params.customer_name,
        customer_phone: params.customer_phone,
        customer_email: params.customer_email,
        subtotal: params.subtotal,
        shipping_fee: params.shipping_fee,
        total_amount: params.total_amount,
        destination: params.destination,
        shipping_service: params.shipping_service,
        courier_company: params.courier_company,
        courier_type: params.courier_type,
        shipping_cost: params.shipping_cost,
        shipping_address: params.shipping_address,
        postal_code: params.postal_code,
        notes: params.notes,
        payment_status: params.payment_status,
        fulfillment_status: params.fulfillment_status,
        destination_area_id: params.destination_area_id ?? null,
        access_token: crypto.randomUUID(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async insertItems(items: InsertOrderItemParams[]): Promise<void> {
    const { error } = await supabase.from("order_items").insert(items);
    if (error) throw error;
  },

  async updatePayment(
    id: string,
    params: {
      payment_status: PaymentStatus;
      transaction_id?: string;
      payment_method?: string | null;
    },
  ): Promise<void> {
    const updates: Record<string, string | number | null> = {
      payment_status: params.payment_status,
      updated_at: new Date().toISOString(),
    };

    if (params.payment_status === "paid") {
      updates.paid_at = new Date().toISOString();
    }

    if (params.transaction_id !== undefined) {
      updates.transaction_id = params.transaction_id;
    }
    if (params.payment_method !== undefined) {
      updates.payment_method = params.payment_method;
    }

    const { error } = await supabase
      .from("orders")
      .update(updates)
      .eq("id", id);

    if (error) throw error;
  },

  async updatePaymentByOrderId(
    orderId: string,
    params: {
      payment_status: PaymentStatus;
      transaction_id?: string;
      payment_method?: string | null;
    },
  ): Promise<void> {
    const updates: Record<string, string | number | null> = {
      payment_status: params.payment_status,
      updated_at: new Date().toISOString(),
    };

    if (params.payment_status === "paid") {
      updates.paid_at = new Date().toISOString();
    }

    if (params.transaction_id !== undefined) {
      updates.transaction_id = params.transaction_id;
    }
    if (params.payment_method !== undefined) {
      updates.payment_method = params.payment_method;
    }

    const { error } = await supabase
      .from("orders")
      .update(updates)
      .eq("order_id", orderId);

    if (error) throw error;
  },

  /**
   * Conditional payment status update (optimistic concurrency control).
   *
   * Only updates the row when its current payment_status is one of
   * `allowedFrom`. Returns the number of rows actually updated so callers
   * can detect losing a race against a concurrent status change instead of
   * blindly overwriting it.
   */
  async updatePaymentByOrderIdIf(
    orderId: string,
    params: {
      payment_status: PaymentStatus;
      transaction_id?: string;
      payment_method?: string | null;
    },
    allowedFrom: PaymentStatus[],
  ): Promise<number> {
    const updates: Record<string, string | number | null> = {
      payment_status: params.payment_status,
      updated_at: new Date().toISOString(),
    };

    if (params.payment_status === "paid") {
      updates.paid_at = new Date().toISOString();
    }

    if (params.transaction_id !== undefined) {
      updates.transaction_id = params.transaction_id;
    }
    if (params.payment_method !== undefined) {
      updates.payment_method = params.payment_method;
    }

    const { data, error } = await supabase
      .from("orders")
      .update(updates)
      .eq("order_id", orderId)
      .in("payment_status", allowedFrom)
      .select("id");

    if (error) throw error;
    return data?.length ?? 0;
  },

  /**
   * Clears cancellation bookkeeping after an order has been recovered from
   * CANCELLED fulfillment (e.g. webhook race recovery).
   */
  async clearCancellation(id: string): Promise<void> {
    const { error } = await supabase
      .from("orders")
      .update({
        cancelled_at: null,
        cancellation_reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;
  },

  async updateFulfillmentStatus(
    id: string,
    status: FulfillmentStatus,
    extra?: Record<string, unknown>,
  ): Promise<void> {
    const updates: Record<string, string | number | null> = {
      fulfillment_status: status,
      updated_at: new Date().toISOString(),
    };

    if (status === "shipped") {
      updates.shipped_at = new Date().toISOString();
    }

    if (status === "delivered") {
      updates.completed_at = new Date().toISOString();
    }

    if (status === "cancelled") {
      updates.cancelled_at = new Date().toISOString();
      if (extra?.cancellation_reason !== undefined) {
        updates.cancellation_reason = extra.cancellation_reason as string;
      }
    }

    if (extra?.waybill_id !== undefined) {
      updates.waybill_id = extra.waybill_id as string;
    }

    const { error } = await supabase
      .from("orders")
      .update(updates)
      .eq("id", id);

    if (error) throw error;
  },

  async updateWaybill(id: string, waybillId: string): Promise<void> {
    const { error } = await supabase
      .from("orders")
      .update({
        waybill_id: waybillId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;
  },

  async updateAdminNotes(id: string, adminNotes: string): Promise<void> {
    const { error } = await supabase
      .from("orders")
      .update({
        admin_notes: adminNotes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;
  },

  async updateShipmentInfo(
    id: string,
    params: {
      shipment_id: string;
      waybill_id: string | null;
      tracking_id?: string | null;
    },
  ): Promise<void> {
    const updates: Record<string, string | null> = {
      shipment_id: params.shipment_id,
      waybill_id: params.waybill_id,
      updated_at: new Date().toISOString(),
    };

    if (params.tracking_id !== undefined) {
      updates.shipping_tracking_id = params.tracking_id;
    }

    const { error } = await supabase
      .from("orders")
      .update(updates)
      .eq("id", id);

    if (error) throw error;
  },

  async updateShippingStatus(
    id: string,
    params: {
      shipping_status: string;
      delivered_at?: string;
    },
  ): Promise<void> {
    const updates: Record<string, string | number | null> = {
      shipping_status: params.shipping_status,
      updated_at: new Date().toISOString(),
    };

    if (params.delivered_at !== undefined) {
      updates.delivered_at = params.delivered_at;
    }

    const { error } = await supabase
      .from("orders")
      .update(updates)
      .eq("id", id);

    if (error) throw error;
  },

  async updateTrackingInfo(
    id: string,
    params: {
      shipping_status: string;
      last_tracking_at: string;
      tracking_payload: unknown;
    },
  ): Promise<void> {
    const updates: Record<string, unknown> = {
      shipping_status: params.shipping_status,
      last_tracking_at: params.last_tracking_at,
      tracking_payload: params.tracking_payload,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("orders")
      .update(updates)
      .eq("id", id);

    if (error) throw error;
  },

  async deleteById(id: string): Promise<void> {
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) throw error;
  },
};
