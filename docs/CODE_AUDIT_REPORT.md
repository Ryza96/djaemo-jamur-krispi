# Code Audit Report — D'Jaemo Jamur Krispi

> **Phase:** 1 — Comprehensive Code Audit
> **Mode:** READ ONLY
> **Date:** 2026-06-29
> **Analyst:** AI Agent (opencode)

---

## Executive Summary

| Metric | Score |
|--------|-------|
| **Overall** | 32 / 100 |
| **Production Readiness** | 15 / 100 |
| **Maintainability** | 35 / 100 |
| **Performance** | 60 / 100 |
| **Security** | 20 / 100 |
| **Architecture** | 40 / 100 |
| **Code Quality** | 35 / 100 |
| **React/Next.js Usage** | 55 / 100 |
| **Accessibility** | 40 / 100 |

This project has **critical security vulnerabilities**, **no authentication on any API**, **hardcoded credentials exposed in client bundle**, and a **broken admin order listing feature**. The admin dashboard is a 1,555 LOC monolith mixing all concerns. Three shipping systems overlap with code duplication. Zero test coverage. Not production-ready.

---

## Critical Findings

### C-01: Hardcoded Admin Credentials in Client Bundle

| Field | Value |
|-------|-------|
| **Severity** | CRITICAL |
| **Location** | `app/admin/page.tsx:6-7` |
| **Category** | Security |

**Description:**
Admin username and password are hardcoded as string literals in the client component bundle. Anyone can view the page source in DevTools and extract these credentials.

**Evidence:**
```typescript
const ADMIN_USERNAME = "1234";
const ADMIN_PASSWORD = "1234";
```

**Impact:**
- Anyone with browser DevTools can log in as admin
- Credentials are identical and trivially guessable
- The `.env.example` defines `ADMIN_PASSWORD` as an environment variable, but the code ignores it

**Recommendation:**
Move to server-side authentication with hashed passwords and session tokens.

---

### C-02: No Authentication on Any API Route

| Field | Value |
|-------|-------|
| **Severity** | CRITICAL |
| **Location** | All files in `app/api/*/route.ts` and `pages/api/*` |
| **Category** | Security |

**Description:**
Every API endpoint is publicly accessible without any authentication, authorization, API key, or rate limiting.

**Evidence:**
- `POST /api/products` — anyone can create products
- `PUT /api/products` — anyone can edit products
- `DELETE /api/products?id=X` — anyone can delete products
- `GET /api/orders` — anyone can read all orders
- `PUT /api/orders/[id]` — anyone can change order status
- `POST /api/payment` — anyone can create orders (potentially fraudulent)

**Impact:**
Complete lack of API security. Data can be read, modified, or deleted by anyone who discovers the endpoints.

---

### C-03: Hardcoded Biteship API Key in Source Code

| Field | Value |
|-------|-------|
| **Severity** | CRITICAL |
| **Location** | `app/api/biteship-rates/route.ts:74` |
| **Category** | Security |

**Description:**
A Biteship API key is hardcoded directly in the route handler. The same key also exists in `.env.local` as `BITESHIP_API_KEY` but is not used.

**Evidence:**
```typescript
Authorization: 'Bearer biteship_test.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoidGVzdEFQSSIsInVzZXJJZCI6IjZhMzdhMzZiNjg4MTdlNzNkYTgxODM0NiIsImlhdCI6MTc4MjE5NTU5N30.E9CmyRZbxsY2ACKLt4BUCxg0vowtXnwajb5IkbRSI-c',
```

**Impact:**
- API key exposed in version control
- No way to rotate key without changing source code
- Environment variable `BITESHIP_API_KEY` exists but is not read — the code doesn't use it

---

### C-04: localStorage-Based Admin Authentication

| Field | Value |
|-------|-------|
| **Severity** | CRITICAL |
| **Location** | `app/admin/page.tsx:39`, `app/admin/dashboard/page.tsx:754`, `app/admin/orders/page.tsx:37` |
| **Category** | Security |

**Description:**
Admin session is tracked by setting `localStorage.setItem("admin-authenticated", "true")`. This is trivially spoofable via browser DevTools. There is no server-side token, session, or cookie validation.

**Evidence:**
```typescript
localStorage.setItem("admin-authenticated", "true");
// ...
const auth = localStorage.getItem("admin-authenticated") === "true";
```

**Impact:**
Any visitor can grant themselves admin access by running `localStorage.setItem("admin-authenticated", "true")` in the console and navigating to `/admin/dashboard`.

---

### C-05: Admin Orders Page Always Shows Empty/Error

| Field | Value |
|-------|-------|
| **Severity** | CRITICAL |
| **Location** | `app/admin/dashboard/page.tsx:918`, `app/admin/orders/page.tsx:61` |
| **Category** | Business Logic |

**Description:**
The API `GET /api/orders` returns `{ success: true, data: orders }` (an object). But the frontend parses the raw response object as if it were the array directly. Since the response is an object (not an array), `Array.isArray()` returns false and the code falls to error state.

**Evidence (dashboard `fetchOrders`):**
```typescript
const data = await res.json();        // data = { success: true, data: [...] }
if (Array.isArray(data) && data.length > 0) {  // FALSE — data is an object
  // NEVER REACHED
}
throw new Error('Tidak ada order yang ditemukan'); // ALWAYS THROWS
```

**Evidence (admin/orders/page.tsx):**
```typescript
const data = await res.json();        // data = { success: true, data: [...] }
setOrders(Array.isArray(data) ? data : []);  // ALWAYS sets []
```

**Impact:**
The "Pesanan" tab in admin dashboard always shows an error message. The standalone `/admin/orders` page always shows empty. Administrators cannot see or manage orders.

