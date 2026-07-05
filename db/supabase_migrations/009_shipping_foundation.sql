-- =============================================================
-- Migration 009: Shipping Foundation
-- =============================================================
-- Adds columns needed for Biteship shipment creation, tracking,
-- webhook handling, and automated fulfillment completion.
-- =============================================================

-- =============================================================
-- ORDERS: Shipping metadata columns
-- =============================================================
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shipment_id VARCHAR(255);

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS destination_area_id VARCHAR(50);

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shipping_status VARCHAR(50);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'orders'::regclass
      AND conname = 'ck_orders_shipping_status'
  ) THEN
    ALTER TABLE orders ADD CONSTRAINT ck_orders_shipping_status
      CHECK (shipping_status IN (
        'confirmed',
        'picking_up',
        'dropping_off',
        'in_transit',
        'delivered',
        'cancelled',
        'retry'
      ));
  END IF;
END $$;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shipment_error TEXT;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS courier_etd VARCHAR(50);

-- =============================================================
-- INDEXES
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_orders_shipment_id
  ON orders(shipment_id);

CREATE INDEX IF NOT EXISTS idx_orders_shipping_status
  ON orders(shipping_status);

-- =============================================================
-- PRODUCTS: Numeric weight column for shipping calculations
-- =============================================================
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS weight_grams INTEGER NOT NULL DEFAULT 100;
