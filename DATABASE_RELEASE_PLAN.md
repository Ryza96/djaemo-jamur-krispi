# DATABASE RELEASE PLAN

**Generated:** 2026-07-05
**Engineer:** Senior Database Release Engineer
**Database:** Live Supabase (`xvjowuwkjcwixvbmvuqq.supabase.co`)
**Plan Type:** Production-safe schema synchronization

---

## 1. EXECUTIVE SUMMARY

Four pending migrations must be applied to synchronize the live database with the current codebase. **Two of these migrations are UNSAFE as written** and require modification before execution. A fifth migration (006) can be re-run safely for CHECK constraints only.

### Safety Summary

| Migration | Status | Verdict | Reason |
|---|---|---|---|
| 002 | ❌ UNSAFE | Requires Modification | Backfill references non-existent `image` column |
| 006 (re-run) | ✅ SAFE | Run as-is | All IF NOT EXISTS, no data conflicts |
| 007 (partial) | ✅ SAFE | Run as-is | Only `contacts` table is new |
| 008 | ✅ SAFE | Run as-is | CHECK constraint passes existing data |
| 009 | ❌ UNSAFE | Requires Pre-condition | CHECK constraint conflicts with existing `shipping_status=pending` |
| 010 | ✅ SAFE | Run as-is | Only ADD COLUMN + INDEX, no data dependency |

### Recommended Execution Order

```
Backup Database
    ↓
Migration 007 (contacts only)
    ↓
Verification
    ↓
Migration 008
    ↓
Verification
    ↓
Migration 009 (modified or with pre-condition)
    ↓
Verification
    ↓
Migration 010
    ↓
Migration 002 (modified)
    ↓
Full Verification
```

---

## 2. MIGRATION SAFETY MATRIX

### Migration 002 — Add Images to Products

**File:** `db/supabase_migrations/002_add_images.sql`

| SQL Statement | Type | Safe? | Why |
|---|---|---|---|
| `ALTER TABLE products ADD COLUMN IF NOT EXISTS images TEXT[]` | DDL | ✅ SAFE | Idempotent, nullable, no default, no constraint |
| `UPDATE products SET images = array[image] WHERE image IS NOT NULL AND (images IS NULL OR array_length(images,1) = 0)` | DML | ❌ **UNSAFE** | References column `image` which does not exist in the live `products` table |

**Evidence:** Live `products` table has columns: `id`, `name`, `description`, `price`, `weight`, `created_at`. The `image` column does not exist. The `UPDATE` statement will raise `PostgreSQL Error 42703: column "image" does not exist`.

**Data Compatibility Check:**
| Check | Value |
|---|---|
| `image` column exists? | ❌ No |
| Existing rows affected by backfill? | 3 (would fail before any execute) |
| `images` column conflict? | None (new column) |

**Recommendation:** Remove or rewrite the `UPDATE` backfill statement before execution. The `image` column was never created in the live database (the actual initial schema was `database/schema.sql`, not `001_init_schema.sql`). Product images are managed through the separate `product_images` table.

---

### Migration 006 — Add Payment & Fulfillment Status (re-run)

**File:** `db/supabase_migrations/006_add_payment_fulfillment_status.sql`

**Current State:** Columns `payment_status` and `fulfillment_status` already exist. `audit_logs` table already exists. CHECK constraints **may or may not** exist (cannot verify through REST API).

| SQL Statement | Type | Safe? | Why |
|---|---|---|---|
| `ADD COLUMN IF NOT EXISTS payment_status ...` | DDL | ✅ SAFE | Column exists — skipped |
| `ADD COLUMN IF NOT EXISTS fulfillment_status ...` | DDL | ✅ SAFE | Column exists — skipped |
| `UPDATE ... WHERE payment_status IS NULL` | DML | ✅ SAFE | All 3 rows have `payment_status` NOT NULL — 0 rows affected |
| `CREATE INDEX IF NOT EXISTS ...` | DDL | ✅ SAFE | Idempotent |
| `CREATE TABLE IF NOT EXISTS audit_logs ...` | DDL | ✅ SAFE | Table exists — skipped |

**Data Compatibility Check:**
| Existing `payment_status` values | Existing `fulfillment_status` values |
|---|---|
| `paid` (2 rows) | `new` (3 rows) |
| `pending` (1 row) | — |
| **Valid for CHECK `('unpaid','pending','paid','failed','expired')`** | **Valid for CHECK `('new','processing','packed','shipped','delivered','completed')`** |

