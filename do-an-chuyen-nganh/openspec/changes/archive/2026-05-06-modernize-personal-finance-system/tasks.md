## 1. Security And Access Boundaries

- [x] 1.1 Create shared access helpers for admin-only, authenticated, owner-only, and admin-or-owner checks.
- [x] 1.2 Restrict Payload admin access to authenticated users with `role === "admin"`.
- [x] 1.3 Protect the `users.role` field so only admins can create or update admin roles.
- [x] 1.4 Update registration flow so client-submitted roles are ignored and new accounts are always normal users.
- [x] 1.5 Restrict normal users to reading and updating only their own profile data.
- [x] 1.6 Lock down or remove development routes such as `/my-route` and make `/api/seed` admin-only or migration-only.
- [x] 1.7 Add tests proving normal users cannot access admin, self-promote role, or read another user's private profile.

## 2. Payload Schema Alignment

- [x] 2.1 Add a `Wallets` collection matching the existing `wallets` table and register it in `payload.config.ts`.
- [x] 2.2 Update `Transactions` with `wallet`, `savingsGoal`, `sourceType`, `sourceRefId`, existing receipt relation fields, and ownership/type validations.
- [x] 2.3 Extend `Budgets` to support wallet, month/year or recurring period, note, alert thresholds, and active state for category jars.
- [x] 2.4 Decide whether `Receipts`, `ReceiptParseSessions`, and `ReceiptParserResults` become Payload collections or service-level database models.
- [x] 2.5 Register `Notifications` only if budget alert persistence is implemented in this change.
- [x] 2.6 Keep `SavingsGoals` disabled or experimental unless group savings is explicitly reintroduced.
- [x] 2.7 Run `pnpm run generate:types` after schema changes.
- [x] 2.8 Run `tsc --noEmit` and fix generated type/schema errors.

## 3. Data Migration And Cleanup

- [x] 3.1 Export or back up `users`, `wallets`, `categories`, `transactions`, `receipts`, and OCR tables before migration.
- [x] 3.2 Create canonical system categories for expense and income using one consistent SVG icon naming convention.
- [x] 3.3 Write a category cleanup dry-run script that prints old category IDs, target category IDs, and affected transaction counts.
- [x] 3.4 Apply approved category remapping so transactions point to canonical categories.
- [x] 3.5 Archive or delete obsolete categories only after they have no remaining transactions.
- [x] 3.6 Backfill missing default wallets for users without one.
- [x] 3.7 Backfill `transactions.wallet` for existing transactions using the user's default wallet.
- [x] 3.8 Normalize legacy transaction source values to `manual`, `chatbot`, `receipt_ai`, `transfer`, or `adjustment`.
- [x] 3.9 Add migration verification queries for category counts, orphaned transactions, missing wallets, and invalid category/type combinations.

## 4. Wallet And Onboarding Flow

- [x] 4.1 Add wallet service functions for listing user wallets, resolving default wallet, and creating initial wallets.
- [x] 4.2 Add first-login setup detection for missing default wallet or missing monthly spending limit.
- [x] 4.3 Build wallet setup UI for initial balance, currency, default wallet name, and monthly spending limit.
- [x] 4.4 Add savings wallet creation UI and keep savings balances visually separate from spending wallets.
- [x] 4.5 Ensure all wallet UI follows the selected professional finance design pattern with consistent SVG icons and accessible form controls.
- [x] 4.6 Add tests for wallet ownership, default wallet creation, monthly spending validation, and savings wallet visibility.

## 5. Category Jars And Budget Alerts

- [x] 5.1 Refactor the categories page into a "Danh mục & hũ chi tiêu" workflow.
- [x] 5.2 Show system categories and private user categories without exposing other users' private categories.
- [x] 5.3 Add UI to create and edit private user categories with name, note, icon, and color.
- [x] 5.4 Add UI to set monthly category jar limits per wallet/category.
- [x] 5.5 Validate total active category jar limits against the wallet monthly spending limit.
- [x] 5.6 Display spent, limit, remaining, and percentage for each category jar.
- [x] 5.7 Implement warning states for 80 percent and 100 percent category jar usage.
- [x] 5.8 Add notification persistence for budget warnings if `Notifications` is enabled.
- [x] 5.9 Add integration tests for category visibility, jar creation, monthly allocation validation, and overspending warnings.

## 6. Transaction Ledger

