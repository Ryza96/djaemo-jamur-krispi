# ORDER DATA FLOW REPORT

> **Audience**: Another AI agent needing to understand or modify the Admin Orders data flow.
> **Goal**: Trace every field displayed on the Admin Orders UI back to its Supabase column,
> verifying whether the value shown to the user is guaranteed to match what is stored in the database.
> **Method**: Source code is the sole source of truth. Every statement here is backed by a file path + line number.

---

## 1. ARCHITECTURE OVERVIEW

```
Supabase DB
  └─ OrderRepository (lib/repositories/order.repository.ts)
       ├─ GET /api/admin/orders                  (list, paginated)
       ├─ GET /api/admin/orders/[id]              (detail)
       ├─ GET /api/admin/orders/[id]/timeline      (audit_logs, skips repository)
       ├─ GET /api/admin/orders/[id]/tracking      (TrackingService → Biteship)
       ├─ POST /api/admin/orders/[id]/actions      (update status)
       ├─ POST /api/admin/orders/[id]/shipment     (create Biteship shipment)
       └─ POST /api/admin/orders/[id]/notes        (update admin_notes)
            └─ Hooks (useOrders, useOrderDetail, useOrderTimeline, etc.)
                 └─ Components (OrderTable, OrderDetailClient, etc.)
```

**Critical observation**: Every admin orders API endpoint calls `OrderRepository` **directly** — there is no service layer between the API route and the repository. Only the tracking endpoint uses a service (`TrackingService`). The timeline endpoint bypasses the repository entirely and queries `supabase.from("audit_logs")` inline.

---

## 2. ORDERS LIST PAGE (`/admin/orders`)

### 2.1 Data Flow Summary

```
Supabase "orders" table
  → OrderRepository.getPaginated()       [order.repository.ts:163-238]
  → GET /api/admin/orders                 [route.ts:5-36]
  → useOrders() hook                      [use-orders.ts:15-87]
  → OrderTable component                   [table.tsx:22-100]
```

### 2.2 Field-by-Field Trace

#### 2.2.1 `order_id` (Order ID)

| Layer | File | Line | Detail |
|-------|------|------|--------|
| Schema | `orders` table | — | `order_id VARCHAR(255) NOT NULL UNIQUE` |
| Repository | `order.repository.ts` | 172 | `select("id, order_id, ...")` |
| Repository | `order.repository.ts` | 213 | mapped as `item.order_id as string` |
| API | `route.ts` | 26 | `OrderRepository.getPaginated(parsed.data)` |
| Hook | `use-orders.ts` | 57 | `setOrders(json.data)` — typed as `OrderListItem[]` |
| Type | `types.ts` | 8 | `order_id: string` |
| Component | `table.tsx` | 42 | `{order.order_id}` |

**Guaranteed?** ✅ Yes. Direct column read, no transformation. Displayed as-is.

#### 2.2.2 `customers.name` (Customer)

| Layer | File | Line | Detail |
|-------|------|------|--------|
| Schema | `customers` table | — | `name VARCHAR(255)` |
| Repository | `order.repository.ts` | 172 | `select("..., customers(name, email)")` — Supabase FK join |
| Repository | `order.repository.ts` | 223-228 | Mapped as `OrderCustomerRef`; handles single vs array response |
| API | `route.ts` | 26 | Passed through in response |
| Hook | `use-orders.ts` | 57 | `setOrders(json.data)` |
| Type | `types.ts` | 2 | `name: string` |
| Component | `table.tsx` | 47 | `{order.customers?.name ?? "-"}` |

**Guaranteed?** ⚠️ Nullable. If the customer row is deleted from the `customers` table after order creation, the join returns `null` and the UI shows `"-"`. The data is correct at display time, but is a snapshot — it reflects the current join state, not necessarily the state at order creation.

#### 2.2.3 `customers.email` (Customer Email)

Same flow as `customers.name`. Select at line 172 maps to `OrderCustomerRef` at line 224, rendered at line 50 in `table.tsx` — `{order.customers?.email ?? ""}`.

**Guaranteed?** ⚠️ Same nullable risk as `customers.name`.

#### 2.2.4 `created_at` (Date)

| Layer | File | Line | Detail |
|-------|------|------|--------|
| Schema | `orders` table | — | `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP` |
| Repository | `order.repository.ts` | 172 | Selected directly |
| Component | `table.tsx` | 54 | `new Date(order.created_at).toLocaleDateString('id-ID', ...)` |

