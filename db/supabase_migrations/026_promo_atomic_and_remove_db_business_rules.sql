-- =============================================================
-- Migration 026: Promo Atomicity + Remove DB Business Rules
-- =============================================================
-- Architecture Decision:
--   1. Promo Engine = Source of Truth (business rules)
--   2. Database = Safety Net Only (structural constraints)
--   3. Create Promo = Atomic Operation (single transaction)
--   4. Partial Success = Forbidden
--   5. 1 Domain = 1 Source of Truth Only
--
-- Changes:
--   1. Remove business rule trigger (overlap validation)
--   2. Remove business rule helper functions
--   3. Add atomic promo creation via RPC function
--   4. Keep structural constraints (FK, unique index, RLS)
-- =============================================================

-- =============================================================
-- STEP 1: Remove business rule trigger
-- =============================================================
-- Overlap validation belongs in PromoEngine, not in Database.
-- Database is SAFETY NET ONLY = structural constraints only.
-- =============================================================
DROP TRIGGER IF EXISTS trg_prevent_overlapping_promos ON promo_products;
DROP FUNCTION IF EXISTS prevent_overlapping_promos();

-- =============================================================
-- STEP 2: Remove business rule helper functions
-- =============================================================
-- Business logic belongs in Service/Engine layer.
-- Database helper functions with business rules removed.
-- =============================================================
DROP FUNCTION IF EXISTS has_active_promo(TEXT);
DROP FUNCTION IF EXISTS get_active_promo(TEXT);

-- =============================================================
-- STEP 3: Atomic promo creation via PostgreSQL RPC
-- =============================================================
-- Guarantees:
--   - Create Promo = SUCCESS → Promo exists AND Promo Products exist
--   - Create Promo = FAILED → Promo NOT exist AND Promo Products NOT exist
--   - Partial Success = IMPOSSIBLE
--   - Rollback = AUTOMATIC on any error within the function
--
-- PostgreSQL RPC functions called via Supabase execute within a
-- single transaction context. Any RAISE EXCEPTION triggers ROLLBACK.
-- =============================================================
CREATE OR REPLACE FUNCTION create_promo_atomic(
  p_name TEXT,
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ,
  p_products JSONB
) RETURNS UUID AS $$
DECLARE
  v_promo_id UUID;
  v_product JSONB;
BEGIN
  INSERT INTO promos (name, start_date, end_date)
  VALUES (p_name, p_start_date, p_end_date)
  RETURNING id INTO v_promo_id;

  FOR v_product IN SELECT * FROM jsonb_array_elements(p_products)
  LOOP
    INSERT INTO promo_products (promo_id, product_id, promo_price)
    VALUES (
      v_promo_id,
      (v_product->>'product_id')::TEXT,
      (v_product->>'promo_price')::INTEGER
    );
  END LOOP;

  RETURN v_promo_id;
END;
$$ LANGUAGE plpgsql;
