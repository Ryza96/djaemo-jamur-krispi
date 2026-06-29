# Implementation Roadmap — D'Jaemo Jamur Krispi

> **Phase:** 2 — Implementation Roadmap
> **Mode:** READ ONLY
> **Date:** 2026-06-29
> **Author:** AI Agent (opencode)
> **Status:** Planning Complete — Ready for Sprint 1

---

## Executive Summary

This roadmap defines a **7-sprint plan** to bring the D'Jaemo Jamur Krispi e-commerce project from its current state (production readiness score: **15/100**) to a **production-ready, secure, and maintainable application**.

### Current State

| Metric | Score | Target |
|--------|-------|--------|
| Production Readiness | 15/100 | 85/100 |
| Security | 20/100 | 90/100 |
| Maintainability | 35/100 | 75/100 |
| Performance | 60/100 | 80/100 |
| Code Quality | 35/100 | 75/100 |

### Guiding Principles

1. **Security first** — Fix critical vulnerabilities before adding features
2. **Fix broken things first** — Admin order list, missing deps, dead code
3. **Smallest safe changes first** — Low-risk refactors early, high-risk after testing
4. **Never refactor without tests** — Add tests before touching complex logic
5. **API stability** — Standardize response shapes before building on them
6. **No new features** — Zero feature work until security baseline is met

### Key Milestones

| Milestone | Sprint | Target Readiness |
|-----------|--------|-----------------|
| Admin can manage orders | Sprint 1 | 30/100 |
| API is secured | Sprint 2 | 55/100 |
| Fraud prevention active | Sprint 3 | 70/100 |
| Data consistent | Sprint 4 | 78/100 |
| Architecture clean | Sprint 5 | 85/100 |
| Production optimized | Sprint 6 | 88/100 |
| Tested & stable | Sprint 7 | 90/100 |

### Total Estimated Effort

| Category | Effort | Sprint |
|----------|--------|--------|
| Quick Wins | ~4 hours | Sprint 1 |
| Security | ~3 days | Sprint 2 |
| Validation & Integrity | ~3 days | Sprint 3 |
| Database | ~4 days | Sprint 4 |
| Architecture | ~6 days | Sprint 5 |
| Performance | ~3 days | Sprint 6 |
| Testing & Polish | ~6 days | Sprint 7 |
| **Total** | **~26-28 days** | **7 sprints** |

---

## Overall Strategy

### Sprint Dependency Tree

```
Sprint 1: Quick Wins & Broken Fixes
    ↓
Sprint 2: Security & Authentication  ← BLOCKING
    ↓
Sprint 3: Validation & Data Integrity
    ↓                          ↓
Sprint 4: Database Consistency  Sprint 5: Architecture Refactoring
    ↓                          ↓
Sprint 6: Performance & Optimization
    ↓
Sprint 7: Testing & Quality
```

**Critical path:** Sprint 1 → Sprint 2 → Sprint 3 → Sprint 4 → Sprint 7

**Parallel path:** Sprint 3 ↔ Sprint 5 (can run in parallel after Sprint 2)

### Work Classification by Category

| Category | Count | Total Effort | Sprint |
|----------|-------|-------------|--------|
| Security | 6 findings | ~3 days | Sprint 2 |
| Authentication | 2 findings | ~2 days | Sprint 2 |
| Authorization | 1 finding | ~1 day | Sprint 2 |
| API | 7 findings | ~2 days | Sprint 3 |
| Database | 6 findings | ~3 days | Sprint 4 |
| Business Logic | 8 findings | ~2 days | Sprint 1, 3 |
| Frontend | 4 findings | ~1 day | Sprint 1, 7 |
| React | 7 findings | ~1 day | Sprint 7 |
| Next.js | 9 findings | ~2 days | Sprint 6 |
| Performance | 6 findings | ~1 day | Sprint 6 |
| Architecture | 7 findings | ~5 days | Sprint 5 |
| Refactoring | 8 findings | ~3 days | Sprint 5 |
| Testing | Infrastructure | ~4 days | Sprint 7 |
| Documentation | Ongoing | ~1 day | Sprint 7 |
| Cleanup | 13 findings | ~4 hours | Sprint 1 |

---

## Sprint Plan

---

### Sprint 0 — Preparation (Before Coding)

**Objective:** Set up tooling, environment, and safety nets before any code changes.

| Task | Effort | Description |
|------|--------|-------------|
| P-01 | 15 min | Run `npm install` with missing packages locally |
| P-02 | 30 min | Verify existing build works (`npm run build`) |
| P-03 | 30 min | Set up Git branch protection rules |
| P-04 | 30 min | Configure ESLint rules (if not already active) |
| P-05 | 15 min | Document current `.env.local` values (team reference) |
| P-06 | 30 min | Create PR template for consistent reviews |

**Definition of Done:**
- [ ] `npm run build` succeeds on `main` branch
- [ ] `npm run lint` passes on `main` branch
- [ ] Team has access to current `.env.local` values
- [ ] Git branch protection exists for `main`

---

### Sprint 1: "Quick Wins & Broken Windows"

**Objective:** Fix the most obvious bugs and clean up dead code. Every task here is low-risk, isolated, and takes <30 minutes.

**Dependencies:** None (all tasks are independent)

**Risk Level:** Very Low

#### Task: QW-01 — Add Missing Dependencies to package.json

| Field | Value |
|-------|-------|
| **ID** | QW-01 |
| **Title** | Add missing production dependencies |
| **Description** | `pdfkit`, `bwip-js`, and `qrcode` are imported by `pages/api/orders/[id]/receipt.ts` but not listed in `package.json`. Add them. |
| **Files Affected** | `package.json` |
| **Dependencies** | None |
| **Risk** | None (adding packages never breaks existing code) |
| **Estimated Time** | 2 min |
| **Expected Result** | PDF receipt endpoint works in production deployments |
| **Audit Ref** | C-06, TD-10 |

#### Task: QW-02 — Fix Admin Order List Parsing

| Field | Value |
|-------|-------|
| **ID** | QW-02 |
| **Title** | Fix dashboard order list `Array.isArray` check |
| **Description** | `fetchOrders` in dashboard checks `Array.isArray(data)` but API returns `{success: true, data: [...]}`. Change to `Array.isArray(data.data)`. Same fix in `app/admin/orders/page.tsx`. |
| **Files Affected** | `app/admin/dashboard/page.tsx:918`, `app/admin/orders/page.tsx:61` |
| **Dependencies** | None |
| **Risk** | Low (isolated frontend fix) |
| **Estimated Time** | 15 min |
| **Expected Result** | Admin order list renders correctly |
| **Audit Ref** | C-05 |

#### Task: QW-03 — Fix Admin Orders Page Navigation

| Field | Value |
|-------|-------|
| **ID** | QW-03 |
| **Title** | Create `/admin/orders/[id]` route or fix navigation |
| **Description** | The orders page navigates to `/admin/orders/${orderId}` but no such route exists. Either create a detail page or remove the navigation. |
| **Files Affected** | `app/admin/orders/page.tsx:74` |
| **Dependencies** | None |
| **Risk** | Low |
| **Estimated Time** | 30 min |
| **Expected Result** | Clicking an order row navigates to a valid page |
| **Audit Ref** | H-15 |

#### Task: QW-04 — Fix Checkout localStorage Race Condition

| Field | Value |
|-------|-------|
| **ID** | QW-04 |
| **Title** | Save order to localStorage before redirect |
| **Description** | `window.location.href = paymentData.redirect_url;` runs BEFORE `localStorage.setItem(...)`. Reverse the order — save first, then redirect. |
| **Files Affected** | `app/checkout/page.tsx:119-140` |
| **Dependencies** | None |
| **Risk** | Low |
| **Estimated Time** | 30 min |
| **Expected Result** | Order data is always saved before payment redirect |
| **Audit Ref** | H-05 |

#### Task: QW-05 — Remove Dead Code

