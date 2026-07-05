# IMPLEMENTATION ROADMAP — ORDER DOMAIN

**Version:** 1.0
**Source:** ORDER_DOMAIN_SPECIFICATION.md (canonical)
**Strategy:** Bottom-up — Database → Repository → API → Frontend → Verify
**Principle:** System remains functional after every PR

---

## DEPENDENCY MAP

```
PR-1 Database  ←  applies migrations, creates missing objects
  ↓
PR-2 Repository  ←  fixes types, removes dead code, aligns with actual schema
  ↓
PR-3 API  ←  fixes routes, validation, error handling
  ↓
PR-4 Frontend  ←  aligns UI with canonical state machines
  ↓
PR-5 Runtime Verification  ←  end-to-end tests, smoke tests
```

**Each PR depends on all prior PRs.** PR-2 cannot be verified until PR-1 is applied. PR-3 cannot be verified until PR-2 is deployed. No PR may be merged out of order.

---

## PR-1: DATABASE ALIGNMENT

### Objective

Apply all pending migrations to bring the live database into compliance with the codebase. After this PR, every column referenced by the code **must exist** in the database.

### Background (from DATABASE_RELEASE_PLAN.md)

| Migration | Status | Issue | Fix |
|---|---|---|---|
| 002 | ❌ Unsafe | Backfill references non-existent `image` column | Remove backfill UPDATE |
| 007 (contacts) | ⚠️ Partial | `contacts` table missing | Full file is idempotent, safe to run |
| 008 | ❌ Not applied | 7 columns + weight_grams + CHECK + indexes missing | Safe to run as-is |
| 009 | ❌ Unsafe | CHECK constraint excludes `pending` | Pre-condition UPDATE required |
| 010 | ❌ Not applied | 2 columns + index missing | Safe to run as-is |

### Files Affected

| File | Change Type | Description |
|---|---|---|
| `db/supabase_migrations/002_add_images.sql` | **MODIFY** | Remove the backfill `UPDATE` statement (line 8). The `image` column does not exist in the live `products` table. |
| *(new)* `db/supabase_migrations/009_precondition.sql` | **CREATE** | Pre-condition UPDATE: `UPDATE orders SET shipping_status = 'confirmed' WHERE shipping_status = 'pending';` |
| No code files changed | — | This PR is SQL-only |

### Execution Plan

```
Step 1:  Run 009_precondition.sql      (maps pending → confirmed)
Step 2:  Run 002_add_images.sql         (modified — no backfill)
Step 3:  Run 007_reconcile_schema.sql   (creates contacts table, others skipped)
Step 4:  Run 008_order_management.sql   (adds 7 columns + weight_grams + indexes)
Step 5:  Run 009_shipping_foundation.sql (adds 5 columns + weight_grams + CHECK)
Step 6:  Run 010_shipment_tracking.sql   (adds 2 columns + index)
```

### Columns Added

| Table | Column | Type | Nullable |
|---|---|---|---|
| `orders` | `waybill_id` | VARCHAR(255) | YES |
| `orders` | `paid_at` | TIMESTAMP | YES |
| `orders` | `shipped_at` | TIMESTAMP | YES |
| `orders` | `completed_at` | TIMESTAMP | YES |
| `orders` | `cancelled_at` | TIMESTAMP | YES |
| `orders` | `cancellation_reason` | TEXT | YES |
| `orders` | `admin_notes` | TEXT | YES |
| `orders` | `shipment_id` | VARCHAR(255) | YES |
| `orders` | `destination_area_id` | VARCHAR(50) | YES |
| `orders` | `shipment_error` | TEXT | YES |
| `orders` | `delivered_at` | TIMESTAMP | YES |
| `orders` | `courier_etd` | VARCHAR(50) | YES |
| `orders` | `last_tracking_at` | TIMESTAMP | YES |
| `orders` | `tracking_payload` | JSONB | YES |
| `order_items` | `weight_grams` | INTEGER (DEFAULT 100) | YES |
| `products` | `weight_grams` | INTEGER NOT NULL (DEFAULT 100) | NO |
| `products` | `images` | TEXT[] | YES |
| *(new table)* | `contacts` | All columns | See schema |

### Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| 009 CHECK constraint fails if new orders have `pending` status | Low (pre-condition catches existing, no code writes `pending`) | Migration 009 fails | Run pre-condition immediately before 009 |
| `products.weight_grams NOT NULL DEFAULT 100` misrepresents actual product weight | Medium | Weight defaults to 100g for all existing products | Acceptable — existing `weight` text column preserved as source of truth |
| Index creation locks on large tables | Very Low (3 orders, 4 items, 3 products) | No impact | Acceptable |
| `002_add_images.sql` backfill crashes if `image` column exists (different schema) | Low (column absent in live) | Would crash | Remove backfill as instructed |

### Verification

```sql
-- Verify all 14 new columns exist on orders
SELECT count(*) = 14 FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name IN (
  'waybill_id','paid_at','shipped_at','completed_at','cancelled_at',
  'cancellation_reason','admin_notes','shipment_id','destination_area_id',
  'shipment_error','delivered_at','courier_etd','last_tracking_at','tracking_payload'
);

-- Verify weight_grams exists on order_items and products
SELECT count(*) = 2 FROM information_schema.columns 
WHERE (table_name = 'order_items' OR table_name = 'products') 
  AND column_name = 'weight_grams';

-- Verify contacts table exists
SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'contacts');

-- Verify shipping_status CHECK constraint exists
SELECT count(*) > 0 FROM pg_constraint 
WHERE conrelid = 'orders'::regclass AND conname = 'ck_orders_shipping_status';
```

### Rollback

Every column added here is nullable (except `products.weight_grams`). Rollback per column:
```sql
ALTER TABLE orders DROP COLUMN IF EXISTS ...;  -- per column
ALTER TABLE order_items DROP COLUMN IF EXISTS weight_grams;
ALTER TABLE products DROP COLUMN IF EXISTS weight_grams;
ALTER TABLE products DROP COLUMN IF EXISTS images;
DROP TABLE IF EXISTS contacts;
DROP INDEX IF EXISTS ...;  -- per index
```

### Estimated Impact

| Metric | Value |
|---|---|
| Lines of SQL | ~180 (5 migration files) |
| Lines of code changed | 0 |
| Files modified | 1 (`002_add_images.sql`) |
| Files created | 1 (`009_precondition.sql`) |
| New columns | 17 |
| New table | 1 |
| Downtime required | None (all `IF NOT EXISTS`, zero-downtime DDL) |

---

## PR-2: REPOSITORY ALIGNMENT

### Objective

Align all repository types, interfaces, and methods with the now-complete database schema. Remove dead code, fix type mismatches, and eliminate dual implementations.

### Files Affected

| File | Change Type | Description |
|---|---|---|
| `lib/repositories/order.repository.ts` | **MODIFY** | See 6 sub-tasks below |
| `lib/repositories/order.repository.ts` — `InsertOrderParams` | **MODIFY** | Add `shipping_address`, `postal_code` to interface (already in INSERT but not in type). Add missing `destination` and `shipping_service` to `OrderRow` (they exist in DB and are returned by `SELECT *`). |
| `lib/repositories/order.repository.ts` — `OrderRow` | **MODIFY** | Remove `courier_etd` and `shipment_error` if they are truly never read/written (type-only clutter). See note below. |
| `lib/repositories/order.repository.ts` — `updatePayment` | **MODIFY** | Remove duplicate code — `updatePayment` and `updatePaymentByOrderId` are identical except for WHERE clause. Extract shared logic. |
| `lib/services/payment/callback.ts` | **REMOVE or DEPRECATE** | Dual implementation. Route uses `order.service.ts`. This file is dead code or orphan. See risk note. |
| `lib/services/order.service.ts` | **MODIFY** | Replace direct `order.status` legacy fallback with explicit null handling. |
| `lib/services/fulfillment.service.ts` | **MODIFY** | Replace direct `order.status` legacy fallback with explicit null handling. |
| `lib/repositories/index.ts` | **VERIFY** | Ensure all exports are correct after changes. |

### Sub-task 1: Align `OrderRow` with Actual Database

**Current issue:** `OrderRow` is missing `destination` and `shipping_service` even though they are written by `insert()` and returned by `SELECT *`. The TypeScript type is narrower than the actual data.

