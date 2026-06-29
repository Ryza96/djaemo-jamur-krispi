# Architecture Discovery Report — D'Jaemo Jamur Krispi

> **Phase:** 0.5 — Deep Architecture Discovery
> **Mode:** READ ONLY
> **Date:** 2026-06-29
> **Analyst:** AI Agent (opencode)

---

## Executive Summary

D'Jaemo Jamur Krispi is a **monolithic Next.js 16 e-commerce application** for a mushroom cracker brand in Indonesia. The application is a single-binary that serves both the public-facing storefront (product catalog, cart, checkout) and an admin dashboard (order management, product CRUD, shipping integration). The backend is minimal — API routes run inside the Next.js runtime, and the sole database is Supabase PostgreSQL. Payment is handled by Midtrans Snap (redirect method). Shipping uses a custom flat-rate system as default, with partial integration to Biteship and Raja Ongkir. There is **no customer authentication**, **no testing framework**, and **no formal state management** beyond React Context. The admin authentication is a hardcoded username/password stored in localStorage.

---

## Project Overview

| Attribute | Value |
|-----------|-------|
| Project Name | djaemojamurkrispi |
| Version | 0.1.0 |
| Private | true |
| Purpose | E-commerce for mushroom cracker brand |
| Language | TypeScript 5.x |
| Framework | Next.js 16.2.9 |
| UI Library | React 19.2.4 |
| CSS | Tailwind CSS 4.x |
| Database | Supabase (PostgreSQL) |
| Payment | Midtrans Snap |
| Deployment Target | Vercel |
| Package Manager | npm |
| Source Files | 80 (ts/tsx/js/mjs/sql/css/md) |
| Total Source Lines | ~6,200 |
| Test Coverage | None |
| Linting | ESLint 9 (core-web-vitals + ts) |

---

## Folder Structure Analysis

### Root Level

```
djaemojamurkrispi/
├── app/                    # Next.js App Router — all pages & API routes
├── components/             # React components split by domain
├── lib/                    # Utilities, service integrations, constants
├── types/                  # TypeScript ambient declarations
├── data/                   # Static product data (hardcoded, duplicated with DB)
├── database/               # SQL schema (reference/copy)
├── db/                     # Supabase migration files
├── pages/                  # Legacy Pages Router (PDF receipt endpoint only)
├── hooks/                  # Custom hooks (empty directory)
├── scripts/                # Node.js migration scripts
├── public/                 # Static assets (images, favicon)
├── docs/                   # Architecture reports (new)
├── node_modules/           # Dependencies
├── .next/                  # Build artifacts
```

### App Router (`app/`)

| Subfolder | Purpose |
|-----------|---------|
| `admin/` | Admin login + dashboard + CRUD pages |
| `admin/dashboard/` | Single-page admin dashboard (~1555 LOC) |
| `admin/orders/` | Orders listing page |
| `admin/products/` | Product CRUD page |
| `admin/product-form/` | Product add/edit form (standalone, alternative) |
| `api/analytics/revenue/` | Revenue aggregation endpoint |
| `api/biteship-rates/` | Biteship courier rates proxy |
| `api/contact/` | Contact form submission |
| `api/orders/` | Orders list + [id] detail/update + callback |
| `api/payment/` | Midtrans payment creation |
| `api/products/` | Product CRUD |
| `api/qrisly/` | QR code generation |
| `api/shipping/` | Flat rate shipping calculator |
| `cart/` | Shopping cart page |
| `checkout/` | Checkout form page |
| `checkout/success/` | Post-payment success page |
| `checkout/failed/` | Post-payment failure page |
| `kontak/` | Contact page |
| `produk/` | Product catalog page |
| `tentang/` | About page |

### Pages Router (`pages/`)

| Path | Purpose |
|------|---------|
| `api/orders/[id]/receipt.ts` | PDF receipt generation (pdfkit, bwip-js, qrcode) |

### Components (`components/`)

| Subfolder | Purpose |
|-----------|---------|
| `admin/` | Admin-specific: AdminGuard (empty), ProductEditModal |
| `cart/` | CartProvider (context + state) |
| `contact/` | ContactForm |
| `layout/` | Header, Footer, Logo |
| `produk/` | ProdukGrid (product listing cards) |
| `sections/` | Section wrapper, PageHeader |
| `ui/` | Button, Toast, ThemeProvider, ThemeToggle |

### Lib (`lib/`)

| File | Responsibility |
|------|----------------|
| `supabase.ts` | Server-side Supabase client (service_role key) |
| `supabase-client.ts` | Client-side Supabase client (anon key) |
| `midtrans.ts` | Midtrans Snap + CoreApi initialization |
| `order.ts` | Order ID generator (`buildOrderId`) |
| `shipping.ts` | Weight-based shipping calculator (legacy) |
| `flatRateShipping.ts` | Flat rate shipping calculator (active) |
| `utils.ts` | `cn()` class name helper, `formatPrice()` |
| `constants.ts` | Site metadata, nav links, social links |

---

## Feature Map

### 1. Landing Page

| Attribute | Value |
|-----------|-------|
| Location | `app/page.tsx` |
| Type | Client Component |
| Dependencies | `Button`, `Section`, `products[]`, `SITE`, `formatPrice` |
| External APIs | None |
| Database | None (uses hardcoded data) |
| Complexity | Low. Image carousel auto-rotates, static content |

### 2. Product Catalog

| Attribute | Value |
|-----------|-------|
| Location | `app/produk/page.tsx` (page), `components/produk/ProdukGrid.tsx` (grid) |
| Type | Server Component (page) + Client Component (grid) |
| Dependencies | `products[]`, `useCart`, `useToast`, `Button`, `formatPrice` |
| External APIs | None |
| Database | Reads from hardcoded `data/products.ts` (NOT from Supabase) |
| Notes | Products are displayed from static data, not the database |

### 3. Cart

