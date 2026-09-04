-- =============================================================
-- Migration 037: Batch inventory deduction (inventory_deduct_batch)
-- =============================================================
-- Adds an ATOMIC all-or-nothing batch deduction RPC for multi-item
-- order confirmation / fulfillment resume, replacing the old app-level
-- sequential loop (which used a best-effort compensating rollback).
--
-- Includes FIX BM1: adds SELECT ... FOR UPDATE to _apply_stock_change so
-- concurrent single-item mutations of the same product serialize.
--
-- Semantics:
--   - All product rows are locked (SELECT ... FOR UPDATE) BEFORE any
--     deduction begins, so the sufficiency decision uses a consistent
--     snapshot, not per-item sequential reads.
--   - If ANY item has insufficient stock or is not found, the whole
--     transaction rolls back (no partial deduction) and the caller
--     routes the order to WAITING_FOR_RESTOCK.
--   - This matches the OLD behavior, which was effectively all-or-nothing
--     via compensating rollback (rollbackDeduct); the new RPC makes that
--     guarantee truly atomic instead of best-effort.
--
-- Deadlock prevention: items sorted by product_id before locking.
-- =============================================================

BEGIN;

-- =============================================================
-- FIX BM1: Add FOR UPDATE to _apply_stock_change
-- Prevents lost-update race condition on concurrent deductions.
-- The row lock serializes concurrent transactions that touch the
-- same product, so the read-check-write cycle is atomic.
-- =============================================================
CREATE OR REPLACE FUNCTION _apply_stock_change(
  p_product_id      TEXT,
  p_operation       TEXT,
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
DECLARE
  v_current_stock INTEGER;
  v_delta         INTEGER;
  v_new_stock     INTEGER;
  v_movement_id   UUID;
BEGIN
  SELECT stock INTO v_current_stock
  FROM products
  WHERE id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PRODUCT_NOT_FOUND';
  END IF;

  IF p_operation NOT IN ('deduct', 'restore', 'adjust') THEN
    RAISE EXCEPTION 'INVALID_OPERATION: %', p_operation;
  END IF;

  IF p_quantity IS NULL THEN
    RAISE EXCEPTION 'INVALID_QUANTITY: quantity must not be null';
  END IF;

  IF p_quantity = 0 THEN
    RAISE EXCEPTION 'INVALID_QUANTITY: quantity must not be zero';
  END IF;

  IF p_operation IN ('deduct', 'restore') AND p_quantity < 0 THEN
    RAISE EXCEPTION 'INVALID_QUANTITY: quantity must be positive for %', p_operation;
  END IF;

  CASE p_operation
    WHEN 'deduct' THEN
      v_delta := -1 * p_quantity;
      IF v_current_stock < p_quantity THEN
        RAISE EXCEPTION 'INSUFFICIENT_STOCK: available %, requested %',
          v_current_stock, p_quantity;
      END IF;
    WHEN 'restore' THEN
      v_delta := p_quantity;
    WHEN 'adjust' THEN
      v_delta := p_quantity;
      IF v_delta < 0 AND v_current_stock < ABS(v_delta) THEN
        RAISE EXCEPTION 'INSUFFICIENT_STOCK: available %, requested %',
          v_current_stock, ABS(v_delta);
      END IF;
  END CASE;

  UPDATE products
  SET stock = stock + v_delta
  WHERE id = p_product_id
  RETURNING stock INTO v_new_stock;

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

  RETURN jsonb_build_object(
    'movement_id',    v_movement_id,
    'previous_stock', v_current_stock,
    'new_stock',      v_new_stock
  );
END;
$$;

-- =============================================================
-- BATCH DEDUCT (ATOMIC, ALL-OR-NOTHING)
--
-- Deducts stock for multiple order items in a single transaction.
-- All product rows are locked with SELECT ... FOR UPDATE before any
-- validation or deduction begins, ensuring the stock check is based
-- on a consistent snapshot. If ANY item has insufficient stock or
-- is not found, the entire transaction rolls back — no partial
-- deduction, no manual rollback needed.
--
-- Deadlock prevention: items are sorted by product_id before
-- acquiring locks, ensuring all concurrent transactions lock rows
-- in the same order.
--
-- Idempotency: p_idempotency_key is stored in each stock_movements
-- row for audit traceability. The caller should guard against
-- double-processing at the business level (e.g. check
-- fulfillment_status before calling).
--
-- Parameters:
--   p_items   — JSONB array of objects: [{ "productId": "...", "quantity": N }, ...]
--   p_reason  — movement reason (e.g. 'order_confirm', 'resume_fulfillment')
--   p_order_id — optional order UUID for audit trail
--   p_actor_type — defaults to 'system'
--   p_idempotency_key — optional key for audit traceability
--
-- Returns JSONB: { "success": true, "items": [...] } on success,
--   or raises EXCEPTION on any failure (INSUFFICIENT_STOCK / PRODUCT_NOT_FOUND).
-- =============================================================
CREATE OR REPLACE FUNCTION inventory_deduct_batch(
  p_items             JSONB,
  p_reason            TEXT,
  p_order_id          UUID    DEFAULT NULL,
  p_actor_type        TEXT    DEFAULT 'system',
  p_idempotency_key   TEXT    DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_sorted_items JSONB;
  v_item         JSONB;
  v_product_id   TEXT;
  v_quantity     INTEGER;
  v_row          RECORD;
  v_delta        INTEGER;
  v_new_stock    INTEGER;
  v_movement_id  UUID;
  v_result_items JSONB := '[]'::JSONB;
BEGIN
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'ITEMS_REQUIRED';
  END IF;

  IF p_reason IS NULL THEN
    RAISE EXCEPTION 'REASON_REQUIRED';
  END IF;

  -- Deadlock prevention: sort items by product_id so all concurrent
  -- transactions acquire row locks in the same deterministic order.
  SELECT jsonb_agg(item ORDER BY item->>'productId')
  INTO v_sorted_items
  FROM jsonb_array_elements(p_items) AS item;

  -- Phase 1: Validate inputs and lock ALL product rows upfront.
  -- This ensures the stock check and deduction use the same snapshot,
  -- and concurrent transactions serialize on these rows.
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_sorted_items)
  LOOP
    v_product_id := v_item->>'productId';
    IF v_product_id IS NULL THEN
      RAISE EXCEPTION 'PRODUCT_ID_REQUIRED';
    END IF;

    v_quantity := (v_item->>'quantity')::INTEGER;
    IF v_quantity IS NULL OR v_quantity <= 0 THEN
      RAISE EXCEPTION 'INVALID_QUANTITY: must be positive integer';
    END IF;

    SELECT id, stock INTO v_row
    FROM products
    WHERE id = v_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'PRODUCT_NOT_FOUND: %', v_product_id;
    END IF;
  END LOOP;

  -- Phase 2: Validate stock and deduct for each item.
  -- All rows are already locked, so no concurrent modification can occur.
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_sorted_items)
  LOOP
    v_product_id := v_item->>'productId';
    v_quantity   := (v_item->>'quantity')::INTEGER;

    -- Re-read under the lock (already held, this is just a SELECT).
    SELECT id, stock INTO v_row
    FROM products
    WHERE id = v_product_id;

    IF v_row.stock < v_quantity THEN
      RAISE EXCEPTION 'INSUFFICIENT_STOCK: product % has %, requested %',
        v_product_id, v_row.stock, v_quantity;
    END IF;

    v_delta := -1 * v_quantity;

    UPDATE products
    SET stock = stock + v_delta
    WHERE id = v_product_id
    RETURNING stock INTO v_new_stock;

    INSERT INTO stock_movements (
      product_id, order_id, delta, previous_stock, new_stock,
      reason, actor_type, idempotency_key
    ) VALUES (
      v_product_id, p_order_id, v_delta, v_row.stock, v_new_stock,
      p_reason, p_actor_type, p_idempotency_key
    )
    RETURNING id INTO v_movement_id;

    v_result_items := v_result_items || jsonb_build_object(
      'productId',  v_product_id,
      'deducted',   v_quantity,
      'newStock',   v_new_stock
    );
  END LOOP;

  RETURN jsonb_build_object(
    'success', TRUE,
    'items',   v_result_items
  );
END;
$$;

COMMIT;
