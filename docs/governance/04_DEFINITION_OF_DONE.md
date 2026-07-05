# Definition of Done — Quality Gates

> **Maintainer:** Engineering Manager
> **Audience:** All engineers
> **Purpose:** Every sprint must satisfy these gates before merging.
> **Last Updated:** 2026-07-03

---

## Quality Gates

Every sprint (and every PR within a sprint) must satisfy ALL of the following:

### 1. Build

```
npm run build
```

- Must succeed with zero errors
- Must succeed with zero warnings (exceptions require Tech Lead approval)
- Turbopack must NOT be used — use `--webpack` flag (see `docs/KNOWN_ISSUES.md`)

### 2. TypeScript

```
npx tsc --noEmit
```

- Must pass with zero errors
- `strict: true` is enabled — no `any` or `as` exceptions without Tech Lead approval

### 3. ESLint

```
npm run lint
```

- Must pass with zero errors and zero warnings
- Disabling any ESLint rule requires Tech Lead approval
- The following rules are always enforced:
  - `no-explicit-any` — no `any` types
  - `no-unused-vars` — no dead variables
  - `no-console` — no `console.log`/`console.error` in production code

### 4. Architecture Review

- No business logic in API Routes (delegate to Services)
- No business logic in Components (delegate to API → Services)
- No inline Supabase queries in API routes where a Repository exists
- No new Pages Router routes — App Router only
- No new dependencies without Tech Lead approval

### 5. ADS Review (Admin Domain Separation)

- Admin domains remain business-agnostic
- No cross-domain logic between orders, products, and dashboard
- Admin components are in `components/admin/` not in `components/ui/`

### 6. Manual QA

- Feature works as specified in the sprint document
- Checkout flow works end-to-end (if touched)
- Admin dashboard loads and shows data (if touched)
- No visual regressions on public pages
- All existing tests still pass (once tests exist)

### 7. No Duplicated Business Logic

- Any business logic added must not duplicate existing logic
- Check `lib/services/` and `lib/repositories/` before adding new service/repository
- Check `lib/` for existing utility functions before writing new ones
- Check API routes for existing patterns before adding new endpoints

### 8. No Duplicated UI

- Check `components/` before creating new components
- If a similar component exists, reuse or extend it
- Do not create new UI patterns when existing patterns cover the need
- Do not copy-paste JSX — extract into shared components

---

## Sprint Completion Checklist

```
[ ] npm run build passes (zero errors, zero warnings)
[ ] npx tsc --noEmit passes (zero errors)
[ ] npm run lint passes (zero errors, zero warnings)
[ ] Architecture review: no layer violations
[ ] ADS review: admin domains are business-agnostic
[ ] Manual QA: feature works end-to-end
[ ] Manual QA: no regressions in existing features
[ ] No duplicated business logic
[ ] No duplicated UI
[ ] All TODO items documented (if any)
[ ] Sprint document updated with completion status
```

---

## Exception Process

If a quality gate cannot be satisfied:
1. Document the exception in the PR description
2. Get Tech Lead approval
3. Create a follow-up task in the next sprint to resolve the exception
4. Update `docs/KNOWN_ISSUES.md` if the exception is a known issue