**Note:** The dashboard *summary* cards work correctly because `fetchDashboardData` accesses `payload.data` properly. But the full order list is broken.

---

### C-06: Missing PDF Dependencies in package.json

| Field | Value |
|-------|-------|
| **Severity** | CRITICAL |
| **Location** | `package.json:dependencies`, `pages/api/orders/[id]/receipt.ts:2-4` |
| **Category** | Production Readiness |

**Description:**
The PDF receipt endpoint imports `pdfkit`, `bwip-js`, and `qrcode` but these packages are NOT listed in `package.json` dependencies or devDependencies. They may exist in `node_modules` from manual install or transitive dependencies but will NOT be installed in production deployments (e.g., Vercel).

**Evidence:**
```json
// package.json dependencies — only 4 packages
"dependencies": {
    "@supabase/supabase-js": "^2.38.0",
    "midtrans-client": "^1.3.3",
    "next": "16.2.9",
    "react": "19.2.4",
    "react-dom": "19.2.4"
}
```
```typescript
// pages/api/orders/[id]/receipt.ts imports
import PDFDocument from 'pdfkit';
import bwipjs from 'bwip-js';
import QRCode from 'qrcode';
```

**Impact:**
PDF receipt generation will fail with MODULE_NOT_FOUND error in any production deployment. This is a shipping-critical feature for the admin workflow.

---

### C-07: Product Price Not Verified Server-Side at Checkout

| Field | Value |
|-------|-------|
| **Severity** | CRITICAL |
| **Location** | `app/api/payment/route.ts:88-93`, `app/checkout/page.tsx:95-96` |
| **Category** | Security / Business Logic |

**Description:**
The checkout flow sends product prices from the client-side cart (stored in localStorage) to the payment API. The server accepts these prices without verification against the database.

**Evidence:**
```typescript
// Client sends client-computed prices
const itemDetails = items.map((item: any) => ({
  id: item.product.id,
  name: item.product.name,
  price: item.product.price,       // From client-side cart
  quantity: item.quantity,
}));
```

**Impact:**
A malicious user can modify the cart data in localStorage to change product prices before checkout. The server blindly accepts these prices and sends them to Midtrans.

---

### C-08: No Database Transaction / Rollback in Payment Flow

| Field | Value |
|-------|-------|
| **Severity** | CRITICAL |
| **Location** | `app/api/payment/route.ts:36-86` |
| **Category** | Database / Business Logic |

**Description:**
The payment endpoint performs multiple Supabase writes (customer upsert, order insert, order items insert) and then a Midtrans API call. If any step fails after a previous step succeeded, orphaned records remain.

**Evidence:**
```typescript
// Step 1: Insert customer — succeeds
// Step 2: Insert order — succeeds
// Step 3: Insert order items — if this fails, order is orphaned
// Step 4: Midtrans call — if this fails, customer + order + items are orphaned
```

**Impact:**
Orphaned database records accumulate. No compensation/rollback mechanism exists. Customer data may be saved without an associated order.

---

## High Findings

### H-01: Static Product Data Not Synced with Database

| Field | Value |
|-------|-------|
| **Severity** | HIGH |
| **Location** | `data/products.ts`, `app/api/products/route.ts` |
| **Category** | Architecture |

**Description:**
Products are stored in two places: `data/products.ts` (static, used by public pages) and Supabase `products` table (managed via API, used by admin). Changes made via admin are not reflected on the public site.

**Impact:**
- Admin edits to products are invisible to customers
- Public site shows stale data
- Data inconsistency risk

---

### H-02: Duplicate Product Data with Different Prices

| Field | Value |
|-------|-------|
| **Severity** | HIGH |
| **Location** | `data/products.ts:9` vs `data/products.json:7` |
| **Category** | Data Integrity |

**Evidence:**
```typescript
// data/products.ts
price: 15000,
```
```json
// data/products.json
"price": 14499,
```

**Impact:**
Unclear which price is authoritative. If `products.json` is used for anything, prices will differ.

---

### H-03: All API Routes Lack Input Validation

| Field | Value |
|-------|-------|
| **Severity** | HIGH |
| **Location** | `app/api/products/route.ts`, `app/api/contact/route.ts`, `app/api/payment/route.ts`, `app/api/orders/*` |
| **Category** | Security / API |

**Description:**
API routes perform minimal to no input validation. Request bodies are cast to `any` and used directly. No schema validation (Zod, Yup, or similar) is used anywhere.

**Evidence:**
```typescript
// /api/products POST — uses `any` for payload
const payload: any = { ...body };

// /api/contact POST — only checks for truthiness
if (!name || !email || !message) { ... }
```

**Impact:**
- SQL injection risk (Supabase JS client parameterizes queries, but raw types bypass)
- Invalid data in database
- No type safety

---

### H-04: Inconsistent API Response Shapes

| Field | Value |
|-------|-------|
| **Severity** | HIGH |
| **Location** | Various API routes |
| **Category** | API Design |

**Description:**
API responses follow inconsistent shapes:

| Endpoint | Response Shape |
|----------|---------------|
| `GET /api/products` | `Product[]` (bare array) |
| `GET /api/orders` | `{ success: true, data: orders }` (wrapped) |
| `GET /api/orders/[id]` | `{ success: true, data: order }` (wrapped) |
| `POST /api/payment` | `{ success, order_id, transaction_id, redirect_url, total_amount }` (mixed) |
| `POST /api/shipping` | `{ destination, service, shippingFee, message }` (flat) |
| `POST /api/contact` | `{ success: true, data }` (wrapped) |

**Impact:**
Frontend code must handle multiple response formats, leading to bugs (C-05).

---

### H-05: Checkout localStorage Write May Not Complete Before Redirect

