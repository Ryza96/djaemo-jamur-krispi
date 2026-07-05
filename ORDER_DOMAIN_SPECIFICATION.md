# ORDER DOMAIN SPECIFICATION

**Version:** 1.0
**Status:** Draft
**Source:** Reverse-engineered from codebase implementation
**Last Updated:** 2026-07-05

---

## 1. ORDER LIFECYCLE

The order domain is governed by **three parallel state machines**:

| Machine | Scope | Initiated By |
|---|---|---|
| Payment | Financial settlement | Midtrans (payment gateway) + callback |
| Fulfillment | Internal processing | Admin actions |
| Shipping | Physical delivery | Biteship (logistics API) + webhook |

A **fourth dimension** — the legacy `status` column — acts as a fallback when `payment_status` or `fulfillment_status` is null.

```
┌─────────────────────────────────────────────────────┐
│                    ORDER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │   Payment    │  │ Fulfillment  │  │  Shipping  │ │
│  │   Status     │  │   Status     │  │   Status   │ │
│  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘ │
│         │                 │                 │        │
│         ▼                 ▼                 ▼        │
│  unpaid          new                 (null)          │
│  pending         processing          confirmed       │
│  paid            shipped             picking_up      │
│  failed          completed           dropping_off    │
│  expired         cancelled           in_transit      │
│                                       delivered     │
│                                       cancelled     │
│                                       retry          │
└─────────────────────────────────────────────────────┘
```

### Phase Overview

| Phase | Payment Status | Fulfillment Status | Shipping Status |
|---|---|---|---|
| 1. Draft Created | `unpaid` | `new` | `null` |
| 2. Midtrans Token Created | `pending` | `new` | `null` |
| 3. Payment Confirmed | `paid` | `new` | `null` |
| 4. Admin Processes | `paid` | `processing` | `null` |
| 5. Shipped | `paid` | `shipped` | `confirmed` |
| 6. In Transit | `paid` | `shipped` | `in_transit` |
| 7. Delivered | `paid` | `completed` | `delivered` |
| 8. Cancelled (any phase) | `paid`/`unpaid`/`pending` | `cancelled` | `cancelled` |

---

## 2. PAYMENT LIFECYCLE

### Definition

Payment lifecycle tracks financial settlement through the Midtrans payment gateway. It is independent from fulfillment and shipping — an order can be `paid` but not yet processed.

### Allowed Statuses

| Status | Constant | Meaning |
|---|---|---|
| `unpaid` | `PAYMENT_STATUS.UNPAID` | Order created, no payment attempt initiated |
| `pending` | `PAYMENT_STATUS.PENDING` | Midtrans Snap token created, awaiting customer payment |
| `paid` | `PAYMENT_STATUS.PAID` | Payment confirmed by Midtrans callback |
| `failed` | `PAYMENT_STATUS.FAILED` | Payment denied, cancelled, or failed |
| `expired` | `PAYMENT_STATUS.EXPIRED` | Payment session expired |

### Midtrans Status Mapping

| Midtrans `transaction_status` | Internal `payment_status` |
|---|---|
| `settlement` | `paid` |
| `capture` | `paid` |
| `accept` | `paid` |
| `refund` | `paid` |
| `partial_refund` | `paid` |
| `pending` | `pending` |
| `authorize` | `pending` |
| `deny` | `failed` |
| `cancel` | `failed` |
| `failure` | `failed` |
| `expire` | `expired` |
| *(anything else)* | `pending` (safe default) |

*Source: `lib/services/payment/mapper.ts:4-16`*

### State Machine

```
                    ┌──────────────────────────┐
                    │         unpaid           │
                    │  (initial state)         │
                    └───────────┬──────────────┘
                                │
                        snap.created
                                │
                                ▼
                    ┌──────────────────────────┐
                    │         pending          │
                    │  (awaiting payment)      │
                    └──┬───────┬───────┬───────┘
                       │       │       │
              settlement  deny    expire
              capture     cancel
              accept      failure
                       │       │       │
                       ▼       ▼       ▼
                ┌─────────┐ ┌─────┐ ┌────────┐
                │  paid   │ │failed│ │expired │
                │(terminal)│ │(term)│ │(term)  │
                └─────────┘ └─────┘ └────────┘
```

### Payment Timestamps

| Event | Column | Set When |
|---|---|---|
| Payment confirmed | `paid_at` | `payment_status` transitions to `paid` |

---

## 3. FULFILLMENT LIFECYCLE

### Definition

Fulfillment tracks the merchant's internal processing workflow — from receiving the order to marking it complete. This is the primary state machine for admin order management.

### Allowed Statuses

| Status | Constant | Meaning |
|---|---|---|
| `new` | `FULFILLMENT_STATUS.NEW` | Initial state, order received, awaiting processing |
| `processing` | `FULFILLMENT_STATUS.PROCESSING` | Admin accepted for processing |
| `shipped` | `FULFILLMENT_STATUS.SHIPPED` | Package handed to courier |
| `completed` | `FULFILLMENT_STATUS.COMPLETED` | Order fulfilled, delivered to customer |
| `cancelled` | `FULFILLMENT_STATUS.CANCELLED` | Order cancelled by admin |

### State Machine

