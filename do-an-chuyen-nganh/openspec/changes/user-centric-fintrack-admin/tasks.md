## 1. Orientation And Guardrails

- [x] 1.1 Read `openspec/changes/user-centric-fintrack-admin/proposal.md`, `design.md`, and every spec in `specs/**/spec.md`.
- [x] 1.2 Read current admin files only: `src/components/admin/FinanceAdminDashboard.tsx`, `src/components/admin/FinanceAdminNavLinks.tsx`, `src/lib/admin/service.ts`, `src/lib/admin/types.ts`, `src/app/api/admin/[...path]/route.ts`, `src/lib/admin/auth.ts`.
- [x] 1.3 Confirm current user-owned fields from collections: `wallets.user`, `transactions.user`, `categories.user`, `budgets.user`, `savings-goals.owner`, `savings-goals.participants`, `savings-contributions.user`, `notifications.recipient`, receipt transactions via `transactions.sourceType = "receipt_ai"`.
- [x] 1.4 Do not start UI edits until tasks 5.1-5.3 are completed.

## 2. Admin Service Layer

- [x] 2.1 In `src/lib/admin/types.ts`, add or refine row types for user workspace profile, user workspace overview, user-scoped wallet rows, transaction rows, category rows, budget/jar rows, savings rows, receipt rows, notification rows, and AI/chat log rows.
- [x] 2.2 In `src/lib/admin/service.ts`, add `getAdminUserProfile(payload, userId)` returning id, email, name, role, currency, createdAt, wallet setup state, wallet count, transaction count, latest activity.
- [x] 2.3 In `src/lib/admin/service.ts`, add `getAdminUserWorkspaceOverview(payload, userId)` returning only selected-user KPIs: total balance, spending balance, savings balance, monthly income, monthly expense, net cashflow, budget warnings, receipt count, AI/chat count.
- [x] 2.4 In `src/lib/admin/service.ts`, add `getAdminUserWallets(payload, userId, params)` and enforce `{ user: { equals: userId } }` inside the helper.
- [x] 2.5 In `src/lib/admin/service.ts`, add `getAdminUserTransactions(payload, userId, params)` and enforce `{ user: { equals: userId } }` inside the helper; ignore conflicting `params.user`.
- [x] 2.6 In `src/lib/admin/service.ts`, add `getAdminUserCategories(payload, userId, params)` returning system default categories plus selected-user custom categories; do not include other users' custom categories.
- [x] 2.7 In `src/lib/admin/service.ts`, add `getAdminUserBudgets(payload, userId, params)` and enforce `{ user: { equals: userId } }`.
- [x] 2.8 In `src/lib/admin/service.ts`, add `getAdminUserSavings(payload, userId, params)` using owner-or-participant scoping for `savings-goals` and selected-user contribution summaries.
- [x] 2.9 In `src/lib/admin/service.ts`, add `getAdminUserReceipts(payload, userId, params)` using `transactions.sourceType = "receipt_ai"` and selected-user scoping.
- [x] 2.10 In `src/lib/admin/service.ts`, add `getAdminUserNotifications(payload, userId, params)` using `recipient equals userId`.
- [x] 2.11 Keep existing global service helpers temporarily, but mark them in comments as aggregate/compatibility helpers and stop using them from primary admin UI in later tasks.

## 3. AI And Chat Audit Persistence