**Guaranteed?** ✅ Yes. Server-generated timestamp at INSERT. No null risk.

#### 2.2.5 `total_amount` (Total)

| Layer | File | Line | Detail |
|-------|------|------|--------|
| Schema | `orders` table | — | `total_amount NUMERIC(15,2) NOT NULL` |
| Repository | `order.repository.ts` | 215 | `item.total_amount as number` |
| Component | `table.tsx` | 61 | `formatPrice(order.total_amount)` |

**Guaranteed?** ✅ Yes. NOT NULL column. `formatPrice` is just locale formatting.

#### 2.2.6 `payment_status` (Payment)

| Layer | File | Line | Detail |
|-------|------|------|--------|
| Schema | `orders` table | — | `payment_status VARCHAR(50)` |
| Repository | `order.repository.ts` | 218 | `item.payment_status as string \| null` |
| Component | `table.tsx` | 65-69 | Badge with `paymentBadgeVariant(order.payment_status)`, shows `{order.payment_status ?? "-"}` |

**Guaranteed?** ⚠️ Nullable. New orders before any payment interaction have `payment_status = null`. UI shows `"-"`. Valid states: `unpaid`, `pending`, `paid`, `failed`, `expired`.

#### 2.2.7 `fulfillment_status` (Fulfillment)

Same flow as `payment_status`. Rendered at line 72-76 with `fulfillmentBadgeVariant()`. Valid states: `new`, `processing`, `shipped`, `completed`, `cancelled`.

#### 2.2.8 `waybill_id` (Courier column)

| Layer | File | Line | Detail |
|-------|------|------|--------|
| Schema | `orders` table | — | `waybill_id VARCHAR(255)` (nullable) |
| Repository | `order.repository.ts` | 220 | `item.waybill_id as string \| null` |
| Component | `table.tsx` | 80-84 | Shows monospace `waybill_id` if truthy, otherwise `"-"` |

**Mislabeling**: The table header reads "Courier" (line 33) but actually displays `waybill_id` (the tracking number), not `courier_company` (the courier name like "JNE", "SiCepat"). This is misleading.

**Guaranteed?** ⚠️ Nullable. Shows `"-"` when no waybill assigned.

#### 2.2.9 Action Button

Component `table.tsx` line 90: `onClick={() => onView(order.order_id)}`. Navigates to `/admin/orders/{order.order_id}`.

---

## 3. ORDER DETAIL PAGE (`/admin/orders/[id]`)

### 3.1 Data Flow Summary

```
Supabase "orders" table (with "order_items" and "customers" joins)
  → OrderRepository.findDetailByOrderId()   [order.repository.ts:240-249]
  → fallback: OrderRepository.findDetailById() [order.repository.ts:251-260]
  → GET /api/admin/orders/[id]               [route.ts:4-26]
  → useOrderDetail() hook                    [use-order-detail.ts:6-66]
  → OrderDetailClient component              [detail-client.tsx:64-284]
       ├─ StatusCards
       ├─ CustomerSection
       ├─ ItemsSection
       ├─ OrderTimeline  ← separate API call (audit_logs)
       ├─ OrderActions
       ├─ TrackingPanel  ← separate API call (TrackingService)
       └─ AdminNotes
```

**Critical observation**: The detail endpoint does `"*, order_items(*), customers(*)"` — a full table star (`*`) on `orders`, then all columns on `order_items` and `customers`. The `OrderDetailRow` interface (lines 42-61) defines exactly which fields the UI consumes, but the query sends ALL columns over the wire.

### 3.2 Field-by-Field Trace

All fields below come from `useOrderDetail(id).order` typed as `OrderDetailRow` (defined at `order.repository.ts:42-61`).

---

#### 3.2.1 Page Header Fields

**`order.order_id`**: Direct from repository → API → hook → `detail-client.tsx:133`.  
**`customer?.name`**: From `order.customers.name` via the starred join. Rendered at `detail-client.tsx:134`.  
**`createdDate`**: From `order.created_at`, formatted at `detail-client.tsx:120-127`, shown at line 134.  
**Status badges**: `order.payment_status`, `order.fulfillment_status`, `order.shipping_status` at lines 139-147.