```
                    ┌──────────────────────────┐
                    │           new            │
                    │  (initial state)         │
                    └──────┬───────────┬───────┘
                           │           │
                      process      cancel
                           │           │
                           ▼           ▼
                    ┌──────────┐ ┌──────────┐
                    │processing│ │cancelled │
                    └──┬───┬───┘ │(terminal)│
                       │   │     └──────────┘
                    ship  cancel
                       │   │
                       ▼   ▼
                    ┌──────────┐
                    │ shipped  │
                    └────┬─────┘
                         │
                      complete
                         │
                         ▼
                    ┌──────────┐
                    │completed │
                    │(terminal)│
                    └──────────┘
```

### Fulfillment Timestamps

| Event | Column | Set When |
|---|---|---|
| Order shipped | `shipped_at` | `fulfillment_status` transitions to `shipped` |
| Order completed | `completed_at` | `fulfillment_status` transitions to `completed` |
| Order cancelled | `cancelled_at` | `fulfillment_status` transitions to `cancelled` |
| Cancellation reason | `cancellation_reason` | On cancel action, if provided |

### Additional Side Effects

- **Shipping guard:** Transitioning to `shipped` requires `payment_status = 'paid'`. If payment is not confirmed, the transition is rejected.
- **Auto-complete via webhook:** When Biteship reports `delivered`, `fulfillment_status` is automatically set to `completed` (see Shipping Lifecycle).

*Source: `lib/services/fulfillment.service.ts:104-115`, `lib/services/shipping/shipment.service.ts:114-116`*

---

## 4. SHIPPING LIFECYCLE

### Definition

Shipping tracks the physical delivery status through the Biteship logistics API. It is controlled externally by Biteship webhooks and internal polling via the tracking endpoint.

### Allowed Statuses

| Status | Constant | Meaning |
|---|---|---|
| `confirmed` | `SHIPPING_STATUS.CONFIRMED` | Shipment created, waybill generated |
| `picking_up` | `SHIPPING_STATUS.PICKING_UP` | Courier picking up from sender |
| `dropping_off` | `SHIPPING_STATUS.DROPPING_OFF` | Package being dropped off at hub |
| `in_transit` | `SHIPPING_STATUS.IN_TRANSIT` | Package in transit to destination |
| `delivered` | `SHIPPING_STATUS.DELIVERED` | Package delivered to recipient |
| `cancelled` | `SHIPPING_STATUS.CANCELLED` | Delivery cancelled |
| `retry` | `SHIPPING_STATUS.RETRY` | Delivery retry scheduled |

*Source: `lib/services/shipping/types.ts:1-11`*

### State Machine

```
                    ┌──────────────────────────┐
                    │       confirmed          │
                    │  (set by createShipment) │
                    └────────────┬─────────────┘
                                 │
                            picking_up
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │      picking_up          │
                    └────────────┬─────────────┘
                                 │
                            dropping_off
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │      dropping_off        │
                    └────────────┬─────────────┘
                                 │
                            in_transit
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │       in_transit         │
                    └──┬───────────────┬───────┘
                       │               │
                   delivered       cancelled
                       │               │
                       ▼               ▼
                 ┌──────────┐    ┌──────────┐
                 │delivered │    │cancelled │
                 │(terminal)│    │(terminal)│
                 └──────────┘    └──────────┘

                   retry can occur from any
                   non-terminal state
```

### Shipping → Fulfillment Mapping

When Biteship sends a status update via webhook, it maps to fulfillment:

| Biteship Status | Mapped Fulfillment Status |
|---|---|
| `picking_up` | `shipped` |
| `dropping_off` | `shipped` |
| `in_transit` | `shipped` |
| `delivered` | `completed` |
| `cancelled` | `cancelled` |
| `retry` | `shipped` |
| *(unknown)* | `shipped` |

*Source: `lib/services/shipping/mapper.ts:128-140`*

### Webhook Auto-Complete

When Biteship reports `"delivered"`:
1. `shipping_status` is set to `"delivered"`
2. `delivered_at` timestamp is recorded
3. `fulfillment_status` is automatically set to `"completed"`
4. An audit event `shipment.delivered` is logged

*Source: `lib/services/shipping/shipment.service.ts:109-116`*

---

## 5. COMBINED STATE MACHINE

### Full Order Lifecycle

