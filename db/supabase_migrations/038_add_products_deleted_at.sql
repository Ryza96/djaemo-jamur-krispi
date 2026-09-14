-- =============================================================
-- Migration 038: Add deleted_at to products (soft-delete support)
-- + RLS: public_select_products must exclude soft-deleted rows
-- =============================================================
-- Run this in Supabase SQL Editor after deploying the code.
-- =============================================================

BEGIN;

-- 1. Add the column (NULL = active, non-NULL = soft-deleted)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL DEFAULT NULL;

-- 2. Index for common queries that filter active products.
--    Partial index: only rows WHERE deleted_at IS NULL (active products).
CREATE INDEX IF NOT EXISTS idx_products_active
  ON products (created_at DESC)
  WHERE deleted_at IS NULL;

-- 3. Fix RLS so anonymised REST (anon key) can no longer read deleted rows.
ALTER POLICY "public_select_products" ON products
  USING (deleted_at IS NULL);

-- 4. Verify the deleted_at column was created.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'deleted_at'
  ) THEN
    RAISE EXCEPTION 'MIGRATION FAILED: deleted_at column not found on products table.';
  END IF;
END $$;

-- 5. Verify the RLS policy is in place and reports its qual.
DO $$
DECLARE
  policy_qual TEXT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'products' AND policyname = 'public_select_products'
  ) THEN
    RAISE EXCEPTION 'POLICY FAILED: public_select_products not found on products.';
  END IF;

  SELECT qual INTO policy_qual
  FROM pg_policies
  WHERE tablename = 'products' AND policyname = 'public_select_products';

  RAISE NOTICE 'public_select_products qual: %', policy_qual;
END $$;

COMMIT;