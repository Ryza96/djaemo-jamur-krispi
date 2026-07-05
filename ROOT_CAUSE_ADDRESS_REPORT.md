# Root Cause Report: Admin Order Detail Cannot Display Complete Shipping Address

---

## Field-by-Field Trace

### Recipient Name

| Stage | File | Status |
|-------|------|--------|
| Checkout Form | `components/checkout/CheckoutForm.tsx` — sends `state.customerInfo.name` | ✔ exists |
| API Zod Schema | `app/api/payment/create/route.ts:12` — `customerInfo.name` validated | ✔ exists |
| Service Layer | `lib/services/order.service.ts:39` — `CustomerRepository.upsert({ name })` | ✔ exists |
| Database | `customers.name` column | ✔ stored |
| Admin API | `lib/repositories/order.repository.ts:58` — `customers.name` in `OrderDetailRow` | ✔ returned |
| UI | `components/admin/orders/customer-section.tsx:29` — `customer?.name ?? "-"` | ✔ rendered |

---

### Phone (WhatsApp)

| Stage | File | Status |
|-------|------|--------|
| Checkout Form | `CheckoutForm.tsx` — sends `state.customerInfo.whatsapp` | ✔ exists |
| API Zod Schema | `payment/create/route.ts:14` — `whatsapp` validated | ✔ exists |
| Service Layer | `order.service.ts:40` — upserted as `phone` | ✔ exists |
| Database | `customers.phone` + `orders.customer_phone` | ✔ stored |
| Admin API | `OrderDetailRow.customers.phone` | ✔ returned |
| UI | `customer-section.tsx:22` — `customer?.phone ?? "-"` | ✔ rendered |

---

### Street Address

| Stage | File | Status |
|-------|------|--------|
| Checkout Form | `CheckoutForm.tsx` — sends `state.shippingAddress.street` | ✔ exists |
| API Zod Schema | `payment/create/route.ts:19` — `street` validated | ✔ exists |
| Service Layer | `order.service.ts:34` — **collapsed into combined string** via `combineAddress()` | ⚠️ **transformed** |
| Database | `orders.shipping_address` — stored as combined string (e.g., `"Jl. Merdeka, Kel. X, Kec. Y, Kota, Prov, 12345"`) | ⚠️ **combined only** |
| Admin API | `OrderDetailRow.shipping_address` — returned as single string | ✔ returned (combined) |
| UI | `customer-section.tsx:32` — `shippingAddress ?? "-"` rendered as "Alamat Lengkap" | ✔ rendered (combined) |

---

### Province

| Stage | File | Status |
|-------|------|--------|
| Checkout Form | `CheckoutForm.tsx` — sends `state.shippingAddress.province` | ✔ exists |
| API Zod Schema | `payment/create/route.ts:24` — `province` validated | ✔ exists |
| Service Layer | `order.service.ts:34` — `combineAddress()` merges into combined string. **Individual value lost** | ✘ **collapsed** |
| Database | No `province` column in `orders`. Only embedded inside `shipping_address` text. | ✘ **not stored separately** |
| Admin API | No separate field in `OrderDetailRow`. Only `shipping_address` (combined string). | ✘ **not returned** |
| UI | `customer-section.tsx:37` — hardcoded `value="-"` | ✘ **never rendered** |

**Evidence**: `lib/services/payment/mapper.ts:24-40` — `combineAddress()` takes individual fields → joins them with `", "`:
```typescript
export function combineAddress(address: {
  street: string; kelurahan: string; kecamatan: string;
  city: string; province: string; postalCode: string;
}): string {
  const parts = [
    address.street,
    `Kel. ${address.kelurahan}`,
    `Kec. ${address.kecamatan}`,
    address.city,
    address.province,
    address.postalCode,
  ];
  return parts.filter(Boolean).join(", ");
}
```

---

### City