```
PHASE 1: ORDER CREATION (Customer / API)

  [Checkout Form] → [POST /api/payment/create]
     │
     ├── validateCheckoutRequest()
     │   ├── Product exists & price matches
     │   ├── Shipping rate matches Biteship API
     │   ├── Subtotal matches server calculation
     │   └── Shipping fee matches server calculation
     │
     ├── OrderService.createDraft()
     │   ├── Check duplicate order_id → 409 if exists
     │   ├── Upsert customer (by email)
     │   ├── Insert order (payment_status=unpaid, fulfillment_status=new)
     │   ├── Insert order_items (with rollback on failure)
     │   └── Log audit: order.created
     │
     └── OrderService.confirmPayment()
         ├── Create Midtrans Snap (up to 2 retries)
         ├── Update payment_status=pending, store transaction_id
         └── Log audit: snap.created


PHASE 2: PAYMENT (Midtrans / Callback)

  [Midtrans] → [POST /api/payment/callback]
     │
     ├── Verify HMAC signature
     ├── Verify order exists
     ├── Verify gross_amount matches total_amount
     ├── Verify status transition is valid (state machine)
     ├── Update payment_status, transaction_id, payment_method
     ├── If paid: set paid_at timestamp
     └── Log audit: status.changed


PHASE 3: FULFILLMENT (Admin)

  [Admin Panel] → [POST /api/admin/orders/[id]/actions]
     │
     ├── Action: process
     │   ├── Requires: new → processing
     │   └── Effect: fulfillment_status=processing
     │
     ├── Action: ship
     │   ├── Requires: processing → shipped
     │   ├── Requires: payment_status=paid
     │   ├── Optional: waybill_id
     │   └── Effect: fulfillment_status=shipped, shipped_at=now
     │
     ├── Action: complete
     │   ├── Requires: shipped → completed
     │   └── Effect: fulfillment_status=completed, completed_at=now
     │
     └── Action: cancel
         ├── Requires: new/processing → cancelled
         ├── Optional: cancellation_reason
         └── Effect: fulfillment_status=cancelled, cancelled_at=now


PHASE 4: SHIPMENT (Biteship)

  [Admin] → [POST /api/admin/orders/[id]/shipment]
     │
     ├── Requires: fulfillment_status=processing, payment_status=paid
     ├── Requires: postal_code, destination_area_id, shipping_address,
     │             customer_phone, weight_grams (all items)
     ├── Calls Biteship API
     ├── Stores shipment_id, waybill_id
     ├── Sets shipping_status=confirmed
     └── Logs audit: shipment.created

  [Biteship Webhook] → [internal handler]
     │
     ├── Looks up order by waybill_id
     ├── Updates shipping_status to webhook status
     ├── If delivered: set delivered_at, auto-complete fulfillment
     └── Logs audit: shipment.{status}

  [Admin] → [POST /api/admin/orders/[id]/tracking]
     │
     ├── Fetches latest tracking from Biteship
     ├── Detects new statuses (compared against stored tracking_payload)
     ├── Logs audit for each new status
     └── Updates shipping_status, last_tracking_at, tracking_payload
```

---

## 6. ALLOWED STATUSES — COMPLETE INVENTORY

### All Status Values Used Anywhere in the Codebase

| Domain | Status | Source | In Live DB? |
|---|---|---|---|
| Payment | `unpaid` | `payment/types.ts:2` | ✅ Yes |
| Payment | `pending` | `payment/types.ts:3` | ✅ Yes |
| Payment | `paid` | `payment/types.ts:4` | ✅ Yes |
| Payment | `failed` | `payment/types.ts:5` | ✅ Yes |
| Payment | `expired` | `payment/types.ts:6` | ✅ Yes |
| Fulfillment | `new` | `payment/types.ts:13` | ✅ Yes |
| Fulfillment | `processing` | `payment/types.ts:14` | ✅ Yes |
| Fulfillment | `shipped` | `payment/types.ts:15` | ✅ Yes |
| Fulfillment | `completed` | `payment/types.ts:16` | ✅ Yes |
| Fulfillment | `cancelled` | `payment/types.ts:17` | ✅ Yes |
| Fulfillment (legacy) | `packed` | Migration 008 (removed) | Not in code |
| Fulfillment (legacy) | `delivered` | Migration 008 (removed) | Not in code |
| Shipping | `confirmed` | `shipping/types.ts:2` | ❌ No |
| Shipping | `picking_up` | `shipping/types.ts:3` | ❌ No |
| Shipping | `dropping_off` | `shipping/types.ts:4` | ❌ No |
| Shipping | `in_transit` | `shipping/types.ts:5` | ❌ No |
| Shipping | `delivered` | `shipping/types.ts:6` | ❌ No |
| Shipping | `cancelled` | `shipping/types.ts:7` | ❌ No |
| Shipping | `retry` | `shipping/types.ts:8` | ❌ No |
| Shipping (current) | `pending` | Live DB (orphan value) | ✅ Yes (3 rows) |

### Legacy Status Values

The legacy `status` column on the `orders` table contains values that predate the split into `payment_status` and `fulfillment_status`. Current live data:

| `status` Value | Count | Meaning |
|---|---|---|
| `pending` | 2 | Payment not yet confirmed |
| `paid` | 1 | Payment confirmed |

*Source: Live database query (3 rows)*

---

## 7. STATUS TRANSITION MATRIX

### Payment Transitions

| From ↓ | → `unpaid` | → `pending` | → `paid` | → `failed` | → `expired` |
|---|---|---|---|---|---|
| `unpaid` | — | ✅ Snap created | ❌ | ❌ | ❌ |
| `pending` | ❌ | — | ✅ Settlement | ✅ Deny/Cancel | ✅ Expire |
| `paid` | ❌ | ❌ | — | ❌ | ❌ |
| `failed` | ❌ | ❌ | ❌ | — | ❌ |
| `expired` | ❌ | ❌ | ❌ | ❌ | — |

*Source: `lib/services/order.service.ts:195-205`*

### Fulfillment Transitions

| From ↓ | → `new` | → `processing` | → `shipped` | → `completed` | → `cancelled` |
|---|---|---|---|---|---|
| `new` | — | ✅ Admin: process | ❌ | ❌ | ✅ Admin: cancel |
| `processing` | ❌ | — | ✅ Admin: ship* | ❌ | ✅ Admin: cancel |
| `shipped` | ❌ | ❌ | — | ✅ Admin: complete | ❌ |
| `completed` | ❌ | ❌ | ❌ | — | ❌ |
| `cancelled` | ❌ | ❌ | ❌ | ❌ | — |

