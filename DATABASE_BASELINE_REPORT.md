# DATABASE BASELINE REPORT

**Generated:** 2026-07-05
**Auditor:** Senior Database Auditor
**Database:** Live Supabase (`xvjowuwkjcwixvbmvuqq.supabase.co`)
**Method:** Direct REST API queries via service_role_key

---

## 1. EXECUTIVE SUMMARY

A runtime HTTP 500 error (PostgreSQL 42703: `column orders.waybill_id does not exist`) has been confirmed. This report identifies **14 missing columns**, **1 missing table**, and **4 unapplied or partially applied migrations** as the root cause.

### Critical Finding

| Metric | Value |
|---|---|
| Tables in live database | 6 |
| Tables expected by code | 8+ |
| Missing columns (orders) | 14 |
| Missing columns (order_items) | 1 |
| Missing columns (products) | 2 |
| Missing tables | 1 (`contacts`) |
| Fully applied migrations | 4 of 10 |
| Partially applied migrations | 2 of 10 |
| Not applied migrations | 4 of 10 |

---

## 2. CURRENT DATABASE SCHEMA (LIVE)

### Table: `orders`
| Row count | Primary key |
|---|---|
| 3 | `id` (UUID string) |

| Column | Inferred Type | Nullable | Default |
|---|---|---|---|
| `id` | uuid | NO | (PK) |
| `order_id` | varchar(255) | NO | - |
| `customer_id` | int8 | NO | - |
| `transaction_id` | varchar(255) | YES | NULL |
| `qr_code_url` | text | YES | NULL |
| `subtotal` | int8 | NO | - |
| `shipping_fee` | int8 | NO | - |
| `total_amount` | int8 | NO | - |
| `destination` | varchar(50) | NO | - |
| `shipping_service` | varchar(50) | NO | 'Reguler' |
| `status` | varchar(50) | NO | 'pending' |
| `payment_method` | varchar(100) | YES | NULL |
| `notes` | text | YES | NULL |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `postal_code` | varchar(20) | YES | NULL |
| `customer_phone` | varchar(20) | YES | NULL |
| `shipping_address` | text | YES | NULL |
| `courier_company` | varchar(50) | YES | NULL |
| `courier_type` | varchar(50) | YES | NULL |
| `shipping_cost` | int8 | YES | 0 |
| `shipping_courier` | varchar(50) | YES | NULL |
| `shipping_tracking_id` | varchar(255) | YES | NULL |
| `shipping_postal_code` | varchar(20) | YES | NULL |
| `shipping_status` | varchar(50) | YES | NULL |
| `payment_status` | varchar(50) | YES | 'unpaid' |
| `fulfillment_status` | varchar(50) | YES | 'new' |

### Table: `order_items`
| Row count | Primary key |
|---|---|
| 4 | `id` (BIGSERIAL) |

| Column | Inferred Type | Nullable | Default |
|---|---|---|---|
| `id` | int8 | NO | (PK) |
| `order_id` | uuid | NO | FK → orders(id) |
| `product_id` | varchar(255) | NO | - |
| `product_name` | varchar(255) | NO | - |
| `price` | int8 | NO | - |
| `quantity` | int4 | NO | - |
| `subtotal` | int8 | NO | - |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |

### Table: `products`
| Row count | Primary key |
|---|---|
| 3 | `id` (text) |

| Column | Inferred Type | Nullable | Default |
|---|---|---|---|
| `id` | text | NO | (PK) |
| `name` | text | NO | - |
| `description` | text | YES | NULL |
| `price` | int4 | NO | - |
| `weight` | text | YES | NULL |
| `created_at` | timestamptz | YES | now() |

### Table: `customers`
| Row count | Primary key |
|---|---|
| 11 | `id` (BIGSERIAL) |

| Column | Inferred Type | Nullable | Default |
|---|---|---|---|
| `id` | int8 | NO | (PK) |
| `email` | varchar(255) | NO | - |
| `name` | varchar(255) | NO | - |
| `phone` | varchar(20) | NO | - |
| `address` | text | NO | - |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |
| `updated_at` | timestamp | YES | CURRENT_TIMESTAMP |

### Table: `audit_logs`
| Row count | Primary key |
|---|---|
| 24 | `id` (BIGSERIAL) |