**Recommendation:** Re-run the full migration file. It is safe and idempotent. If CHECK constraints were not created in the initial partial run, this will create them. If they already exist, the `IF NOT EXISTS` clauses ensure no errors.

---

### Migration 007 — Reconcile Schema (re-run)

**File:** `db/supabase_migrations/007_reconcile_schema.sql`

**Current State:** All column additions already applied. `audit_logs` table already exists. Only `contacts` table is pending.

| SQL Statement | Type | Safe? | Why |
|---|---|---|---|
| `CREATE TABLE IF NOT EXISTS contacts (...)` | DDL | ✅ SAFE | Table does not exist — will be created. All columns nullable or with defaults. No data dependency. |
| `CREATE TABLE IF NOT EXISTS audit_logs (...)` | DDL | ✅ SAFE | Table exists — skipped |
| `ALTER TABLE customers ADD COLUMN IF NOT EXISTS updated_at ...` | DDL | ✅ SAFE | Column exists — skipped |
| `ALTER TABLE orders ADD COLUMN IF NOT EXISTS ...` (4 columns) | DDL | ✅ SAFE | All columns exist — skipped |
| `ALTER TABLE order_items ADD COLUMN IF NOT EXISTS created_at ...` | DDL | ✅ SAFE | Column exists — skipped |
| `CREATE INDEX IF NOT EXISTS ...` (4 indexes) | DDL | ✅ SAFE | Idempotent |

**Data Compatibility Check:**
| Check | Value |
|---|---|
| `contacts` table exists? | ❌ No — will be created with 0 rows |
| Any column or FK conflict? | None — no foreign keys |

**Recommendation:** Run the full migration file. It is safe and idempotent. Only the `contacts` table creation will execute.

---

### Migration 008 — Order Management Foundation

**File:** `db/supabase_migrations/008_order_management_foundation.sql`

| SQL Statement | Type | Safe? | Why |
|---|---|---|---|
| `ADD COLUMN IF NOT EXISTS waybill_id VARCHAR(255)` | DDL | ✅ SAFE | Nullable, no default, no CHECK |
| `ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP` | DDL | ✅ SAFE | Nullable |
| `ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP` | DDL | ✅ SAFE | Nullable |
| `ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP` | DDL | ✅ SAFE | Nullable |
| `ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP` | DDL | ✅ SAFE | Nullable |
| `ADD COLUMN IF NOT EXISTS cancellation_reason TEXT` | DDL | ✅ SAFE | Nullable |
| `ADD COLUMN IF NOT EXISTS weight_grams INTEGER DEFAULT 100` (order_items) | DDL | ✅ SAFE | Has DEFAULT, no NOT NULL |
| `ADD COLUMN IF NOT EXISTS admin_notes TEXT` | DDL | ✅ SAFE | Nullable |
| `CREATE INDEX IF NOT EXISTS idx_orders_fulfillment_status` | DDL | ✅ SAFE | Idempotent |
| `CREATE INDEX IF NOT EXISTS idx_orders_waybill_id` | DDL | ✅ SAFE | Idempotent |
| `CREATE INDEX IF NOT EXISTS idx_orders_created_at_desc` | DDL | ✅ SAFE | Idempotent |
| `DO $$ ... DROP CONSTRAINT ...` (CHECK constraint drop) | DDL | ✅ SAFE | Loops over matching constraints; does nothing if none exist |
| `ADD CONSTRAINT orders_fulfillment_status_check CHECK (...)` | DDL | ✅ SAFE | New values include 'new' — all existing rows pass |
| `UPDATE ... SET fulfillment_status = 'processing' WHERE fulfillment_status = 'packed'` | DML | ✅ SAFE | No existing rows have 'packed' — 0 affected |
| `UPDATE ... SET fulfillment_status = 'completed' WHERE fulfillment_status = 'delivered'` | DML | ✅ SAFE | No existing rows have 'delivered' — 0 affected |

