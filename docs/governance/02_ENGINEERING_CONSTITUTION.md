# Engineering Constitution — D'Jaemo Jamur Krispi

> **Maintainer:** Tech Lead
> **Audience:** All engineers (human and AI)
> **Purpose:** Binding rules that every engineer must follow. Violations require Tech Lead approval.
> **Last Updated:** 2026-07-03

---

## Binding Rules

### 1. UX Preservation

Engineer MUST NOT redesign UX without Tech Lead approval.

This includes:
- Changing page layouts, component structure, or visual hierarchy
- Removing, renaming, or repositioning navigation elements
- Altering the color palette, typography, or spacing system
- Modifying the checkout flow, cart behavior, or payment UX
- Changing form field labels, validation messages, or error states

### 2. Navigation Integrity

Engineer MUST NOT remove navigation without Tech Lead approval.

The following navigation structure is frozen:
- Public: Header (brand logo, nav links) → Footer (nav links, social, contact)
- Admin: Sidebar/tab structure of the dashboard
- Routes: `/`, `/produk`, `/cart`, `/checkout`, `/checkout/success`, `/checkout/failed`, `/tentang`, `/kontak`, `/admin`, `/admin/dashboard`, `/admin/orders`, `/admin/products`

Engineer MUST NOT rename any route path. API endpoints MUST NOT be renamed or restructured.

### 3. Module Integrity

Engineer MUST NOT rename modules, files, or directories without Tech Lead approval.

This includes:
- Renaming files or directories in `app/`, `components/`, `lib/`, `types/`
- Renaming exported functions, components, or types that have consumers
- Changing import paths that other files depend on

### 4. Architecture Preservation

Engineer MUST NOT change architecture without Tech Lead approval.

The following architectural decisions are frozen:
- Monolithic Next.js deployment (no separate backend service)
- App Router as primary routing convention (Pages Router is legacy)
- Supabase as the sole database
- Midtrans as the sole payment gateway
- Flat rate shipping as the default shipping method

### 5. Business Logic Boundaries

Engineer MUST NOT move business logic without Tech Lead approval.

- Business logic belongs in **Services** (`lib/services/`)
- Data access belongs in **Repositories** (`lib/repositories/`)
- HTTP concerns belong in **API Routes** (`app/api/`)
- UI concerns belong in **Components** (`components/`)

---

## Domain Rules

### Repository Layer

- No Business Logic — repositories return raw database rows, perform no transformations, apply no business rules
- No fallback logic — repositories throw on database error, return `null` on missing row
- No HTTP concerns — repositories never read request bodies, headers, or cookies
- Repository methods accept and return only domain primitives and plain objects

### Service Layer

- Business Logic only — services contain validation, transformation, and business rules
- Services call Repositories — never call Supabase, Midtrans, or other external services directly
- Services do NOT throw — return standardized values: `[]`, `null`, `{ success: boolean, data?: T }`
- Services may coordinate multiple repositories and external service calls
- Services NEVER import from `next/` or `app/`

### Admin Domain (ADS — Admin Domain Separation)

- Each admin domain (orders, products, dashboard) is business-agnostic — no cross-domain logic
- Admin domains share UI components but NOT business logic
- Admin domains never call each other's APIs
- Admin authentication is a shared mechanism used by all domains equally

### Dashboard

- Business Overview only — revenue summary, order counts, recent activity
- No detailed operations in the dashboard — those belong on dedicated sub-pages
- No inline product CRUD — delegating to `/admin/products/` is preferred
- No embedded analytics beyond summary metrics

### Orders

- Single Operational Module — all order functionality in one domain
- Order status transitions MUST be validated server-side
- Order list MUST support pagination (future — currently loads all)
- Order detail MUST include customer info, items, payment, and shipping

### UI Components

- UI components MUST NOT contain business logic, API calls, or database access
- UI components MUST be reusable — no domain-specific code in `components/ui/`
- Feature components in `components/<domain>/` may contain domain-specific UI logic
- All components MUST use TypeScript — no `any` for props

---

## Code Standards

### TypeScript

- `strict: true` in tsconfig
- No `any` type (except for external library shims that cannot be typed)
- No `as` assertions — use proper type narrowing or runtime validation (Zod)
- All props interfaces MUST be exported and named consistently

### ESLint

- `npm run lint` MUST pass before any commit
- Disabling ESLint rules requires Tech Lead approval
- Unused imports and variables are forbidden
- `console.log`/`console.error` in production code is forbidden

### Imports

- Import from the module, not from internal paths (e.g., `@/lib/utils` not relative)
- No circular dependencies
- Server-only code (`lib/supabase.ts` with service role) MUST NOT be importable from client components

---

## Enforcement

| Violation | Consequence |
|-----------|-------------|
| Any rule violation without Tech Lead approval | PR rejected immediately |
| Redesigning UX | PR rejected + rollback required |
| Renaming modules | PR rejected + rollback required |
| Moving business logic across layers | PR rejected + architecture review |
| Introducing new dependencies | Requires Tech Lead approval + dependency audit |
| Disabling ESLint/TypeScript rules | PR rejected |

---

## Amendment Process

1. Any engineer may propose a constitutional amendment via PR
2. Amendment PRs MUST update this file and add an ADR (Architecture Decision Record) in `docs/adr/`
3. Tech Lead MUST approve the amendment
4. Amendments take effect after the PR is merged to `main`
