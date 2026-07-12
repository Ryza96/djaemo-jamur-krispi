-- =============================================================
-- Migration 021: Create stock_movements table
-- =============================================================
-- Immutable audit ledger for all stock changes.
-- Implements Stock Movement Architecture (PR-2A, FINAL APPROVED).
--
-- DESIGN DECISIONS:
--   - UUID PK with gen_random_uuid() (DB-generated, DR-014)
--   - FK to products (required) and orders (nullable, RESTRICT, DR-015)
--   - actor_type + actor_id (DR-016)
--   - CHECK constraints for reason and delta
--   - Trigger-based immutability (DR-017)
--   - REVOKE as defense-in-depth (DR-017)
--   - No RLS (server-only table, accessed via service_role)
--   - idempotency_key reserved, NOT UNIQUE yet (DR-018)
--
-- NOTE: 020 migration planned "VALIDATION in 021 (PR-2)" for
--   orders_fulfillment_status_check. This migration takes slot 021.
--   Validation must be deferred to 022.
-- =============================================================

BEGIN;

-- =============================================================
-- 1. TABLE
-- =============================================================

CREATE TABLE stock_movements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      TEXT NOT NULL
                    REFERENCES products(id),
  order_id        UUID
                    REFERENCES orders(id)
                    ON DELETE RESTRICT,
  delta           INTEGER NOT NULL,
  previous_stock  INTEGER NOT NULL,
  new_stock       INTEGER NOT NULL,
  reason          TEXT NOT NULL,
  actor_type      TEXT NOT NULL,
  actor_id        TEXT,
  reference_id    TEXT,
  idempotency_key TEXT,
  correlation_id  TEXT,
  metadata        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Stock change must be non-zero
  CHECK (delta <> 0),

  -- Ledger integrity: new_stock must equal previous_stock + delta
  CHECK (new_stock = previous_stock + delta),

  -- Reason whitelist (matches MOVEMENT_REASON in types.ts)
  CHECK (reason IN (
    'order_confirm',
    'order_cancel',
    'deduct_rollback',
    'resume_fulfillment',
    'manual_adjust',
    'correction'
  ))
);

-- =============================================================
-- 2. INDEXES
-- =============================================================

-- Most common query: movements per product
CREATE INDEX idx_sm_product_id
  ON stock_movements (product_id);

-- Lookup by order (partial: skip NULL order_id from manual adjusts)
CREATE INDEX idx_sm_order_id
  ON stock_movements (order_id)
  WHERE order_id IS NOT NULL;

-- Time-range queries: recent movements, daily reports
CREATE INDEX idx_sm_created_at
  ON stock_movements (created_at DESC);

-- Composite: "movements for product X, newest first"
CREATE INDEX idx_sm_product_created
  ON stock_movements (product_id, created_at DESC);

-- =============================================================
-- 3. IMMUTABLE LEDGER: TRIGGER
-- =============================================================
-- Rejects any UPDATE or DELETE on stock_movements.
-- Applies to ALL roles including service_role.

CREATE OR REPLACE FUNCTION prevent_stock_movement_modification()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'UPDATE on immutable ledger is forbidden.';
  ELSIF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'DELETE on immutable ledger is forbidden.';
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_stock_movement_immutable
  BEFORE UPDATE OR DELETE ON stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION prevent_stock_movement_modification();

-- =============================================================
-- 4. IMMUTABLE LEDGER: REVOKE (defense-in-depth)
-- =============================================================
-- Removes UPDATE/DELETE permissions from application roles.
-- Belt-and-suspenders with the trigger above.

REVOKE UPDATE, DELETE ON stock_movements FROM authenticated, anon;

COMMIT;
