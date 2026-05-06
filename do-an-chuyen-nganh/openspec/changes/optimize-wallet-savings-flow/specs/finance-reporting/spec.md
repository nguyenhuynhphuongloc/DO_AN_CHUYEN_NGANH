## MODIFIED Requirements

### Requirement: Dashboard summarizes wallet and spending status
The system SHALL show the primary wallet balance, savings balance, monthly spending limit, spent amount, category budget warnings, recent transactions, and shortcuts to key finance workflows on the dashboard.

#### Scenario: User opens dashboard
- **WHEN** a user opens the dashboard for a selected month
- **THEN** the system displays metrics computed only from that user's wallets, budgets, and transactions

#### Scenario: Monthly spending exceeds limit
- **WHEN** selected-month spending exceeds the configured monthly spending limit
- **THEN** the dashboard clearly warns the user

#### Scenario: User views wallet balances
- **WHEN** dashboard wallet summary cards are shown
- **THEN** the primary wallet card shows `Số dư Ví "<tên ví>"` and savings cards show `Số dư tiết kiệm`

#### Scenario: User uses dashboard shortcut
- **WHEN** the user activates a dashboard shortcut for transactions, reports, deposit, or wallet management
- **THEN** the system navigates to the corresponding workflow

### Requirement: Reports distinguish sources of money
The system SHALL report spending and balances by primary wallet, savings wallet, category, transaction source type, savings transfer, and savings goal contribution.

#### Scenario: User opens reports
- **WHEN** a user opens reports for a selected date range
- **THEN** the system shows wallet balance summary, income, expense, savings transfers, category breakdown, and source type breakdown

#### Scenario: User has savings wallet
- **WHEN** a user has one or more savings wallets
- **THEN** reports show savings balances separately from spending wallet balances

#### Scenario: User reviews savings goal contribution
- **WHEN** savings goal contributions exist in the selected date range
- **THEN** reports and detail views can distinguish contribution money movement from ordinary expenses