---

#### 3.2.2 Status Cards (`status-cards.tsx`)

| Prop | Source Field | Rendered |
|------|-------------|----------|
| `paymentStatus` | `order.payment_status` | Badge + label at line 46 |
| `fulfillmentStatus` | `order.fulfillment_status` | Badge + label at line 59 |
| `shippingStatus` | `order.shipping_status` | Badge + label at line 78 |
| `paidAt` | `order.paid_at` | "Paid: {date}" at line 50 (conditional on truthy) |
| `shippedAt` | `order.shipped_at` | "Shipped: {date}" at line 64 (conditional on truthy) |
| `completedAt` | `order.completed_at` | "Completed: {date}" at line 69 (conditional on truthy and !shippedAt) |

**Guarantee note**: All status props are `string | null`. Timestamps only render when truthy. This means if `payment_status = "paid"` but `paid_at` is null (due to a bug or manual database edit), the card will show "Paid" badge without the timestamp.

---

#### 3.2.3 Customer Information (`customer-section.tsx`)

| Label | Source Field | Code |
|-------|-------------|------|
| Nama | `customer?.name` | Line 20 |
| Email | `customer?.email` | Line 21 |
| WhatsApp | `customer?.phone` | Line 22 |

All from `order.customers` joined via `"customers(*)"` in the repository query.

**Guaranteed?** ⚠️ `customers` can be null → shows `"-"` for all fields.

---

#### 3.2.4 Shipping Address (`customer-section.tsx`)

| Label | Source Field | Code |
|-------|-------------|------|
| Nama Penerima | `customer?.name` | Line 29 |
| Alamat Lengkap | `shippingAddress` prop = `order.shipping_address` | Line 32 |
| Kelurahan | **HARDCODED** `"-"` | Line 34 |
| Kecamatan | **HARDCODED** `"-"` | Line 35 |
| Kota | **HARDCODED** `"-"` | Line 36 |
| Provinsi | **HARDCODED** `"-"` | Line 37 |
| Kode Pos | **HARDCODED** `"-"` | Line 38 |

**❌ Data loss**: The address is stored as a single `shipping_address` text blob on the `orders` table (schema: `shipping_address TEXT`). Individual components (Kelurahan, Kecamatan, Kota, Provinsi, Kode Pos) are never stored or parsed — the UI always shows `"-"`.

---

#### 3.2.5 Shipping Information (`detail-client.tsx:174-193`)

| Label | Source Field | Code |
|-------|-------------|------|
| Courier | `order.courier_company` | Line 176 |
| Service | `order.courier_type` | Line 177 |
| Shipping Cost | `order.shipping_cost` | Line 180, formatted with `formatPrice()` |
| Waybill | `order.waybill_id` | Line 183, monospace if truthy |

**Guaranteed?** All nullable. Shipping cost shown as `"-"` when null.

---

#### 3.2.6 Order Items (`items-section.tsx`)

| Column | Source Field | Code |
|--------|-------------|------|
| Product | `item.product_name` | Line 51 |
| Qty | `item.quantity` | Line 54 |
| Price | `item.price` | Line 57, formatted |
| Subtotal | `item.subtotal` | Line 60, formatted |

All from `order.order_items[]` loaded via the starred join `"order_items(*)"`.

**Guarantee**: Empty array → shows "Tidak ada item dalam pesanan ini." at line 35. Each item has `id` as key.

---

#### 3.2.7 Payment Summary (`detail-client.tsx:215-236`)

| Label | Source Field | Code |
|-------|-------------|------|
| Subtotal | `order.subtotal` | Line 219 |
| Shipping | `order.shipping_fee` | Line 224 |
| Grand Total | `order.total_amount` | Line 231 |

**Schema**: `subtotal NUMERIC(15,2)`, `shipping_fee NUMERIC(15,2)`, `total_amount NUMERIC(15,2) NOT NULL`.

**Guaranteed?** ✅ NOT NULL for `total_amount`. Subtotal and shipping_fee could theoretically be zero but should never be null based on insert logic.

---

#### 3.2.8 Order Metadata (`detail-client.tsx:259-270`)

| Label | Source Field |
|-------|-------------|
| Created At | `order.created_at` |
| Updated At | `order.updated_at` |
| Paid At | `order.paid_at` |
| Completed At | `order.completed_at` |
| Shipped At | `order.shipped_at` |
| Cancelled At | `order.cancelled_at` |
| Payment Method | `order.payment_method` |
| Transaction ID | `order.transaction_id` |

