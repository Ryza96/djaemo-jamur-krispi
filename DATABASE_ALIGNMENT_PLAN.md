# DATABASE ALIGNMENT PLAN — PR-1

**Role:** Database Alignment Engineer
**Policy:** Existing migrations are immutable. All schema changes use NEW migration files. All data repairs use NEW repair scripts.
**Execution:** None yet. Preparation only.

---

## 1. OBJECTIVES

1. Add all 14 missing columns to `orders` table
2. Add missing `weight_grams` to `order_items` table
3. Add missing `images` and `weight_grams` to `products` table
4. Create missing `contacts` table
5. Normalize legacy `shipping_status = 'pending'` to `'confirmed'`
6. Add CHECK constraints matching canonical code constants
7. Add indexes for performance
8. Leave every existing migration file untouched

---

## 2. SCOPE

| Layer | Included | Excluded |
|---|---|---|
| Database schema (columns, tables, constraints, indexes) | ✅ All missing objects | ❌ Orphan columns (`shipping_courier`, `shipping_tracking_id`, `shipping_postal_code`) |
| Data backfill / repair | ✅ `shipping_status` normalization | ❌ `postal_code` backfill (low priority, non-blocking) |
| Existing migration files | ❌ Not modified | ✅ All 10 files preserved as-is |
| Code (TypeScript, TSX) | ❌ Not modified | ✅ Reserved for PR-2 |
| API routes | ❌ Not modified | ✅ Reserved for PR-3 |

---

## 3. AFFECTED TABLES

| Table | Current Columns | After PR-1 | Difference |
|---|---|---|---|
| `orders` | 28 | 42 (+14) | waybill_id, paid_at, shipped_at, completed_at, cancelled_at, cancellation_reason, admin_notes, shipment_id, destination_area_id, shipment_error, delivered_at, courier_etd, last_tracking_at, tracking_payload |
| `order_items` | 8 | 9 (+1) | weight_grams |
| `products` | 6 | 8 (+2) | images, weight_grams |
| `contacts` | — | 5 (new table) | id, name, email, phone, message, created_at |

### Row counts affected by data repair

| Table | Action | Rows |
|---|---|---|
| `orders.shipping_status` | `'pending'` → `'confirmed'` | 3 of 3 |

---

## 4. AFFECTED REPOSITORIES

| Repository | Missing Column(s) | Blocked Method(s) | Unblocked After |
|---|---|---|---|
| `OrderRepository` | waybill_id | `findByWaybillId`, `updateWaybill`, `updateShipmentInfo`, `updateFulfillmentStatus` | Migration 013 |
| `OrderRepository` | paid_at | `updatePayment`, `updatePaymentByOrderId` | Migration 013 |
| `OrderRepository` | shipped_at, completed_at, cancelled_at, cancellation_reason, waybill_id | `updateFulfillmentStatus` | Migration 013 |
| `OrderRepository` | admin_notes | `updateAdminNotes` | Migration 013 |
| `OrderRepository` | weight_grams (order_items) | `validateShipmentReady`, `buildPdf`, `mapOrderToBiteshipRequest` | Migration 013 |
| `OrderRepository` | shipment_id, destination_area_id | `updateShipmentInfo`, `validateShipmentReady` | Migration 014 |
| `OrderRepository` | delivered_at | `updateShippingStatus` | Migration 014 |
| `OrderRepository` | last_tracking_at, tracking_payload | `updateTrackingInfo` | Migration 015 |
| `ProductRepository` | images | Type-level only (uses `product_images` JOIN) | Migration 012 |
| `ProductRepository` | weight_grams | Type-level only (column never read by code) | Migration 014 |
| *(direct)* | contacts table | `POST /api/contact` | Migration 011 |

---

## 5. MIGRATION SEQUENCE

All migrations are NEW files. None modify existing files.

```
ORDER OF EXECUTION:

  Step 1:  011_create_contacts_table.sql     (independent — no dependencies)
  Step 2:  012_add_product_images_column.sql  (independent — no dependencies)
  Step 3:  013_order_management_columns.sql   (independent — no dependencies)
  Step 4:  R001_normalize_shipping_status.sql (REPAIR — must precede Step 5)
  Step 5:  014_shipping_columns.sql           (depends on R001 for CHECK safety)
  Step 6:  015_tracking_columns.sql           (independent — no dependencies)
```

### Rationale