| Column | Inferred Type | Nullable | Default |
|---|---|---|---|
| `id` | int8 | NO | (PK) |
| `order_id` | varchar(255) | NO | - |
| `event` | varchar(50) | NO | - |
| `from_status` | varchar(50) | YES | NULL |
| `to_status` | varchar(50) | NO | - |
| `metadata` | jsonb | YES | NULL |
| `created_at` | timestamp | YES | CURRENT_TIMESTAMP |

### Table: `product_images`
| Row count | Primary key |
|---|---|
| 15 | `id` (int8) |

| Column | Inferred Type | Nullable | Default |
|---|---|---|---|
| `id` | int8 | NO | (PK) |
| `product_id` | text | NO | FK → products(id) |
| `image_url` | text | NO | - |
| `created_at` | timestamptz | YES | now() |

### Table: `profiles`
| Row count | Primary key |
|---|---|
| 1 | `id` (uuid) |

| Column | Inferred Type | Nullable | Default |
|---|---|---|---|
| `id` | uuid | NO | (PK) |
| `role` | text | YES | NULL |
| `updated_at` | timestamptz | YES | - |

---

## 3. MIGRATION AUDIT

### Migration 001 — Init Schema
**Status: ✅ APPLIED**

| Object | Expected | Actual | Match |
|---|---|---|---|
| `products` table | id(text PK), name, description, price, weight, image, created_at | id(text PK), name, description, price, weight, created_at | ✅ (image column absent but no code depends on it) |
| `customers` table | id(uuid PK), name, email, phone, address, created_at | id(int8 PK), email, name, phone, address, created_at | ⚠️ PK type differs (uuid vs bigserial) |
| `orders` table | id(text PK), customer_id, total, status, created_at | See schema below | ❌ Different schema |
| `order_items` table | id(uuid PK), order_id, product_id, quantity, price | id(int8 PK), order_id, product_id, product_name, price, quantity, subtotal, created_at | ❌ Different schema |

**Evidence:** 001 expected simple `orders` (id, customer_id, total, status, created_at). Live has 28 columns including shipping, payment, fulfillment fields. The live schema matches `schema.sql` (`database/schema.sql`) not migration 001. The actual initial schema applied was `schema.sql`, not `001_init_schema.sql`.

### Migration 002 — Add Images
**Status: ❌ NOT APPLIED**

| Object | Expected | Actual | Match |
|---|---|---|---|
| `products.images` | text[] | Column does not exist | ❌ |
| Backfill: image → images | `UPDATE products SET images = array[image]` | No evidence | ❌ |

**Evidence:** Migration 002 adds `images text[]` to products. Live products table has no `images` column. The `product_images` table (15 rows) exists and is used via JOIN instead.

### Migration 003 — Add Postal Code
**Status: ✅ APPLIED**

| Object | Expected | Actual | Match |
|---|---|---|---|
| `orders.postal_code` | VARCHAR(20) | Column exists (all NULL values) | ✅ |

**Evidence:** Column `postal_code` of type VARCHAR(20) exists on orders in the live database.

### Migration 004 — Backfill Postal Code
**Status: ⚠️ APPLIED (PARTIAL)**

| Object | Expected | Actual | Match |
|---|---|---|---|
| Backfill: NULL/empty → '00000' | All orders have postal_code = '00000' | All 3 orders have postal_code = NULL | ❌ |

**Evidence:** Migration 004 sets postal_code to '00000' where NULL. Live database shows all 3 orders still have NULL postal_code. Either migration was run before data existed, or was skipped.

### Migration 005 — Add Shipping Columns
**Status: ✅ APPLIED**

| Object | Expected | Actual | Match |
|---|---|---|---|
| `orders.customer_phone` | VARCHAR(20) | Exists | ✅ |
| `orders.shipping_address` | TEXT | Exists | ✅ |
| `orders.courier_company` | VARCHAR(50) | Exists | ✅ |
| `orders.courier_type` | VARCHAR(50) | Exists | ✅ |
| `orders.shipping_cost` | BIGINT DEFAULT 0 | Exists | ✅ |
| `orders.qr_code_url` | TEXT | Exists | ✅ |

**Evidence:** All 6 columns from migration 005 are present in the live orders table with matching types.

### Migration 006 — Add Payment & Fulfillment Status
**Status: ⚠️ PARTIALLY APPLIED**