| Field | Value |
|-------|-------|
| **ID** | QW-05 |
| **Title** | Remove all dead/unused files |
| **Description** | Remove: `lib/shipping.ts` (duplicate), `app/api/shipping/rajaOngkir.ts` (dead), `components/admin/AdminGuard.tsx` (empty), `hooks/` directory (empty), `app/api/orders/[id]/receipt/` (empty duplicate), `components/ui/ThemeProvider.tsx` and `ThemeToggle.tsx` (unused). |
| **Files Affected** | 7 files/directories |
| **Dependencies** | None |
| **Risk** | Very Low (files are not imported anywhere) |
| **Estimated Time** | 20 min |
| **Expected Result** | Cleaner codebase, fewer confusing files |
| **Audit Ref** | H-09, H-10, M-01, M-02, M-03, H-14, N-01 |

#### Task: QW-06 — Fix Language Inconsistency

| Field | Value |
|-------|-------|
| **ID** | QW-06 |
| **Title** | Change "Add to Cart" to Indonesian |
| **Description** | Button text uses English "Add to Cart" while all other UI text is Indonesian. Change to "Tambah ke Keranjang". |
| **Files Affected** | `components/produk/ProdukGrid.tsx:67` |
| **Dependencies** | None |
| **Risk** | Zero |
| **Estimated Time** | 1 min |
| **Expected Result** | Consistent Indonesian UI language |
| **Audit Ref** | L-01 |

#### Task: QW-07 — Clean Up Commented Code

| Field | Value |
|-------|-------|
| **ID** | QW-07 |
| **Title** | Remove commented Chart.js code from admin dashboard |
| **Description** | Remove the commented-out Chart.js code (lines ~779-810 in dashboard). The `<canvas>` element renders empty. |
| **Files Affected** | `app/admin/dashboard/page.tsx:779-810` |
| **Dependencies** | None |
| **Risk** | Zero |
| **Estimated Time** | 2 min |
| **Expected Result** | Cleaner dashboard, no misleading empty chart |
| **Audit Ref** | P-03, TD-13 |

#### Task: QW-08 — Remove Duplicate sanitizePriceToInt

| Field | Value |
|-------|-------|
| **ID** | QW-08 |
| **Title** | Remove duplicate function from admin dashboard |
| **Description** | `sanitizePriceToInt` is defined in both `app/api/products/route.ts` and `app/admin/dashboard/page.tsx`. Import from one location. |
| **Files Affected** | `app/admin/dashboard/page.tsx:1011-1024` |
| **Dependencies** | None |
| **Risk** | Low |
| **Estimated Time** | 10 min |
| **Expected Result** | Single source of truth for price sanitization |
| **Audit Ref** | H-12 |

#### Task: QW-09 — Update .env.example

| Field | Value |
|-------|-------|
| **ID** | QW-09 |
| **Title** | Add missing environment variables to `.env.example` |
| **Description** | Add missing vars: `RAJA_ONGKIR_*`, `NEXT_PUBLIC_STORE_*`, `SHIPPING_RATE_*`. Also add documentation for which are required vs optional. |
| **Files Affected** | `.env.example` |
| **Dependencies** | None |
| **Risk** | Zero (documentation only) |
| **Estimated Time** | 15 min |
| **Expected Result** | Complete reference for all environment variables |
| **Audit Ref** | Quick Win 8 |

#### Task: QW-10 — Fix Magic Numbers in Shipping

| Field | Value |
|-------|-------|
| **ID** | QW-10 |
| **Title** | Extract magic numbers to named constants |
| **Description** | `200`, `100`, `2000` used in shipping calculations with no explanation. Extract to `BASE_WEIGHT_G`, `WEIGHT_INCREMENT_G`, `COST_PER_INCREMENT`. |
| **Files Affected** | `lib/flatRateShipping.ts:45-47` |
| **Dependencies** | None |
| **Risk** | Low (pure refactor, no logic change) |
| **Estimated Time** | 15 min |
| **Expected Result** | Self-documenting shipping calculation code |
| **Audit Ref** | M-07 |

#### Sprint 1 Deliverables

| Deliverable | Type |
|-------------|------|
| `package.json` updated with 3 missing packages | File change |
| Admin dashboard order list renders correctly | Bug fix |
| Admin orders page navigation works | Bug fix |
| Checkout localStorage race condition eliminated | Bug fix |
| 7 dead files/directories removed | Cleanup |
| Button text uses Indonesian consistently | Fix |
| Commented-out code removed | Cleanup |
| Duplicate function removed | Refactor |
| `.env.example` is complete | Documentation |
| Magic numbers extracted to named constants | Refactor |

**Estimated Time:** ~2.5 hours

**Definition of Done:**
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes
- [ ] Admin dashboard shows orders (test with real API)
- [ ] Checkout flow saves order before redirect
- [ ] No dead files remain in the project
- [ ] All changes in a single PR for easy review

---

### Sprint 2: "Secure the Perimeter"

**Objective:** Implement proper authentication and authorization. This is the **most critical sprint** — without it, the application cannot be deployed to production safely.

**Dependencies:** Sprint 1 (clean up first to reduce noise)

**Risk Level:** **HIGH** — auth changes can break the entire admin workflow

**Strategy:**
1. Add a shared auth middleware for all API routes
2. Implement server-side login with session tokens (not localStorage)
3. Use environment variables for credentials + API tokens
4. Keep the changeset minimal — don't refactor while securing

#### Task: SEC-01 — Implement Server-Side Admin Authentication

| Field | Value |
|-------|-------|
| **ID** | SEC-01 |
| **Title** | Replace hardcoded admin credentials with server-side auth |
| **Description** | Create a login API endpoint (`POST /api/admin/login`) that validates credentials from env vars (`ADMIN_USERNAME`, `ADMIN_PASSWORD`), returns a session token. Store token in an HTTP-only cookie (or memory token). Remove the client-side `1234` check. All admin pages read the cookie/server session instead of `localStorage`. |
| **Files Affected** | `app/admin/page.tsx`, `app/admin/dashboard/page.tsx:754`, `app/admin/orders/page.tsx:37`, `components/admin/*`, `lib/supabase.ts`, **new** `app/api/admin/login/route.ts`, **new** `lib/auth.ts` |
| **Dependencies** | QW-09 (env vars documented) |
| **Risk** | High — admin access must continue to work |
| **Estimated Time** | 1-2 days |
| **Expected Result** | Admin login uses server-side credential verification; localStorage session is eliminated; hardcoded `1234` removed from client bundle |
| **Audit Ref** | C-01, C-04 |

**Implementation approach:**
- Create `lib/auth.ts` with `verifyAdminCredentials()`, `createSessionToken()`, `verifySessionToken()`
- Create `app/api/admin/login/route.ts` — accepts `{username, password}`, verifies against env vars, sets `admin.session` cookie
- Update admin pages to check for cookie/session instead of `localStorage.getItem("admin-authenticated")`
- Use `crypto` (built-in Node.js) for token signing — no extra dependencies
- Keep token expiry reasonable (24h, extendable)

#### Task: SEC-02 — Add API Authentication Middleware

| Field | Value |
|-------|-------|
| **ID** | SEC-02 |
| **Title** | Add bearer token authentication to all API routes |
| **Description** | Create a middleware (or helper function) that all API routes call. Check for `Authorization: Bearer <token>` header or admin session cookie. Public routes (product listing, shipping rates, payment callback) can whitelist. Admin CRUD routes require auth. |
| **Files Affected** | All `app/api/*/route.ts` files (14 routes), **new** `lib/api-auth.ts` |
| **Dependencies** | SEC-01 (auth mechanism must exist first) |
| **Risk** | **Very High** — every API route must be evaluated for public vs protected access |
| **Estimated Time** | 1-2 days |
| **Expected Result** | All admin CRUD endpoints require authentication; public endpoints remain accessible |
| **Audit Ref** | C-02 |

**Route classification:**
| Endpoint | Auth Required | Reason |
|----------|--------------|--------|
| `GET /api/products` | No | Public product listing |
| `POST /api/products` | Yes | Admin only |
| `PUT /api/products` | Yes | Admin only |
| `DELETE /api/products` | Yes | Admin only |
| `POST /api/shipping` | No | Public checkout flow |
| `POST /api/biteship-rates` | No | Public checkout flow |
| `POST /api/payment` | No | Public checkout (but needs price verification — Sprint 3) |
| `POST /api/qrisly` | No | Public checkout |
| `POST /api/contact` | No | Public contact form |
| `GET /api/orders` | Yes | Contains customer PII |
| `GET /api/orders/[id]` | Yes | Contains customer PII |
| `PUT /api/orders/[id]` | Yes | Admin only |
| `POST /api/orders/[id]/callback` | No (HMAC) | Midtrans webhook — verify signature, not bearer |
| `GET /api/analytics/revenue` | Yes | Internal data |
| `POST /api/admin/login` | No | Must be accessible without auth |

