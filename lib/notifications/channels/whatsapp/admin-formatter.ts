import type { WhatsAppMessage } from "./types";
import type { OrderDetailRow } from "@/lib/repositories/order.repository";

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}

export function formatAdminWaMessage(
  order: OrderDetailRow,
  target: string,
  dashboardUrl: string | null,
): WhatsAppMessage {
  const lines: string[] = [];

  lines.push("\u26A0\uFE0F *PESANAN BARU \u2014 SUDAH DIBAYAR*");
  lines.push("");
  lines.push(`No. Pesanan  : ${order.order_id}`);
  lines.push(`Pelanggan    : ${order.customer_name ?? "Pelanggan"}${order.customer_phone ? ` (${order.customer_phone})` : ""}`);
  lines.push(`Total Bayar  : ${formatRupiah(order.total_amount)}`);
  lines.push(`Ongkos Kirim : ${formatRupiah(order.shipping_fee ?? 0)}`);
  lines.push(`Tujuan       : ${order.destination ?? ""}`);
  lines.push(`Waktu Pesan  : ${formatDateTime(order.created_at)}`);
  lines.push("");

  lines.push("Produk:");
  for (const item of order.order_items ?? []) {
    lines.push(`- ${item.product_name} x${item.quantity}`);
  }
  lines.push("");

  if (dashboardUrl) {
    lines.push(`Konfirmasi via: ${dashboardUrl}/admin/orders/${order.order_id}`);
  }

  return { target, message: lines.join("\n") };
}
