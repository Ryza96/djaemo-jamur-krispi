# PROJECT STATE REPORT

**Generated:** 2026-07-04
**Project:** D'Jaemo Jamur Krispi Ecommerce
**Repository Root:** `D:\kontenyou\web\djaemojamurkrispi`

---

## 1. EXECUTIVE SUMMARY

D'Jaemo Jamur Krispi is an Indonesian e-commerce application built on Next.js 16 (App Router) for selling crispy mushroom snacks. The application implements a complete ordering flow: product catalog → cart → checkout → Midtrans payment → order fulfillment with Biteship shipping integration.

**Architecture:** Server-first with Repository + Service pattern. Next.js App Router with React 19. Tailwind CSS v4 for styling. Supabase as database and file storage. Midtrans for payment gateway. Biteship for shipping/logistics.

**Deployment status:** Development. No production deployment detected. Supabase project is live (sandbox). Midtrans uses sandbox mode.

**Build status:** Configured but not verified as passing. `package.json` is missing `zod` dependency despite 5 files importing it, which will cause build failures.

---

## 2. TECHNOLOGY STACK

| Category | Technology | Version | Notes |
|----------|-----------|---------|-------|
| Framework | Next.js | 16.2.9 | App Router; `next dev --webpack` (Turbopack disabled by flag) |
| UI Library | React | 19.2.4 | RSC + Client Components |
| Language | TypeScript | ^5 | `strict: true` |
| Styling | Tailwind CSS | ^4.3.1 | v4 with `@theme inline`; no `tailwind.config.ts` |
| PostCSS | @tailwindcss/postcss + autoprefixer | ^4.3.1 | Flat config |
| Database | Supabase (PostgreSQL) | ^2.38.0 | Server: service_role_key. Client: anon key |
| Payment | Midtrans | ^1.3.3 | Snap API; sandbox mode |
| Shipping | Biteship | — | REST API integration |
| Address Data | kode-wilayah-id | ^1.2.0 | Offline Indonesian administrative regions |
| PDF | pdfkit + bwip-js + qrcode | — | Receipt generation |
| Icons | lucide-react | ^1.23.0 | |
| Fonts | Geist (Google Fonts via next/font) | — | Sans + Mono |
| Linting | ESLint | ^9 | `eslint-config-next` flat config |
| Missing | zod | **NOT INSTALLED** | Imported in 5 files; will block build |

---

## 3. REPOSITORY STRUCTURE

```
djaemojamurkrispi/
├── app/                          # Next.js App Router
│   ├── admin/                    # Admin dashboard (protected)
│   │   ├── dashboard/page.tsx
│   │   ├── orders/               # Order management
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── products/page.tsx     # Product CRUD
│   │   ├── product-form/page.tsx # Prototype form
│   │   ├── pelanggan/page.tsx    # Placeholder
│   │   ├── pengaturan/page.tsx   # Placeholder
│   │   ├── layout.tsx            # Admin shell (auth guard)
│   │   └── page.tsx              # Login page
│   ├── api/                      # API route handlers
│   │   ├── address/              # Provinces, regencies, districts, villages
│   │   ├── admin/orders/         # Admin order CRUD
│   │   ├── analytics/revenue/    # Revenue stats
│   │   ├── biteship-areas/       # @deprecated Biteship area lookup
│   │   ├── biteship-rates/       # Biteship courier rates
│   │   ├── contact/              # Contact form submission
│   │   ├── orders/               # Customer order lookup
│   │   ├── payment/              # Create + callback
│   │   ├── products/             # Product CRUD + [id]
│   │   ├── qrisly/               # QRIS generation (3rd party API)
│   │   └── shipping/             # Flat rate + RajaOngkir
│   ├── cart/page.tsx
│   ├── checkout/                 # Checkout, success, failed
│   ├── dev/address-poc/          # Development PoC (EXPOSED)
│   ├── kontak/page.tsx
│   ├── produk/                   # Product listing + [id] detail
│   ├── tentang/page.tsx
│   ├── globals.css
│   ├── layout.tsx                # Root layout with providers
│   ├── error.tsx                 # Global error boundary
│   ├── loading.tsx               # Root loading state
│   └── not-found.tsx             # 404 page
├── components/
│   ├── admin/                    # Admin UI components
│   │   ├── orders/               # 15 files (table, timeline, actions, etc.)
│   │   ├── patterns/             # Admin layout patterns
│   │   ├── products/             # ProductImagePicker
│   │   ├── ui/                   # 11 barrel-exported UI components
│   │   ├── ProductEditModal.tsx
│   │   └── ProgressModal.tsx
│   ├── cart/                     # CartProvider, CartDrawer, CartItemRow, CartSummary
│   ├── checkout/                 # CheckoutProvider, CheckoutForm, CustomerInfo, etc.
│   │   └── shipping/             # ShippingProvider, ShippingSelector, etc.
│   ├── contact/ContactForm.tsx
│   ├── layout/                   # PublicShell, Header, Footer, Logo
│   ├── produk/                   # ProductCard, ProdukGrid
│   │   └── detail/               # ProductGallery, ProductInfo, ProductActions, etc.
│   ├── sections/                 # Section, PageHeader
│   └── ui/                       # Button, Toast, ThemeProvider, ThemeToggle
├── lib/                          # Core application logic (37 files)
│   ├── repositories/             # Database access layer (5 files)
│   │   ├── index.ts              # Barrel export
│   │   ├── product.repository.ts
│   │   ├── order.repository.ts   # 20+ methods
│   │   ├── customer.repository.ts
│   │   └── audit-log.repository.ts
│   ├── services/                 # Business logic layer
│   │   ├── product.service.ts
│   │   ├── order.service.ts      # Draft creation, callback processing
│   │   ├── fulfillment.service.ts # Status transitions
│   │   ├── audit-log.service.ts
│   │   ├── address/provider.ts   # kode-wilayah-id integration
│   │   ├── payment/              # 6 files (types, mapper, verifySignature, createSnap, callback, checkoutValidation)
│   │   └── shipping/             # 8 files (types, constants, biteship, getRates, mapper, shipment.service, tracking.service, receipt.service)
│   ├── validation/               # Zod schemas (3 files)
│   ├── constants/upload.ts
│   ├── errors/upload-errors.ts
│   ├── utils/searchRanking.ts
│   ├── supabase.ts               # Server client (service role)
│   ├── supabase-client.ts        # Client client (anon key)
│   ├── midtrans.ts               # Snap + Core API clients
│   ├── order.ts                  # Order ID generator
│   ├── constants.ts              # SITE, NAV_LINKS, SOCIAL_LINKS
│   ├── utils.ts                  # cn(), formatPrice()
│   └── flatRateShipping.ts       # Legacy flat rate calculator
├── types/                        # TypeScript types (6 files)
│   ├── index.ts                  # Product, CartItem, Order, etc.
│   ├── checkout.ts               # Checkout flow types
│   ├── qrcode.d.ts               # Ambient module declaration
│   ├── pdfkit.d.ts               # Ambient module declaration
│   ├── midtrans-client.d.ts      # Ambient module declaration
│   └── bwip-js.d.ts              # Ambient module declaration
├── hooks/                        # Custom hooks (7 files + .gitkeep)
│   ├── use-debounce.ts
│   ├── use-orders.ts
│   ├── use-order-detail.ts
│   ├── use-order-timeline.ts
│   ├── use-order-actions.ts
│   ├── use-order-shipment.ts
│   └── use-admin-notes.ts
├── data/                         # Static product data
│   ├── products.ts               # 9 products, unused (dead code)
│   └── products.json             # 9 products (different pricing), used by migration scripts
├── database/schema.sql           # Reference schema (4 tables)
├── db/
│   ├── supabase_migrations/      # 10 ordered SQL migrations (001-010)
│   └── migrations/               # 1 duplicate migration file
├── scripts/                      # 4 utility scripts
│   ├── run-migrations.js
│   ├── migrate-products.js
│   ├── migrate-images.js
│   └── verify-kode-wilayah-id.mjs
├── pages/api/orders/[id]/receipt.ts  # @deprecated Pages Router endpoint
├── public/images/                # hero/, logo/, produk/ assets
├── docs/                         # 30+ documentation files
├── .env.example                  # Template env vars (all placeholder)
├── .env.local                    # Active env (sandbox credentials)
├── .gitignore
├── next.config.ts
├── tailwind.config.ts            # DELETED from disk (in git as D)
├── eslint.config.mjs
├── postcss.config.mjs
├── tsconfig.json
├── package.json
├── AGENTS.md
├── CLAUDE.md                     # @AGENTS.md (delegation)
├── FIXES.md                      # Outdated
└── [Stale artifacts: 5 *.log files, 3 eslint-output.*, header_diff.txt, .memories.session.txt]
```

