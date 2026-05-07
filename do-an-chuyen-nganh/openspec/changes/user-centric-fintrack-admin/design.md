## Context

FinTrack is a personal finance system. Most product data is user-owned:

- `wallets.user`
- `transactions.user`
- `categories.user` for custom categories; default categories are system-wide
- `budgets.user`
- `savings-goals.owner` and `savings-goals.participants`
- `savings-contributions.user`
- `notifications.recipient`
- receipt/OCR records are represented by `transactions.sourceType = "receipt_ai"` plus linked `media`
- advisor/chat messages are currently not persisted as a durable audit trail

The previous admin implementation added finance modules at top level. That is operationally useful for debugging, but it violates the product mental model: admin support should inspect a user's workspace, not browse all private records as independent global tables.

Current useful pieces to reuse:

- `src/lib/admin/auth.ts` already gates admin access.
- `src/lib/admin/service.ts` already has a `getAdminUserFinanceSummary(payload, userId)` helper.
- existing `getAdminWallets`, `getAdminTransactions`, `getAdminCategories`, `getAdminBudgets`, `getAdminSavings`, `getAdminReceipts`, and `getAdminNotifications` can become user-scoped by requiring a user id wrapper.
- `FinanceAdminDashboard` already has table rendering components that can be reused.

Important constraint: this proposal is for implementation planning. UI implementation tasks MUST start by running `ui-ux-pro-max` design-system and UX searches again, because the user explicitly requires the agent to consult that skill before UI work.

## Goals / Non-Goals

**Goals:**

- Make `/admin/finance/users` the main support entry point.
- Add `/admin/finance/users/:userId` and child sections for all user-owned finance resources.
- Require a selected user context before showing wallets, transactions, categories/jars, savings, receipts, notifications, and AI/chat logs.
- Keep `/admin` overview aggregate and privacy-safe.
- Preserve raw Payload collection access only as a secondary low-level area, not the main finance admin workflow.
- Persist privacy-safe AI/chat/advisor logs if they do not already exist.
- Keep admin APIs narrow and user-scoped so future UI code can call simple endpoints without rediscovering query rules.
- Keep implementation tasks small and ordered to reduce AI context usage.

**Non-Goals:**

- Rewriting the normal user-facing finance application.
- Creating a separate admin app outside Payload Admin.
- Changing ordinary user finance behavior unless required to persist AI/chat logs.
- Allowing admin to impersonate users or write user finance data directly in this change.
- Exposing full raw prompts/responses by default in admin.

## Decisions

### 1. User workspace becomes the admin unit of navigation

Admin navigation should look like:

```text
/admin
  Overview

/admin/finance/users
  User list

/admin/finance/users/:userId
  User finance overview

/admin/finance/users/:userId/wallets
/admin/finance/users/:userId/transactions
/admin/finance/users/:userId/categories
/admin/finance/users/:userId/budgets
/admin/finance/users/:userId/savings
/admin/finance/users/:userId/receipts
/admin/finance/users/:userId/ai
/admin/finance/users/:userId/notifications
```

Rationale: all sensitive finance data is personal. The admin support workflow starts with "which user are we helping?".

Alternative considered: keep global module pages with mandatory `user` filter. This still lets agents/users enter a blank global table and makes privacy mistakes easier.

### 2. Keep global aggregate pages but remove global detail browsing from primary UI

`/admin` may show aggregate counts and warnings:

- user count
- users missing wallets
- total warning counts
- receipt/OCR warning count
- system data-quality count
- AI service health/log count

It MUST NOT show full transaction rows, wallet rows, receipt rows, or chat message contents across all users.

Data-quality pages may show issue summaries and link to affected user workspace pages.

### 3. Add user-scoped admin service functions first

Implement service helpers before UI:

```ts
getAdminUserProfile(payload, userId)
getAdminUserWorkspaceOverview(payload, userId)
getAdminUserWallets(payload, userId, params)
getAdminUserTransactions(payload, userId, params)
getAdminUserCategories(payload, userId, params)
getAdminUserBudgets(payload, userId, params)
getAdminUserSavings(payload, userId, params)
getAdminUserReceipts(payload, userId, params)
getAdminUserNotifications(payload, userId, params)
getAdminUserAiLogs(payload, userId, params)
```

Each helper must include the user constraint internally, not rely on UI-provided query params:

```ts
where: andWhere([
  { user: { equals: userId } },
  ...filters
])
```

For savings:

```ts
where: {
  or: [
    { owner: { equals: userId } },
    { participants: { contains: userId } }
  ]
}
```

Rationale: API correctness should not depend on UI discipline.

### 4. Add nested admin API routes

Target route shape:

```text
GET /api/admin/users/:id/profile
GET /api/admin/users/:id/finance-summary
GET /api/admin/users/:id/wallets
GET /api/admin/users/:id/transactions
GET /api/admin/users/:id/categories
GET /api/admin/users/:id/budgets
GET /api/admin/users/:id/savings
GET /api/admin/users/:id/receipts
GET /api/admin/users/:id/notifications
GET /api/admin/users/:id/ai-logs
```

The existing top-level endpoints may remain temporarily for data quality and compatibility, but the admin UI should stop using them for detail browsing.

### 5. Persist AI/chat/advisor logs with redaction defaults

Current chat messages are client state only. Transactions created from chatbot are persisted as transactions with `sourceType = "chatbot"`, but the conversation itself is not.

Add a small audit collection:

```text
ai-chat-logs
  user: relationship users required indexed
  kind: select advisor | transaction_chat | receipt_ocr
  direction: select user | assistant | system
  status: select success | error | pending
  redactedText: textarea required
  rawText: textarea admin-only optional
  intent: text optional
  linkedTransaction: relationship transactions optional
  metadata: json optional
  errorMessage: text optional
  createdAt / updatedAt
```

Default admin UI uses `redactedText`. Raw text, if stored, should be hidden by default and only exposed behind a reviewed support action in a future change.

Rationale: user asked for chat logs, but finance/AI content is sensitive. A redacted-first model gives support observability without normalizing unrestricted private transcript browsing.

Alternative considered: do not persist chat. That fails the requested admin capability.

### 6. UI must follow `ui-ux-pro-max` before implementation

Before touching admin UI files, the implementation agent must run:

```bash
python .codex/skills/ui-ux-pro-max/scripts/search.py "fintech admin user profile dashboard privacy support" --design-system -p "FinTrack User-Centric Admin"
python .codex/skills/ui-ux-pro-max/scripts/search.py "admin detail drilldown user profile financial dashboard accessibility" --domain ux -n 6
python .codex/skills/ui-ux-pro-max/scripts/search.py "dashboard user detail tables filters navigation" --stack nextjs
```

Use the result as constraints:

- data-dense dashboard
- breadcrumbs for depth
- high contrast fields/tables
- visible focus states
- reduced motion support
- Next `Link` for navigation
- no decorative landing-page style
- no global sensitive detail tables outside a user profile

Keep current FinTrack light theme tokens where possible:

- background `#f6f8fb`
- cards `#ffffff`
- primary `#2563eb`
- accent `#0f766e`
- text `#111827`

### 7. Design the user workspace as a stable shell

The user workspace should have:

```text
Breadcrumb:
  Admin > Người dùng > user@example.com > Giao dịch

Header:
  user email/name/role/currency
  setup status
  wallet count, transaction count, latest activity

Tabs:
  Tổng quan
  Ví tiền
  Giao dịch
  Danh mục & hũ chi
  Tiết kiệm
  Hóa đơn/OCR
  AI/chat
  Thông báo

Content:
  scoped filters
  scoped tables
  empty states
```

The user list should link to `/admin/finance/users/:id`, not expose user-owned detail operations inline.

## Risks / Trade-offs

- [Risk] Existing global admin pages are already implemented and may be referenced by docs/tests.  
  Mitigation: keep compatibility endpoints, but change primary UI navigation and tests to nested user routes.

- [Risk] Adding AI chat log persistence touches user-facing chat/advisor routes.  
  Mitigation: implement a minimal append-only log helper and do not change chat UX.

- [Risk] Admin and normal user auth share Payload's `payload-token` cookie.  
  Mitigation: keep current middleware/login guard; document that simultaneous same-browser admin/user sessions require future cookie/domain architecture.

- [Risk] `overrideAccess: true` in admin service can leak data if not scoped.  
  Mitigation: put user constraints inside service helpers and add tests proving user A endpoint never returns user B data.

- [Risk] Large UI rewrite can consume many tokens.  
  Mitigation: implement service/API first, then a single workspace shell, then one tab at a time with reusable table/filter components.

## Migration Plan

1. Add user-scoped admin services and tests without changing UI.
2. Add nested `/api/admin/users/:id/*` routes and tests.
3. Add AI chat log collection and logging helper if missing.
4. Regenerate Payload types after schema change.
5. Add user workspace UI and update nav.
6. Hide or de-emphasize global finance module links.
7. Update docs/page map.
8. Run type checks and targeted tests.

Rollback strategy:

- Keep existing top-level admin APIs until the new UI is verified.
- If user workspace UI fails, restore nav links to `/admin/finance/users` and raw collections while keeping new APIs inert.

## Open Questions

- Should raw AI message text be stored at all, or only redacted summaries?
- Should admin be allowed to edit user finance records in this change, or only inspect?
- Should `/admin/finance/users/:id/categories` include system default categories alongside user custom categories?
- Should data-quality findings link to the user workspace or keep a separate issue detail route?
