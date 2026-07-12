-- 023_add_orders_access_token.sql
-- Adds access_token column to orders for secure customer order access.
-- Token is a 36-char UUID generated server-side at order creation.
-- Used by checkout success page, order detail, tracking, and receipt QR codes.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS access_token TEXT;

-- Backfill existing orders with random tokens.
UPDATE orders
SET access_token = gen_random_uuid()::text
WHERE access_token IS NULL;

-- Make non-null after backfill.
ALTER TABLE orders
  ALTER COLUMN access_token SET NOT NULL;

-- Unique constraint: each order has a distinct token.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_access_token_unique'
  ) THEN
    ALTER TABLE orders
      ADD CONSTRAINT orders_access_token_unique UNIQUE (access_token);
  END IF;
END $$;

-- Index for fast lookup by token.
CREATE INDEX IF NOT EXISTS idx_orders_access_token ON orders (access_token);
