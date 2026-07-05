# Project Workflow — D'Jaemo Jamur Krispi

> **Maintainer:** Engineering Manager
> **Audience:** All team members
> **Purpose:** Define how work flows from idea to merge.
> **Last Updated:** 2026-07-03

---

## Workflow Diagram

```
Product Owner
    │
    ▼
ChatGPT (Product Manager / Spec Writer)
    │  Defines sprint scope, writes specifications
    │  Output: Clear task description in sprint document
    ▼
OpenCode (AI Engineer)
    │  Reads spec, reads governance docs, reads architecture
    │  Implements changes according to Engineering Constitution
    │  Verifies: build, lint, typecheck
    ▼
Review (Tech Lead + Senior Engineer)
    │  Reviews code against Engineering Constitution
    │  Verifies: architecture, ADS rules, no business logic violations
    │  Verifies: no duplicated business logic, no duplicated UI
    ▼
QA (Manual)
    │  Tests the changes in staging/development environment
    │  Verifies: feature works end-to-end, no regressions
    ▼
Merge → Production
```

---

## Role Responsibilities

### Product Owner

- Defines business priorities and sprint goals
- Approves scope changes
- Makes final decisions on product direction
- Communicates with stakeholders

### ChatGPT (Product Manager / Spec Writer)

- Receives direction from Product Owner
- Writes detailed sprint specifications
- Breaks work into discrete tasks with clear acceptance criteria
- References existing documentation to avoid duplication
- Ensures every task has a "Definition of Done"

### OpenCode (AI Engineer)

- Reads sprint specification and all relevant governance docs before coding
- Follows the Engineering Constitution without exception
- Reads existing code to understand patterns before implementing
- Implements changes according to the project's architectural decisions
- Verifies code quality: `npm run build`, `npm run lint`, TypeScript check
- Does NOT modify: UI design, navigation, routes, database schema, or business logic without explicit instruction
- Documents all TODO items when information is missing

### Reviewer (Tech Lead)

- Enforces Engineering Constitution
- Verifies architectural compliance
- Checks for business logic leaks across layers
- Confirms no duplicated business logic or UI
- Approves or rejects PR with clear rationale
- Signs off on governance document changes

### QA Engineer

- Tests against Definition of Done
- Verifies feature works as specified
- Checks for regressions in existing functionality
- Reports bugs with reproduction steps
- Confirms UI consistency and user experience

---

## Workflow Rules

### Every Sprint

1. Product Owner defines sprint goal
2. ChatGPT produces sprint document with task breakdown
3. OpenCode reads all relevant governance docs first
4. OpenCode implements tasks sequentially
5. Reviewer reviews each PR
6. QA tests the implementation
7. Tech Lead merges to `main`

### PR Requirements

Every PR MUST include:
- Reference to the sprint task being addressed
- Brief description of what was changed and why
- Confirmation that `npm run build` and `npm run lint` pass
- Any TODO items discovered during implementation

### Blocking Rules

- If a task depends on uncompleted work, mark it as BLOCKED in the sprint doc
- If a PR violates the Engineering Constitution, it MUST be rejected
- If a change requires modifying governance docs, update them in the same PR