| Attribute | Value |
|-----------|-------|
| Location | `components/cart/CartProvider.tsx` (context), `app/cart/page.tsx` (page) |
| Type | Client Component |
| Storage | localStorage (`djaemo-cart` key) |
| State | React Context (`CartContext`) |
| API Calls | `POST /api/shipping` (for shipping fee) |
| Database | None |
| Notes | Cart persists in localStorage, no server-side cart |

### 4. Checkout

| Attribute | Value |
|-----------|-------|
| Location | `app/checkout/page.tsx` |
| Type | Client Component |
| API Calls | `/api/shipping`, `/api/payment` |
| External APIs | Midtrans (via `/api/payment`) |
| Database | Supabase: `customers`, `orders`, `order_items` (insert) |
| Notes | Form validates email, collects customer data, triggers Midtrans redirect |

### 5. Payment

| Attribute | Value |
|-----------|-------|
| Location | `app/api/payment/route.ts` |
| Type | Server Route Handler |
| Dependencies | `snap` (Midtrans), `supabase` (server) |
| External APIs | Midtrans Snap (`createTransaction`) |
| Database | Supabase: `customers` (upsert), `orders` (insert), `order_items` (insert) |
| Callback | `POST /api/orders/[id]/callback` (Midtrans webhook) |
| Notes | Creates customer, order, order_items in single request |

### 6. Midtrans Callback

| Attribute | Value |
|-----------|-------|
| Location | `app/api/orders/[id]/callback/route.ts` |
| Type | Server Route Handler |
| Dependencies | `core` (Midtrans), `supabase`, `crypto` |
| Security | HMAC signature verification |
| Flow | Validates `signature_key` → checks transaction status → updates `orders.status` |
| Notes | Maps settlement→paid, pending→pending, deny/cancel/expire→failed |

### 7. Order Management

| Attribute | Value |
|-----------|-------|
| Location | `app/api/orders/route.ts`, `app/api/orders/[id]/route.ts` |
| Type | Server Route Handlers |
| Database | Supabase: `orders` (select, update), `order_items`, `customers` |
| Notes | Supports lookup by UUID `id` or string `order_id` |

### 8. Admin Dashboard

| Attribute | Value |
|-----------|-------|
| Location | `app/admin/` (login), `app/admin/dashboard/page.tsx` (main) |
| Type | Client Component |
| Auth | Hardcoded `1234/1234` in client code, stored in `localStorage("admin-authenticated")` |
| API Calls | `/api/orders`, `/api/orders/[id]`, `/api/products`, `/api/shipping` (Biteship) |
| External APIs | Biteship (order creation), Supabase Storage (image upload) |
| Database | Supabase: `orders`, `products`, `product_images` |
| Notes | Monolithic ~1555 LOC file with mixed responsibilities |

### 9. Shipping

| Attribute | Value |
|-----------|-------|
| **Flat Rate** | `lib/flatRateShipping.ts` + `app/api/shipping/route.ts` — base rate + multipliers |
| **Biteship** | `app/api/biteship-rates/route.ts` — proxy to Biteship API |
| **Biteship Order** | Handled in `app/admin/dashboard` `handleCetakResi()` |
| **Raja Ongkir** | `app/api/shipping/rajaOngkir.ts` — stub/unused in active routes |
| Notes | Three parallel shipping implementations |

### 10. Analytics

| Attribute | Value |
|-----------|-------|
| Location | `app/api/analytics/revenue/route.ts` |
| Type | Server Route Handler |
| Database | Supabase: `orders` (revenue sum by status + date) |
| Notes | Simple aggregation endpoint |
| Dashboard | Admin dashboard shows hardcoded placeholder chart (Chart.js commented out) |

### 11. Contact

| Attribute | Value |
|-----------|-------|
| Location | `components/contact/ContactForm.tsx`, `app/kontak/page.tsx` |
| API | `POST /api/contact` |
| Database | Supabase: `contacts` (insert) |
| Notes | Stores name, email, phone, message |

### 12. QR Code

| Attribute | Value |
|-----------|-------|
| Location | `app/api/qrisly/route.ts` |
| External API | `api.qrserver.com` (free QR code API) |
| Notes | Generates QR code for Midtrans transaction |

---

## Component Inventory

### Layout Components

| Component | File | Lines | Reusable | Used By |
|-----------|------|-------|----------|---------|
| `Header` | `components/layout/Header.tsx` | 107 | Yes | `app/layout.tsx` |
| `Footer` | `components/layout/Footer.tsx` | 86 | Yes | `app/layout.tsx` |
| `Logo` | `components/layout/Logo.tsx` | 45 | Yes | `Header`, `Footer` |

### UI Components

| Component | File | Lines | Reusable | Used By |
|-----------|------|-------|----------|---------|
| `Button` | `components/ui/Button.tsx` | 41 | Yes | All pages (10+ uses) |
| `Toast` / `ToastProvider` | `components/ui/Toast.tsx` | 84 | Yes | `app/layout.tsx`, `ProdukGrid`, `ContactForm` |
| `ThemeProvider` | `components/ui/ThemeProvider.tsx` | 47 | Yes | Not imported in `layout.tsx` — **dead?** |
| `ThemeToggle` | `components/ui/ThemeToggle.tsx` | 34 | Yes | Not imported anywhere — **dead** |

### Section/Page Components

| Component | File | Lines | Reusable | Used By |
|-----------|------|-------|----------|---------|
| `Section` | `components/sections/Section.tsx` | 15 | Yes | All pages (10+ uses) |
| `PageHeader` | `components/sections/Section.tsx` | 22 | Yes | Cart, Checkout, Produk, Tentang, Kontak |

### Feature Components

| Component | File | Lines | Reusable | Used By |
|-----------|------|-------|----------|---------|
| `CartProvider` / `useCart` | `components/cart/CartProvider.tsx` | 88 | Yes | `app/layout.tsx`, `Header`, `ProdukGrid`, `CartPage`, `CheckoutPage` |
| `ProdukGrid` | `components/produk/ProdukGrid.tsx` | 68 | Yes | `app/produk/page.tsx` |
| `ContactForm` | `components/contact/ContactForm.tsx` | 101 | Yes | `app/kontak/page.tsx` |

