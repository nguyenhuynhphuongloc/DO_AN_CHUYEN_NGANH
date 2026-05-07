## Context

FinTrack currently uses Payload Admin as a default CRUD surface for registered collections. That is useful for low-level data editing, but it does not match the current product shape: a personal finance system with users, wallets, transactions, category jars, reports, savings, notifications, receipt OCR, and AI advisor flows.

The admin redesign should sit on top of existing Payload/Next.js infrastructure and reduce ambiguity for future implementation. The UI direction from `ui-ux-pro-max` is a data-dense operational dashboard: restrained monochrome foundation, blue accent for primary actions, compact tables, clear filters, chart-driven summaries, and no decorative marketing layout.

## Goals / Non-Goals

**Goals:**

- Provide a finance-aware admin dashboard for operations, audit, and support.
- Keep normal users out of `/admin`; only users with `role = admin` can access admin functionality.
- Organize admin navigation by business domain instead of raw collection names.
- Add admin-only APIs with narrow response contracts so admin pages do not depend on broad unfiltered Payload documents.
- Expose data-quality warnings for personal-finance integrity: missing wallets, suspicious transactions, orphan receipts, category/budget mismatches, and failed OCR.
- Make OCR/AI behavior inspectable without making normal users see internal payloads.
- Keep the plan implementable in small tasks with minimal rediscovery.

**Non-Goals:**

- Replacing Payload CMS.
- Rewriting the normal user-facing finance pages.
- Adding a new external admin framework.
- Adding Redis, queues, or new observability infrastructure.
- Changing the public finance product behavior unless required for admin separation or audit correctness.

## Decisions

### 1. Use Payload Admin as the shell, add custom finance views

Keep Payload Admin for authentication, layout integration, and collection editing. Add custom admin views/components for finance operations:

```text
/admin
  |
  +-- Overview
  +-- Users
  +-- Wallets
  +-- Transactions
  +-- Categories & Jars
  +-- Savings
  +-- Receipts & OCR
  +-- AI Advisor
  +-- Notifications
  +-- Data Quality
  +-- System Settings
```

Rationale: this keeps the implementation close to current Payload patterns while avoiding a separate admin app.

Alternatives considered:

- Build a separate `/admin2` Next.js app: more control, but duplicates auth/layout and increases scope.
- Use only collection CRUD: fastest, but does not solve operational needs or product mismatch.

### 2. Add admin-only API routes for summaries and operational tables

Use `/api/admin/*` routes for data that is aggregated, cross-collection, or heavily filtered. Every route must verify `req.user.role === "admin"` before returning data.

Planned routes:

```text
GET /api/admin/overview
GET /api/admin/users
GET /api/admin/users/:id/finance-summary
GET /api/admin/wallets
GET /api/admin/transactions
GET /api/admin/categories
GET /api/admin/budgets
GET /api/admin/savings
GET /api/admin/receipts
GET /api/admin/receipts/:id
GET /api/admin/ai/advisor-logs
GET /api/admin/notifications
GET /api/admin/data-quality
POST /api/admin/data-quality/recheck
```

The implementation can use Payload Local API internally, but must intentionally scope admin operations and avoid leaking unnecessary sensitive fields in responses.

### 3. Design the UI as an operational fintech dashboard

Use a compact, professional layout:

- Background: `#FAFAFA`
- Text: `#09090B`
- Primary surfaces: white cards with visible neutral borders
- Primary action/accent: `#2563EB`
- Neutral controls: `#18181B`, `#3F3F46`
- Typography preference: data-oriented sans/mono pairing. If existing app typography is retained, preserve consistency and only apply dense sizing/spacing rules.
- Icons: use Lucide icons, not emoji.
- Tables: sticky headers, compact rows, row hover, visible focus states, bulk-safe actions.
- Charts: small KPI trend lines, time-series income/expense, category/budget progress bars, source distribution.

Admin UI must be denser than the user app:

```text
KPI row
  4-6 compact metric cards

Main grid
  left: alerts / data quality / recent failed OCR
  center: finance activity chart / transaction volume
  right: system state / queues / service health

Tables
  filter bar -> table -> detail drawer
```

### 4. Treat high-risk admin actions as reviewed operations

Avoid one-click destructive edits for sensitive finance data. Use detail drawers or confirmation dialogs for:

- deleting users
- changing roles
- deleting categories
- editing transaction amount/date/wallet/category
- deleting receipt media
- marking data-quality warnings resolved

Where possible, prefer archive/disable over hard delete.

### 5. Expose savings and receipt audit intentionally