- **Steps 1–3** are fully independent and can execute in any relative order. All use `IF NOT EXISTS` / `CREATE TABLE IF NOT EXISTS`. Zero risk of conflict.
- **Step 4 (R001)** maps legacy `shipping_status='pending'` to `'confirmed'`. This MUST run before Step 5 because Step 5 adds a CHECK constraint that excludes `'pending'`.
- **Step 5** adds the `shipping_status` CHECK constraint. Safe only after Step 4.
- **Step 6** adds tracking columns. Fully independent.

---

## 6. NEW MIGRATION FILES

### Migration 011 — `011_create_contacts_table.sql`

**Purpose:** Create the `contacts` table used by `POST /api/contact`.

**Dependencies:** None.

**Why new migration:** The `contacts` table was supposed to be created by migration 007, but 007 only partially applied. Per policy, we cannot modify 007. A new migration is the only option.

**SQL structure:**
```sql
CREATE TABLE IF NOT EXISTS contacts (
  id          BIGSERIAL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  email       VARCHAR(255) NOT NULL,
  phone       VARCHAR(50),
  message     TEXT NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Columns added:** 5 (id, name, email, phone, message, created_at)

---

### Migration 012 — `012_add_product_images_column.sql`

**Purpose:** Add `images text[]` column to `products`.

**Dependencies:** None.

**Why new migration:** Migration 002 attempted this but includes a broken backfill UPDATE referencing the non-existent `image` column. Per policy, 002 cannot be modified. A new migration containing only the `ALTER TABLE` (no backfill) is required.

**SQL structure:**
```sql
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS images TEXT[];
```

**Note:** The backfill from 002's original intent is skipped intentionally. The column `products.image` (singular) does not exist in the live database, so the backfill would crash. The `product_images` JOIN table already serves the image lookup use case.

**Columns added:** 1 (images)

---

### Migration 013 — `013_order_management_columns.sql`

**Purpose:** Add fulfillment workflow columns to `orders` and `order_items`. Update `fulfillment_status` CHECK constraint to match canonical code constants.

**Dependencies:** None.

**Why new migration:** Migration 008 was never applied and is superseded by this cleaner version. Per policy, 008 cannot be modified or retroactively applied as-is.

**SQL structure:**
```sql
-- Orders: fulfillment tracking columns
ALTER TABLE orders ADD COLUMN IF NOT EXISTS waybill_id VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Order items: weight for shipping
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS weight_grams INTEGER DEFAULT 100;

-- Update fulfillment_status CHECK to canonical values
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN (
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'orders'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%fulfillment_status%'
  ) LOOP
    EXECUTE 'ALTER TABLE orders DROP CONSTRAINT ' || quote_ident(rec.conname);
  END LOOP;
END $$;

ALTER TABLE orders
  ADD CONSTRAINT orders_fulfillment_status_check
  CHECK (fulfillment_status IN ('new','processing','shipped','completed','cancelled'));

-- Data migration: map legacy fulfillment statuses
UPDATE orders SET fulfillment_status = 'processing' WHERE fulfillment_status = 'packed';
UPDATE orders SET fulfillment_status = 'completed' WHERE fulfillment_status = 'delivered';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_fulfillment_status ON orders(fulfillment_status);
CREATE INDEX IF NOT EXISTS idx_orders_waybill_id ON orders(waybill_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at_desc ON orders(created_at DESC);
```

**Columns added:** 7 (orders) + 1 (order_items) = 8
**CHECK constraint:** Replaces old fulfillment_status CHECK with canonical values
**Data migration:** 0 rows affected (no order has `'packed'` or `'delivered'` in live DB)

---

### Migration 014 — `014_shipping_columns.sql`

**Purpose:** Add shipping workflow columns to `orders` and `products`. Add `shipping_status` CHECK constraint matching canonical code constants.

**Dependencies:** R001_normalize_shipping_status.sql MUST run first.

**Why new migration:** Migration 009 was never applied and has a CHECK constraint that would crash on existing `'pending'` values. Per policy, 009 cannot be modified. A new migration with the same CHECK (correctly excluding `'pending'`) is required, with the precondition handled by the repair script.

**SQL structure:**
```sql
-- Orders: shipping metadata columns
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipment_id VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS destination_area_id VARCHAR(50);

-- shipping_status CHECK constraint (matches shipping/types.ts)
-- NOTE: R001_normalize_shipping_status.sql MUST have run first
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'orders'::regclass
      AND conname = 'ck_orders_shipping_status'
  ) THEN
    ALTER TABLE orders ADD CONSTRAINT ck_orders_shipping_status
      CHECK (shipping_status IN (
        'confirmed', 'picking_up', 'dropping_off',
        'in_transit', 'delivered', 'cancelled', 'retry'
      ));
  END IF;