**Data Compatibility Check:**
| Check | Value | Pass? |
|---|---|---|
| Existing `fulfillment_status` values | `new` (3 rows) | ✅ All pass new CHECK `('new','processing','shipped','completed','cancelled')` |
| Existing rows with `packed` | 0 | ✅ No migration needed |
| Existing rows with `delivered` | 0 | ✅ No migration needed |
| Existing `order_items` rows | 4 rows | ✅ `weight_grams` DEFAULT 100 applied automatically |
| `waybill_id` constraint conflict | None | ✅ No UNIQUE or FK |

**Design Concern (not blocking):** The CHECK constraint update drops the original constraint and adds a new one **before** the data migration. If any row had `fulfillment_status = 'packed'` or `'delivered'`, the `ADD CONSTRAINT` would fail before the UPDATE statements could fix them. This is an ordering issue. For current data (all 'new'), this is safe.

**Recommendation:** Run the full migration file. It is safe against the current live database state.

---

### Migration 009 — Shipping Foundation

**File:** `db/supabase_migrations/009_shipping_foundation.sql`

| SQL Statement | Type | Safe? | Why |
|---|---|---|---|
| `ADD COLUMN IF NOT EXISTS shipment_id VARCHAR(255)` | DDL | ✅ SAFE | Nullable |
| `ADD COLUMN IF NOT EXISTS destination_area_id VARCHAR(50)` | DDL | ✅ SAFE | Nullable |
| `ADD COLUMN IF NOT EXISTS shipping_status VARCHAR(50)` | DDL | ✅ SAFE | Column already exists — skipped |
| `ADD CONSTRAINT ck_orders_shipping_status CHECK (...)` | DDL | ❌ **UNSAFE** | See analysis below |
| `ADD COLUMN IF NOT EXISTS shipment_error TEXT` | DDL | ✅ SAFE | Nullable |
| `ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP` | DDL | ✅ SAFE | Nullable |
| `ADD COLUMN IF NOT EXISTS courier_etd VARCHAR(50)` | DDL | ✅ SAFE | Nullable |
| `CREATE INDEX IF NOT EXISTS idx_orders_shipment_id` | DDL | ✅ SAFE | Idempotent |
| `CREATE INDEX IF NOT EXISTS idx_orders_shipping_status` | DDL | ✅ SAFE | Idempotent |
| `ADD COLUMN IF NOT EXISTS weight_grams INTEGER NOT NULL DEFAULT 100` (products) | DDL | ✅ SAFE | NOT NULL with DEFAULT — existing 3 products get 100 |

**Data Compatibility Check — CRITICAL:**

| Check | Value | Pass? |
|---|---|---|
| Existing `shipping_status` values | `pending` (3 rows) | ❌ **FAILS** — `pending` is NOT in CHECK list |
| Allowed CHECK values | `confirmed`, `picking_up`, `dropping_off`, `in_transit`, `delivered`, `cancelled`, `retry` | `pending` is excluded |
| Existing `products` rows | 3 rows | ✅ `weight_grams` DEFAULT 100 applied |

**The CHECK constraint will fail.** PostgreSQL validates all existing rows when adding a CHECK constraint. All 3 orders have `shipping_status = 'pending'`. The constraint list is:
```
('confirmed','picking_up','dropping_off','in_transit','delivered','cancelled','retry')
```
`'pending'` is not included. The `ALTER TABLE ... ADD CONSTRAINT` statement will raise:
```
ERROR:  check constraint "ck_orders_shipping_status" is violated by some row
```

**Recommendations (choose one):**
1. **Recommended:** Before running 009, execute a pre-condition UPDATE:
   ```sql
   UPDATE orders SET shipping_status = 'confirmed' WHERE shipping_status = 'pending';
   ```
   This maps the legacy `pending` value to `confirmed`, which IS in the CHECK list.
2. **Alternative:** Remove the CHECK constraint from 009 and add it as a separate migration after data cleanup.
3. **Alternative:** Modify the CHECK to include `'pending'`:
   ```sql
   CHECK (shipping_status IN ('pending','confirmed','picking_up','dropping_off','in_transit','delivered','cancelled','retry'))
   ```

---

### Migration 010 — Shipment Tracking

**File:** `db/supabase_migrations/010_shipment_tracking.sql`

| SQL Statement | Type | Safe? | Why |
|---|---|---|---|
| `ADD COLUMN IF NOT EXISTS last_tracking_at TIMESTAMP` | DDL | ✅ SAFE | Nullable, no default |
| `ADD COLUMN IF NOT EXISTS tracking_payload JSONB` | DDL | ✅ SAFE | Nullable, no default |
| `CREATE INDEX IF NOT EXISTS idx_orders_last_tracking_at ...` | DDL | ✅ SAFE | Idempotent |

