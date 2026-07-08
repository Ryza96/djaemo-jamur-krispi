-- =============================================================
-- Migration 014: Reconcile Production Schema
-- =============================================================
-- Adds columns defined in migrations 008, 009, 010 that are
-- missing from the production database.
--
-- Safe to run: uses ADD COLUMN IF NOT EXISTS
-- =============================================================

-- =============================================================
-- ORDERS: Fulfillment timestamps (from migration 008)
-- =============================================================
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- =============================================================
-- ORDERS: Shipping columns (from migration 009)
-- =============================================================
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shipment_id VARCHAR(255);

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS destination_area_id VARCHAR(50);

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shipment_error TEXT;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS courier_etd VARCHAR(50);

-- =============================================================
-- ORDERS: Tracking columns (from migration 010)
-- =============================================================
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS last_tracking_at TIMESTAMP;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS tracking_payload JSONB;

-- =============================================================
-- ORDER ITEMS: Weight per item (from migration 008)
-- =============================================================
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS weight_grams INTEGER DEFAULT 100;

-- =============================================================
-- PRODUCTS: Numeric weight (from migration 009)
-- =============================================================
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS weight_grams INTEGER NOT NULL DEFAULT 100;
