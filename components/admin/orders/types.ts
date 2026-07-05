export interface OrderListCustomer {
  name: string;
  email: string;
}

export interface OrderListItem {
  id: string;
  order_id: string;
  customer_id: number;
  total_amount: number;
  subtotal: number;
  shipping_fee: number;
  payment_status: string | null;
  fulfillment_status: string | null;
  payment_method: string | null;
  waybill_id: string | null;
  created_at: string;
  customers: OrderListCustomer | null;
}

export interface OrderListResponse {
  success: boolean;
  data: OrderListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OrderFilters {
  search: string;
  payment_status: string;
  fulfillment_status: string;
  sort: "newest" | "oldest";
  page: number;
  limit: number;
}

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
] as const;

export const PAYMENT_STATUS_OPTIONS = [
  { value: "", label: "All Payments" },
  { value: "unpaid", label: "Unpaid" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
  { value: "expired", label: "Expired" },
] as const;

export const FULFILLMENT_STATUS_OPTIONS = [
  { value: "", label: "All Fulfillment" },
  { value: "new", label: "New" },
  { value: "confirmed", label: "Confirmed" },
  { value: "packing", label: "Packing" },
  { value: "waybill_created", label: "Waybill Created" },
  { value: "picked_up", label: "Picked Up" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
] as const;

export const LIMIT_OPTIONS = [10, 20, 50, 100] as const;