---

## 4. ARCHITECTURE OVERVIEW

### 4.1 Layered Architecture

```
[Browser] ←→ [Next.js App Router]
                  │
        ┌─────────┼──────────┐
        │         │          │
    [Pages]   [API Routes]  [Server Actions]
        │         │
        │    [Services]
        │         │
        │   [Repositories]
        │         │
        │   [Supabase Client]
        │         │
        └── [PostgreSQL DB]
```

- **API Routes** call **Services** (business logic).
- **Services** call **Repositories** (data access).
- **Repositories** use the server-side `supabase` client (service role key, bypasses RLS).
- **Client Components** use `supabaseClient` (anon key, RLS-enforced) only for storage uploads.
- **Pages** are a mix of Server Components (data fetched server-side) and Client Components (data fetched via API routes or hooks).

### 4.2 Authentication & Authorization

- **Customer auth:** None. No user accounts, no login, no session management.
- **Admin auth:** Hardcoded credentials (`1234`/`1234`) stored in `app/admin/page.tsx`. Authentication state stored in `localStorage("admin-authenticated")`. Protected by `app/admin/layout.tsx` which checks localStorage and redirects if not authenticated.
- **API auth:** No authentication headers, tokens, or API keys required for any API route.
- **RLS:** Row-Level Security is enabled on all database tables but the server-side `supabase` client uses the service_role_key which bypasses RLS entirely.

### 4.3 State Management

- **Cart state:** React Context (`CartProvider`) with `useState`. Persisted to `localStorage("djaemo-cart")`.
- **Checkout state:** React Context with `useReducer` (`CheckoutProvider`). Managed via dispatch actions.
- **Shipping rates state:** React Context with `useReducer` (`ShippingProvider`).
- **Admin order list:** Custom hook (`useOrders`) with `useState` + `useEffect`. Fetch-based.
- **Toast notifications:** React Context (`ToastProvider`) with `useState`.
- **Theme:** React Context (`ThemeProvider`) with localStorage persistence.

### 4.4 Middleware

**None.** No `middleware.ts` file exists at the project root.

---

## 5. DATABASE OVERVIEW

### 5.1 Tables

The database has evolved through 10 migrations. The current schema includes these tables:

#### `products`
| Column | Type | Notes |
|--------|------|-------|
| id | text PK | e.g. "produk-1" |
| name | text NOT NULL | |
| description | text | |
| price | integer NOT NULL | In IDR (as int, no decimals) |
| weight | text | e.g. "100g" |
| image | text | Legacy single image URL |
| images | text[] | Current array of image URLs |
| weight_grams | integer NOT NULL DEFAULT 100 | From migration 009 |
| created_at | timestamptz | |

**Used by:** `product.repository.ts`, `product.service.ts`, API `/api/products`, admin products page.

#### `customers`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK (001) → BIGSERIAL (actual schema) | Type mismatch between migrations |
| name | text | |
| email | text | |
| phone | text | |
| address | text | |
| updated_at | timestamp | From migration 007 |
| created_at | timestamptz | |

**Used by:** `customer.repository.ts`, `order.service.ts`, API `/api/payment`.

