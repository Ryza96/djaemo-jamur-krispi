import { supabase } from "@/lib/supabase";
import type { PartnerStatus } from "@/components/partner/PartnerAuthProvider";

export type PartnerType = "reseller" | "dropshipper";

/**
 * Public columns selected on every read. `password_hash` is NEVER
 * selected or returned — it is only written at registration and will be
 * read later by the Fase 2 login flow via a dedicated query.
 */
// Must be a single string literal (not concatenation): supabase-js can
// only parse literal select-strings; a plain `string` type falls back to
// GenericStringError and the row cast below would be rejected by TS.
const PARTNER_PUBLIC_COLUMNS =
  "id, partner_type, username, full_name, phone, email, address, status, sales_channels, links, sales_plan, ktp_photo, selfie_photo, confirm_data, confirm_review, created_at, updated_at, reviewed_at, reviewed_by";

export interface PartnerRow {
  id: string;
  partner_type: PartnerType;
  username: string;
  full_name: string;
  phone: string;
  email: string | null;
  address: string | null;
  status: PartnerStatus;
  sales_channels: string[] | null;
  links: string | null;
  sales_plan: string | null;
  ktp_photo: string | null;
  selfie_photo: string | null;
  confirm_data: boolean;
  confirm_review: boolean;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export interface CreatePartnerParams {
  partner_type: PartnerType;
  username: string;
  password_hash: string;
  full_name: string;
  phone: string;
  email: string;
  sales_channels: string[];
  links: string | null;
  sales_plan: string;
  confirm_data: boolean;
  confirm_review: boolean;
}

export const PartnerRepository = {
  async create(params: CreatePartnerParams): Promise<PartnerRow> {
    const { data, error } = await supabase
      .from("partners")
      .insert({
        ...params,
        status: "PENDING_REVIEW",
      })
      .select(PARTNER_PUBLIC_COLUMNS)
      .single();

    if (error) throw error;
    return data as PartnerRow;
  },

  async findAll(status?: PartnerStatus): Promise<PartnerRow[]> {
    let query = supabase
      .from("partners")
      .select(PARTNER_PUBLIC_COLUMNS)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as PartnerRow[];
  },

  async findById(id: string): Promise<PartnerRow | null> {
    const { data, error } = await supabase
      .from("partners")
      .select(PARTNER_PUBLIC_COLUMNS)
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return (data ?? null) as PartnerRow | null;
  },

  /**
   * Case-insensitive email lookup: implements WHERE LOWER(email) =
   * LOWER($1), semantik yang sama dengan unique index
   * idx_partners_email_lower (migration 040).
   *
   * ilike dipakai karena supabase-js tidak mengekspresikan fungsi
   * LOWER() di sisi kolom; karakter metacharacter LIKE (% _ \) yang
   * bisa muncul di email di-escape dulu agar "budi_santoso@x.com"
   * cocok persis, bukan sebagai wildcard.
   */
  async findByEmail(
    email: string,
  ): Promise<{ partner_type: PartnerType; status: PartnerStatus } | null> {
    const escaped = email.replace(/[\\%_]/g, (char) => `\\${char}`);
    const { data, error } = await supabase
      .from("partners")
      .select("partner_type, status")
      .ilike("email", escaped)
      .maybeSingle();

    if (error) throw error;
    return (data ?? null) as {
      partner_type: PartnerType;
      status: PartnerStatus;
    } | null;
  },

  async updateStatus(
    id: string,
    params: {
      status: PartnerStatus;
      reviewed_at: string | null;
      reviewed_by: string | null;
    },
  ): Promise<PartnerRow> {
    const { data, error } = await supabase
      .from("partners")
      .update({
        ...params,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(PARTNER_PUBLIC_COLUMNS)
      .single();

    if (error) throw error;
    return data as PartnerRow;
  },
};
