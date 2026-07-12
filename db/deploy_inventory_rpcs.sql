BEGIN;

CREATE OR REPLACE FUNCTION _apply_stock_change(
  p_product_id      TEXT,
  p_operation       TEXT,
  p_quantity        INTEGER,
  p_reason          TEXT,
  p_order_id        UUID    DEFAULT NULL,
  p_actor_type      TEXT    DEFAULT 'system',
  p_actor_id        TEXT    DEFAULT NULL,
  p_reference_id    TEXT    DEFAULT NULL,
  p_idempotency_key TEXT    DEFAULT NULL,
  p_correlation_id  TEXT    DEFAULT NULL,
  p_metadata        JSONB   DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_stock INTEGER;
  v_delta         INTEGER;
  v_new_stock     INTEGER;
  v_movement_id   UUID;
BEGIN
  SELECT stock INTO v_current_stock
  FROM products
  WHERE id = p_product_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PRODUCT_NOT_FOUND';
  END IF;

  IF p_operation NOT IN ('deduct', 'restore', 'adjust') THEN
    RAISE EXCEPTION 'INVALID_OPERATION: %', p_operation;
  END IF;

  IF p_quantity IS NULL THEN
    RAISE EXCEPTION 'INVALID_QUANTITY: quantity must not be null';
  END IF;

  IF p_quantity = 0 THEN
    RAISE EXCEPTION 'INVALID_QUANTITY: quantity must not be zero';
  END IF;

  IF p_operation IN ('deduct', 'restore') AND p_quantity < 0 THEN
    RAISE EXCEPTION 'INVALID_QUANTITY: quantity must be positive for %', p_operation;
  END IF;

  CASE p_operation
    WHEN 'deduct' THEN
      v_delta := -1 * p_quantity;
      IF v_current_stock < p_quantity THEN
        RAISE EXCEPTION 'INSUFFICIENT_STOCK: available %, requested %',
          v_current_stock, p_quantity;
      END IF;
    WHEN 'restore' THEN
      v_delta := p_quantity;
    WHEN 'adjust' THEN
      v_delta := p_quantity;
      IF v_delta < 0 AND v_current_stock < ABS(v_delta) THEN
        RAISE EXCEPTION 'INSUFFICIENT_STOCK: available %, requested %',
          v_current_stock, ABS(v_delta);
      END IF;
  END CASE;

  UPDATE products
  SET stock = stock + v_delta
  WHERE id = p_product_id
  RETURNING stock INTO v_new_stock;

  INSERT INTO stock_movements (
    product_id,
    order_id,
    delta,
    previous_stock,
    new_stock,
    reason,
    actor_type,
    actor_id,
    reference_id,
    idempotency_key,
    correlation_id,
    metadata
  ) VALUES (
    p_product_id,
    p_order_id,
    v_delta,
    v_current_stock,
    v_new_stock,
    p_reason,
    p_actor_type,
    p_actor_id,
    p_reference_id,
    p_idempotency_key,
    p_correlation_id,
    p_metadata
  )
  RETURNING id INTO v_movement_id;

  RETURN jsonb_build_object(
    'movement_id',    v_movement_id,
    'previous_stock', v_current_stock,
    'new_stock',      v_new_stock
  );
END;
$$;

CREATE OR REPLACE FUNCTION inventory_deduct(
  p_product_id      TEXT,
  p_quantity        INTEGER,
  p_reason          TEXT,
  p_order_id        UUID    DEFAULT NULL,
  p_actor_type      TEXT    DEFAULT 'system',
  p_actor_id        TEXT    DEFAULT NULL,
  p_reference_id    TEXT    DEFAULT NULL,
  p_idempotency_key TEXT    DEFAULT NULL,
  p_correlation_id  TEXT    DEFAULT NULL,
  p_metadata        JSONB   DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_product_id IS NULL THEN
    RAISE EXCEPTION 'PRODUCT_ID_REQUIRED';
  END IF;

  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'INVALID_QUANTITY: must be positive integer';
  END IF;

  IF p_reason IS NULL THEN
    RAISE EXCEPTION 'REASON_REQUIRED';
  END IF;

  RETURN _apply_stock_change(
    p_product_id,
    'deduct',
    p_quantity,
    p_reason,
    p_order_id,
    p_actor_type,
    p_actor_id,
    p_reference_id,
    p_idempotency_key,
    p_correlation_id,
    p_metadata
  );
END;
$$;

CREATE OR REPLACE FUNCTION inventory_restore(
  p_product_id      TEXT,
  p_quantity        INTEGER,
  p_reason          TEXT,
  p_order_id        UUID    DEFAULT NULL,
  p_actor_type      TEXT    DEFAULT 'system',
  p_actor_id        TEXT    DEFAULT NULL,
  p_reference_id    TEXT    DEFAULT NULL,
  p_idempotency_key TEXT    DEFAULT NULL,
  p_correlation_id  TEXT    DEFAULT NULL,
  p_metadata        JSONB   DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_product_id IS NULL THEN
    RAISE EXCEPTION 'PRODUCT_ID_REQUIRED';
  END IF;

  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'INVALID_QUANTITY: must be positive integer';
  END IF;

  IF p_reason IS NULL THEN
    RAISE EXCEPTION 'REASON_REQUIRED';
  END IF;

  RETURN _apply_stock_change(
    p_product_id,
    'restore',
    p_quantity,
    p_reason,
    p_order_id,
    p_actor_type,
    p_actor_id,
    p_reference_id,
    p_idempotency_key,
    p_correlation_id,
    p_metadata
  );
END;
$$;

CREATE OR REPLACE FUNCTION inventory_adjust(
  p_product_id      TEXT,
  p_quantity        INTEGER,
  p_reason          TEXT,
  p_order_id        UUID    DEFAULT NULL,
  p_actor_type      TEXT    DEFAULT 'admin',
  p_actor_id        TEXT    DEFAULT NULL,
  p_reference_id    TEXT    DEFAULT NULL,
  p_idempotency_key TEXT    DEFAULT NULL,
  p_correlation_id  TEXT    DEFAULT NULL,
  p_metadata        JSONB   DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_product_id IS NULL THEN
    RAISE EXCEPTION 'PRODUCT_ID_REQUIRED';
  END IF;

  IF p_quantity IS NULL OR p_quantity = 0 THEN
    RAISE EXCEPTION 'INVALID_QUANTITY: must be non-zero integer';
  END IF;

  IF p_reason IS NULL THEN
    RAISE EXCEPTION 'REASON_REQUIRED';
  END IF;

  RETURN _apply_stock_change(
    p_product_id,
    'adjust',
    p_quantity,
    p_reason,
    p_order_id,
    p_actor_type,
    p_actor_id,
    p_reference_id,
    p_idempotency_key,
    p_correlation_id,
    p_metadata
  );
END;
$$;

COMMIT;
