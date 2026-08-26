-- ============================================================
-- 032: Create product_likes table
-- Device-based product like/favorite system.
-- Run this in Supabase SQL Editor before deploying code changes.
-- ============================================================

DO $$ BEGIN
  CREATE TABLE product_likes (
    id BIGSERIAL PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (product_id, device_id)
  );
  RAISE NOTICE 'CREATED: product_likes table';
EXCEPTION
  WHEN duplicate_table THEN RAISE NOTICE 'EXISTS: product_likes table already exists';
END $$;

DO $$ BEGIN
  ALTER TABLE product_likes ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'SKIP: product_likes does not exist';
END $$;

DO $$ BEGIN
  CREATE POLICY "Public read - product_likes"
    ON product_likes FOR SELECT TO anon
    USING (true);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN duplicate_object THEN RAISE NOTICE 'EXISTS: policy "Public read - product_likes" already set';
END $$;

DO $$ BEGIN
  CREATE POLICY "Public insert - product_likes"
    ON product_likes FOR INSERT TO anon
    WITH CHECK (true);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN duplicate_object THEN RAISE NOTICE 'EXISTS: policy "Public insert - product_likes" already set';
END $$;

DO $$ BEGIN
  CREATE POLICY "Public delete own - product_likes"
    ON product_likes FOR DELETE TO anon
    USING (device_id = current_setting('request.headers', true)::json->>'x-device-id');
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN duplicate_object THEN RAISE NOTICE 'EXISTS: policy "Public delete own - product_likes" already set';
END $$;

-- Service role bypasses RLS, but add explicit policy for safety
DO $$ BEGIN
  CREATE POLICY "Service role full access - product_likes"
    ON product_likes FOR ALL TO service_role
    USING (true) WITH CHECK (true);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN duplicate_object THEN RAISE NOTICE 'EXISTS: policy "Service role full access - product_likes" already set';
END $$;

-- Index for fast count queries
DO $$ BEGIN
  CREATE INDEX idx_product_likes_product_id ON product_likes (product_id);
EXCEPTION
  WHEN duplicate_table THEN RAISE NOTICE 'EXISTS: idx_product_likes_product_id already exists';
END $$;