| Stage | File | Status |
|-------|------|--------|
| Checkout Form | `CheckoutForm.tsx` — sends `state.shippingAddress.city` | ✔ exists |
| API Zod Schema | `payment/create/route.ts:23` — `city` validated | ✔ exists |
| Service Layer | `order.service.ts:50` — stored as `destination: params.shippingAddress.city` AND merged into combined string | ✔ stored as `destination` |
| Database | `orders.destination` column (just city name) + embedded in combined string | ✔ stored |
| Admin API | `OrderDetailRow` has no typed `destination` field (not in `OrderRow` interface), but `select("*")` returns all columns | ⚠️ **exists but untyped** |
| UI | `customer-section.tsx:37` — hardcoded `value="-"` despite data existing in DB | ✘ **never rendered** |

**Evidence**: `lib/repositories/order.repository.ts:69` — `destination` column IS stored during insert:
```typescript
destination: params.destination,  // params.destination = params.shippingAddress.city
```

But `components/admin/orders/customer-section.tsx:37` hardcodes:
```tsx
<AdminKeyValue label="Kota" value="-" />
```

---

### District (Kecamatan)

| Stage | File | Status |
|-------|------|--------|
| Checkout Form | `CheckoutForm.tsx` — sends `state.shippingAddress.kecamatan` | ✔ exists |
| API Zod Schema | `payment/create/route.ts:22` — `kecamatan` validated | ✔ exists |
| Service Layer | `order.service.ts:34` — **collapsed into combined string**, no separate column | ✘ **collapsed** |
| Database | No `kecamatan` column. Only inside combined `shipping_address` text. | ✘ **not stored separately** |
| Admin API | No separate field returned | ✘ **not returned** |
| UI | `customer-section.tsx:36` — hardcoded `value="-"` | ✘ **never rendered** |

---

### Village (Kelurahan)

| Stage | File | Status |
|-------|------|--------|
| Checkout Form | `CheckoutForm.tsx` — sends `state.shippingAddress.kelurahan` | ✔ exists |
| API Zod Schema | `payment/create/route.ts:21` — `kelurahan` validated | ✔ exists |
| Service Layer | `order.service.ts:34` — **collapsed into combined string**, no separate column | ✘ **collapsed** |
| Database | No `kelurahan` column. Only inside combined `shipping_address` text. | ✘ **not stored separately** |
| Admin API | No separate field returned | ✘ **not returned** |
| UI | `customer-section.tsx:37` — hardcoded `value="-"` | ✘ **never rendered** |

---

### Postal Code

| Stage | File | Status |
|-------|------|--------|
| Checkout Form | `CheckoutForm.tsx` — sends `state.shippingAddress.postalCode` | ✔ exists |
| API Zod Schema | `payment/create/route.ts:25` — `postalCode` validated | ✔ exists |
| Service Layer | `order.service.ts:34` — collapsed into combined string. **`InsertOrderParams` has NO `postal_code` field** | ✘ **never stored** |
| Database | `orders.postal_code` column exists in schema (per `OrderRow` line 19) but is **never written** by any insert | ✘ **always NULL** |
| Admin API | `OrderRow.postal_code: string | null` returned | ✔ returned (always null) |
| UI | `customer-section.tsx:38` — hardcoded `value="-"` | ✘ **never rendered** |

**Evidence**: `lib/repositories/order.repository.ts:63-79` — `InsertOrderParams` has no `postal_code`:
```typescript
export interface InsertOrderParams {
  order_id: string; customer_id: number; subtotal: number;
  shipping_fee: number; total_amount: number; destination: string;
  shipping_service: string; courier_company: string; courier_type: string;
  shipping_cost: number; customer_phone: string; shipping_address: string;
  notes: string | null; payment_status: PaymentStatus; fulfillment_status: FulfillmentStatus;
}
// No postal_code field
```

---

### Destination Area ID

| Stage | File | Status |
|-------|------|--------|
| Checkout Form | `CheckoutForm.tsx` — sends `state.shippingAddress.areaId` | ✔ exists |
| API Zod Schema | `payment/create/route.ts` — **`areaId` NOT in API Zod schema** (look at lines 18-25) | ✘ **dropped at API** |
| Service Layer | Never received | ✘ never received |
| Database | `orders.destination_area_id` exists (migration 009) but **never written** | ✘ **always NULL** |
| Admin API | `OrderDetailRow.destination_area_id` returned (always null) | ✔ returned (null) |
| UI | Not rendered at all | ✘ **never rendered** |

