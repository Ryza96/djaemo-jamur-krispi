// ============================================================
// VOUCHER ENGINE — pure business rules (NO repository, NO I/O)
// ============================================================
// Mirrors the PromoEngine pattern: engine holds pure, dependency-free
// business logic; voucher.service.ts is the orchestration layer that
// talks to the repository. Keeping validation here makes the rules
// deterministic and unit-testable without touching the database.
// ============================================================

export type VoucherStatus = "active" | "inactive" | "upcoming" | "expired" | "exhausted";

export interface VoucherRules {
  code: string;
  name: string;
  discount_percent: number;
  min_purchase_amount: number;
  max_uses: number | null;
  current_uses: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
}

export interface VoucherValidationResult {
  valid: boolean;
  error?: VoucherErrorCode;
  message?: string;
  discount_percent?: number;
  discount_amount?: number;
}

export type VoucherErrorCode =
  | "NOT_FOUND"
  | "INACTIVE"
  | "NOT_YET_VALID"
  | "EXPIRED"
  | "BELOW_MIN_PURCHASE"
  | "LIMIT_REACHED";

export interface ValidateVoucherInput {
  voucher: VoucherRules | null;
  subtotal: number;
  now?: Date;
}

/**
 * Derives a human-facing status for admin list/detail display.
 */
export function getVoucherStatus(voucher: VoucherRules, now: Date = new Date()): VoucherStatus {
  if (!voucher.is_active) return "inactive";

  const validFrom = new Date(voucher.valid_from);
  const validUntil = new Date(voucher.valid_until);

  if (now < validFrom) return "upcoming";

  if (now > validUntil) return "expired";

  if (voucher.max_uses !== null && voucher.current_uses >= voucher.max_uses) {
    return "exhausted";
  }

  return "active";
}

export const VOUCHER_STATUS_LABEL: Record<VoucherStatus, string> = {
  active: "Aktif",
  inactive: "Nonaktif",
  upcoming: "Belum Aktif",
  expired: "Kadaluarsa",
  exhausted: "Kuota Habis",
};

/**
 * Builds a clear, customer-facing rejection message for a validation error.
 */
export function voucherErrorMessage(code: VoucherErrorCode, ctx?: { min?: number }): string {
  switch (code) {
    case "NOT_FOUND":
      return "Kode voucher tidak ditemukan";
    case "INACTIVE":
      return "Kode voucher sudah tidak aktif";
    case "NOT_YET_VALID":
      return "Kode voucher belum dapat digunakan";
    case "EXPIRED":
      return "Kode voucher sudah kadaluarsa";
    case "BELOW_MIN_PURCHASE":
      return ctx?.min
        ? `Minimal belanja untuk voucher ini adalah ${ctx.min.toLocaleString("id-ID")}`
        : "Belanjaan belum memenuhi minimal voucher";
    case "LIMIT_REACHED":
      return "Kode voucher sudah mencapai batas pemakaian";
    default:
      return "Kode voucher tidak valid";
  }
}

/**
 * Pure validation: checks existence, active toggle, validity window,
 * minimum purchase, and usage cap. Does NOT mutate anything.
 *
 * Returns { valid:true, discount_percent, discount_amount } when the
 * voucher is usable for the given subtotal, else a rejection code.
 */
export function validateVoucherRules(input: ValidateVoucherInput): VoucherValidationResult {
  const { voucher, subtotal, now = new Date() } = input;

  if (!voucher) {
    return { valid: false, error: "NOT_FOUND", message: voucherErrorMessage("NOT_FOUND") };
  }

  if (!voucher.is_active) {
    return { valid: false, error: "INACTIVE", message: voucherErrorMessage("INACTIVE") };
  }

  const validFrom = new Date(voucher.valid_from);
  const validUntil = new Date(voucher.valid_until);

  if (now < validFrom) {
    return { valid: false, error: "NOT_YET_VALID", message: voucherErrorMessage("NOT_YET_VALID") };
  }

  if (now > validUntil) {
    return { valid: false, error: "EXPIRED", message: voucherErrorMessage("EXPIRED") };
  }

  if (voucher.max_uses !== null && voucher.current_uses >= voucher.max_uses) {
    return { valid: false, error: "LIMIT_REACHED", message: voucherErrorMessage("LIMIT_REACHED") };
  }

  if (subtotal < voucher.min_purchase_amount) {
    return {
      valid: false,
      error: "BELOW_MIN_PURCHASE",
      message: voucherErrorMessage("BELOW_MIN_PURCHASE", { min: voucher.min_purchase_amount }),
    };
  }

  const discountAmount = Math.round((subtotal * voucher.discount_percent) / 100);

  return {
    valid: true,
    discount_percent: voucher.discount_percent,
    discount_amount: discountAmount,
  };
}