`SavingsGoals` and `SavingsContributions` are currently registered but hidden. The admin redesign should make savings visible if the frontend keeps `/savings`.

Receipt/OCR currently appears through transactions and media. Admin should still provide receipt/OCR views now, and can later adopt dedicated receipt audit collections if they are introduced.

### 6. Keep specs and page map updated

The rebuilt admin is a primary system surface. `SYSTEM_PAGE_FUNCTION_MAP.md` must document admin pages, APIs, data dependencies, and performance notes, not only frontend user pages.

## Admin Modules

### Overview

Purpose: single operational dashboard.

Widgets:

- total users, active users, new users this month
- total wallet balance, monthly income, monthly expense, net cashflow
- transaction count by source: manual, chatbot, receipt AI, transfer, adjustment
- budget/jar warnings at 80% and 100%
- failed OCR or unresolved receipt count
- data-quality warning count

### Users

Functions:

- list users with role, currency, wallet count, transaction count, latest activity
- filter by role, setup status, created date, activity
- open user finance summary
- change role only through protected admin action
- disable/delete with confirmation

### Wallets

Functions:

- list wallets by user, type, balance, default status, active status
- detect users without default wallet
- inspect wallet transactions
- prevent admin from making a savings wallet default unless business rules allow it

### Transactions

Functions:

- filter by user, wallet, type, category, sourceType, date range, amount range
- inspect transaction details and related receipt
- show before/after balance impact if available
- edit only with confirmation and validation

### Categories & Jars

Functions:

- manage system categories separately from user categories
- show duplicate/suspicious category names
- list budgets by user, category, wallet, month, year
- show spent, limit, remaining, usage percentage
- warn for income categories used as expense budgets or mismatched transaction category types

### Savings

Functions:

- show savings goals, participants, target/current amount, status
- show savings contributions
- inspect savings-related transactions
- surface inconsistency between contribution totals and goal current amount

### Receipts & OCR

Functions:

- list OCR transactions and receipt media
- filter by status, provider, user, date, category resolution
- view receipt image, parsed fields, reviewed fields, line items if available
- show partial/failed confirmation states when tracked

### AI Advisor

Functions:

- show advisor request volume and recent failures if logging exists
- inspect advisor inputs only in privacy-safe summarized form
- show service health and latency if available
- avoid exposing full personal financial context unless required for debugging and gated by admin role

### Notifications

Functions:

- list notifications by recipient, type, read status
- inspect notification links
- create system notification if the product needs admin broadcasts

### Data Quality

Functions:

- users without default wallet
- transactions without wallet/category/user
- transactions with mismatched category type
- budgets without category or duplicate period scope
- receipt transactions without media
- media without owner
- savings goals with inconsistent contribution totals

## Risks / Trade-offs

- Admin aggregation can become slow with large datasets -> use pagination, limits, `select`, `depth: 0`, and date filters by default.
- Admin APIs can leak sensitive finance data -> every route must be admin-only and return minimal fields.
- Custom admin views can drift from Payload collection schemas -> keep module table columns mapped directly to collection fields and update generated types after schema changes.
- Receipt audit may be incomplete until dedicated receipt audit storage exists -> design views to show available transaction/media data now and extend later.
- Too many admin modules can overwhelm users -> use domain grouping and default to Overview, Transactions, Users, Data Quality as primary paths.

## Migration Plan

1. Add specs and tasks for the rebuilt admin.
2. Lock admin access and verify normal users cannot access `/admin`.
3. Add admin API guard/helper and implement read-only summary endpoints first.
4. Add custom admin navigation/views with data-dense UI.
5. Add domain modules incrementally: Overview, Users, Transactions, Categories/Jars, Receipts/OCR, Data Quality.
6. Unhide or expose Savings admin only after confirming `/savings` remains in product scope.
7. Update `SYSTEM_PAGE_FUNCTION_MAP.md`.
8. Run `generate:importmap` after admin component changes and `generate:types` after schema changes.
9. Validate with `tsc --noEmit` and targeted integration tests.

Rollback:

- Keep Payload default collection CRUD available.
- Custom admin routes/views can be removed without data migration if schema remains unchanged.
- If a new audit collection is added later, rollback requires preserving or migrating audit rows before removing it.

## Open Questions

- Should admin be embedded inside Payload Admin only, or should a separate `/admin/finance` custom view become the main admin landing page?
- Should savings goals remain a first-class module, or should savings be represented primarily through wallets with `walletType = savings`?
- Should receipt/OCR audit get a dedicated collection in this change, or should the first pass display only transaction/media data already available?
- Should admin support exports, or should export be a later capability?