#### Task: SEC-03 — Move Biteship API Key to Environment Variable

| Field | Value |
|-------|-------|
| **ID** | SEC-03 |
| **Title** | Replace hardcoded Biteship API key with env var |
| **Description** | In `app/api/biteship-rates/route.ts:74`, replace the hardcoded JWT string with `process.env.BITESHIP_API_KEY`. The env var already exists in `.env.local` but the code ignores it. |
| **Files Affected** | `app/api/biteship-rates/route.ts:74` |
| **Dependencies** | QW-09 (env var documented) |
| **Risk** | Low (straightforward replacement) |
| **Estimated Time** | 10 min |
| **Expected Result** | Biteship key is no longer in source code; can be rotated via env var |
| **Audit Ref** | C-03 |

#### Sprint 2 Deliverables

| Deliverable | Type |
|-------------|------|
| Admin login uses server-side credential verification | Security fix |
| Admin session stored in HTTP-only cookie / server token | Security fix |
| Hardcoded `1234` removed from client bundle | Security fix |
| All API routes have auth enforcement | Security fix |
| Public endpoints correctly whitelisted | Security fix |
| Biteship API key moved to env var | Security fix |

**Estimated Time:** 2-3 days

**Definition of Done:**
- [ ] Admin cannot be accessed by typing `localStorage.setItem("admin-authenticated", "true")` in console
- [ ] Admin login form posts to server; `1234` does not appear in any client bundle
- [ ] `curl POST /api/products` without auth header returns 401
- [ ] `curl POST /api/products` with valid auth header succeeds
- [ ] Public API routes (`GET /api/products`, `POST /api/shipping`) work without auth
- [ ] Biteship API key not present in any source file (only in `.env.local`)
- [ ] `npm run build` succeeds

---

### Sprint 3: "Trust but Verify"

**Objective:** Add server-side validation to prevent fraud and ensure data integrity. Every API route must validate input and return consistent responses.

**Dependencies:** Sprint 2 (API auth must be in place before modifying API logic)

**Risk Level:** Medium-High (API response shape changes break frontend)

#### Task: VAL-01 — Add Server-Side Price Verification

| Field | Value |
|-------|-------|
| **ID** | VAL-01 |
| **Title** | Verify product prices from database at checkout |
| **Description** | In `app/api/payment/route.ts`, before creating the Midtrans transaction, look up each product's price from the `products` table. Compare client-sent prices with database prices. Reject if mismatch exceeds tolerance. |
| **Files Affected** | `app/api/payment/route.ts:88-93` |
| **Dependencies** | SEC-02, Sprint 4 (product DB consolidation) |
| **Risk** | Medium — changes financial transaction flow |
| **Estimated Time** | 2-4 hours |
| **Expected Result** | Malicious price manipulation is prevented; mismatched prices are rejected with error |
| **Audit Ref** | C-07 |

#### Task: VAL-02 — Add Input Validation with Zod

| Field | Value |
|-------|-------|
| **ID** | VAL-02 |
| **Title** | Add Zod schema validation to all API routes |
| **Description** | Install `zod`. Define schemas for each endpoint's request body. Validate before processing. Return clear validation errors. Start with payment, contact, orders, and products routes. |
| **Files Affected** | All `app/api/*/route.ts` files, **new** `lib/validation/payment.ts`, `lib/validation/product.ts`, `lib/validation/order.ts`, `lib/validation/contact.ts` |
| **Dependencies** | SEC-02 (API auth in place) |
| **Risk** | Medium — validation must match frontend expectations |
| **Estimated Time** | 4-6 hours |
| **Expected Result** | All API routes validate request bodies; invalid requests return 400 with clear error messages |
| **Audit Ref** | H-03 |

#### Task: VAL-03 — Standardize API Response Shapes

| Field | Value |
|-------|-------|
| **ID** | VAL-03 |
| **Title** | Unify all API responses to consistent envelope format |
| **Description** | Standardize all API responses to `{ success: boolean, data?: T, error?: string, details?: unknown }`. Update all 14 route handlers. Update frontend code to parse the standard shape. |
| **Files Affected** | All `app/api/*/route.ts`, all frontend pages that call APIs (`app/admin/dashboard`, `app/checkout`, `app/cart`, `app/kontak`, `app/produk`) |
| **Dependencies** | SEC-02, VAL-02 |
| **Risk** | **HIGH** — every frontend API consumer must be updated to match |
| **Estimated Time** | 4-6 hours |
| **Expected Result** | All API endpoints return consistent `{ success, data, error }` envelope |
| **Audit Ref** | H-04 |

#### Task: VAL-04 — Remove console.error from API Routes