**Data Compatibility Check:**
| Check | Value | Pass? |
|---|---|---|
| Existing data affected? | None | ✅ Both columns nullable, no defaults |
| Index conflict? | None | ✅ `IF NOT EXISTS` |

**Recommendation:** Run as-is. No data compatibility issues. This migration is purely additive.

---

## 3. DEPENDENCY ANALYSIS

### SQL-Level Dependencies

```
007 (contacts table)
  → No SQL dependency on other migrations

008
  → Depends on: fulfillment_status column (from 006) ✅ exists
  → Depends on: order_items table (from 001) ✅ exists

009
  → Depends on: orders table (from 001) ✅ exists
  → Depends on: shipping_status column ✅ exists (manual addition)
  → Depends on: products table (from 001) ✅ exists

010
  → No SQL dependency on other pending migrations
  → Logically depends on waybill_id (from 008) for usefulness
```

### Logical Dependencies (not SQL, but required for correct operation)

```
008 ──┐
      ├──► 010 (needs waybill_id for tracking to be meaningful)
009 ──┘
      │
      └──► Code (Repository methods query these columns)
```

### Dependency Graph

```
┌────────────────────────────────────────────────────────┐
│                       007                              │
│  (contacts table — independent, no SQL dependency)     │
└────────────────────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                       008                              │
│  (waybill_id, paid_at, shipped_at, completed_at,       │
│   cancelled_at, cancellation_reason, admin_notes,      │
│   weight_grams, CHECK update, indexes)                 │
└────────────────────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                  009 (modified)                        │
│  (shipment_id, destination_area_id, shipment_error,     │
│   delivered_at, courier_etd, shipped_status CHECK,      │
│   products.weight_grams, indexes)                      │
└────────────────────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                       010                              │
│  (last_tracking_at, tracking_payload, index)           │
└────────────────────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                  002 (modified)                        │
│  (products.images — independent, safe last)            │
└────────────────────────────────────────────────────────┘
```

### Why This Order

1. **007 first** — Creates `contacts` table (no dependencies, highest impact for contact form API)
2. **008 second** — Creates the 7 core fulfillment columns + weight_grams + CHECK update. Foundational.
3. **009 third** — Creates shipping columns. Depends on waybill_id logically (though not SQL-level).
4. **010 fourth** — Creates tracking columns. Depends on waybill_id logically.
5. **002 last** — Adds images column. Independent, lowest business impact.

---

## 4. DATA COMPATIBILITY — FULL VERIFICATION

### Current Live Data State

**orders** (3 rows):
| Column | Row 0 | Row 1 | Row 2 |
|---|---|---|---|
| `status` | pending | paid | pending |
| `payment_status` | paid | paid | pending |
| `fulfillment_status` | new | new | new |
| `shipping_status` | pending | pending | pending |
| `postal_code` | NULL | NULL | NULL |

**order_items** (4 rows): No `weight_grams` column — will get DEFAULT 100

**products** (3 rows): No `image` column, no `images` column, no `weight_grams` column

### Constraint Compatibility Matrix

| Migration | Constraint | Existing Values | Compatible? |
|---|---|---|---|
| 006 | `payment_status IN ('unpaid','pending','paid','failed','expired')` | paid, paid, pending | ✅ Yes |
| 006 | `fulfillment_status IN ('new','processing','packed','shipped','delivered','completed')` | new, new, new | ✅ Yes |
| 008 | `fulfillment_status IN ('new','processing','shipped','completed','cancelled')` | new, new, new | ✅ Yes |
| 009 | `shipping_status IN ('confirmed','picking_up','dropping_off','in_transit','delivered','cancelled','retry')` | pending, pending, pending | ❌ **No** |

### Pre-condition SQL Required Before 009

The following statement must be executed **before** migration 009 to make it safe:

```sql
UPDATE orders
SET shipping_status = 'confirmed'
WHERE shipping_status = 'pending'
  AND shipping_status IS DISTINCT FROM 'confirmed';
```

This affects 3 rows and maps the legacy `pending` value to `confirmed`, which is accepted by the new CHECK constraint.