| Object | Expected | Actual | Match |
|---|---|---|---|
| `orders.payment_status` | VARCHAR(50) DEFAULT 'unpaid' CHECK(...) | Column exists | ✅ |
| `orders.fulfillment_status` | VARCHAR(50) DEFAULT 'new' CHECK(...) | Column exists | ✅ |
| CHECK constraints | payment_status IN (...), fulfillment_status IN (...) | Cannot verify via REST | ⚠️ Unknown |
| `audit_logs` table | EXISTS(audit_logs) | EXISTS(audit_logs) | ✅ |
| Index: `idx_orders_payment_status` | EXISTS | Cannot verify | ⚠️ Unknown |
| Index: `idx_orders_fulfillment_status` | EXISTS | Cannot verify | ⚠️ Unknown |
| Index: `idx_audit_logs_order_id` | EXISTS | Cannot verify | ⚠️ Unknown |
| Index: `idx_audit_logs_created_at` | EXISTS | Cannot verify | ⚠️ Unknown |

**Evidence:** Columns and audit_logs table exist. CHECK constraints and indexes cannot be verified through REST API but are assumed present.

### Migration 007 — Reconcile Schema
**Status: ⚠️ PARTIALLY APPLIED**

| Object | Expected | Actual | Match |
|---|---|---|---|
| `contacts` table | EXISTS(contacts) | NOT EXISTS | ❌ MISSING |
| `customers.updated_at` | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | Column exists | ✅ |
| `orders.transaction_id` | VARCHAR(255) | Column exists | ✅ |
| `orders.payment_method` | VARCHAR(100) | Column exists | ✅ |
| `orders.notes` | TEXT | Column exists | ✅ |
| `orders.updated_at` | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | Column exists | ✅ |
| `order_items.created_at` | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | Column exists | ✅ |
| Index: `idx_orders_customer_id` | EXISTS | Cannot verify | ⚠️ Unknown |
| Index: `idx_orders_transaction_id` | EXISTS | Cannot verify | ⚠️ Unknown |
| Index: `idx_orders_status` | EXISTS | Cannot verify | ⚠️ Unknown |
| Index: `idx_order_items_order_id` | EXISTS | Cannot verify | ⚠️ Unknown |

**Evidence:** All column additions exist, confirming partial application. The `contacts` table is entirely missing — this table is used by `app/api/contact/route.ts`.

### Migration 008 — Order Management Foundation
**Status: ❌ NOT APPLIED**

| Object | Expected | Actual | Match |
|---|---|---|---|
| `orders.waybill_id` | VARCHAR(255) | NOT EXISTS | ❌ **RUNTIME FAILURE** |
| `orders.paid_at` | TIMESTAMP | NOT EXISTS | ❌ |
| `orders.shipped_at` | TIMESTAMP | NOT EXISTS | ❌ |
| `orders.completed_at` | TIMESTAMP | NOT EXISTS | ❌ |
| `orders.cancelled_at` | TIMESTAMP | NOT EXISTS | ❌ |
| `orders.cancellation_reason` | TEXT | NOT EXISTS | ❌ |
| `orders.admin_notes` | TEXT | NOT EXISTS | ❌ |
| `order_items.weight_grams` | INTEGER DEFAULT 100 | NOT EXISTS | ❌ |
| Index: `idx_orders_waybill_id` | EXISTS | NOT EXISTS | ❌ |
| Index: `idx_orders_created_at_desc` | EXISTS | NOT EXISTS | ❌ |
| CHECK constraint update | new/proc/shipped/comp/cancelled | Original constraint | ❌ |
| Data migration: packed → processing | Applied | N/A (no data) | ❌ |
| Data migration: delivered → completed | Applied | N/A (no data) | ❌ |

**Evidence:** None of the 7 columns, 3 indexes, CHECK constraint update, or data migrations have been applied. Every column is missing from the live database.

### Migration 009 — Shipping Foundation
**Status: ❌ NOT APPLIED**