**Change:** Add to `OrderRow`:
```typescript
destination: string;
shipping_service: string;
```

**Also consider:** The legacy `status` column. It exists in the DB. It's used as fallback. Should it remain in `OrderRow`? **Yes** — three code paths use it as fallback. Document with comment: `// Legacy status column — use payment_status or fulfillment_status instead`.

### Sub-task 2: Remove Dual Callback Implementation

**Current issue:** Two files implement the same Midtrans callback logic:
- `lib/services/payment/callback.ts` — direct Supabase calls (simpler, but misses audit logging, state machine validation, gross amount check)
- `lib/services/order.service.ts` — full validation via `processCallback` method (used by the callback API route)

**Change:** Either:
- **Option A (Recommended):** Delete `lib/services/payment/callback.ts` after verifying it is not imported anywhere.
- **Option B:** If it IS imported elsewhere, refactor those callers to use `OrderService.processCallback` instead, then delete the file.

**Verification:** `rg "callback" --include "*.ts" --include "*.tsx"` — grep for imports of `./callback` or `payment/callback`.

### Sub-task 3: Clean Up `OrderRow` Vestigial Fields

**Current issue:** `courier_etd` and `shipment_error` are defined in `OrderRow` but never written by any repository method. They are consumed by zero code paths.

**Change:** Keep the columns in `OrderRow` (they exist in DB after PR-1). Add `@deprecated` JSDoc if desired, or remove from type if they will never be used. **Recommended:** Keep in `OrderRow` for future use, but do not remove from DB.

### Sub-task 4: Consolidate `updatePayment` / `updatePaymentByOrderId`

**Current issue:** Two methods with identical logic, differing only in WHERE clause (`id` vs `order_id`).

**Change:** Extract shared update logic into a private helper:
```typescript
function buildPaymentUpdate(params: {...}): Record<string, unknown> { ... }
```
Then both methods call the helper.

### Sub-task 5: Eliminate Legacy `status` Fallback

**Current issue:** Three places use `order.status` as a fallback when `payment_status` or `fulfillment_status` is null:

| File | Line | Expression |
|---|---|---|
| `order.service.ts` | 150 | `order.payment_status ?? order.status` |
| `fulfillment.service.ts` | 105 | `order.payment_status ?? order.status ?? ""` |
| `shipping/receipt.service.ts` | 96 | `order.fulfillment_status ?? order.status ?? "-"` |

**Change:** After PR-1, `payment_status` and `fulfillment_status` will never be null for new orders. For existing orders (3 rows), both columns are populated. Replace with:
```typescript
// Before: order.payment_status ?? order.status
// After:  order.payment_status ?? "unpaid"
```
This removes the dependency on the legacy `status` column entirely.

### Sub-task 6: Add `destination` and `shipping_service` to `InsertOrderParams`

**Current issue:** These are written to DB but not in the `InsertOrderParams` return type. The `insert()` method uses `.select()` to return the created row, but TypeScript doesn't know about these fields.

**Change:** The `OrderRow` type already covers the return. If `destination` and `shipping_service` are added to `OrderRow` as recommended in sub-task 1, this is resolved.

### Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `callback.ts` is imported somewhere unexpected | Medium | Orphan delete breaks build | Run greps before deleting |
| Removing `status` fallback causes null display on existing orders with legacy `status` | Low (all 3 have `payment_status` populated) | UI shows null for `fulfillment_status` on receipt | Keep fallback but use `??` chain through both new columns first |
| `OrderRow` type change breaks consumers | Low (additive only) | TypeScript errors | Update affected consumers |

### Verification

```bash
# Build must pass
npm run build

# TypeScript must have zero errors
npx tsc --noEmit

# No references to deleted callback.ts file
rg "from.*callback" --include "*.ts" --include "*.tsx" | grep -v "route.ts" | grep -v "order.service"
```

### Rollback

Every change in this PR is a code change — rollback via `git revert`.

### Estimated Impact

| Metric | Value |
|---|---|
| Files modified | 3–4 |
| Files deleted | 1 (potentially) |
| Lines changed | ~50 |
| TypeScript errors expected before fix | ~3 (all from OrderRow missing fields) |
| TypeScript errors expected after fix | 0 |

