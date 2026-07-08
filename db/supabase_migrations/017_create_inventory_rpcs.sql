-- =============================================================
-- Migration 017: Create inventory RPC functions
-- =============================================================
-- Provides atomic stock operations used by InventoryRepository.
--
-- ARCHITECTURE DECISION:
--   Deduct MUST be a single atomic operation — no read-before-write.
--   UPDATE with WHERE stock >= quantity ensures the operation
--   only succeeds when stock is sufficient, in one round-trip.
-- =============================================================

-- Atomically deduct stock (single atomic UPDATE, no read-before-write).
-- Raises PRODUCT_NOT_FOUND or INSUFFICIENT_STOCK on failure.
CREATE OR REPLACE FUNCTION deduct_product_stock(
  p_product_id UUID,
  p_quantity INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_new_stock INTEGER;
BEGIN
  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'INVALID_QUANTITY';
  END IF;

  UPDATE products
  SET stock = stock - p_quantity
  WHERE id = p_product_id
    AND stock >= p_quantity
  RETURNING stock INTO v_new_stock;

  IF NOT FOUND THEN
    PERFORM 1 FROM products WHERE id = p_product_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'PRODUCT_NOT_FOUND';
    ELSE
      RAISE EXCEPTION 'INSUFFICIENT_STOCK';
    END IF;
  END IF;

  RETURN v_new_stock;
END;
$$;

-- Atomically restore (add) stock (single atomic UPDATE, no read-before-write).
-- Raises PRODUCT_NOT_FOUND if product does not exist.
CREATE OR REPLACE FUNCTION restore_product_stock(
  p_product_id UUID,
  p_quantity INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_new_stock INTEGER;
BEGIN
  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'INVALID_QUANTITY';
  END IF;

  UPDATE products
  SET stock = stock + p_quantity
  WHERE id = p_product_id
  RETURNING stock INTO v_new_stock;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PRODUCT_NOT_FOUND';
  END IF;

  RETURN v_new_stock;
END;
$$;