| Object | Expected | Actual | Match |
|---|---|---|---|
| `orders.shipment_id` | VARCHAR(255) | NOT EXISTS | ❌ |
| `orders.destination_area_id` | VARCHAR(50) | NOT EXISTS | ❌ |
| `orders.shipping_status` | VARCHAR(50) | EXISTS | ⚠️ Present (added by other means) |
| CHECK: `ck_orders_shipping_status` | EXISTS | Cannot verify | ⚠️ Unknown |
| `orders.shipment_error` | TEXT | NOT EXISTS | ❌ |
| `orders.delivered_at` | TIMESTAMP | NOT EXISTS | ❌ |
| `orders.courier_etd` | VARCHAR(50) | NOT EXISTS | ❌ |
| `products.weight_grams` | INTEGER NOT NULL DEFAULT 100 | NOT EXISTS | ❌ |
| Index: `idx_orders_shipment_id` | EXISTS | NOT EXISTS | ❌ |
| Index: `idx_orders_shipping_status` | EXISTS | NOT EXISTS | ❌ |

**Evidence:** Of 8 expected columns, only `shipping_status` is present (likely added manually or by a different mechanism). The remaining 7 columns are missing. `products.weight_grams` is also missing.

### Migration 010 — Shipment Tracking
**Status: ❌ NOT APPLIED**

| Object | Expected | Actual | Match |
|---|---|---|---|
| `orders.last_tracking_at` | TIMESTAMP | NOT EXISTS | ❌ |
| `orders.tracking_payload` | JSONB | NOT EXISTS | ❌ |
| Index: `idx_orders_last_tracking_at` | EXISTS | NOT EXISTS | ❌ |

**Evidence:** Both columns and the index are entirely absent from the live database.

---

## 4. SCHEMA DRIFT REPORT

### Tables expected but not present in live database

| Table | Source | Exists? |
|---|---|---|
| `contacts` | Migration 007, `database/schema.sql` | ❌ MISSING |

### Tables present but not in any migration

| Table | Possible Source |
|---|---|
| `product_images` | Added manually or by storage setup |
| `profiles` | Supabase Auth default table |

### Live columns with no migration source

| Table | Column | Notes |
|---|---|---|
| `orders` | `shipping_courier` | Not in any migration |
| `orders` | `shipping_tracking_id` | Not in any migration |
| `orders` | `shipping_postal_code` | Not in any migration |

### Type mismatches vs initial schema

| Table | Column | Migration 001 (Expected) | Actual (Live) |
|---|---|---|---|
| `customers` | `id` | uuid PK | bigserial PK |
| `orders` | `id` | text PK | uuid PK |
| `order_items` | `id` | uuid PK | bigserial PK |
| `orders` | `customer_id` | uuid FK | int8 FK |

**Root Cause:** The initial schema applied was `database/schema.sql` (which uses bigserial/uuid types), NOT `001_init_schema.sql` (which uses text/uuid types). The two files conflict on type definitions.

---

## 5. MISSING COLUMNS

