## Why

The current admin rebuild exposes finance modules as global tables, which is the wrong model for a personal finance product. Wallets, transactions, categories, jars, savings, receipts, notifications, and AI/chat activity belong to individual users, so admin support must first select a user and then inspect that user's private finance workspace.

This change fixes the admin information architecture so sensitive user-owned data is no longer browsed as top-level global admin modules, while still preserving aggregate operational dashboards and data-quality checks.

## What Changes

- Replace module-first admin navigation with user-first navigation:
  - `/admin` remains an operational overview with aggregate counts and warnings only.
  - `/admin/finance/users` becomes the primary entry point.
  - User-owned finance details move under `/admin/finance/users/:userId/...`.
- Add user-scoped admin APIs for wallets, transactions, categories, jars/budgets, savings, receipts, notifications, and AI/chat logs.
- Keep global finance APIs only for aggregate overview and data-quality diagnostics, not for default detail browsing.
- Add a user finance workspace UI with profile header, KPI summary, tabs, scoped filters, and tables.
- Add privacy-safe AI/chat audit support:
  - If chat/advisor logs are not persisted, show an explicit empty state and create the data model/spec/tasks to persist them.
  - Admin should see redacted/summarized logs by default, not unrestricted private prompt contents.
- Preserve admin/user separation:
  - Admin accounts use `/admin`.
  - Normal user accounts use the application pages.
  - Existing session/cookie behavior must not allow admin data leaks or ordinary-user admin access.
- Update documentation and page maps so future agents do not rediscover the intended admin model.

## Capabilities

### New Capabilities
- `user-centric-admin-workspace`: Defines the admin workflow where support selects a user before viewing user-owned finance data.
- `admin-user-finance-apis`: Defines narrow admin API contracts for user-scoped finance resources.
- `admin-ai-chat-audit`: Defines persisted, privacy-safe AI/advisor/chat audit data and admin access behavior.

### Modified Capabilities
- `user-admin-separation`: Clarifies that admin and system user surfaces are separate, and that admin must not operate as a normal finance user.
- `system-page-function-map`: Updates documented admin page/API responsibilities to the user-centric admin model.
- `finance-ui-experience`: Adds UI requirements for the admin user workspace and requires `ui-ux-pro-max` before UI implementation.

## Impact

- Affected admin UI files:
  - `src/components/admin/FinanceAdminDashboard.tsx`
  - `src/components/admin/FinanceAdminNavLinks.tsx`
  - `src/components/admin/AdminDataTable.tsx`
  - `src/components/admin/AdminFilterBar.tsx`
  - `src/app/(payload)/custom.scss`
- Affected admin API/service files:
  - `src/app/api/admin/[...path]/route.ts`
  - `src/lib/admin/service.ts`
  - `src/lib/admin/types.ts`
  - `src/lib/admin/auth.ts`
- Likely new admin components:
  - user workspace shell
  - user profile summary
  - user workspace tab nav
  - finance resource panels/tables
  - privacy-safe AI/chat log table
- Likely new Payload collection for AI/chat audit:
  - `src/collections/AIChatLogs.ts` or equivalent
  - `src/payload.config.ts`
  - `src/payload-types.ts`
  - `src/payload-generated-schema.ts`
- Affected AI routes:
  - `src/app/api/ai/advisor/route.ts`
  - potentially `src/app/(frontend)/chat/ChatClient.tsx` if persisted chat/advisor logs are introduced.
- Documentation:
  - `SYSTEM_PAGE_FUNCTION_MAP.md`
  - `ADMIN_OPERATIONS.md`
- Verification:
  - `npm run generate:types` if schemas change.
  - `npm run generate:importmap` if Payload admin component paths change.
  - `npx tsc --noEmit`
  - targeted Vitest tests for admin API scoping and AI/chat log persistence.
