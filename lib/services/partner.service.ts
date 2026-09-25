import bcrypt from "bcryptjs";
import {
  PartnerRepository,
  type CreatePartnerParams,
  type PartnerRow,
  type PartnerType,
} from "@/lib/repositories/partner.repository";
import type { PartnerStatus } from "@/components/partner/PartnerAuthProvider";

export type { PartnerRow, PartnerType };
export type { PartnerStatus } from "@/components/partner/PartnerAuthProvider";

export const PARTNER_STATUSES = [
  "PENDING_REVIEW",
  "RESELLER_ACTIVE",
  "DROPSHIPPER_ACTIVE",
  "REJECTED",
  "SUSPENDED",
] as const;

export const BCRYPT_SALT_ROUNDS = 10;

export interface RegisterPartnerInput {
  partnerType: PartnerType;
  username: string;
  password: string;
  fullName: string;
  whatsapp: string;
  email: string;
  salesChannels: string[];
  links: string;
  salesPlan: string;
  confirmData: boolean;
  confirmReview: boolean;
}

export interface PartnerActionResult {
  success: boolean;
  error?: string;
  code?: "NOT_FOUND" | "USERNAME_TAKEN" | "EMAIL_TAKEN";
  data?: PartnerRow;
}

/**
 * Detects a unique-violation on partners.username (Postgres 23505 on
 * idx_partners_username) so registration can return a friendly error
 * instead of a raw database message. Checking the constraint inside the
 * catch (rather than a pre-read SELECT) is race-safe.
 */
function isUsernameTakenError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const err = error as { code?: unknown; message?: unknown };
  return (
    err.code === "23505" &&
    typeof err.message === "string" &&
    err.message.toLowerCase().includes("username")
  );
}

/**
 * Detects unique-violation on partners.email — the case-insensitive
 * index idx_partners_email_lower (migration 040, LOWER(email)).
 * Same SQLSTATE 23505 pattern as isUsernameTakenError; the substring
 * check works because the failing constraint name contains "email".
 */
function isEmailTakenError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const err = error as { code?: unknown; message?: unknown };
  return (
    err.code === "23505" &&
    typeof err.message === "string" &&
    err.message.toLowerCase().includes("email")
  );
}

export const PartnerService = {
  /**
   * Registration entry point: hashes the password (bcrypt) and persists
   * the partner with status PENDING_REVIEW. Never throws for expected
   * business errors (username taken); unexpected errors propagate to the
   * route handler which maps them to a 500.
   */
  async register(input: RegisterPartnerInput): Promise<PartnerActionResult> {
    const passwordHash = await bcrypt.hash(input.password, BCRYPT_SALT_ROUNDS);

    const params: CreatePartnerParams = {
      partner_type: input.partnerType,
      username: input.username.trim(),
      password_hash: passwordHash,
      full_name: input.fullName.trim(),
      phone: input.whatsapp.trim(),
      email: input.email.trim(),
      sales_channels: input.salesChannels,
      links: input.links.trim() === "" ? null : input.links.trim(),
      sales_plan: input.salesPlan.trim(),
      confirm_data: input.confirmData,
      confirm_review: input.confirmReview,
    };

    try {
      const data = await PartnerRepository.create(params);
      return { success: true, data };
    } catch (error) {
      if (isUsernameTakenError(error)) {
        return {
          success: false,
          code: "USERNAME_TAKEN",
          error: "Username sudah dipakai",
        };
      }
      if (isEmailTakenError(error)) {
        // Cari tipe partner yang SUDAH memakai email ini supaya pesan
        // error menyebut tipe yang sudah terdaftar (Reseller/Dropshipper),
        // bukan tipe yang sedang didaftarkan. Lookup ini jaring pengaman:
        // bila query gagal atau race condition membuat row hilang di
        // antaranya, tetap kembalikan pesan generik — jangan sampai
        // melempar error baru.
        let existingType: PartnerType | null = null;
        try {
          const existing = await PartnerRepository.findByEmail(params.email);
          existingType = existing?.partner_type ?? null;
        } catch {
          existingType = null;
        }
        const typeLabel =
          existingType === "reseller"
            ? "Reseller"
            : existingType === "dropshipper"
              ? "Dropshipper"
              : null;
        return {
          success: false,
          code: "EMAIL_TAKEN",
          error: typeLabel
            ? `Email sudah terdaftar sebagai ${typeLabel}`
            : "Email sudah terdaftar sebagai partner",
        };
      }
      throw error;
    }
  },

  async list(status?: PartnerStatus): Promise<PartnerRow[]> {
    return PartnerRepository.findAll(status);
  },

  /**
   * Approve: PENDING_REVIEW / REJECTED -> the ACTIVE status that matches
   * the partner's type (reseller -> RESELLER_ACTIVE,
   * dropshipper -> DROPSHIPPER_ACTIVE), stamping reviewed_at/reviewed_by.
   */
  async approve(id: string, reviewedBy: string): Promise<PartnerActionResult> {
    const existing = await PartnerRepository.findById(id);
    if (!existing) {
      return { success: false, code: "NOT_FOUND", error: "Partner tidak ditemukan" };
    }

    if (existing.status !== "PENDING_REVIEW" && existing.status !== "REJECTED") {
      return {
        success: false,
        error: `Hanya partner berstatus PENDING_REVIEW atau REJECTED yang bisa di-approve (saat ini: ${existing.status})`,
      };
    }

    const status: PartnerStatus =
      existing.partner_type === "reseller" ? "RESELLER_ACTIVE" : "DROPSHIPPER_ACTIVE";

    const data = await PartnerRepository.updateStatus(id, {
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewedBy,
    });
    return { success: true, data };
  },

  async reject(id: string, reviewedBy: string): Promise<PartnerActionResult> {
    const existing = await PartnerRepository.findById(id);
    if (!existing) {
      return { success: false, code: "NOT_FOUND", error: "Partner tidak ditemukan" };
    }

    if (existing.status === "REJECTED") {
      return { success: false, error: "Partner sudah berstatus REJECTED" };
    }

    const data = await PartnerRepository.updateStatus(id, {
      status: "REJECTED",
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewedBy,
    });
    return { success: true, data };
  },
};
