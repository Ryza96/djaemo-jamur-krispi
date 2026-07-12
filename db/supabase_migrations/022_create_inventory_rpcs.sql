-- =============================================================
-- Migration 022: Inventory RPC — Public Wrapper + Private Core
-- =============================================================
-- Implements OPTION C architecture (PR-3A Addendum, FINAL APPROVED).
-- ADR-001 compliant.
--
-- ARCHITECTURE:
--   Public API:  inventory_deduct, inventory_restore, inventory_adjust
--   Core:        _apply_stock_change (internal, not for direct call)
--
-- PATTERN:
--   Public Wrapper -> Private Core Function
--   Wrapper: parameter validation, defaults, delegation
--   Core:    business logic, UPDATE, INSERT, RETURN JSONB
--
-- ATOMICITY:
--   Core function runs in single PostgreSQL transaction.
--   UPDATE products.stock + INSERT stock_movements = atomic.
--
-- RETURN:
--   JSONB { movement_id, previous_stock, new_stock }
--
-- ERRORS:
--   PRODUCT_NOT_FOUND, INSUFFICIENT_STOCK, INVALID_QUANTITY, INVALID_OPERATION
--
-- ADR-001 COMPLIANCE:
--   - p_product_id TEXT (matches products.id TEXT, migration 001)
--   - p_order_id UUID (matches orders.id UUID, production schema)
--   - p_quantity consistent across core and wrappers
--   - inventory_adjust accepts signed delta (ADR-001 Decision 1)
-- =============================================================

BEGIN;

-- =============================================================
-- 1. CORE FUNCTION (internal)
-- =============================================================
-- Handles all stock mutations atomically.
-- NOT for direct call — use public wrappers instead.