#### `orders`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK (schema.sql) → text PK (001) → uuid PK (007) | Conflicting PK types across migrations |
| order_id | varchar UNIQUE | e.g. "DJ-20260704-XXXXXXXX" |
| customer_id | bigint (schema.sql) → uuid (001) → bigint (007) | Type conflict |
| transaction_id | varchar | Midtrans token |
| qr_code_url | text | |
| subtotal | bigint | |
| shipping_fee | bigint | |
| total_amount | bigint | |
| destination | varchar | |
| shipping_service | varchar | |
| status | varchar → deprecated | Old single status column |
| payment_status | varchar (006) | unpaid/pending/paid/failed/expired |
| fulfillment_status | varchar (006) | new/processing/shipped/completed/cancelled |
| payment_method | varchar | |
| notes | text | Customer notes |
| admin_notes | text (008) | Admin internal notes |
| waybill_id | varchar (008) | |
| shipment_id | varchar (009) | Biteship shipment ID |
| shipping_status | varchar (009) | confirmed/picking_up/dropping_off/in_transit/delivered/cancelled/retry |
| shipping_address | text (005) | |
| customer_phone | varchar (005) | |
| courier_company | varchar (005) | |
| courier_type | varchar (005) | |
| shipping_cost | bigint (005) | |
| postal_code | varchar (003) | |
| destination_area_id | varchar (009) | |
| shipment_error | text (009) | |
| courier_etd | varchar (009) | |
| paid_at | timestamp (008) | |
| shipped_at | timestamp (008) | |
| completed_at | timestamp (008) | |
| cancelled_at | timestamp (008) | |
| cancellation_reason | text (008) | |
| delivered_at | timestamp (009) | |
| last_tracking_at | timestamp (010) | |
| tracking_payload | jsonb (010) | |
| created_at | timestamptz/timestamp | |
| updated_at | timestamp (007) | |

**Used by:** 10+ API routes, all services, order.repository.ts, admin pages.

#### `order_items`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK (001) → BIGSERIAL (007) | Type conflict |
| order_id | text FK → orders.id | |
| product_id | text | |
| product_name | varchar (007) | Denormalized |
| quantity | integer | |
| price | integer | |
| subtotal | bigint (007) | |
| weight_grams | integer DEFAULT 100 (008) | |
| created_at | timestamp (007) | |

**Used by:** `order.repository.ts`, order detail pages.

#### `contacts`
| Column | Type | Notes |
|--------|------|-------|
| id | BIGSERIAL PK | |
| name | varchar NOT NULL | |
| email | varchar NOT NULL | |
| phone | varchar | |
| message | text NOT NULL | |
| created_at | timestamp | |

**Used by:** API `/api/contact`.

#### `audit_logs`
| Column | Type | Notes |
|--------|------|-------|
| id | BIGSERIAL PK | |
| order_id | varchar NOT NULL | |
| event | varchar NOT NULL | |
| from_status | varchar | |
| to_status | varchar NOT NULL | |
| metadata | jsonb | |
| created_at | timestamp | |

**Used by:** `audit-log.repository.ts`, `audit-log.service.ts`, order timeline.

### 5.2 Schema Conflicts Detected

The `database/schema.sql` reference file and the migration files contain **conflicting type definitions** for key columns:
- `customers.id`: schema.sql says `BIGSERIAL`, migration 001 says `uuid`
- `orders.id`: schema.sql says `UUID`, migration 001 says `text`
- `order_items.id`: migration 001 says `uuid`, actual code expects `BIGSERIAL`/`number`
- `customers.id` FK in orders: schema.sql says `BIGINT`, migration 001 says `uuid`

### 5.3 Known Database Discrepancies

1. **`/api/analytics/revenue` queries `status` column** but the schema now uses `payment_status` and `fulfillment_status`. The revenue query filters `eq('status', 'paid')` — this will always return 0 results because the `status` column is no longer updated.
2. **`data/products.ts`** has price=15000, weight="100g". **`data/products.json`** has price=14499, weight="72g". These are inconsistent.
3. **`db/migrations/006_add_payment_fulfillment_status.sql`** is a duplicate of **`db/supabase_migrations/006_add_payment_fulfillment_status.sql`**. The `db/migrations/` directory contains only this one file.

---

## 6. API INVENTORY

### 6.1 Public API Routes

| Route | Method | Purpose | Input | Output | Auth | Status |
|-------|--------|---------|-------|--------|------|--------|
| `/api/address/provinces` | GET | List all provinces | None | `ProvinceItem[]` | None | Complete |
| `/api/address/regencies` | GET | List regencies | `?provinceId=` | `RegencyItem[]` | None | Complete |
| `/api/address/districts` | GET | List districts | `?regencyId=` | `DistrictItem[]` | None | Complete |
| `/api/address/villages` | GET | List villages | `?districtId=` | `VillageItem[]` | None | Complete |
| `/api/contact` | POST | Submit contact form | `{name, email, phone?, message}` | `{success, data}` | None | Complete |
| `/api/orders` | GET | List orders | `?customer_id=&status=` | `{success, data}` | None | Complete |
| `/api/orders/[id]` | GET | Single order | param: id | `{success, data}` | None | Complete |
| `/api/orders/[id]` | PUT | Update order | `{status, payment_method, notes}` | `{success, data}` | None | Complete |
| `/api/payment` | POST | Create payment (legacy) | See `paymentSchema` | `{success, order_id, redirect_url}` | None | Complete |
| `/api/payment/create` | POST | Create payment (current) | See `createPaymentSchema` | `{success, orderId, token, redirectUrl}` | None | Complete |
| `/api/payment/callback` | POST | Midtrans callback | `MidtransNotification` | `{success, orderId, paymentStatus}` | None | Complete |
| `/api/products` | GET | List all products | None | `Product[]` | None | Complete |
| `/api/products` | POST | Create product | `{name, description, price, weight, id, images}` | `Product` | None | Complete |
| `/api/products` | PUT | Update product | `{id, name?, description?, price?, images?}` | `Product` | None | Complete |
| `/api/products` | DELETE | Delete product | `{id}` | `{success, message}` | None | Complete |
| `/api/products/[id]` | GET | Single product | param: id | `Product` | None | Complete |
| `/api/shipping` | POST | Flat rate calculation | `{address, service?}` | `{destination, service, shippingFee}` | None | Complete |
| `/api/qrisly` | POST | Generate QR code | `{transactionId, orderId}` | `{success, qr_url, image_url}` | None | Complete |

### 6.2 Admin API Routes

