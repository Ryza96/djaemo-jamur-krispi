-- =============================================================
-- Migration 016: Add stock column to products
-- =============================================================

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS stock INTEGER NOT NULL DEFAULT 0;
