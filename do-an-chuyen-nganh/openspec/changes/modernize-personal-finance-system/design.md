## Context

FinTrack is a Next.js App Router + Payload CMS personal finance app. The current code registers `users`, `media`, `categories`, `transactions`, and `budgets`, while the live Postgres database also contains `wallets`, `receipts`, `receipt_parse_sessions`, `receipt_parser_results`, `savings_goals`, and `notifications`. This creates a mismatch between product intent, database state, and application behavior.

The target product is a user-private personal expense system inspired by Money Lover/Timo: users manage their own wallets, monthly spending limit, category spending jars, transactions from manual/chatbot/OCR flows, receipt history, and reports. Payload admin remains an operational surface for system administration, not a normal user experience.

UI/UX guidance from `ui-ux-pro-max` for this fintech dashboard change:

- Use a restrained professional finance UI with high readability, clear hierarchy, visible focus states, and predictable dashboard workflows.
- Use a consistent SVG icon set; do not use emoji as UI icons.
- Avoid layout shifts on hover; use color, border, opacity, and subtle shadow transitions.
- Reports should prioritize wallet balance, spending-vs-limit, category budget progress, daily cashflow, and source-type breakdown.
- Next.js implementation should favor server-side data loading for read views and server actions or well-scoped API routes for mutations.

## Goals / Non-Goals

**Goals:**

- Make user/admin access boundaries explicit and safe.
- Register and use wallets as first-class data for balances, default wallet, savings wallet, and transaction source.
- Treat budgets as per-user category spending jars that synchronize with monthly spending limits.
- Clean categories into curated system categories plus private user categories.
- Prevent chatbot and OCR from auto-creating categories.
- Preserve receipt/OCR review history and expose receipt review from transactions.
- Centralize finance reporting logic and optimize chart data retrieval.
- Provide implementation tasks that can be executed in phases without breaking existing data unexpectedly.

**Non-Goals:**

- Rebuild the full visual design system from scratch.
- Implement bank synchronization or external payment account integration.
- Implement multi-user shared savings goals in the first pass.
- Replace Payload CMS with a different backend.
- Delete production data without a dry-run migration and rollback plan.

## Decisions

### Decision 1: Keep one `users` collection but enforce role boundaries

Normal users and admins will remain in `users` for this change, but admin access will be restricted by `role === "admin"` and the `role` field will be writable only by admins.

Alternative considered: create a separate `admins` collection. This gives cleaner separation but increases auth and migration scope. The single-collection approach is safer for this staged modernization.

### Decision 2: Add `Wallets` as a Payload collection over the existing `wallets` table

The existing database already has user-owned wallets. The application will register `Wallets` and make `wallet` required for new transactions. Existing transactions without `wallet_id` will be backfilled to each user's default wallet.

Alternative considered: continue storing balance on `users`. This would not support multiple wallets or savings wallets and would not match the existing DB.

### Decision 3: Use `Budgets` as category spending jars

`budgets` is empty and already relates user/category/amount/period. It will be extended to represent monthly category jars with optional wallet, note, month/year, alert thresholds, and active state.

Alternative considered: store budget limits directly on categories. That would mix reusable category definitions with month/user-specific budget data and would make historical reporting harder.

### Decision 4: Normalize categories through migration, not ad hoc UI deletion

The category table has system, user, test, OCR, and malformed records. Migration will create a curated system category set, remap transaction category IDs to canonical categories, then archive or delete obsolete categories only after transaction counts are safe.

Alternative considered: hard-delete unwanted categories from admin. That risks orphaning or rewriting transaction history unpredictably.

### Decision 5: AI flows select categories, never create them

Chatbot and OCR will receive/see only valid allowed categories. If the suggested category is absent or ambiguous, the user must choose an existing category manually.

Alternative considered: keep auto-creating categories. This is the current source of category pollution and conflicts with the user's requirement.

### Decision 6: Receipt history uses dedicated receipt/parse data when possible

The app will integrate existing `receipts`, `receipt_parse_sessions`, and `receipt_parser_results` tables or equivalent Payload collections to preserve OCR audit data. Transaction receipt review will show image, merchant, totals, raw/normalized OCR details, and user-reviewed fields.

Alternative considered: only store receipt image in `media`. That is simpler but loses OCR audit and test evidence.

### Decision 7: Reports use a shared finance stats layer

Dashboard, reports, advisor context, and stats APIs will consume shared finance aggregation functions. These functions will query by user/date/wallet/category/source and return chart-ready data.

Alternative considered: keep per-page aggregation. This has already caused repeated logic and inefficient per-month queries.

### Decision 8: Savings starts as savings wallets

The first implementation will prioritize `walletType = savings` over group savings goals. Existing `savings_goals` can be registered later if group goals remain required.

Alternative considered: complete group savings first. That is less aligned with the user's immediate request for wallet balance and personal savings.

## Risks / Trade-offs

- Category migration can rewrite historical category references → Mitigate with dry-run output, backup/export, mapping table, and rollback SQL.
- Existing transactions may not have wallets → Backfill with user default wallets before requiring wallet in UI/API.
- Payload schema may not exactly match live DB columns → Inspect generated schema and migrations before enabling `push` or applying DB changes.
- Tight admin restrictions can lock out current admins if roles are wrong → Identify and verify at least one admin account before deployment.
- Receipt tables may be older/partial design → Integrate incrementally and keep current OCR confirm route working until receipt history is verified.
- UI modernization can grow scope → Limit first pass to workflow screens and component patterns needed for wallets, jars, transactions, OCR review, and reports.
- Recomputing wallet balances from transactions vs storing balances can diverge → Define wallet balance as stored current balance plus transaction updates, with a reconciliation report available for admin/debug.

## Migration Plan

1. Export `users`, `wallets`, `categories`, `transactions`, `receipts`, and OCR tables.
2. Verify admin users and lock down `role` access.
3. Add Payload collections/fields for wallets and transaction wallet/source/receipt references.
4. Backfill missing wallets and transaction `wallet_id`.
5. Create canonical system categories.
6. Dry-run category mapping and print affected transaction counts.
7. Apply category remap and archive/delete obsolete zero-use categories.
8. Disable category auto-creation in chatbot/OCR flows.
9. Enable wallet onboarding and spending jar UI.
10. Replace duplicated reports with shared aggregation.
11. Run `pnpm run generate:types`, `tsc --noEmit`, integration tests, and e2e tests.

Rollback strategy:

- Keep pre-migration exports.
- Store category mapping in a migration artifact.
- Make destructive category deletion a separate final step after validation.
- Deploy schema additions before UI behavior that requires the new fields.

## Open Questions

- Should `wallet.balance` be treated as user-entered current balance, transaction-derived balance, or a reconciled stored value?
- Should the first implementation hide `/savings` group goals completely or keep it behind a disabled/experimental state?
- Which icon set should be standardized: lucide or Material icons? The UI should use one set consistently.
- Should category budgets be recurring monthly templates or concrete month/year budget records?
- Should receipt images remain in `media`, move to `receipts`, or keep both with `receipts` referencing media?