| Route | Method | Purpose | Input | Output | Auth | Status |
|-------|--------|---------|-------|--------|------|--------|
| `/api/admin/orders` | GET | Paginated order list | `?search=&payment_status=&fulfillment_status=&date_from=&date_to=&sort=&page=&limit=` | `{success, data, total, page, totalPages}` | None | Complete |
| `/api/admin/orders/[id]` | GET | Order detail | param: id or order_id | `{success, data: OrderDetailRow}` | None | Complete |
| `/api/admin/orders/[id]/actions` | POST | Fulfillment action | `{action, waybill_id?, cancellation_reason?}` | `{success, message, data}` | None | Complete |
| `/api/admin/orders/[id]/notes` | POST | Update admin notes | `{admin_notes}` | `{success, message, data}` | None | Complete |
| `/api/admin/orders/[id]/receipt` | GET | Generate PDF receipt | None (param: id) | `application/pdf` | None | Complete |
| `/api/admin/orders/[id]/shipment` | POST | Create Biteship shipment | None | `{success, message, data}` | None | Complete |
| `/api/admin/orders/[id]/timeline` | GET | Order audit timeline | None | `{success, data: TimelineEntry[]}` | None | Complete |
| `/api/admin/orders/[id]/tracking` | GET | Fetch Biteship tracking | None | `{success, data: TrackingInfo}` | None | Complete |

### 6.3 Deprecated/Analytics Routes

| Route | Method | Purpose | Status | Issue |
|-------|--------|---------|--------|-------|
| `/api/biteship-areas` | GET | Biteship area search | `@deprecated` | Marked deprecated; code still present |
| `/api/biteship-rates` | POST | Biteship courier rates | Active | Used by checkout flow |
| `/api/shipping/rajaOngkir` | POST | RajaOngkir cost calc | Incomplete | Imported path doesn't exist; env vars not in `.env.example` |
| `/api/analytics/revenue` | GET | Revenue analytics | Broken | Queries `status` column (deprecated); should query `payment_status` |
| `pages/api/orders/[id]/receipt` | GET | Legacy PDF receipt | `@deprecated` | Migrated to App Router |

### 6.4 API Route Observations

1. **No authentication on any API route.** Every endpoint is publicly accessible.
2. **`/api/admin/orders/*` has no admin guard** — any client can read/create/update orders.
3. **`/api/analytics/revenue` queries `status` column** which was replaced by `payment_status` and `fulfillment_status` in migration 006. This endpoint will always return 0 for revenue.
4. **`/api/shipping/rajaOngkir`** exists as a standalone file but is not exposed as a route handler (no `GET`/`POST` export). It's a utility function.
5. **Two payment creation routes exist:** `/api/payment` (legacy, direct Supabase insert) and `/api/payment/create` (current, uses OrderService).
6. **`/api/orders/[id]/callback`** exists as a separate route, duplicating the logic in `/api/payment/callback`.

---

## 7. PAGE INVENTORY

### 7.1 Public Pages

| Route | Purpose | Server/Client | Data Source | Status |
|-------|---------|--------------|-------------|--------|
| `/` | Home/Landing page | Client | `fetch(/api/products)` | Complete |
| `/produk` | Product listing | Server | `fetch(/api/products)`, `no-store` | Complete |
| `/produk/[id]` | Product detail | Server | `getProductById()`, ISR 300s | Complete |
| `/cart` | Shopping cart | Client | `useCart()` hook, `POST /api/shipping` | Complete |
| `/checkout` | Checkout form | Client | `useCart()`, `useCheckout()`, `getRates()` | Complete |
| `/checkout/success` | Payment success | Client | `fetch(/api/orders/[id])` | Complete |
| `/checkout/failed` | Payment failure | Client | localStorage only | Complete |
| `/kontak` | Contact page | Server | Constants | Complete |
| `/tentang` | About page | Server | Constants | Complete |
| `/dev/address-poc` | Address cascade PoC | Client | `kode-wilayah-id` | Incomplete (dev) |

### 7.2 Admin Pages

| Route | Purpose | Server/Client | Data Source | Status |
|-------|---------|--------------|-------------|--------|
| `/admin` | Admin login | Client | localStorage auth | Complete |
| `/admin/dashboard` | Dashboard stats | Client | `fetch(/api/orders)` | Partial (hardcoded data) |
| `/admin/orders` | Order management | Client | `useOrders()` hook | Complete |
| `/admin/orders/[id]` | Order detail | Server → Client | `useOrderDetail()` | Complete |
| `/admin/products` | Product CRUD | Client | `fetch(/api/products)` | Complete |
| `/admin/product-form` | Product form prototype | Client | Local state | Prototype |
| `/admin/pelanggan` | Customer management | Server | None | Placeholder |
| `/admin/pengaturan` | Settings | Server | None | Placeholder |

### 7.3 Page Observations

1. **No middleware/route groups.** All pages are directly in `app/`.
2. **`/dev/address-poc` is publicly accessible** in production.
3. **Admin login uses hardcoded credentials** (`1234`/`1234`) instead of env vars (`ADMIN_PASSWORD`).
4. **Admin dashboard has hardcoded mock data** (stok menipis, total pelanggan).
5. **Admin orders page works** with real API data.

---

## 8. COMPONENT INVENTORY

### 8.1 Layout Components (`components/layout/`)

| Component | Type | Props | Used In |
|-----------|------|-------|---------|
| `PublicShell` | Client | `{children}` | Root layout |
| `Header` | Client | None | PublicShell |
| `Footer` | Server | None | PublicShell |
| `Logo` | Server | `{className?, imageClassName?, showText?, priority?}` | Header, Footer |

### 8.2 UI Components (`components/ui/`)

| Component | Type | Props | Used In |
|-----------|------|-------|---------|
| `Button` | Server | `{variant?, className?, children?, href?, ...htmlAttrs}` | Multiple |
| `ThemeProvider` | Client | `{children}` | Root layout (not currently used) |
| `ThemeToggle` | Client | None | Multiple |
| `ToastProvider` | Client | `{children}` | Root layout |

### 8.3 Cart Components (`components/cart/`)

