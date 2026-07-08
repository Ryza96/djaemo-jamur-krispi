-- =============================================================
-- Migration 020: Add waiting_for_restock fulfillment status
-- Implements RFC-006 section 2.1 (Fulfillment State Machine).
-- Uses NOT VALID for zero-downtime; VALIDATION in 021 (PR-2).
-- =============================================================

BEGIN;

ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_fulfillment_status_check;

ALTER TABLE orders
  ADD CONSTRAINT orders_fulfillment_status_check
  CHECK (fulfillment_status IN (
    'new','confirmed','packing','waybill_created','picked_up',
    'shipped','delivered','cancelled','waiting_for_restock'
  ))
  NOT VALID;

COMMIT;