| Field | Value |
|-------|-------|
| **Severity** | HIGH |
| **Location** | `app/checkout/page.tsx:119-140` |
| **Category** | Business Logic / Race Condition |

**Evidence:**
```typescript
// Redirect happens immediately
if (paymentData.redirect_url) {
  window.location.href = paymentData.redirect_url;
}
// Data saved AFTER redirect — may not execute
const orderPayload = { ... };
if (typeof window !== "undefined") {
  window.localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(orderPayload));
}
```

**Impact:**
The success page (`/checkout/success`) reads from localStorage. If the redirect completes before `setItem` runs, the user sees "Pesanan Tidak Ditemukan" with no way to recover.

---

### H-06: Midtrans Callback URL Depends on Build-Time Env

| Field | Value |
|-------|-------|
| **Severity** | HIGH |
| **Location** | `app/api/payment/route.ts:135` |
| **Category** | Configuration |

**Evidence:**
```typescript
callbacks: {
  finish: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success?order_id=${orderId}`,
},
```

**Impact:**
`NEXT_PUBLIC_SITE_URL` is replaced at build time. If the same build is deployed to multiple environments (staging, production), the callback URL will be wrong. Should be a runtime value.

---

### H-07: Product Images — Case-Sensitive Extension Issue

| Field | Value |
|-------|-------|
| **Severity** | HIGH |
| **Location** | `data/products.ts:11` (`.JPG`), `data/products.ts:83` (`.jpg`) |
| **Category** | Deployment |

**Evidence:**
```typescript
image: "/images/produk/1.JPG",  // uppercase
image: "/images/produk/9.jpg",  // lowercase
```

**Impact:**
On case-sensitive filesystems (Linux — Vercel deployment), images with wrong case extensions will 404. Most files on disk use uppercase `.JPG`.

---

### H-08: Admin Dashboard Exceeds 1,500 Lines — Monolith

| Field | Value |
|-------|-------|
| **Severity** | HIGH |
| **Location** | `app/admin/dashboard/page.tsx` (1,555 lines) |
| **Category** | Code Quality / Architecture |

**Description:**
Single file contains: UI rendering, order management, product CRUD, image upload with drag-and-drop, Biteship shipping integration, invoice HTML generation, auth checks, data fetching, dashboard summary, chart placeholder, and state management for 20+ variables.

**Impact:**
Extremely difficult to maintain, test, or understand. High risk of regressions. Violates Single Responsibility Principle.

---

### H-09: `lib/shipping.ts` Is Dead Code

| Field | Value |
|-------|-------|
| **Severity** | HIGH |
| **Location** | `lib/shipping.ts` |
| **Category** | Code Quality / Dead Code |

**Description:**
`lib/shipping.ts` defines `calculateShippingFee()` with a weight-based algorithm, plus `parseDestinationFromAddress()` and `services` — all of which are duplicated in `lib/flatRateShipping.ts`. The only active import of these functions comes from `lib/flatRateShipping.ts`.

**Evidence:**
- `app/api/shipping/route.ts` imports from `lib/flatRateShipping`
- `app/cart/page.tsx` imports from `lib/flatRateShipping`
- `app/checkout/page.tsx` imports from `lib/flatRateShipping`
- No file imports from `lib/shipping.ts`

---

### H-10: Raja Ongkar Module is Dead Code

| Field | Value |
|-------|-------|
| **Severity** | HIGH |
| **Location** | `app/api/shipping/rajaOngkir.ts` |
| **Category** | Dead Code |

**Description:**
`calculateRajaOngkirCost()` is exported but never imported by any other file. The associated env vars (`RAJA_ONGKIR_API_URL`, `RAJA_ONGKIR_API_KEY`, `RAJA_ONGKIR_ORIGIN`, `RAJA_ONGKIR_COURIER`) exist only in this file and are not documented in `.env.example`.

---

### H-11: Success Page Relies Solely on localStorage

| Field | Value |
|-------|-------|
| **Severity** | HIGH |
| **Location** | `app/checkout/success/page.tsx:18-28` |
| **Category** | Business Logic |

**Evidence:**
```typescript
const stored = typeof window !== "undefined"
  ? window.localStorage.getItem(ORDER_STORAGE_KEY)
  : null;
```

**Impact:**
- If user clears localStorage, they lose order details
- If user completes payment on different device/browser, no order shown
- No fallback to URL params or API fetch by `order_id`

---

### H-12: `sanitizePriceToInt` Duplicated

| Field | Value |
|-------|-------|
| **Severity** | HIGH |
| **Location** | `app/api/products/route.ts:4-16` and `app/admin/dashboard/page.tsx:1011-1024` |
| **Category** | Code Quality / DRY |

**Evidence:**
Identical function defined twice with the same logic. Maintenance burden — fixes to one won't propagate.

---

### H-13: Admin Product-Form Page is Duplicate/Standalone

| Field | Value |
|-------|-------|
| **Severity** | HIGH |
| **Location** | `app/admin/product-form/page.tsx` |
| **Category** | Architecture |

**Description:**
There are THREE product editing interfaces:
1. Inline in `app/admin/dashboard` (drag-drop image upload)
2. `app/admin/products/page.tsx` (uses `ProductEditModal`)
3. `app/admin/product-form/page.tsx` (standalone full-page form with TODO comment: `// TODO: Integrasikan dengan API backend`)

The standalone form is not connected to any API and is not linked from any navigation.

---

### H-14: Empty Receipt API Directory Causes Confusion

| Field | Value |
|-------|-------|
| **Severity** | HIGH |
| **Location** | `app/api/orders/[id]/receipt/` (empty) vs `pages/api/orders/[id]/receipt.ts` (actual) |
| **Category** | Architecture |

