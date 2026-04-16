## ADDED Requirements

### Requirement: Finance reference and wallet APIs
The `finance-service` SHALL expose category and wallet endpoints backed by the `finance_db` PostgreSQL database.

#### Scenario: List categories
- **WHEN** a client calls `GET /categories`
- **THEN** the service returns the available finance categories for the MVP

#### Scenario: List wallets
- **WHEN** a client calls `GET /wallets`
- **THEN** the service returns the existing wallets stored in `finance_db`

#### Scenario: Create wallet
- **WHEN** a client submits valid wallet data to `POST /wallets`
- **THEN** the service creates the wallet record and returns the created wallet

### Requirement: Transaction management APIs
The `finance-service` SHALL allow transaction listing and creation through REST endpoints.

#### Scenario: List transactions
- **WHEN** a client calls `GET /transactions`
- **THEN** the service returns persisted transactions with the fields needed by the frontend

#### Scenario: Create transaction manually
- **WHEN** a client submits valid transaction data to `POST /transactions`
- **THEN** the service stores the transaction in `finance_db` and returns the created transaction

#### Scenario: Reject invalid transaction payload
- **WHEN** a client submits a transaction request with missing required fields or invalid references
- **THEN** the service returns a validation error and does not create the transaction

### Requirement: Dashboard summary API
The `finance-service` SHALL expose an aggregated summary endpoint for the dashboard page.

#### Scenario: Read dashboard summary
- **WHEN** a client calls `GET /dashboard/summary`
- **THEN** the service returns MVP summary values derived from wallets and transactions, including totals required by the frontend dashboard
