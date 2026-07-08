import type { NotificationPayload } from "../../types";
import type { EmailMessage } from "./types";
import { buildHtmlTemplate } from "./templates";
import { resolveTemplate } from "./template-resolver";

function formatPrice(amount: number): string {
  return `Rp${amount.toLocaleString("id-ID")}`;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}

function orderSummaryHtml(payload: NotificationPayload): string {
  const items = payload.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px">${item.productName}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px;text-align:center">${item.quantity}x</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px;text-align:right">${formatPrice(item.subtotal)}</td>
        </tr>`,
    )
    .join("");

  return `<table width="100%" cellpadding="0" cellspacing="0">
    <tr><th style="text-align:left;padding:8px 0;border-bottom:2px solid #1a472a;font-size:14px">Produk</th>
        <th style="text-align:center;padding:8px 0;border-bottom:2px solid #1a472a;font-size:14px">Qty</th>
        <th style="text-align:right;padding:8px 0;border-bottom:2px solid #1a472a;font-size:14px">Subtotal</th></tr>
    ${items}
    <tr><td colspan="2" style="padding:8px 0;font-size:14px;font-weight:bold">Ongkos Kirim</td>
        <td style="padding:8px 0;font-size:14px;text-align:right">${formatPrice(payload.order.shippingFee)}</td></tr>
    <tr><td colspan="2" style="padding:8px 0;font-size:16px;font-weight:bold;color:#1a472a">Total</td>
        <td style="padding:8px 0;font-size:16px;font-weight:bold;color:#1a472a;text-align:right">${formatPrice(payload.order.totalAmount)}</td></tr>
  </table>`;
}

function formatRupiah(amount: number): string {
  return `Rp${amount.toLocaleString("id-ID")}`;
}

function detailsHtml(payload: NotificationPayload): string {
  const parts: string[] = [];

  parts.push(`<p style="margin:0 0 8px;font-size:14px"><strong>Nomor Pesanan:</strong> ${payload.order.orderId}</p>`);
  parts.push(`<p style="margin:0 0 8px;font-size:14px"><strong>Tanggal:</strong> ${formatDateTime(payload.order.createdAt)}</p>`);

  if (payload.payment?.method) {
    parts.push(`<p style="margin:0 0 8px;font-size:14px"><strong>Metode Pembayaran:</strong> ${payload.payment.method}</p>`);
  }
  if (payload.payment?.paidAt) {
    parts.push(`<p style="margin:0 0 8px;font-size:14px"><strong>Dibayar Pada:</strong> ${formatDateTime(payload.payment.paidAt)}</p>`);
  }
  if (payload.shipment?.waybillId) {
    parts.push(`<p style="margin:0 0 8px;font-size:14px"><strong>Nomor Resi:</strong> ${payload.shipment.waybillId}</p>`);
  }
  if (payload.shipment?.courier) {
    parts.push(`<p style="margin:0 0 8px;font-size:14px"><strong>Kurir:</strong> ${payload.shipment.courier}${payload.shipment.courierType ? ` (${payload.shipment.courierType})` : ""}</p>`);
  }
  if (payload.cancellation?.reason) {
    parts.push(`<p style="margin:0 0 8px;font-size:14px"><strong>Alasan Pembatalan:</strong> ${payload.cancellation.reason}</p>`);
  }
  if (payload.order.shippingAddress) {
    parts.push(`<p style="margin:0 0 8px;font-size:14px"><strong>Alamat Pengiriman:</strong> ${payload.order.shippingAddress}</p>`);
  }

  return parts.join("");
}

function buildPlainText(payload: NotificationPayload, intro: string): string {
  const lines: string[] = [];

  lines.push(`D'Jaemo Jamur Krispi`);
  lines.push(`---`);
  lines.push(``);
  lines.push(`Halo ${payload.customer.name},`);
  lines.push(``);
  lines.push(intro);
  lines.push(``);
  lines.push(`Nomor Pesanan: ${payload.order.orderId}`);
  lines.push(`Total: ${formatRupiah(payload.order.totalAmount)}`);
  lines.push(``);

  if (payload.shipment?.waybillId) {
    lines.push(`Nomor Resi: ${payload.shipment.waybillId}`);
    lines.push(``);
  }

  lines.push(`---`);
  lines.push(`D'Jaemo Jamur Krispi`);

  return lines.join("\n");
}

export function formatEmail(payload: NotificationPayload): EmailMessage {
  const template = resolveTemplate(payload);

  const to = payload.customer.email ?? "";
  const orderSummary = orderSummaryHtml(payload);
  const details = detailsHtml(payload);

  const body = `${details}<div style="margin-top:24px">${orderSummary}</div>`;

  const footer = `
    <p style="margin:0 0 4px">D'Jaemo Jamur Krispi</p>
    <p style="margin:0 0 4px">${formatDateTime(new Date().toISOString())}</p>
    <p style="margin:0">© ${new Date().getFullYear()} D'Jaemo. All rights reserved.</p>
  `;

  const html = buildHtmlTemplate(template.headerHtml, body, footer);
  const text = buildPlainText(payload, template.plainTextIntro);

  return { to, subject: template.subject, html, text };
}
