# Tech Lead Context — Permanent Architectural Decisions

> **Maintainer:** Tech Lead
> **Audience:** All engineers (human and AI)
> **Purpose:** Single source of truth for architectural decisions. Never modify without Tech Lead approval.
> **Last Updated:** 2026-07-03

---

## Project Vision

D'Jaemo Jamur Krispi is a monolithic Next.js e-commerce application for a mushroom cracker brand in Indonesia. It serves both the public storefront (product catalog, cart, checkout) and an admin dashboard (order management, product CRUD, shipping). The backend runs inside the Next.js runtime — there is no separate API server.

**TODO:** Document the long-term product vision (beyond MVP) once defined by the Product Owner.

---

## Architecture

| Attribute | Value |
|-----------|-------|
| **Pattern** | Monolithic Next.js (App Router primary, Pages Router for PDF receipt only) |
| **Frontend** | React 19. Server Components where possible, Client Components where interaction is needed |
| **Backend** | Next.js API Route Handlers |
| **Database** | Supabase PostgreSQL (single project) |
| **State** | React Context + localStorage (cart). No server-side sessions for customers |
| **Auth** | Admin-only. Server-side session (future — currently hardcoded localStorage) |
| **Deployment** | Vercel (target) |

### Layer Architecture (Target)

```
Presentation → API Routes → Services → Repositories → Supabase
```

- **API Routes** — HTTP concerns only (parse request, delegate, respond)
- **Services** — Business logic, validation, transformation
- **Repositories** — Data access, raw Supabase queries

**Current state:** Services and Repositories exist for Product domain only (`lib/services/product.service.ts`, `lib/repositories/product.repository.ts`). All other domains still use inline Supabase queries in API routes.

### Layer Rules

1. API Routes MUST NOT contain business logic
2. Services MUST NOT contain HTTP concerns
3. Repositories MUST NOT contain business logic or HTTP concerns
4. Components MUST NOT call Supabase directly — use API routes

---

## Tech Stack

| Layer | Technology | Constraint |
|-------|-----------|------------|
| Framework | Next.js 16.2.9 | Turbopack has bug — use `--webpack` for dev |
| UI Library | React 19.2.4 | — |
| Styling | Tailwind CSS 4 | Use `@theme inline` tokens from `globals.css` |
| Language | TypeScript 5 | Strict mode enabled |
| Database | Supabase PostgreSQL | Service role key for server, anon key for client |
| Payment | Midtrans Snap (redirect) | HMAC-SHA512 signature verification |
| Shipping | Flat Rate (active), Biteship (partial), Raja Ongkir (stub) | See shipping section |
| Font | Geist (via next/font) | — |
| PDF | pdfkit + bwip-js + qrcode | Pages Router only |

**TODO:** Pin specific versions of all packages in a constraints file once stable.

---

## Folder Structure

```
djaemojamurkrispi/
├── app/                    # Next.js App Router — all pages & API routes
│   ├── admin/              # Admin login, dashboard, CRUD pages
│   ├── api/                # API Route Handlers (orders, products, payment, etc.)
│   ├── cart/               # Shopping cart page
│   ├── checkout/           # Checkout form + success/failure pages
│   ├── kontak/             # Contact page
│   ├── produk/             # Product catalog page
│   └── tentang/            # About page
├── components/             # React components by domain
│   ├── admin/              # Admin-specific components
│   ├── cart/               # CartProvider and cart-related
│   ├── contact/            # Contact form
│   ├── layout/             # Header, Footer, Logo
│   ├── produk/             # Product grid/cards
│   ├── sections/           # Section wrapper, PageHeader
│   └── ui/                 # Button, Toast, etc.
├── lib/                    # Utilities, services, repositories, constants
│   ├── repositories/       # Data access layer (ProductRepository exists)
│   ├── services/           # Business logic layer (ProductService exists)
│   ├── validation/         # Zod schemas (planned)
│   ├── constants/          # Centralized constants
│   ├── utils/              # Utility functions
│   └── errors/             # Error types (planned)
├── types/                  # TypeScript declarations
├── data/                   # Static product data (to be consolidated with DB)
├── database/               # SQL schema reference (may drift from live)
├── db/                     # Supabase migration files (source of truth)
├── hooks/                  # Custom hooks (empty — to be created)
├── scripts/                # Node.js migration/utility scripts
├── pages/                  # Legacy Pages Router (PDF receipt only)
└── public/                 # Static assets
```

### Naming Conventions

| Convention | Rule |
|-----------|------|
| Route files | `route.ts` (App Router) |
| Page files | `page.tsx` (App Router) |
| Components | PascalCase (`ProdukGrid.tsx`) |
| Utilities | camelCase (`flatRateShipping.ts`) |
| Constants | UPPER_SNAKE_CASE or camelCase per context |
| Routes | Indonesian for public (`produk`, `tentang`, `kontak`), English for API |

