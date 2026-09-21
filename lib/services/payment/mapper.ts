import type { PaymentStatus } from "./types";
import { PAYMENT_STATUS } from "./types";

const MIDTRANS_TO_PAYMENT_STATUS: Record<string, PaymentStatus> = {
  settlement: PAYMENT_STATUS.PAID,
  capture: PAYMENT_STATUS.PAID,
  accept: PAYMENT_STATUS.PAID,
  pending: PAYMENT_STATUS.PENDING,
  deny: PAYMENT_STATUS.FAILED,
  cancel: PAYMENT_STATUS.FAILED,
  expire: PAYMENT_STATUS.EXPIRED,
  failure: PAYMENT_STATUS.FAILED,
  // refund/partial_refund: jalur ini TIDAK terpakai. Refund dilakukan MANUAL oleh pemilik
  // lewat TRANSFER LANGSUNG di luar sistem, BUKAN fitur refund Midtrans. Event
  // REFUND_CONFIRMED (lihat getRefundInfo dan confirmManualRefund di order.service.ts)
  // hanya penanda admin bahwa refund manual sudah selesai, bukan bagian dari alur Midtrans.
  refund: PAYMENT_STATUS.PAID,
  partial_refund: PAYMENT_STATUS.PAID,
  // chargeback/partial_chargeback → FAILED (jaring pengaman; penanganan utama ada di
  // OrderService.handleChargeback yang meng-intercept sebelum tabel transisi).
  chargeback: PAYMENT_STATUS.FAILED,
  partial_chargeback: PAYMENT_STATUS.FAILED,
  authorize: PAYMENT_STATUS.PENDING,
};

export function mapMidtransStatus(
  transactionStatus: string,
): PaymentStatus {
  return MIDTRANS_TO_PAYMENT_STATUS[transactionStatus] ?? PAYMENT_STATUS.PENDING;
}

export function combineAddress(address: {
  street: string;
  kelurahan: string;
  kecamatan: string;
  city: string;
  province: string;
  postalCode: string;
}): string {
  const parts = [
    address.street,
    `Kel. ${address.kelurahan}`,
    `Kec. ${address.kecamatan}`,
    address.city,
    address.province,
    address.postalCode,
  ];
  return parts.filter(Boolean).join(", ");
}