**Evidence**: `app/api/payment/create/route.ts:18-25` — API Zod schema only accepts 6 fields:
```typescript
shippingAddress: z.object({
  street: z.string().min(1),
  kelurahan: z.string().min(1),
  kecamatan: z.string().min(1),
  city: z.string().min(1),
  province: z.string().min(1),
  postalCode: z.string().min(1),
}), // No areaId, districtName, latitude, longitude
```

---

### Latitude / Longitude

| Stage | File | Status |
|-------|------|--------|
| Checkout Form | `CheckoutForm.tsx` — sends `state.shippingAddress.latitude` / `longitude` | ✔ exists |
| API Zod Schema | `payment/create/route.ts` — **NOT in API Zod schema** | ✘ **dropped at API** |
| Service Layer | Never received | ✘ never received |
| Database | No lat/lng column in any table | ✘ **never stored** |
| Admin API | Never returned | ✘ never returned |
| UI | Not rendered | ✘ **never rendered** |

---

### District Name (from Biteship)

| Stage | File | Status |
|-------|------|--------|
| Checkout Form | `CheckoutForm.tsx` — sends `state.shippingAddress.districtName` | ✔ exists |
| API Zod Schema | `payment/create/route.ts` — **NOT in API Zod schema** | ✘ **dropped at API** |
| Service Layer | Never received | ✘ never received |
| Database | No column exists | ✘ **never stored** |
| Admin API | Never returned | ✘ never returned |
| UI | Not rendered | ✘ **never rendered** |

---

## Data Flow Diagram

```
Checkout Form (CheckoutForm.tsx)
  shippingAddress = { street, kelurahan, kecamatan, city, province,
                      postalCode, areaId, districtName, latitude, longitude }
  |
  | POST /api/payment/create (JSON.stringify)
  |
  ▼
API Route (app/api/payment/create/route.ts:18-25)
  Zod Schema accepts ONLY: street, kelurahan, kecamatan, city, province, postalCode
  ✘ areaId, districtName, latitude, longitude DROPPED HERE
  |
  | combineAddress(shippingAddress) → single string
  |   "street, Kel. kelurahan, Kec. kecamatan, city, province, postalCode"
  |
  ▼
Service Layer (lib/services/order.service.ts:34)
  combineAddress(params.shippingAddress) → single string
  ✘ Individual fields COLLAPSED into shipping_address text column
  |
  | InsertOrderParams: { shipping_address: fullAddress, destination: city, ... }
  | ✘ postal_code NOT in InsertOrderParams → never stored
  | ✘ kelurahan NOT in InsertOrderParams → never stored
  | ✘ kecamatan NOT in InsertOrderParams → never stored
  | ✘ province NOT in InsertOrderParams → never stored
  | ✘ areaId NOT in InsertOrderParams → never stored
  | ✘ districtName NOT in InsertOrderParams → never stored
  | ✘ lat/lng NOT in InsertOrderParams → never stored
  |
  ▼
Database (orders table)
  shipping_address: "Jl. Merdeka No.1, Kel. Citarum, Kec. Bandung Wetan, Bandung, Jawa Barat, 40115"
  destination: "Bandung"  (city only)
  ✘ All other fields: MISSING or NULL
  |
  | SELECT *, order_items(*), customers(*)
  |
  ▼
Admin API (app/api/admin/orders/[id]/route.ts)
  OrderDetailRow.shipping_address: "Jl. Merdeka No.1, Kel. Citarum, Kec. Bandung Wetan, Bandung, Jawa Barat, 40115"
  ✘ No separate kelurahan / kecamatan / province / postalCode fields
  |
  ▼
UI (components/admin/orders/detail-client.tsx:170)
  <CustomerSection
    customer={customer}
    shippingAddress={order.shipping_address}  // single combined string
  />
  |
  ▼
UI (components/admin/orders/customer-section.tsx:34-38)
  <AdminKeyValue label="Kelurahan" value="-" />    ← HARDCODED "-"
  <AdminKeyValue label="Kecamatan" value="-" />    ← HARDCODED "-"
  <AdminKeyValue label="Kota"      value="-" />    ← HARDCODED "-"  (even though `destination` column has it)
  <AdminKeyValue label="Provinsi"  value="-" />    ← HARDCODED "-"
  <AdminKeyValue label="Kode Pos"  value="-" />    ← HARDCODED "-"
```