---

## 5. RISK ASSESSMENT

### Risks by Severity

| # | Risk | Severity | Migration | Mitigation |
|---|---|---|---|---|
| 1 | CHECK constraint on `shipping_status` fails | **BLOCKING** | 009 | Pre-condition UPDATE to map 'pending' → 'confirmed' |
| 2 | Backfill UPDATE references non-existent `image` column | **BLOCKING** | 002 | Remove or rewrite the UPDATE statement |
| 3 | `ADD CONSTRAINT orders_fulfillment_status_check` fails if data has `packed` or `delivered` | **MEDIUM** | 008 | Verify no rows have these values before running (currently 0) |
| 4 | Index creation on large tables causes locks | **LOW** | 008, 009, 010 | Only 3 orders and 4 order_items — no lock impact |
| 5 | `products.weight_grams NOT NULL DEFAULT 100` overwrites existing data intent | **LOW** | 009 | Default 100 is a fallback; existing weight stored in `weight` text column |
| 6 | Partial failure mid-migration | **LOW** | All | Each migration uses `IF NOT EXISTS` — re-runnable |

### Blocking Issues (must resolve before execution)

1. **Migration 002 backfill** — Will crash with 42703. Remove the UPDATE.
2. **Migration 009 CHECK constraint** — Will crash with check violation. Add pre-condition UPDATE.

### Non-Blocking Observations

1. **Migration 008 CHECK redesign**: The data migration (packed→processing, delivered→completed) runs AFTER the new CHECK is added. This means if anyone manually sets fulfillment_status to 'packed' or 'delivered' between now and migration execution, the migration will fail. Current data is safe (all 'new').
2. **Index on shipping_status**: The column already exists with data. Creating an index on 3 rows is instant.
3. **products.weight_grams NOT NULL**: Existing 3 products will get weight_grams = 100. This may not match the actual product weights stored as text in the `weight` column (e.g., "72"). A separate data migration may be needed to convert `weight` TEXT to `weight_grams` INTEGER.

---

## 6. SAFE EXECUTION ORDER

### Phase 0: Pre-Flight Checks

- [ ] Verify database backup exists
- [ ] Verify service_role_key has ALTER/CREATE/INDEX permissions
- [ ] Verify `status` column exists on `orders` (for 006 backfill — it does)
- [ ] Verify no pending orders with `fulfillment_status = 'packed'` or `'delivered'`
- [ ] Run pre-condition UPDATE for 009 (see Section 4)

### Phase 1: Migration 007 (contacts table)

**File:** `db/supabase_migrations/007_reconcile_schema.sql`

Only the `CREATE TABLE IF NOT EXISTS contacts (...)` portion will execute. All other statements are already applied and will be skipped.

**Verification:**
```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'contacts'
);
```
Expected: `true`

### Phase 2: Migration 008

**File:** `db/supabase_migrations/008_order_management_foundation.sql`

Run the full file. This adds 7 columns to orders, 1 column to order_items, 3 indexes, and updates the fulfillment_status CHECK constraint.

**Verification (column existence):**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND column_name IN (
    'waybill_id','paid_at','shipped_at','completed_at',
    'cancelled_at','cancellation_reason','admin_notes'
  );
```
Expected: 7 rows

**Verification (weight_grams on order_items):**
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'order_items' AND column_name = 'weight_grams';
```
Expected: 1 row

### Phase 3: Pre-Condition Update

Execute before Phase 4:
```sql
UPDATE orders
SET shipping_status = 'confirmed'
WHERE shipping_status = 'pending';
```

**Verification:** Affected rows should be 0 after execution (all mapped).

### Phase 4: Migration 009

**File:** `db/supabase_migrations/009_shipping_foundation.sql`

Run the full file. With pre-condition applied, all statements are safe.

**Verification (column existence):**
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND column_name IN (
    'shipment_id','destination_area_id','shipment_error',
    'delivered_at','courier_etd'
  );
```
Expected: 5 rows

**Verification (weight_grams on products):**
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'weight_grams';
```
Expected: 1 row

**Verification (CHECK constraint):**
```sql
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'orders'::regclass
  AND conname = 'ck_orders_shipping_status';
```
Expected: 1 row showing the CHECK definition

### Phase 5: Migration 010

**File:** `db/supabase_migrations/010_shipment_tracking.sql`

