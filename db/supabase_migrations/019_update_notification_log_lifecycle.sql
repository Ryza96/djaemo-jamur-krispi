-- Revisi notification_log: tambah status lifecycle + partial unique index.
-- Menghapus UNIQUE constraint lama yang tidak memiliki status.
-- Menambahkan kolom status ('pending', 'sent', 'failed') dan updated_at.
-- Partial unique index hanya mencegah duplikat status='sent'.

ALTER TABLE notification_log ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';
ALTER TABLE notification_log ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DROP INDEX IF EXISTS notification_log_event_order_id_channel_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_sent_unique
ON notification_log (event, order_id, channel_id)
WHERE status = 'sent';
