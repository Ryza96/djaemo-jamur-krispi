# Admin Authentication Architecture Investigation

> **Status**: Read-only investigation — no code changes  
> **Date**: 2026-07-03  
> **Scope**: How admin authentication works today, what infrastructure exists, and what migration paths are possible.

---

## Table of Contents

1. [Current Authentication Implementation](#1-current-authentication-implementation)
2. [Existing Infrastructure](#2-existing-infrastructure)
3. [Admin Module API Authorization Analysis](#3-admin-module-api-authorization-analysis)
4. [Database Schema for Auth](#4-database-schema-for-auth)
5. [Security Gap Analysis](#5-security-gap-analysis)
6. [Migration Path Options](#6-migration-path-options)
7. [Recommendation Inputs](#7-recommendation-inputs)

---

## 1. Current Authentication Implementation

### 1.1 Login Page (`app/admin/page.tsx`)

**Hardcoded credentials in client bundle:**

```typescript
const ADMIN_USERNAME = "1234";
const ADMIN_PASSWORD = "1234";
```

These are embedded directly in the source code with no environment variable indirection. Any user can view them via browser DevTools.

**Authentication mechanism:** `localStorage` boolean flag.

```typescript
localStorage.setItem("admin-authenticated", "true");
```

The entire auth flow is:
1. User submits form with username/password
2. Client-side comparison against hardcoded strings
3. On match, set `localStorage` key to `"true"`
4. React re-renders, `useEffect` detects auth and redirects via `router.push()`

**Sign-out:** Removes the `localStorage` key and redirects.

```typescript
localStorage.removeItem("admin-authenticated");
router.push("/admin");
```

**UX detail:** The form shows an error message revealing the hardcoded credentials:
```
Username atau password salah. Gunakan 1234 / 1234 untuk pengujian sementara.
```

### 1.2 Auth Guard (`app/admin/layout.tsx`)

**Client-side redirect guard using `useEffect`:**

```typescript
useEffect(() => {
  if (!isCheckingAuth && !isAuthenticated) {
    router.push("/admin");
  }
}, [isAuthenticated, isCheckingAuth, router]);
```

This guard:
- Reads `localStorage` on mount
- Renders nothing (`return null`) if not authenticated
- Only wraps children when authenticated

**Vulnerability:** This is purely client-side. Any of the following bypass it:
- Direct navigation to `/admin/dashboard` in a fresh session (flash of redirect, visible but not secure)
- Server-side API calls with `curl` or Postman (no guard on API routes at all)
- Disabling JavaScript in the browser renders the guard inert

### 1.3 What's Missing

| Feature | Status |
|---------|--------|
| Server-side session | Not implemented |
| HTTP-only cookie | Not implemented |
| Middleware auth check | No `middleware.ts` exists |
| API route guard | No auth check on any route |
| Database-backed credentials | Not implemented |
| Password hashing | Not implemented |
| Rate limiting | Not implemented |
| CSRF protection | Not implemented |
| Audit trail of admin actions | Not implemented (audit_logs table has no `performed_by`) |
| MFA / 2FA | Not implemented |

---

## 2. Existing Infrastructure

### 2.1 Supabase Clients

**Server-side (`lib/supabase.ts`):**
```typescript
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
```
Uses `SUPABASE_SERVICE_ROLE_KEY` — bypasses all RLS. Used by all repositories.

**Client-side (`lib/supabase-client.ts`):**
```typescript
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
```
Uses `NEXT_PUBLIC_SUPABASE_ANON_KEY` — respects RLS. Currently **not used anywhere** in the codebase. No UI component calls it.

### 2.2 Supabase Auth Dependencies

**Package:** `@supabase/supabase-js` ^2.38.0

**Not installed:** `@supabase/ssr` — the official server-side rendering helper for Next.js App Router.

**Badge:** There are **zero** Supabase Auth API calls anywhere in the codebase:
- No `supabase.auth.signIn()` / `signUp()` / `signOut()`
- No `supabase.auth.getSession()` / `getUser()`
- No `supabase.auth.onAuthStateChange()`
- No `createServerClient()` or `createBrowserClient()`
- No `cookies()` import for cookie-based sessions

### 2.3 Environment Variables

**Defined in `.env.example` (planned but unused in code):**
```
NEXT_PUBLIC_ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-admin-password
ADMIN_API_TOKEN=your-secure-api-token-here
```

**Confirmed:** `grep` across all `.ts` and `.tsx` files shows **zero references** to `process.env.ADMIN_PASSWORD`, `process.env.NEXT_PUBLIC_ADMIN_USERNAME`, or `process.env.ADMIN_API_TOKEN`.

These env vars were planned but never wired into the actual authentication logic.

**Available Supabase auth env vars (both in `.env.local`):**
```
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### 2.4 Row-Level Security (RLS) Policies

Only one RLS policy exists in the entire project:

| Table | Policy | Action | Effect |
|-------|--------|--------|--------|
| `products` | `public_select_products` | `FOR SELECT` | Public can read products |
| `customers` | None | — | Only service role can access |
| `orders` | None | — | Only service role can access |
| `order_items` | None | — | Only service role can access |
| `audit_logs` | None | — | Only service role can access |
| `contacts` | None | — | Only service role can access |

No RLS policies have been added after `001_init_schema.sql`. All migrations 002–010 only add columns and indexes, never policies.

### 2.5 Middleware

**Not found.** There is no `middleware.ts` at the project root, `app/`, or anywhere else. A glob search for `**/middleware*` returned zero results.

---

## 3. Admin Module API Authorization Analysis

All admin API routes were checked for auth validation. **None have any.**

| Route | Methods | Auth | Notes |
|-------|---------|------|-------|
| `/api/admin/orders` | GET | ❌ None | Lists all orders with filters |
| `/api/admin/orders/[id]/actions` | POST | ❌ None | Fulfillment state transitions |
| `/api/admin/orders/[id]/notes` | PUT | ❌ None | Updates admin notes |
| `/api/admin/orders/[id]/tracking` | GET | ❌ None | Biteship tracking data |
| `/api/admin/orders/[id]/receipt` | GET | ❌ None | PDF receipt download |
| `/api/admin/export/orders` | GET | ❌ None | CSV export |
| `/api/admin/shipments` | POST | ❌ None | Create Biteship shipment |
| `/api/products` | ALL | ❌ None | Full CRUD on products |
| `/api/payment` | POST | ❌ None | Payment initiation (price manipulation vuln) |
| `/api/payment/create` | POST | ❌ None | Payment creation |
| `/api/contact` | POST | ❌ None | Contact form |

**Every route is wide open.** Anyone who discovers these endpoints can:
- List all orders with customer details
- Change fulfillment status
- Create shipments via Biteship
- Modify product data (prices, descriptions, images)
- Access all payment data
- Download customer data as CSV

### 3.1 What Protection IS Present (Validation Only)

Some routes have Zod schema validation for **data shape**, but not **authorization**:

```
lib/validation/admin-orders.ts:
  - paginatedOrdersSchema     (filters, paging)
  - adminActionSchema         (action type, waybill_id)
  - adminNotesSchema          (admin_notes text)
```

These validate the request body — any valid request from any source is processed.

---

## 4. Database Schema for Auth

### 4.1 No Auth Tables Exist

There are no tables in the schema for:
- `auth.users` — Supabase Auth creates this automatically, but the project never references it
- `profiles` — No profile table links business data to auth users
- `admin_users` — No admin-specific user table
- `sessions` — No session management table

### 4.2 No Auth Column in Related Tables

| Table | Has user/auth column? |
|-------|----------------------|
| `orders` | ❌ No `admin_id` or `performed_by` |
| `audit_logs` | ❌ No `performed_by` or `user_id` |
| `customers` | ❌ No `auth_user_id` |
| `order_items` | ❌ Not applicable |
| `products` | ❌ Not applicable |

**Correction:** Earlier reports stated `audit_logs` has a `performed_by` text column. Investigation of migration `007_reconcile_schema.sql` (the authoritative DDL) shows:

```sql
CREATE TABLE IF NOT EXISTS audit_logs (
  id          BIGSERIAL PRIMARY KEY,
  order_id    VARCHAR(255) NOT NULL,
  event       VARCHAR(50)  NOT NULL,
  from_status VARCHAR(50),
  to_status   VARCHAR(50)  NOT NULL,
  metadata    JSONB,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

No `performed_by` column — admin actions cannot be attributed to any individual.

### 4.3 Customers Table

```sql
CREATE TABLE IF NOT EXISTS customers (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text,
  email      text,
  phone      text,
  address    text,
  created_at timestamptz default now()
);
```

No `auth_user_id` or `password` column. The `customers` table is for order metadata, not authentication.

---

## 5. Security Gap Analysis

### 5.1 Critical Gaps

| # | Gap | Severity | Impact |
|---|-----|----------|--------|
| G-01 | Hardcoded credentials in client bundle | **CRITICAL** | Anyone can view/decode credentials |
| G-02 | No server-side auth on any API route | **CRITICAL** | All admin APIs are public |
| G-03 | No middleware protection | **CRITICAL** | No request-level auth check |
| G-04 | Auth is purely client-side localStorage | **CRITICAL** | Trivially bypassable |

### 5.2 High Gaps

| # | Gap | Severity | Impact |
|---|-----|----------|--------|
| G-05 | No audit trail for admin actions | **HIGH** | Cannot attribute changes to a person |
| G-06 | No session expiry | **HIGH** | localStorage persists until cleared |
| G-07 | No HTTPS enforcement in config | **HIGH** | Credentials in transit on HTTP |
| G-08 | No rate limiting on login | **HIGH** | Brute-force attack vector |

### 5.3 Medium Gaps

| # | Gap | Severity | Impact |
|---|-----|----------|--------|
| G-09 | Password stored as plaintext | **MEDIUM** | (It's hardcoded, not stored) |
| G-10 | No password policy | **MEDIUM** | 1234 is trivially guessable |
| G-11 | No CSRF tokens | **MEDIUM** | Anti-pattern but limited scope |
| G-12 | No input sanitization on admin forms | **MEDIUM** | Possible stored XSS in admin notes |
| G-13 | Admin login hints reveal credentials | **LOW** | "Use 1234/1234" message |

### 5.4 Attack Vectors

| Vector | Feasibility | Impact |
|--------|-------------|--------|
| View credentials via DevTools | **Trivial** | Full admin access |
| SQL injection via unprotected API | **Possible** | Data breach |
| Direct API calls to admin endpoints | **Trivial** | Order manipulation |
| XSS → localStorage read → session theft | **Possible** | Session hijack |
| Brute force login (no rate limit) | **Easy** | Credential guessing |
| CSRF on authenticated session | **Easy** | Unauthorized actions |

---

## 6. Migration Path Options

### 6.1 Option A: Supabase Auth (Recommended)

**Approach:** Use Supabase's built-in email/OTP or email/password auth with `@supabase/ssr`.

**Required dependencies to install:**
- `@supabase/ssr` — for server-side auth with Next.js App Router
- (Already have `@supabase/supabase-js` ^2.38.0)

**Implementation steps:**
1. Create `lib/supabase-server.ts` using `createServerClient()` from `@supabase/ssr`
2. Create `lib/supabase-browser.ts` using `createBrowserClient()` from `@supabase/ssr`
3. Enable Supabase Auth in Supabase Dashboard (email/password or magic link)
4. Create `middleware.ts` to protect `/admin/*` routes via cookie session check
5. Replace login page with Supabase Auth UI or custom form calling `supabase.auth.signInWithPassword()`
6. Create a `profiles` table with `id (uuid references auth.users.id)`, `role (text)`, `name (text)`
7. Add RLS policies on admin tables to restrict to authenticated admins
8. Add `performed_by` column to `audit_logs` referencing `profiles.id`
9. Add auth middleware to all admin API routes

**Pros:**
- Industry-standard auth flow
- Automatic session management with HTTP-only cookies
- Built-in session expiry and refresh
- Supabase manages password hashing
- RLS policies can enforce row-level security
- Future-proof: supports MFA, social login, etc.

**Cons:**
- Requires DB schema changes (profiles table, audit_logs migration)
- Existing hardcoded users would need Supabase Auth accounts created
- Auth-related env vars need to be added to `.env.local`
- Requires testing migration of existing login UX

### 6.2 Option B: API Token Auth (Lighter)

**Approach:** Use a shared secret token passed as a header, validated server-side.

**Implementation steps:**
1. Set `ADMIN_API_TOKEN` in `.env.local` (key already defined in `.env.example` but unused)
2. Create `lib/auth.ts` utility that checks `Authorization: Bearer <token>` header
3. Add middleware or per-route check for admin API routes
4. For client-side UI: store token in sessionStorage, pass in fetch headers
5. Replace login page to validate credentials against server endpoint

**Pros:**
- No database changes needed
- Minimal code changes (single auth utility + header check)
- Works immediately with existing API architecture
- No package installs

**Cons:**
- Less secure than full auth system (shared secret, not per-user)
- No user-level audit trail
- Token revocation requires changing env var + redeploy
- No session management (token is static)
- No RLS integration

### 6.3 Option C: Environment Variable Auth (Quick Fix)

**Approach:** Replace hardcoded credentials with env vars, add server-side validation for API routes.

**Implementation steps:**
1. Wire `ADMIN_PASSWORD` from `.env.local` into login page (via API endpoint)
2. Create `/api/auth/login` endpoint that validates against env var
3. Replace client-side hardcoded comparison with API call
4. Add simple token check to admin API routes

**Pros:**
- Fastest to implement (1-2 days)
- Credentials no longer in client bundle
- Credentials changeable via `.env.local` without code changes
- No package or DB changes

**Cons:**
- Still no per-user auth
- No session management
- Token validation is basic
- Not a long-term solution

### 6.4 Comparison

| Criterion | Option A: Supabase Auth | Option B: API Token | Option C: Env Var |
|-----------|------------------------|---------------------|-------------------|
| **Effort** | 1-2 sprints | 2-3 days | 1-2 days |
| **Security** | 🟢 High | 🟡 Medium | 🟡 Medium |
| **Scalability** | 🟢 Excellent | 🟡 Limited | 🔴 Low |
| **Audit trail** | 🟢 Per-user | 🔴 Shared token | 🔴 None |
| **Maintenance** | 🟢 Low | 🟢 Low | 🟡 Manual |
| **RLS integration** | 🟢 Native | 🔴 N/A | 🔴 N/A |
| **Code changes** | Many files | ~5 files | ~3 files |
| **DB changes** | Required | None | None |

---

## 7. Recommendation Inputs

### 7.1 What Matters for This Project

Based on the project's stage (solo founder, pre-launch, readiness 15/100):

**Short-term priority:** Get the credentials out of the client bundle. This is a demonstration of zero security maturity and actively harmful if anyone inspects the site.

**Medium-term priority:** Add server-side auth on all API routes. Without this, the admin APIs are effectively public.

**Long-term priority:** Full Supabase Auth integration for production launch, when multiple admin users or audit trails become necessary.

### 7.2 Suggested Ordering

| Phase | What | Why |
|-------|------|-----|
| Phase 1 | Move credentials to env vars, wire into login page | Stop exposing creds in client bundle |
| Phase 2 | Add middleware to protect `/admin/*` routes | First layer of server-side protection |
| Phase 3 | Add auth middleware to all admin API routes | Close the biggest security gap |
| Phase 4 | Create Supabase Auth setup (profiles table, `@supabase/ssr`) | Proper auth before launch |
| Phase 5 | Add `performed_by` to audit_logs | Traceability |
| Phase 6 | RLS policies for admin tables | Defense in depth |

### 7.3 What NOT To Do

- Do NOT attempt to build custom password hashing — use Supabase Auth (managed)
- Do NOT build a complete role-based access system before launch — admin-only is sufficient
- Do NOT add SSO or social login in the first pass
- Do NOT create a user registration flow — admin accounts should be manually provisioned

---

## Appendix A: Files Examined

### Auth-related
- `app/admin/page.tsx` — Login page with hardcoded 1234/1234
- `app/admin/layout.tsx` — Client-side auth guard
- `.env.local` — Current credentials (no admin auth vars used)
- `.env.example` — Shows planned auth env vars (unused in code)
- `.memories.session.txt` — Mentions Supabase email OTP attempt

### Infrastructure
- `lib/supabase.ts` — Server-side service role client
- `lib/supabase-client.ts` — Client-side anon key client (unused)
- `package.json` — `@supabase/supabase-js` ^2.38.0 only (no `@supabase/ssr`)

### Database
- `db/supabase_migrations/001_init_schema.sql` — Only migration with RLS
- `db/supabase_migrations/002~010/*.sql` — No auth-related changes
- `db/supabase_migrations/007_reconcile_schema.sql` — audit_logs DDL (no `performed_by`)
- `DATABASE_SCHEMA_NOTE.md` — Confirms migrations are authoritative

### API Routes (all checked for auth)
- `app/api/admin/orders/route.ts`
- `app/api/admin/orders/[id]/actions/route.ts`
- `app/api/admin/orders/[id]/notes/route.ts`
- `app/api/admin/orders/[id]/tracking/route.ts`
- `app/api/admin/orders/[id]/receipt/route.ts`
- `app/api/admin/export/orders/route.ts`
- `app/api/admin/shipments/route.ts`
- `app/api/products/route.ts`
- `app/api/payment/route.ts`
- `app/api/payment/create/route.ts`
- `app/api/contact/route.ts`

---
