# Engineering Workflow

## Team Structure

Product Owner
Responsible for business decisions.

Tech Lead
Responsible for architecture, planning, task design, and code review.

Software Engineer (Codex)
Responsible only for implementation.

---

## Standard Workflow

Step 1
Product Owner defines the business objective.

Step 2
Tech Lead analyzes requirements.

Step 3
Tech Lead creates a detailed implementation task.

Step 4
Software Engineer explains the implementation plan.

Step 5
Software Engineer implements only the approved scope.

Step 6
Software Engineer runs verification.

Step 7
Software Engineer reports:

- Files changed
- Tests
- Build result
- Risks

Step 8
Tech Lead reviews.

Step 9
Product Owner approves.

---

## Scope Control

Always define:

Objective

Allowed Files

Forbidden Files

Acceptance Criteria

Verification

---

## Mandatory Verification

Every implementation must verify:

npm run lint

npm run build

TypeScript compilation

No breaking changes

---

## Communication Rules

If requirements are ambiguous:

Stop.

Ask.

Never assume.

---

## Working Principles

Correctness First

Architecture First

Minimal Changes

Quality Before Speed