All formatted with `formatDate()` helper that returns `"-"` for null values.

**Timestamp integrity**: Each timestamp is SET ONLY by the repository when the corresponding status transition occurs:
- `paid_at` set in `updatePayment()` (line 308) when `payment_status === "paid"`
- `shipped_at` set in `updateFulfillmentStatus()` (line 369) when `fulfillment_status === "shipped"`
- `completed_at` set at line 373 when `fulfillment_status === "completed"`
- `cancelled_at` set at line 377 when `fulfillment_status === "cancelled"`
- `updated_at` set on every update

---

#### 3.2.9 Admin Notes (`admin-notes.tsx`)

| Field | Source | Code |
|-------|--------|------|
| Initial value | `order.admin_notes` | Line 20 |
| Save action | POST `/api/admin/orders/{id}/notes` | `use-admin-notes.ts:24-31` |

**Guarantee**: Null initial → empty textarea. Save calls `OrderRepository.updateAdminNotes()` at `order.repository.ts:407-417`.

---

#### 3.2.10 Order Timeline (`order-timeline.tsx`)

**Separate endpoint**: `GET /api/admin/orders/[id]/timeline` → queries `audit_logs` table directly (`timeline/route.ts:8-12`).

**No repository layer**: The timeline API uses `supabase.from("audit_logs")` directly.

**Schema**: `audit_logs(id BIGSERIAL, order_id VARCHAR, event VARCHAR, from_status VARCHAR, to_status VARCHAR, metadata JSONB, created_at TIMESTAMP)` — defined in migration `006_add_payment_fulfillment_status.sql:39-47`.

| Displayed | Source Column |
|-----------|--------------|
| Event name | `event` → mapped via `EVENT_LABELS` lookup |
| Description | `event` + `metadata` → derived via `getEventDescription()` |
| Timestamp | `created_at` |
| From/To status | `from_status` / `to_status` |
| Visual style | `event` → mapped via `EVENT_STYLES` lookup |
| Grouping | `created_at` → grouped by date via `groupByDate()` |

**Guaranteed?** ✅ Yes — direct table read, no joins. The `audit_logs` table is append-only and is written by `AuditLogRepository.insert()` at `audit-log.repository.ts:12-24`.

---

#### 3.2.11 Shipment Tracking (`tracking-panel.tsx`)

**Separate endpoint**: `GET /api/admin/orders/[id]/tracking` → calls `TrackingService.fetchAndPersist(id)` which:
1. Reads `waybill_id` from the order
2. Fetches latest tracking from Biteship API
3. Persists updated `shipping_status`, `last_tracking_at`, `tracking_payload` to the `orders` table
4. Returns the tracking data

**Note**: The tracking data read from Biteship is cached in `tracking_payload` (JSONB column) but the panel reads from Biteship live on each click of the Refresh button.

---

## 4. WRITE OPERATIONS (Data Modification)

### 4.1 Status Updates (`POST /api/admin/orders/[id]/actions`)

- Accepts `{ action: "process" | "ship" | "complete" | "cancel", ...extra }`
- Calls `OrderService.updateFulfillmentStatus()` which internally:
  1. Reads current order via `OrderRepository.findById()`
  2. Calls `OrderRepository.updateFulfillmentStatus()` to update `fulfillment_status`, `shipped_at`, `completed_at`, `cancelled_at`, `waybill_id`
  3. Calls `AuditLogRepository.insert()` to log the event
- **No validation**: The service does not validate state transitions (e.g., "shipped" → "processing" is allowed)

### 4.2 Admin Notes (`POST /api/admin/orders/[id]/notes`)

- Accepts `{ admin_notes: string }`
- Calls `OrderRepository.updateAdminNotes(id, adminNotes)`
- Also triggers audit log: `AuditLogRepository.insert(...)` with event `"order.notes_updated"`

### 4.3 Shipment Creation (`POST /api/admin/orders/[id]/shipment`)

- Calls `BiteshipService.createShipment(orderId)` which creates a Biteship shipment order, then persists the `shipment_id` and `waybill_id` via `OrderRepository.updateShipmentInfo()`

---

