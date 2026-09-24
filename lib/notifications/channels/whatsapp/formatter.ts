import type { WhatsAppMessage } from "./types";
import type { NotificationPayload } from "../../types";

const WA_TEMPLATE =
`Terima kasih {{NAMA_CUSTOMER}}.

Pesanan anda dengan Nomor Pesanan {{NOMOR_PESANAN}} telah kami konfirmasi dan akan segera kami proses.

Silahkan simpan Nomor Pesanan anda apabila ingin melakukan pelacakan pesanan.

Terima kasih telah berbelanja di D'Jaemo Jamur Krispi.`;

const WA_DELIVERED_TEMPLATE =
`Terima kasih {{NAMA_CUSTOMER}}.

Pesanan Anda dengan Nomor Pesanan {{NOMOR_PESANAN}} sudah diterima.

Terima kasih telah berbelanja di D'Jaemo Jamur Krispi.`;

export function formatWaMessage(payload: NotificationPayload): WhatsAppMessage {
  const name = payload.customer.name;
  const orderId = payload.order.orderId;

  const template = payload.event === "order.delivered"
    ? WA_DELIVERED_TEMPLATE
    : WA_TEMPLATE;

  const message = template
    .replace("{{NAMA_CUSTOMER}}", name)
    .replace("{{NOMOR_PESANAN}}", orderId);

  return { target: "", message };
}