---

## PR-3: API ALIGNMENT

### Objective

Fix all API routes to work correctly with the aligned database and repositories. Add missing validation, fix error handling, and ensure consistent response formats.

### Files Affected

| File | Change Type | Description |
|---|---|---|
| `app/api/admin/orders/[id]/actions/route.ts` | **MODIFY** | Add validation that `waybill_id` is provided for `ship` action. Improve error messages. |
| `app/api/admin/orders/[id]/shipment/route.ts` | **MODIFY** | Read `shipping_status` from updated order response. |
| `app/api/admin/orders/[id]/tracking/route.ts` | **MODIFY** | Return structured error codes instead of plain messages. |
| `app/api/admin/orders/[id]/notes/route.ts` | **MODIFY** | Fix metadata: `order.admin_notes` references column that previously didn't exist — now safe after PR-1. |
| `app/api/admin/orders/[id]/receipt/route.ts` | **VERIFY** | `weight_grams` now exists after PR-1 — verify receipt generation works. |
| `app/api/admin/orders/[id]/timeline/route.ts` | **VERIFY** | Audit logs already working — no change needed. |
| `app/api/contact/route.ts` | **MODIFY** | Remove the `"Could not find the table"` error handling — `contacts` table now exists. |
| `app/api/shipping/route.ts` | **NO CHANGE** | Flat rate shipping is independent. |
| `app/api/biteship-rates/route.ts` | **NO CHANGE** | Standalone, no dependency. |
| `app/api/payment/create/route.ts` | **MODIFY** | Clean up debug logging (`console.log` lines). Add structured error response. |
| `app/api/payment/callback/route.ts` | **VERIFY** | Already uses `OrderService.processCallback` — should work after PR-1 and PR-2. |

### Sub-task 1: Clean Up Payment Create Route Debug Logging

**Current issue:** `app/api/payment/create/route.ts` contains 20+ `console.log` statements emitting verbose `[STEP 1]` through `[STEP 6]` debug output in production. The `logStep` and `logFail` helper functions.

**Change:** Remove all `console.log`, `logStep`, and `logFail` calls. Replace with structured logging if needed. Remove the helper functions `logStep` and `logFail`.

### Sub-task 2: Add Ship Action Waybill Validation

**Current issue:** The `ship` action in `actions/route.ts` passes `waybill_id` to `FulfillmentService.ship()`, but validation occurs only in the service layer. The API route doesn't validate that `waybill_id` is provided when action is `ship`.

**Change:** Add route-level validation:
```typescript
if (action === "ship" && !waybill_id) {
  return NextResponse.json(
    { error: "Nomor resi wajib diisi untuk aksi ship." },
    { status: 400 },
  );
}
```

### Sub-task 3: Fix Contact Route Error Handling

**Current issue:** After PR-1, `contacts` table exists. The error branch `isMissingTable` can never trigger. Simplify to:
```typescript
if (error) {
  console.error("Supabase insert contact error:", error);
  return NextResponse.json(
    { error: `Gagal menyimpan pesan: ${error.message}` },
    { status: 500 },
  );
}
```

### Sub-task 4: Standardize Error Response Format

**Current issue:** Error responses have inconsistent formats:
- Some return `{ error: string }`
- Some return `{ success: false, message: string }`
- Some return `{ error: string, details: object }`

**Change:** Standardize all API error responses to:
```typescript
{
  success: false,
  error: string,        // machine-readable code (e.g., "ORDER_NOT_FOUND")
  message: string,      // human-readable message (e.g., "Order tidak ditemukan.")
  details?: unknown     // optional additional context
}
```

### Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Removing `console.log` hides production debugging capability | Medium | Harder to diagnose issues | Replace with structured logging only for errors, not for every step |
| Standardizing error responses breaks existing frontend consumers | Medium | Frontend may expect old format | Audit all frontend fetch calls for error format assumptions |
| `admin_notes` read in notes route returns `null` for existing orders | Low | Null displayed in UI | Handle null gracefully |

### Verification