| Field | Value |
|-------|-------|
| **ID** | VAL-04 |
| **Title** | Remove sensitive logging from production routes |
| **Description** | Replace `console.error(error)` with structured server logging that doesn't expose internals. For development, use `process.env.NODE_ENV === 'development'` guard. |
| **Files Affected** | `app/api/products/route.ts:55,60`, `app/api/payment/route.ts:109,139,158`, `app/api/orders/*` |
| **Dependencies** | None |
| **Risk** | Low (removing logs doesn't affect functionality) |
| **Estimated Time** | 30 min |
| **Expected Result** | No sensitive data leaked via console in production |
| **Audit Ref** | M-06 |

#### Task: VAL-05 — Fix Transaction ID Storage

| Field | Value |
|-------|-------|
| **ID** | VAL-05 |
| **Title** | Store correct transaction_id from Midtrans |
| **Description** | Midtrans Snap returns a `token` (redirect token), not a `transaction_id`. Store the token separately (e.g., `snap_token` column) and update `transaction_id` from Midtrans callback/notification after payment is processed. |
| **Files Affected** | `app/api/payment/route.ts:146`, `app/api/orders/[id]/callback/route.ts` |
| **Dependencies** | VAL-03 (API standardization) |
| **Risk** | Medium — changes payment data model |
| **Estimated Time** | 1-2 hours |
| **Expected Result** | Correct `transaction_id` stored after Midtrans confirms transaction |
| **Audit Ref** | M-08 |

#### Sprint 3 Deliverables

| Deliverable | Type |
|-------------|------|
| Server-side price verification at checkout | Security fix |
| Zod validation schemas for all API routes | Quality |
| Consistent API response envelope (`{success, data, error}`) | API fix |
| `console.error` removed from production code | Cleanup |
| Correct `transaction_id` stored in database | Data fix |

**Estimated Time:** 2-3 days

**Definition of Done:**
- [ ] Checkout API rejects modified prices >1% tolerance
- [ ] `POST /api/payment` with tampered cart data returns 400
- [ ] All API requests with invalid body shape return 400 + Zod error messages
- [ ] Frontend correctly handles new consistent response shape
- [ ] No `console.error` in any production API route
- [ ] `npm run build` succeeds

---

### Sprint 4: "Fix the Data"

**Objective:** Align database schema with code expectations, consolidate data sources, and ensure data integrity.

**Dependencies:** Sprint 2 (safe to modify API routes that touch DB)

**Risk Level:** Medium (DB changes need migration planning)

#### Task: DB-01 — Fix Schema Drift

| Field | Value |
|-------|-------|
| **ID** | DB-01 |
| **Title** | Align migration files with `database/schema.sql` |
| **Description** | Create migration `006_fix_schema_drift.sql` that adds the `contacts` table (exists in schema.sql but not in migrations), adds unique constraint on `customers.email`, and resolves type mismatches between `database/schema.sql` and `db/supabase_migrations/`. |
| **Files Affected** | **New** `db/supabase_migrations/006_fix_schema_drift.sql`, `database/schema.sql` (update as reference) |
| **Dependencies** | None |
| **Risk** | Medium — DB migrations can fail if data conflicts |
| **Estimated Time** | 4-6 hours |
| **Expected Result** | Database schema matches all code expectations; no more schema drift |
| **Audit Ref** | D-01, D-02, D-03 |

#### Task: DB-02 — Consolidate Product Data Sources

| Field | Value |
|-------|-------|
| **ID** | DB-02 |
| **Title** | Move public product display from static data to Supabase |
| **Description** | Currently `data/products.ts` and `data/products.json` are used for the public catalog (`app/produk/page.tsx`, `app/page.tsx`). Change these pages to fetch from `GET /api/products` (which reads from Supabase). Remove static product files once confirmed working. |
| **Files Affected** | `app/produk/page.tsx`, `app/page.tsx`, `data/products.ts`, `data/products.json`, `app/api/products/route.ts` (ensure it returns proper shape) |
| **Dependencies** | VAL-03 (API response shape), Sprint 2 (API auth — products GET should be public) |
| **Risk** | **HIGH** — changes the core product display; must test every product page |
| **Estimated Time** | 1-2 days |
| **Expected Result** | All product displays fetch from a single data source (Supabase); static files removed |
| **Audit Ref** | H-01, H-02 |

#### Task: DB-03 — Add Database Transaction Support

| Field | Value |
|-------|-------|
| **ID** | DB-03 |
| **Title** | Wrap payment flow in database transaction with rollback |
| **Description** | Currently the payment flow performs independent inserts (customer, order, order_items) with no rollback. Use Supabase RPC or a transaction function to wrap all writes. If any step fails (including Midtrans), roll back all changes. |
| **Files Affected** | `app/api/payment/route.ts`, **new** `supabase/functions/` or use Supabase RLS + transaction |
| **Dependencies** | VAL-01 (price verification), DB-01 (schema is stable) |
| **Risk** | High — changes the core payment write flow |
| **Estimated Time** | 4-6 hours |
| **Expected Result** | Payment flow is atomic; partial failures result in clean state |
| **Audit Ref** | C-08 |

#### Task: DB-04 — Add Missing Indexes

| Field | Value |
|-------|-------|
| **ID** | DB-04 |
| **Title** | Add database indexes for query performance |
| **Description** | Add indexes on `orders.created_at` (for revenue analytics) and verify existing indexes are used. |
| **Files Affected** | **New** migration file |
| **Dependencies** | DB-01 |
| **Risk** | Low |
| **Estimated Time** | 30 min |
| **Expected Result** | Analytics queries are performant; no sequential scans on orders table |
| **Audit Ref** | D-04 |

#### Sprint 4 Deliverables

| Deliverable | Type |
|-------------|------|
| Database schema matches code expectations | Migration |
| `contacts` table exists in migration | Migration |
| `customers.email` has unique constraint | Migration |
| Public pages read products from Supabase | Feature fix |
| Static `data/products.ts` and `data/products.json` removed | Cleanup |
| Payment flow is wrapped in a database transaction | Data integrity |
| Missing indexes added | Performance |

**Estimated Time:** 3-4 days

**Definition of Done:**
- [ ] Migration `006_fix_schema_drift.sql` applies cleanly to local/staging DB
- [ ] Product catalog and home page render products from Supabase
- [ ] Creating a new product in admin immediately appears on public site
- [ ] Payment flow with Midtrans failure rolls back DB writes
- [ ] Payment flow with success commits all DB writes atomically
- [ ] Revenue analytics query uses indexed columns

---

### Sprint 5: "Architecture & Maintainability"

**Objective:** Reduce the massive technical debt in the admin dashboard and consolidate overlapping implementations.

**Dependencies:** Sprint 2 (API auth must be in place for admin changes)

**Risk Level:** **HIGH** — large refactoring with significant regression risk

**Strategy:** Do NOT rewrite the admin dashboard in one shot. Instead, extract one component at a time, testing after each extraction.

#### Task: ARCH-01 — Split Admin Dashboard (Phase 1: Extract Data Fetching)

| Field | Value |
|-------|-------|
| **ID** | ARCH-01 |
| **Title** | Extract data fetching logic from admin dashboard |
| **Description** | Move all `fetch` calls and state management for orders, products, and analytics from the 1,555 LOC dashboard into custom hooks (e.g., `useOrders`, `useProducts`, `useAnalytics`). The dashboard imports hooks instead of defining logic inline. |
| **Files Affected** | `app/admin/dashboard/page.tsx`, **new** `hooks/useOrders.ts`, `hooks/useProducts.ts`, `hooks/useAnalytics.ts` |
| **Dependencies** | Sprint 2 (API auth), VAL-03 (API response shape) |
| **Risk** | Medium — pure extraction, logic unchanged |
| **Estimated Time** | 1 day |
| **Expected Result** | Dashboard is thinner (~1,000 LOC removed); data fetching is reusable |
| **Audit Ref** | H-08 |

#### Task: ARCH-02 — Split Admin Dashboard (Phase 2: Extract Components)

| Field | Value |
|-------|-------|
| **ID** | ARCH-02 |
| **Title** | Extract UI sections from admin dashboard into components |
| **Description** | Extract: `OrderList`, `ProductForm`, `ImageUpload`, `DashboardSummary`, `BiteshipShippingForm`, `InvoicePreview` into separate component files. Dashboard becomes a thin composition of these components. |
| **Files Affected** | `app/admin/dashboard/page.tsx`, **new** `components/admin/OrderList.tsx`, `components/admin/ProductForm.tsx`, `components/admin/ImageUpload.tsx`, `components/admin/DashboardSummary.tsx`, `components/admin/ShippingForm.tsx`, `components/admin/InvoicePreview.tsx` |
| **Dependencies** | ARCH-01 |
| **Risk** | High — extracting monolithic logic requires careful testing |
| **Estimated Time** | 2-3 days |
| **Expected Result** | Dashboard is ~300 LOC; each feature is in its own testable component |
| **Audit Ref** | H-08, AR-01 |

#### Task: ARCH-03 — Consolidate Product Management Interfaces

| Field | Value |
|-------|-------|
| **ID** | ARCH-03 |
| **Title** | Reduce 3 product forms to 1 canonical interface |
| **Description** | Currently there are 3 product editing UIs: inline dashboard, standalone `products/page.tsx` with modal, and `product-form/page.tsx` (disconnected from API). Keep the modal-based one (`ProductEditModal`), remove the other two. |
| **Files Affected** | `app/admin/dashboard/page.tsx` (keep inline editing), `app/admin/products/page.tsx` (keep), `app/admin/product-form/page.tsx` (remove) |
| **Dependencies** | ARCH-02 |
| **Risk** | Medium — users may rely on specific UI |
| **Estimated Time** | 1 day |
| **Expected Result** | Single product editing interface; broken standalone form removed |
| **Audit Ref** | H-13, AR-02 |

#### Task: ARCH-04 — Consolidate Shipping

| Field | Value |
|-------|-------|
| **ID** | ARCH-04 |
| **Title** | Consolidate three shipping implementations |
| **Description** | Keep `lib/flatRateShipping.ts` as the default. Remove duplicate types and `services` from the deleted `lib/shipping.ts`. Decide: is Biteship used actively? If yes, create a `lib/biteship.ts` wrapper. If not used (only half-integrated in admin), mark as dormant or scope for future. |
| **Files Affected** | `lib/flatRateShipping.ts`, `app/api/shipping/route.ts`, `app/api/biteship-rates/route.ts` |
| **Dependencies** | QW-05 (shipping.ts removed), Sprint 2 |
| **Risk** | Low-Medium (most shipping code is already isolated) |
| **Estimated Time** | 1-2 days |
| **Expected Result** | Clear shipping architecture: flat rate is default, Biteship is optional add-on |
| **Audit Ref** | AR-03 |

#### Task: ARCH-05 — Standardize Error Boundaries

| Field | Value |
|-------|-------|
| **ID** | ARCH-05 |
| **Title** | Add error boundaries to admin dashboard and checkout |
| **Description** | Wrap the 1,555 LOC dashboard and the multi-step checkout in React error boundaries. This prevents a single component crash from taking down the entire page. |
| **Files Affected** | `app/admin/dashboard/page.tsx`, `app/checkout/page.tsx`, **new** `components/ui/ErrorBoundary.tsx` |
| **Dependencies** | None |
| **Risk** | Low (additive change, no logic modification) |
| **Estimated Time** | 30 min |
| **Expected Result** | Component crashes are contained; user sees fallback UI instead of white screen |
| **Audit Ref** | R-05 |

#### Sprint 5 Deliverables

| Deliverable | Type |
|-------------|------|
| Custom hooks for orders, products, analytics | Refactor |
| 6 extracted UI components from dashboard | Refactor |
| Dashboard reduced from 1,555 LOC to ~300 | Refactor |
| Single product editing interface | Cleanup |
| Broken `product-form` page removed | Cleanup |
| Shipping architecture documented and clean | Cleanup |
| Error boundaries on admin and checkout | Resilience |

**Estimated Time:** 5-6 days

**Definition of Done:**
- [ ] Admin dashboard has <400 LOC
- [ ] All data fetching is in reusable hooks
- [ ] Each UI section is its own component file
- [ ] `product-form/page.tsx` removed
- [ ] Shipping code has no duplicate types
- [ ] Error boundary catches and displays fallback for component crashes
- [ ] `npm run build` succeeds

---

### Sprint 6: "Performance & Scale"

**Objective:** Optimize for production traffic. Improve SEO, reduce bundle size, add caching, and configure the Next.js app properly.

**Dependencies:** Sprint 5 (components extracted and easier to optimize)

**Risk Level:** Low-Medium (most changes are additive or configuration)

#### Task: PERF-01 — Reduce Client Component Footprint

| Field | Value |
|-------|-------|
| **ID** | PERF-01 |
| **Title** | Minimize `"use client"` usage across pages |
| **Description** | `app/page.tsx`, `app/cart/page.tsx`, `app/checkout/page.tsx` all use `"use client"` unnecessarily. Extract interactive sections into small client components; keep the page shell as a Server Component. |
| **Files Affected** | `app/page.tsx`, `app/cart/page.tsx`, `app/checkout/page.tsx` |
| **Dependencies** | None |
| **Risk** | Medium — moving from client to server component can break if client APIs are used |
| **Estimated Time** | 2-3 hours |
| **Expected Result** | Smaller client bundle; faster initial page load; better SEO |
| **Audit Ref** | N-06, N-07 |

#### Task: PERF-02 — Configure next.config.ts

| Field | Value |
|-------|-------|
| **ID** | PERF-02 |
| **Title** | Add image domains, headers, and rewrites to Next.js config |
| **Description** | Configure `next.config.ts` with: remote image domains (Supabase storage), security headers (CSP, HSTS, X-Frame-Options), and compression. |
| **Files Affected** | `next.config.ts` |
| **Dependencies** | None |
| **Risk** | Low (configuration change) |
| **Estimated Time** | 1 hour |
| **Expected Result** | Images from Supabase load correctly; security headers sent; SEO metadata accessible |
| **Audit Ref** | N-03 |

#### Task: PERF-03 — Optimize Product Images

| Field | Value |
|-------|-------|
| **ID** | PERF-03 |
| **Title** | Compress and deduplicate product images |
| **Description** | The largest product image is 17MB (`BALADO.jpg`). Compress all product images to <500KB. Deduplicate the images stored in both `public/images/` and `public/images/produk/`. Update references in `data/products.ts` to use consistent paths. |
| **Files Affected** | `public/images/` and `public/images/produk/` (image files), `data/products.ts` (paths) |
| **Dependencies** | DB-02 (static product data removal may make this moot) |
| **Risk** | Low (image changes only) |
| **Estimated Time** | 1-2 hours |
| **Expected Result** | All product images <500KB; no duplicates; consistent paths |
| **Audit Ref** | P-06, M-09 |

#### Task: PERF-04 — Add Rate Limiting

| Field | Value |
|-------|-------|
| **ID** | PERF-04 |
| **Title** | Add rate limiting to API routes |
| **Description** | Use a simple in-memory rate limiter (or `@upstash/ratelimit` if using Redis) on all API routes. Apply stricter limits on auth endpoints (5 req/min) and payment (10 req/min). Public endpoints can be more permissive (60 req/min). |
| **Files Affected** | **New** `lib/rate-limit.ts`, all `app/api/*/route.ts` |
| **Dependencies** | SEC-02 (API auth middleware — combine both) |
| **Risk** | Medium — rate limiting can block legitimate users if too aggressive |
| **Estimated Time** | 2-3 hours |
| **Expected Result** | API abuse is mitigated; legitimate users are not affected |
| **Audit Ref** | M-10 |

#### Task: PERF-05 — Add Dynamic Imports for Admin

| Field | Value |
|-------|-------|
| **ID** | PERF-05 |
| **Title** | Lazy-load admin dashboard sections |
| **Description** | Use `next/dynamic` to load admin dashboard tab sections (orders tab, products tab, analytics tab) on demand. This reduces initial bundle size significantly. |
| **Files Affected** | `app/admin/dashboard/page.tsx` |
| **Dependencies** | ARCH-02 (components extracted) |
| **Risk** | Low |
| **Estimated Time** | 1 hour |
| **Expected Result** | Admin dashboard loads ~70% faster by lazy-loading tab content |
| **Audit Ref** | P-04 |

#### Task: PERF-06 — Add SEO Metadata Files

| Field | Value |
|-------|-------|
| **ID** | PERF-06 |
| **Title** | Add sitemap.xml and robots.txt |
| **Description** | Create `app/sitemap.ts` and `app/robots.ts` for search engine optimization. Generate sitemap entries from the products database. |
| **Files Affected** | **New** `app/sitemap.ts`, **New** `app/robots.ts` |
| **Dependencies** | DB-02 (products in DB for dynamic sitemap) |
| **Risk** | Low |
| **Estimated Time** | 1 hour |
| **Expected Result** | Search engines can discover all product pages |
| **Audit Ref** | N-02 |

#### Sprint 6 Deliverables

| Deliverable | Type |
|-------------|------|
| Server Components where possible; smaller client bundle | Performance |
| `next.config.ts` with images, headers, rewrites | Configuration |
| All product images <500KB, deduplicated | Performance |
| Rate limiting on all API endpoints | Security |
| Lazy-loaded admin dashboard tabs | Performance |
| `sitemap.xml` and `robots.txt` | SEO |

**Estimated Time:** 2-3 days

**Definition of Done:**
- [ ] Home page and cart page are server components (with small client islands)
- [ ] Lighthouse performance score >80 (mobile)
- [ ] Security headers verified with securityheaders.com
- [ ] Rate limiting tested: 10 rapid requests to payment API returns 429
- [ ] Admin dashboard load time reduced by >50%
- [ ] `sitemap.xml` includes all product URLs
- [ ] `npm run build` succeeds

---

### Sprint 7: "Quality & Testing"

**Objective:** Build a testing safety net, fix accessibility and edge cases, and prepare for production launch.

**Dependencies:** All previous sprints (codebase should be stable)

**Risk Level:** Low (additive changes — tests don't break functionality)

#### Task: TEST-01 — Set Up Testing Infrastructure

| Field | Value |
|-------|-------|
| **ID** | TEST-01 |
| **Title** | Install and configure testing framework |
| **Description** | Install Vitest, React Testing Library, and MSW (Mock Service Worker). Create `vitest.config.ts`. Add test scripts to `package.json`. Create test helper utilities. |
| **Files Affected** | `package.json`, **New** `vitest.config.ts`, **New** `tests/setup.ts` |
| **Dependencies** | None |
| **Risk** | Low |
| **Estimated Time** | 1-2 hours |
| **Expected Result** | `npm run test` works; basic component renders in test |
| **Audit Ref** | (General — zero test coverage) |

#### Task: TEST-02 — Unit Tests for Utilities

| Field | Value |
|-------|-------|
| **ID** | TEST-02 |
| **Title** | Unit test all lib/ utilities |
| **Description** | Write tests for: `cn()`, `formatPrice()`, `sanitizePriceToInt()`, `buildOrderId()`, `calculateShippingFee()`, `parseDestinationFromAddress()`. |
| **Files Affected** | **New** `tests/lib/` |
| **Dependencies** | TEST-01 |
| **Risk** | Low |
| **Estimated Time** | 1-2 hours |
| **Expected Result** | 100% test coverage on all utility functions |
| **Audit Ref** | (General) |

#### Task: TEST-03 — Integration Tests for Payment Flow

| Field | Value |
|-------|-------|
| **ID** | TEST-03 |
| **Title** | Integration test for complete checkout + payment flow |
| **Description** | Write integration tests using MSW to mock Supabase and Midtrans. Test: successful checkout, price mismatch rejection, missing fields, Midtrans callback. |
| **Files Affected** | **New** `tests/api/payment.test.ts`, `tests/api/callback.test.ts` |
| **Dependencies** | TEST-01, Sprint 3 (API response shapes stable) |
| **Risk** | Low |
| **Estimated Time** | 4-6 hours |
| **Expected Result** | Payment flow has automated test coverage for all scenarios |
| **Audit Ref** | (General) |

#### Task: TEST-04 — Integration Tests for Admin API

| Field | Value |
|-------|-------|
| **ID** | TEST-04 |
| **Title** | Integration tests for admin CRUD endpoints |
| **Description** | Test product CRUD with auth, without auth (401), order management, status transitions. |
| **Files Affected** | **New** `tests/api/products.test.ts`, `tests/api/orders.test.ts` |
| **Dependencies** | TEST-01, Sprint 2 (auth in place) |
| **Risk** | Low |
| **Estimated Time** | 4-6 hours |
| **Expected Result** | All admin API routes have auth + validation test coverage |
| **Audit Ref** | (General) |

#### Task: TEST-05 — E2E Test for Checkout Flow

| Field | Value |
|-------|-------|
| **ID** | TEST-05 |
| **Title** | End-to-end test for critical user path |
| **Description** | Using Playwright or Cypress: browse products → add to cart → checkout → payment redirect → success page. |
| **Files Affected** | **New** `e2e/checkout.spec.ts` |
| **Dependencies** | TEST-01 |
| **Risk** | Low |
| **Estimated Time** | 4-6 hours |
| **Expected Result** | Critical user path is automated; CI blocks regression |
| **Audit Ref** | (General) |

#### Task: QLT-01 — Fix Accessibility Issues

| Field | Value |
|-------|-------|
| **ID** | QLT-01 |
| **Title** | Address accessibility findings |
| **Description** | Fix: color contrast (brown on cream), consistent focus indicators, `aria-live` for toasts, keyboard navigation for drag-drop, form label associations, `aria-controls` for mobile menu. |
| **Files Affected** | `app/globals.css`, `components/ui/Toast.tsx`, `components/ui/Button.tsx`, `app/admin/dashboard/page.tsx`, `components/layout/Header.tsx`, `app/checkout/page.tsx` |
| **Dependencies** | None |
| **Risk** | Low |
| **Estimated Time** | 2-3 hours |
| **Expected Result** | WCAG AA compliance; screen readers can use all major features |
| **Audit Ref** | X-02, X-03, X-04, X-05, X-06, X-07 |

#### Task: QLT-02 — Fix Edge Cases

| Field | Value |
|-------|-------|
| **ID** | QLT-02 |
| **Title** | Fix business logic edge cases |
| **Description** | Better email validation (longer TLDs), address parsing with word boundary check, carousel pause on hover, better order ID generation (collision-resistant), validate allowed order status transitions, idempotency key for payment. |
| **Files Affected** | `app/checkout/page.tsx:70`, `lib/flatRateShipping.ts:17-33`, `app/page.tsx:25-29`, `lib/order.ts:4`, `app/api/orders/[id]/route.ts:71`, `app/api/payment/route.ts` |
| **Dependencies** | None |
| **Risk** | Low-Medium |
| **Estimated Time** | 3-4 hours |
| **Expected Result** | Edge cases handled gracefully; no silent failures |
| **Audit Ref** | M-13, M-14, L-02, B-05, A-06, A-03 |

#### Sprint 7 Deliverables

| Deliverable | Type |
|-------------|------|
| Testing framework installed and configured | Infrastructure |
| Unit tests for all lib/ utilities | Testing |
| Integration tests for payment + admin API | Testing |
| E2E test for critical user path | Testing |
| WCAG AA compliance | Accessibility |
| Edge cases handled (email, address, carousel, order ID, status transitions) | Quality |
| Idempotency key for payment | Reliability |

**Estimated Time:** 5-7 days

**Definition of Done:**
- [ ] `npm run test` passes with >80% code coverage
- [ ] `npm run test:e2e` passes locally
- [ ] Color contrast ratio >= 4.5:1 for all text
- [ ] Screen reader can announce toast notifications
- [ ] Drag-and-drop image reordering works with keyboard
- [ ] Duplicate payment request with same idempotency key is rejected
- [ ] All order status transitions are validated server-side

---

## Dependency Map

```
                        ┌─────────────────────────────────────────────┐
                        │              SPRINT 0                       │
                        │         Preparation & Tooling               │
                        └─────────────────────────────────────────────┘
                                          │
                                          ▼
                        ┌─────────────────────────────────────────────┐
                        │              SPRINT 1                       │
                        │      Quick Wins & Broken Fixes              │
                        │  ┌───────┬───────┬───────┬───────┬──────┐   │
                        │  │QW-01  │QW-02  │QW-03  │QW-04  │QW-05│   │
                        │  │QW-06  │QW-07  │QW-08  │QW-09  │QW-10│   │
                        │  └───────┴───────┴───────┴───────┴──────┘   │
                        └─────────────────────────────────────────────┘
                                          │
                                          ▼
                        ┌─────────────────────────────────────────────┐
                        │              SPRINT 2                       │
                        │        Security & Authentication            │  ◄── BLOCKING
                        │  ┌──────────┬──────────┬──────────┐         │
                        │  │ SEC-01   │ SEC-02   │ SEC-03    │         │
                        │  │ (Auth)   │ (API)    │ (Key)     │         │
                        │  └──────────┴──────────┴──────────┘         │
                        └─────────────────────────────────────────────┘
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    │                     │                     │
                    ▼                     ▼                     ▼
┌──────────────────────────────┐ ┌──────────────────┐ ┌───────────────────┐
│        SPRINT 3              │ │    SPRINT 4      │ │   SPRINT 5        │
│  Validation & Integrity      │ │  Database Fixes  │ │ Architecture      │
│                              │ │                  │ │                   │
│ VAL-01: Price verification ──┼─│► DB-02: Products │ │ ARCH-01: Hooks     │
│ VAL-02: Zod schemas          │ │  DB-03: Tx rollbk│ │ ARCH-02: Components│
│ VAL-03: API response shapes  │ │  DB-01: Drift    │ │ ARCH-03: Products  │
│ VAL-04: Remove console.error │ │  DB-04: Indexes  │ │ ARCH-04: Shipping  │
│ VAL-05: Transaction ID       │ │                  │ │ ARCH-05: Err bound │
│                              │ │                  │ │                   │
│ ◄── Depends on SEC-02        │ │ ◄── Depends on   │ │ ◄── Depends on    │
│                              │ │     SEC-02,      │ │      SEC-02       │
│                              │ │     VAL-03       │ │                   │
└──────────────────────────────┘ └──────────────────┘ └───────────────────┘
                    │                     │                     │
                    └─────────────────────┼─────────────────────┘
                                          │
                                          ▼
                        ┌─────────────────────────────────────────────┐
                        │              SPRINT 6                       │
                        │      Performance & Optimization             │
                        │  PERF-01 PERF-02 PERF-03                    │
                        │  PERF-04 PERF-05 PERF-06                    │
                        └─────────────────────────────────────────────┘
                                          │
                                          ▼
                        ┌─────────────────────────────────────────────┐
                        │              SPRINT 7                       │
                        │         Testing & Quality                   │
                        │  TEST-01→05, QLT-01, QLT-02                │
                        └─────────────────────────────────────────────┘
```

### Critical Path

The **critical path** (longest dependent chain) is:

```
Sprint 1 (2.5h) → Sprint 2 (3d) → Sprint 3 (3d) → Sprint 4 (4d) → Sprint 6 (3d) → Sprint 7 (6d)
```

**Total critical path duration:** ~19 working days

### Parallelizable Work

| Work Package | Can Run With | Condition |
|-------------|-------------|-----------|
| Sprint 4 (DB) | Sprint 5 (Architecture) | Both depend on Sprint 2; independent of each other |
| Sprint 4 (DB) | Sprint 3 (Validation) | Partial — DB-02 depends on VAL-03 |
| Sprint 6 (Performance) | Sprint 7 (Testing) | Independent |
| QW-01 through QW-10 | Each other | All independent within Sprint 1 |

---

## Risk Matrix

### Likelihood vs Impact Matrix

```
                    │   LOW Impact    │   MED Impact    │   HIGH Impact
────────────────────┼─────────────────┼─────────────────┼─────────────────
 HIGH Likelihood    │                 │                 │
                    │ QW-07 (commented│ QW-02 (order    │ SEC-02 (API auth)
                    │ code removal)   │ list fix)       │ — breaking API changes
                    │ QW-06 (text fix)│ QW-03 (nav fix) │ ARCH-02 (dashboard split)
                    │ QW-08 (duplicate│                 │ ARCH-03 (product forms)
                    │ function)       │                 │ DB-02 (product data source)
                    │ QW-10 (magic    │                 │
                    │ numbers)        │                 │
                    │                 │                 │
────────────────────┼─────────────────┼─────────────────┼─────────────────
 MED Likelihood     │                 │                 │
                    │ M-05 (cn util)  │ VAL-04 (console)│ SEC-01 (admin auth)
                    │ L-05 (keys)     │ PERF-04 (rate   )│ — login must work
                    │ P-03 (chart)    │ limit)          │ DB-03 (transaction)
                    │                 │ QLT-01 (a11y)   │ VAL-01 (price verify)
                    │                 │                 │
────────────────────┼─────────────────┼─────────────────┼─────────────────
 LOW Likelihood     │                 │                 │
                    │ PERF-06 (sitemap)│ DB-04 (indexes) │ QW-04 (localStorage)
                    │ P-02 (batch)     │                 │ race condition
                    │ TEST-01 (setup)  │                 │
                    │ P-01 (images)    │                 │
```

### Risk Register (Top 10)

| # | Risk | Sprint | Likelihood | Impact | Mitigation |
|---|------|--------|-----------|--------|------------|
| 1 | Admin auth breaks — no one can log in | Sprint 2 | Medium | Critical | Test on staging first; keep old `1234` code behind feature flag during transition |
| 2 | API auth breaks public endpoints | Sprint 2 | High | Critical | Whitelist all public routes explicitly; write automated tests before deploying |
| 3 | Product data migration breaks public pages | Sprint 4 | Medium | High | Keep static fallback; A/B test; deploy to staging first |
| 4 | Transaction rollback introduces new bugs | Sprint 4 | Medium | High | Unit test the transaction function extensively; manual verification |
| 5 | Dashboard extraction causes regression | Sprint 5 | High | High | Extract one component at a time; test after each extraction; feature flags |
| 6 | API response shape change breaks frontend | Sprint 3 | High | High | Update all frontend consumers in same PR; run E2E before merge |
| 7 | Rate limiting blocks legitimate users | Sprint 6 | Medium | Medium | Conservative limits initially; monitor; make limits configurable via env |
| 8 | DB migration fails on existing data | Sprint 4 | Low | High | Run migration on staging copy first; have rollback SQL ready |
| 9 | Missing package install breaks build | Sprint 1 | Low | Medium | `npm install` locally and verify build before PR |
| 10 | localStorage race condition fix incomplete | Sprint 1 | Medium | Medium | Test on slow network (throttled); verify success page renders |

---

## Priority Matrix

### ROI Score (Business Value + Security + Maintainability — Implementation Cost)

Scored 1-5 for each dimension.

| Item | Business Value | Security | Maintainability | Cost (inverse) | **ROI** |
|------|:------------:|:--------:|:--------------:|:-------------:|:-------:|
| **QW-02**: Fix order list | 5 | 1 | 1 | 5 | **12** |
| **SEC-01**: Admin auth | 3 | 5 | 3 | 2 | **13** |
| **SEC-02**: API auth | 3 | 5 | 3 | 2 | **13** |
| **QW-01**: Missing deps | 5 | 2 | 1 | 5 | **13** |
| **QW-05**: Dead code | 1 | 1 | 4 | 5 | **11** |
| **VAL-01**: Price verify | 3 | 5 | 2 | 3 | **13** |
| **VAL-03**: API shapes | 2 | 1 | 5 | 3 | **11** |
| **DB-02**: Product source | 4 | 1 | 4 | 2 | **11** |
| **DB-03**: Transaction | 2 | 3 | 3 | 2 | **10** |
| **ARCH-02**: Dashboard split | 1 | 1 | 5 | 1 | **8** |
| **ARCH-01**: Hooks | 1 | 1 | 4 | 3 | **9** |
| **PERF-01**: Server components | 2 | 1 | 2 | 3 | **8** |
| **TEST-03**: Payment tests | 3 | 3 | 2 | 2 | **10** |
| **SEC-03**: Biteship key | 1 | 5 | 1 | 5 | **12** |
| **QW-04**: localStorage race | 4 | 1 | 1 | 4 | **10** |
| **QW-03**: Nav fix | 3 | 1 | 1 | 4 | **9** |
| **VAL-02**: Zod validation | 2 | 4 | 4 | 2 | **12** |
| **PERF-04**: Rate limit | 2 | 4 | 1 | 3 | **10** |
| **QLT-01**: Accessibility | 1 | 1 | 3 | 3 | **8** |
| **QW-06**: Button text | 1 | 1 | 1 | 5 | **8** |

### Top 10 by ROI

| Rank | Item | ROI | Sprint |
|------|------|:---:|:------:|
| 1 | SEC-01: Admin authentication | 13 | Sprint 2 |
| 2 | SEC-02: API authentication | 13 | Sprint 2 |
| 3 | QW-01: Missing dependencies | 13 | Sprint 1 |
| 4 | VAL-01: Server-side price verification | 13 | Sprint 3 |
| 5 | QW-02: Fix admin order list | 12 | Sprint 1 |
| 6 | SEC-03: Biteship API key to env | 12 | Sprint 2 |
| 7 | VAL-02: Zod input validation | 12 | Sprint 3 |
| 8 | QW-05: Remove dead code | 11 | Sprint 1 |
| 9 | VAL-03: Standardize API responses | 11 | Sprint 3 |
| 10 | DB-02: Single product data source | 11 | Sprint 4 |

---

## Engineering Strategy

### Architectural Principles (Post-Refactoring)

1. **Separation of Concerns**
   - `lib/` — Pure utilities (no React, no Next.js)
   - `hooks/` — React hooks for data fetching and state
   - `components/` — UI components with single responsibility
   - `app/api/` — Route handlers (thin: validate → call service → respond)
   - **New** `services/` — Business logic layer (between API and DB)

2. **Data Flow**
   ```
   Client → Route Handler → Validation (Zod) → Service Layer → Supabase
                                                      ↓
                                               External API (Midtrans)
   ```

3. **Authentication Flow** (Post-Sprint 2)
   ```
   Admin Login → POST /api/admin/login → Verify env credentials → Set HTTP-only cookie
   API Request → Cookie/Bearer → verifySession() → Route Handler
   ```

4. **API Response Standard** (Post-Sprint 3)
   ```typescript
   // Success
   { success: true, data: T }
   // Error
   { success: false, error: string, details?: unknown }
   // List
   { success: true, data: T[], total?: number }
   ```

5. **Database Access Pattern** (Post-Sprint 4)
   - One canonical `lib/supabase.ts` for server (service_role)
   - One canonical `lib/supabase-client.ts` for client (anon key)
   - Never use Supabase client directly from React components — always through API routes
   - Use Supabase RPC/transactions for multi-step writes

### Refactoring Order

```
1. Extract data fetching    → hooks/ (ARCH-01)
2. Extract UI sections      → components/admin/ (ARCH-02)
3. Extract business logic   → services/ (New directory)
4. Consolidate forms        → Remove product-form page (ARCH-03)
5. Consolidate shipping     → Remove duplicate types (ARCH-04)
6. Add error boundaries     → components/ui/ErrorBoundary (ARCH-05)
7. Convert to Server Components → Where possible (PERF-01)
```

### Commit Strategy

| Sprint | Commit Pattern |
|--------|---------------|
| Sprint 1 | 1 commit per QW task (10 commits) or squash into 1 PR |
| Sprint 2 | 3 commits: admin auth → API auth middleware → Biteship key |
| Sprint 3 | 1 commit per VAL task |
| Sprint 4 | 1 commit per DB task |
| Sprint 5 | 1 commit per ARCH task (each extraction is atomic) |
| Sprint 6 | 1 commit per PERF task |
| Sprint 7 | 1 commit per TEST task + 1 for QLT |

Each commit must: build, lint, and (after Sprint 7) pass tests.

---

## Testing Strategy

### Per-Sprint Testing

| Sprint | Unit Tests | Integration Tests | Regression Tests | Manual Tests |
|--------|-----------|------------------|-----------------|--------------|
| Sprint 1 | For new utility functions | None | Verify admin order list renders | Check all admin pages load |
| Sprint 2 | Auth helper functions | Login flow, API auth middleware | All admin pages still accessible | Test login with creds, verify 401 on curl |
| Sprint 3 | Zod validation schemas | Payment flow with price check | Full checkout flow | Try price manipulation in DevTools |
| Sprint 4 | Product data layer | Product CRUD via API | Public product pages match admin | Create product in admin, verify on public |
| Sprint 5 | Extracted hooks | Component rendering | Dashboard functionality | Tab navigation, CRUD, image upload |
| Sprint 6 | Rate limiter | Image loading, API timing | Bundle size check | Lighthouse audit |
| Sprint 7 | All lib/ functions | All API routes | Full E2E checkout | Screen reader, keyboard nav |

### Test Infrastructure

| Tool | Purpose | When |
|------|---------|------|
| Vitest | Unit + integration tests | Sprint 7 |
| React Testing Library | Component tests | Sprint 7 |
| MSW | API mocking | Sprint 7 |
| Playwright | E2E tests | Sprint 7 |

### Testing Priorities

1. **Critical path:** Checkout + Payment + Callback (Sprint 7)
2. **Admin API:** All CRUD with auth (Sprint 7)
3. **Utilities:** lib/* functions (Sprint 7)
4. **Edge cases:** Price mismatch, invalid auth, missing fields (Sprint 7)

---

## Deployment Strategy

### Environment Strategy

| Environment | URL | Database | Payment | Purpose |
|-------------|-----|----------|---------|---------|
| **Development** | `localhost:3000` | Local Supabase (or dev project) | Midtrans Sandbox | Daily development |
| **Testing** | PR preview (Vercel) | Dev Supabase project | Midtrans Sandbox | PR review |
| **Staging** | `staging.jamurkrispi.com` | Staging Supabase | Midtrans Sandbox | Pre-release verification |
| **Production** | `jamurkrispi.com` | Production Supabase | Midtrans Production | Live |

### Branch Strategy

```
main (protected)
  └── develop
       └── feature/SPRINT-1-*
       └── feature/SPRINT-2-*
       └── ...
```

- Each sprint is a feature branch off `develop`
- Each task within a sprint is a commit on that branch
- Merge `develop` → `main` at sprint end (after testing)
- Hotfix branches directly from `main` for critical bugs

### Rollback Strategy

| Scenario | Rollback Action | Data Impact |
|----------|----------------|-------------|
| Auth broken | Revert Sprint 2 commits | None (all server-side) |
| API responses changed | Revert VAL-03 commit | Frontend must also revert |
| DB migration failed | Run rollback SQL | Data loss possible — backup first |
| Dashboard extraction bug | Revert specific ARCH commit | None |
| Rate limiting too strict | Adjust config, no rollback needed | None |

**Golden rule:** Never deploy a migration that can't be rolled back. Always create `DOWN` migration SQL.

### Pre-Launch Checklist

- [ ] Sprint 1-7 all complete
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes
- [ ] `npm run test` passes (>80% coverage)
- [ ] `npm run test:e2e` passes
- [ ] Lighthouse score >80 (mobile)
- [ ] Security headers verified
- [ ] Midtrans switched from Sandbox to Production
- [ ] `.env.production` configured
- [ ] Database migration applied
- [ ] Static product data no longer used
- [ ] All console.error removed from API routes
- [ ] Rate limiting active
- [ ] Admin auth working with production credentials

---

## Definition of Done (Per Sprint)

### Sprint 1
- [ ] All QW tasks implemented
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes
- [ ] Admin dashboard displays orders
- [ ] No dead code files remain
- [ ] `.env.example` is complete

### Sprint 2
- [ ] Admin login uses server-side verification
- [ ] `1234` does not appear in any client bundle
- [ ] All API routes enforce authentication
- [ ] Public endpoints work without auth
- [ ] Biteship API key not in source code
- [ ] `npm run build` succeeds

### Sprint 3
- [ ] Price tampering returns 400 error
- [ ] All API routes validate input with Zod
- [ ] Consistent `{success, data, error}` response format
- [ ] No `console.error` in production API code
- [ ] Correct `transaction_id` stored
- [ ] `npm run build` succeeds

### Sprint 4
- [ ] Schema drift eliminated (migrations match schema.sql)
- [ ] Public products page reads from Supabase
- [ ] Static product data files removed
- [ ] Payment flow uses database transaction
- [ ] `npm run build` succeeds

### Sprint 5
- [ ] Dashboard <400 LOC
- [ ] Data fetching in custom hooks
- [ ] UI sections in separate component files
- [ ] Single product editing interface
- [ ] Shipping architecture documented
- [ ] Error boundaries on admin + checkout
- [ ] `npm run build` succeeds

### Sprint 6
- [ ] Home/cart/checkout pages use Server Components where possible
- [ ] `next.config.ts` configured
- [ ] Images optimized (<500KB each)
- [ ] Rate limiting active on all API routes
- [ ] Admin dashboard tabs lazy-loaded
- [ ] `sitemap.xml` and `robots.txt` added
- [ ] Lighthouse >80 mobile
- [ ] `npm run build` succeeds

### Sprint 7
- [ ] `npm run test` passes
- [ ] >80% code coverage
- [ ] E2E test for checkout passes
- [ ] WCAG AA compliance verified
- [ ] All edge cases handled
- [ ] Idempotency key verified
- [ ] `npm run build` succeeds

---

## Final Recommendation

### Do First (Sprint 1 — This Week)

1. **QW-01: Add missing packages** — 2 minutes, unblocks production builds
2. **QW-02: Fix admin order list** — 15 minutes, admin can finally see orders
3. **QW-03: Fix orders navigation** — 30 minutes, stop broken navigation
4. **QW-04: Fix localStorage race** — 30 minutes, prevent lost order data
5. **QW-05: Remove dead code** — 20 minutes, clean up confusion

All Sprint 1 tasks are safe, isolated, and take a single afternoon.

### Do Second (Sprint 2 — Next Week)

6. **SEC-01: Admin authentication** — The #1 security priority
7. **SEC-02: API authentication** — Cannot safely modify APIs without this
8. **SEC-03: Biteship key to env** — 10-minute fix with high impact

### Do Third (Sprint 3 — Following Week)

9. **VAL-01: Price verification** — Prevent fraud
10. **VAL-02: Zod validation** — Every API route needs this
11. **VAL-03: Standardize responses** — Fixes the root cause of many frontend bugs

### Defer (Can Wait 3+ Months)

| Item | Reason |
|------|--------|
| PERF-01: Server components | Nice-to-have; current app is functional |
| QLT-01: Full accessibility audit | Legal risk is low for small Indonesian e-commerce |
| PERF-06: Sitemap/SEO | Only matters after launch |
| ARCH-01/02: Dashboard extraction | Large effort; dashboard works (post Sprint 1) |
| TEST-01/02/03: Full test suite | Add before significant new feature work, but not blocking launch |

### Do Not Do (Remove From Backlog)

| Item | Reason |
|------|--------|
| Raja Ongkir integration (`app/api/shipping/rajaOngkir.ts`) | Dead code — remove in Sprint 1 |
| `AdminGuard.tsx` | Empty file — remove in Sprint 1 |
| `ThemeProvider`/`ThemeToggle` | Never used; remove in Sprint 1 |
| `product-form/page.tsx` | Duplicate, disconnected from API; remove in Sprint 5 |
| Chart.js integration (commented out) | Not needed; remove in Sprint 1 |
| `hooks/` directory (empty) | Remove in Sprint 1 |
| `app/api/orders/[id]/receipt/` (empty directory) | Remove in Sprint 1 |

### Critical Warning

**Do NOT skip Sprint 2.** Without server-side authentication and API authorization:

1. Anyone who finds the admin URL can log in (`1234`)
2. Anyone who finds the API endpoints can read/write all data
3. The Biteship API key is in the public source code
4. A malicious actor can delete all products, read all customer orders, and change order statuses

The entire refactoring effort (Sprints 3-7) depends on a secure foundation. Build the foundation first.

---

*End of Implementation Roadmap — Phase 2 complete.*
