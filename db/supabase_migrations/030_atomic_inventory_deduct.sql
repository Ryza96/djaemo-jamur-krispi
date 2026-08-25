-- =============================================================
-- Migration 030: Atomic Inventory RPCs (TOCTOU fix)
-- =============================================================
-- Supersedes the core of Migration 022.
--
-- PROBLEM (audit §2.2):
--   _apply_stock_change read products.stock with a bare SELECT and then
--   performed the sufficiency check + UPDATE as separate statements.
--   Two concurrent deducts could both observe sufficient stock and both
--   succeed, driving stock negative (TOCTOU race).
--
-- FIX:
--   Move the sufficiency guard INTO the UPDATE statement:
--     UPDATE products SET stock = stock - p_quantity
--     WHERE id = p_product_id AND stock >= p_quantity
--   PostgreSQL takes a row lock for the duration of the UPDATE, so
--   concurrent mutations of the same product row serialize. A caller that
--   loses the race matches 0 rows and gets INSUFFICIENT_STOCK instead of
--   corrupting the balance.
--
-- COMPATIBILITY:
--   - Function signatures are unchanged (drop-in replacement).
--   - Error codes/messages are unchanged so repository error mapping
--     (INSUFFICIENT_STOCK / PRODUCT_NOT_FOUND / INVALID_*) keeps working.
--   - Public wrappers inventory_deduct / inventory_restore /
--     inventory_adjust are unchanged; they delegate to this core.
--   - stock_movements CHECK (new_stock = previous_stock + delta) holds by
--     construction: previous_stock is derived from the returned new_stock.
-- =============================================================

BEGIN;

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
  -- 1. Validate operation
  IF p_operation NOT IN ('deduct', 'restore', 'adjust') THEN
    RAISE EXCEPTION 'INVALID_OPERATION: %', p_operation;
  END IF;

  -- 2. Validate quantity
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

  -- 3. Calculate delta based on operation
  CASE p_operation
    WHEN 'deduct' THEN
      v_delta := -1 * p_quantity;
    WHEN 'restore' THEN
      v_delta := p_quantity;
    WHEN 'adjust' THEN
      v_delta := p_quantity;  -- signed: positive adds, negative reduces
  END CASE;

  -- 4. Update products.stock ATOMICALLY.
  --    The sufficiency predicate lives inside the UPDATE: the row lock held
  --    by the UPDATE guarantees the check-and-write is indivisible.
  CASE p_operation
    WHEN 'deduct' THEN
      UPDATE products
      SET stock = stock - p_quantity
      WHERE id = p_product_id
        AND stock >= p_quantity
      RETURNING stock INTO v_new_stock;

      IF NOT FOUND THEN
        -- Distinguish "no such product" from "not enough stock".
        -- This SELECT runs only on the failure path; the rejection itself
        -- was already decided atomically by the UPDATE above.
        SELECT stock INTO v_current_stock
        FROM products
        WHERE id = p_product_id;

        IF NOT FOUND THEN
          RAISE EXCEPTION 'PRODUCT_NOT_FOUND';
        END IF;

        RAISE EXCEPTION 'INSUFFICIENT_STOCK: available %, requested %',
          v_current_stock, p_quantity;
      END IF;

    WHEN 'restore' THEN
      UPDATE products
      SET stock = stock + p_quantity
      WHERE id = p_product_id
      RETURNING stock INTO v_new_stock;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'PRODUCT_NOT_FOUND';
      END IF;

    ELSE
      -- 'adjust': signed delta
      IF v_delta > 0 THEN
        UPDATE products
        SET stock = stock + v_delta
        WHERE id = p_product_id
        RETURNING stock INTO v_new_stock;

        IF NOT FOUND THEN
          RAISE EXCEPTION 'PRODUCT_NOT_FOUND';
        END IF;
      ELSE
        UPDATE products
        SET stock = stock + v_delta
        WHERE id = p_product_id
          AND stock >= ABS(v_delta)
        RETURNING stock INTO v_new_stock;

        IF NOT FOUND THEN
          SELECT stock INTO v_current_stock
          FROM products
          WHERE id = p_product_id;

          IF NOT FOUND THEN
            RAISE EXCEPTION 'PRODUCT_NOT_FOUND';
          END IF;

          RAISE EXCEPTION 'INSUFFICIENT_STOCK: available %, requested %',
            v_current_stock, ABS(v_delta);
        END IF;
      END IF;
  END CASE;

  -- 5. Insert stock_movements (same transaction as the UPDATE)
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
    v_new_stock - v_delta,  -- derived: guarantees CHECK consistency
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

  -- 6. Return result
  RETURN jsonb_build_object(
    'movement_id',    v_movement_id,
    'previous_stock', v_new_stock - v_delta,
    'new_stock',      v_new_stock
  );
END;
$$;

COMMIT;