*\* Requires `payment_status = 'paid'`*

*Source: `lib/services/fulfillment.service.ts:6-12,104-115`*

### Shipping Transitions

| From ↓ | → `confirmed` | → `picking_up` | → `dropping_off` | → `in_transit` | → `delivered` | → `cancelled` | → `retry` |
|---|---|---|---|---|---|---|---|
| `confirmed` | — | ✅ Biteship | ❌ | ❌ | ❌ | ❌ | ❌ |
| `picking_up` | ❌ | — | ✅ Biteship | ❌ | ❌ | ❌ | ❌ |
| `dropping_off` | ❌ | ❌ | — | ✅ Biteship | ❌ | ❌ | ❌ |
| `in_transit` | ❌ | ❌ | ❌ | — | ✅ Biteship | ✅ Biteship | ✅ Biteship |
| `delivered` | ❌ | ❌ | ❌ | ❌ | — | ❌ | ❌ |
| `cancelled` | ❌ | ❌ | ❌ | ❌ | ❌ | — | ❌ |
| `retry` | ❌ | ❌ | ❌ | ✅ Biteship | ✅ Biteship | ❌ | — |

Shippping transitions are driven entirely by Biteship — no admin action directly changes shipping status (admin actions change fulfillment_status, which may cascade from webhook).

*Source: Extracted from Biteship status progression logic in tracking.service.ts*

---

## 8. BUSINESS RULES

### Order Creation Rules

| # | Rule | Enforced By | Violation |
|---|---|---|---|
| 1 | `order_id` must be unique | `OrderService.createDraft` — checks before insert | HTTP 409 `"ORDER_ID_EXISTS"` |
| 2 | `order_id` must be ≤ 50 characters | `createSnapTransaction` — Midtrans constraint | Throws `"ORDER_ID_TOO_LONG"` |
| 3 | Subtotal must match server calculation | `validateCheckoutRequest` — recalculates from DB prices | HTTP 400 `"Subtotal pesanan tidak valid."` |
| 4 | Shipping fee must match Biteship rate | `validateCheckoutRequest` — re-fetches from Biteship API | HTTP 400 `"Ongkos kirim tidak valid."` |
| 5 | Product must exist and price must match | `validateCheckoutRequest` — queries DB | HTTP 400 `"Produk tidak ditemukan."` / `"Harga produk tidak valid."` |
| 6 | Cart must have at least 1 item | Frontend + Zod schema (`items` array min 1) | Form validation error |
| 7 | Shipping service must be selected | Frontend — checks truthy + fee > 0 | Form validation blocks submit |
| 8 | Customer phone must be Indonesian format | Zod regex: `^(\+62\|62\|0)8[1-9][0-9]{6,12}$` | Validation error |

### Payment Rules

| # | Rule | Enforced By | Violation |
|---|---|---|---|
| 9 | Callback signature must be valid HMAC-SHA512 | `verifyMidtransSignature` | HTTP 422 `"Invalid signature"` |
| 10 | Callback `gross_amount` must match `total_amount` | `OrderService.processCallback` — exact comparison | HTTP 422 `"Gross amount mismatch"` |
| 11 | Duplicate callbacks for already-paid orders are silently accepted | `OrderService.processCallback` — checks `currentStatus === paid` | Returns 200 success, logs `callback.skipped` |
| 12 | Callback must follow valid payment state machine | `OrderService.processCallback` — transition check | HTTP 422 `"Invalid status transition"` |
| 13 | Snap creation retries up to 2 times with 1s backoff | `createSnapTransaction` | After exhaustion: HTTP 502 |

### Fulfillment Rules

| # | Rule | Enforced By | Violation |
|---|---|---|---|
| 14 | Cannot ship without payment | `FulfillmentService.executeTransition` — checks `payment_status === paid` before shipping | Error `"Cannot ship: payment is not paid"` |
| 15 | Fulfillment status must follow valid transitions | `FulfillmentService.isValidTransition` | Error `"Invalid transition"` |
| 16 | Admin notes must be 10–2000 characters | Zod schema `adminNotesSchema` | Validation error with specific message |
| 17 | Cancellation reason is optional but stored if provided | `updateFulfillmentStatus` — conditional write | N/A |

### Shipment Rules

| # | Rule | Enforced By | Violation |
|---|---|---|---|
| 18 | Shipment requires `fulfillment_status = processing` | Shipment route — explicit check | HTTP 422 |
| 19 | Shipment requires `payment_status = paid` | Shipment route — explicit check | HTTP 422 |
| 20 | Duplicate shipment creation blocked | `ShipmentService.createShipment` — checks existing `shipment_id` | HTTP 409 |
| 21 | `postal_code` required for shipment | `validateShipmentReady` | Error `"POSTAL_CODE_REQUIRED"` |
| 22 | `destination_area_id` required for shipment | `validateShipmentReady` | Error `"DESTINATION_AREA_ID_REQUIRED"` |
| 23 | Each item must have `weight_grams` for shipment | `validateShipmentReady` | Error `"PRODUCT_WEIGHT_REQUIRED: {name}"` |
| 24 | Delivered webhook auto-completes fulfillment | `ShipmentService.handleWebhook` — cascades to fulfillment | Automatic |

### Audit Rules