---

## Conclusion

**C. The Admin API returns it, but the UI never renders it — HOWEVER, the root cause is earlier: the individual address fields were collapsed into a single text column before being stored.**

More precisely, the investigation reveals **two compounding defects**:

| # | Defect | Location | Impact |
|---|--------|----------|--------|
| 1 | **`combineAddress()` collapses structured address fields into a single text blob** | `lib/services/payment/mapper.ts:24-40` called from `lib/services/order.service.ts:34` | Individual fields (kelurahan, kecamatan, province, postalCode) become unrecoverable once stored |
| 2 | **Zod schema at API route silently drops `areaId`, `districtName`, `latitude`, `longitude`** | `app/api/payment/create/route.ts:18-25` vs `lib/validation/checkout.ts:50-53` | These fields never reach the service layer |
| 3 | **`InsertOrderParams` has no `postal_code` field** | `lib/repositories/order.repository.ts:63-79` | Postal code is only embedded in combined text, never stored in its own column |
| 4 | **UI hardcodes `"-"` for all structured address fields** | `components/admin/orders/customer-section.tsx:34-38` | Even when data is available in DB (e.g., `destination` column for city), the UI ignores it |

The **primary root cause** is defect #1: the `combineAddress()` function at `lib/services/payment/mapper.ts:24-40` collapses six individual data fields into one opaque string. Once stored as `orders.shipping_address`, the structured data is lost and can never be recovered as individual fields. The UI's hardcoded `"-"` in `customer-section.tsx:34-38` is a symptom of this fundamental data model problem.

---

## Summary Table

| Field | Checkout | API Zod | Service Layer | Database | Admin API | Admin UI |
|-------|----------|---------|---------------|----------|-----------|----------|
| Recipient Name | ✔ | ✔ | ✔ customers.name | ✔ | ✔ | ✔ |
| Phone | ✔ | ✔ | ✔ customers.phone | ✔ | ✔ | ✔ |
| Street Address | ✔ | ✔ | ⚠️ combined into text | ⚠️ embedded | ⚠️ embedded | ✔ as combined text |
| Province | ✔ | ✔ | ✘ **collapsed** | ✘ **not separate** | ✘ **not separate** | ✘ **hardcoded "-"** |
| City | ✔ | ✔ | ✔ destination column | ✔ | ✔ (untyped) | ✘ **hardcoded "-"** |
| District (Kecamatan) | ✔ | ✔ | ✘ **collapsed** | ✘ **not separate** | ✘ **not separate** | ✘ **hardcoded "-"** |
| Village (Kelurahan) | ✔ | ✔ | ✘ **collapsed** | ✘ **not separate** | ✘ **not separate** | ✘ **hardcoded "-"** |
| Postal Code | ✔ | ✔ | ✘ **never inserted** | ✘ **always NULL** | ✔ (null) | ✘ **hardcoded "-"** |
| Area ID | ✔ | ✘ **dropped** | ✘ never received | ✘ never written | ✔ (null) | ✘ not rendered |
| District Name | ✔ | ✘ **dropped** | ✘ never received | ✘ never stored | ✘ never returned | ✘ not rendered |
| Latitude | ✔ | ✘ **dropped** | ✘ never received | ✘ never stored | ✘ never returned | ✘ not rendered |
| Longitude | ✔ | ✘ **dropped** | ✘ never received | ✘ never stored | ✘ never returned | ✘ not rendered |
