-- =============================================================
-- Migration 011: Add waybill_id for Admin Orders
-- =============================================================
-- Fixes PostgreSQL Error 42703: column orders.waybill_id does not exist
-- This is the ONLY column needed by GET /api/admin/orders
-- (OrderRepository.getPaginated explicitly SELECTs waybill_id)
-- =============================================================

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS waybill_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_orders_waybill_id
  ON orders(waybill_id);