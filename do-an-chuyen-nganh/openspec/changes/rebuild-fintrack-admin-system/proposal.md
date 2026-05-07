## Why

The current Payload admin is a generic collection CRUD panel, while FinTrack is now a personal finance system with wallets, transactions, budgets, savings, OCR receipts, AI advisor flows, and operational health concerns. Admin users need a finance-aware back office that supports supervision, debugging, audit, and controlled system configuration without exposing normal users to `/admin`.

## What Changes

- Rebuild the admin experience around FinTrack operations instead of raw Payload collection browsing.
- Add a finance operations dashboard with KPIs, recent activity, alerts, OCR/AI status, and data quality warnings.
- Add admin modules for users, wallets, transactions, categories, budgets, savings, notifications, media/receipts, and AI/OCR audit.
- Add admin-only APIs for dashboard summaries, filtered operational tables, data-quality checks, and audit/detail views.
- Add role-gated admin navigation so only `admin` users can access the admin back office.
- Standardize Vietnamese admin labels, table columns, filters, empty states, loading states, and destructive-action confirmations.
- Keep Payload collection CRUD available where useful, but wrap high-risk operations with domain-specific validation and review screens.
- Avoid application-code implementation in this proposal; implementation will happen later through task execution.

## Capabilities

### New Capabilities

- `admin-finance-operations`: Finance-aware admin dashboard, modules, APIs, UI states, audit views, and back-office workflows for FinTrack.

### Modified Capabilities

- `user-admin-separation`: Admin access must be role-gated and clearly separated from normal user finance flows.
- `finance-ui-experience`: Admin UI must follow the same product quality expectations as the user-facing finance app while using a denser operational dashboard layout.
- `receipt-review-history`: Receipt/OCR admin views must expose enough audit context to inspect OCR-created transactions and reviewed receipt data.
- `system-page-function-map`: The system page/function map must include the rebuilt admin pages, APIs, and data dependencies.

## Impact

- Affected frontend/admin code: `src/app/(payload)`, Payload admin component configuration, possible custom admin views/components under `src/components` or a dedicated admin component directory.
- Affected backend/API code: new admin-only routes under `src/app/api/admin/*` or equivalent Payload endpoints/server actions.
- Affected Payload collections: `Users`, `Wallets`, `Transactions`, `Categories`, `Budgets`, `SavingsGoals`, `SavingsContributions`, `Notifications`, `Media`, and future receipt/OCR audit collections if introduced.
- Affected access control: `src/access/roles.ts`, Payload `admin` access, collection-level admin bypass consistency, and field-level protection for sensitive fields.
- Affected docs/specs: admin page/function map, finance UI guidance, receipt audit requirements, and user/admin separation requirements.