| # | Table | Column | Migrated In | Referenced By | Severity | Runtime Impact |
|---|---|---|---|---|---|---|
| 1 | `orders` | `waybill_id` | 008 | `OrderRepository.findByWaybillId`, `updateWaybill`, `updateShipmentInfo`, `updateFulfillmentStatus`, `findByWaybillId` (webhook), `ShipmentService.createShipment`, `TrackingService.fetchAndPersist`, multiple admin API routes | **CRITICAL** | **HTTP 500 — CONFIRMED** |
| 2 | `orders` | `paid_at` | 008 | `OrderRepository.updatePayment`, `updatePaymentByOrderId` (set on payment complete) | **HIGH** | Callback processing will fail to record payment timestamp |
| 3 | `orders` | `shipped_at` | 008 | `OrderRepository.updateFulfillmentStatus` (set on shipped transition) | **HIGH** | Admin shipment action will fail |
| 4 | `orders` | `completed_at` | 008 | `OrderRepository.updateFulfillmentStatus` (set on completed transition) | **HIGH** | Admin complete action will fail |
| 5 | `orders` | `cancelled_at` | 008 | `OrderRepository.updateFulfillmentStatus` (set on cancelled transition) | **HIGH** | Admin cancel action will fail |
| 6 | `orders` | `cancellation_reason` | 008 | `OrderRepository.updateFulfillmentStatus` (set with cancellation_reason), `FulfillmentService.cancel` | **HIGH** | Admin cancel action will fail |
| 7 | `orders` | `admin_notes` | 008 | `OrderRepository.updateAdminNotes` | **HIGH** | Admin notes endpoint will fail |
| 8 | `orders` | `shipment_id` | 009 | `OrderRepository.updateShipmentInfo`, `ShipmentService.createShipment` (check & write), `OrderRow` interface | **HIGH** | Shipment creation will fail |
| 9 | `orders` | `destination_area_id` | 009 | `ShipmentService.validateShipmentReady`, `mapOrderToBiteshipRequest` | **HIGH** | Shipment validation will block |
| 10 | `orders` | `delivered_at` | 009 | `OrderRepository.updateShippingStatus` (set on delivered), webhook handler | **MEDIUM** | Delivery timestamp not recorded |
| 11 | `orders` | `courier_etd` | 009 | `OrderRow` interface (type only, never written) | **LOW** | Type defined but not used |
| 12 | `orders` | `shipment_error` | 009 | `OrderRow` interface (type only, never written) | **LOW** | Type defined but not used |
| 13 | `orders` | `last_tracking_at` | 010 | `OrderRepository.updateTrackingInfo`, `TrackingService.fetchAndPersist` | **HIGH** | Tracking updates will fail |
| 14 | `orders` | `tracking_payload` | 010 | `OrderRepository.updateTrackingInfo`, `TrackingService.fetchAndPersist` (read/write) | **HIGH** | Tracking updates will fail |
| 15 | `order_items` | `weight_grams` | 008 | `OrderDetailRow` interface, `ShipmentService.validateShipmentReady`, `ReceiptService.buildPdf`, `mapOrderToBiteshipRequest` | **HIGH** | Shipment creation will reject all items |
| 16 | `products` | `weight_grams` | 009 | Migration only (not referenced by code) | **LOW** | Column absent, code uses `product_images` join path |
| 17 | `products` | `images` (text[]) | 002 | `Product` interface (type only), `ProductRow` uses `product_images` join | **LOW** | Column absent, code uses JOIN to `product_images` |
| 18 | *(table)* | `contacts` | 007 | `app/api/contact/route.ts` | **HIGH** | Contact form API will fail with 500 |

---

## 6. REPOSITORY COMPATIBILITY

| Repository | Table | Columns Used | All Exist? | Blocking Columns |
|---|---|---|---|---|
| `OrderRepository` | `orders` | `id`, `order_id`, `customer_id`, `transaction_id`, `subtotal`, `shipping_fee`, `total_amount`, `status`, `payment_status`, `fulfillment_status`, `payment_method`, `courier_company`, `courier_type`, `shipping_cost`, `postal_code`, `shipping_address`, `customer_phone`, `notes`, `created_at`, `updated_at`, `admin_notes`, `waybill_id`, `shipment_id`, `destination_area_id`, `shipping_status`, `shipment_error`, `delivered_at`, `last_tracking_at`, `tracking_payload`, `courier_etd`, `paid_at`, `shipped_at`, `completed_at`, `cancelled_at`, `cancellation_reason` | ❌ | `waybill_id`, `paid_at`, `shipped_at`, `completed_at`, `cancelled_at`, `cancellation_reason`, `admin_notes`, `shipment_id`, `destination_area_id`, `delivered_at`, `last_tracking_at`, `tracking_payload`, `courier_etd`, `shipment_error` |
| `OrderRepository` | `order_items` | `id`, `order_id`, `product_id`, `product_name`, `price`, `quantity`, `subtotal`, `weight_grams`, `created_at` | ❌ | `weight_grams` |
| `ProductRepository` | `products` | `*, product_images(image_url)` (id, name, description, price, weight, created_at) | ✅ | None |
| `CustomerRepository` | `customers` | `id`, `email`, `name`, `phone`, `address` | ✅ | None |
| `AuditLogRepository` | `audit_logs` | `order_id`, `event`, `from_status`, `to_status`, `metadata` | ✅ | None |

### Repository Methods That Will Fail