| Component | Type | Props | Used In |
|-----------|------|-------|---------|
| `CartProvider` | Client | `{children}` | Root layout |
| `CartDrawer` | Client | `{open, onClose}` | Header |
| `CartItemRow` | Client | `{item, onUpdateQuantity, onRemove, compact?}` | CartDrawer, Cart page |
| `CartSummary` | Client | `{items}` | CartDrawer, Cart page |

### 8.4 Checkout Components (`components/checkout/`)

| Component | Type | Props | Used In |
|-----------|------|-------|---------|
| `CheckoutProvider` | Client | `{children}` | Checkout page |
| `CheckoutForm` | Client | None | Checkout page |
| `CustomerInfo` | Client | None | CheckoutForm |
| `ShippingAddress` | Client | None | CheckoutForm |
| `AreaSelect` | Client | `{label, value, onChange, mode?, fetchOptions?, options?, ...}` | ShippingAddress |
| `OrderSummary` | Client | None | CheckoutForm |
| `VoucherSection` | Client | None | CheckoutForm |
| `CheckoutActions` | Client | None | CheckoutForm |
| `ShippingProvider` | Client | `{children, onRateSelect?}` | ShippingSelector |
| `ShippingSelector` | Client | None | CheckoutForm |
| `ShippingMethodCard` | Client | `{rate, isSelected, onSelect}` | ShippingSelector |
| `ShippingMethodList` | Client | `{rates, selectedId, onSelect}` | ShippingSelector |
| `ShippingSkeleton` | Server | None | ShippingSelector |
| `ShippingError` | Client | `{message, onRetry}` | ShippingSelector |

### 8.5 Product Components (`components/produk/`)

| Component | Type | Props | Used In |
|-----------|------|-------|---------|
| `ProdukGrid` | Server | `{products}` | Product listing |
| `ProductCard` | Server | `{product}` | ProdukGrid |
| `ProductGallery` | Client | `{images, productName}` | Product detail |
| `ProductInfo` | Server | `{product}` | Product detail |
| `ProductPrice` | Server | `{price}` | ProductInfo |
| `ProductWeight` | Server | `{weight}` | ProductInfo |
| `ProductDescription` | Server | `{description}` | ProductInfo |
| `ProductActions` | Client | `{product}` | ProductInfo |

### 8.6 Admin Components

| Component | Type | Location | Purpose |
|-----------|------|----------|---------|
| `AdminBadge` | Server | `admin/ui/` | Status badges (success/warning/danger/info/neutral) |
| `AdminButton` | Server | `admin/ui/` | Themed button (primary/secondary/success/danger/info/ghost) |
| `AdminDialog` | Client | `admin/ui/` | Confirmation dialog |
| `AdminGrid` | Server | `admin/ui/` | Responsive grid layout |
| `AdminInput`/`AdminTextarea`/`AdminSelect` | Server | `admin/ui/` | Form inputs with variants |
| `AdminKeyValue` | Server | `admin/ui/` | Label-value display |
| `AdminMetric` | Server | `admin/ui/` | Metric card (title + large value) |
| `AdminModal` | Client | `admin/ui/` | Generic modal |
| `AdminSpinner` | Server | `admin/ui/` | Loading spinner |
| `AdminUpload` | Client | `admin/ui/` | File upload area |
| `AdminSection` | Server | `admin/patterns/` | Section card with title/action |
| `AdminPageHeader` | Server | `admin/patterns/` | Page header with back button |
| `AdminToolbar` | Client | `admin/patterns/` | Search + filters + action toolbar |
| `AdminFilterBar` | Client | `admin/patterns/` | Filter dropdowns |
| `AdminTable` | Server | `admin/patterns/` | Semantic table with sub-components |
| `AdminEmptyLayout` | Server | `admin/patterns/` | Empty/error/not-found state |
| `ProgressModal` | Client | `admin/` | Multi-step upload progress |
| `ProductEditModal` | Client | `admin/` | Inline product edit |
| `ProductImagePicker` | Client | `admin/products/` | Image upload with drag-reorder |
| `OrderTable` | Client | `admin/orders/` | Orders data table |
| `OrderCard` | Client | `admin/orders/` | Mobile order card |
| `OrderToolbar` | Client | `admin/orders/` | Filter/search toolbar |
| `OrderPagination` | Client | `admin/orders/` | Paginated navigation |
| `OrderSkeleton` | Server | `admin/orders/` | Loading placeholder |
| `OrderDetailClient` | Client | `admin/orders/` | Full order detail page |
| `StatusCards` | Client | `admin/orders/` | Payment/fulfillment/shipping status cards |
| `CustomerSection` | Client | `admin/orders/` | Customer info + shipping address |
| `ItemsSection` | Client | `admin/orders/` | Order items table |
| `OrderActions` | Client | `admin/orders/` | Fulfillment action buttons |
| `OrderTimeline` | Client | `admin/orders/` | Audit event timeline |
| `TrackingPanel` | Client | `admin/orders/` | Shipment tracking display |
| `AdminNotes` | Client | `admin/orders/` | Admin notes editor |

### 8.7 Component Observations

1. **48 Client Components, 20 Server Components, 4 utility files.** Heavy client-side usage.
2. **All checkout components are Client Components** — no server-side checkout.
3. **Pattern library exists** (`admin/patterns/`, `admin/ui/`) but is not consistently used.
4. **`ProductEditModal` uses basic styling** instead of the admin UI kit.
5. **`CustomerSection` has hardcoded "-" placeholders** for address sub-fields.
6. **`VoucherSection` exists but vouchers are not implemented** in backend.

---

## 9. FEATURE MATRIX

