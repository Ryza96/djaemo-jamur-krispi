-- WO-ARCH-001: Order Customer Snapshot
-- Adds denormalized customer_name, customer_phone, customer_email to orders
-- so each order preserves the customer data at time of checkout.

-- 1. Add snapshot columns to orders (idempotent)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS customer_name TEXT,
  ADD COLUMN IF NOT EXISTS customer_phone TEXT,
  ADD COLUMN IF NOT EXISTS customer_email TEXT;

-- 2. Backfill existing orders — only fill rows where snapshot is still empty
UPDATE orders o
SET
  customer_name  = COALESCE(o.customer_name, c.name),
  customer_phone = COALESCE(o.customer_phone, c.phone),
  customer_email = COALESCE(o.customer_email, c.email)
FROM customers c
WHERE o.customer_id = c.id
  AND (o.customer_name IS NULL OR o.customer_phone IS NULL OR o.customer_email IS NULL);