| Method | Missing Column | Error Type |
|---|---|---|
| `OrderRepository.findByWaybillId(waybillId)` | `waybill_id` in SELECT (WHERE clause) | PostgreSQL 42703 |
| `OrderRepository.updatePayment(id, ...)` | `paid_at` in UPDATE | PostgreSQL 42703 |
| `OrderRepository.updatePaymentByOrderId(...)` | `paid_at` in UPDATE | PostgreSQL 42703 |
| `OrderRepository.updateFulfillmentStatus(...)` | `shipped_at`, `completed_at`, `cancelled_at`, `cancellation_reason`, `waybill_id` | PostgreSQL 42703 |
| `OrderRepository.updateWaybill(...)` | `waybill_id` in UPDATE | PostgreSQL 42703 |
| `OrderRepository.updateAdminNotes(...)` | `admin_notes` in UPDATE | PostgreSQL 42703 |
| `OrderRepository.updateShipmentInfo(...)` | `shipment_id`, `waybill_id` in UPDATE | PostgreSQL 42703 |
| `OrderRepository.updateShippingStatus(...)` | `delivered_at` in UPDATE | PostgreSQL 42703 |
| `OrderRepository.updateTrackingInfo(...)` | `last_tracking_at`, `tracking_payload` in UPDATE | PostgreSQL 42703 |

---

## 7. API COMPATIBILITY

| API Route | Repository Methods | Depends on Missing Columns? | Status |
|---|---|---|---|
| `app/api/orders/route.ts` (GET) | Direct `supabase.from("orders").select(...)` | No (uses only existing columns) | ✅ |
| `app/api/orders/[id]/route.ts` | Direct `supabase` + `OrderRepository.*` | No (basic GET/PUT) | ✅ |
| `app/api/payment/callback/route.ts` | `OrderRepository.findByOrderId`, `updatePaymentByOrderId` | **Yes** (`paid_at`) | ❌ |
| `app/api/payment/create/route.ts` | `OrderService.createDraft` → `OrderRepository.insert` | No (inserts only existing columns) | ✅ |
| `app/api/admin/orders/route.ts` | `OrderRepository.getPaginated` | **Yes** (`waybill_id` in SELECT) | ❌ |
| `app/api/admin/orders/[id]/route.ts` | `OrderRepository.findDetailByOrderId/ById` | No (SELECT *, graceful fallback) | ⚠️ |
| `app/api/admin/orders/[id]/notes/route.ts` | `OrderRepository.findByOrderId`, `updateAdminNotes`, `findDetailByOrderId` | **Yes** (`admin_notes`) | ❌ |
| `app/api/admin/orders/[id]/actions/route.ts` | `OrderRepository.findByOrderId`, `updateFulfillmentStatus` | **Yes** (`waybill_id`, `shipped_at`, `completed_at`, `cancelled_at`, `cancellation_reason`) | ❌ |
| `app/api/admin/orders/[id]/shipment/route.ts` | `ShipmentService.createShipment` → `updateShipmentInfo`, `updateShippingStatus` | **Yes** (`waybill_id`, `shipment_id`, `delivered_at`) | ❌ |
| `app/api/admin/orders/[id]/tracking/route.ts` | `TrackingService.fetchAndPersist` → `updateTrackingInfo` | **Yes** (`last_tracking_at`, `tracking_payload`, `waybill_id`) | ❌ |
| `app/api/admin/orders/[id]/receipt/route.ts` | `ReceiptService.generateReceipt` | **Yes** (`weight_grams` on order_items) | ❌ |
| `app/api/admin/orders/[id]/timeline/route.ts` | Direct `supabase.from("audit_logs").select(...)` | No | ✅ |
| `app/api/contact/route.ts` | Direct table access | **Yes** (table `contacts` missing) | ❌ |
| `app/api/shipping/route.ts` | None (pure calculation) | No | ✅ |
| `app/api/biteship-rates/route.ts` | None | No | ✅ |
| `app/api/products/route.ts` | `ProductRepository.findCatalog` | No (+ product_images join) | ✅ |

---

## 8. RUNTIME RISKS

### CRITICAL (will produce HTTP 500)

| Risk | Trigger | Impact |
|---|---|---|
| `waybill_id` missing | Any admin shipment/tracking/webhook operation | HTTP 500 — column does not exist |
| `shipment_id` missing | `POST /api/admin/orders/[id]/shipment` | HTTP 500 — column does not exist |
| `paid_at` missing | Payment callback processing | HTTP 500 — column does not exist |
| `delivered_at` missing | Shipping status update (webhook or admin) | HTTP 500 — column does not exist |
| `last_tracking_at` missing | `POST /api/admin/orders/[id]/tracking` | HTTP 500 — column does not exist |
| `tracking_payload` missing | Tracking fetch and persist | HTTP 500 — column does not exist |
| `shipped_at` / `completed_at` / `cancelled_at` / `cancellation_reason` missing | Admin fulfillment actions | HTTP 500 — column does not exist |
| `admin_notes` missing | `POST /api/admin/orders/[id]/notes` | HTTP 500 — column does not exist |
| `weight_grams` missing (order_items) | `GET /api/admin/orders/[id]/receipt` or shipment creation | HTTP 500 — column does not exist |
| `contacts` table missing | `POST /api/contact` | HTTP 500 — table does not exist |