Run the full file. No data compatibility issues.

**Verification:**
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND column_name IN ('last_tracking_at','tracking_payload');
```
Expected: 2 rows

### Phase 6: Migration 002 (Modified)

**File:** `db/supabase_migrations/002_add_images.sql`

**Must be modified first.** Remove the backfill UPDATE statement. Only run:
```sql
ALTER TABLE IF EXISTS products
  ADD COLUMN IF NOT EXISTS images TEXT[];
```

**Verification:**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'images';
```
Expected: 1 row, data_type = ARRAY or text[]

---

## 7. VERIFICATION CHECKLIST

### Full Checklist

- [ ] **Pre-flight:** Database backup completed
- [ ] **Pre-flight:** Supabase SQL Editor or migration runner available
- [ ] **Pre-flight:** Service role key has ALTER TABLE, CREATE INDEX, CREATE TABLE permissions
- [ ] **Phase 1:** `contacts` table created successfully
- [ ] **Phase 2:** All 7 order columns created
- [ ] **Phase 2:** `order_items.weight_grams` created (DEFAULT 100 applied to 4 rows)
- [ ] **Phase 2:** fulfillment_status CHECK constraint updated successfully
- [ ] **Phase 3:** Pre-condition UPDATE executed (shipping_status 'pending' → 'confirmed')
- [ ] **Phase 4:** All 5 shipping columns created
- [ ] **Phase 4:** `products.weight_grams` created (DEFAULT 100 applied to 3 rows)
- [ ] **Phase 4:** `ck_orders_shipping_status` CHECK constraint created
- [ ] **Phase 5:** `last_tracking_at` and `tracking_payload` created
- [ ] **Phase 6:** `products.images` TEXT[] created
- [ ] **Post-flight:** `npm run typecheck` passes against new schema
- [ ] **Post-flight:** Test admin order API endpoints
- [ ] **Post-flight:** Test payment callback
- [ ] **Post-flight:** Test contact form

---

## 8. ROLLBACK STRATEGY

### Rollback Principles

1. **Backup is the primary recovery mechanism.** Take a full database backup before any change.
2. **All column additions are reversible** via `ALTER TABLE ... DROP COLUMN`.
3. **Data migrations (UPDATE) are NOT reversible** — only backup restoration can undo them.
4. **Index drops are safe and reversible** via `CREATE INDEX`.

### Per-Migration Rollback

#### Migration 007 (contacts table)

| Operation | Rollback |
|---|---|
| `CREATE TABLE contacts` | `DROP TABLE IF EXISTS contacts;` |
| **Data loss risk:** Any contacts submitted after creation would be lost. | |

#### Migration 008

| Operation | Rollback |
|---|---|
| `ADD COLUMN waybill_id` | `ALTER TABLE orders DROP COLUMN IF EXISTS waybill_id;` |
| `ADD COLUMN paid_at` | `ALTER TABLE orders DROP COLUMN IF EXISTS paid_at;` |
| `ADD COLUMN shipped_at` | `ALTER TABLE orders DROP COLUMN IF EXISTS shipped_at;` |
| `ADD COLUMN completed_at` | `ALTER TABLE orders DROP COLUMN IF EXISTS completed_at;` |
| `ADD COLUMN cancelled_at` | `ALTER TABLE orders DROP COLUMN IF EXISTS cancelled_at;` |
| `ADD COLUMN cancellation_reason` | `ALTER TABLE orders DROP COLUMN IF EXISTS cancellation_reason;` |
| `ADD COLUMN weight_grams` (order_items) | `ALTER TABLE order_items DROP COLUMN IF EXISTS weight_grams;` |
| `ADD COLUMN admin_notes` | `ALTER TABLE orders DROP COLUMN IF EXISTS admin_notes;` |
| `CREATE INDEX idx_orders_fulfillment_status` | `DROP INDEX IF EXISTS idx_orders_fulfillment_status;` |
| `CREATE INDEX idx_orders_waybill_id` | `DROP INDEX IF EXISTS idx_orders_waybill_id;` |
| `CREATE INDEX idx_orders_created_at_desc` | `DROP INDEX IF EXISTS idx_orders_created_at_desc;` |
| CHECK constraint replace | `ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_fulfillment_status_check;` then re-add original |
| UPDATE packed → processing | **Irreversible.** Only backup restoration can reverse. |

