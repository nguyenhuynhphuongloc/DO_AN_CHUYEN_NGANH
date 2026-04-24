## ADDED Requirements

### Requirement: Shared Neon schema supports OCR-driven finance capture
The system SHALL use the target Neon PostgreSQL database as the canonical schema for OCR-driven transaction capture, and that schema SHALL support wallets, receipts, parser results, and merchant-aware transactions.

#### Scenario: Shared schema includes required OCR finance entities
- **WHEN** the database schema for the OCR finance flow is prepared
- **THEN** it SHALL provide explicit structures for wallets, receipts, parser results, and transactions linked to categories and users

#### Scenario: Existing finance tables are insufficient
- **WHEN** the current shared database lacks fields required by the OCR flow
- **THEN** the migration plan SHALL add or alter the schema rather than forcing services to overload unrelated tables

### Requirement: Wallets are modeled explicitly and separately from budgets
The system SHALL represent wallets as distinct finance entities and SHALL NOT treat budgets as wallet substitutes.

#### Scenario: User confirms a receipt-backed transaction
- **WHEN** the confirmation flow requires a source-of-funds selection
- **THEN** the selected value SHALL reference a wallet entity rather than a budget entity

#### Scenario: Budget data exists in the shared database
- **WHEN** budgets are present alongside wallets
- **THEN** the system SHALL preserve budget semantics as spending limits or planning constructs and SHALL NOT reinterpret them as payment sources

### Requirement: Transactions store merchant-aware OCR confirmation data
The system SHALL persist confirmed OCR-backed transactions with merchant-aware fields needed for later search, categorization, and receipt traceability.

#### Scenario: Receipt confirmation creates a transaction
- **WHEN** a parsed receipt is confirmed
- **THEN** the resulting transaction record SHALL be able to store merchant name, receipt linkage, category linkage, wallet linkage, amount, type, transaction time, and description

#### Scenario: Historical transactions are used for later analysis
- **WHEN** the application reads transaction history to support future OCR or category workflows
- **THEN** merchant-aware fields SHALL be available without reconstructing them from free-form descriptions alone