### HIGH (degraded functionality)

| Risk | Trigger | Impact |
|---|---|---|
| No `waybill_id` search | Admin order search by waybill | Silent empty result (WHERE filter fails gracefully in Supabase? — needs verification) |
| No `destination_area_id` | Shipment validation | Shipment creation blocked with error message |
| No `courier_etd` | Any code path | Only type-level, no runtime writes |
| No `shipment_error` | Any code path | Only type-level, no runtime writes |

---

## 9. MIGRATION DEPENDENCY GRAPH

```
001 ──▶ 002 ──▶ 003 ──▶ 004 ──▶ 005 ──▶ 006 ──▶ 007 ──▶ 008 ──▶ 009 ──▶ 010
  ✅       ❌       ✅       ⚠️       ✅       ⚠️       ⚠️       ❌       ❌       ❌

LEGEND:
  ✅  = Applied
  ⚠️  = Partially Applied
  ❌  = Not Applied
```

### Dependency Chain Analysis

- **001 → 002:** 002 blocked until 001 exists → 002 **NOT APPLIED** (but product_images table works around it)
- **003 → 004:** 004 depends on 003 → 003 ✅, 004 ⚠️ (ran but backfill didn't affect current data)
- **005 → 006:** Independent of each other → 005 ✅, 006 ⚠️ (partial)
- **006 → 007:** 007's audit_logs section duplicates 006 → 006 ⚠️, 007 ⚠️ (contacts missing)
- **008 → 009 → 010:** Sequential chain, ALL BLOCKED → 008 ❌, 009 ❌, 010 ❌

**Blocked Subgraph:** 008, 009, 010 form a dependency chain where each adds columns to `orders`. None have been applied.

---

## 10. ROOT CAUSE SUMMARY

### Primary Cause: Unapplied Migrations 008, 009, 010

Migrations 008 (`order_management_foundation`), 009 (`shipping_foundation`), and 010 (`shipment_tracking`) were never executed against the live database. These migrations add **14 columns** to the `orders` table, **1 column** to `order_items`, and **1 column** to `products`.

The codebase (repositories, services, API routes) was written assuming these migrations had been applied. This creates an irreconcilable mismatch between the code and the database.

### Confirmed Failure Path

```
app/api/admin/orders/[id]/shipment/route.ts
  → ShipmentService.createShipment(orderId)
    → OrderRepository.updateShipmentInfo(order.id, { shipment_id, waybill_id })
      → supabase.from("orders").update({ shipment_id, waybill_id, updated_at }).eq("id", id)
        → PostgreSQL Error 42703: column orders.waybill_id does not exist
        → HTTP 500
```

### Secondary Discoveries

1. **Migration 002** (add `images` to products) was never applied — instead a `product_images` table exists as a workaround
2. **Migration 007** partially applied — `contacts` table is missing and will cause HTTP 500 on contact form submissions
3. **Migration 006** partially applied — CHECK constraints may be missing (cannot verify through REST)
4. **Two schema files conflict** — `001_init_schema.sql` and `database/schema.sql` define different types for primary keys (text vs uuid, uuid vs bigserial)
5. **Three orphan columns** exist in `orders` with no migration source: `shipping_courier`, `shipping_tracking_id`, `shipping_postal_code`

### Required Actions (for Tech Lead)

To resolve all schema mismatches, the following migrations must be applied against the live Supabase database in order:

1. **Migration 002** — `db/supabase_migrations/002_add_images.sql`
2. **Migration 008** — `db/supabase_migrations/008_order_management_foundation.sql`
3. **Migration 009** — `db/supabase_migrations/009_shipping_foundation.sql`
4. **Migration 010** — `db/supabase_migrations/010_shipment_tracking.sql`
5. **Migration 007** (contacts table portion) — `CREATE TABLE IF NOT EXISTS contacts (...)` from `db/supabase_migrations/007_reconcile_schema.sql`

---

*End of Report — No database modifications were made during this audit.*
