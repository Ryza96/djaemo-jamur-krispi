// Kebijakan bisnis COD (phase awal). Dipakai di sisi server (validasi
// checkout) dan client (UI metode pembayaran), jadi tanpa dependency
// server-only apa pun.
export const COD_ALLOWED_PROVINCES = [
  "jawa barat",
  "jawa tengah",
  "di yogyakarta",
  "jawa timur",
  "banten",
  "dki jakarta",
] as const;

export const COD_MAX_TOTAL = 300000;

export function isCodAllowedProvince(province: string): boolean {
  const normalized = province.trim().toLowerCase().replace(/\s+/g, " ");
  return (COD_ALLOWED_PROVINCES as readonly string[]).includes(normalized);
}

/**
 * Total nominal yang benar-benar akan ditagih kepada customer saat COD.
 * Inilah dasar perhitungan cap kelayakan COD: subtotal bersih SETELAH diskon
 * voucher, ditambah ongkir dan biaya COD (jika ada).
 *
 * Dipakai BERSAMA di sisi client (components/checkout/PaymentMethodSection.tsx)
 * dan server (lib/services/payment/checkoutValidation.ts) supaya formula cap
 * tidak pernah drift. Jangan ubah formula hanya di salah satu sisi.
 */
export function calculateCodEligibleAmount(params: {
  subtotal: number;
  discountAmount?: number;
  shippingFee: number;
  codFee?: number;
}): number {
  const { subtotal, discountAmount = 0, shippingFee, codFee = 0 } = params;
  return Math.max(0, subtotal - discountAmount + shippingFee + codFee);
}