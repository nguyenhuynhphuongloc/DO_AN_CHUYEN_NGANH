## Why

FinTrack currently has the foundation of a personal expense tracker, but the code, Payload schema, and real database have drifted: wallets, receipts, savings, and notifications exist in the database but are not fully represented in the application, while categories contain mixed system, user, test, OCR, and malformed data. This change modernizes the system into a clearer Money Lover/Timo-style personal finance product where each user manages private wallets, spending jars, transactions, OCR receipts, and reports while admin remains a separate operational surface.

## What Changes

- Separate user-facing authentication and admin access so normal users cannot enter Payload admin or modify privileged fields.
- Add first-class wallet support using the existing `wallets` table so every user has private wallet balances, a default wallet, and optional savings wallets.
- Convert `budgets` into user-private category spending jars with monthly limits, notes, alert thresholds, and validation against the user's monthly spending limit.
- Clean and normalize categories into a curated system category set plus private user categories; remove or archive test/OCR/debug category records after remapping transactions.
- Update transaction creation/editing to require a wallet, enforce category ownership/type validity, track source type (`manual`, `chatbot`, `receipt_ai`, `transfer`, `adjustment`), and preserve receipt references.
- Change chatbot and OCR flows so they only select from existing valid categories and never auto-create categories.
- Integrate receipt viewing and OCR audit data by using existing receipt/parse tables or equivalent Payload collections.
- Redesign the dashboard, category jars, transaction list, OCR review, and reports UI around wallet balance, monthly spending limit, category budget progress, source type, and receipt history.
- Optimize reports and charts with shared finance statistics services and aggregate queries instead of repeated per-month/per-page logic.
- Add tests for access control, wallet ownership, category cleanup behavior, transaction validation, OCR confirm, and report totals.
- **BREAKING**: Category IDs and names may be remapped during migration; code must stop relying on historical category records being stable.
- **BREAKING**: Transactions must be associated with a wallet after migration.
- **BREAKING**: Chatbot and OCR no longer create categories automatically.

## Capabilities

### New Capabilities

- `user-admin-separation`: User/admin access boundaries, role safety, and private profile management.
- `wallet-management`: User-private wallets, default wallet setup, savings wallets, balances, and monthly spending limits.
- `category-spending-jars`: System categories, user categories, category budgets/jars, monthly allocation rules, and budget alerts.
- `transaction-ledger`: Wallet-backed transactions with source tracking, category validation, editing, and receipt links.
- `receipt-review-history`: OCR receipt storage, parse audit, confirmation workflow, and transaction receipt review.
- `finance-reporting`: Dashboard and report metrics for wallets, spending limits, category budgets, source types, and optimized charts.
- `finance-ui-experience`: User-facing UI/UX requirements for onboarding, dashboard, jars, transactions, OCR review, reports, and responsive/accessibility rules.

### Modified Capabilities

- None. There are no baseline specs in `openspec/specs/`; this change introduces the formal capability contracts.

## Impact

- Payload collections: `Users`, `Categories`, `Transactions`, `Budgets`, new `Wallets`, and optional registration of `Receipts`, `ReceiptParseSessions`, `ReceiptParserResults`, `SavingsGoals`, `Notifications`.
- Database: existing Neon/Postgres tables `wallets`, `transactions`, `categories`, `budgets`, `receipts`, `receipt_parse_sessions`, `receipt_parser_results`, `notifications`, and `savings_goals`.
- Data migration: category cleanup/remapping, default wallet assignment for existing transactions, source type normalization, and optional archival of obsolete categories.
- Frontend routes: `/`, `/transactions`, `/categories`, `/reports`, `/scan`, `/chat`, `/savings`, `/auth/login`, `/auth/register`.
- API routes: Payload REST routes, `/api/categories`, `/api/ai/*`, `/api/ai/ocr/receipt`, `/api/ai/ocr/receipt/confirm`, `/api/stats`, `/api/stats/chart`, and seed/dev routes.
- AI service: NLP parse and receipt OCR category selection must use allowed categories only.
- UI stack: Next.js App Router, React, existing CSS, icon library standardization, Recharts.
- Tests: integration and e2e coverage for security, migrations, wallet/category/transaction behavior, OCR, and reporting.