### Admin Components

| Component | File | Lines | Reusable | Used By |
|-----------|------|-------|----------|---------|
| `AdminGuard` | `components/admin/AdminGuard.tsx` | 0 | N/A | **Empty file — dead** |
| `ProductEditModal` | `components/admin/ProductEditModal.tsx` | 42 | Yes | `app/admin/products/page.tsx` |

### Context Providers (in `app/layout.tsx`)

| Provider | File | Used In Layout |
|----------|------|----------------|
| `ToastProvider` | `components/ui/Toast.tsx` | Yes |
| `CartProvider` | `components/cart/CartProvider.tsx` | Yes |
| `ThemeProvider` | `components/ui/ThemeProvider.tsx` | **NOT in layout** |

---

## API Inventory

### Public API Routes (App Router)

| Method | Endpoint | Request | Response | Auth | DB | External |
|--------|----------|---------|----------|------|----|----------|
| GET | `/api/products` | — | `Product[]` | None | `products` + `product_images` | — |
| POST | `/api/products` | `{name,description,price,weight,image,images}` | Created product | None | `products` | — |
| PUT | `/api/products` | `{id,name,description,price,weight,images}` | Updated product | None | `products`, `product_images` | — |
| DELETE | `/api/products?id=X` | Query param `id` | `{success:true}` | None | `products`, storage | Supabase Storage |
| POST | `/api/shipping` | `{address,service}` | `{destination,service,shippingFee}` | None | — | — |
| POST | `/api/biteship-rates` | `{origin_lat,origin_lng,dest_lat,dest_lng,weight,items,couriers}` | `{rates[]}` | None | — | Biteship API |
| POST | `/api/payment` | `{orderId,items,subtotal,shippingFee,customerData}` | `{redirect_url,transaction_id}` | None | `customers`, `orders`, `order_items` | Midtrans |
| POST | `/api/qrisly` | `{transactionId,orderId}` | `{qr_url}` | None | — | qrserver.com |
| POST | `/api/contact` | `{name,email,phone,message}` | `{success:true}` | None | `contacts` | — |
| GET | `/api/orders` | `?customer_id=&status=` | `{orders[]}` | None | `orders`, `order_items` | — |
| GET | `/api/orders/[id]` | Path param | `{order}` | None | `orders`, `order_items`, `customers` | — |
| PUT | `/api/orders/[id]` | `{status,payment_method,notes}` | Updated order | None | `orders` | — |
| POST | `/api/orders/[id]/callback` | Midtrans callback body | Status update | HMAC verify | `orders` | Midtrans |
| GET | `/api/analytics/revenue` | `?status=&months=` | `{total_revenue,order_count}` | None | `orders` | — |

### Legacy API (Pages Router)

| Method | Endpoint | Response | Description |
|--------|----------|----------|-------------|
| GET | `/api/orders/[id]/receipt` | PDF (application/pdf) | Generates PDF receipt with barcode, QR code |

### Missing Auth on All API Routes

**No API route has authentication** except the Midtrans callback (HMAC signature). Any endpoint is publicly accessible.

---

## Database Inventory

### Tables

| Table | PK | Row Level Security | Notes |
|-------|----|--------------------|-------|
| `products` | `id text` | Public read | Created in migration 001 |
| `customers` | `id uuid` | No public access | Created in migration 001 |
| `orders` | `id text` | No public access | Created in migration 001 |
| `order_items` | `id uuid` | No public access | Created in migration 001 |
| `contacts` | `id bigserial` | Not specified | Listed in schema.sql |
| `product_images` | — | Not specified | Added in migration 002 |

### Relations (Foreign Keys)

| From | To | On Delete |
|------|----|-----------|
| `orders.customer_id` | `customers.id` | CASCADE |
| `order_items.order_id` | `orders.id` | CASCADE |
| `product_images.product_id` | `products.id` | Not specified |

### Migrations

| File | Purpose |
|------|---------|
| `001_init_schema.sql` | Creates `products`, `customers`, `orders`, `order_items` with RLS |
| `002_add_images.sql` | Adds `images text[]` column to `products` |
| `003_add_postal_code.sql` | Adds `postal_code varchar(20)` to `orders` |
| `004_backfill_postal_code.sql` | Sets default `00000` for existing orders |
| `005_add_shipping_columns.sql` | Adds `customer_phone`, `shipping_address`, `courier_company`, `courier_type`, `shipping_cost`, `qr_code_url` to `orders` |

### Indexes (from schema.sql)

- `idx_orders_customer_id`
- `idx_orders_transaction_id`
- `idx_orders_status`
- `idx_order_items_order_id`
- `idx_customers_email`

### Schema Drift

There is a **significant schema mismatch** between:
1. **`database/schema.sql`** — A more complete schema with `customers` (BIGSERIAL), `orders` (UUID PK), `order_items` (BIGSERIAL PK), includes `contacts` table
2. **`db/supabase_migrations/001_init_schema.sql`** — Live Supabase schema with different types: `customers` (UUID PK), `orders` (text PK), `order_items` (UUID PK), no `contacts`
3. **Code expectations** — Admin dashboard references `customers.address`, `customers.name`, `orders.postal_code`, `orders.courier_company`, `orders.customer_phone`, etc.

---

## Environment Inventory

### Database & Auth

| Variable | Used In | In `.env.example` | In `.env.local` |
|----------|---------|-------------------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `lib/supabase.ts`, `lib/supabase-client.ts` | Yes | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `lib/supabase-client.ts` | Yes | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | `lib/supabase.ts` | Yes | Yes |

### Payment

| Variable | Used In | In `.env.example` | In `.env.local` |
|----------|---------|-------------------|-----------------|
| `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` | `lib/midtrans.ts` | Yes | Yes |
| `MIDTRANS_SERVER_KEY` | `lib/midtrans.ts`, callback `route.ts` | Yes | Yes |
| `NEXT_PUBLIC_MIDTRANS_ENV` | Referenced in docs only | Yes | Yes |

