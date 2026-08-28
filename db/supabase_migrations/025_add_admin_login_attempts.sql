-- =============================================================
-- Migration 025: Admin Login Rate-Limiting Registry (FINAL)
-- =============================================================
-- Records FAILED admin login attempts to throttle brute-force
-- attacks. Rate limiting lives in the DATABASE (not in-memory)
-- because this app deploys to Vercel (serverless) where memory is
-- ephemeral across invocations and instances.
--
-- DESIGN DECISIONS:
--   - One row per FAILED login attempt (successful IDs cleared).
--   - identifier = client IP (from x-forwarded-for), see
--     lib/services/admin-login-rate-limit.service.ts
--   - Successful login deletes rows for that identifier (reset).
--   - Expired rows (older than the 15-minute window) are pruned
--     on every recorded failure to keep the table small.
--   - No RLS policy: server-only table, accessed via service_role
--     key (same as stock_movements, migration 021).
--   - Idempotent via IF NOT EXISTS (runnable on any environment).
-- =============================================================

CREATE TABLE IF NOT EXISTS admin_login_attempts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier    TEXT NOT NULL,
  username      TEXT,
  attempted_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Most common query: count recent attempts per identifier
CREATE INDEX IF NOT EXISTS idx_admin_login_attempts_identifier
  ON admin_login_attempts (identifier);

-- Pruning: delete expired rows by timestamp
CREATE INDEX IF NOT EXISTS idx_admin_login_attempts_attempted_at
  ON admin_login_attempts (attempted_at);

-- Defense-in-depth (matches migration 021): no app-level write access.
REVOKE ALL ON admin_login_attempts FROM authenticated, anon;