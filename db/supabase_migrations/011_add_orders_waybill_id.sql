-- =============================================================
-- Migration 011: Add waybill_id to orders table
-- =============================================================
-- Fixes PostgreSQL Error 42703: column orders.waybill_id does not exist
-- =============================================================

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS waybill_id VARCHAR(255);
