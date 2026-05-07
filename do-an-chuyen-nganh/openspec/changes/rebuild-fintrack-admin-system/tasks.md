## 1. Admin Access Foundation

- [x] 1.1 Verify Payload `admin` access only allows authenticated users with `role = admin`
- [x] 1.2 Add or centralize an `isAdminUser` / `requireAdmin` helper for admin routes and admin server code
- [x] 1.3 Audit `Users.role` field create/update access and confirm normal users cannot set or change admin role
- [x] 1.4 Add tests or route checks proving normal users cannot access `/admin` or `/api/admin/*`

## 2. Admin API Contracts

- [x] 2.1 Create admin API response types for KPI cards, paginated tables, detail summaries, and data-quality findings
- [x] 2.2 Implement `GET /api/admin/overview` with user, wallet, transaction, budget, savings, OCR, AI, and warning counts
- [x] 2.3 Implement `GET /api/admin/users` with role/setup/activity filters and pagination
- [x] 2.4 Implement `GET /api/admin/users/[id]/finance-summary` with bounded wallet, transaction, budget, savings, and OCR summaries
- [x] 2.5 Implement `GET /api/admin/wallets` with user/type/default/active filters and pagination
- [x] 2.6 Implement `GET /api/admin/transactions` with user, wallet, type, category, source, date, amount, and search filters
- [x] 2.7 Implement `GET /api/admin/categories` with system/user category separation and duplicate warning metadata
- [x] 2.8 Implement `GET /api/admin/budgets` with jar usage summary fields
- [x] 2.9 Implement `GET /api/admin/savings` for savings goals and contributions if savings remains enabled
- [x] 2.10 Implement `GET /api/admin/receipts` and `GET /api/admin/receipts/[id]` using available transaction/media/OCR data
- [x] 2.11 Implement `GET /api/admin/notifications` with recipient/type/read filters
- [x] 2.12 Implement `GET /api/admin/data-quality` for wallet, transaction, category, budget, receipt, media, and savings warnings
- [x] 2.13 Implement `POST /api/admin/data-quality/recheck` or document why live checks make this unnecessary

## 3. Admin Information Architecture

- [x] 3.1 Decide whether rebuilt admin lives as Payload custom views only or under a dedicated `/admin/finance` custom landing
- [x] 3.2 Define admin navigation groups: Overview, Users, Wallets, Transactions, Categories & Jars, Savings, Receipts & OCR, AI Advisor, Notifications, Data Quality, System Settings
- [x] 3.3 Configure Payload admin components/navigation to expose finance-domain modules instead of relying only on raw collection links
- [x] 3.4 Keep raw collection access available for admins where useful, but place high-risk collection links behind clear labels

## 4. Admin Design System

- [x] 4.1 Add admin UI tokens or CSS classes for dense finance dashboard layout using neutral surfaces and blue action accent
- [x] 4.2 Standardize admin typography scale, compact table spacing, KPI card dimensions, and filter bar layout
- [x] 4.3 Use Lucide or the existing SVG icon system consistently; remove emoji iconography from admin surfaces
- [x] 4.4 Add accessible focus, hover, loading, empty, error, and disabled states for admin controls
- [x] 4.5 Fix mojibake labels in admin-facing collection labels or admin custom UI text touched by this change

## 5. Admin Shared Components

- [x] 5.1 Build `AdminKpiCard` or equivalent compact metric component
- [x] 5.2 Build `AdminFilterBar` with search, select filters, date range, reset, and submit behavior
- [x] 5.3 Build `AdminDataTable` pattern with pagination, row hover, bounded columns, and empty state
- [x] 5.4 Build `AdminDetailDrawer` or equivalent detail panel for user, transaction, wallet, receipt, and warning details
- [x] 5.5 Build `AdminConfirmDialog` for high-risk role, delete, and finance-data edits
- [x] 5.6 Build `AdminStatusBadge` for role, source type, wallet type, budget state, OCR status, and notification state

## 6. Overview Module

- [x] 6.1 Create admin Overview page/view wired to `/api/admin/overview`
- [x] 6.2 Display KPI cards for users, wallet balance, income, expense, net cashflow, transaction count, OCR count, and warning count
- [x] 6.3 Add compact charts for cashflow trend, transaction source mix, and budget warning distribution
- [x] 6.4 Add recent activity panels for latest transactions, failed/unresolved OCR, and data-quality warnings

## 7. Users And Wallets Modules

- [x] 7.1 Create Users admin module wired to `/api/admin/users`
- [x] 7.2 Add user filters for role, setup status, created date, and activity state
- [x] 7.3 Add user finance summary detail wired to `/api/admin/users/[id]/finance-summary`
- [x] 7.4 Add guarded admin role-change flow with explicit confirmation
- [x] 7.5 Create Wallets admin module wired to `/api/admin/wallets`
- [x] 7.6 Add wallet filters for owner, wallet type, default status, active status, and currency
- [x] 7.7 Show wallet setup warnings for users without default wallets

## 8. Transactions Module

- [x] 8.1 Create Transactions admin module wired to `/api/admin/transactions`
- [x] 8.2 Add filters for user, wallet, type, category, sourceType, date range, amount range, and search
- [x] 8.3 Add transaction table columns for date, owner, wallet, type, amount, category, source, merchant, and receipt state
- [x] 8.4 Add transaction detail drawer with wallet/category/source/receipt/savings context
- [x] 8.5 Gate any transaction edit/delete admin action behind confirmation and schema validation

## 9. Categories, Budgets, And Savings Modules

- [x] 9.1 Create Categories & Jars admin module wired to `/api/admin/categories` and `/api/admin/budgets`
- [x] 9.2 Separate system/default categories from user-owned categories in the admin UI
- [x] 9.3 Show duplicate/suspicious category warnings and category type mismatch warnings
- [x] 9.4 Show jar usage with spent, limit, remaining, and percentage progress
- [x] 9.5 Create Savings admin module wired to `/api/admin/savings` if savings remains in scope
- [x] 9.6 Unhide or custom-expose savings goals and savings contributions for admins if savings remains in scope
- [x] 9.7 Show savings consistency warnings between goals and contributions when detectable

## 10. Receipts, OCR, AI, Notifications, And Data Quality

- [x] 10.1 Create Receipts & OCR admin module wired to `/api/admin/receipts`
- [x] 10.2 Add receipt filters for user, date range, source type, parse/review state, merchant, and amount
- [x] 10.3 Add receipt detail view showing image, transaction, parsed fields, reviewed fields, and available OCR metadata
- [x] 10.4 Create AI Advisor admin module showing service status and privacy-safe diagnostics from available data
- [x] 10.5 Create Notifications admin module wired to `/api/admin/notifications`
- [x] 10.6 Create Data Quality admin module wired to `/api/admin/data-quality`
- [x] 10.7 Add warning detail views and clear next-step labels for each data-quality finding

## 11. Documentation, Types, And Verification

- [x] 11.1 Update `SYSTEM_PAGE_FUNCTION_MAP.md` with admin modules, APIs, data dependencies, and performance notes
- [x] 11.2 Update or add admin-facing documentation for role separation and operational modules
- [x] 11.3 Run `npm run generate:importmap` after creating or changing Payload admin components
- [x] 11.4 Run `npm run generate:types` after any schema or collection visibility changes
- [x] 11.5 Run `tsc --noEmit` to validate TypeScript correctness
- [x] 11.6 Add or update integration tests for admin API authorization and representative dashboard/table responses
- [x] 11.7 Run targeted tests for admin access, admin APIs, and finance data-quality helpers
