-- =============================================================
-- Migration 033: Voucher (kode promo) domain — checkout discount
-- =============================================================
-- Adds a `vouchers` table for order-level percentage discounts that
-- customers apply at checkout via a code, plus snapshot columns on
-- `orders` for reporting/audit.
--
-- Scope (agreed business rules):
--   - Percentage discount only (discount_percent, 1..100), applied to
--     the order SUBTOTAL.
--   - Optional minimum subtotal to be eligible (min_purchase_amount;
--     0 = no minimum).
--   - Optional total usage cap (max_uses; NULL = unlimited) tracked by
--     an atomic current_uses counter.
--   - Optional validity window (valid_from / valid_until).
--   - Admin toggle is_active to enable/disable without deleting.
--
-- Architecture (mirrors 026/030 decisions):
--   1. Service layer = Source of Truth for business rules.
--   2. Database = Safety Net: applies the LIMIT check + increments
--      current_uses ATOMICALLY inside one RPC transaction to prevent
--      TOCTOU races (many customers redeeming the same code at once).
--   3. Order Domain stores a snapshot (voucher_code,
--      voucher_discount_percent, discount_amount) so the price at time
--      of purchase is preserved for reporting.
-- =============================================================

-- =============================================================
-- VOUCHERS TABLE
-- =============================================================
CREATE TABLE IF NOT EXISTS vouchers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code                TEXT NOT NULL UNIQUE,
  name                TEXT NOT NULL,
  discount_percent    INTEGER NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
  min_purchase_amount BIGINT NOT NULL DEFAULT 0 CHECK (min_purchase_amount >= 0),
  max_uses            INTEGER CHECK (max_uses IS NULL OR max_uses > 0),
  current_uses        INTEGER NOT NULL DEFAULT 0 CHECK (current_uses >= 0),
  valid_from          TIMESTAMPTZ NOT NULL,
  valid_until         TIMESTAMPTZ NOT NULL,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vouchers_code ON vouchers (code);