END $$;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipment_error TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_etd VARCHAR(50);

-- Products: numeric weight for shipping calculations
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight_grams INTEGER NOT NULL DEFAULT 100;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_shipment_id ON orders(shipment_id);
CREATE INDEX IF NOT EXISTS idx_orders_shipping_status ON orders(shipping_status);
```

**Columns added:** 6 (orders) + 1 (products) = 7
**CHECK constraint:** Matches `lib/services/shipping/types.ts` — excludes `'pending'` (safe after R001)

---

### Migration 015 — `015_tracking_columns.sql`

**Purpose:** Add Biteship tracking columns to `orders`.

**Dependencies:** None (only adds columns, no data migration).

**Why new migration:** Migration 010 was never applied. Per policy, 010 cannot be applied as-is (it's an existing file that shouldn't be retroactively run). A new migration with the same content is required.

**SQL structure:**
```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS last_tracking_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_payload JSONB;

CREATE INDEX IF NOT EXISTS idx_orders_last_tracking_at
  ON orders(last_tracking_at DESC NULLS LAST);
```

**Columns added:** 2

---

## 7. REPAIR SCRIPTS

### R001 — `R001_normalize_shipping_status.sql`

**Purpose:** Map legacy `shipping_status = 'pending'` to `'confirmed'` before the CHECK constraint is added in migration 014.

**Business justification:** Three existing orders in the live database have `shipping_status = 'pending'`. This value is not defined in the canonical `SHIPPING_STATUS` enum (`lib/services/shipping/types.ts`). The value `'confirmed'` is the logical equivalent — it means "order received, awaiting pickup." This mapping preserves order history while aligning with the canonical state machine.

**Expected rows affected:** 3 of 3 (all existing orders)

**SQL structure:**
```sql
UPDATE orders
SET shipping_status = 'confirmed'
WHERE shipping_status = 'pending';
```

**Safety:** Idempotent. Re-running has no effect after the first run. Does not depend on any column that doesn't exist.

---

## 8. VERIFICATION SEQUENCE

### Per-Migration Verification

#### After Migration 011 (contacts table)

| Layer | How to Verify | Expected Result |
|---|---|---|
| Schema | `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'contacts');` | `true` |
| Schema | `SELECT column_name FROM information_schema.columns WHERE table_name = 'contacts' ORDER BY ordinal_position;` | id, name, email, phone, message, created_at |
| API | `curl -X POST /api/contact -H "Content-Type: application/json" -d '{"name":"Test","email":"a@b.com","message":"Hello"}'` | HTTP 201 or 200 (not 500) |
| Admin Orders | N/A (independent table, not in admin orders UI) | No change |

#### After Migration 012 (products.images)

| Layer | How to Verify | Expected Result |
|---|---|---|
| Schema | `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'images';` | 1 row: ('images', 'ARRAY') |
| Schema | `SELECT images FROM products LIMIT 1;` | `null` (no backfill — expected) |
| Repository | Product queries still work via `product_images` JOIN | ✅ No change |
| API | `GET /api/products` still returns product data with image URLs | ✅ No change |
| Admin Orders | N/A (products page unaffected by this nullable column) | No change |

#### After Migration 013 (order management columns)

| Layer | How to Verify | Expected Result |
|---|---|---|
| Schema | `SELECT count(*) = 7 FROM information_schema.columns WHERE table_name = 'orders' AND column_name IN ('waybill_id','paid_at','shipped_at','completed_at','cancelled_at','cancellation_reason','admin_notes');` | `true` |
| Schema | `SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'weight_grams');` | `true` |
| Schema | `SELECT count(*) > 0 FROM pg_constraint WHERE conrelid = 'orders'::regclass AND conname = 'orders_fulfillment_status_check';` | `true` |
| Repository | `OrderRepository.findByWaybillId('test')` — queries without error | Runs (returns null for nonexistent waybill) |
| Repository | `OrderRepository.updateFulfillmentStatus(...)` — queries without error | Runs (may fail logically if order doesn't exist, but no 42703) |
| API | `POST /api/admin/orders/[id]/actions -d '{"action":"cancel"}'` — no 42703 | Returns 200 or 422 (logical), not 500 |
| API | `POST /api/admin/orders/[id]/notes -d '{"notes":"test"}'` — no 42703 | Returns 200, not 500 |
| API | `POST /api/admin/orders/[id]/receipt` — no 42703 | Returns PDF buffer, not 500 |
| Admin Orders | Open Admin → Orders → click an order → detail page renders | No console/server errors |
| Admin Orders | Click "Batalkan" on an order | Cancel action completes (or returns logical error, not crash) |

#### After R001 + Migration 014 (shipping columns)

| Layer | How to Verify | Expected Result |
|---|---|---|
| R001 data | `SELECT count(*) FROM orders WHERE shipping_status = 'pending';` | 0 |
| R001 data | `SELECT count(*) FROM orders WHERE shipping_status = 'confirmed';` | 3 |
| Schema | `SELECT count(*) = 6 FROM information_schema.columns WHERE table_name = 'orders' AND column_name IN ('shipment_id','destination_area_id','shipping_status','shipment_error','delivered_at','courier_etd');` | `true` |
| Schema | `SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'weight_grams');` | `true` |
| Schema | `SELECT count(*) > 0 FROM pg_constraint WHERE conrelid = 'orders'::regclass AND conname = 'ck_orders_shipping_status';` | `true` |
| Repository | `OrderRepository.updateShipmentInfo(...)` — no 42703 | Runs |
| API | `POST /api/admin/orders/[id]/shipment -d '{...}'` — no 42703 | Returns 200 or 422 (logical), not 500 |
| Admin Orders | Try to create a shipment for an order | Shipment form submits (may fail on Biteship API, but no DB crash) |

#### After Migration 015 (tracking columns)

| Layer | How to Verify | Expected Result |
|---|---|---|
| Schema | `SELECT count(*) = 2 FROM information_schema.columns WHERE table_name = 'orders' AND column_name IN ('last_tracking_at','tracking_payload');` | `true` |
| Repository | `OrderRepository.updateTrackingInfo(...)` — no 42703 | Runs |
| API | `POST /api/admin/orders/[id]/tracking` — no 42703 | Returns 200 or 422 (logical), not 500 |
| Admin Orders | Click "Lacak" on an order with waybill | Tracking panel loads (may show empty data if no real tracking, but no crash) |

### Final Full Verification

```sql
-- 1. All 14 new orders columns exist
SELECT count(*) = 14 FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name IN (
  'waybill_id','paid_at','shipped_at','completed_at','cancelled_at',
  'cancellation_reason','admin_notes','shipment_id','destination_area_id',
  'shipping_status','shipment_error','delivered_at','courier_etd',
  'last_tracking_at','tracking_payload'
);