---

## Repository Pattern

**Status:** Implemented for Product domain only.

### Rules

1. Repository methods return raw database rows — no transformation
2. Repository methods throw on database error — no fallback logic
3. Repository names are domain-specific: `ProductRepository`, `OrderRepository`
4. Repository files live in `lib/repositories/`

### Existing: `lib/repositories/product.repository.ts`

| Method | Signature | Description |
|--------|-----------|-------------|
| `findAll()` | `() => Promise<ProductRow[]>` | All products, no filter |
| `findActive()` | `() => Promise<ProductRow[]>` | Only `is_active = true` and `deleted_at IS NULL` |
| `findById(id)` | `(id: string) => Promise<ProductRow \| null>` | By primary key |
| `findImages(productId)` | `(productId: string) => Promise<string[]>` | Image URLs from `product_images` |
| `create(data)` | `(data: CreateProductInput) => Promise<ProductRow>` | Insert + return row |
| `insertImages(productId, urls)` | `(productId: string, urls: string[]) => Promise<void>` | Batch insert |
| `update(id, data)` | `(id: string, data: UpdateProductInput) => Promise<ProductRow \| null>` | Update + return |
| `replaceImages(productId, urls)` | `(productId: string, urls: string[]) => Promise<void>` | Delete all + insert new |
| `deleteImages(productId)` | `(productId: string) => Promise<void>` | Delete all images |
| `remove(id)` | `(id: string) => Promise<boolean>` | Hard delete |
| `getActiveImages()` | `() => Promise<{productId: string, urls: string[]}[]>` | Bulk image fetch |

---

## Service Layer

**Status:** Implemented for Product domain only.

### Rules

1. Services contain business logic, validation, and data transformation
2. Services call Repositories — never Supabase directly
3. Services do NOT throw errors to callers — return standardized values (`[]`, `null`, `{ success: false }`)
4. Services live in `lib/services/`

### Existing: `lib/services/product.service.ts`

| Method | Description |
|--------|-------------|
| `getCatalogProducts()` | Active products with images. Returns `[]` if none |
| `getAdminProducts()` | All products (including inactive). Returns `[]` if none |
| `getProductById(id)` | Single product with images. Returns `null` if not found |
| `createProduct(data)` | Validate → create → return Product |
| `updateProduct(id, data)` | Validate → update → return Product or `null` |
| `deleteProduct(id)` | Fetch images → delete from Storage → delete from DB |

---

## Payment (Midtrans)

| Attribute | Value |
|-----------|-------|
| **Gateway** | Midtrans Snap (redirect method) |
| **Flow** | Client → `POST /api/payment` → create order in DB → create Midtrans transaction → redirect to Snap |
| **Webhook** | `POST /api/orders/[id]/callback` — HMAC-SHA512 signature verification |
| **Status Mapping** | `settlement` → `paid`, `pending` → `pending`, `deny/cancel/expire` → `failed` |
| **Environment** | Controlled by `NEXT_PUBLIC_MIDTRANS_ENV` env var |

### Known Issues

- **Price manipulation vulnerability:** Client sends subtotal/shippingFee without server-side validation against database prices (see `docs/CHECKOUT_REVIEW.md`)
- **No database transaction:** Payment flow inserts customer → order → order_items without rollback on failure
- **Token misnomer:** Midtrans Snap `token` stored as `transaction_id` in orders table
- **No idempotency:** Duplicate payment requests can create duplicate orders

---

## Shipping

| Provider | Status | Active In |
|----------|--------|-----------|
| Flat Rate | Active | Checkout, Cart |
| Biteship | Partial (admin only) | Admin dashboard (cetak resi) |
| Raja Ongkir | Stub/Dead | Not imported anywhere |

### Flat Rate

- Rate determined by destination parsing from address string
- Destinations: Jakarta, Bandung, Surabaya, Luar Jawa
- Services: Reguler (×1), Express (×1.4), Economy (×0.95)
- Rates configurable via env vars: `SHIPPING_RATE_JAKARTA`, `SHIPPING_RATE_BANDUNG`, `SHIPPING_RATE_SURABAYA`, `SHIPPING_RATE_LUAR_JAWA`

---

## Dashboard Philosophy

The admin dashboard is a **single operational module** for order management. It is NOT:

- A general-purpose admin panel for all business functions
- A data analytics platform
- A customer management system

### Rules

1. Dashboard shows **business overview only** — revenue summary, pending orders count, recent orders
2. Detailed operations happen on dedicated sub-pages (e.g., `/admin/orders/`, `/admin/products/`)
3. Dashboard MUST NOT contain product CRUD — that belongs in `/admin/products/`
4. Dashboard MUST NOT contain business logic — delegate to Services