| # | Rule | Enforced By |
|---|---|---|
| 25 | Every payment status change is audited | `AuditLogService.logPaymentEvent` |
| 26 | Every fulfillment status change is audited | `AuditLogService.logFulfillmentEvent` |
| 27 | Invalid callbacks are audited with `reason` metadata | `OrderService.processCallback` |
| 28 | Duplicate callbacks are audited as `callback.skipped` | `OrderService.processCallback` |
| 29 | Shipping webhook generates `shipment.{status}` audit events | `ShipmentService.handleWebhook` |
| 30 | Tracking polls generate events only for NEW statuses | `TrackingService.fetchAndPersist` |
| 31 | Audit log failures are non-blocking (logged to console only) | `AuditLogRepository.insert` — silent catch |

### Data Integrity Rules

| # | Rule | Enforced By |
|---|---|---|
| 32 | Customer records are upserted by email | `CustomerRepository.upsert` — `onConflict: "email"` |
| 33 | Order item insert failure causes order rollback (delete) | `OrderService.createDraft` — try/catch around `insertItems` |
| 34 | Order create is not transactional with payment | Order is created in `unpaid` state before Snap is called |

---

## 9. FIELD DEFINITIONS

### `orders` Table

| Field | Type | Domain | Required | Meaning | Written By | Read By |
|---|---|---|---|---|---|---|
| `id` | UUID string | Identity | ✅ PK | Internal primary key (auto-generated) | DB | All queries |
| `order_id` | VARCHAR(255) | Identity | ✅ | Public order ID: `DJ-YYYYMMDD-XXXXXXXX` | CreateDraft | Customer, Admin |
| `customer_id` | BIGINT | Reference | ✅ | FK → customers(id) | CreateDraft | Admin list, Detail |
| `transaction_id` | VARCHAR(255) | Payment | Optional | Midtrans Snap token / transaction ID | confirmPayment, processCallback | Callback validation |
| `qr_code_url` | TEXT | Payment | Optional | QR code URL (legacy, unused) | — | — |
| `subtotal` | BIGINT | Monetary | ✅ | Sum of item prices (excluding shipping) | CreateDraft | List, Detail, Callback |
| `shipping_fee` | BIGINT | Monetary | ✅ | Courier shipping cost | CreateDraft | List, Detail |
| `total_amount` | BIGINT | Monetary | ✅ | `subtotal + shipping_fee` | CreateDraft | Callback validation, Detail |
| `destination` | VARCHAR(50) | Address | ✅ | City name (write-only, not in read types) | CreateDraft | None (write-only) |
| `shipping_service` | VARCHAR(50) | Shipping | ✅ | `"{courier} {service}"` (write-only) | CreateDraft | None (write-only) |
| `status` | VARCHAR(50) | Legacy | Optional | Original monolithic status (fallback only) | Legacy | Callback, Fulfillment (fallback) |
| `payment_status` | VARCHAR(50) | Payment | Optional | `unpaid`/`pending`/`paid`/`failed`/`expired` | CreateDraft, confirmPayment, processCallback | All flows |
| `fulfillment_status` | VARCHAR(50) | Fulfillment | Optional | `new`/`processing`/`shipped`/`completed`/`cancelled` | CreateDraft, updateFulfillmentStatus | Admin flows, Receipt |
| `payment_method` | VARCHAR(100) | Payment | Optional | e.g. `bank_transfer`, `gopay`, `cstore` | processCallback | Admin list, Detail |
| `notes` | TEXT | Note | Optional | Customer-provided order notes | CreateDraft, PUT /api/orders/[id] | Admin Detail |
| `created_at` | TIMESTAMP | Temporal | ✅ | Order creation timestamp | DB default | All queries |
| `updated_at` | TIMESTAMP | Temporal | Optional | Last modification timestamp | All update methods | — |
| `postal_code` | VARCHAR(20) | Address | Optional | Destination postal code (5 digits) | CreateDraft (via InsertOrderParams) | Shipment validation |
| `customer_phone` | VARCHAR(20) | Contact | Optional | Customer phone/WhatsApp number | CreateDraft | Shipment validation |
| `shipping_address` | TEXT | Address | Optional | Full formatted address string | CreateDraft | Shipment validation, Receipt |
| `courier_company` | VARCHAR(50) | Shipping | Optional | e.g. `jne`, `idexpress`, `jnt` | CreateDraft | Shipment creation |
| `courier_type` | VARCHAR(50) | Shipping | Optional | e.g. `Reguler`, `JNE Trucking` | CreateDraft | Shipment creation |
| `shipping_cost` | BIGINT | Monetary | Optional | Same value as `shipping_fee` (redundant) | CreateDraft | — |
| `shipping_courier` | VARCHAR(50) | Shipping | Optional | Unknown purpose (no migration source) | — | — |
| `shipping_tracking_id` | VARCHAR(255) | Shipping | Optional | Unknown purpose (no migration source) | — | — |
| `shipping_postal_code` | VARCHAR(20) | Address | Optional | Unknown purpose (no migration source) | — | — |
| `shipping_status` | VARCHAR(50) | Shipping | Optional | `confirmed`/`picking_up`/.../`pending` | createShipment, handleWebhook, updateTrackingInfo | Tracking, Webhook |
| `waybill_id` | VARCHAR(255) | Shipping | Optional | Courier tracking number / waybill | updateShipmentInfo, updateFulfillmentStatus, updateWaybill | Webhook lookup, Tracking |
| `shipment_id` | VARCHAR(255) | Shipping | Optional | Biteship shipment ID | updateShipmentInfo | Duplicate check |
| `destination_area_id` | VARCHAR(50) | Address | Optional | Biteship destination area ID | — | Shipment validation |
| `shipment_error` | TEXT | Shipping | Optional | Error message from failed shipment (type only, never written) | — | — |
| `delivered_at` | TIMESTAMP | Temporal | Optional | Timestamp of physical delivery | updateShippingStatus (webhook) | — |
| `courier_etd` | VARCHAR(50) | Shipping | Optional | Estimated delivery time (type only, never written) | — | — |
| `paid_at` | TIMESTAMP | Temporal | Optional | Timestamp of payment confirmation | updatePayment, updatePaymentByOrderId | — |
| `shipped_at` | TIMESTAMP | Temporal | Optional | Timestamp of admin ship action | updateFulfillmentStatus | — |
| `completed_at` | TIMESTAMP | Temporal | Optional | Timestamp of admin complete action | updateFulfillmentStatus | — |
| `cancelled_at` | TIMESTAMP | Temporal | Optional | Timestamp of admin cancel action | updateFulfillmentStatus | — |
| `cancellation_reason` | TEXT | Note | Optional | Reason for cancellation | updateFulfillmentStatus | — |
| `last_tracking_at` | TIMESTAMP | Temporal | Optional | Last time tracking was polled | updateTrackingInfo | — |
| `tracking_payload` | JSONB | Shipping | Optional | Raw Biteship tracking response | updateTrackingInfo | Tracking (history comparison) |

