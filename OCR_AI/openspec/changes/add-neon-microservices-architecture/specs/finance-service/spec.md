## ADDED Requirements

### Requirement: Finance service owns finance data in `finance_db`
The system SHALL provide a `finance-service` microservice backed by `finance_db`, and that database SHALL contain the tables `budget_profiles`, `income_sources`, `wallets`, `categories`, `category_allocation_rules`, `budgets`, and `transactions`.

#### Scenario: Finance service initializes its database schema
- **WHEN** the finance service migrations are run against `finance_db`
- **THEN** the service creates the required finance tables and is able to connect using `FINANCE_DATABASE_URL`

### Requirement: Finance service exposes the core finance management flows
The system SHALL provide starter API routes for create, update, and list wallet behaviors, category behaviors, budget profile behaviors, category allocation rule behaviors, and transaction behaviors.

#### Scenario: Client manages finance resources through starter routes
- **WHEN** a client calls the finance service resource endpoints
- **THEN** the service routes requests through its handlers or controllers and repositories for the corresponding finance tables

### Requirement: Confirmed OCR results are persisted directly to transactions
The system SHALL save only confirmed OCR result fields directly into `finance_db.transactions`, and the finance service SHALL run the required balance or budget update logic when a confirmed expense transaction is created.

#### Scenario: Confirmed OCR expense is saved
- **WHEN** the frontend submits a confirmed OCR expense result to finance-service
- **THEN** the finance service persists the transaction in `transactions` and updates the relevant wallet and budget state according to the service rules

### Requirement: Finance service does not depend on receipt-persistence tables
The system MUST NOT create or depend on `receipt_db`, `receipt_reviews`, OCR audit tables, raw OCR JSON tables, OCR jobs, OCR feedback tables, or receipt lifecycle persistence as part of finance-service.

#### Scenario: Developer inspects finance persistence scope
- **WHEN** a developer reviews the finance service migrations and repositories
- **THEN** only the fixed finance domain tables are present and no receipt-persistence tables are introduced
