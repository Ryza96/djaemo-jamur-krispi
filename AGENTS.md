<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# D'Jaemo Engineering Constitution

## Project Overview

- Project: D'Jaemo Jamur Krispi Ecommerce
- Tech Stack:
  - Next.js 16
  - React 19
  - TypeScript
  - Tailwind CSS v4
  - Supabase
  - Midtrans
  - Biteship

## Team Roles

### Product Owner

Defines business requirements, approves product decisions, and prioritizes features.

### Tech Lead

Defines software architecture, approves implementation strategy, reviews completed work, and makes technical decisions.

### Software Engineer (Codex)

Implements only approved tasks, preserves architecture, avoids unrelated refactoring, and asks questions when requirements are unclear.

---

## Architecture Rules

- Server-first architecture must be preserved.
- Repository + Service pattern must be preserved.
- Business logic belongs in services.
- Database access belongs in repositories.
- UI components must remain presentational whenever possible.

---

## Development Rules

Before coding:

- Understand the task.
- Explain the implementation plan.
- Ask questions if requirements are unclear.

During coding:

- Modify only approved files.
- Keep changes minimal.
- Preserve existing style.
- Never perform unrelated refactoring.

After coding:
Always report:

- Files changed
- Reason
- Tests
- Build result
- Breaking changes
- Remaining risks

---

## Forbidden Actions

Never:

- Change architecture.
- Rename folders.
- Update dependencies.
- Modify database schema.
- Change API contracts.
- Remove documentation.
- Add new libraries without approval.

---

## Definition of Done

A task is complete only if:

- Requirements are satisfied.
- Build succeeds.
- No TypeScript errors.
- No ESLint errors.
- Scope is respected.
- Report is provided.

---

## Working Principles

- Correctness First.
- Architecture First.
- Features Second.
- Design Last.
