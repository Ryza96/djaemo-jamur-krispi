# QA Investigation: Order Management Module

> **Mode**: Read-only — no code modified  
> **Role**: QA Engineer  
> **Focus**: Admin workflow completeness for production order processing

---

## Step-by-Step Workflow Analysis

### Step 1: Customer Places an Order

| Question | Answer |
|----------|--------|
| **Can this step be performed?** | Partially. The checkout form submits to `/api/payment/create` with full order payload. But there is no server-side phone format validation (client has regex, server only `z.string().min(1)`). |
| **Which page performs it?** | `components/checkout/CheckoutForm.tsx` + `app/checkout/page.tsx` |
| **Which API performs it?** | `POST /api/payment/create` → `OrderService.createDraft()` |
| **Which database tables are updated?** | `customers` (upsert by email), `orders` (insert), `order_items` (insert) |
| **What validations exist?** | Zod schema on full payload (customer info, shipping address, items, totals). Duplicate `order_id` check. Client-side Zod for customer info and shipping address. Cart not empty. Shipping method selected. |
| **What could fail?** | No database transaction: customer upsert, order insert, and items insert are three separate Supabase calls. A crash between them leaves orphan records (customer without order, or order without items). Race condition on duplicate `order_id` check (two simultaneous requests both pass the check). Customer data silently overwritten on repeat checkout (`onConflict: "email"` updates phone/address without warning). Checkout items are not validated against actual product database (prices re-submitted by client, not looked up server-side). |
| **What happens if it fails?** | Items insert failure: rollback deletes the draft order, but orphan customer record remains. Duplicate `order_id`: return 409. Zod failure: return 400 with first error. Supabase error: return 500. |
| **Does the workflow continue correctly?** | No. A partial write (customer saved, order failed) creates a ghost customer record. Customer data overwritten on repeat purchase is silent — no diff or history. Price manipulation is possible (client sends prices, server trusts them). |

---

### Step 2: Customer Pays

| Question | Answer |
|----------|--------|
| **Can this step be performed?** | Partially. Midtrans Snap is created with retry logic, but there is a duplicate/legacy callback handler that can corrupt order state. |
| **Which page performs it?** | User is redirected to Midtrans Snap page (external) |
| **Which API performs it?** | `POST /api/payment/create` → `createSnapTransaction()` → midtrans snap. Callback: `OrderService.processCallback()` in the main path, AND `POST /api/orders/[id]/callback` in the legacy path. |
| **Which database tables are updated?** | `orders` (payment_status → pending, then → paid/failed/expired via callback). `audit_logs` in main path, NOT in legacy path. |
| **What validations exist?** | Main path: Midtrans HMAC signature verification, gross amount match against DB, idempotency check (already paid → skip), state machine enforcement (unpaid→pending, pending→paid/failed/expired, terminal states blocked). Retry on Snap failure (2 attempts). Legacy path: SHA512 signature check only. |
| **What could fail?** | **CRITICAL:** Two callback handlers are active simultaneously. The legacy handler (`/api/orders/[id]/callback`) bypasses all state machine enforcement, gross amount validation, and audit logging. If Midtrans sends callbacks to both routes (or the wrong one), the legacy handler can overwrite a `paid` status with `pending` or `failed`. No audit trail on the legacy path. Snap has no HTTP timeout — a hanging Midtrans call holds the connection indefinitely. Retries on ALL errors (including Midtrans 4xx validation that will never succeed). No idempotency key on Snap creation (first request may succeed at Midtrans but response is lost; retry creates a second transaction). |
| **What happens if it fails?** | Main path: Snap failure → mark payment FAILED, log ROLLBACK audit, return 502 to client. User redirected back with error. Legacy/Main race: silent status corruption. No human would notice until they manually compare order state. |
| **Does the workflow continue correctly?** | No. The dual callback handler is a ticking time bomb. Any realistic production deployment would eventually trigger both handlers on the same order, causing status corruption. The lack of audit on the legacy path means the corruption is invisible. |

---

### Step 3: Order Appears in Admin

