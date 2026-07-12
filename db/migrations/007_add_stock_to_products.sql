-- =============================================================
-- Migration 007: Add stock column to products
-- =============================================================
-- Run this in Supabase SQL Editor after deploying the code.
-- =============================================================

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS stock INTEGER NOT NULL DEFAULT 0;

-- All existing products will automatically have stock = 0.
-- Admin must manually set initial stock after migration.
