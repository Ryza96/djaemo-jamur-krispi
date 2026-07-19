-- =============================================================
-- Migration 027: Atomic Promo Update via RPC
-- =============================================================
-- Architecture Decision:
--   1. Edit Promo = Atomic Operation (single transaction)
--   2. Partial Success = Forbidden
--   3. Old promo_products deleted + new promo_products inserted
--   4. Database = Safety Net Only (structural constraints)
-- =============================================================

CREATE OR REPLACE FUNCTION update_promo_atomic(
  p_promo_id UUID,
  p_name TEXT,
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ,
  p_products JSONB
) RETURNS UUID AS $$
DECLARE
  v_product JSONB;
BEGIN
  UPDATE promos
  SET name = p_name,
      start_date = p_start_date,
      end_date = p_end_date,
      updated_at = NOW()
  WHERE id = p_promo_id
    AND cancelled_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Promo tidak ditemukan atau sudah dibatalkan';
  END IF;

  DELETE FROM promo_products WHERE promo_id = p_promo_id;

  FOR v_product IN SELECT * FROM jsonb_array_elements(p_products)
  LOOP
    INSERT INTO promo_products (promo_id, product_id, promo_price)
    VALUES (
      p_promo_id,
      (v_product->>'product_id')::TEXT,
      (v_product->>'promo_price')::INTEGER
    );
  END LOOP;

  RETURN p_promo_id;
END;
$$ LANGUAGE plpgsql;