### Shipping (Biteship)

| Variable | Used In | In `.env.example` | In `.env.local` |
|----------|---------|-------------------|-----------------|
| `BITESHIP_API_KEY` | `app/api/biteship-rates/route.ts` (hardcoded!) | Yes | Yes |
| `BITESHIP_SHIPPER_NAME` | `app/admin/dashboard` (via import) | Yes | Yes |
| `BITESHIP_SHIPPER_EMAIL` | `app/admin/dashboard` (via import) | Yes | Yes |
| `BITESHIP_SHIPPER_PHONE` | `app/admin/dashboard` (via import) | Yes | Yes |
| `BITESHIP_SHIPPER_ADDRESS` | `app/admin/dashboard` (via import) | Yes | Yes |
| `BITESHIP_SHIPPER_POSTAL` | `app/admin/dashboard` (via import) | Yes | Yes |
| `BITESHIP_SHIPPER_CITY` | `app/admin/dashboard` (via import) | Yes | Yes |
| `BITESHIP_COURIER_COMPANY` | Referenced in docs | Yes | Yes |
| `BITESHIP_COURIER_TYPE` | Referenced in docs | Yes | Yes |
| `BITESHIP_DELIVERY_TYPE` | Referenced in docs | Yes | Yes |

### Shipping (Raja Ongkir) — **not in .env.example!**

| Variable | Used In | In `.env.example` |
|----------|---------|-------------------|
| `RAJA_ONGKIR_API_URL` | `app/api/shipping/rajaOngkir.ts` | **NO** |
| `RAJA_ONGKIR_API_KEY` | `app/api/shipping/rajaOngkir.ts` | **NO** |
| `RAJA_ONGKIR_ORIGIN` | `app/api/shipping/rajaOngkir.ts` | **NO** |
| `RAJA_ONGKIR_COURIER` | `app/api/shipping/rajaOngkir.ts` | **NO** |

### Site Configuration

| Variable | Used In | In `.env.example` | In `.env.local` |
|----------|---------|-------------------|-----------------|
| `NEXT_PUBLIC_SITE_URL` | `app/api/payment`, `pages/api/receipt`, FE | Yes | Yes |
| `NODE_ENV` | `lib/midtrans.ts` | Yes | **NO** |

### Admin — **not referenced in actual code actively (hardcoded)**

| Variable | In `.env.example` | Actually Used |
|----------|-------------------|---------------|
| `NEXT_PUBLIC_ADMIN_USERNAME` | Yes | **No — hardcoded `1234`** |
| `ADMIN_PASSWORD` | Yes | **No — hardcoded `1234`** |
| `ADMIN_API_TOKEN` | Yes | **No — not used** |

### Store Fields Used in Code But NOT in `.env.example`

| Variable | Used In |
|----------|---------|
| `NEXT_PUBLIC_STORE_NAME` | `app/admin/dashboard` (fallback `"Djaemo Admin"`) |
| `NEXT_PUBLIC_STORE_PHONE` | `app/admin/dashboard` (fallback `"081239047565"`) |
| `NEXT_PUBLIC_STORE_ADDRESS` | `app/admin/dashboard` (fallback hardcoded address) |
| `NEXT_PUBLIC_STORE_POSTAL_CODE` | `app/admin/dashboard` (fallback `14350`) |
| `NEXT_PUBLIC_STORE_EMAIL` | `app/admin/dashboard` (fallback `info@jamurkrispi.com`) |

---

## Technical Inventory

### Counts

| Category | Count |
|----------|-------|
| Total source files (excl node_modules, .next) | 80 |
| Lines of code (excl lockfile, node_modules) | ~6,217 |
| `.tsx` files | 30 |
| `.ts` files | 29 |
| `.md` files | 9 |
| `.sql` files | 6 |
| `.js` files | 3 |
| `.mjs` files | 2 |
| `.css` files | 1 |
| Pages (App Router) | 12 |
| API Route Handlers (App Router) | 14 |
| API Route Handlers (Pages Router) | 1 |
| React Components | 15 |
| Context Providers | 3 |
| Custom Hooks | 0 |
| Libraries (lib/) | 8 |
| TypeScript Interfaces | 5 |
| TypeScript Ambient Declarations | 4 |
| Database Migrations | 5 |
| Migration SQL files | 6 |
| SQL Schemas (reference) | 1 |
| Node.js Scripts | 3 |
| Image Assets | 30 (JPG + PNG + SVG) |
| Icon Assets (SVG) | 5 |
| Root Config Files | 9 |

### Breakdown by Directory

| Directory | Files | Lines (approx) |
|-----------|-------|-----------------|
| `app/` pages | 12 | ~1,750 |
| `app/` API routes | 14 | ~1,100 |
| `components/` | 10 | ~650 |
| `lib/` | 8 | ~250 |
| `types/` | 5 | ~5 |
| `data/` | 2 | ~160 |
| `db/` | 5 | ~80 |
| `database/` | 1 | ~55 |
| `pages/` | 1 | ~125 |
| `scripts/` | 3 | ~150 |
| `public/` | 30+ | — |
| Root config | 9 | ~200 |

---

## Dependency Graph

