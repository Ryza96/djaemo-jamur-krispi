type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral";

export function paymentBadgeVariant(
  status: string | null,
): BadgeVariant {
  switch (status?.toLowerCase()) {
    case "paid":
      return "success";
    case "pending":
      return "warning";
    case "failed":
      return "danger";
    case "unpaid":
    case "expired":
      return "neutral";
    default:
      return "neutral";
  }
}

export function fulfillmentBadgeVariant(
  status: string | null,
): BadgeVariant {
  switch (status?.toLowerCase()) {
    case "completed":
    case "delivered":
      return "success";
    case "processing":
    case "confirmed":
    case "packing":
    case "waybill_created":
    case "picked_up":
    case "shipped":
      return "info";
    case "cancelled":
      return "danger";
    case "new":
      return "neutral";
    default:
      return "neutral";
  }
}

export function shippingBadgeVariant(
  status: string | null,
): BadgeVariant {
  switch (status?.toLowerCase()) {
    case "delivered":
      return "success";
    case "in_transit":
    case "picking_up":
    case "dropping_off":
      return "info";
    case "cancelled":
      return "danger";
    case "retry":
      return "warning";
    case "confirmed":
      return "neutral";
    default:
      return "neutral";
  }
}
