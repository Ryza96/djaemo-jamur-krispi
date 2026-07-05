-- =============================================================
-- Migration 007: Reconcile schema (Phase 1 — LOW risk)
-- =============================================================
-- Phase 1 adds only LOW-risk items: tables, timestamps, and
-- indexes that can be safely created without data backfill.
-- =============================================================

-- =============================================================
-- CONTACTS (from schema.sql, used by app/api/contact/route.ts)
-- =============================================================
CREATE TABLE IF NOT EXISTS contacts (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================
-- AUDIT LOGS (from migration 006, used by AuditLogService)
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

-- =============================================================
-- CUSTOMERS
-- =============================================================
ALTER TABLE customers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- =============================================================
-- ORDERS
-- =============================================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Indexes from schema.sql
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_transaction_id ON orders(transaction_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- =============================================================
-- ORDER ITEMS
-- =============================================================
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Index from schema.sql
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
