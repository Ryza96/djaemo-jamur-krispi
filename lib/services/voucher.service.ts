import { VoucherRepository, type VoucherRow, type CreateVoucherParams } from "@/lib/repositories/voucher.repository";
import {
  validateVoucherRules,
  getVoucherStatus,
  type VoucherStatus,
  type ValidateVoucherInput,
} from "@/lib/services/voucher-engine";

export type { VoucherStatus } from "@/lib/services/voucher-engine";
export type { VoucherRow } from "@/lib/repositories/voucher.repository";

export interface VoucherListItem extends VoucherRow {
  status: VoucherStatus;
}

export interface VoucherActionResult {
  success: boolean;
  error?: string;
  data?: VoucherRow;
}

export interface CheckoutVoucherResult {
  success: boolean;
  error?: string;
  discount?: {
    code: string;
    discount_percent: number;
    discount_amount: number;
  };
}

// Errors raised by the apply_voucher / preview_voucher RPCs (Postgres
// RAISE EXCEPTION produces messages like "VOUCHER_NOT_FOUND", ...).
const RPC_ERROR_MESSAGE: Record<string, string> = {
  VOUCHER_NOT_FOUND: "Kode voucher tidak ditemukan",
  VOUCHER_INACTIVE: "Kode voucher sudah tidak aktif",
  VOUCHER_EXPIRED: "Kode voucher sudah kadaluarsa",
  VOUCHER_LIMIT_REACHED: "Kode voucher sudah mencapai batas pemakaian",
};

function rpcErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  for (const [code, text] of Object.entries(RPC_ERROR_MESSAGE)) {
    if (message.includes(code)) return text;
  }
  if (message.includes("VOUCHER_MIN_PURCHASE")) {
    const match = message.match(/minimum (\d+)/i);
    const min = match ? Number(match[1]) : null;
    return min
      ? `Minimal belanja untuk voucher ini adalah ${min.toLocaleString("id-ID")}`
      : "Belanjaan belum memenuhi minimal voucher";
  }
  return message;
}

export const VoucherService = {
  async getAll(): Promise<VoucherListItem[]> {
    const rows = await VoucherRepository.findAll();
    return rows.map((row) => ({
      ...row,
      status: getVoucherStatus(row),
    }));
  },

  async getById(id: string): Promise<VoucherListItem | null> {
    const row = await VoucherRepository.findById(id);
    if (!row) return null;
    return { ...row, status: getVoucherStatus(row) };
  },

  validateCreateInput(
    input: Partial<CreateVoucherParams> & { code?: string },
  ): { success: boolean; error?: string } {
    if (!input.code || !input.code.trim()) {
      return { success: false, error: "Kode voucher harus diisi" };
    }
    if (!/^[A-Za-z0-9_-]+$/.test(input.code.trim())) {
      return { success: false, error: "Kode voucher hanya boleh huruf, angka, strip, dan underscore" };
    }
    if (!input.name || !input.name.trim()) {
      return { success: false, error: "Nama voucher harus diisi" };
    }
    if (
      typeof input.discount_percent !== "number" ||
      !Number.isInteger(input.discount_percent) ||
      input.discount_percent < 1 ||
      input.discount_percent > 100
    ) {
      return { success: false, error: "Diskon harus berupa persen utuh antara 1 dan 100" };
    }
    if (typeof input.min_purchase_amount !== "number" || input.min_purchase_amount < 0) {
      return { success: false, error: "Minimal belanja tidak valid" };
    }
    if (input.max_uses !== null && input.max_uses !== undefined) {
      if (typeof input.max_uses !== "number" || !Number.isInteger(input.max_uses) || input.max_uses < 1) {
        return { success: false, error: "Batas pemakaian harus bilangan bulat positif atau kosong" };
      }
    }
    if (!input.valid_from || !input.valid_until) {
      return { success: false, error: "Periode berlaku harus diisi" };
    }
    const from = new Date(input.valid_from);
    const until = new Date(input.valid_until);
    if (isNaN(from.getTime()) || isNaN(until.getTime())) {
      return { success: false, error: "Format periode berlaku tidak valid" };
    }
    if (from >= until) {
      return { success: false, error: "Tanggal mulai harus sebelum tanggal berakhir" };
    }
    return { success: true };
  },

  async create(input: CreateVoucherParams & { code?: string }): Promise<VoucherActionResult> {
    const validation = this.validateCreateInput(input);
    if (!validation.success) return validation;

    const existing = await VoucherRepository.findByCode(input.code!.trim().toUpperCase());
    if (existing) {
      return { success: false, error: "Kode voucher sudah digunakan" };
    }

    const row = await VoucherRepository.create({
      code: input.code!.trim().toUpperCase(),
      name: input.name!.trim(),
      discount_percent: input.discount_percent!,
      min_purchase_amount: Math.round(input.min_purchase_amount!),
      max_uses: input.max_uses ?? null,
      valid_from: input.valid_from,
      valid_until: input.valid_until,
    });

    return { success: true, data: row };
  },

  async update(id: string, input: Omit<CreateVoucherParams, "code">): Promise<VoucherActionResult> {
    const existing = await VoucherRepository.findById(id);
    if (!existing) {
      return { success: false, error: "Voucher tidak ditemukan" };
    }

    const validation = this.validateCreateInput({ ...input, code: existing.code });
    if (!validation.success) return validation;

    const row = await VoucherRepository.update(id, {
      name: input.name.trim(),
      discount_percent: input.discount_percent,
      min_purchase_amount: Math.round(input.min_purchase_amount),
      max_uses: input.max_uses ?? null,
      valid_from: input.valid_from,
      valid_until: input.valid_until,
    });

    return { success: true, data: row };
  },

  async setActive(id: string, isActive: boolean): Promise<VoucherActionResult> {
    const existing = await VoucherRepository.findById(id);
    if (!existing) {
      return { success: false, error: "Voucher tidak ditemukan" };
    }
    await VoucherRepository.setActive(id, isActive);
    return { success: true };
  },

  /**
   * Non-destructive validation for the real-time checkout endpoint.
   */
  async previewForCheckout(code: string, subtotal: number): Promise<CheckoutVoucherResult> {
    const normalized = code.trim().toUpperCase();
    if (!normalized) {
      return { success: false, error: "Masukkan kode voucher" };
    }

    try {
      const applied = await VoucherRepository.preview(normalized, Math.round(subtotal));
      return {
        success: true,
        discount: {
          code: applied.code,
          discount_percent: applied.discount_percent,
          discount_amount: applied.discount_amount,
        },
      };
    } catch (error) {
      return { success: false, error: rpcErrorMessage(error) };
    }
  },

  /**
   * Authoritative, atomic application at order creation. Re-validates all
   * rules server-side AND reserves a usage incrementally.
   */
  async applyForCheckout(code: string, subtotal: number): Promise<CheckoutVoucherResult> {
    const normalized = code.trim().toUpperCase();

    try {
      const applied = await VoucherRepository.applyAtomic(normalized, Math.round(subtotal));
      return {
        success: true,
        discount: {
          code: applied.code,
          discount_percent: applied.discount_percent,
          discount_amount: applied.discount_amount,
        },
      };
    } catch (error) {
      return { success: false, error: rpcErrorMessage(error) };
    }
  },

  /**
   * Pure validation fallback used by the unit-testable path and for
   * scenarios that do not require an atomically reserved slot.
   */
  validateAgainstSubtotal(input: ValidateVoucherInput) {
    return validateVoucherRules(input);
  },
};