```
┌──────────────────────────────────────────────────────────────────┐
│                        BROWSER                                    │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌───────────────┐   │
│  │  Pages   │  │  Admin   │  │  Cart /    │  │  Checkout /   │   │
│  │  (Public)│  │  Pages   │  │  Checkout  │  │  Success/Fail │   │
│  └────┬─────┘  └────┬─────┘  └─────┬─────┘  └──────┬────────┘   │
│       │              │              │               │            │
│  ┌────▼──────────────▼──────────────▼───────────────▼────┐       │
│  │              React Context Layer                        │       │
│  │  ┌─────────────┐  ┌───────────┐  ┌─────────────────┐  │       │
│  │  │ CartContext  │  │ToastCtx   │  │ ThemeContext     │  │       │
│  │  │ (CartProv.)  │  │(ToastProv)│  │ (ThemeProvider)  │  │       │
│  │  └──────┬──────┘  └─────┬─────┘  └────────┬────────┘  │       │
│  └─────────┼───────────────┼──────────────────┼───────────┘       │
│            │               │                  │                    │
│  ┌─────────▼───────────────▼──────────────────▼───────────┐       │
│  │              Component Layer                            │       │
│  │  Button ── Logo ── Header ── Footer ── Section ──      │       │
│  │  PageHeader ── ProdukGrid ── ContactForm ──            │       │
│  │  ProductEditModal ── ThemeToggle ──                    │       │
│  └──────────────────────┬─────────────────────────────────┘       │
│                         │                                          │
│  ┌──────────────────────▼─────────────────────────────────┐       │
│  │              Utility Layer                               │       │
│  │  lib/utils.ts ── lib/constants.ts ── lib/order.ts       │       │
│  │  lib/flatRateShipping.ts ── lib/shipping.ts             │       │
│  └──────────────────────┬─────────────────────────────────┘       │
└─────────────────────────┼──────────────────────────────────────────┘
                          │ HTTP fetch()
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│                      NEXT.JS RUNTIME (Server)                     │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │              API Route Handlers                             │   │
│  │  /api/products  /api/payment  /api/orders                  │   │
│  │  /api/shipping  /api/contact  /api/qrisly                  │   │
│  │  /api/biteship-rates  /api/analytics/revenue               │   │
│  │  /api/orders/[id]/callback  /api/orders/[id]/receipt       │   │
│  └──────────┬──────────┬────────────┬──────────────┬──────────┘   │
│             │          │            │              │               │
│  ┌──────────▼──┐ ┌────▼────┐ ┌─────▼──────┐ ┌─────▼──────────┐   │
│  │lib/supabase │ │lib/     │ │lib/        │ │lib/flatRate-   │   │
│  │(service key)│ │midtrans │ │shipping.ts │ │Shipping.ts     │   │
│  └──────┬──────┘ └────┬────┘ └──────┬─────┘ └────────────────┘   │
│         │             │             │                              │
│  ┌──────▼──────┐ ┌────▼────┐ ┌──────▼──────┐                     │
│  │  Supabase   │ │Midtrans │ │  External    │                     │
│  │  Postgres   │ │ Snap API│ │  APIs        │                     │
│  │  + Storage  │ │         │ │ Biteship,    │                     │
│  │             │ │         │ │ QR Server,   │                     │
│  │             │ │         │ │ Raja Ongkir  │                     │
│  └─────────────┘ └─────────┘ └─────────────┘                     │
└──────────────────────────────────────────────────────────────────┘
```

---

## Call Graph

### Customer Flow

```
[Browser] GET / → Landing Page (app/page.tsx)
  → renders Header, Footer, Section
  → useEffect: carousel auto-rotate

[Browser] GET /produk → Product Catalog (app/produk/page.tsx)
  → renders ProdukGrid → lists products from data/products.ts
  → user clicks "Add to Cart"
    → CartContext.addToCart()
    → Toast.showToast()
    → localStorage.setItem("djaemo-cart", ...)

[Browser] GET /cart → Cart Page (app/cart/page.tsx)
  → reads items from CartContext
  → user types address → debounced fetch POST /api/shipping
    → lib/flatRateShipping.calculateFlatRateShipping()
    → returns {destination, shippingFee}
  → "Lanjutkan Pembayaran" → navigate to /checkout

[Browser] GET /checkout → Checkout Page (app/checkout/page.tsx)
  → user fills form (name, email, phone, address)
  → debounced fetch POST /api/shipping for live fee
  → "Bayar Sekarang"
    → fetch POST /api/payment
      → lib/supabase: upsert customer, insert order, insert order_items
      → lib/midtrans.snap.createTransaction()
      → Midtrans API returns {redirect_url, token}
      → store order in localStorage("djaemo-last-order")
      → window.location.href = redirect_url
    → User on Midtrans Snap page
      → Pays (test card: 4811 1111 1111 1114)
      → Midtrans redirects to /checkout/success?order_id=...

[Browser] GET /checkout/success → Success Page
  → reads order from localStorage
  → displays QR code, order details

[Server] POST /api/orders/[id]/callback (Midtrans webhook)
  → verify HMAC signature
  → core.transaction.status()
  → map status: settlement→paid, pending→pending, deny→failed
  → supabase.from("orders").update({status, payment_method})

[Browser] GET /admin → Admin Login (app/admin/page.tsx)
  → hardcoded check: username=1234, password=1234
  → localStorage.setItem("admin-authenticated", "true")
  → redirect to /admin/dashboard

[Browser] GET /admin/dashboard
  → fetch GET /api/orders → list all orders
  → fetch GET /api/analytics/revenue → dashboard stats
  → fetch GET /api/products → product list
  → Admin clicks "Detail" on order
    → fetch GET /api/orders/[id] → order details + items + customers
    → Modal opens
  → Admin clicks "Cetak Resi"
    → POST /api/shipping (with Biteship action)
      → Biteship API create_order
      → PUT /api/orders/[id] → status=SHIPPED + notes=Waybill:X
      → Opens print window with waybill
```

### Admin Product CRUD Flow

```
[Admin] "Tambah Produk" → Modal opens
  → Upload images → Supabase Storage (client-side anon key)
  → POST /api/products → supabase.from("products").insert()
  → Refresh product list

[Admin] "Edit Produk" → Modal opens
  → Load existing images from product.images[]
  → Upload new images, track removed images
  → PUT /api/products → supabase update + product_images sync
  → Refresh product list

[Admin] "Hapus Produk"
  → DELETE /api/products?id=X
    → Fetch existing product
    → Delete images from Supabase Storage
    → Delete from products table
```

---

## Business Flow

### Primary Business Flow: Customer Purchase

