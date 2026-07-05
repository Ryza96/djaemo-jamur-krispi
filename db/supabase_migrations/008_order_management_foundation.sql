-- =============================================================
-- Migration 008: Order Management Foundation
-- =============================================================
-- Adds columns needed for fulfillment workflow and admin
-- order management.
-- =============================================================

-- =============================================================
-- ORDERS: New columns for fulfillment tracking
-- =============================================================
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS waybill_id VARCHAR(255);

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

-- =============================================================
-- INDEXES
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_orders_fulfillment_status
  ON orders(fulfillment_status);

CREATE INDEX IF NOT EXISTS idx_orders_waybill_id
  ON orders(waybill_id);

CREATE INDEX IF NOT EXISTS idx_orders_created_at_desc
  ON orders(created_at DESC);

-- =============================================================
-- ORDER ITEMS: Weight per item for shipping
-- =============================================================
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS weight_grams INTEGER DEFAULT 100;

-- =============================================================
-- ADMIN NOTES: Separate from customer notes (column `notes`)
-- =============================================================
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- =============================================================
-- CHECK CONSTRAINT: Update to match final workflow
-- Remove: packed, delivered
-- Keep:   new, processing, shipped, completed
-- Add:    cancelled
-- =============================================================
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN (
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'orders'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%fulfillment_status%'
  ) LOOP
    EXECUTE 'ALTER TABLE orders DROP CONSTRAINT ' || quote_ident(rec.conname);
  END LOOP;
END $$;

ALTER TABLE orders
  ADD CONSTRAINT orders_fulfillment_status_check
  CHECK (fulfillment_status IN ('new','processing','shipped','completed','cancelled'));

-- =============================================================
-- DATA MIGRATION: Map old status values to new workflow
-- =============================================================
UPDATE orders
  SET fulfillment_status = 'processing'
  WHERE fulfillment_status = 'packed';

UPDATE orders
  SET fulfillment_status = 'completed'
  WHERE fulfillment_status = 'delivered';