### `order_items` Table

| Field | Type | Required | Meaning |
|---|---|---|---|
| `id` | BIGSERIAL | ✅ PK | Internal primary key |
| `order_id` | UUID | ✅ FK | References orders(id) |
| `product_id` | VARCHAR(255) | ✅ | Product ID at time of order |
| `product_name` | VARCHAR(255) | ✅ | Snapshot of product name |
| `price` | BIGINT | ✅ | Unit price at time of order |
| `quantity` | INTEGER | ✅ | Quantity ordered |
| `subtotal` | BIGINT | ✅ | `price * quantity` |
| `weight_grams` | INTEGER | Optional | Product weight in grams (DEFAULT 100) |
| `created_at` | TIMESTAMP | Optional | Insert timestamp |

### `customers` Table (Order Context)

| Field | Type | Required | Meaning |
|---|---|---|---|
| `id` | BIGSERIAL | ✅ PK | Internal primary key |
| `email` | VARCHAR(255) | ✅ UNIQUE | Customer email (upsert key) |
| `name` | VARCHAR(255) | ✅ | Customer name |
| `phone` | VARCHAR(20) | ✅ | Customer phone |
| `address` | TEXT | ✅ | Full concatenated address |
| `created_at` | TIMESTAMP | Optional | Account creation timestamp |
| `updated_at` | TIMESTAMP | Optional | Last update timestamp |

### `audit_logs` Table

| Field | Type | Required | Meaning |
|---|---|---|---|
| `id` | BIGSERIAL | ✅ PK | Internal primary key |
| `order_id` | VARCHAR(255) | ✅ | FK-style reference to order |
| `event` | VARCHAR(50) | ✅ | Event name (see audit events list) |
| `from_status` | VARCHAR(50) | Optional | Previous status value |
| `to_status` | VARCHAR(50) | ✅ | New status value |
| `metadata` | JSONB | Optional | Additional context (e.g., transaction_id, reason) |
| `created_at` | TIMESTAMP | Optional | Event timestamp |

### `contacts` Table (Not in live DB)

| Field | Type | Required | Meaning |
|---|---|---|---|
| `id` | BIGSERIAL | ✅ PK | Internal primary key |
| `name` | VARCHAR(255) | ✅ | Sender name |
| `email` | VARCHAR(255) | ✅ | Sender email |
| `phone` | VARCHAR(50) | Optional | Sender phone |
| `message` | TEXT | ✅ | Contact message body |
| `created_at` | TIMESTAMP | Optional | Submission timestamp |

---

## 10. CONFLICTS BETWEEN CODE AND DATABASE

### Conflict 1: Missing Columns Referenced by Code

The `OrderRow` TypeScript interface and repository methods reference columns that do not exist in the live database:

