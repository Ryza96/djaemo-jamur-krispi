-- ============================================================
-- 031: Enable RLS on audit/log tables + storage policy
-- Run this in Supabase SQL Editor before deploying code changes.
--
-- Each section runs in its own DO block so one failure won't
-- roll back the others.
-- ============================================================

-- 1. webhook_debug_logs
DO $$ BEGIN
  ALTER TABLE webhook_debug_logs ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'SKIP: webhook_debug_logs does not exist';
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role only - webhook_debug_logs"
    ON webhook_debug_logs FOR ALL TO service_role
    USING (true) WITH CHECK (true);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN duplicate_object THEN RAISE NOTICE 'EXISTS: policy "Service role only - webhook_debug_logs" already set';
END $$;

-- 2. audit_logs
DO $$ BEGIN
  ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'SKIP: audit_logs does not exist';
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role only - audit_logs"
    ON audit_logs FOR ALL TO service_role
    USING (true) WITH CHECK (true);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN duplicate_object THEN RAISE NOTICE 'EXISTS: policy "Service role only - audit_logs" already set';
END $$;

-- 3. notification_log
DO $$ BEGIN
  ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'SKIP: notification_log does not exist';
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role only - notification_log"
    ON notification_log FOR ALL TO service_role
    USING (true) WITH CHECK (true);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN duplicate_object THEN RAISE NOTICE 'EXISTS: policy "Service role only - notification_log" already set';
END $$;

-- 4. contacts — create table if missing (migration 007 may not have run)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'contacts'
  ) THEN
    CREATE TABLE contacts (
      id BIGSERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    RAISE NOTICE 'CREATED: contacts table (was missing)';
  END IF;
END $$;

DO $$ BEGIN
  ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'SKIP: contacts does not exist';
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role only - contacts"
    ON contacts FOR ALL TO service_role
    USING (true) WITH CHECK (true);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN duplicate_object THEN RAISE NOTICE 'EXISTS: policy "Service role only - contacts" already set';
END $$;

-- 5. product_images — enable RLS (may have been created manually)
DO $$ BEGIN
  ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'SKIP: product_images does not exist — create it first';
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access - product_images"
    ON product_images FOR ALL TO service_role
    USING (true) WITH CHECK (true);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN duplicate_object THEN RAISE NOTICE 'EXISTS: policy "Service role full access - product_images" already set';
END $$;

DO $$ BEGIN
  CREATE POLICY "Public read - product_images"
    ON product_images FOR SELECT TO anon
    USING (true);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN duplicate_object THEN RAISE NOTICE 'EXISTS: policy "Public read - product_images" already set';
END $$;

-- 6. Storage bucket policy: product-images
-- Service role can write, anon can only read
DO $$ BEGIN
  CREATE POLICY "Service role write - product-images"
    ON storage.objects FOR INSERT TO service_role
    WITH CHECK (bucket_id = 'product-images');
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'EXISTS: policy "Service role write - product-images" already set';
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role update - product-images"
    ON storage.objects FOR UPDATE TO service_role
    USING (bucket_id = 'product-images')
    WITH CHECK (bucket_id = 'product-images');
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'EXISTS: policy "Service role update - product-images" already set';
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role delete - product-images"
    ON storage.objects FOR DELETE TO service_role
    USING (bucket_id = 'product-images');
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'EXISTS: policy "Service role delete - product-images" already set';
END $$;

DO $$ BEGIN
  CREATE POLICY "Public read - product-images"
    ON storage.objects FOR SELECT TO anon
    USING (bucket_id = 'product-images');
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'EXISTS: policy "Public read - product-images" already set';
END $$;
