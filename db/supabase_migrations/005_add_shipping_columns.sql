-- 005_add_shipping_columns.sql
-- Adds missing shipping-related columns to orders table
-- These columns are used by backend for shipping creation with Biteship

ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_company VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_type VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_cost BIGINT DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS qr_code_url TEXT;

-- Backfill defaults for existing orders
UPDATE orders SET customer_phone = '' WHERE customer_phone IS NULL;
UPDATE orders SET shipping_address = '' WHERE shipping_address IS NULL;
UPDATE orders SET courier_company = '' WHERE courier_company IS NULL;
UPDATE orders SET courier_type = '' WHERE courier_type IS NULL;
UPDATE orders SET shipping_cost = 0 WHERE shipping_cost IS NULL;
