CREATE TABLE IF NOT EXISTS webhook_debug_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider text NOT NULL,
    event text,
    payload jsonb NOT NULL,
    received_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_provider
ON webhook_debug_logs(provider);

CREATE INDEX IF NOT EXISTS idx_webhook_received_at
ON webhook_debug_logs(received_at DESC);