```bash
# Build must pass
npm run build

# Test contact form submission (now that table exists)
curl -X POST /api/contact -d '{"name":"Test","email":"a@b.com","message":"Hello"}'
# Expected: 200

# Test admin order actions with actual order ID
curl -X POST /api/admin/orders/DJ-20260703-L73DUE37/actions \
  -d '{"action":"process"}'
# Expected: 200 (or 422 with reason)

# Verify no console.log in payment/create route
rg "console.log" app/api/payment/create/route.ts
# Expected: 0 matches
```

### Rollback

`git revert` of the PR commit. All route changes are isolated.

### Estimated Impact

| Metric | Value |
|---|---|
| Files modified | 5–6 |
| Lines changed | ~100 |
| Console.log removed | ~20+ |
| Error format changes | 3–4 routes |

---

## PR-4: FRONTEND ALIGNMENT

### Objective

Align the frontend order display with the canonical state machine. Ensure status values are displayed consistently, all actions are available based on the correct status, and the UI handles the full order lifecycle.

### Files Affected

| File | Change Type | Description |
|---|---|---|
| `components/admin/orders/order-actions.tsx` | **MODIFY** | See sub-task 1 |
| `components/admin/orders/order-timeline.tsx` | **VERIFY** | Timeline already reads from `audit_logs` — should work |
| `app/admin/orders/page.tsx` | **VERIFY** | Uses `useOrders` hook — should work after PR-2/PR-3 |
| `app/admin/orders/[id]/page.tsx` | **VERIFY** | Detail page — should work |
| `app/checkout/success/page.tsx` | **VERIFY** | Reads `order_id` from URL — should work |
| `app/checkout/failed/page.tsx` | **VERIFY** | Should work |
| `app/checkout/page.tsx` | **VERIFY** | Should work |
| `hooks/use-order-actions.ts` | **MODIFY** | See sub-task 2 |
| `hooks/use-orders.ts` | **VERIFY** | Already handles list — should work |
| `hooks/use-order-shipment.ts` | **MODIFY** | See sub-task 3 |
| `hooks/use-order-detail.ts` | **VERIFY** | Already handles detail — should work |
| `hooks/use-order-timeline.ts` | **VERIFY** | Already handles timeline — should work |

### Sub-task 1: Update `order-actions.tsx` Action Availability

**Current issue:** The `getActions` function determines which buttons to show based on `fulfillmentStatus` and `paymentStatus`. This must match the canonical state machine.

**Change:** Audit the action mapping against the canonical `VALID_FULFILLMENT_TRANSITIONS` from `fulfillment.service.ts:6-12`:

| Current Status | Allowed Actions | Buttons to Show |
|---|---|---|
| `new` | process, cancel | "Proses", "Batalkan" |
| `processing` | ship, cancel | "Kirim", "Batalkan" |
| `shipped` | complete | "Selesaikan" |
| `completed` | (none) | (none) |
| `cancelled` | (none) | (none) |

**Also:** The `create_shipment` action is separate from the fulfillment actions. The shipment button should show when:
- `fulfillmentStatus === "processing"`
- `paymentStatus === "paid"`
- `shipmentId === null`

### Sub-task 2: Update `use-order-actions.ts` for New Fields

**Current issue:** The hook passes data to the actions API. After PR-2 and PR-3, the response includes additional fields (`waybill_id`, `shipping_status`, etc.). The hook needs to handle these in the success callback.

**Change:** Update the hook's `onSuccess` data shape to include new fields. No functional changes needed — the API already returns the full order.

### Sub-task 3: Update `use-order-shipment.ts` Error Handling

**Current issue:** Error messages from the shipment API are displayed as-is. After PR-3, error format is standardized.

**Change:** Handle both old and new error formats in transition (or update after all APIs are aligned).

### Sub-task 4: Status Badge Colors

**Implement if not already done.** Ensure each status has a consistent badge color:

| Status | Color |
|---|---|
| `unpaid` / `new` | gray |
| `pending` / `processing` | yellow/amber |
| `paid` / `shipped` / `confirmed` | blue |
| `completed` / `delivered` | green |
| `failed` / `expired` / `cancelled` | red |

### Verification

```bash
# Build must pass
npm run build

# Manual testing checklist:
# 1. Navigate to /admin/orders — list loads, filters work
# 2. Click an order — detail loads with all fields
# 3. Actions: process → ship → complete flow works
# 4. Actions: cancel works from new and processing
# 5. Shipment creation button visible only when conditions met
# 6. Notes save and display
# 7. Timeline shows audit events
# 8. Receipt PDF generates
# 9. Tracking endpoint returns data (when waybill exists)
```