| Column | Table | Used By | Impact |
|---|---|---|---|
| `waybill_id` | orders | `findByWaybillId`, `updateWaybill`, `updateShipmentInfo`, `updateFulfillmentStatus`, `getPaginated` (SELECT) | **HTTP 500 on any shipment operation** |
| `paid_at` | orders | `updatePayment`, `updatePaymentByOrderId` (set when `paid`) | **HTTP 500 on payment callback** |
| `shipped_at` | orders | `updateFulfillmentStatus` (set when `shipped`) | **HTTP 500 on admin ship** |
| `completed_at` | orders | `updateFulfillmentStatus` (set when `completed`) | **HTTP 500 on admin complete** |
| `cancelled_at` | orders | `updateFulfillmentStatus` (set when `cancelled`) | **HTTP 500 on admin cancel** |
| `cancellation_reason` | orders | `updateFulfillmentStatus` (set when cancelling with reason) | **HTTP 500 on admin cancel with reason** |
| `admin_notes` | orders | `updateAdminNotes` | **HTTP 500 on admin notes** |
| `shipment_id` | orders | `updateShipmentInfo`, `ShipmentService.createShipment` (read check) | **HTTP 500 on shipment create** |
| `destination_area_id` | orders | `validateShipmentReady` (read check) | **HTTP 500 on shipment create** |
| `delivered_at` | orders | `updateShippingStatus` (webhook set) | **HTTP 500 on webhook delivery** |
| `last_tracking_at` | orders | `updateTrackingInfo` | **HTTP 500 on tracking poll** |
| `tracking_payload` | orders | `updateTrackingInfo`, `TrackingService` (read) | **HTTP 500 on tracking poll** |
| `weight_grams` | order_items | `validateShipmentReady` (read check), `ReceiptService` (read) | **HTTP 500 on shipment/receipt** |
| `courier_etd` | orders | `OrderRow` (type only, never read/written) | None (type mismatch only) |
| `shipment_error` | orders | `OrderRow` (type only, never read/written) | None (type mismatch only) |

### Conflict 2: Orphan Shipping Status Value

The live database contains `shipping_status = 'pending'` for all 3 orders. This value is:
- NOT defined in the `SHIPPING_STATUS` constants (`shipping/types.ts`)
- NOT listed in the CHECK constraint from migration 009
- NOT referenced anywhere in the codebase

The code sets `shipping_status` to `'confirmed'` when a shipment is created. The `'pending'` value appears to be a manual entry or default from a different system.

### Conflict 3: Write-Only Columns

Two columns are written during `OrderRepository.insert` but are absent from the `OrderRow` read type:

| Column | Written | Read | Risk |
|---|---|---|---|
| `destination` | ✅ `InsertOrderParams` → INSERT | ❌ Not in `OrderRow` (SELECT *) | Supabase `SELECT *` returns it from DB, but TypeScript doesn't map it. Low risk. |
| `shipping_service` | ✅ `InsertOrderParams` → INSERT | ❌ Not in `OrderRow` | Same as above. Low risk. |

### Conflict 4: Redundant Columns

| Column A | Column B | Evidence |
|---|---|---|
| `shipping_fee` | `shipping_cost` | Both store the same value. `shipping_fee` is in `OrderRow`. `shipping_cost` is a separate column written at insert. Redundant. |
| `status` (legacy) | `payment_status` + `fulfillment_status` | `status` is used as fallback `??` in 3 places. Modern code uses the split columns. |

### Conflict 5: Missing Table

| Table | Expected By | Status |
|---|---|---|
| `contacts` | `007_reconcile_schema.sql`, `app/api/contact/route.ts` | ❌ Does not exist |

### Conflict 6: Column Type Mismatch (Initial Schema vs Live)

| Table | Column | Migration 001 Expected Type | Actual Live Type |
|---|---|---|---|
| `customers` | `id` | `uuid` | `bigserial` |
| `orders` | `id` | `text` | `uuid` |
| `orders` | `customer_id` | `uuid` (ref customers.uuid) | `int8` (ref customers.int8) |

### Conflict 7: Shipping Status CHECK Constraint

Migration 009 defines a CHECK constraint:
```sql
CHECK (shipping_status IN ('confirmed','picking_up','dropping_off','in_transit','delivered','cancelled','retry'))
```

The live database has `shipping_status = 'pending'` on all rows. If this constraint is added, it will FAIL. The constraint definition in migration 009 does NOT include `'pending'`.

---

## 11. CONFLICTS BETWEEN REPOSITORY AND API

### Conflict 1: Dual Payment Callback Implementations

There are **two separate implementations** of Midtrans callback processing:

| File | Approach | Status Check |
|---|---|---|
| `lib/services/payment/callback.ts` | Direct `supabase.from("orders").update()` | Reads `payment_status, transaction_id` only |
| `lib/services/order.service.ts` (in `processCallback`) | Uses `OrderRepository` methods | Reads full `OrderRow`, validates state machine |

These are not called from the same path. The callback route (`app/api/payment/callback/route.ts`) imports from `order.service.ts`. The standalone `callback.ts` may be dead code or used elsewhere.

### Conflict 2: Inconsistent Address Storage

| System | Address Format |
|---|---|
| Customer insert (`customer.repository.ts`) | Receives pre-combined address from `OrderService.createDraft` via `combineAddress()` |
| Customer read (from join) | `customers.address` — stored as combined string |
| `Orders.shipping_address` | Same combined string, stored separately on order |
| Address in receipt | Uses `order.shipping_address` for delivery, `customer.address` for receiver info |

Result: The same address is stored in **two places** (`customers.address` and `orders.shipping_address`) as a single formatted text string. Address components (street, kelurahan, kecamatan, city, province, postalCode) are not individually queryable.

### Conflict 3: Order ID Chain

The `order_id` column in `orders` is a human-readable ID (`DJ-YYYYMMDD-XXXXXXXX`). The `id` column is a UUID. The `order_items.order_id` FK references the UUID `orders.id`, NOT the `order_id`:

```
order_items.order_id → orders.id (UUID)
                         ↑
                   NOT orders.order_id (DJ-...)
```

This is correct in the schema but creates confusion because the field is named `order_id` in `order_items` but references `orders.id`.

