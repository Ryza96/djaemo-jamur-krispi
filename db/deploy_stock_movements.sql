BEGIN;

CREATE TABLE IF NOT EXISTS stock_movements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      TEXT NOT NULL
                    REFERENCES products(id),
  order_id        UUID
                    REFERENCES orders(id)
                    ON DELETE RESTRICT,
  delta           INTEGER NOT NULL,
  previous_stock  INTEGER NOT NULL,
  new_stock       INTEGER NOT NULL,
  reason          TEXT NOT NULL,
  actor_type      TEXT NOT NULL,
  actor_id        TEXT,
  reference_id    TEXT,
  idempotency_key TEXT,
  correlation_id  TEXT,
  metadata        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CHECK (delta <> 0),
  CHECK (new_stock = previous_stock + delta),
  CHECK (reason IN (
    'order_confirm',
    'order_cancel',
    'deduct_rollback',
    'resume_fulfillment',
    'manual_adjust',
    'correction'
  ))
);

CREATE INDEX IF NOT EXISTS idx_sm_product_id
  ON stock_movements (product_id);

CREATE INDEX IF NOT EXISTS idx_sm_order_id
  ON stock_movements (order_id)
  WHERE order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sm_created_at
  ON stock_movements (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sm_product_created
  ON stock_movements (product_id, created_at DESC);

CREATE OR REPLACE FUNCTION prevent_stock_movement_modification()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'UPDATE on immutable ledger is forbidden.';
  ELSIF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'DELETE on immutable ledger is forbidden.';
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class WHERE relname = 'stock_movements'
  ) THEN
    DROP TRIGGER IF EXISTS trg_stock_movement_immutable ON stock_movements;
    CREATE TRIGGER trg_stock_movement_immutable
      BEFORE UPDATE OR DELETE ON stock_movements
      FOR EACH ROW
      EXECUTE FUNCTION prevent_stock_movement_modification();
  END IF;
END $$;

REVOKE UPDATE, DELETE ON stock_movements FROM authenticated, anon;

COMMIT;