| Question | Answer |
|----------|--------|
| **Can this step be performed?** | Yes. The admin order listing page works. |
| **Which page performs it?** | `app/admin/orders/page.tsx` → `OrderToolbar` + `OrderTable` + pagination |
| **Which API performs it?** | `GET /api/admin/orders` with query params for search, filters, sort, pagination |
| **Which database tables are updated?** | None (read-only: `orders`, join to `customers`) |
| **What validations exist?** | Zod schema for all query params (search, payment_status, fulfillment_status, date range, sort, page, limit). Default page=1, limit=20. |
| **What could fail?** | No auth on API — anyone who discovers the URL can list all orders with customer PII. Pagination resets to page 1 on any filter change (annoying if on page 5 and changing sort). No auto-refresh (admin must manually refresh to see new orders). No timeout feedback on slow API (skeleton may persist indefinitely). Error messages are raw HTTP status text. |
| **What happens if it fails?** | API error → red error state with "Coba Lagi" button. Network failure → skeleton stuck until timeout. Backend error → raw message displayed. |
| **Does the workflow continue correctly?** | Yes, for the listing itself. But the fundamental lack of auth means this entire workflow is exposed to anyone who knows the URL. An attacker could list all orders with customer phone numbers and addresses. |

---

### Step 4: Admin Reviews Order

| Question | Answer |
|----------|--------|
| **Can this step be performed?** | Partially. The detail page renders, but key shipping address fields are hardcoded to "-". |
| **Which page performs it?** | `app/admin/orders/[id]/page.tsx` → `detail-client.tsx` → 8 child components |
| **Which API performs it?** | `GET /api/admin/orders/[id]` (order detail with customer + items), `GET /api/admin/orders/[id]/timeline` (audit log) |
| **Which database tables are updated?** | None (read-only: `orders`, `order_items`, `customers`, `audit_logs`) |
| **What validations exist?** | None beyond HTTP 404 if order not found. |
| **What could fail?** | **Address fields are hardcoded "-"** for Kelurahan, Kecamatan, Kota, Provinsi, Kode Pos — the admin cannot see where the order ships to (this is a DEAD-END for fulfillment). Customer name used as recipient name (no separate recipient name field). Entire page relies on a single large API call (slow → nothing renders). No inline error, only full-page error. AbortController cancels requests on component unmount — a user clicking between orders rapidly may see loading skeletons. |
| **What happens if it fails?** | NOT_FOUND → dedicated empty state with back link. Other error → error empty state with "Coba Lagi". Loading → skeleton matching the two-column layout. |
| **Does the workflow continue correctly?** | No. The admin literally cannot see the shipping address. They must know the full address to create a shipment. If they proceed anyway with missing data, the shipment creation API will fail with "postal code required" or "area ID required" errors. |

---

### Step 5: Admin Starts Processing

| Question | Answer |
|----------|--------|
| **Can this step be performed?** | Yes. The "Mulai Proses" button triggers the fulfillment state machine. |
| **Which page performs it?** | `components/admin/orders/order-actions.tsx` button → confirmation dialog |
| **Which API performs it?** | `POST /api/admin/orders/[id]/actions` with `{ action: "process" }` → `FulfillmentService.process()` |
| **Which database tables are updated?** | `orders` (fulfillment_status → "processing"). `audit_logs` (event "order.processing"). |
| **What validations exist?** | State machine enforces: "new" → "processing" is valid. Returns 422 on invalid transition. Order existence check (404). Zod body validation. Confirmation dialog prevents accidental clicks. |
| **What could fail?** | No transaction between DB update and audit log (audit insert failure → state committed without trace). `normalizeFulfillmentStatus` fails on trailing whitespace in DB. DB update throws on network error after DB change — no rollback possible. Double-click risk on confirm button (disabled during loading, but if the first request succeeds slowly and the second is processed after, the second fails with invalid transition — which is safe but confusing). |
| **What happens if it fails?** | Invalid transition → 422 with previous/new status. Network error → 500. Toast shows "error" variant. User can retry. |
| **Does the workflow continue correctly?** | Mostly yes. The state machine is well-defined. The main risk is audit log inconsistency if the DB write succeeds but the audit fails — you get a processed order with no proof of who did it. |

---

### Step 6: Admin Creates Shipment