### Conflict 4: Shipping Route vs Biteship Route

| Route | Purpose |
|---|---|
| `POST /api/shipping` | Flat rate calculation (simple cart, no Biteship) |
| `POST /api/biteship-rates` | Biteship rate fetching (full checkout) |

Two different shipping calculation systems exist. The simplified cart uses flat rates. The full checkout uses Biteship API rates. Different validation paths, different data formats.

### Conflict 5: Callback Routes

| Route | Handler | Status |
|---|---|---|
| `POST /api/payment/callback` | `OrderService.processCallback` | Active |
| `POST /api/orders/[id]/callback` | Unknown (file may exist) | Orphan route? |

---

## 12. RECOMMENDED CANONICAL DOMAIN MODEL

### Statuses

```typescript
type PaymentStatus = 'unpaid' | 'pending' | 'paid' | 'failed' | 'expired';
type FulfillmentStatus = 'new' | 'processing' | 'shipped' | 'completed' | 'cancelled';
type ShippingStatus = 'confirmed' | 'picking_up' | 'dropping_off' | 'in_transit' | 'delivered' | 'cancelled' | 'retry';
```

### Status Relationships

```
PaymentStatus.unpaid     + FulfillmentStatus.new        = Order Draft
PaymentStatus.pending    + FulfillmentStatus.new        = Awaiting Payment
PaymentStatus.paid       + FulfillmentStatus.new        = Paid, Not Processed
PaymentStatus.paid       + FulfillmentStatus.processing = Being Processed
PaymentStatus.paid       + FulfillmentStatus.shipped    = In Transit
PaymentStatus.paid       + FulfillmentStatus.completed  = Delivered
PaymentStatus.any*       + FulfillmentStatus.cancelled  = Cancelled
```

*\* `paid` + `cancelled` requires refund handling (not implemented)*

### Core Entities

```
Order {
  id: UUID (PK)
  orderId: string (DJ-YYYYMMDD-XXXXXXXX, UNIQUE)
  customerId: number (FK → Customer)
  
  // Financial
  subtotal: number
  shippingFee: number
  totalAmount: number
  
  // Payment
  transactionId: string?
  paymentStatus: PaymentStatus
  paymentMethod: string?
  paidAt: timestamp?
  
  // Fulfillment
  fulfillmentStatus: FulfillmentStatus
  notes: string?
  adminNotes: string?
  shippedAt: timestamp?
  completedAt: timestamp?
  cancelledAt: timestamp?
  cancellationReason: string?
  
  // Shipping
  courierCompany: string?
  courierType: string?
  shippingAddress: string?
  customerPhone: string?
  postalCode: string?
  destinationAreaId: string?
  
  // Shipment Tracking
  shipmentId: string?       // Biteship ID
  waybillId: string?         // Courier tracking number
  shippingStatus: ShippingStatus?
  shipmentError: string?
  deliveredAt: timestamp?
  courierEtd: string?
  lastTrackingAt: timestamp?
  trackingPayload: JSON?
  
  // Temporal
  createdAt: timestamp
  updatedAt: timestamp?
}

OrderItem {
  id: number (PK)
  orderId: UUID (FK → Order.id)
  productId: string
  productName: string
  price: number
  quantity: number
  subtotal: number
  weightGrams: number?
  createdAt: timestamp?
}

Customer {
  id: number (PK)
  email: string (UNIQUE)
  name: string
  phone: string
  address: string
  createdAt: timestamp?
  updatedAt: timestamp?
}

AuditLog {
  id: number (PK)
  orderId: string
  event: string
  fromStatus: string?
  toStatus: string
  metadata: JSON?
  createdAt: timestamp?
}
```

### Audit Event Catalog

| Event | When |
|---|---|
| `order.created` | Draft order inserted |
| `snap.created` | Midtrans Snap token created |
| `snap.retry` | Snap creation retry |
| `callback.received` | Midtrans callback received |
| `status.changed` | Payment status changed via callback |
| `callback.skipped` | Duplicate callback ignored |
| `callback.invalid` | Invalid signature/amount/transition |
| `payment.manual_confirm` | Admin manually confirms payment |
| `order.processing` | Admin processes order |
| `order.shipped` | Admin marks order shipped |
| `order.completed` | Admin completes order |
| `order.cancelled` | Admin cancels order |
| `order.notes_updated` | Admin notes updated |
| `shipment.created` | Biteship shipment created |
| `shipment.picking_up` | Courier picking up |
| `shipment.dropping_off` | Dropping off at hub |
| `shipment.in_transit` | In transit |
| `shipment.delivered` | Delivered to recipient |
| `shipment.cancelled` | Delivery cancelled |
| `shipment.retry` | Delivery retry |

### Key Business Invariants

1. `totalAmount` MUST equal `subtotal + shippingFee`
2. `shipped` fulfillment transition REQUIRES `payment_status = 'paid'`
3. `completed` and `cancelled` are TERMINAL states (no further transitions)
4. `paid` is a TERMINAL state for payment (callbacks are idempotent)
5. `order_id` MUST be globally UNIQUE
6. `order_id` MUST be ≤ 50 characters
7. Each `order_item.subtotal` MUST equal `price * quantity`
8. Order items snapshot product data at time of purchase (not live-linked)
9. Customer records are upserted by email (1 customer = 1 email)

---

*End of Specification — No code or database changes were made during this analysis.*