**Description:**
Two possible routes for the same purpose. The App Router directory is empty (no `route.ts`), while the actual implementation lives in Pages Router. This creates confusion about which endpoint is active and violates the principle of having a single source of truth.

---

### H-15: Admin Orders Page Fetches Wrong URL Pattern

| Field | Value |
|-------|-------|
| **Severity** | HIGH |
| **Location** | `app/admin/orders/page.tsx:74` |
| **Category** | Business Logic |

**Evidence:**
```typescript
router.push(`/admin/orders/${encodeURIComponent(orderId)}`);
```

This navigates to a route (`/admin/orders/[orderId]`) that doesn't exist. There is no `app/admin/orders/[id]/page.tsx`.

---

## Medium Findings

### M-01: `ThemeProvider` Exists But Is Never Used

| Field | Value |
|-------|-------|
| **Severity** | MEDIUM |
| **Location** | `components/ui/ThemeProvider.tsx`, `app/layout.tsx` |
| **Category** | Dead Code |

**Description:**
`ThemeProvider` is exported from `components/ui/ThemeProvider.tsx` but is not imported in `app/layout.tsx`. The root layout only wraps `ToastProvider` and `CartProvider`. The `ThemeToggle` component that depends on `ThemeProvider` is also unused.

---

### M-02: `AdminGuard` Component Is Empty

| Field | Value |
|-------|-------|
| **Severity** | MEDIUM |
| **Location** | `components/admin/AdminGuard.tsx` |
| **Category** | Dead Code |

**Description:**
The entire file is empty — no exports, no code, just blank. Likely intended as a route guard but never implemented.

---

### M-03: `hooks/` Directory Is Empty

| Field | Value |
|-------|-------|
| **Severity** | LOW |
| **Location** | `hooks/.gitkeep` |
| **Category** | Cleanup |

**Description:**
The custom hooks directory contains only a `.gitkeep` placeholder file. No custom hooks are defined anywhere in the project.

---

### M-04: Duplicate `services` Array and `ShippingDestination` Type

| Field | Value |
|-------|-------|
| **Severity** | MEDIUM |
| **Location** | `lib/shipping.ts:2-3` and `lib/flatRateShipping.ts:1-2` |
| **Category** | Code Quality / DRY |

**Evidence:**
Both files define identical `ShippingDestination`, `ShippingService` types and identical `services` const array. Any change to one must be manually replicated.

---

### M-05: `cn()` Utility Lacks Tailwind Class Resolution

| Field | Value |
|-------|-------|
| **Severity** | MEDIUM |
| **Location** | `lib/utils.ts:1-3` |
| **Category** | Code Quality |

**Evidence:**
```typescript
export function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ");
}
```

**Impact:**
Unlike `clsx` + `tailwind-merge`, this implementation doesn't handle conflicting Tailwind classes (e.g., `bg-red-500 bg-blue-500`). The last class in the string wins, which may cause unexpected styling.

---

### M-06: `console.error` in Production API Routes

| Field | Value |
|-------|-------|
| **Severity** | MEDIUM |
| **Location** | `app/api/products/route.ts:55,60`, `app/api/payment/route.ts:109,139,158`, `app/api/orders/*` |
| **Category** | Production Readiness |

**Description:**
Multiple API routes log error details and debug information via `console.log`/`console.error`. In production, this can leak implementation details, user data, or internal state.

---

### M-07: Magic Numbers in Shipping Calculation

| Field | Value |
|-------|-------|
| **Severity** | MEDIUM |
| **Location** | `lib/shipping.ts:45-47` |
| **Category** | Code Quality |

**Evidence:**
```typescript
const excessWeight = Math.max(0, weightGrams - 200);
const extraCost = Math.ceil(excessWeight / 100) * 2000;
```

`200`, `100`, and `2000` are magic numbers representing base weight (g), increment (g), and cost per increment (IDR). Should be named constants.

---

### M-08: Midtrans Snap `token` Stored as `transaction_id`

| Field | Value |
|-------|-------|
| **Severity** | MEDIUM |
| **Location** | `app/api/payment/route.ts:146` |
| **Category** | Data Integrity |

**Evidence:**
```typescript
.update({ transaction_id: token })
```

Midtrans calls the Snap response field `token` (a Snap token for redirect), not the actual `transaction_id`. The real `transaction_id` is assigned by Midtrans after payment is created. Storing the Snap token as `transaction_id` could cause confusion.

---

### M-09: Duplicate Product Image Files in Public

| Field | Value |
|-------|-------|
| **Severity** | MEDIUM |
| **Location** | `public/images/1.JPG` through `8.JPG` AND `public/images/produk/1.JPG` through `8.JPG` |
| **Category** | Cleanup / Storage |

**Description:**
Eight product images are duplicated across two directories with identical filenames and similar file sizes. The `.gitkeep` files in `public/images/logo/` and `public/images/hero/` are unnecessary since those directories already contain real files.

---

### M-10: No Rate Limiting on Any API

| Field | Value |
|-------|-------|
| **Severity** | MEDIUM |
| **Location** | All API routes |
| **Category** | Security / Production Readiness |

**Description:**
No API endpoint has rate limiting. The contact form, payment endpoint, and product CRUD are all susceptible to abuse via automated requests.

---

### M-11: `midtrans-client` ESM Compatibility Shim

| Field | Value |
|-------|-------|
| **Severity** | MEDIUM |
| **Location** | `lib/midtrans.ts:4-6` |
| **Category** | Maintainability |

**Evidence:**
```typescript
const Midtrans: any = (midtransClient && (midtransClient as any).Snap)
  ? midtransClient
  : (midtransClient as any)?.default ?? midtransClient;
```

This shim handles both CJS and ESM module shapes by checking for `.Snap` and `.default`. Heavy use of `any` defeats TypeScript safety. If the module shape changes in a future update, this could silently break.