**Current violation:** The admin dashboard is a 1555+ LOC monolith with order management, product CRUD, Biteship integration, image upload, and print receipt all in one file. Refactoring is planned (see `docs/IMPLEMENTATION_ROADMAP.md` Sprint 5).

---

## Orders Philosophy

Orders are the **single operational module**. All order-related functionality lives in a coherent set of routes and components.

### Rules

1. `GET /api/orders` — list orders (admin only — needs auth)
2. `GET /api/orders/[id]` — single order detail
3. `PUT /api/orders/[id]` — update order status
4. `POST /api/orders/[id]/callback` — Midtrans webhook (no auth, HMAC-signed)
5. All order mutations require server-side validation of allowed status transitions

---

## ADS Philosophy (Admin Domain Separation)

Admin features are separated into distinct domains. Each domain has its own page, API routes, and components.

| Domain | Page | API | Status |
|--------|------|-----|--------|
| Orders | `/admin/orders/` | `/api/orders/` | Has bugs (see C-05) |
| Products | `/admin/products/` | `/api/products/` | Three duplicate forms exist |
| Dashboard | `/admin/dashboard/` | `/api/analytics/revenue` | Monolithic, needs split |

### Rules

1. Each admin domain is business-agnostic — no cross-domain logic
2. No admin domain calls another admin domain's API internally
3. Admin domains share UI components (`Button`, `Toast`, etc.) but not business logic
4. Admin auth is shared via a single mechanism (future: server-side session)

---

## Current Product Decisions

Verified from existing documentation (`docs/ARCHITECTURE_DISCOVERY_REPORT.md`, `docs/CODE_AUDIT_REPORT.md`, `docs/PRODUCT_DOMAIN_ARCHITECTURE.md`):

| Decision | Status | Source |
|----------|--------|--------|
| Products have two data sources (static + DB) | Known issue — to be consolidated Sprint 4 | ARCHITECTURE_DISCOVERY_REPORT |
| `product_images` table exists but no migration file | Known issue — schema drift | CODE_AUDIT D-05 |
| Price stored as integer (IDR in rupiah) | Confirmed | PRODUCT_DOMAIN_ARCHITECTURE |
| Product IDs are text slugs (e.g., "produk-1") | Confirmed | `data/products.ts` |
| Image storage in Supabase Storage bucket `product-images` | Confirmed | ADMIN_PRODUCT_REVIEW |
| Hard delete used (no soft delete yet) | Confirmed | PRODUCT_DOMAIN_ARCHITECTURE |

**TODO:** Define the official product data model once static data is consolidated into the database.

---

## Deprecation Notices

| Item | Status | Replacement | Target Sprint |
|------|--------|-------------|---------------|
| `lib/shipping.ts` | Dead | `lib/flatRateShipping.ts` | Sprint 1 |
| `app/api/shipping/rajaOngkir.ts` | Dead | Remove | Sprint 1 |
| `components/admin/AdminGuard.tsx` | Dead (empty) | Remove | Sprint 1 |
| `hooks/` directory | Dead (empty) | Remove | Sprint 1 |
| `components/ui/ThemeProvider.tsx` | Unused | Remove or wire up | Sprint 1 |
| `components/ui/ThemeToggle.tsx` | Unused | Remove or wire up | Sprint 1 |
| `pages/` (Pages Router) | Legacy | Migrate to App Router | Future |
| `data/products.ts` + `data/products.json` | Duplicate data source | Consolidate to Supabase | Sprint 4 |
| Hardcoded admin credentials (`1234/1234`) | Critical vulnerability | Server-side auth | Sprint 2 |
| `app/admin/product-form/page.tsx` | Unfinished duplicate | Remove or complete | Sprint 5 |

---

## Reference Documents

| Document | What It Covers |
|----------|----------------|
| `docs/ARCHITECTURE_DISCOVERY_REPORT.md` | Full architecture, folder structure, dependency graph |
| `docs/CODE_AUDIT_REPORT.md` | All findings (critical to low) |
| `docs/IMPLEMENTATION_ROADMAP.md` | 7-sprint plan |
| `docs/FINAL_ENGINEERING_REVIEW.md` | CTO-level due diligence |
| `docs/PRODUCT_DOMAIN_ARCHITECTURE.md` | Repository + Service layer design for Product |
| `docs/CHECKOUT_REVIEW.md` | Deep checkout flow analysis |
| `docs/KNOWN_ISSUES.md` | Turbopack bug workaround |
| `docs/ADMIN_PRODUCT_REVIEW.md` | Admin product module analysis |
| `SETUP.md` | Environment setup guide |
| `BACKEND_SETUP.md` | Backend integration guide |