### Rollback

`git revert` of the PR commit. All frontend changes are isolated.

### Estimated Impact

| Metric | Value |
|---|---|
| Files modified | 3–4 |
| Lines changed | ~80 |
| TypeScript errors expected before fix | 0 (types already correct) |
| UI behavior changes | Button visibility, badge colors, error display |

---

## PR-5: RUNTIME VERIFICATION

### Objective

End-to-end verification that the complete order domain works correctly after all alignment PRs. This PR contains **zero code changes** — only test scripts and documentation.

### Files Affected

| File | Change Type | Description |
|---|---|---|
| `docs/order-domain-testing.md` | **CREATE** | Master test plan |
| *(optionally)* test files in project test directory | **CREATE** | Automated E2E tests if project has test infrastructure |

### Test Plan

#### Phase 1: Database Verification (automated SQL)

```sql
-- Verify every order column exists
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'orders'
ORDER BY ordinal_position;

-- Expected: 38+ columns (28 original + 14 new - duplicates)

-- Verify every order_items column exists (expected: 9 columns)
SELECT column_name FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'order_items'
ORDER BY ordinal_position;

-- Verify every products column exists (expected: 8 columns)
SELECT column_name FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'products'
ORDER BY ordinal_position;

-- Verify contacts table exists
SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'contacts');
```

#### Phase 2: Repository Verification

| Test | Method | Expected |
|---|---|---|
| `findByOrderId` with valid ID | Call with known `DJ-*` ID | Returns full `OrderRow` with all fields |
| `findByOrderId` with invalid ID | Call with nonexistent ID | Returns `null` |
| `findByWaybillId` (after migration) | Call with dummy waybill | Returns order or null |
| `insert` new order | Call with valid params | Returns created `OrderRow` |
| `insertItems` | Call with valid items | Success |
| `getPaginated` | Call with filters | Returns paginated results |

#### Phase 3: API Endpoint Verification

| Endpoint | Method | Test |
|---|---|---|
| `POST /api/payment/create` | Create new order | Returns `{ orderId, token, redirectUrl }` |
| `POST /api/payment/callback` | Simulate Midtrans callback | Returns `{ success: true, paymentStatus: "paid" }` |
| `POST /api/payment/callback` | Duplicate callback | Returns 200 with `callback.skipped` |
| `POST /api/payment/callback` | Invalid signature | Returns 422 |
| `POST /api/payment/callback` | Gross amount mismatch | Returns 422 |
| `GET /api/admin/orders` | List with filters | Returns paginated orders |
| `GET /api/admin/orders/[id]` | Get detail | Returns full order with items + customer |
| `POST /api/admin/orders/[id]/actions` | process | `fulfillment_status → "processing"` |
| `POST /api/admin/orders/[id]/actions` | ship (no payment) | 422 `"Cannot ship: payment is not paid"` |
| `POST /api/admin/orders/[id]/shipment` | Create shipment (no waybill columns before PR-1) | 500 (after PR-1: works) |
| `POST /api/admin/orders/[id]/notes` | Save notes | Returns updated order |
| `POST /api/contact` | Submit contact | Returns `{ success: true }` |

#### Phase 4: State Machine Verification

```
Test 1: Full happy path
  Create order → unpaid/new
  Callback → paid/new
  Admin process → paid/processing
  Admin ship → paid/shipped
  Admin complete → paid/completed

Test 2: Cancel path
  Create order → unpaid/new
  Admin cancel → unpaid/cancelled

Test 3: Cancel from processing
  Create order → unpaid/new
  Callback → paid/new
  Admin process → paid/processing
  Admin cancel → paid/cancelled

Test 4: Payment failure path
  Create order → unpaid/new
  Callback (failure) → failed/new

Test 5: Reject invalid transitions
  Try to ship from 'new' → rejected
  Try to complete from 'processing' → rejected
  Try to cancel from 'completed' → rejected
```

#### Phase 5: Integration Verification

