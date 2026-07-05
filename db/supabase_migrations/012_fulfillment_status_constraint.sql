-- =============================================================
-- Migration 012: Replace fulfillment_status CHECK constraint
-- Matches ADR-002 state machine.
-- NOT VALID required because existing rows may still contain
-- legacy statuses that will be migrated in 013.
-- =============================================================

BEGIN;

ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_fulfillment_status_check;

ALTER TABLE orders
  ADD CONSTRAINT orders_fulfillment_status_check
  CHECK (fulfillment_status IN (
    'new','confirmed','packing','waybill_created','picked_up',
    'shipped','delivered','cancelled'
  ))
  NOT VALID;

COMMIT;
