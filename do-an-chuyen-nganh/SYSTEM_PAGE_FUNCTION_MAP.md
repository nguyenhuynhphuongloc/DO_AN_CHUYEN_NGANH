# System Page Function Map

This document maps FinTrack's primary user-facing pages to their visible functions, user interactions, API routes, data dependencies, and performance notes. Update this file whenever a primary route or page workflow changes.

## Route Overview

| Route | Page | Main Purpose | Primary Component |
| --- | --- | --- | --- |
| `/` | Root redirect | Redirect users to `/dashboard` | `src/app/(frontend)/page.tsx` |
| `/dashboard` | Tổng quan | Show wallet, spending, savings, budget, chart, and recent transaction summary | `src/app/(frontend)/dashboard/page.tsx`, `DashboardClient.tsx` |
| `/transactions` | Giao dịch | List, filter, create, edit, delete, and inspect transactions | `transactions/page.tsx`, `TransactionsClient.tsx` |
| `/categories` | Danh mục & hũ chi tiêu | Manage categories and monthly category spending jars | `categories/page.tsx`, `CategoriesClient.tsx` |
| `/reports` | Báo cáo và thống kê | Show finance charts, category breakdowns, source breakdowns, and jar usage | `reports/page.tsx`, `ReportsClient.tsx` |
| `/savings` | Mục tiêu tiết kiệm | Manage savings goals and savings contributions | `savings/page.tsx`, `SavingsClientComponent.tsx` |
| `/chat` | Trợ lý AI | Parse natural language transactions and request financial advice | `chat/page.tsx`, `ChatClient.tsx` |
| `/scan` | Quét hóa đơn | Upload receipt images, run OCR, review, and confirm transactions | `scan/page.tsx`, `ScanClient.tsx` |
| `/receipts/[id]` | Chi tiết hóa đơn | View receipt details linked to OCR-created transactions | `receipts/[id]/page.tsx` |
| `/setup` | Thiết lập dòng tiền cá nhân | Create initial spending wallet, monthly limit, and optional savings wallet | `setup/page.tsx`, `SetupClient.tsx` |
| `/auth/login` | Đăng nhập | Authenticate user and route to dashboard | `auth/login/page.tsx` |
| `/auth/register` | Đăng ký | Register user, log in, and route to dashboard | `auth/register/page.tsx` |

## Shared Navigation And Session Behavior

- `Sidebar` renders navigation links for dashboard, transactions, categories, reports, savings, chat, and scan.
- Authenticated pages call Payload auth from request headers and redirect unauthenticated users to `/auth/login`.
- Most finance pages call wallet setup state and redirect incomplete users to `/setup`.
- Root `/` redirects to `/dashboard`.
- Logout calls `/api/users/logout` and routes to `/auth/login`.

Performance notes:

- In `next dev`, the first request to a page compiles that route and can take several seconds in Docker.
- Warmed pages should respond much faster after initial compilation.
- Remote Neon/Postgres adds network latency to every Payload query.
- Health checks should use `/api/health`, not authenticated frontend routes.

## `/dashboard` - Tổng quan

Purpose:

- Provide the user's monthly financial snapshot after login and wallet setup.

Visible functions:

- Show total balance, current month spending, remaining monthly limit, and savings balance.
- Show jar/budget warnings when category usage is near or over limit.
- Show six-month income/expense chart.
- Show category spending pie chart.
- Show recent transactions and source labels such as `OCR`, `Chatbot`, and `Nhập tay`.
- Link to `/transactions` for the full transaction list.

Data dependencies:

- Payload auth user.
- Wallet setup state from `getWalletSetupState`.
- Finance statistics from `getFinanceStats`.
- Month/year filters from query params.

Interactions:

- Change month/year using `MonthFilter`.
- Navigate to transaction list from recent transaction card.

Performance notes:

- Chart rendering uses Recharts on the client.
- Server data should come from shared aggregate services and avoid duplicated page queries.
- Month filter should preserve `/dashboard` and not redirect through `/`.