| Question | Answer |
|----------|--------|
| **Can this step be performed?** | Partially. The API validates preconditions, but the UI does not show the admin the shipping address (Step 4), making it impossible for the admin to verify shipment details. The shipment creation relies on Biteship being available, which is a hard external dependency. |
| **Which page performs it?** | `components/admin/orders/order-actions.tsx` button "Buat Resi" → confirmation dialog |
| **Which API performs it?** | `POST /api/admin/orders/[id]/shipment` → `ShipmentService.createShipment()` |
| **Which database tables are updated?** | `orders` (shipment_id, waybill_id, shipping_status → "confirmed"). `audit_logs` (event "shipment.created"). |
| **What validations exist?** | Order existence (404), duplicate shipment (409 if shipment_id already set), fulfillment must be "processing" (422), payment must be "paid" (422). Service-level: postal_code required, destination_area_id required, shipping_address required, customer_phone required, item weights required. Each returns specific error code. |
| **What could fail?** | **Admin cannot verify shipping address** because address fields show "-" on the detail page. Missing fields from checkout (postal_code, destination_area_id, structured address) will cause 422 errors. Item weight validated at shipment time, not at checkout — if items have no weight_grams set, shipment fails here. Biteship API may be unavailable (network, auth key expired, rate limited). No waybill validation on the "ship" action (optional field). |
| **What happens if it fails?** | Missing fields → 422 with specific error message. Biteship error → 422. Duplicate → 409. Toast shows error. User can fix and retry. |
| **Does the workflow continue correctly?** | No. The missing address display in Step 4 means the admin is creating shipments blind. They cannot verify the destination. If Biteship is down (third-party API), the entire fulfillment pipeline halts with no fallback. |

---

### Step 7: Admin Prints Receipt

| Question | Answer |
|----------|--------|
| **Can this step be performed?** | Yes. The PDF receipt is generated and downloaded. |
| **Which page performs it?** | Link in the right sidebar of `detail-client.tsx` ("Download PDF") |
| **Which API performs it?** | `GET /api/admin/orders/[id]/receipt` → `ReceiptService.generateReceipt()` |
| **Which database tables are updated?** | None (read-only) |
| **What validations exist?** | Order existence check (404). Logo file read failure silently continues. |
| **What could fail?** | Logo file missing → receipt generated without logo (silent). QR code generation fails → 500. bwipjs/barcode error → 500. Filesystem errors → 500. |
| **What happens if it fails?** | Order not found → 404. Generation error → 500. No fallback receipt format. |
| **Does the workflow continue correctly?** | Yes, this step works. The receipt generation is independent of other steps. |

---

### Step 8: Admin Marks as Shipped

| Question | Answer |
|----------|--------|
| **Can this step be performed?** | Partially. The transition works, but `waybill_id` is not required by validation — an admin can mark as shipped without a waybill number, making tracking impossible. |
| **Which page performs it?** | `components/admin/orders/order-actions.tsx` button "Tandai Dikirim" → confirmation dialog with optional waybill input |
| **Which API performs it?** | `POST /api/admin/orders/[id]/actions` with `{ action: "ship", waybill_id?: string }` → `FulfillmentService.ship()` |
| **Which database tables are updated?** | `orders` (fulfillment_status → "shipped", shipped_at timestamp). `audit_logs` (event "order.shipped"). |
| **What validations exist?** | State machine: "processing" → "shipped" is valid. Payment must be "paid". `waybill_id` is optional in Zod schema but can be left empty. |
| **What could fail?** | Admin can ship WITHOUT waybill ID — no tracking possible later. Waybill input is free text with no format validation. No transaction between DB update and audit log. ~~If the shipment was already created via Biteship (Step 6), the waybill should already be in the DB, but the UI shows "Shipment Created" badge and does NOT offer the "Tandai Dikirim" button — this is a potentially confusing UX gap. The admin might need to first create the shipment, then separately mark as shipped, but the button disappears after shipment creation.~~ **[FIXED]** Tombol "Tandai Dikirim" sekarang muncul untuk status `waybill_created` dan `picked_up`, memakai resi yang sudah tersimpan secara otomatis. Input manual hanya muncul jika order belum punya resi. |
| **What happens if it fails?** | Invalid transition → 422. Payment not paid → 422. Success → toast. |
| **Does the workflow continue correctly?** | ~~No.~~ **[FIXED]** Transisi `waybill_created`/`picked_up` → `shipped` sekarang tersedia via tombol manual "Tandai Dikirim". Resi otomatis diambil dari database. |

