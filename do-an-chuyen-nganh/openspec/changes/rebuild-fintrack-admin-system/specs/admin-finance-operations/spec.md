## ADDED Requirements

### Requirement: Admin finance dashboard
The system SHALL provide an admin finance dashboard that summarizes FinTrack operations without requiring admins to inspect raw collections one by one.

#### Scenario: Admin opens overview
- **WHEN** an authenticated admin opens the admin overview
- **THEN** the system displays user, wallet, transaction, budget, savings, OCR, AI, and data-quality summary metrics

#### Scenario: Normal user opens overview
- **WHEN** a normal authenticated user requests the admin overview or its backing API
- **THEN** the system denies access

### Requirement: Admin domain navigation
The system SHALL organize admin navigation by finance domains instead of exposing only raw Payload collection names.

#### Scenario: Admin reviews navigation
- **WHEN** an admin opens the rebuilt admin interface
- **THEN** the navigation includes Overview, Users, Wallets, Transactions, Categories & Jars, Savings, Receipts & OCR, AI Advisor, Notifications, Data Quality, and System Settings or equivalent grouped entries

### Requirement: Admin user operations
The system SHALL let admins inspect and manage user accounts with finance context.

#### Scenario: Admin lists users
- **WHEN** an admin opens the user management module
- **THEN** the system shows users with role, currency, wallet count, transaction count, setup status, and recent activity when available

#### Scenario: Admin opens user finance summary
- **WHEN** an admin opens a user's finance summary
- **THEN** the system shows the user's wallets, monthly transaction summary, budget warnings, savings state, and recent OCR activity without exposing unrelated users' detail rows in the same response

### Requirement: Admin wallet operations
The system SHALL let admins inspect wallets and identify wallet setup problems.

#### Scenario: Admin filters wallets
- **WHEN** an admin filters wallets by user, wallet type, default status, or active status
- **THEN** the system returns only matching wallet rows with balance, currency, monthly spending limit, and owner summary

#### Scenario: User lacks default wallet
- **WHEN** a user has no default wallet
- **THEN** the admin data-quality or wallet module flags the issue

### Requirement: Admin transaction operations
The system SHALL provide an admin transaction module with finance-specific filters and detail inspection.

#### Scenario: Admin filters transactions
- **WHEN** an admin filters transactions by user, wallet, type, category, source type, date range, amount range, or search text
- **THEN** the system returns paginated matching transactions with relationship summaries needed for support and audit

#### Scenario: Admin opens transaction detail
- **WHEN** an admin opens a transaction detail view
- **THEN** the system displays wallet, category, source type, receipt link, savings goal link, note, merchant, and ownership context when available

### Requirement: Admin category and jar operations
The system SHALL let admins manage system categories separately from user categories and inspect category budget jars.

#### Scenario: Admin views categories
- **WHEN** an admin opens Categories & Jars
- **THEN** the system separates system/default categories from user-owned categories

#### Scenario: Admin views budget jar
- **WHEN** an admin opens a category budget row
- **THEN** the system shows user, wallet, category, period, month, year, limit, spent amount, remaining amount, and usage percentage

### Requirement: Admin savings operations
The system SHALL provide an admin savings module when savings goals or savings contributions remain part of the product.

#### Scenario: Admin views savings goals
- **WHEN** an admin opens Savings
- **THEN** the system shows savings goals with owner, participants, target amount, current amount, status, and contribution summary

#### Scenario: Savings total is inconsistent
- **WHEN** a savings goal current amount does not match the sum of its tracked contributions according to the current data model
- **THEN** the system flags the inconsistency in Data Quality or Savings

### Requirement: Admin receipt and OCR operations
The system SHALL provide admin views for receipt/OCR transactions and available OCR audit data.

#### Scenario: Admin lists receipts
- **WHEN** an admin opens Receipts & OCR
- **THEN** the system lists receipt-related transactions and media with user, merchant, date, amount, source type, and parse/review status when available

#### Scenario: Admin opens receipt detail
- **WHEN** an admin opens a receipt detail
- **THEN** the system displays receipt image, transaction fields, parsed fields, reviewed fields, provider or raw OCR details when available, and cleanup/failure state when tracked

### Requirement: Admin AI advisor operations
The system SHALL expose AI advisor operational status and privacy-safe diagnostics to admins.

#### Scenario: Admin opens AI advisor module
- **WHEN** an admin opens AI Advisor
- **THEN** the system displays advisor availability, recent request/failure counts when tracked, and privacy-safe diagnostic summaries

#### Scenario: Advisor context is displayed
- **WHEN** admin diagnostics include advisor input context
- **THEN** the system avoids exposing full personal finance context unless the data is necessary for debugging and access is admin-gated

### Requirement: Admin notification operations
The system SHALL let admins inspect notifications sent by the system.

#### Scenario: Admin lists notifications
- **WHEN** an admin opens Notifications
- **THEN** the system lists notifications by recipient, type, read state, link, and creation time with filters

### Requirement: Admin data-quality module
The system SHALL provide a data-quality module that surfaces finance integrity warnings.

#### Scenario: Admin runs data quality checks
- **WHEN** an admin opens Data Quality or requests a recheck
- **THEN** the system reports users without default wallets, transactions missing required relationships, category type mismatches, duplicate or invalid budgets, receipt transactions missing media, media without owner, and savings inconsistencies when detectable

### Requirement: Admin-only API surface
The system SHALL provide admin-only API endpoints for admin summaries, operational tables, detail views, and data-quality checks.

#### Scenario: Admin calls overview API
- **WHEN** an admin calls `GET /api/admin/overview`
- **THEN** the system returns dashboard metrics without requiring broad client-side collection joins

#### Scenario: Normal user calls admin API
- **WHEN** a normal user calls any `/api/admin/*` route
- **THEN** the system returns an authorization failure and no finance data

#### Scenario: Admin table API is queried
- **WHEN** an admin calls an admin table API with filters and pagination
- **THEN** the system validates filter inputs and returns a bounded page of results

### Requirement: Admin UI operational states
The system SHALL provide accessible loading, empty, error, filter, detail, and confirmation states for admin modules.

#### Scenario: Admin table has no results
- **WHEN** filters produce no matching rows
- **THEN** the system displays an empty state that identifies the active filters and offers a clear reset action

#### Scenario: Admin confirms destructive action
- **WHEN** an admin attempts a high-risk action such as deleting a user, changing a role, deleting a category, editing a transaction amount, or deleting receipt media
- **THEN** the system requires an explicit confirmation that names the affected record