- [x] 6.1 Update transaction list server loading to support month, wallet, type, category, source type, and search filters.
- [x] 6.2 Update transaction create/edit UI to include wallet selection and source-aware receipt display.
- [x] 6.3 Prevent users from choosing categories that do not match the selected transaction type.
- [x] 6.4 Validate transaction wallet/category ownership in collection hooks or server-side mutation logic.
- [x] 6.5 Update wallet balance or reporting inputs when transactions are created, edited, or deleted according to the chosen balance model.
- [x] 6.6 Add "Xem hóa đơn" action for OCR transactions with receipt links.
- [x] 6.7 Add tests for transaction ownership, wallet validation, category type validation, edit behavior, and filter results.

## 7. Chatbot Flow

- [x] 7.1 Remove chatbot logic that creates categories automatically.
- [x] 7.2 Update chatbot confirmation so unmatched categories require choosing from existing allowed categories.
- [x] 7.3 Save chatbot-created transactions with `sourceType = chatbot` and the user's selected or default wallet.
- [x] 7.4 Remove or implement `/api/ai/learn`; avoid silent failed calls.
- [x] 7.5 Restrict the AI proxy to authenticated users and whitelisted paths.
- [x] 7.6 Add tests for chatbot unmatched-category flow and source tracking.

## 8. OCR Receipt Flow

- [x] 8.1 Ensure OCR parse sends only allowed user-visible expense categories to the AI service.
- [x] 8.2 Require user category selection when OCR cannot resolve a valid allowed category.
- [x] 8.3 Update OCR confirm to save wallet, receipt reference, source type, and source reference.
- [x] 8.4 Persist OCR audit data in receipt/parse tables or equivalent Payload collections.
- [x] 8.5 Add receipt detail modal or page showing image, merchant, date, total, line items/raw OCR, and reviewed fields.
- [x] 8.6 Ensure receipt media/details are private to the owning user or admins.
- [x] 8.7 Add tests for OCR allowed categories, confirm success, confirm cleanup failure path, and receipt access control.

## 9. Finance Reporting And Charts

- [x] 9.1 Create a shared finance stats module for dashboard, reports, stats APIs, and advisor context.
- [x] 9.2 Replace repeated per-page/per-month aggregation with set-based user/date/wallet/category/source aggregation.
- [x] 9.3 Update dashboard to show wallet balances, monthly spending limit, spent amount, remaining amount, jar warnings, and recent transactions.
- [x] 9.4 Update reports to show wallet balance summary, income/expense, savings wallet balances, category breakdown, source type breakdown, and category jar usage.
- [x] 9.5 Use chart types appropriate for finance decisions: spending-vs-limit progress, category budget progress, daily cashflow, wallet balance trend, and expense by category.
- [x] 9.6 Add database indexes or query optimizations for user/date/wallet/category/source access patterns.
- [x] 9.7 Add tests proving dashboard, reports, and advisor context return matching totals for the same period.

## 10. UI/UX Quality Pass

- [x] 10.1 Standardize on one SVG icon set and remove emoji icons from user-facing UI controls and category displays.
- [x] 10.2 Review dashboard, categories/jars, transactions, OCR review, reports, login, and register for mobile widths 375px, 768px, 1024px, and 1440px.
- [x] 10.3 Add visible focus states for keyboard navigation on buttons, links, form inputs, selects, tabs, and modals.
- [x] 10.4 Ensure hover states do not cause layout shift and use 150-300ms transitions.
- [x] 10.5 Ensure charts, cards, tables, and modals do not overflow on mobile.
- [x] 10.6 Verify finance UI copy clearly distinguishes wallet balance, spending limit, spent amount, savings, and expenses.

## 11. Verification And Release

- [x] 11.1 Run `pnpm run generate:types`.
- [x] 11.2 Run `pnpm run generate:importmap` if Payload admin components are created or changed.
- [x] 11.3 Run `tsc --noEmit`.
- [x] 11.4 Run `pnpm run test:int`.
- [x] 11.5 Run `pnpm run test:e2e`.
- [x] 11.6 Perform manual migration dry-run against the configured database and save the output.
- [x] 11.7 Document rollback steps and final data validation queries.
- [x] 11.8 Update `SYSTEM_ADJUSTMENT_IMPLEMENTATION_PLAN.md` if implementation decisions differ from this OpenSpec design.