- [x] 3.1 Inspect `src/app/api/ai/advisor/route.ts`, `src/app/(frontend)/chat/ChatClient.tsx`, and transaction creation from chatbot to confirm current persisted data.
- [x] 3.2 Add a Payload collection such as `src/collections/AIChatLogs.ts` with fields: user, kind, direction, status, redactedText, rawText, intent, linkedTransaction, metadata, errorMessage, timestamps.
- [x] 3.3 Add restrictive collection access: admin can read all, normal user can read own logs only if needed by future UI, create/update/delete should be server/admin controlled.
- [x] 3.4 Register the collection in `src/payload.config.ts`.
- [x] 3.5 Add a helper such as `src/lib/ai-chat-audit.ts` to create redacted logs from advisor/chat flows.
- [x] 3.6 Update `src/app/api/ai/advisor/route.ts` to write success and error audit logs for authenticated users without changing response shape.
- [x] 3.7 If chatbot transaction creation can identify the originating message, log or update an AI/chat audit entry linking to the created transaction; keep this minimal if current client state has no stable message id.
- [x] 3.8 Add `getAdminUserAiLogs(payload, userId, params)` in `src/lib/admin/service.ts`, returning redacted rows only and excluding rawText by default.
- [x] 3.9 Run `cmd /c npm run generate:types` after collection/schema changes.

## 4. Nested Admin API Routes

- [x] 4.1 Update `src/app/api/admin/[...path]/route.ts` imports to include all user-scoped service helpers.
- [x] 4.2 Add `GET /api/admin/users/:id/profile` route branch.
- [x] 4.3 Add or replace `GET /api/admin/users/:id/finance-summary` with `getAdminUserWorkspaceOverview`.
- [x] 4.4 Add route branches for `/api/admin/users/:id/wallets`, `/transactions`, `/categories`, `/budgets`, `/savings`, `/receipts`, `/notifications`, and `/ai-logs`.
- [x] 4.5 Make route matching explicit and ordered so `/api/admin/users/:id/role` and `/api/admin/users/:id/*` do not conflict.
- [x] 4.6 Ensure all nested admin routes use existing `getAdminContext` and return 401/403 before any service call for unauthorized requests.
- [x] 4.7 Keep top-level `/api/admin/overview`, `/api/admin/users`, and `/api/admin/data-quality`; avoid adding new primary global detail endpoints.

## 5. UI Skill Requirement Before Admin UI Work

- [x] 5.1 Run `python .codex/skills/ui-ux-pro-max/scripts/search.py "fintech admin user profile dashboard privacy support" --design-system -p "FinTrack User-Centric Admin"`.
- [x] 5.2 Run `python .codex/skills/ui-ux-pro-max/scripts/search.py "admin detail drilldown user profile financial dashboard accessibility" --domain ux -n 6`.
- [x] 5.3 Run `python .codex/skills/ui-ux-pro-max/scripts/search.py "dashboard user detail tables filters navigation" --stack nextjs`.
- [x] 5.4 Summarize the UI constraints in the working notes before editing UI: data-dense layout, breadcrumbs, high contrast, focus states, reduced motion, Next `Link`, FinTrack light theme.

## 6. User-Centric Admin UI

- [x] 6.1 Update `src/components/admin/FinanceAdminNavLinks.tsx` so finance navigation promotes "Người dùng" and "Chất lượng dữ liệu"; remove primary links to global wallets/transactions/categories/savings/receipts/notifications detail pages.
- [x] 6.2 Refactor `src/components/admin/FinanceAdminDashboard.tsx` route parsing to support `/admin/finance/users/:userId` and `/admin/finance/users/:userId/:section`.
- [x] 6.3 Create a user workspace header component in `src/components/admin/` showing breadcrumb, user email/name, role, currency, setup status, and latest activity.
- [x] 6.4 Create a user workspace tab nav component with routes: overview, wallets, transactions, categories, budgets, savings, receipts, ai, notifications.
- [x] 6.5 Update the user list section so clicking a user opens `/admin/finance/users/:id` instead of exposing finance detail actions inline.
- [x] 6.6 Implement user workspace overview using `getAdminUserProfile` and `getAdminUserWorkspaceOverview`.
- [x] 6.7 Implement the wallets tab using only `getAdminUserWallets`.
- [x] 6.8 Implement the transactions tab using only `getAdminUserTransactions`.
- [x] 6.9 Implement the categories and jars tab using `getAdminUserCategories` and `getAdminUserBudgets`.
- [x] 6.10 Implement the savings tab using only `getAdminUserSavings`.
- [x] 6.11 Implement the receipts/OCR tab using only `getAdminUserReceipts`.
- [x] 6.12 Implement the AI/chat tab using only `getAdminUserAiLogs`; if no logs exist, show a selected-user empty state.
- [x] 6.13 Implement the notifications tab using only `getAdminUserNotifications`.
- [x] 6.14 Ensure every user workspace empty state mentions "người dùng này" or equivalent selected-user wording.
- [x] 6.15 Ensure `src/app/(payload)/custom.scss` supports breadcrumbs, tabs, user profile header, high-contrast scoped filters, and responsive layout at 375px, 768px, 1024px, and 1440px.
- [x] 6.16 Run `cmd /c npm run generate:importmap` if any Payload admin component paths are added to config or referenced by Payload import map.