## `/transactions` - Giao dịch

Purpose:

- Manage the user's transaction ledger.

Visible functions:

- List transactions for selected month and year.
- Filter by wallet, type, category, source, and search text.
- Add manual transaction.
- Edit existing transaction.
- Delete transaction.
- View OCR receipt when a transaction has receipt media.

Data dependencies:

- Payload auth user.
- Wallet setup state.
- Transactions filtered by user, month/year, wallet, type, category, source, and search.
- Categories visible to the user.
- User wallets.

Interactions:

- Submit transaction form to `/api/transactions`.
- Patch transaction through `/api/transactions/[id]`.
- Delete transaction through `/api/transactions/[id]`.
- Navigate to `/receipts/[id]` for OCR receipt details.

Performance notes:

- Filter changes trigger route navigation with query params.
- Query field selection should be limited to table/form needs.

## `/categories` - Danh mục & hũ chi tiêu

Purpose:

- Manage system/user categories and monthly spending jars.

Visible functions:

- View system categories and user-created categories.
- Add a user category.
- Edit a user category.
- Delete a user category.
- Set or update monthly spending limit per expense category.
- Show spent amount, remaining amount, usage percentage, and warning states.

Data dependencies:

- Payload auth user.
- Wallet setup state and default wallet.
- Categories visible to the user.
- Active budgets for the current month/year.
- Current month expense transactions for spent-by-category calculation.

Interactions:

- Submit category form to `/api/categories`.
- Patch category through `/api/categories/[id]`.
- Delete category through `/api/categories/[id]`.
- Save jar limit through `/api/budgets`.

Performance notes:

- Categories, budgets, and current month transactions are independent after wallet setup and should load in parallel.
- Use `select`, `depth: 0`, and reasonable limits to avoid large Payload documents.

## `/reports` - Báo cáo và thống kê

Purpose:

- Provide chart-heavy finance reporting for wallets, categories, source types, and spending jars.

Visible functions:

- Show total income over 12 months.
- Show total expense over 12 months.
- Show net savings.
- Show current total balance.
- Show savings rate and monthly limit usage.
- Show income/expense trend chart.
- Show monthly income/expense comparison.
- Show category spending distribution.
- Show transaction source distribution.
- Show jar status table.
- Show category detail table.

Data dependencies:

- Payload auth user.
- Wallet setup state.
- Finance statistics from `getFinanceStats` with 12 chart months.

Interactions:

- Read-only page in current implementation.
- Navigation through sidebar.

Performance notes:

- Recharts makes the client bundle heavier.
- First compile in `next dev` can be slow.
- Use shared finance stats service and avoid per-chart duplicate queries.

## `/savings` - Mục tiêu tiết kiệm

Purpose:

- Manage user savings goals and contributions.

Visible functions:

- View savings goals.
- Create savings goal.
- Add savings contribution.
- Create related savings transaction.
- View notifications related to savings goals.

Data dependencies:

- Payload auth user.
- Savings goals for the current user.
- Users for shared/group goal UI.
- Notifications.
- Categories.

Interactions:

- Create goal through `/api/savings-goals`.
- Add contribution through `/api/transactions`.

Performance notes:

- This page has multiple server queries and should be audited for parallel fetching and field selection.

## `/chat` - Trợ lý AI

Purpose:

- Convert natural-language input into transactions and provide personal finance advice.

Visible functions:

- Enter free-form transaction text.
- Parse transaction text through AI NLP.
- Match parsed category against existing categories.
- Ask user to choose category when no match exists.
- Confirm and save transaction with `sourceType: chatbot`.
- Toggle between transaction input mode and advice mode.

Data dependencies:

- Payload auth user.
- Wallet setup state.
- User wallets and default wallet.
- Visible categories.

Interactions:

- Parse text through `/api/ai/nlp/parse`.
- Request advice through `/api/ai/advisor`.
- Save confirmed transaction through `/api/transactions`.

Performance notes:

- AI service latency is external to Next.js rendering.
- Category list should be loaded once and deduplicated client-side.

## `/scan` - Quét hóa đơn

Purpose:

- Run receipt OCR and save reviewed receipt transactions.

Visible functions:

- Upload receipt image.
- Send image to OCR service.
- Review parsed merchant, date, total, line items, and category.
- Confirm OCR result and save as transaction.
- Store receipt image/media for later review.

Data dependencies:

- Payload auth user.
- Wallet setup state.
- Visible categories.
- OCR service response.

Interactions:

- Upload and parse through `/api/ai/ocr/receipt`.
- Confirm and save through `/api/ai/ocr/receipt/confirm`.

Performance notes:

- OCR requests depend on the `receipt-ai` service and can be slower than normal page navigation.
- Page rendering and OCR action latency should be considered separately.

## `/receipts/[id]` - Chi tiết hóa đơn

Purpose:

- Display receipt details for a saved OCR transaction.

Visible functions:

- Show transaction linked to OCR source.
- Show receipt media and related receipt fields when available.

Data dependencies:

- Payload auth user.
- Transaction by ID.
- Receipt upload/media relation.

Interactions:

- Opened from transaction list when receipt link exists.

Performance notes:

- Should fetch only the selected transaction and receipt relation.

## `/setup` - Thiết lập dòng tiền cá nhân

Purpose:

- Complete first-time wallet and monthly spending setup.

Visible functions:

- Enter spending wallet name.
- Enter savings wallet name.
- Choose currency.
- Enter total balance.
- Enter monthly spending limit.
- Toggle savings wallet creation.
- Adjust spending and savings balances.
- Submit setup.

Data dependencies:

- Payload auth user.
- Existing wallet setup state.

Interactions:

- Submit to `/api/wallets/setup`.
- Redirect to `/dashboard` after successful setup.

Performance notes:

- This route should stay lightweight because it gates the rest of the app for new users.

## `/auth/login` - Đăng nhập

Purpose:

- Authenticate existing users.

Visible functions:

- Enter email.
- Enter password.
- Submit login.
- Navigate to register page.

Interactions:

- POST to `/api/users/login`.
- Redirect to `/dashboard` after login.

Performance notes:

- Should not load finance data before authentication succeeds.

## `/auth/register` - Đăng ký

Purpose:

- Create a new user account.

Visible functions:

- Enter email.
- Enter password.
- Create account.
- Auto-login after registration.
- Navigate to login page.

Interactions:

- POST to `/api/users`.
- POST to `/api/users/login`.
- Redirect to `/dashboard` after registration/login.

Performance notes:

- Should not load finance data before authentication succeeds.

## API Interaction Summary

| API Route | Used By | Purpose |
| --- | --- | --- |
| `/api/health` | Docker health check | Lightweight process health |
| `/api/users/login` | Login/register | Payload auth login |
| `/api/users/logout` | Sidebar logout | Payload auth logout |
| `/api/users` | Register | Create user account |
| `/api/wallets/setup` | Setup | Create/update initial wallets |
| `/api/transactions` | Transactions, Chat, Savings | Create transaction |
| `/api/transactions/[id]` | Transactions | Edit/delete transaction |
| `/api/categories` | Categories | Create category |
| `/api/categories/[id]` | Categories | Edit/delete category |
| `/api/budgets` | Categories | Save category jar limit |
| `/api/ai/nlp/parse` | Chat | Parse natural-language transaction |
| `/api/ai/advisor` | Chat | Request financial advice |
| `/api/ai/ocr/receipt` | Scan | Parse receipt image |
| `/api/ai/ocr/receipt/confirm` | Scan | Confirm OCR and create transaction |
| `/api/stats`, `/api/stats/chart` | Legacy/stats routes | Stats endpoints retained for compatibility |

## Maintenance Rule

When a change adds, removes, renames, or materially changes a primary page, update this file in the same change. The update should include route purpose, visible functions, interactions, APIs, data dependencies, and performance notes.
