# Project Roadmap — D'Jaemo Jamur Krispi

> **Maintainer:** Tech Lead
> **Audience:** All team members and stakeholders
> **Purpose:** Official roadmap — summarizes completed, current, next, and future work.
> **Last Updated:** 2026-07-03

---

## Completed (Sprint 0)

Sprint 0 established the project foundation:
- Architecture discovery (`docs/ARCHITECTURE_DISCOVERY_REPORT.md`)
- Code audit (`docs/CODE_AUDIT_REPORT.md`)
- Implementation roadmap (`docs/IMPLEMENTATION_ROADMAP.md`)
- Product domain architecture (`docs/PRODUCT_DOMAIN_ARCHITECTURE.md`)
- Repository and Service layer for Product domain created
- Engineering review completed (`docs/FINAL_ENGINEERING_REVIEW.md`)
- Checkout review completed (`docs/CHECKOUT_REVIEW.md`)
- Known issues documented (`docs/KNOWN_ISSUES.md`)
- Environment setup guides created (`SETUP.md`, `BACKEND_SETUP.md`)
- Governance foundation created (`docs/governance/`)

---

## Current Sprint

See [`06_CURRENT_SPRINT.md`](./06_CURRENT_SPRINT.md) for the active sprint details.

**Current sprint:** SPR-GOV-001 — Project Governance Foundation

---

## Next Sprint (Planned)

### Sprint 1: Quick Wins & Broken Fixes

Based on `docs/IMPLEMENTATION_ROADMAP.md`:

| Task | Effort | Description |
|------|--------|-------------|
| QW-01 | 2 min | Add missing npm packages (`pdfkit`, `bwip-js`, `qrcode`) |
| QW-02 | 15 min | Fix admin order list `Array.isArray` parsing |
| QW-03 | 30 min | Fix admin orders page navigation (missing route) |
| QW-04 | 30 min | Fix checkout localStorage race condition |
| QW-05 | 20 min | Remove dead code (7 files) |
| QW-06 | 1 min | Fix language inconsistency ("Add to Cart" → Indonesian) |
| QW-07 | 2 min | Remove commented Chart.js code |
| QW-08 | 10 min | Remove duplicate `sanitizePriceToInt` |
| QW-09 | 15 min | Update `.env.example` with missing vars |
| QW-10 | 15 min | Extract magic numbers in shipping |

**Estimated effort:** ~2.5 hours
**Definition of Done:** See `04_DEFINITION_OF_DONE.md`

---

## Future Sprints

### Sprint 2: Secure the Perimeter

Dependencies: Sprint 1

- Server-side admin authentication (SEC-01)
- API authentication middleware (SEC-02)
- Move Biteship API key to env var (SEC-03)

**Estimated effort:** 2-3 days

### Sprint 3: Trust but Verify

Dependencies: Sprint 2

- Server-side price verification (VAL-01)
- Zod input validation (VAL-02)
- Standardize API response shapes (VAL-03)
- Remove `console.error` from production (VAL-04)
- Fix transaction ID storage (VAL-05)

**Estimated effort:** 2-3 days

### Sprint 4: Fix the Data

Dependencies: Sprint 2, Sprint 3 (partial)

- Fix schema drift (DB-01)
- Consolidate product data sources (DB-02)
- Add database transaction support (DB-03)
- Add missing indexes (DB-04)

**Estimated effort:** 3-4 days

### Sprint 5: Architecture & Maintainability

Dependencies: Sprint 2

- Split admin dashboard into hooks (ARCH-01)
- Split admin dashboard into components (ARCH-02)
- Consolidate product management (ARCH-03)
- Consolidate shipping (ARCH-04)
- Standardize error boundaries (ARCH-05)

**Estimated effort:** 5-6 days

### Sprint 6: Performance & Scale

Dependencies: Sprint 5, Sprint 4

- Reduce client component footprint (PERF-01)
- Configure next.config.ts (PERF-02)
- Optimize product images (PERF-03)
- Add rate limiting (PERF-04)
- Dynamic imports for admin (PERF-05)
- SEO metadata files (PERF-06)

**Estimated effort:** 2-3 days

### Sprint 7: Quality & Testing

Dependencies: All previous sprints

- Testing infrastructure (TEST-01)
- Unit tests for utilities (TEST-02)
- Integration tests for payment (TEST-03)
- Integration tests for admin API (TEST-04)
- E2E test for checkout (TEST-05)
- Accessibility fixes (QLT-01)
- Edge case fixes (QLT-02)

**Estimated effort:** 5-7 days

---

## Critical Path

```
Sprint 0 (done) → Sprint 1 (2.5h) → Sprint 2 (3d) → Sprint 3 (3d) → Sprint 4 (4d) → Sprint 6 (3d) → Sprint 7 (6d)
```

**Total critical path duration from Sprint 1:** ~19 working days

**Parallel paths:**
- Sprint 4 (DB) can run alongside Sprint 5 (Architecture)
- Sprint 6 (Performance) can run alongside Sprint 7 (Testing)

---

## Production Readiness Target

| Milestone | Target Readiness | Minimum Viable Production |
|-----------|-----------------|--------------------------|
| Current | 15/100 | ❌ |
| After Sprint 2 | 55/100 | ⚠️ (with manual oversight) |
| After Sprint 3 | 70/100 | ✅ (limited production) |
| After Sprint 4 | 78/100 | ✅ |
| After Sprint 7 | 90/100 | ✅✅ |

**Production launch is blocked until at least Sprint 3 is complete.**