| Feature | Status | Implemented % | Evidence |
|---------|--------|--------------|----------|
| **Product Catalog** | Complete | 100% | Listing page, detail page, API CRUD, ISR caching |
| **Product Images** | Complete | 100% | Supabase Storage, image picker, gallery, validation |
| **Shopping Cart** | Complete | 100% | Context provider, localStorage persistence, drawer, page |
| **Checkout Flow** | Complete | 100% | Form, address cascade, shipping selection, payment initiation |
| **Midtrans Payment** | Complete | 100% | Snap creation, callback handling, signature verification |
| **QRIS Payment** | Partial | 50% | QR generation endpoint exists, but not integrated into checkout |
| **Payment Callback** | Complete | 100% | Two callback handlers, signature verification, status mapping |
| **Flat Rate Shipping** | Complete | 100% | Environment-configured rates for 4 destinations |
| **Biteship Shipping** | Complete | 100% | Rate fetching, shipment creation, tracking, webhook handling |
| **PDF Receipt** | Complete | 100% | PDFKit + barcode + QR code, two endpoints (new + deprecated) |
| **Contact Form** | Complete | 100% | Form component, API route, database persistence |
| **Admin Login** | Complete | 60% | Hardcoded credentials, localStorage auth, no env var usage |
| **Admin Dashboard** | Partial | 40% | Real revenue data from API, but hardcoded stats mixed in |
| **Admin Order Management** | Complete | 100% | Paginated list, detail, fulfillment actions, notes, timeline |
| **Admin Product Management** | Complete | 100% | CRUD, image upload, ProgressModal |
| **Admin Customer Management** | Not Started | 0% | Placeholder page |
| **Admin Settings** | Not Started | 0% | Placeholder page |
| **Address Cascading** | Complete | 100% | kode-wilayah-id offline package, API endpoints, AreaSelect component |
| **Order Timeline/Audit** | Complete | 100% | audit_logs table, AuditLogService, timeline UI |
| **Order Tracking** | Complete | 100% | Biteship tracking integration, tracking panel |
| **Search Ranking** | Complete | 100% | `rankSearch` utility for address/product search |
| **Theme Toggle** | Complete | 100% | Dark/light mode with localStorage persistence |
| **Toast Notifications** | Complete | 100% | Context provider, auto-dismiss after 3s |
| **Responsive Design** | Partial | 70% | Mobile layouts exist (order cards, hamburger menu) but not fully consistent |
| **Error Boundaries** | Complete | 100% | Global error.tsx, per-page loading.tsx and not-found.tsx |
| **Voucher/Discount** | Not Started | 0% | UI component exists (VoucherSection) but no backend logic |
| **User Accounts** | Not Started | 0% | No customer authentication, no session management |
| **Production Deployment** | Not Started | 0% | No Vercel/cloud deployment detected |

---

## 10. CURRENT PROJECT STATUS

### 10.1 What Works

- Product catalog browsing and detail views
- Shopping cart with localStorage persistence
- Full checkout with address cascading, shipping selection, and Midtrans payment
- Payment callback processing and order status updates
- Admin order management (list, detail, fulfillment, notes, timeline, tracking)
- Admin product management (CRUD with image uploads)
- PDF receipt generation
- Contact form submission
- Biteship shipping rate fetching and shipment creation
- Address data via offline `kode-wilayah-id` package
- Dark/light theme toggle
- Toast notifications
- Error boundaries and loading states

### 10.2 What is Broken

1. **Build will fail** — `zod` is not in `package.json` dependencies but is imported in 5 files.
2. **`/api/analytics/revenue` returns 0** — queries deprecated `status` column instead of `payment_status`.
3. **Admin login uses hardcoded credentials** — `ADMIN_PASSWORD` env var exists but is never read.
4. **`data/products.ts` is dead code** — not imported anywhere in the application.
5. **Duplicate migration file** — `db/migrations/006_add_payment_fulfillment_status.sql` duplicates `db/supabase_migrations/006_add_payment_fulfillment_status.sql`.

### 10.3 What is Incomplete

- Admin dashboard: hardcoded mock data mixed with real API data
- Admin pelanggan (customers) page: placeholder only
- Admin pengaturan (settings) page: placeholder only
- Admin product-form: prototype only (standalone, not integrated)
- Voucher/discount system: UI only, no backend
- QRIS payment: endpoint exists but not integrated into checkout flow
- RajaOngkir shipping: utility function exists but not exposed as API route
- Dev route `/dev/address-poc` exposed publicly

### 10.4 Configuration State

- **Next.js config:** Correct. `images.remotePatterns` configured for Supabase storage. `serverExternalPackages` configured for PDF/barcode libs.
- **ESLint config:** Correct. Flat config with core-web-vitals and TypeScript.
- **PostCSS config:** Correct. Tailwind CSS v4 plugin + autoprefixer.
- **TypeScript config:** Correct. `strict: true`, `bundler` moduleResolution, `@/*` path alias.
- **Tailwind CSS v4:** Configured via `@theme inline` in `globals.css`. The `tailwind.config.ts` file was deleted from disk (shown as `D` in git status) — this is by design for Tailwind v4.
- **Gitignore:** Missing entries for `*.log`, `eslint-output.*`, `header_diff.txt`, `.memories.session.txt`.

---

## 11. CODE QUALITY OBSERVATIONS

### 11.1 Positive Patterns

1. **Layered architecture is respected.** Services → Repositories → Database. Business logic is not in API routes.
2. **AbortController pattern** consistently used in all hooks to cancel stale requests.
3. **TypeScript types** are well-defined throughout the codebase.
4. **Server/Client Component separation** is mostly respected (data fetching on server, interactivity on client).
5. **Zod validation** is used in services and API routes for input validation.
6. **Error handling** is consistent: try/catch with meaningful error messages and HTTP status codes.
7. **Audit logging** is comprehensive: every payment and fulfillment event is logged.
8. **Repository pattern** keeps database access centralized and testable.

### 11.2 Negative Patterns

1. **No authentication on any API route.** Admin endpoints are publicly accessible.
2. **No middleware** for request validation, rate limiting, or route protection.
3. **Two payment creation routes** (`/api/payment` and `/api/payment/create`) with overlapping logic.
4. **Two callback handlers** (`/api/payment/callback` and `/api/orders/[id]/callback`) with overlapping logic.
5. **Duplicate order lookup logic** — many API routes try `order_id` first, then `id` fallback.
6. **`status` column referenced** in several places despite being replaced by `payment_status`/`fulfillment_status`.
7. **Customer ID type mismatch** — `bigint` in schema.sql, `uuid` in migration 001, `number` in TypeScript interfaces.
8. **`useOrders` and other hooks use `any` cast** for API response JSON.
9. **`customers` field in `getPaginated`** has complex type casting logic (line 209-228 of order.repository.ts).
10. **`ProductEditModal`** uses basic inline styles instead of the admin UI kit.