| Scenario | Steps | Expected |
|---|---|---|
| Full checkout flow | Frontend → create payment → callback → admin process → ship → complete | All statuses update correctly |
| Receipt generation | Call receipt API for shipped/completed order | Returns PDF buffer |
| Tracking (with real Biteship) | Create shipment with valid data → call tracking | Returns tracking history |
| Duplicate order_id | Submit same order_id twice | First succeeds, second gets 409 |
| Order with missing address fields | Submit checkout missing postal_code | Validation error |

### Environment Requirements

| Requirement | Details |
|---|---|
| Test database | Same Supabase project (applied migrations) |
| Test API keys | Midtrans sandbox, Biteship test |
| Test products | Existing products in database (use known IDs) |
| Test customer | Existing customer or create during test |
| Midtrans callback | Use Midtrans sandbox dashboard or API to trigger callbacks |

### Success Criteria

| Criterion | Threshold |
|---|---|
| All database columns exist | 100% |
| All repository methods execute without error | 100% |
| All API endpoints return correct HTTP status codes | 100% |
| All state machine transitions produce correct statuses | 100% |
| Invalid transitions are rejected | 100% |
| Contact form submits without error | 100% |
| Build passes (`npm run build`) | Exit code 0 |
| TypeScript check passes (`npx tsc --noEmit`) | Exit code 0 |

### Estimated Impact

| Metric | Value |
|---|---|
| Files created | 1 (`docs/order-domain-testing.md`) |
| Lines of test code | ~200 (documentation) |
| Test scenarios | ~20 |
| Automated tests | 0 (unless test framework exists) |
| Manual test time | ~2 hours for full walkthrough |

---

## COMPLETE EXECUTION SUMMARY

| PR | Layer | Priority | Depends On | Risk Level | Est. Effort |
|---|---|---|---|---|---|
| PR-1 | Database | **CRITICAL** (blocking) | None | Medium | ~1 hour |
| PR-2 | Repository | **HIGH** | PR-1 | Low | ~2 hours |
| PR-3 | API | **HIGH** | PR-2 | Low | ~2 hours |
| PR-4 | Frontend | **MEDIUM** | PR-3 | Low | ~1 hour |
| PR-5 | Verification | **MEDIUM** | PR-4 | Low | ~3 hours |

**Total estimated effort:** ~9 hours for a single developer.

**Critical path:** PR-1 → PR-2 → PR-3 → PR-4 → PR-5 (cannot skip or reorder).

---

## BLOCKING ISSUES (must be resolved before PR-1)

1. **Migration 002 backfill** — Must be removed. The `UPDATE products SET images = array[image]` references a column `image` that does not exist in the live `products` table. Without this fix, PR-1 fails on step 2.

2. **Migration 009 CHECK constraint** — The `ck_orders_shipping_status` CHECK constraint excludes `'pending'`. All 3 existing orders have `shipping_status = 'pending'`. The pre-condition `UPDATE orders SET shipping_status = 'confirmed' WHERE shipping_status = 'pending'` must run before migration 009.

3. **Dual callback implementation** — Must resolve before PR-2. If `lib/services/payment/callback.ts` is dead code, delete it. If it's used, migrate callers to `OrderService.processCallback`.

---

## POST-MIGRATION CLEANUP (not assigned to any PR)

| Item | Description | Suggested Timing |
|---|---|---|
| Orphan columns: `shipping_courier`, `shipping_tracking_id`, `shipping_postal_code` | These exist in the database but have no migration source and are used by zero code paths. Consider removing after verifying no external dependence. | After PR-5 |
| Redundant columns: `shipping_cost` vs `shipping_fee` | Both store the same value. Consolidate to `shipping_fee` and drop `shipping_cost`. Requires code change in `InsertOrderParams` and `OrderRepository.insert`. | After PR-5 (separate cleanup PR) |
| Legacy column: `status` | After all code references to `status` are removed in PR-2, this column becomes unused. Can be dropped in a future migration. | After PR-5 (future) |
| Type mismatch: `customers.id` bigserial vs uuid | The initial schema created `customers.id` as bigserial, but the original migration expected uuid. This is non-breaking but architecturally inconsistent. | Future |

---

*End of Roadmap — No code or database changes were made during this planning phase.*