---

### Step 9: Admin Tracks Shipment

| Question | Answer |
|----------|--------|
| **Can this step be performed?** | Partially. If a waybill exists, tracking data can be fetched from Biteship. But the admin must manually click "Refresh" — no auto-fetch. |
| **Which page performs it?** | `components/admin/orders/tracking-panel.tsx` inside the order detail page |
| **Which API performs it?** | `GET /api/admin/orders/[id]/tracking` → `TrackingService.fetchAndPersist()` |
| **Which database tables are updated?** | `orders` (tracking_payload, last_tracking_at). `audit_logs` (new tracking events deduplicated). |
| **What validations exist?** | Order existence check. Waybill existence check. |
| **What could fail?** | No waybill → "No waybill ID available" — admin cannot add one retroactively. Biteship API unavailable → error. Only 5 tracking statuses have visual mappings (confirmed, picking_up, dropping_off, in_transit, delivered). Unknown statuses render without meaningful position. No auto-refresh or polling — admin must remember to click Refresh. No WebSocket for real-time updates. |
| **What happens if it fails?** | Biteship error → red error box. No waybill → empty state. |
| **Does the workflow continue correctly?** | No. If the admin shipped without a waybill (Step 8), tracking is permanently unavailable with no recovery path. The manual-only refresh means admins won't see tracking updates in real time. |

---

### Step 10: Admin Completes Order

| Question | Answer |
|----------|--------|
| **Can this step be performed?** | Yes. The "Selesaikan Pesanan" button transitions to completed. |
| **Which page performs it?** | `components/admin/orders/order-actions.tsx` button "Selesaikan Pesanan" → confirmation dialog |
| **Which API performs it?** | `POST /api/admin/orders/[id]/actions` with `{ action: "complete" }` → `FulfillmentService.complete()` |
| **Which database tables are updated?** | `orders` (fulfillment_status → "completed", completed_at timestamp). `audit_logs` (event "order.completed"). |
| **What validations exist?** | State machine: "shipped" → "completed" is valid. Only from "shipped" status. |
| **What could fail?** | Same as other fulfillment steps: no transaction between DB and audit log. Attempting to complete from wrong status returns 422. |
| **What happens if it fails?** | Invalid transition → 422. Success → toast. |
| **Does the workflow continue correctly?** | Yes. This step is straightforward and well-guarded by the state machine. |

---

## Workflow Status Summary

| Step | Status | Reason |
|------|--------|--------|
| Customer places an order | ⚠️ **Partially Working** | No DB transaction across 3 tables; price manipulation possible (client sends prices unchecked); customer data silently overwritten on repeat checkout; no server-side phone validation |
| Customer pays | ⚠️ **Partially Working** | Main path has retry + audit + rollback, but duplicate legacy callback handler (`/api/orders/[id]/callback`) bypasses ALL state machine, gross amount validation, idempotency, and audit logging — can silently corrupt order status |
| Order appears in Admin | ✅ **Working** | Paginated listing with filters, search, sort. No auth on API. No auto-refresh. |
| Admin reviews order | ⚠️ **Partially Working** | Most info renders, but shipping address fields (Kelurahan, Kecamatan, Kota, Provinsi, Kode Pos) are **hardcoded "-"** — admin cannot see the destination address |
| Admin starts processing | ✅ **Working** | State machine works. Audit logged. Confirmation dialog present. No transaction for DB+audit. |
| Admin creates shipment | ❌ **Broken** | Admin cannot verify shipping address (hardcoded "-" from Step 4). Shipment data may be incomplete at checkout (postal code, area ID not validated). Item weight validated here but not at checkout — causing late failures. Single point of failure on Biteship. |
| Admin prints receipt | ✅ **Working** | PDF generation works with graceful degradation on missing logo. |
| Admin marks as shipped | ~~⚠️ **Partially Working**~~ ✅ **Working** | State transition works. ~~`waybill_id` is optional — admin can ship without one, permanently breaking tracking. UI gap: after "Buat Resi", the "Tandai Dikirim" button disappears.~~ Tombol "Tandai Dikirim" sekarang muncul untuk status `waybill_created` dan `picked_up`. Resi otomatis diambil dari database. |
| Admin tracks shipment | ⚠️ **Partially Working** | Works if waybill exists. But manual refresh only (no auto-fetch), limited status mapping (5/?? statuses), no waybill recovery if shipped without one. |
| Admin completes order | ✅ **Working** | Valid transition from "shipped". Timestamp set. Audit logged. |

