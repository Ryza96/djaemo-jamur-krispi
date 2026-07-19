-- =============================================================
-- Migration 024: Promo Domain V1 — Database Foundation (FINAL)
-- =============================================================
-- Creates `promos` and `promo_products` tables.
--
-- Architecture:
--   - Frontend CANNOT access promo tables directly.
--   - All access goes through: Service → Repository → Database.
--   - Public RLS is DISABLED (no SELECT policy).
--
-- Business Rules (enforced by DATABASE):
--   1. 1 Promo can have many products.
--   2. 1 Product can only have 1 promo with overlapping dates.
--   3. Promo is active when NOW() BETWEEN start_date AND end_date.
--   4. No is_active column — status is derived from date range.
--   5. Promo MUST NOT change the normal product price.
--   6. Order Domain is Source Of Truth for transaction price.
-- =============================================================

-- =============================================================
-- PROMOS TABLE (Promo header)
-- =============================================================
CREATE TABLE IF NOT EXISTS promos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  start_date    TIMESTAMPTZ NOT NULL,
  end_date      TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- =============================================================
-- PROMO_PRODUCTS TABLE (Promo line items)
-- =============================================================
CREATE TABLE IF NOT EXISTS promo_products (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_id      UUID NOT NULL REFERENCES promos(id) ON DELETE CASCADE,
  product_id    TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  promo_price   INTEGER NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- =============================================================
-- CONSTRAINTS
-- =============================================================

-- Unique constraint: 1 product per promo (no duplicate entries)
CREATE UNIQUE INDEX IF NOT EXISTS idx_promo_products_unique_per_promo
  ON promo_products (promo_id, product_id);

-- Indexes for promo_products lookups
CREATE INDEX IF NOT EXISTS idx_promo_products_promo_id
  ON promo_products (promo_id);

CREATE INDEX IF NOT EXISTS idx_promo_products_product_id
  ON promo_products (product_id);

-- Indexes for promos
CREATE INDEX IF NOT EXISTS idx_promos_date_range
  ON promos (start_date, end_date);

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================
ALTER TABLE promos ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_products ENABLE ROW LEVEL SECURITY;

-- NO public SELECT policy.
-- Frontend must access promo data through Service Layer only.
-- Server-side uses service_role key (bypasses RLS).

-- =============================================================
-- BUSINESS RULE: 1 Product = 1 Active Promo (DATABASE ENFORCED)
-- =============================================================
-- This trigger prevents a product from being assigned to two
-- promos with overlapping date ranges.
--
-- Example REJECTED:
--   Promo A: Balado, 1 Aug - 31 Aug
--   Promo B: Balado, 15 Aug - 30 Aug  ← OVERLAP → REJECTED
--
-- Example ACCEPTED:
--   Promo A: Balado, 1 Aug - 31 Aug
--   Promo B: Balado, 1 Sep - 30 Sep  ← NO OVERLAP → ACCEPTED
-- =============================================================

CREATE OR REPLACE FUNCTION prevent_overlapping_promos()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM promo_products pp
    JOIN promos p_new ON p_new.id = NEW.promo_id
    JOIN promos p_old ON p_old.id = pp.promo_id
    WHERE pp.product_id = NEW.product_id
      AND pp.id != NEW.id
      AND p_new.start_date < p_old.end_date
      AND p_new.end_date > p_old.start_date
  ) THEN
    RAISE EXCEPTION
      'Product % already has a promo in this date range (overlap detected)',
      NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_overlapping_promos
  BEFORE INSERT OR UPDATE ON promo_products
  FOR EACH ROW
  EXECUTE FUNCTION prevent_overlapping_promos();

-- =============================================================
-- HELPER FUNCTION: Check if a product has an active promo
-- =============================================================
CREATE OR REPLACE FUNCTION has_active_promo(p_product_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM promo_products pp
    JOIN promos p ON p.id = pp.promo_id
    WHERE pp.product_id = p_product_id
      AND now() BETWEEN p.start_date AND p.end_date
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================
-- HELPER FUNCTION: Get active promo for a product
-- =============================================================
CREATE OR REPLACE FUNCTION get_active_promo(p_product_id TEXT)
RETURNS TABLE (
  promo_id      UUID,
  promo_name    TEXT,
  promo_price   INTEGER,
  start_date    TIMESTAMPTZ,
  end_date      TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    pp.promo_price,
    p.start_date,
    p.end_date
  FROM promo_products pp
  JOIN promos p ON p.id = pp.promo_id
  WHERE pp.product_id = p_product_id
    AND now() BETWEEN p.start_date AND p.end_date
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;
