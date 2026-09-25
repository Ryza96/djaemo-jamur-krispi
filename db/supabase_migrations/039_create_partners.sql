-- =============================================================
-- Migration 039: partners (reseller / dropshipper) — Fase 1
-- =============================================================
-- Creates the `partners` table for the partner program (registration
-- + admin approval) and links orders to partners.
--
-- DESIGN DECISIONS:
--   - Status enum is synced with the frontend PartnerStatus type in
--     components/partner/PartnerAuthProvider.tsx: PENDING_REVIEW,
--     RESELLER_ACTIVE, DROPSHIPPER_ACTIVE, REJECTED, SUSPENDED.
--   - partner_type stores the program type ('reseller' | 'dropshipper');
--     after approval the ACTIVE status value mirrors partner_type.
--   - Auth = username + password (bcrypt hash), mirroring the admin
--     pattern (custom session cookie HMAC) — NOT Supabase Auth.
--     Login/dashboard for partners arrive in Fase 2; Phase 1 only
--     writes credentials at registration.
--   - ktp_photo / selfie_photo are nullable TEXT columns reserved for
--     identity data. The current ResellerRegistrationForm does NOT
--     collect them (selfie capture exists only in the generic
--     /partner/register form via LiveSelfieCapture, which emits a
--     data:image/jpeg data-URL). Fase 2 decides storage (inline
--     data-URL vs storage bucket upload).
--   - address is nullable: not collected by the current reseller form.
--   - sales_channels / links / sales_plan / confirm_* mirror the exact
--     fields submitted by ResellerRegistrationForm so no collected
--     field is lost.
--   - orders.partner_id is nullable: existing orders stay NULL. Used
--     later for partner order history / commission reporting.
--   - RLS enabled with NO policy + REVOKE (server/service_role only,
--     same pattern as admin_login_attempts 025 and
--     contact_submissions 034).
--   - Idempotent (IF NOT EXISTS everywhere): runnable on any env.
-- =============================================================

CREATE TABLE IF NOT EXISTS partners (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_type   TEXT NOT NULL
                   CHECK (partner_type IN ('reseller', 'dropshipper')),
  username       TEXT NOT NULL,
  password_hash  TEXT NOT NULL,
  full_name      TEXT NOT NULL,
  phone          TEXT NOT NULL,
  email          TEXT,
  address        TEXT,
  status         TEXT NOT NULL DEFAULT 'PENDING_REVIEW'
                   CHECK (status IN (
                     'PENDING_REVIEW',
                     'RESELLER_ACTIVE',
                     'DROPSHIPPER_ACTIVE',
                     'REJECTED',
                     'SUSPENDED'
                   )),
  -- JSON array of sales channels submitted at registration
  -- (e.g. ["Marketplace","Media Sosial"]).
  sales_channels JSONB,
  links          TEXT,
  sales_plan     TEXT,
  ktp_photo      TEXT,
  selfie_photo   TEXT,
  confirm_data   BOOLEAN NOT NULL DEFAULT FALSE,
  confirm_review BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at    TIMESTAMPTZ,
  reviewed_by    TEXT
);

-- Login lookup + uniqueness (Fase 2 login also queries by username).
CREATE UNIQUE INDEX IF NOT EXISTS idx_partners_username
  ON partners (username);

-- Admin review list: filter by status.
CREATE INDEX IF NOT EXISTS idx_partners_status
  ON partners (status);

-- RLS on, but NO policy: only the service_role (server) can access.
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

-- Defense-in-depth (matches migration 025/034): no client access.
REVOKE ALL ON partners FROM authenticated, anon;

-- =============================================================
-- ORDERS: nullable link to the partner who placed the order.
-- =============================================================
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES partners(id);

CREATE INDEX IF NOT EXISTS idx_orders_partner_id
  ON orders (partner_id);