CREATE OR REPLACE FUNCTION _apply_stock_change(
  p_product_id      TEXT,
  p_operation       TEXT,         -- 'deduct', 'restore', 'adjust'
  p_quantity        INTEGER,      -- deduct/restore: positive; adjust: signed
  p_reason          TEXT,
  p_order_id        UUID    DEFAULT NULL,
  p_actor_type      TEXT    DEFAULT 'system',
  p_actor_id        TEXT    DEFAULT NULL,
  p_reference_id    TEXT    DEFAULT NULL,
  p_idempotency_key TEXT    DEFAULT NULL,
  p_correlation_id  TEXT    DEFAULT NULL,
  p_metadata        JSONB   DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_stock INTEGER;
  v_delta         INTEGER;
  v_new_stock     INTEGER;
  v_movement_id   UUID;
BEGIN
  -- 1. Validate product exists
  SELECT stock INTO v_current_stock
  FROM products
  WHERE id = p_product_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PRODUCT_NOT_FOUND';
  END IF;

  -- 2. Validate operation
  IF p_operation NOT IN ('deduct', 'restore', 'adjust') THEN
    RAISE EXCEPTION 'INVALID_OPERATION: %', p_operation;
  END IF;

  -- 3. Validate quantity
  IF p_quantity IS NULL THEN
    RAISE EXCEPTION 'INVALID_QUANTITY: quantity must not be null';
  END IF;

  IF p_quantity = 0 THEN
    RAISE EXCEPTION 'INVALID_QUANTITY: quantity must not be zero';
  END IF;

  -- deduct/restore: quantity must be positive
  -- adjust: quantity can be signed (positive or negative)
  IF p_operation IN ('deduct', 'restore') AND p_quantity < 0 THEN
    RAISE EXCEPTION 'INVALID_QUANTITY: quantity must be positive for %', p_operation;
  END IF;

  -- 4. Calculate delta based on operation
  CASE p_operation
    WHEN 'deduct' THEN
      v_delta := -1 * p_quantity;
      -- Stock sufficiency check
      IF v_current_stock < p_quantity THEN
        RAISE EXCEPTION 'INSUFFICIENT_STOCK: available %, requested %',
          v_current_stock, p_quantity;
      END IF;
    WHEN 'restore' THEN
      v_delta := p_quantity;
    WHEN 'adjust' THEN
      v_delta := p_quantity;  -- signed: positive adds, negative reduces
      -- For adjust with negative delta, check sufficiency
      IF v_delta < 0 AND v_current_stock < ABS(v_delta) THEN
        RAISE EXCEPTION 'INSUFFICIENT_STOCK: available %, requested %',
          v_current_stock, ABS(v_delta);
      END IF;
  END CASE;

  -- 5. Update products.stock
  UPDATE products
  SET stock = stock + v_delta
  WHERE id = p_product_id
  RETURNING stock INTO v_new_stock;

  -- 6. Insert stock_movements
  INSERT INTO stock_movements (
    product_id,
    order_id,
    delta,
    previous_stock,
    new_stock,
    reason,
    actor_type,
    actor_id,
    reference_id,
    idempotency_key,
    correlation_id,
    metadata
  ) VALUES (
    p_product_id,
    p_order_id,
    v_delta,
    v_current_stock,
    v_new_stock,
    p_reason,
    p_actor_type,
    p_actor_id,
    p_reference_id,
    p_idempotency_key,
    p_correlation_id,
    p_metadata
  )
  RETURNING id INTO v_movement_id;

  -- 7. Return result
  RETURN jsonb_build_object(
    'movement_id',    v_movement_id,
    'previous_stock', v_current_stock,
    'new_stock',      v_new_stock
  );
END;
$$;

-- =============================================================
-- 2. PUBLIC WRAPPERS
-- =============================================================

-- inventory_deduct
-- Deducts stock for an order.
-- Wrapper validates required params, delegates to core.

CREATE OR REPLACE FUNCTION inventory_deduct(
  p_product_id      TEXT,
  p_quantity        INTEGER,
  p_reason          TEXT,
  p_order_id        UUID    DEFAULT NULL,
  p_actor_type      TEXT    DEFAULT 'system',
  p_actor_id        TEXT    DEFAULT NULL,
  p_reference_id    TEXT    DEFAULT NULL,
  p_idempotency_key TEXT    DEFAULT NULL,
  p_correlation_id  TEXT    DEFAULT NULL,
  p_metadata        JSONB   DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_product_id IS NULL THEN
    RAISE EXCEPTION 'PRODUCT_ID_REQUIRED';
  END IF;

  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'INVALID_QUANTITY: must be positive integer';
  END IF;

  IF p_reason IS NULL THEN
    RAISE EXCEPTION 'REASON_REQUIRED';
  END IF;

  RETURN _apply_stock_change(
    p_product_id,
    'deduct',
    p_quantity,
    p_reason,
    p_order_id,
    p_actor_type,
    p_actor_id,
    p_reference_id,
    p_idempotency_key,
    p_correlation_id,
    p_metadata
  );
END;
$$;

-- inventory_restore
-- Restores stock (e.g., on order cancellation).
-- Wrapper validates required params, delegates to core.

CREATE OR REPLACE FUNCTION inventory_restore(
  p_product_id      TEXT,
  p_quantity        INTEGER,
  p_reason          TEXT,
  p_order_id        UUID    DEFAULT NULL,
  p_actor_type      TEXT    DEFAULT 'system',
  p_actor_id        TEXT    DEFAULT NULL,
  p_reference_id    TEXT    DEFAULT NULL,
  p_idempotency_key TEXT    DEFAULT NULL,
  p_correlation_id  TEXT    DEFAULT NULL,
  p_metadata        JSONB   DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_product_id IS NULL THEN
    RAISE EXCEPTION 'PRODUCT_ID_REQUIRED';
  END IF;

  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'INVALID_QUANTITY: must be positive integer';
  END IF;

  IF p_reason IS NULL THEN
    RAISE EXCEPTION 'REASON_REQUIRED';
  END IF;

  RETURN _apply_stock_change(
    p_product_id,
    'restore',
    p_quantity,
    p_reason,
    p_order_id,
    p_actor_type,
    p_actor_id,
    p_reference_id,
    p_idempotency_key,
    p_correlation_id,
    p_metadata
  );
END;
$$;

-- inventory_adjust
-- Manual stock adjustment by admin.
-- Accepts signed delta: positive adds, negative reduces.
-- ADR-001 Decision 1: adjust is signed.

CREATE OR REPLACE FUNCTION inventory_adjust(
  p_product_id      TEXT,
  p_quantity        INTEGER,
  p_reason          TEXT,
  p_order_id        UUID    DEFAULT NULL,
  p_actor_type      TEXT    DEFAULT 'admin',
  p_actor_id        TEXT    DEFAULT NULL,
  p_reference_id    TEXT    DEFAULT NULL,
  p_idempotency_key TEXT    DEFAULT NULL,
  p_correlation_id  TEXT    DEFAULT NULL,
  p_metadata        JSONB   DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_product_id IS NULL THEN
    RAISE EXCEPTION 'PRODUCT_ID_REQUIRED';
  END IF;

  IF p_quantity IS NULL OR p_quantity = 0 THEN
    RAISE EXCEPTION 'INVALID_QUANTITY: must be non-zero integer';
  END IF;

  IF p_reason IS NULL THEN
    RAISE EXCEPTION 'REASON_REQUIRED';
  END IF;

  RETURN _apply_stock_change(
    p_product_id,
    'adjust',
    p_quantity,
    p_reason,
    p_order_id,
    p_actor_type,
    p_actor_id,
    p_reference_id,
    p_idempotency_key,
    p_correlation_id,
    p_metadata
  );
END;
$$;

COMMIT;