**Rollback order:** Index drops → CHECK constraint drop → Column drops
**Data loss:** Any waybill_id, timestamps, or admin_notes written after migration would be lost on column drop.

#### Migration 009

| Operation | Rollback |
|---|---|
| `ADD COLUMN shipment_id` | `ALTER TABLE orders DROP COLUMN IF EXISTS shipment_id;` |
| `ADD COLUMN destination_area_id` | `ALTER TABLE orders DROP COLUMN IF EXISTS destination_area_id;` |
| `ADD COLUMN shipping_status` | Column pre-existed — do not drop |
| `ADD CONSTRAINT ck_orders_shipping_status` | `ALTER TABLE orders DROP CONSTRAINT IF EXISTS ck_orders_shipping_status;` |
| `ADD COLUMN shipment_error` | `ALTER TABLE orders DROP COLUMN IF EXISTS shipment_error;` |
| `ADD COLUMN delivered_at` | `ALTER TABLE orders DROP COLUMN IF EXISTS delivered_at;` |
| `ADD COLUMN courier_etd` | `ALTER TABLE orders DROP COLUMN IF EXISTS courier_etd;` |
| `ADD COLUMN weight_grams` (products) | `ALTER TABLE products DROP COLUMN IF EXISTS weight_grams;` |
| `CREATE INDEX idx_orders_shipment_id` | `DROP INDEX IF EXISTS idx_orders_shipment_id;` |
| `CREATE INDEX idx_orders_shipping_status` | `DROP INDEX IF EXISTS idx_orders_shipping_status;` |

**Data loss:** Any shipment_id, tracking info, delivery timestamps written after migration would be lost on column drop.

#### Migration 010

| Operation | Rollback |
|---|---|
| `ADD COLUMN last_tracking_at` | `ALTER TABLE orders DROP COLUMN IF EXISTS last_tracking_at;` |
| `ADD COLUMN tracking_payload` | `ALTER TABLE orders DROP COLUMN IF EXISTS tracking_payload;` |
| `CREATE INDEX idx_orders_last_tracking_at` | `DROP INDEX IF EXISTS idx_orders_last_tracking_at;` |

#### Migration 002

| Operation | Rollback |
|---|---|
| `ADD COLUMN images` | `ALTER TABLE products DROP COLUMN IF EXISTS images;` |

### Catastrophic Rollback

If multiple migrations cause cascading failures:

1. **Stop all application traffic** (put site in maintenance mode)
2. **Restore from backup** (Supabase Project Settings → Database → Restore)
3. **Verify schema** matches expected state
4. **Investigate root cause** of migration failure
5. **Re-attempt** with corrected migration scripts

### Rollback Decision Matrix

| Scenario | Action |
|---|---|
| Single column add fails | DROP that column, fix issue, re-ADD |
| CHECK constraint fails | DROP constraint, fix data, re-ADD |
| Index creation fails | Non-blocking — proceed without index, add later |
| Data migration (UPDATE) corrupts data | Restore from backup |
| Partial migration execution | Use `IF EXISTS` cleanup, re-run from start |
| Application fails after migration | Rollback all columns, restore from backup |

---

## APPENDIX A: Migration Scripts to Modify

### Migration 002 — Remove Backfill

The following line in `db/supabase_migrations/002_add_images.sql` must be removed:

```sql
-- REMOVE THIS LINE:
UPDATE products SET images = array[image] where image is not null and (images is null or array_length(images,1) = 0);
```

Only keep:
```sql
ALTER TABLE IF EXISTS products
  ADD COLUMN IF NOT EXISTS images TEXT[];
```

### Migration 009 — Pre-condition Required

Before running `db/supabase_migrations/009_shipping_foundation.sql`, execute:

```sql
UPDATE orders
SET shipping_status = 'confirmed'
WHERE shipping_status = 'pending';
```

---

## APPENDIX B: Verification SQL Queries

```sql
-- Check all new columns exist on orders
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'orders'
ORDER BY ordinal_position;

-- Check all new columns exist on order_items
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'order_items'
ORDER BY ordinal_position;

-- Check all new columns exist on products
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'products'
ORDER BY ordinal_position;

-- Check all new tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('contacts', 'audit_logs', 'product_images');
```

---

*End of Plan — No database modifications were made during this review.*
