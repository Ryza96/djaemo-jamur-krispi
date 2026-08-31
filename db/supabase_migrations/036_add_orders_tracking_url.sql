-- =============================================================
-- Migration 036: Add tracking_url to orders
-- =============================================================
-- Stores the Biteship courier tracking link (`courier.link` from the
-- create-shipment response, and `tracking_url` from webhook payloads)
-- so the customer-facing track-order page can render a clickable
-- "Lacak di Kurir" link alongside the waybill number.
--
-- IDEMPOTENT and backfill-free: new column only; historical rows
-- simply have NULL tracking_url until the next successful shipment /
-- webhook writes a value.
-- =============================================================

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS tracking_url TEXT;
