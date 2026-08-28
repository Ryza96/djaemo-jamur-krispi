-- =============================================================
-- Migration 034: Contact Form Rate-Limiting Registry
-- =============================================================
-- Records EVERY contact form submission attempt (success or failed
-- validation, regardless of outcome) to throttle spam/abuse. Unlike
-- admin_login_attempts (025) which only records FAILED logins, the
-- contact form records every attempt because failure signals can be
-- crafted by attackers and the limit must be enforced before any
-- validation happens (to prevent bypass via intentionally-invalid
-- payloads).
--
-- DESIGN DECISIONS:
--   - One row per ATTEMPT (identifier IP + submitted_at).
--   - identifier = client IP (from x-forwarded-for), reuse
--     getClientIdentifier() from admin-login-rate-limit.service.ts.
--   - Rate limit checked BEFORE processing request (before validation,
--     DB insert to contacts, or email send); attempt recorded before
--     validation so a failed validation still consumes the quota.
--   - Expired rows (older than the window) are pruned during recording
--     to keep the table small.
--   - No RLS policy: server-only table, accessed via service_role key
--     (same as admin_login_attempts, migration 025, and stock_movements,
--     migration 021).
--   - Idempotent via IF NOT EXISTS / index creations (runnable on any
--     environment).
-- =============================================================

CREATE TABLE IF NOT EXISTS contact_submissions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier    TEXT NOT NULL,
  submitted_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Most common query: count recent attempts per identifier
CREATE INDEX IF NOT EXISTS idx_contact_submissions_identifier
  ON contact_submissions (identifier);

-- Pruning: delete expired rows by timestamp
CREATE INDEX IF NOT EXISTS idx_contact_submissions_submitted_at
  ON contact_submissions (submitted_at);

-- Defense-in-depth (matches migration 025): no app-level write access.
REVOKE ALL ON contact_submissions FROM authenticated, anon;
