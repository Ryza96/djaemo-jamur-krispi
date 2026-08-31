-- =============================================================
-- Migration 035: Convert orders timestamp columns to TIMESTAMPTZ
-- =============================================================
-- Context:
--   `orders.created_at` and `orders.paid_at` are currently naive
--   TIMESTAMP columns. They consistently store UTC wall-clock values
--   (written via `new Date().toISOString()` and a UTC Postgres server),
--   but the naive type leaves the values' timezone ambiguous if the
--   runtime ever runs outside UTC.
--
--   This migration converts them to TIMESTAMPTZ so the timezone is
--   explicit and unambiguous going forward. It is IDEMPOTENT (safe to
--   run repeatedly) and uses `AT TIME ZONE 'UTC'` so existing naive
--   values are interpreted AS UTC — independent of the session TimeZone.
--
-- SAFETY for existing data:
--   Existing values are UTC wall-clock (verified). Interpreting them as
--   UTC (`AT TIME ZONE 'UTC'`) preserves the exact UTC instant — no data
--   shift is needed and NO backfill of values is required. Post-query
--   behavior is unchanged for the dashboard, which filters on UTC
--   instants; PostgREST will now simply return the values WITH an
--   explicit timezone suffix.
--
--   If you are certain all historical rows are UTC, this is safe to run
--   on a populated table. DO NOT change the 'UTC' literal to your local
--   zone — doing so would reinterpret history incorrectly.
-- =============================================================

BEGIN;

ALTER TABLE orders
  ALTER COLUMN created_at TYPE timestamptz
  USING created_at AT TIME ZONE 'UTC';

ALTER TABLE orders
  ALTER COLUMN paid_at TYPE timestamptz
  USING paid_at AT TIME ZONE 'UTC';

-- Optional (not required by the dashboard): make the audit/update stamp
-- unambiguous too. Uncomment if you want full consistency.
-- ALTER TABLE orders
--   ALTER COLUMN updated_at TYPE timestamptz
--   USING updated_at AT TIME ZONE 'UTC';

COMMIT;