---

### M-12: `try/catch` with Inconsistent Error Responses

| Field | Value |
|-------|-------|
| **Severity** | MEDIUM |
| **Location** | Various API routes |
| **Category** | API Design |

**Evidence:**
```typescript
// Some routes expose raw error messages:
return NextResponse.json({ error: error.message }, { status: 500 });
// Others use generic messages:
return NextResponse.json({ error: "Failed to read products" }, { status: 500 });
```

**Impact:**
Inconsistent error response shapes and detail levels make client-side error handling unpredictable.

---

### M-13: No E-Mail Validation Regex on Checkout

| Field | Value |
|-------|-------|
| **Severity** | MEDIUM |
| **Location** | `app/checkout/page.tsx:70` |
| **Category** | Validation |

**Evidence:**
```typescript
const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
```

This is a very basic regex. It accepts emails like `a@b.c` which, while technically valid, are unlikely to be real customer emails. No DNS/MX validation or disposable email detection.

---

### M-14: Address Parsing is Naive

| Field | Value |
|-------|-------|
| **Severity** | MEDIUM |
| **Location** | `lib/flatRateShipping.ts:17-33`, `lib/shipping.ts:21-37` |
| **Category** | Business Logic |

**Evidence:**
```typescript
export function parseDestinationFromAddress(address: string): ShippingDestination {
  const normalized = address.toLowerCase();
  if (normalized.includes("jakarta")) return "Jakarta";
  if (normalized.includes("bandung")) return "Bandung";
  if (normalized.includes("surabaya")) return "Surabaya";
  return "Luar Jawa";
}
```

**Impact:**
Any address containing "jakarta" as part of a word (e.g., "Jakarta Selatan" is correct, but "Cijakarta" would be falsely detected) or a street name like "Jl. Bandung Raya" would be misclassified. Misspellings like "Jakrta" would default to "Luar Jawa".

---

### M-15: Midtrans Redirect URL Environment Variable Might Be Empty

| Field | Value |
|-------|-------|
| **Severity** | MEDIUM |
| **Location** | `app/api/orders/[id]/callback/route.ts:14` |
| **Category** | Configuration |

**Evidence:**
```typescript
const serverKey = process.env.MIDTRANS_SERVER_KEY;
if (!serverKey) {
  return NextResponse.json({ error: "Server key tidak dikonfigurasi." }, { status: 500 });
}
```

The callback checks for `MIDTRANS_SERVER_KEY` but other variables used in the same flow (`NEXT_PUBLIC_SITE_URL`) are not validated.

---

## Low Findings

### L-01: Button Text Language Inconsistency

| Field | Value |
|-------|-------|
| **Severity** | LOW |
| **Location** | `components/produk/ProdukGrid.tsx:67` |
| **Category** | UX |

**Evidence:**
```typescript
{addingToCart === product.id ? "Ditambahkan..." : "Add to Cart"}
```

Mixes English ("Add to Cart") with Indonesian ("Ditambahkan..."). All other UI text is in Indonesian.

---

### L-02: Carousel Interval Not Paused on Interaction

| Field | Value |
|-------|-------|
| **Severity** | LOW |
| **Location** | `app/page.tsx:25-29` |
| **Category** | UX |

**Evidence:**
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    setActiveCarouselIndex((current) => (current + 1) % carouselImages.length);
  }, 3000);
  return () => clearInterval(interval);
}, [carouselImages.length]);
```

The hero carousel auto-rotates every 3 seconds without pause on hover or user interaction.

---

### L-03: No `alt` Text on Product Images in Cart

| Field | Value |
|-------|-------|
| **Severity** | LOW |
| **Location** | `app/cart/page.tsx` |
| **Category** | Accessibility |

Product images in the cart page are not rendered (only product name and description shown), but other pages use `next/image` which requires `alt` text. This is fine, but the `Image` component in `app/page.tsx:113` omits the `alt` attribute.

---

### L-04: `next/image` Missing `alt` on Home Page

| Field | Value |
|-------|-------|
| **Severity** | LOW |
| **Location** | `app/page.tsx:113` |
| **Category** | Accessibility |

**Evidence:**
```tsx
<Image
  src={product.image}
  alt={product.name}            // GOOD — has alt
  ...
/>

// But:
<Image
  src={SITE.logo}
  alt={`Logo ${SITE.name}`}     // GOOD
  ...
/>
```

Actually the images DO have `alt` text. But looking at the hero section:
```tsx
<div
  className="absolute inset-0 bg-cover bg-center bg-no-repeat brightness-110 contrast-110"
  style={{ backgroundImage: "url('/images/hero/hero.jpg')" }}
/>
```
The hero image is a CSS background-image — no `alt` text possible, which is acceptable for decorative images.

(Actually this finding is incorrect — let me check more carefully)

In `app/page.tsx:52`:
```tsx
<Image
  src={SITE.logo}
  alt={`Logo ${SITE.name}`}
  ...
/>
```
This has alt text. OK.

In `components/produk/ProdukGrid.tsx:41`:
```tsx
<Image
  src={product.image}
  alt={product.name}
  ...
