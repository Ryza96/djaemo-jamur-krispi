import type { WhatsAppMessage } from "./types";
import type { OrderDetailRow } from "@/lib/repositories/order.repository";
import type { PartnerRow } from "@/lib/repositories/partner.repository";

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

/**
 * Low-stock alert threshold. Cross-references the dashboard's
 * `LOW_STOCK_THRESHOLD` in `lib/repositories/dashboard.repository.ts:3` —
 * keep both at 10.
 */
export const LOW_STOCK_ALERT_THRESHOLD = 10;

export function formatStockShortageWaMessage(
  order: OrderDetailRow,
  shortages: Array<{ productName: string; requested: number; available: number }>,
  target: string,
  dashboardUrl: string | null,
): WhatsAppMessage {
  const lines: string[] = [];

  lines.push("\u26A0\uFE0F *PESANAN MELEBIHI STOK*");
  lines.push("");
  lines.push(`No. Pesanan : ${order.order_id}`);
  lines.push(`Pelanggan   : ${order.customer_name ?? "Pelanggan"}`);
  lines.push("");

  if (shortages.length > 0) {
    lines.push("Produk yang kurang:");
    for (const s of shortages) {
      lines.push(
        `- ${s.productName} \u2014 minta ${s.requested}, tersedia ${s.available} (kurang ${s.requested - s.available})`,
      );
    }
  } else {
    lines.push("Stok terlihat sudah mencukupi saat pesan dibuat \u2014 cek status order.");
  }
  lines.push("");

  if (dashboardUrl) {
    lines.push(`Cek pesanan: ${dashboardUrl}/admin/orders/${order.order_id}`);
  }

  return { target, message: lines.join("\n") };
}

export function formatLowStockWaMessage(
  params: { productId: string; productName: string; newStock: number },
  target: string,
  dashboardUrl: string | null,
): WhatsAppMessage {
  const lines: string[] = [];

  lines.push("\u{1F4C9} *STOK MENIPIS*");
  lines.push("");
  lines.push(`Produk    : ${params.productName}`);
  lines.push(`Sisa stok : ${params.newStock} (ambang: ${LOW_STOCK_ALERT_THRESHOLD})`);
  lines.push("");

  if (dashboardUrl) {
    lines.push(`Cek stok: ${dashboardUrl}/admin/products`);
  }

  return { target, message: lines.join("\n") };
}

export function formatNewCodOrderWaMessage(
  order: OrderDetailRow,
  target: string,
  dashboardUrl: string | null,
): WhatsAppMessage {
  const lines: string[] = [];

  lines.push("\u{1F6F5} *PESANAN COD BARU*");
  lines.push("");
  lines.push(`No. Pesanan   : ${order.order_id}`);
  lines.push(`Pelanggan     : ${order.customer_name ?? "Pelanggan"}`);
  lines.push(`Total Tagihan : ${formatRupiah(order.total_amount)}`);
  lines.push("");

  if (dashboardUrl) {
    lines.push(`Cek pesanan: ${dashboardUrl}/admin/orders/${order.order_id}`);
  }

  return { target, message: lines.join("\n") };
}

export function formatPartnerRegisteredWaMessage(
  partner: PartnerRow,
  target: string,
  dashboardUrl: string | null,
): WhatsAppMessage {
  const lines: string[] = [];
  const partnerType =
    partner.partner_type === "reseller" ? "Reseller" : "Dropshipper";

  lines.push("\u{1F91D} *PENDAFTAR PARTNER BARU*");
  lines.push("");
  lines.push(`Nama Lengkap : ${partner.full_name}`);
  lines.push(`Tipe Partner : ${partnerType}`);
  lines.push(`Username     : ${partner.username}`);
  lines.push(`WhatsApp     : ${partner.phone}`);
  lines.push("");

  if (dashboardUrl) {
    lines.push(`Cek dan review: ${dashboardUrl}/admin/partners`);
  } else {
    lines.push("Cek dan review di halaman admin Partner.");
  }

  return { target, message: lines.join("\n") };
}
