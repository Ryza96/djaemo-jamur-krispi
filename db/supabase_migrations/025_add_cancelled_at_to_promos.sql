-- =============================================================
-- Migration 025: Add cancelled_at to promos table
-- =============================================================
-- Adds cancelled_at column to track cancelled promos.
-- Status logic:
--   - Akan Datang: NOW() < start_date AND cancelled_at IS NULL
--   - Aktif: NOW() >= start_date AND NOW() <= end_date AND cancelled_at IS NULL
--   - Berakhir: NOW() > end_date AND cancelled_at IS NULL
--   - Dibatalkan: cancelled_at IS NOT NULL
-- =============================================================

ALTER TABLE promos ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_promos_cancelled_at ON promos (cancelled_at);
