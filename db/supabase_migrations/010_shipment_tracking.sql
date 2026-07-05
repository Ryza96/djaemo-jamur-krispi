-- =============================================================
-- Migration 010: Shipment Tracking
-- =============================================================
-- Adds columns needed for tracking shipment status from Biteship.
-- =============================================================

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS last_tracking_at TIMESTAMP;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS tracking_payload JSONB;

CREATE INDEX IF NOT EXISTS idx_orders_last_tracking_at
  ON orders(last_tracking_at DESC NULLS LAST);