---

## 12. PROVEN KNOWN ISSUES

> Only issues proven by source code. No guesses, opinions, or fix recommendations.

### 12.1 Build-Blocking Issues

| ID | Issue | File | Evidence |
|----|-------|------|----------|
| B-01 | `zod` not in `package.json` | `package.json` | `zod` imported in 5 files (`app/api/payment/route.ts`, `app/api/shipping/route.ts`, `app/api/payment/create/route.ts`, `lib/validation/checkout.ts`, `lib/validation/admin-orders.ts`) but absent from `dependencies` and `devDependencies`. |

### 12.2 Runtime Issues

| ID | Issue | File | Evidence |
|----|-------|------|----------|
| R-01 | Revenue API queries deleted `status` column | `app/api/analytics/revenue/route.ts:28` | Line 28: `.eq('status', status)` — the `status` column was replaced by `payment_status` and `fulfillment_status` in migration 006. The query will always return 0 results. |
| R-02 | Admin login ignores env vars | `app/admin/page.tsx` | Hardcoded `ADMIN_USERNAME = "1234"` and `ADMIN_PASSWORD = "1234"`. Environment variables `NEXT_PUBLIC_ADMIN_USERNAME` and `ADMIN_PASSWORD` exist in `.env.example` but are never read. |
| R-03 | RajaOngkir env vars not documented | `.env.example` | `RAJA_ONGKIR_API_URL`, `RAJA_ONGKIR_API_KEY`, `RAJA_ONGKIR_ORIGIN` are used in `app/api/shipping/rajaOngkir.ts` but not listed in `.env.example`. |
| R-04 | No admin API auth | All `/api/admin/orders/*` routes | No authentication check exists on any admin API endpoint. |

### 12.3 Schema/Data Issues

| ID | Issue | Evidence |
|----|-------|----------|
| D-01 | `customers.id` type conflict | `schema.sql` uses `BIGSERIAL`, migration `001_init_schema.sql` uses `uuid`. Code uses `number` in `OrderDetailRow.customers.id`. |
| D-02 | `orders.id` type conflict | `schema.sql` uses `UUID`, migration `001_init_schema.sql` uses `text`. |
| D-03 | `order_items.id` type conflict | Migration `001_init_schema.sql` uses `uuid`, later code assumes `BIGSERIAL` (number). |
| D-04 | `data/products.ts` and `data/products.json` inconsistent | `products.ts`: price=15000, weight="100g". `products.json`: price=14499, weight="72g". |
| D-05 | Duplicate migration file | `db/migrations/006_add_payment_fulfillment_status.sql` is identical to `db/supabase_migrations/006_add_payment_fulfillment_status.sql`. |

### 12.4 Code Debt Issues

| ID | Issue | Evidence |
|----|-------|----------|
| C-01 | Dead code: `data/products.ts` | Zero imports found across the codebase. |
| C-02 | Dead code: `hooks/.gitkeep` | Directory now has 7 real hook files. |
| C-03 | Exposed dev route | `app/dev/address-poc/page.tsx` is publicly accessible. |
| C-04 | Deprecated endpoint still active | `pages/api/orders/[id]/receipt.ts` marked `@deprecated` but still deployed. |
| C-05 | Deprecated route still active | `app/api/biteship-areas/route.ts` marked `@deprecated` but still deployed. |

### 12.5 Security Issues

| ID | Issue | Evidence |
|----|-------|----------|
| S-01 | No API authentication | All routes, including admin, are publicly accessible. |
| S-02 | Hardcoded admin credentials | `app/admin/page.tsx` lines 7-8: `const ADMIN_USERNAME = "1234"`, `const ADMIN_PASSWORD = "1234"`. |
| S-03 | Credentials in `.env.local.example` | Despite `.env*` in `.gitignore`, file contains real Supabase and Midtrans sandbox credentials. |
| S-04 | Dev route exposed in production | `app/dev/address-poc/page.tsx` has no guard. |

---

## 13. TECHNICAL DEBT

> Only debt items that are proven by source code.

### 13.1 Dual Payment/Callback Systems

Two payment creation flows exist in parallel:
1. **Legacy:** `POST /api/payment` — Directly inserts into Supabase, uses `paymentSchema` zod validation.
2. **Current:** `POST /api/payment/create` — Uses `OrderService.createDraft()`, `createSnapTransaction()`, `AuditLogService`.

Two callback handlers exist:
1. **Direct:** `POST /api/payment/callback` — Uses `OrderService.processCallback()`.
2. **By order ID:** `POST /api/orders/[id]/callback` — Handles signature verification inline, updates Supabase directly.

### 13.2 Dual Receipt Endpoints

- **Deprecated:** `pages/api/orders/[id]/receipt.ts` (Pages Router)
- **Current:** `GET /api/admin/orders/[id]/receipt` (App Router, uses `ReceiptService`)

### 13.3 Database Schema Drift

The reference `database/schema.sql` describes only 4 tables (customers, orders, order_items, contacts) with simpler schemas than what the 10 migrations have produced. The actual database likely has 6 tables (products, customers, orders, order_items, contacts, audit_logs) with 40+ columns.

### 13.4 Flat Rate Shipping vs Biteship

Two shipping systems exist:
1. **Flat rate:** `lib/flatRateShipping.ts` — Environment-based rates for Jakarta/Bandung/Surabaya/Luar Jawa.
2. **Biteship:** `lib/services/shipping/*` — Real-time courier rates via Biteship API.

The cart page uses flat rate (`POST /api/shipping`), while the checkout page uses Biteship rates (`POST /api/biteship-rates`).

### 13.5 Stale Build Artifacts

5 `.log` files, 3 `eslint-output.*` files, `header_diff.txt`, and `.memories.session.txt` are tracked by git (not in `.gitignore`) but are build artifacts with no source value.

---

## 14. APPENDIX

### 14.1 Environment Variables Currently Used

