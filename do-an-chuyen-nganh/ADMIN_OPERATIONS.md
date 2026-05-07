# FinTrack Admin Operations

FinTrack admin is a finance operations workspace built on Payload Admin. It is separate from the normal user finance experience and requires a user account with `role = admin`.

## Access Model

- Normal users use `/dashboard`, `/transactions`, `/categories`, `/reports`, `/savings`, `/chat`, and `/scan`.
- Admin users use `/admin`, `/admin/finance/users`, and selected-user workspaces under `/admin/finance/users/:userId`.
- Admin APIs live under `/api/admin/*` and are guarded by the shared admin context helper.
- Role changes are performed through the admin-only role endpoint, not the normal profile update flow.
- User-owned finance data is private by default. Admin must select a user before viewing that user's wallets, transactions, categories, hũ chi, savings, receipts, notifications, or AI/chat logs.
- Admin and normal user sessions currently share Payload's `payload-token` cookie on the same domain. Same-browser simultaneous use of separate admin and normal-user accounts is not guaranteed until the auth cookie strategy is split.

## Admin Modules

| Module | Path | Purpose |
| --- | --- | --- |
| Overview | `/admin` | Subtitle-free KPI cards and data warnings only |
| Users | `/admin/finance/users` | Full-width user list, setup status, workspace link, reviewed role change |
| User Workspace | `/admin/finance/users/:userId` | Two-pane view with chat-like user sidebar and selected user's finance overview |
| User Wallets | `/admin/finance/users/:userId/wallets` | Wallet ownership, type, balance, default/active state for selected user |
| User Transactions | `/admin/finance/users/:userId/transactions` | Selected user's ledger filters and receipt/source context |
| User Categories | `/admin/finance/users/:userId/categories` | System categories plus selected user's custom categories |
| User Hũ Chi | `/admin/finance/users/:userId/budgets` | Selected user's budget jar usage |
| User Savings | `/admin/finance/users/:userId/savings` | Selected user's savings goals and consistency warnings |
| User Receipts/OCR | `/admin/finance/users/:userId/receipts` | Selected user's OCR-created transactions and receipt media state |
| User AI/Chat | `/admin/finance/users/:userId/ai` | Selected user's redacted AI/advisor/chat logs |
| User Notifications | `/admin/finance/users/:userId/notifications` | Selected user's notification inspection |
| Data Quality | `/admin/finance/data-quality` | Wallet, transaction, category, budget, receipt, media, and savings warnings, linked to user workspace where possible |

Direct global detail pages such as `/admin/finance/transactions`, `/admin/finance/wallets`, `/admin/finance/receipts`, and `/admin/finance/ai` are not the primary admin workflow. If opened directly, the UI shows a compact block with `Cần chọn người dùng trước`, `Chọn người dùng`, and `Về tổng quan` instead of cross-user private rows.

## Admin APIs

| API | Purpose |
| --- | --- |
| `GET /api/admin/overview` | Dashboard metrics and recent warning summary |
| `GET /api/admin/users` | Filtered user table |
| `GET /api/admin/users/:id/profile` | Support-safe selected user profile |
| `GET /api/admin/users/:id/finance-summary` | Bounded user finance detail |
| `GET /api/admin/users/:id/wallets` | Selected user's wallets only |
| `GET /api/admin/users/:id/transactions` | Selected user's transactions only |
| `GET /api/admin/users/:id/categories` | System categories plus selected user's custom categories |
| `GET /api/admin/users/:id/budgets` | Selected user's hũ chi / budgets only |
| `GET /api/admin/users/:id/savings` | Selected user's owned/participating savings goals |
| `GET /api/admin/users/:id/receipts` | Selected user's OCR receipt transactions only |
| `GET /api/admin/users/:id/notifications` | Selected user's notifications only |
| `GET /api/admin/users/:id/ai-logs` | Selected user's redacted AI/chat logs only |
| `POST /api/admin/users/:id/role` | Reviewed admin-only role change |
| `GET /api/admin/wallets` | Filtered wallet table |
| `GET /api/admin/transactions` | Filtered transaction table |
| `GET /api/admin/categories` | Filtered categories with duplicate metadata |
| `GET /api/admin/budgets` | Budget jar usage rows |
| `GET /api/admin/savings` | Savings goals with contribution consistency |
| `GET /api/admin/receipts` | OCR transaction/receipt rows |
| `GET /api/admin/receipts/:id` | Receipt transaction detail |
| `GET /api/admin/ai/advisor-logs` | Advisor diagnostics placeholder |
| `GET /api/admin/notifications` | Filtered notifications |
| `GET /api/admin/data-quality` | Live data-quality findings |
| `POST /api/admin/data-quality/recheck` | Live recheck response |

Top-level finance detail APIs are retained for compatibility and aggregate diagnostics, but the admin UI should use nested `/api/admin/users/:id/*` endpoints for user-owned finance records.

## Privacy Boundaries

- Admin overview may show aggregate KPI cards and warning counts.
- Admin overview must not show full cross-user transaction, wallet, receipt, notification, or AI/chat message rows.
- AI/chat logs are redacted by default. Standard admin UI and `/api/admin/users/:id/ai-logs` must not expose raw private prompts/responses.
- Admin inspection is read-only by default. Future mutation flows for user finance records must use explicit reviewed confirmation.

## UI Rules

- Use compact operational layouts: KPI cards, filter bars, tables, detail panels.
- Admin headers are label/action only; do not add subtitles or helper paragraphs under admin page titles.
- Selected-user routes use a two-pane layout: 300-360px user sidebar on desktop, selected user's workspace on the right, and stacked panes on mobile.
- The data-quality page includes a user-impact panel so admins understand how each warning type affects wallet balances, transaction accuracy, hũ chi, OCR receipts, and AI/chat context.
- Use Lucide/SVG icons, not emoji.
- Prefer read-only inspection first; gate destructive or high-risk changes behind explicit reviewed actions.
- Keep data responses bounded and paginated.
- Keep user workspace navigation under `/admin/finance/users/:userId/*` so filters and tables stay scoped to the selected user.
- Keep text contained in boxes: long emails, IDs, merchant names, route paths, and redacted AI/chat text must wrap, truncate, or scroll inside their own table/sidebar containers.
- Run `npm run generate:importmap` after Payload admin component changes.
- Run `npm run generate:types` after collection/schema changes.
