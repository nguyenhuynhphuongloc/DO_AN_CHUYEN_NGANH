## ADDED Requirements

### Requirement: Dashboard summarizes wallet and spending status
The system SHALL show wallet balances, monthly spending limit, spent amount, remaining amount, category jar warnings, and recent transactions on the dashboard.

#### Scenario: User opens dashboard
- **WHEN** a user opens the dashboard for a selected month
- **THEN** the system displays metrics computed only from that user's wallets, budgets, and transactions

#### Scenario: Monthly spending exceeds limit
- **WHEN** selected-month spending exceeds the configured monthly spending limit
- **THEN** the dashboard clearly warns the user

### Requirement: Reports distinguish sources of money
The system SHALL report spending and balances by wallet, category, transaction source type, and savings wallet.

#### Scenario: User opens reports
- **WHEN** a user opens reports for a selected date range
- **THEN** the system shows wallet balance summary, income, expense, savings transfers, category breakdown, and source type breakdown

#### Scenario: User has savings wallet
- **WHEN** a user has one or more savings wallets
- **THEN** reports show savings balances separately from spending wallet balances

### Requirement: Report calculations are centralized
The system SHALL use shared finance statistics logic for dashboard, reports, stats APIs, and advisor context.

#### Scenario: Dashboard and reports read same period
- **WHEN** dashboard and reports request the same user and period
- **THEN** totals for income, expenses, and category spending match

#### Scenario: Chart data is requested
- **WHEN** the UI requests chart data for a period
- **THEN** the system returns chart-ready aggregate data without running one database query per chart point when a set-based query can provide the same result