```
1. DISCOVERY
   User visits website → Landing Page → browses products

2. SELECTION
   Adds products to cart (localStorage)

3. ORDERING
   Enters address → Shipping calculated (flat rate)
   Proceeds to checkout → Fills customer details

4. PAYMENT
   System creates customer + order in Supabase
   System creates Midtrans Snap transaction
   User redirected to Midtrans → pays via bank transfer/CC/QRIS
   Midtrans calls callback → updates order status

5. FULFILLMENT
   Admin sees pending order in dashboard
   Admin confirms payment → status=paid
   Admin enters postal code → creates Biteship order
   Admin prints waybill → status=shipped

6. COMPLETION
   Order delivered to customer
```

### Secondary Business Flow: Admin Management

```
1. Admin logs in (hardcoded credentials)
2. Dashboard shows: revenue, pending orders, recent orders, stock
3. Admin manages orders: detail view, confirm, reject, print receipt
4. Admin manages products: add/edit/delete with image upload
5. Admin views analytics (manual/placeholder)
```

---

## Architecture Diagram (ASCII)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         BROWSER                                      │
│  ┌─────────┐  ┌───────────┐  ┌────────┐  ┌──────────────────┐      │
│  │ Landing │  │  Catalog  │  │  Cart  │  │  Admin Dashboard │      │
│  │  Page   │  │          │  │        │  │                  │      │
│  └─────────┘  └───────────┘  └────────┘  └──────────────────┘      │
│         │            │             │                 │               │
│         ▼            ▼             ▼                 ▼               │
│   ┌─────────────────────────────────────────────────────┐           │
│   │              React Context Layer                     │           │
│   │   CartProvider │ ToastProvider │ (ThemeProvider)     │           │
│   │              localStorage (cart, auth)               │           │
│   └──────────────────────┬──────────────────────────────┘           │
│                          │ HTTP fetch()                              │
└──────────────────────────┼──────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────────┐
│                   NEXT.JS SERVER (Node.js)                          │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                SERVER COMPONENTS (SSR)                          │ │
│  │   app/page.tsx, app/produk/page.tsx, app/tentang/page.tsx      │ │
│  │   app/kontak/page.tsx, app/layout.tsx                          │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │              CLIENT COMPONENTS (CSR)                            │ │
│  │  app/cart, app/checkout, app/admin/*, components/*             │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │              API ROUTE HANDLERS                                 │ │
│  │  ┌──────────┐ ┌──────────┐ ┌─────────┐ ┌───────────────────┐ │ │
│  │  │ Products │ │  Orders  │ │ Payment │ │  Shipping         │ │ │
│  │  │ CRUD     │ │  CRUD    │ │ Midtrans│ │ Flat/Biteship/Raja│ │ │
│  │  └────┬─────┘ └────┬─────┘ └────┬────┘ └───────────────────┘ │ │
│  └───────┼────────────┼────────────┼──────────────────────────────┘ │
│          │            │            │                                 │
│  ┌───────▼────────────▼────────────▼──────────────────────────────┐ │
│  │                   SERVICE LAYER                                 │ │
│  │  lib/supabase.ts    lib/midtrans.ts    lib/flatRateShipping.ts │ │
│  │  lib/supabase-client.ts                lib/shipping.ts         │ │
│  │  lib/order.ts       lib/utils.ts       lib/constants.ts        │ │
│  └───────┬────────────────────┬────────────────────────────────────┘ │
│          │                    │                                      │
│  ┌───────▼────┐    ┌─────────▼───────────────┐                      │
│  │  Supabase  │    │   Third Party APIs       │                      │
│  │  Postgres  │    │                          │                      │
│  │  + Storage │    │  Midtrans Snap / CoreApi │                      │
│  │            │    │  Biteship API            │                      │
│  │            │    │  QR Server API           │                      │
│  │            │    │  Raja Ongkir API (stub)  │                      │
│  └────────────┘    └──────────────────────────┘                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Complexity Ranking

### Top 30 Most Complex Files

| Rank | File | LOC | Functions | State Hooks | Complexity Factors |
|------|------|-----|-----------|-------------|-------------------|
| 1 | `app/admin/dashboard/page.tsx` | 1,555 | ~30 | ~20 useState, ~10 useEffect, ~5 useMemo, ~3 useRef | Monolithic file with order management, product CRUD, Biteship integration, image upload, modal, chart, drag-drop |
| 2 | `app/checkout/page.tsx` | 306 | ~8 | ~12 useState, ~3 useEffect, ~1 useMemo | Payment flow, shipping calc, form validation, local storage sync |
| 3 | `app/cart/page.tsx` | 228 | ~5 | ~8 useState, ~2 useEffect, ~1 useMemo | Shipping calc with debounce, address parsing, quantity controls |
| 4 | `app/tentang/page.tsx` | 227 | ~10 inline SVG | None (Server Component) | Large JSX with SVG icons, no logic complexity |
| 5 | `app/admin/product-form/page.tsx` | 218 | ~6 | ~6 useState, ~1 useMemo | Standalone product form, image preview, duplicate of dashboard features |
| 6 | `app/page.tsx` | 162 | ~1 | ~1 useState, ~1 useEffect, ~1 useMemo | Carousel, hero section, featured products |
| 7 | `app/checkout/success/page.tsx` | 159 | ~1 | ~2 useState, ~1 useEffect | Reads order from localStorage, displays details |
| 8 | `app/api/payment/route.ts` | 145 | 1 | 0 | Midtrans integration, customer/order/items creation in single handler |
| 9 | `app/api/products/route.ts` | 142 | 4 | 0 | CRUD with image sync, storage cleanup, price sanitization |
| 10 | `app/admin/orders/page.tsx` | 130 | ~5 | ~5 useState, ~2 useEffect | Orders listing with auth check, status badges |
| 11 | `app/api/biteship-rates/route.ts` | 119 | 1 | 0 | Biteship proxy with validation, timeout, hardcoded API key |
| 12 | `components/layout/Header.tsx` | 107 | 1 | ~2 useState | Navigation, cart badge, mobile menu toggle |
| 13 | `app/admin/page.tsx` | 105 | ~3 | ~5 useState, ~2 useEffect | Admin login form with localStorage auth |
| 14 | `app/kontak/page.tsx` | 103 | ~1 | 0 | Contact form page, SVG icons, social links |
| 15 | `components/contact/ContactForm.tsx` | 101 | ~2 | ~4 useState | Form validation, API submission, toast feedback |
| 16 | `app/checkout/failed/page.tsx` | 88 | ~1 | ~2 useState, ~1 useEffect | Reads order from localStorage, displays failure info |
| 17 | `components/cart/CartProvider.tsx` | 88 | ~6 | ~2 useState, ~2 useEffect, ~2 useMemo | Context provider, localStorage persistence, CRUD operations |
| 18 | `components/layout/Footer.tsx` | 86 | ~2 | 0 | Static footer with nav, social icons, SVG components |
| 19 | `components/ui/Toast.tsx` | 84 | ~2 | ~2 useState | Toast notification system with auto-dismiss |
| 20 | `data/products.ts` | 84 | 0 | 0 | Hardcoded product array |
| 21 | `components/produk/ProdukGrid.tsx` | 68 | ~2 | ~2 useState | Product cards, add-to-cart with animation |
| 22 | `scripts/migrate-images.js` | 60 | ~2 | 0 | Image migration script |
| 23 | `database/schema.sql` | 54 | N/A | N/A | SQL DDL schema |
| 24 | `app/api/analytics/revenue/route.ts` | 53 | 1 | 0 | Revenue aggregation query |
| 25 | `db/001_init_schema.sql` | 49 | N/A | N/A | SQL DDL with RLS policies |
| 26 | `app/admin/products/page.tsx` | 49 | ~3 | ~2 useState | Simple product list with edit modal, print receipt (inconsistent) |
| 27 | `tailwind.config.ts` | 47 | 0 | 0 | Theme configuration |
| 28 | `components/ui/ThemeProvider.tsx` | 47 | ~2 | ~2 useState, ~1 useEffect | Theme context, localStorage, system preference |
| 29 | `app/layout.tsx` | 45 | 0 | 0 | Root layout, font loading, provider wrapper |
| 30 | `components/layout/Logo.tsx` | 45 | 1 | 0 | Reusable logo component |

---

## Reusable Components

### Most Reused

| Component | Times Used | Consumers |
|-----------|-----------|-----------|
| `Button` | 15+ | All pages, admin, cart, checkout |
| `Section` | 10+ | All public pages |
| `PageHeader` | 6 | Cart, checkout, produk, tentang, kontak |
| `useCart` | 4 | Header, ProdukGrid, CartPage, CheckoutPage |
| `useToast` | 2 | ProdukGrid, ContactForm |
| `Logo` | 2 | Header, Footer |
| `cn()` (utils) | 30+ | All components |

### Duplicate or Near-Identical Code

1. **`lib/shipping.ts`** vs **`lib/flatRateShipping.ts`** — Almost identical. Both export `parseDestinationFromAddress`, `services`, `ShippingDestination`, `ShippingService`. The difference: `shipping.ts` uses weight-based calculation, `flatRateShipping.ts` uses flat rate.

2. **`lib/supabase.ts`** vs **`lib/supabase-client.ts`** — Same structure, different key (service_role vs anon).

3. **`app/admin/dashboard/page.tsx`** vs **`app/admin/products/page.tsx`** vs **`app/admin/product-form/page.tsx`** — Three different implementations of product CRUD:
   - Dashboard: Full inline CRUD with drag-drop image upload
   - Products page: Simple list with `ProductEditModal`
   - Product-form page: Standalone form (mostly placeholder)

4. **`lib/midtrans.ts`** ESM compatibility shim — The `Midtrans` variable resolution handles both CJS and ESM exports.

---

## Dead Assets

### Dead Files

| File | Status | Reason |
|------|--------|--------|
| `components/admin/AdminGuard.tsx` | **DEAD** | Empty file (0 lines) |
| `hooks/` (directory) | **DEAD** | Empty (.gitkeep only) |
| `hooks/.gitkeep` | **DEAD** | Empty directory marker |
| `app/api/orders/[id]/receipt/` | **DEAD** | Empty directory (no route file) |
| `public/images/logo/.gitkeep` | **DEAD** | Empty directory marker |
| `public/images/hero/.gitkeep` | **DEAD** | Empty directory marker |

### Dead/Unused Components

| Component | Status | Reason |
|-----------|--------|--------|
| `ThemeProvider` (`components/ui/ThemeProvider.tsx`) | **NOT IMPORTED** | Export exists but NOT used in `app/layout.tsx` |
| `ThemeToggle` (`components/ui/ThemeToggle.tsx`) | **NOT IMPORTED** | Not used anywhere |
| `AdminGuard` | **DEAD** | Empty file |

### Duplicate Image Assets

- `public/images/produk/1.JPG` through `8.JPG` — Exact same filenames and similar sizes as `public/images/1.JPG` through `8.JPG`. Likely duplicate copies.

### Dead/Unused Code Paths

| Location | Reason |
|----------|--------|
| `lib/shipping.ts` | `calculateShippingFee()` uses weight-based formula but `app/api/shipping/route.ts` imports `flatRateShipping` |
| `app/api/shipping/rajaOngkir.ts` | `calculateRajaOngkirCost()` is exported but never imported by any other file |
| `app/admin/page.tsx` — env vars `ADMIN_USERNAME`/`ADMIN_PASSWORD` | Code uses hardcoded `"1234"` instead of env vars |
| `app/admin/dashboard/page.tsx` — Chart.js placeholder (lines 779-810) | Entire Chart.js implementation is commented out |

### Stale Scripts

| Script | Notes |
|--------|-------|
| `scripts/migrate-products.js` | Likely one-time migration, still in repo |
| `scripts/migrate-images.js` | Likely one-time migration, still in repo |
| `scripts/run-migrations.js` | Likely one-time migration, still in repo |

---

## Cross Dependency

### Tight Coupling

| Dependency | Issue |
|------------|-------|
| `app/admin/dashboard/page.tsx` imports from `lib/supabase-client.ts` | Admin uses client-side Supabase (anon key) for storage uploads — relies on RLS, but RLS for storage isn't verified |
| `app/checkout/page.tsx` depends on `app/api/payment` which depends on `app/api/orders/[id]/callback` | Tight coupling — checkout assumes synchronous Midtrans callback will work |
| `app/cart/page.tsx` and `app/checkout/page.tsx` both duplicate shipping calculation logic | Both pages independently call POST `/api/shipping` with debounce |
| `lib/flatRateShipping.ts` vs `lib/shipping.ts` | Two files with same types, same destination parsing, different calc logic. Both imported in different places. |

### Circular Dependency (Potential)

| Chain | Risk |
|-------|------|
| `CartProvider` → `ToastProvider` (via context usage in children) | Not circular, but Header → CartProvider → + toast in ProdukGrid creates implicit cross-cutting |
| No actual circular dependency detected in imports (tested statically) |

### Module That Knows Too Much

**`app/admin/dashboard/page.tsx`** (~1555 LOC): This file:
- Handles admin auth (localStorage)
- Manages orders (fetch, display, confirm, reject)
- Manages products (CRUD, image upload, storage)
- Integrates Biteship (order creation, waybill)
- Generates print receipt (HTML template)
- Contains hardcoded store information
- Has its own `sanitizePriceToInt` (duplicate of `app/api/products/route.ts`)
- Contains commented Chart.js integration

This single file touches: Supabase DB, Supabase Storage, Biteship API, localStorage, DOM printing, multiple internal APIs.

---

## Layer Analysis

### Current Layer Structure

```
┌──────────────────────────────────┐
│   PRESENTATION LAYER             │
│   Components (JSX/TSX)          │
│   Pages, Layouts, Templates      │
├──────────────────────────────────┤
│   STATE LAYER                    │
│   React Context (Cart/Toast)    │
│   localStorage persistence       │
├──────────────────────────────────┤
│   FEATURE LAYER                  │
│   Checkout, Cart, Admin, etc.   │
│   (mixed with presentation)      │
├──────────────────────────────────┤
│   API LAYER                      │
│   Route Handlers                 │
│   Next.js API Routes             │
├──────────────────────────────────┤
│   SERVICE LAYER                  │
│   lib/midtrans.ts, lib/supabase  │
│   lib/flatRateShipping.ts        │
├──────────────────────────────────┤
│   DATA LAYER                     │
│   Supabase JS Client             │
├──────────────────────────────────┤
│   EXTERNAL LAYER                 │
│   Midtrans API, Biteship API,   │
│   QR Server, Raja Ongkir         │
└──────────────────────────────────┘
```

### Layer Violations

1. **Presentation + Feature mixed**: `app/admin/dashboard/page.tsx` contains UI rendering, business logic (Biteship order creation), data fetching, and state management all in one file.

2. **API + Business Logic mixed**: `app/api/payment/route.ts` handles HTTP concerns AND business logic (customer upsert, order insert, Midtrans transaction, order items insert) — no service layer abstraction.

3. **Missing service layer**: Business logic is embedded in route handlers and components. There's no `services/` or `use-cases/` directory.

4. **No repository pattern**: Database access is inline in route handlers via `supabase.from('table').action()`. No abstraction over data access.

5. **Config leak**: `app/admin/dashboard/page.tsx` contains hardcoded store addresses, fallback values, and phone numbers that should be environment variables.

---

## Architecture Assessment

### Strengths

1. **Modern framework**: Next.js 16 + React 19 ensures long-term support.
2. **Clean public pages**: Landing, produk, tentang, kontak are well-structured Server Components with minimal client logic.
3. **Context separation**: Cart and Toast are properly isolated in Context providers.
4. **Responsive design**: Tailwind classes show mobile-first approach throughout.
5. **Midtrans integration**: Proper HMAC signature verification in callback endpoint.
6. **Supabase migrations**: Sequential migration files with clear purposes.

### Weaknesses

1. **No tests**: Zero test coverage for any component, API, or business logic.
2. **No customer auth**: Anyone can view products and call APIs without restrictions.
3. **Hardcoded admin credentials**: `1234/1234` visible in client bundle.
4. **API security**: No authentication on any route — product CRUD, order management are all public.
5. **Hardcoded API key**: Biteship test key in `app/api/biteship-rates/route.ts:74`.
6. **Admin dashboard monolith**: 1,555 LOC single file with mixed concerns.
7. **Duplicate shipping implementations**: 3 parallel systems with overlapping functionality.
8. **Data duplication**: Products exist in both `data/products.ts` and Supabase `products` table.
9. **Unused code**: ThemeProvider, ThemeToggle, Raja Ongkir stub, AdminGuard.
10. **Schema drift**: `database/schema.sql` differs from live migrations.
11. **Inconsistent error handling**: Some endpoints use `console.error`, others return proper JSON errors.
12. **Dead API directory**: `app/api/orders/[id]/receipt/` is empty, but `pages/api/orders/[id]/receipt.ts` is the actual implementation.

### Architectural Risks (Critical)

1. **Security**: Admin authentication is completely broken — hardcoded credentials exposed in client-side JavaScript bundle. The `SUPABASE_SERVICE_ROLE_KEY` is at risk of exposure if bundled incorrectly.
2. **Data integrity**: No server-side validation for product CRUD. Anyone can POST/PUT/DELETE products without auth.
3. **Payment reliability**: The `/api/payment` route does not handle idempotency. Duplicate requests could create duplicate orders.
4. **No error boundaries**: Most API routes have try/catch but some return raw error messages.
5. **LocalStorage dependency**: Cart and admin auth both depend on localStorage — no server-side session.

---

*End of Architecture Discovery Report — Ready for Phase 1 (Audit).*
