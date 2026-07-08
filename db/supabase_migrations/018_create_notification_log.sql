CREATE TABLE IF NOT EXISTS notification_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event text NOT NULL,
    order_id text NOT NULL,
    channel_id text NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_lookup
ON notification_log (event, order_id, channel_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_sent_unique
ON notification_log (event, order_id, channel_id)
WHERE status = 'sent';