-- 2. weight_grams exists on order_items
SELECT EXISTS (SELECT FROM information_schema.columns 
WHERE table_name = 'order_items' AND column_name = 'weight_grams');

-- 3. weight_grams exists on products
SELECT EXISTS (SELECT FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'weight_grams');

-- 4. images exists on products
SELECT EXISTS (SELECT FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'images');

-- 5. contacts table exists
SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'contacts');

-- 6. No pending shipping_status values remain
SELECT count(*) = 0 FROM orders WHERE shipping_status = 'pending';

-- 7. All 3 orders migrated to confirmed
SELECT count(*) = 3 FROM orders WHERE shipping_status = 'confirmed';

-- 8. fulfillment_status CHECK exists
SELECT count(*) > 0 FROM pg_constraint 
WHERE conrelid = 'orders'::regclass AND conname = 'orders_fulfillment_status_check';

-- 9. shipping_status CHECK exists
SELECT count(*) > 0 FROM pg_constraint 
WHERE conrelid = 'orders'::regclass AND conname = 'ck_orders_shipping_status';

-- 10. No columns on any repository produce 42703
-- Manual: execute each repository method that was previously blocked
```

---

## 9. ROLLBACK SEQUENCE

Reverse order of execution. Each step is independent.

```sql
-- STEP 6 REVERT (migration 015)
DROP INDEX IF EXISTS idx_orders_last_tracking_at;
ALTER TABLE orders DROP COLUMN IF EXISTS last_tracking_at;
ALTER TABLE orders DROP COLUMN IF EXISTS tracking_payload;

-- STEP 5 REVERT (migration 014)
DROP INDEX IF EXISTS idx_orders_shipment_id;
DROP INDEX IF EXISTS idx_orders_shipping_status;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS ck_orders_shipping_status;
ALTER TABLE orders DROP COLUMN IF EXISTS shipment_id;
ALTER TABLE orders DROP COLUMN IF EXISTS destination_area_id;
ALTER TABLE orders DROP COLUMN IF EXISTS shipment_error;
ALTER TABLE orders DROP COLUMN IF EXISTS delivered_at;
ALTER TABLE orders DROP COLUMN IF EXISTS courier_etd;
ALTER TABLE products DROP COLUMN IF EXISTS weight_grams;

