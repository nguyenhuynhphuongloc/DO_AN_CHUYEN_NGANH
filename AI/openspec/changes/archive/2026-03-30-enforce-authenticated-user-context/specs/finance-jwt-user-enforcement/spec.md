## ADDED Requirements

### Requirement: Finance endpoints require authenticated access
The `finance-service` SHALL require a valid bearer token for protected dashboard, wallet, category, and transaction endpoints and SHALL reject missing or invalid tokens with `401`.

#### Scenario: Missing bearer token
- **WHEN** a client calls a protected finance endpoint without a bearer token
- **THEN** the service SHALL return `401 Unauthorized`

#### Scenario: Invalid bearer token
- **WHEN** a client calls a protected finance endpoint with an invalid or expired bearer token
- **THEN** the service SHALL return `401 Unauthorized`

### Requirement: Finance data is scoped to the authenticated user
The `finance-service` SHALL resolve the acting user from JWT claims and scope dashboard, wallet, and transaction reads to that authenticated user.

#### Scenario: Read dashboard summary
- **WHEN** an authenticated user calls `GET /dashboard/summary`
- **THEN** the service SHALL aggregate only that user's wallets and transactions

#### Scenario: List wallets and transactions
- **WHEN** an authenticated user calls `GET /wallets` or `GET /transactions`
- **THEN** the service SHALL return only wallets and transactions owned by that user

### Requirement: Finance mutations do not trust client-supplied user identity
The `finance-service` SHALL derive resource ownership for wallet and transaction creation from the authenticated JWT user and SHALL reject cross-user resource references.

#### Scenario: Create wallet
- **WHEN** an authenticated user submits `POST /wallets`
- **THEN** the service SHALL create the wallet for the JWT user without using any default-user fallback

#### Scenario: Create transaction with owned wallet
- **WHEN** an authenticated user submits `POST /transactions` referencing a wallet they own
- **THEN** the service SHALL create the transaction for the JWT user and update only that wallet's balance

#### Scenario: Create transaction with another user's wallet
- **WHEN** an authenticated user submits `POST /transactions` referencing a wallet owned by a different user
- **THEN** the service SHALL return `403 Forbidden` and SHALL not create the transaction
