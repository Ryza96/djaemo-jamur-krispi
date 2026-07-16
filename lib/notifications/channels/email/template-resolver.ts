import { AuditLogService } from "../../../services/audit-log.service";
import type { NotificationPayload } from "../../types";
import type { EmailTemplate } from "./types";

function detectCategory(payload: NotificationPayload): string {
  const e = payload.event;

  if (e === AuditLogService.events.ORDER_CONFIRMED) return "confirmed";
  if (e === AuditLogService.events.ORDER_WAYBILL_CREATED) return "waybill";
  if (e === AuditLogService.events.ORDER_SHIPPED) return "shipped";
  if (e === AuditLogService.events.ORDER_COMPLETED) return "completed";
  if (e === AuditLogService.events.ORDER_CANCELLED) return "cancelled";

  if (e === AuditLogService.events.STATUS_CHANGED) {
    if (payload.payment?.paidAt) return "paid";
    if (payload.cancellation?.reason === "payment_failed") return "failed";
    if (payload.cancellation?.reason === "payment_expired") return "expired";
    return "paid";
  }

  return "status";
}

function subjectForCategory(orderId: string, cat: string): string {
  switch (cat) {
    case "paid":
      return `Pesanan ${orderId} — Pembayaran Berhasil`;
    case "failed":
      return `Pesanan ${orderId} — Pembayaran Gagal`;
    case "expired":
      return `Pesanan ${orderId} — Pembayaran Kadaluarsa`;
    case "confirmed":
      return `Pesanan ${orderId} — Pesanan Dikonfirmasi`;
    case "waybill":
      return `Pesanan ${orderId} — Resi Pengiriman`;
    case "shipped":
      return `Pesanan ${orderId} — Dalam Perjalanan`;
    case "completed":
      return `Pesanan ${orderId} — Pesanan Selesai`;
    case "cancelled":
      return `Pesanan ${orderId} — Pesanan Dibatalkan`;
    default:
      return `Pesanan ${orderId} — Status Terbaru`;
  }
}

function headerHtmlForCategory(name: string, cat: string): string {
  const greeting = `<p style="margin:0 0 16px;font-size:16px">Halo <strong>${name}</strong>,</p>`;

  switch (cat) {
    case "paid":
      return `${greeting}<p style="margin:0 0 16px;font-size:14px;color:#555555">Pembayaran Anda telah berhasil dikonfirmasi. Pesanan sedang diproses.</p>`;
    case "failed":
      return `${greeting}<p style="margin:0 0 16px;font-size:14px;color:#555555">Pembayaran untuk pesanan Anda gagal. Silakan lakukan pemesanan ulang.</p>`;
    case "expired":
      return `${greeting}<p style="margin:0 0 16px;font-size:14px;color:#555555">Waktu pembayaran untuk pesanan Anda telah habis. Silakan lakukan pemesanan ulang.</p>`;
    case "confirmed":
      return `${greeting}<p style="margin:0 0 16px;font-size:14px;color:#555555">Pesanan Anda telah dikonfirmasi dan sedang dikemas.</p>`;
    case "waybill":
      return `${greeting}<p style="margin:0 0 16px;font-size:14px;color:#555555">Resi pengiriman untuk pesanan Anda telah terbit.</p>`;
    case "shipped":
      return `${greeting}<p style="margin:0 0 16px;font-size:14px;color:#555555">Pesanan Anda sedang dalam perjalanan menuju alamat tujuan.</p>`;
    case "completed":
      return `${greeting}<p style="margin:0 0 16px;font-size:14px;color:#555555">Pesanan Anda telah selesai. Terima kasih telah berbelanja di D'Jaemo Jamur Krispi!</p>`;
    case "cancelled":
      return `${greeting}<p style="margin:0 0 16px;font-size:14px;color:#555555">Pesanan Anda telah dibatalkan.</p>`;
    default:
      return `${greeting}<p style="margin:0 0 16px;font-size:14px;color:#555555">Ada perubahan status pada pesanan Anda.</p>`;
  }
}

function plainTextIntroForCategory(cat: string): string {
  switch (cat) {
    case "paid":
      return "Pembayaran Anda telah berhasil dikonfirmasi.";
    case "failed":
      return "Pembayaran untuk pesanan Anda gagal.";
    case "expired":
      return "Waktu pembayaran untuk pesanan Anda telah habis.";
    case "confirmed":
      return "Pesanan Anda telah dikonfirmasi.";
    case "waybill":
      return "Resi pengiriman telah terbit.";
    case "shipped":
      return "Pesanan Anda sedang dalam perjalanan.";
    case "completed":
      return "Pesanan Anda telah selesai. Terima kasih!";
    case "cancelled":
      return "Pesanan Anda telah dibatalkan.";
    default:
      return "Ada perubahan status pada pesanan Anda.";
  }
}

export function resolveTemplate(payload: NotificationPayload): EmailTemplate {
  const cat = detectCategory(payload);

  return {
    subject: subjectForCategory(payload.order.orderId, cat),
    headerHtml: headerHtmlForCategory(payload.customer.name, cat),
    plainTextIntro: plainTextIntroForCategory(cat),
  };
}