-- STEP 4 REVERT (R001 repair)
UPDATE orders SET shipping_status = 'pending' WHERE shipping_status = 'confirmed';

-- STEP 3 REVERT (migration 013)
ALTER TABLE orders DROP COLUMN IF EXISTS waybill_id;
ALTER TABLE orders DROP COLUMN IF EXISTS paid_at;
ALTER TABLE orders DROP COLUMN IF EXISTS shipped_at;
ALTER TABLE orders DROP COLUMN IF EXISTS completed_at;
ALTER TABLE orders DROP COLUMN IF EXISTS cancelled_at;
ALTER TABLE orders DROP COLUMN IF EXISTS cancellation_reason;
ALTER TABLE orders DROP COLUMN IF EXISTS admin_notes;
ALTER TABLE order_items DROP COLUMN IF EXISTS weight_grams;
DROP INDEX IF EXISTS idx_orders_fulfillment_status;
DROP INDEX IF EXISTS idx_orders_waybill_id;
DROP INDEX IF EXISTS idx_orders_created_at_desc;
-- fulfillment_status CHECK is NOT reverted to old values (backward-compatible)

-- STEP 2 REVERT (migration 012)
ALTER TABLE products DROP COLUMN IF EXISTS images;

-- STEP 1 REVERT (migration 011)
DROP TABLE IF EXISTS contacts;
```

---

## 10. RISKS

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | R001 runs after 014 | Low | Migration 014 DDL fails on CHECK constraint (existing `pending` values violate it) | Document step order in execution checklist; run R001 immediately before 014 |
| 2 | `products.weight_grams = 100` default wrong for existing products | Medium | Incorrect shipping weight calculation for 3 existing products | Existing `weight` text column remains as source of truth; admin can correct after PR-1 |
| 3 | `products.images` column never populated (backfill skipped) | Certain | Column exists but is NULL for all products | Acceptable — codebase uses `product_images` JOIN, not `products.images` directly |
| 4 | Old migration files 002/007/008/009/010 accidentally re-run | Low | 002 backfill would crash (42703); 009 CHECK would crash (pending values) | Remove temptation: document in README or AGENTS.md that these are deprecated |
| 5 | `fulfillment_status_check` drops custom CHECK values | Low | If someone added custom values, they're silently removed | Source of truth is `payment/types.ts`; no customization expected |
| 6 | Index creation locks `orders` table | Very Low (3 rows only) | Sub-millisecond lock | Acceptable — no production traffic concern |
| 7 | Concurrent user creates order with `shipping_status = 'pending'` between R001 and 014 | Very Low | New row would cause 014 CHECK to fail | Acceptable risk — user must actively submit checkout in the window; retry 014 after fixing new row |

---

## 11. FILES TO CREATE (PREPARATION OUTPUT)

| File | Type | Purpose |
|---|---|---|
| `db/supabase_migrations/011_create_contacts_table.sql` | Migration | Create contacts table |
| `db/supabase_migrations/012_add_product_images_column.sql` | Migration | Add images to products |
| `db/supabase_migrations/013_order_management_columns.sql` | Migration | Add fulfillment columns + CHECK + indexes |
| `db/supabase_migrations/014_shipping_columns.sql` | Migration | Add shipping columns + CHECK + indexes |
| `db/supabase_migrations/015_tracking_columns.sql` | Migration | Add tracking columns + index |
| `db/supabase_migrations/R001_normalize_shipping_status.sql` | Repair | Map pending → confirmed (run before 014) |
| *(no existing files modified)* | | |

**Total new files:** 7 (5 migrations + 1 repair + 1 plan document)

**Zero existing files modified.**

---

## 12. EXECUTION CHECKLIST (for approval gate)

- [ ] All 5 new migration files approved by tech lead
- [ ] Repair script R001 approved by tech lead
- [ ] DATABASE_ALIGNMENT_PLAN.md approved by tech lead
- [ ] Old migration files 002, 007, 008, 009, 010 marked as superseded in project docs
- [ ] Execution environment ready (Supabase SQL Editor or psql + service_role_key)
- [ ] Rollback scripts prepared and accessible
- [ ] Verification queries prepared and accessible
- [ ] Application can be put in maintenance mode (optional — all DDL is additive, zero-downtime)

---

*End of Plan — No SQL has been executed. No database has been modified. No existing files have been altered.*