---

## Verdict: Can an admin process 100 orders without manual intervention?

**No.** Here is every reason, ordered by severity:

### 1. Legacy callback handler will corrupt orders (CRITICAL)
The `/api/orders/[id]/callback` route is still active and duplicates the main `OrderService.processCallback`. It bypasses: gross amount validation, state machine enforcement, idempotency check, and audit logging. If Midtrans sends callbacks to both endpoints (or the wrong one), order statuses will be overwritten. In 100 orders, even a 1% callback overlap means at least 1 corrupted order. In practice, a single trigger causes visible corruption.

### 2. Admin cannot see shipping address (HIGH)
The order detail page hardcodes Kelurahan, Kecamatan, Kota, Provinsi, and Kode Pos to `"-"`. An admin processing 100 orders cannot verify where each order ships. They must guess or use external systems. Step 6 (create shipment) will fail with missing field errors.

### 3. Waybill not required for shipping (HIGH)
The `waybill_id` field is optional when marking an order as shipped. An admin processing 100 orders will inevitably forget to enter a waybill on at least some. Without a waybill, tracking (Step 9) is permanently broken with no recovery.

### 4. No database transactions for order creation (MEDIUM)
Creating an order involves separate calls for customer upsert, order insert, and items insert. A crash or network error between any two leaves orphan records or incomplete orders. In 100 orders with production-level traffic, this will happen.

### 5. Price manipulation vulnerability (MEDIUM)
The checkout API trusts client-submitted prices. An attacker (or a bug) can submit manipulated prices. The server applies no server-side price lookup. In 100 orders processed under real conditions, pricing discrepancies will go undetected.

### 6. Single-point failure on Biteship (MEDIUM)
Shipment creation depends entirely on Biteship API availability. If Biteship is down (maintenance, rate limit, auth expiry), no shipments can be created. No fallback shipping method exists for the admin.

### 7. No auto-refresh on admin listing (LOW)
The admin order list does not auto-refresh. An admin processing 100 orders needs to manually refresh to see new orders. Orders placed by customers won't appear without explicit navigation.

### 8. Tracking requires manual refresh (LOW)
The tracking panel does not auto-fetch on mount or poll for updates. An admin must click "Refresh" to see tracking status changes. For 100 orders, the admin must manually check each order's tracking.

### 9. Customer data silently overwritten (LOW)
The customer upsert uses `ON CONFLICT (email) DO UPDATE`, overwriting phone and address without history. A customer who changes their phone between orders will have their past orders linked to a different phone number.

### 10. No auth on any admin API (EXPOSED)
Every admin API endpoint has zero authentication. While this doesn't affect the functional workflow directly, it means any deployed instance exposes all 100 orders' customer PII (names, phones, addresses, emails) to anyone who finds the URLs.

---

## TOP 10 Improvements (Ordered by Business Impact)