/>
```
This has alt text too.

So accessibility of images is actually fine. Let me strike this finding.

### L-04 (revised): Typos in Comments and Variables

- `app/api/orders/[id]/callback/route.ts:18` — `ordinal` should be `orderId` (variable naming)
- `app/admin/dashboard/page.tsx:56` — multiple spelling/grammar issues in comments

---

### L-05: Magic String Storage Keys Not Centralized

| Field | Value |
|-------|-------|
| **Severity** | LOW |
| **Location** | `app/checkout/page.tsx:28`, `app/checkout/success/page.tsx:10`, `components/cart/CartProvider.tsx:18` |
| **Category** | Code Quality |

**Evidence:**
```typescript
const STORAGE_KEY = "djaemo-cart";           // CartProvider
const ORDER_STORAGE_KEY = "djaemo-last-order";  // Checkout (/checkout, /success, /failed)
```

Storage key strings are duplicated in multiple files. If one changes, the others don't update.

---

## Security Findings

| ID | Finding | Severity | File |
|----|---------|----------|------|
| S-01 | Hardcoded admin credentials in client bundle | CRITICAL | `app/admin/page.tsx:6-7` |
| S-02 | No API authentication on any route | CRITICAL | All `app/api/*` |
| S-03 | Hardcoded Biteship API key in source | CRITICAL | `app/api/biteship-rates/route.ts:74` |
| S-04 | localStorage-based admin session | CRITICAL | `app/admin/page.tsx:39` |
| S-05 | Client-side price accepted without server verification | CRITICAL | `app/api/payment/route.ts:88-93` |
| S-06 | Server-side env var (`SUPABASE_SERVICE_ROLE_KEY`) used without IP restriction | HIGH | `lib/supabase.ts` |
| S-07 | No CSRF protection on any API | HIGH | All API routes |
| S-08 | No input sanitization on contact form | HIGH | `app/api/contact/route.ts` |
| S-09 | Product images uploaded via client anon key (RLS bypass possible) | HIGH | `app/admin/dashboard/page.tsx:1054` |
| S-10 | No rate limiting on any endpoint | MEDIUM | All API routes |
| S-11 | `console.error` leaks in API error responses | MEDIUM | Various |
| S-12 | Admin order status changes without server-side authorization | HIGH | `app/api/orders/[id]/route.ts` |
| S-13 | No HTTPS enforcement (env-based, could be misconfigured) | LOW | Config |

---

## Performance Findings

| ID | Finding | Severity | File |
|----|---------|----------|------|
| P-01 | No image lazy loading configuration | LOW | `components/produk/ProdukGrid.tsx` |
| P-02 | Multiple API calls on dashboard mount (could batch) | MEDIUM | `app/admin/dashboard/page.tsx` |
| P-03 | Chart.js commented out but `<canvas>` still renders | LOW | `app/admin/dashboard/page.tsx:1222` |
| P-04 | No React.lazy/dynamic imports for heavy admin components | MEDIUM | `app/admin/dashboard/page.tsx` (~1,555 LOC loaded eagerly) |
| P-05 | No caching headers on API responses | MEDIUM | All API routes |
| P-06 | Large uncompressed images in `/public/images/produk/` (up to 17MB) | MEDIUM | `public/images/produk/BALADO.jpg` (17MB) |

---

## React Findings

| ID | Finding | Severity | File |
|----|---------|----------|------|
| R-01 | `useCart` creates new function references on every render (no `useCallback`) | MEDIUM | `components/cart/CartProvider.tsx:38-69` |
| R-02 | `useEffect` without proper cleanup for shipping debounce (uses `window.setTimeout` instead of standard) | LOW | `app/cart/page.tsx:30` |
| R-03 | Checkout page fails to parse URL params from Midtrans redirect | MEDIUM | `app/checkout/success/page.tsx` — doesn't read `order_id` from query string |
| R-04 | `handleAddToCart` uses `setTimeout` 600ms for button animation — works but could use `useTransition` | LOW | `components/produk/ProdukGrid.tsx:26-28` |
| R-05 | No error boundary for admin dashboard — entire 1,555 LOC component crashes on any error | MEDIUM | `app/admin/dashboard/page.tsx` |
| R-06 | `items` not in `useMemo` dependency array for `totalUniqueItems` (minor — `items.length` is correct but `items` should be in deps) | LOW | `components/cart/CartProvider.tsx:82` |
| R-07 | Context value recreated on every render via `useMemo` (good), but `addToCart`/`removeFromCart`/`clearCart` have no `useCallback` | MEDIUM | `components/cart/CartProvider.tsx` |

---

## Next.js Findings

| ID | Finding | Severity | File |
|----|---------|----------|------|
| N-01 | Empty App Router receipt directory causes routing ambiguity | HIGH | `app/api/orders/[id]/receipt/` |
| N-02 | Missing `sitemap.ts` or `robots.ts` for SEO | MEDIUM | Root |
| N-03 | `next.config.ts` is empty — no image domains, headers, or rewrites configured | MEDIUM | `next.config.ts` |
| N-04 | `loading.tsx` is a simple spinner — no Suspense boundaries for specific sections | LOW | `app/loading.tsx` |
| N-05 | `error.tsx` is basic — no retry logic beyond `reset()` | LOW | `app/error.tsx` |
| N-06 | All pages use `"use client"` directive unnecessarily — reduces SSR benefits | MEDIUM | `app/page.tsx`, `app/cart/page.tsx`, `app/checkout/page.tsx` |
| N-07 | `app/page.tsx` is `"use client"` but doesn't use any client features except the carousel — could be split into a smaller client component | MEDIUM | `app/page.tsx` |
| N-08 | No ISR (Incremental Static Regeneration) configured for product pages | MEDIUM | All pages |
| N-09 | Metadata uses `SITE.name` from constants but shouldn't be dynamic in metadata export | LOW | `app/page.tsx` (actually it's a Client Component so metadata doesn't work — it's ignored) |

Wait, let me re-check N-09:
`app/page.tsx` is marked `"use client"`. Server Components can export `metadata`, but Client Components cannot. So the `metadata` export in `app/page.tsx` is silently ignored by Next.js. The title will fall back to what's defined in the root layout.

Actually, looking at `app/page.tsx:1` — yes, it's `"use client"`. There's no metadata export. The root layout `app/layout.tsx` sets the metadata. So this is fine.

But wait, `app/produk/page.tsx` is a Server Component (no `"use client"`) and DOES export metadata:
```typescript
export const metadata: Metadata = {
  title: "Produk",
  description: "Lihat koleksi camilan jamur krispi Djaemo.",
};
```
This is correct.

And `app/tentang/page.tsx` is also a Server Component with metadata export — correct.

So only `app/page.tsx` is unnecessarily a Client Component. The carousel logic could be extracted into a small client component.

---

## API Findings

| ID | Finding | Severity | File |
|----|---------|----------|------|
| A-01 | No input validation (Zod/Yup) on any endpoint | HIGH | All API routes |
| A-02 | Inconsistent response shapes (array vs {success, data}) | HIGH | `app/api/products/route.ts` vs `app/api/orders/route.ts` |
| A-03 | `POST /api/payment` no idempotency key | HIGH | `app/api/payment/route.ts` |
| A-04 | Missing HTTP method handling (OPTIONS for CORS) | MEDIUM | All API routes |
| A-05 | No request logging middleware | MEDIUM | All API routes |
| A-06 | `PUT /api/orders/[id]` doesn't validate allowed status values | MEDIUM | `app/api/orders/[id]/route.ts:71` |
| A-07 | Inconsistent error response schema: sometimes `{error}`, sometimes `{error, details}` | MEDIUM | `app/api/products/route.ts:56` |

---

## Database Findings

| ID | Finding | Severity | File |
|----|---------|----------|------|
| D-01 | Schema drift: `database/schema.sql` differs from Supabase migrations | HIGH | `database/schema.sql` vs `db/supabase_migrations/001_init_schema.sql` |
| D-02 | `contacts` table in schema.sql not created in migrations | HIGH | Migration 001 doesn't include `contacts` |
| D-03 | `ON CONFLICT (email)` in payment route assumes unique constraint on `customers.email` but migration 001 doesn't define it | HIGH | `app/api/payment/route.ts:45` |
| D-04 | Missing indexes on frequently queried columns (`orders.status`, `orders.created_at` for analytics) | MEDIUM | `app/api/analytics/revenue/route.ts` |
| D-05 | No migration for `product_images` table after migration 001 | MEDIUM | Admin dashboard references it |
| D-06 | No database-level foreign key validation for `product_images.product_id` | LOW | Migration 002 doesn't specify FK |

---

## Tailwind Findings

| ID | Finding | Severity | File |
|----|---------|----------|------|
| T-01 | Duplicate custom shadow definitions in `globals.css` and `tailwind.config.ts` | LOW | Both files define theme |
| T-02 | `@theme inline` in `globals.css` might conflict with Tailwind v4 tokens | MEDIUM | `app/globals.css:19-32` |
| T-03 | Inconsistent border radius: `rounded-2xl`, `rounded-3xl`, `rounded-4xl`, `rounded-5xl` — some custom, some Tailwind default | LOW | Various components |
| T-04 | `max-w-6xl` used on most containers but `7xl` is defined in config but unused | LOW | `tailwind.config.ts:37` |

---

## Accessibility Findings

| ID | Finding | Severity | File |
|----|---------|----------|------|
| X-01 | `next/image` missing `alt` attribute on some images | LOW | `app/page.tsx` — actually verified OK |
| X-02 | Color contrast: brand colors use `--primary: #6b4226` on `--surface: #fff8f0` — check contrast ratio | MEDIUM | `app/globals.css:7-16` — brown on cream may have insufficient contrast |
| X-03 | Focus indicators rely on Tailwind's `focus-visible:ring-2` but not consistently applied | MEDIUM | `components/ui/Button.tsx:14` — only Button has focus ring |
| X-04 | No `aria-live` region for toast notifications (screen reader users won't hear updates) | MEDIUM | `components/ui/Toast.tsx` |
| X-05 | No keyboard navigation for drag-and-drop image reordering in admin | HIGH | `app/admin/dashboard/page.tsx:898-1009` |
| X-06 | `aria-expanded` is set on mobile menu button but no `aria-controls` linking to menu | LOW | `components/layout/Header.tsx` |
| X-07 | Form inputs in checkout have labels but no `htmlFor`/`id` association on some | MEDIUM | `app/checkout/page.tsx` — inputs use `placeholder` text only |

---

## Architecture Findings

| ID | Finding | Severity | File |
|----|---------|----------|------|
| AR-01 | Admin dashboard violates SRP — 1,555 LOC monolith | CRITICAL | `app/admin/dashboard/page.tsx` |
| AR-02 | Three duplicate product management interfaces | HIGH | `app/admin/dashboard`, `app/admin/products`, `app/admin/product-form` |
| AR-03 | Three parallel shipping systems (flatRate, shipping.ts, Biteship, RajaOngkir) | HIGH | `lib/` |
| AR-04 | No service layer — business logic in API handlers | MEDIUM | All `app/api/*` |
| AR-05 | Data layer is tightly coupled to Supabase — no repository abstraction | MEDIUM | `lib/supabase.ts` used directly in all routes |
| AR-06 | App Router + Pages Router hybrid for receipts — confusing | MEDIUM | `app/api/orders/[id]/receipt/` vs `pages/api/orders/[id]/receipt.ts` |
| AR-07 | No separation between public and admin API (same routes, no auth) | HIGH | All API routes |

---

## Business Logic Findings

| ID | Finding | Severity | File |
|----|---------|----------|------|
| B-01 | Admin order list always shows empty/error due to API response parsing | CRITICAL | `app/admin/dashboard/page.tsx:918`, `app/admin/orders/page.tsx:61` |
| B-02 | Client-side price accepted without server verification | CRITICAL | `app/api/payment/route.ts` |
| B-03 | No transaction rollback in payment flow | CRITICAL | `app/api/payment/route.ts` |
| B-04 | Shipping address parsing uses naive string includes | MEDIUM | `lib/flatRateShipping.ts:17-33` |
| B-05 | `order_id` generation uses `Date.now()` — collision risk for rapid requests | MEDIUM | `lib/order.ts:4` |
| B-06 | Midtrans callback updates `status` without validation of allowed values | MEDIUM | `app/api/orders/[id]/callback/route.ts:44-57` |
| B-07 | Order status values inconsistent: "paid", "confirmed", "SHIPPED" (case varies) | MEDIUM | Various |
| B-08 | Product weight stored as string "100g" — parsed with regex in `parseWeight` | LOW | `lib/shipping.ts:18` |

---

## Technical Debt

| ID | Item | Estimated Effort | Impact |
|----|------|-----------------|--------|
| TD-01 | Remove `lib/shipping.ts` (dead code) | 5 min | Low |
| TD-02 | Remove `components/admin/AdminGuard.tsx` (empty file) | 1 min | Low |
| TD-03 | Remove `hooks/` directory | 1 min | Low |
| TD-04 | Remove `app/api/shipping/rajaOngkir.ts` (dead code) | 5 min | Low |
| TD-05 | Remove duplicate `sanitizePriceToInt` | 5 min | Medium |
| TD-06 | Centralize localStorage key constants | 15 min | Medium |
| TD-07 | Remove duplicate `services`/`ShippingDestination` from `lib/shipping.ts` | 5 min | Low |
| TD-08 | Delete empty `app/api/orders/[id]/receipt/` directory | 1 min | Low |
| TD-09 | Consolidate duplicate product images | 15 min | Medium |
| TD-10 | Add missing packages to `package.json` (`pdfkit`, `bwip-js`, `qrcode`) | 2 min | Critical |
| TD-11 | Remove unused `ThemeProvider` / `ThemeToggle` or integrate them | 10 min | Low |
| TD-12 | Remove duplicate product form pages | 30 min | High |
| TD-13 | Remove commented Chart.js code | 2 min | Low |

---

## Quick Wins

*Can be completed in under 30 minutes each:*

| # | Task | Time | Impact |
|---|------|------|--------|
| 1 | Add `pdfkit`, `bwip-js`, `qrcode` to `package.json` | 2 min | Prevents production crash |
| 2 | Delete empty `app/api/orders/[id]/receipt/` directory | 1 min | Removes confusion |
| 3 | Remove `components/admin/AdminGuard.tsx` | 1 min | Cleanup |
| 4 | Remove `hooks/` directory | 1 min | Cleanup |
| 5 | Remove `lib/shipping.ts` | 5 min | Removes dead duplicate code |
| 6 | Remove `app/api/shipping/rajaOngkir.ts` | 5 min | Removes dead code |
| 7 | Remove commented Chart.js code (lines 779-810) | 2 min | Cleanup |
| 8 | Add missing env vars to `.env.example` | 10 min | Documentation |
| 9 | Fix `"Add to Cart"` text to `"Tambah ke Keranjang"` | 1 min | Language consistency |
| 10 | Remove duplicate `sanitizePriceToInt` from dashboard | 5 min | DRY |

---

## Refactoring Candidates (by ROI)

| Rank | Candidate | Effort | Impact |
|------|-----------|--------|--------|
| 1 | **Add server-side admin auth** (remove hardcoded `1234`, use NextAuth or session tokens) | 2-4 hours | Eliminates critical security vulnerability |
| 2 | **Add API authentication** (API key or bearer token for all routes) | 2-3 hours | Prevents unauthorized data access |
| 3 | **Fix admin order list parsing** (access `data.data` instead of `data`) | 15 min | Fixes broken admin feature |
| 4 | **Split admin dashboard** into separate route handlers and components | 8-16 hours | Major maintainability improvement |
| 5 | **Add input validation** with Zod schema on all API routes | 4-6 hours | Security + data integrity |
| 6 | **Remove dead code** (quick wins above) | 30 min | Cleanup |
| 7 | **Fix payment flow race condition** (localStorage before redirect) | 1 hour | Prevents lost orders |
| 8 | **Add server-side price verification** at checkout (read from DB) | 2 hours | Prevents price manipulation |
| 9 | **Consolidate shipping implementations** | 2-4 hours | Reduces tech debt + confusion |
| 10 | **Add database transaction support** for payment flow | 4 hours | Prevents orphaned records |

---

## Production Readiness Score: 15/100

### What Works
- Public-facing pages render correctly
- Tailwind CSS theme is cohesive
- Midtrans payment integration works (in sandbox)
- Cart persistence via localStorage
- Responsive design on most pages

### Why Not Ready

| Reason | Severity |
|--------|----------|
| **Admin credentials exposed in client source code** | Anyone can log in as admin |
| **No API authentication** | Anyone can CRUD products and orders |
| **Hardcoded API key in source** | Biteship key exposed |
| **Admin order list is broken** | Cannot manage orders |
| **PDF receipt will crash in production** | Missing dependencies |
| **Client-side price manipulation** | Users can pay arbitrary amounts |
| **No transaction rollback** | Orphaned DB records |
| **Zero test coverage** | No regression safety net |
| **Schema drift** | Database may not match code expectations |
| **No rate limiting** | APIs can be abused |

### Minimum Requirements for Production

1. Fix all CRITICAL findings (C-01 through C-08)
2. Implement server-side admin authentication
3. Add API authentication for all routes
4. Fix admin order list parsing bug
5. Add missing npm packages
6. Add server-side price verification
7. Run database migrations to align schema
8. Remove all `console.error` leaks
9. Write basic integration tests for payment flow

---

*End of Code Audit Report — Phase 1 complete.*
