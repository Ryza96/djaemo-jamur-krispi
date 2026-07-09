type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral";

export function paymentStatusLabel(status: string | null): string {
  switch (status?.toLowerCase()) {
    case "paid":
      return "Lunas";
    case "pending":
      return "Menunggu Pembayaran";
    case "failed":
      return "Pembayaran Gagal";
    case "unpaid":
      return "Belum Dibayar";
    case "expired":
      return "Kedaluwarsa";
    default:
      return status ?? "-";
  }
}

export function fulfillmentStatusLabel(status: string | null): string {
  switch (status?.toLowerCase()) {
    case "new":
      return "Pesanan Baru";
    case "confirmed":
      return "Terkonfirmasi";
    case "packing":
      return "Sedang Dikemas";
    case "waybill_created":
      return "Resi Dibuat";
    case "picked_up":
      return "Dijemput Kurir";
    case "shipped":
      return "Dalam Pengiriman";
    case "delivered":
      return "Terkirim";
    case "completed":
      return "Selesai";
    case "cancelled":
      return "Dibatalkan";
    case "waiting_for_restock":
      return "Menunggu Restock";
    default:
      return status ?? "-";
  }
}

export function shippingStatusLabel(status: string | null): string {
  switch (status?.toLowerCase()) {
    case "confirmed":
      return "Dikonfirmasi";
    case "picking_up":
      return "Dijemput Kurir";
    case "dropping_off":
      return "Diantarkan";
    case "in_transit":
      return "Dalam Perjalanan";
    case "delivered":
      return "Terkirim";
    case "cancelled":
      return "Dibatalkan";
    case "retry":
      return "Dijadwalkan Ulang";
    default:
      return status ?? "-";
  }
}

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
    case "waiting_for_restock":
      return "warning";
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
