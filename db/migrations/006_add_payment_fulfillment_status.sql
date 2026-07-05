-- =============================================================
-- Migration 006: Add payment_status & fulfillment_status
-- =============================================================
-- Run this in Supabase SQL Editor after deploying the code.
-- =============================================================

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50)
    DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid','pending','paid','failed','expired'));

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS fulfillment_status VARCHAR(50)
    DEFAULT 'new'
    CHECK (fulfillment_status IN ('new','processing','packed','shipped','delivered','completed'));

-- Backfill from existing status column
UPDATE orders
  SET payment_status = CASE
    WHEN status IN ('pending','unpaid') THEN 'pending'
    WHEN status = 'paid'   THEN 'paid'
    WHEN status = 'failed' THEN 'failed'
    ELSE 'unpaid'
  END,
  fulfillment_status = CASE
    WHEN status IN ('shipped','delivered') THEN status
    ELSE 'new'
  END
  WHERE payment_status IS NULL;

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_fulfillment_status ON orders(fulfillment_status);

-- =============================================================
-- Migration 007: Create audit_logs table
-- =============================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id          BIGSERIAL PRIMARY KEY,
  order_id    VARCHAR(255) NOT NULL,
  event       VARCHAR(50)  NOT NULL,
  from_status VARCHAR(50),
  to_status   VARCHAR(50)  NOT NULL,
  metadata    JSONB,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_order_id ON audit_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