## 5. DATA INTEGRITY SUMMARY TABLE

| Page | Field | Guaranteed Match? | Risk |
|------|-------|-------------------|------|
| List | `order_id` | ✅ Yes | None |
| List | `customers.name` | ⚠️ Partial | Null if customer row deleted |
| List | `customers.email` | ⚠️ Partial | Null if customer row deleted |
| List | `created_at` | ✅ Yes | Server-generated |
| List | `total_amount` | ✅ Yes | NOT NULL column |
| List | `payment_status` | ⚠️ Nullable | `null` before first payment interaction |
| List | `fulfillment_status` | ⚠️ Nullable | `null` before admin processes |
| List | `waybill_id` (labeled "Courier") | ⚠️ Mislabeled | Shows tracking number, not courier name |
| Detail | `customers` (name, email, phone) | ⚠️ Partial | Null if customer deleted |
| Detail | `shipping_address` | ✅ Yes | Single text blob |
| Detail | Address components (Kelurahan etc.) | ❌ Broken | All hardcoded to `"-"` |
| Detail | `courier_company`, `courier_type` | ✅ Yes | Direct column read |
| Detail | `order_items[n].*` | ✅ Yes | Direct row read from `order_items` |
| Detail | `subtotal`, `shipping_fee`, `total_amount` | ✅ Yes | Direct column read |
| Detail | `paid_at` | ⚠️ Conditional | Only set when `updatePayment()` called with `"paid"` |
| Detail | `shipped_at` | ⚠️ Conditional | Only set when `updateFulfillmentStatus()` called with `"shipped"` |
| Detail | `completed_at` | ⚠️ Conditional | Only set when `updateFulfillmentStatus()` called with `"completed"` |
| Detail | `cancelled_at` | ⚠️ Conditional | Only set when `updateFulfillmentStatus()` called with `"cancelled"` |
| Detail | `admin_notes` | ✅ Yes | Direct column read |
| Detail | Timeline events | ✅ Yes | Append-only `audit_logs` table |
| Detail | Tracking data | ✅ Yes | Live from Biteship API |

---

## 6. ARCHITECTURAL NOTES

### 6.1 Missing Service Layer
The detail and list API routes (`/api/admin/orders`, `/api/admin/orders/[id]`) call `OrderRepository` **directly** — there is no `OrderService` involvement. This means:
- No business logic validation on reads
- No caching
- No transformation layer between DB shape and API shape
- The `OrderDetailRow` interface IS the API contract

### 6.2 Inconsistent Data Access Pattern
Three different patterns exist for reading order data:
1. **Repository pattern**: List and detail endpoints use `OrderRepository`
2. **Direct Supabase**: Timeline endpoint queries `supabase.from("audit_logs")` directly
3. **Service pattern**: Tracking endpoint uses `TrackingService`

### 6.3 Over-fetching
The detail query uses `"*, order_items(*), customers(*)"` which sends ALL columns to the client, even though only a subset is rendered. The `OrderDetailRow` interface (42 lines) defines what the UI actually consumes.

### 6.4 No Authentication
As noted in PROJECT_STATE_REPORT.md, there is no `middleware.ts` and none of the `/api/admin/*` routes perform any authentication check. Any client that can reach the server can access all order data.

### 6.5 Star Select Risks
The `findDetailByOrderId` and `findDetailById` methods use `select("*")` and `select("*, order_items(*), customers(*)")`. If new columns are added to the `orders` table, they are automatically exposed through the API without any explicit opt-in.

---

## 7. RECOMMENDATIONS

1. **Add a service layer** between API routes and repositories for read operations to enable validation, transformation, and caching.
2. **Fix the address components** — parse `shipping_address` or store individual address fields (Kelurahan, Kecamatan, Kota, Provinsi, Kode Pos) in the database instead of hardcoding `"-"`.
3. **Fix the "Courier" column label** — it currently shows `waybill_id` but should either show `courier_company` or be relabeled to "Waybill" / "Resi".
4. **Standardize data access** — the timeline endpoint should use `AuditLogRepository` instead of direct Supabase queries.
5. **Replace star selects** with explicit column lists to prevent accidental data exposure when the schema changes.
6. **Add authentication middleware** to protect `/api/admin/*` routes.
7. **Consider snapshotting customer data** into the orders table to prevent data loss when customer records are deleted or modified.