## 7. Remove Primary Global Detail Browsing

- [x] 7.1 In `FinanceAdminDashboard`, ensure direct sections `wallets`, `transactions`, `categories`, `savings`, `receipts`, `notifications`, and `ai` without a `userId` no longer render full global detail tables.
- [x] 7.2 Replace those direct global sections with a redirect-like admin message or links to `/admin/finance/users`, unless the section is aggregate data quality.
- [x] 7.3 Keep `/admin` overview privacy-safe: no full cross-user transaction/wallet/receipt rows.
- [x] 7.4 Update data-quality warnings to link to user workspace routes when a user relationship is known.

## 8. Documentation

- [x] 8.1 Update `SYSTEM_PAGE_FUNCTION_MAP.md` with `/admin/finance/users`, `/admin/finance/users/:userId`, and all child user workspace routes.
- [x] 8.2 Update `SYSTEM_PAGE_FUNCTION_MAP.md` API section with `/api/admin/users/:id/*` nested endpoints and de-emphasize old top-level global detail endpoints.
- [x] 8.3 Update `ADMIN_OPERATIONS.md` to document the user-first support workflow, privacy boundaries, and AI/chat redaction behavior.
- [x] 8.4 Document session limitation: admin and normal user sessions currently share Payload cookie on the same domain, so same-browser simultaneous separate accounts are not guaranteed.

## 9. Tests And Verification

- [x] 9.1 Add or update `tests/int/admin-api.int.spec.ts` tests for each nested route category: profile, summary, wallets, transactions, categories, budgets, savings, receipts, notifications, AI logs.
- [x] 9.2 Add a cross-user isolation test: user A endpoint must not return user B wallets, transactions, categories, budgets, savings, receipts, notifications, or AI logs.
- [x] 9.3 Add tests proving non-admin and anonymous requests cannot call nested admin endpoints.
- [x] 9.4 Add tests for AI/advisor audit helper or route behavior: success log and error log.
- [x] 9.5 Run `cmd /c npm run generate:types` if not already run after schema changes.
- [x] 9.6 Run `cmd /c npm run generate:importmap` if admin component imports changed.
- [x] 9.7 Run `cmd /c npx tsc --noEmit`.
- [x] 9.8 Run `cmd /c npx vitest run tests/int/admin-api.int.spec.ts --config ./vitest.config.mts`.
- [x] 9.9 If AI audit tests are in a different file, run that targeted Vitest file as well.
- [x] 9.10 With the dev server running, manually check `/admin`, `/admin/finance/users`, and at least one `/admin/finance/users/:userId/transactions` route.

## 10. Final Review

- [x] 10.1 Confirm no primary admin navigation link opens global sensitive finance rows.
- [x] 10.2 Confirm all user-owned detail tables are under `/admin/finance/users/:userId`.
- [x] 10.3 Confirm UI text is Vietnamese and readable.
- [x] 10.4 Confirm admin account cannot use normal `/dashboard` user app flow.
- [x] 10.5 Confirm final response lists changed files, verification commands, and any unresolved open questions.