CREATE INDEX IF NOT EXISTS idx_vouchers_validity ON vouchers (valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_vouchers_is_active ON vouchers (is_active);

-- =============================================================
-- ORDERS SNAPSHOT COLUMNS (for audit / reporting)
-- =============================================================
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS voucher_code TEXT,
  ADD COLUMN IF NOT EXISTS voucher_discount_percent INTEGER,
  ADD COLUMN IF NOT EXISTS discount_amount BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS voucher_usage_released BOOLEAN NOT NULL DEFAULT FALSE;

-- =============================================================
-- ROW LEVEL SECURITY
--   Frontend MUST NOT talk to vouchers directly. Server uses the
--   service role (bypasses RLS). No public SELECT policy.
-- =============================================================
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;

-- =============================================================
-- APPLY VOUCHER (ATOMIC, TOCTOU-SAFE)
--
-- Called by the server right before persisting a discounted order.
-- Validates a voucher and, if valid, reserves a usage INCREMENTALLY in
-- the same transaction.
--
-- Race-condition safety:
--   SELECT ... FOR UPDATE locks the voucher row for the duration of the
--   transaction, so concurrent redemptions of the same code serialize.
--   The subsequent UPDATE re-checks (max_uses IS NULL OR current_uses <
--   max_uses) under that lock, and the lock guarantees check+increment
--   are indivisible. A loser matches 0 rows and gets VOUCHER_LIMIT_REACHED
--   instead of overshooting the cap.
-- =============================================================
CREATE OR REPLACE FUNCTION apply_voucher(
  p_code     TEXT,
  p_subtotal BIGINT
) RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_row       vouchers%ROWTYPE;
  v_discount  BIGINT;
  v_remaining INTEGER;
BEGIN
  -- Lock the voucher row so concurrent calls serialize.
  SELECT * INTO v_row
  FROM vouchers
  WHERE code = p_code
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'VOUCHER_NOT_FOUND';
  END IF;

  -- Active toggle
  IF NOT v_row.is_active THEN
    RAISE EXCEPTION 'VOUCHER_INACTIVE';
  END IF;

  -- Validity window
  IF now() < v_row.valid_from OR now() > v_row.valid_until THEN
    RAISE EXCEPTION 'VOUCHER_EXPIRED';
  END IF;

  -- Minimum purchase
  IF p_subtotal < v_row.min_purchase_amount THEN
    RAISE EXCEPTION 'VOUCHER_MIN_PURCHASE: minimum %', v_row.min_purchase_amount;
  END IF;

  -- Usage cap check + atomic increment under the row lock.
  UPDATE vouchers
  SET current_uses = current_uses + 1,
      updated_at   = now()
  WHERE id = v_row.id
    AND (max_uses IS NULL OR current_uses < max_uses)
  RETURNING current_uses INTO v_row.current_uses;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'VOUCHER_LIMIT_REACHED';
  END IF;

  v_discount := ROUND(p_subtotal * v_row.discount_percent / 100.0);

  IF v_row.max_uses IS NULL THEN
    v_remaining := NULL;
  ELSE
    v_remaining := GREATEST(v_row.max_uses - v_row.current_uses, 0);
  END IF;

  RETURN jsonb_build_object(
    'voucher_id',         v_row.id,
    'code',               v_row.code,
    'name',               v_row.name,
    'discount_percent',   v_row.discount_percent,
    'discount_amount',    v_discount,
    'remaining_uses',     v_remaining
  );
END;
$$;

-- =============================================================
-- PREVIEW VOUCHER (NON-DESTRUCTIVE)
-- Validates a voucher WITHOUT incrementing current_uses. Used by the
-- real-time checkout validation endpoint so the customer can see the
-- discount before submitting. Authoritative check still happens in
-- apply_voucher at order creation.
-- =============================================================
CREATE OR REPLACE FUNCTION preview_voucher(
  p_code     TEXT,
  p_subtotal BIGINT
) RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_row       vouchers%ROWTYPE;
  v_discount  BIGINT;
  v_remaining INTEGER;
BEGIN
  SELECT * INTO v_row
  FROM vouchers
  WHERE code = p_code;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'VOUCHER_NOT_FOUND';
  END IF;

  IF NOT v_row.is_active THEN
    RAISE EXCEPTION 'VOUCHER_INACTIVE';
  END IF;

  IF now() < v_row.valid_from OR now() > v_row.valid_until THEN
    RAISE EXCEPTION 'VOUCHER_EXPIRED';
  END IF;

  IF p_subtotal < v_row.min_purchase_amount THEN
    RAISE EXCEPTION 'VOUCHER_MIN_PURCHASE: minimum %', v_row.min_purchase_amount;
  END IF;

  IF v_row.max_uses IS NOT NULL AND v_row.current_uses >= v_row.max_uses THEN
    RAISE EXCEPTION 'VOUCHER_LIMIT_REACHED';
  END IF;

  v_discount := ROUND(p_subtotal * v_row.discount_percent / 100.0);

  IF v_row.max_uses IS NULL THEN
    v_remaining := NULL;
  ELSE
    v_remaining := GREATEST(v_row.max_uses - v_row.current_uses, 0);
  END IF;

  RETURN jsonb_build_object(
    'voucher_id',         v_row.id,
    'code',               v_row.code,
    'name',               v_row.name,
    'discount_percent',   v_row.discount_percent,
    'discount_amount',    v_discount,
    'remaining_uses',     v_remaining
  );
END;
$$;


-- =============================================================
-- RELEASE VOUCHER USAGE (ATOMIC, IDEMPOTENT)
--
-- Called when an order is CANCELLED / EXPIRED / FAILED before it
-- ever completed (delivered). Usage was already reserved in
-- apply_voucher at draft-creation time, so we give the single slot
-- back to the voucher by decrementing current_uses (floored at 0).
--
-- Idempotency / race-safety:
--   - The ORDER row is locked with SELECT ... FOR UPDATE, and the
--     `voucher_usage_released` flag is READ and SET under that lock.
--     Concurrent release attempts (e.g. admin cancel racing a Midtrans
--     expire webhook) serialize on the order lock, so the slot is
--     returned AT MOST ONCE per order. Lost racers see
--     `ALREADY_RELEASED` and do nothing.
--   - Only decrements when voucher_code IS NOT NULL AND the flag is
--     still FALSE AND the order is not in a success-terminal state.
--   - GREATEST(current_uses - 1, 0) floors the counter so it can never
--     go negative.
--
-- KNOWN LIMITATION (accepted business decision, NOT a bug):
--   If an order whose voucher_usage_released is already TRUE is later
--   RECOVERED to a success/completed state (customer pays after an admin
--   cancel or an auto-expire), this release is NOT reversed: the quota slot
--   is not pulled back, so the voucher may overshoot its cap by at most
--   1 slot per such event. Re-applying quota on recovery is intentionally
--   NOT implemented here (low probability, low impact). For visibility this
--   edge case is surfaced via a single audit log event at the recovery site
--   (see VOUCHER_USAGE_RELEASED_ON_RECOVERY in order.service.ts).
-- =============================================================
CREATE OR REPLACE FUNCTION release_voucher_usage(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_order orders%ROWTYPE;
BEGIN
  -- Lock the order row so concurrent releases serialize.
  SELECT * INTO v_order
  FROM orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'released', FALSE, 'reason', 'ORDER_NOT_FOUND', 'voucher_code', NULL
    );
  END IF;

  -- Safety: an order that reached DELIVERED must never release usage.
  IF (v_order.fulfillment_status IS NOT NULL AND
      lower(v_order.fulfillment_status) = 'delivered') THEN
    RETURN jsonb_build_object(
      'released', FALSE, 'reason', 'ORDER_COMPLETED',
      'voucher_code', v_order.voucher_code
    );
  END IF;

  -- No voucher used, or already released -> idempotent no-op.
  IF v_order.voucher_code IS NULL OR v_order.voucher_usage_released THEN
    RETURN jsonb_build_object(
      'released', FALSE,
      'reason', CASE WHEN v_order.voucher_code IS NULL
                     THEN 'NO_VOUCHER' ELSE 'ALREADY_RELEASED' END,
      'voucher_code', v_order.voucher_code
    );
  END IF;

  -- Return exactly one usage slot (floor at 0, never negative).
  UPDATE vouchers
     SET current_uses = GREATEST(current_uses - 1, 0),
         updated_at   = now()
   WHERE code = v_order.voucher_code;

  -- Mark released under the same lock so future calls are no-ops.
  UPDATE orders
     SET voucher_usage_released = TRUE
   WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'released', TRUE, 'reason', 'OK', 'voucher_code', v_order.voucher_code
  );
END;
$$;