| Variable | Used In | Source |
|----------|---------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `lib/supabase.ts`, `lib/supabase-client.ts` | Required |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `lib/supabase-client.ts` | Required |
| `SUPABASE_SERVICE_ROLE_KEY` | `lib/supabase.ts` | Required |
| `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` | `lib/midtrans.ts` | Required |
| `MIDTRANS_SERVER_KEY` | `lib/midtrans.ts` | Required |
| `NEXT_PUBLIC_MIDTRANS_ENV` | `lib/midtrans.ts` | Required |
| `BITESHIP_API_KEY` | `app/api/biteship-areas/route.ts`, `app/api/biteship-rates/route.ts`, `lib/services/shipping/constants.ts` | Optional |
| `BITESHIP_SHIPPER_*` | `lib/services/shipping/constants.ts` | Optional |
| `BITESHIP_COURIER_*` | `lib/services/shipping/constants.ts` | Optional |
| `SHIPPING_RATE_*` | `lib/flatRateShipping.ts` | Optional |
| `NEXT_PUBLIC_SITE_URL` | `app/produk/page.tsx`, `app/api/payment/route.ts` | Required |
| `RAJA_ONGKIR_API_URL` | `app/api/shipping/rajaOngkir.ts` | Optional (undocumented) |
| `RAJA_ONGKIR_API_KEY` | `app/api/shipping/rajaOngkir.ts` | Optional (undocumented) |
| `RAJA_ONGKIR_ORIGIN` | `app/api/shipping/rajaOngkir.ts` | Optional (undocumented) |

### 14.2 Import Map

```
@/lib/supabase              → Server-side Supabase client (service role)
@/lib/supabase-client       → Client-side Supabase client (anon key)
@/lib/midtrans              → Midtrans Snap + Core API
@/lib/order                 → buildOrderId()
@/lib/constants              → SITE, NAV_LINKS, SOCIAL_LINKS
@/lib/utils                  → cn(), formatPrice()
@/lib/flatRateShipping       → Flat rate shipping calculator
@/lib/repositories           → Barrel export (OrderRepository, CustomerRepository, AuditLogRepository)
@/lib/services/product.service       → getCatalogProducts(), getProductById()
@/lib/services/order.service         → createDraft(), confirmPayment(), processCallback()
@/lib/services/fulfillment.service   → process(), ship(), complete(), cancel()
@/lib/services/audit-log.service     → logPaymentEvent(), logFulfillmentEvent()
@/lib/services/address/provider      → getProvinces(), getRegencies(), getDistricts(), getVillages()
@/lib/services/payment/types         → PAYMENT_STATUS, FULFILLMENT_STATUS, interfaces
@/lib/services/payment/mapper        → mapMidtransStatus(), combineAddress()
@/lib/services/payment/verifySignature  → verifyMidtransSignature()
@/lib/services/payment/createSnap    → createSnapTransaction()
@/lib/services/payment/callback      → processPaymentCallback()
@/lib/services/payment/checkoutValidation → validateCheckoutRequest()
@/lib/services/shipping/types        → SHIPPING_STATUS, Biteship interfaces
@/lib/services/shipping/constants    → Biteship API config
@/lib/services/shipping/biteship     → createShipment(), getTracking()
@/lib/services/shipping/getRates     → getRates(), getDestinationCoords()
@/lib/services/shipping/mapper       → mapBiteshipRates(), groupByCourier(), etc.
@/lib/services/shipping/shipment.service → createShipment(), handleWebhook(), getTrackingInfo()
@/lib/services/shipping/tracking.service  → fetchAndPersist()
@/lib/services/shipping/receipt.service   → generateReceipt()
@/lib/validation/checkout            → customerInfoSchema, shippingAddressSchema
@/lib/validation/admin-orders        → paginatedOrdersSchema, adminActionSchema, adminNotesSchema
@/lib/validation/product-image.validation → validateImageFile(), validateFileCount(), validateTotalSize()
@/lib/constants/upload               → UPLOAD constants
@/lib/errors/upload-errors           → classifyUploadError(), getUploadSummary()
@/lib/utils/searchRanking            → rankSearch()
@/types                              → Product, CartItem, Order, NavLink, ProductRow
@/types/checkout                     → CustomerInfo, ShippingAddress, ShippingRate, CheckoutState, CheckoutAction
```

### 14.3 Provider Hierarchy

```
<html>
  <ToastProvider>
    <CartProvider>
      <PublicShell>           ← only if not /admin/*
        <Header />
        {children}
        <Footer />
      </PublicShell>
    </CartProvider>
  </ToastProvider>
</html>
```

Checkout pages add additional providers:
```
<CheckoutProvider>
  <ShippingProvider>          ← inside ShippingSelector
    {checkout form}
  </ShippingProvider>
</CheckoutProvider>
```

### 14.4 Data Flow: Complete Order Lifecycle

```
1. Customer browses products → GET /api/products → Product[]
2. Customer adds to cart → CartProvider (localStorage)
3. Customer goes to /checkout → CheckoutForm
4. Customer fills address → ShippingAddress fetches /api/address/*
5. Shipping rates fetched → ShippingProvider calls /api/biteship-rates
6. Customer submits → CheckoutForm → POST /api/payment/create
   ├── OrderService.createDraft() → inserts customer, order, items
   ├── createSnapTransaction() → Midtrans Snap API → {token, redirect_url}
   ├── OrderService.confirmPayment() → updates payment_status=pending
   └── Redirect to Midtrans payment page
7. Midtrans processes payment → POST /api/payment/callback
   ├── verifyMidtransSignature() → SHA-512 check
   ├── OrderService.processCallback() → map status, update order
   └── AuditLogService.logPaymentEvent()
8. Customer returns to /checkout/success → fetch /api/orders/[id]
9. Admin views order → GET /api/admin/orders → paginated list
10. Admin processes order → POST /api/admin/orders/[id]/actions → process
11. Admin creates shipment → POST /api/admin/orders/[id]/shipment
    ├── ShipmentService.createShipment() → Biteship API
    └── Updates shipment_id, waybill_id
12. Admin marks shipped → POST actions → ship
13. Tracking available → GET /api/admin/orders/[id]/tracking
14. Admin completes → POST actions → complete
```

---

*End of PROJECT_STATE_REPORT.md*
