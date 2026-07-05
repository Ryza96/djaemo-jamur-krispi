-- =============================================================
-- Migration 013: Migrate legacy fulfillment_status values
-- Runs AFTER migration 012
-- =============================================================

BEGIN;

UPDATE orders
SET fulfillment_status = 'confirmed'
WHERE fulfillment_status = 'processing';

UPDATE orders
SET fulfillment_status = 'delivered'
WHERE fulfillment_status = 'completed';

ALTER TABLE orders
VALIDATE CONSTRAINT orders_fulfillment_status_check;

COMMIT;