| Rank | Issue | Business Impact | Affected Step |
|------|-------|----------------|---------------|
| 1 | **Disable legacy callback handler** | Prevents silent order status corruption — the #1 production risk. Every corrupted order means lost money, wrong fulfillment, or customer disputes. | Step 2 |
| 2 | **Show shipping address on order detail** | Admin cannot fulfill orders without seeing the destination. Currently processing blind — every shipment risks being sent to the wrong place. | Steps 4, 6 |
| 3 | **Require waybill ID to mark as shipped** | Without this, tracking is permanently broken. Customer cannot track their order, support gets swamped with "where is my order" calls. | Step 8 |
| 4 | **Add server-side price validation** | Client submits prices unchecked. Manipulated prices mean revenue loss. Even without fraud, a frontend bug could cause $0 orders. | Step 1 |
| 5 | **Add database transaction for order creation** | Prevent orphan records (customer without order, order without items). Ghost records accumulate and cause support confusion. | Step 1 |
| 6 | **Add authentication to admin API routes** | All customer PII is publicly accessible on any deployed instance. Legal liability under Indonesian PDP law. | Steps 3–10 |
| 7 | **Add Biteship fallback / offline mode** | When Biteship is down, the entire fulfillment pipeline stops. No shipments created, no orders shipped, no revenue. | Step 6 |
| 8 | **Auto-refresh admin order listing** | Admin must manually refresh to see new orders. Delayed order visibility means delayed fulfillment, worse customer experience. | Step 3 |
| 9 | **Auto-fetch tracking on panel mount** | Admin must know to click "Refresh" to see tracking. Most won't — they'll think tracking isn't available. | Step 9 |
| 10 | **Cross-validate order items against product catalog** | No guarantee that ordered products exist, are in stock, or cost the displayed price. Accepting arbitrary item data at checkout opens fraud surface. | Step 1 |

---

## Appendix: Files Examined

| File | Role |
|------|------|
| `app/checkout/page.tsx` | Checkout page shell |
| `components/checkout/CheckoutForm.tsx` | Checkout form + submission |
| `components/checkout/AreaSelect.tsx` | Geographic area selector |
| `app/api/payment/create/route.ts` | Payment creation (new) |
| `app/api/payment/route.ts` | Payment creation (legacy) |
| `app/api/orders/[id]/callback/route.ts` | Midtrans callback handler (legacy/duplicate) |
| `app/api/payment/callback/route.ts` | Midtrans callback handler (main) |
| `app/api/admin/orders/route.ts` | Admin order listing |
| `app/api/admin/orders/[id]/route.ts` | Admin order detail |
| `app/api/admin/orders/[id]/actions/route.ts` | Fulfillment actions |
| `app/api/admin/orders/[id]/notes/route.ts` | Admin notes |
| `app/api/admin/orders/[id]/shipment/route.ts` | Shipment creation |
| `app/api/admin/orders/[id]/tracking/route.ts` | Shipment tracking |
| `app/api/admin/orders/[id]/receipt/route.ts` | PDF receipt |
| `app/api/admin/orders/[id]/timeline/route.ts` | Audit timeline |
| `app/admin/orders/page.tsx` | Admin orders page |
| `app/admin/orders/[id]/page.tsx` | Admin order detail page |
| `components/admin/orders/table.tsx` | Order table |
| `components/admin/orders/detail-client.tsx` | Order detail client |
| `components/admin/orders/order-actions.tsx` | Action buttons + dialogs |
| `components/admin/orders/status-cards.tsx` | Status display cards |
| `components/admin/orders/toolbar.tsx` | Filter/search toolbar |
| `components/admin/orders/tracking-panel.tsx` | Tracking panel |
| `components/admin/orders/items-section.tsx` | Order items display |
| `components/admin/orders/customer-section.tsx` | Customer info display |
| `components/admin/orders/order-timeline.tsx` | Activity timeline |
| `lib/services/order.service.ts` | Order business logic |
| `lib/services/fulfillment.service.ts` | Fulfillment state machine |
| `lib/services/audit-log.service.ts` | Audit logging |
| `lib/services/payment/createSnap.ts` | Midtrans Snap creation |
| `lib/services/payment/callback.ts` | Callback handler (legacy) |
| `lib/services/payment/verifySignature.ts` | Signature verification |
| `lib/services/payment/types.ts` | Payment/fulfillment types |
| `lib/services/payment/mapper.ts` | Midtrans status mapper |
| `lib/services/shipping/shipment.service.ts` | Biteship shipment |
| `lib/services/shipping/tracking.service.ts` | Biteship tracking |
| `lib/services/shipping/biteship.ts` | Biteship HTTP client |
| `lib/repositories/order.repository.ts` | Order data access |
| `lib/repositories/customer.repository.ts` | Customer data access |
| `lib/repositories/audit-log.repository.ts` | Audit log data access |
| `lib/validation/admin-orders.ts` | Zod schemas for admin |
| `lib/flatRateShipping.ts` | Flat rate shipping logic |
| `types/checkout.ts` | Checkout type definitions |
| `types/index.ts` | General type definitions |
