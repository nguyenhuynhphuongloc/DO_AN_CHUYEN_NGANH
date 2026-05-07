## ADDED Requirements

### Requirement: Admin user finance APIs are nested under users
The admin API SHALL expose user-scoped finance endpoints under `/api/admin/users/:id/*`.

#### Scenario: Admin requests user wallets
- **WHEN** an admin requests `GET /api/admin/users/12/wallets`
- **THEN** the response contains only wallets whose `user` equals `12`

#### Scenario: Admin requests user transactions
- **WHEN** an admin requests `GET /api/admin/users/12/transactions`
- **THEN** the response contains only transactions whose `user` equals `12`

#### Scenario: Admin requests user savings
- **WHEN** an admin requests `GET /api/admin/users/12/savings`
- **THEN** the response contains savings goals where user `12` is owner or participant

### Requirement: User scoping is enforced inside services
User scoping SHALL be enforced inside admin service helpers, not only by UI query parameters.

#### Scenario: Request omits user query param
- **WHEN** `getAdminUserTransactions(payload, "12", params)` receives params without `user`
- **THEN** the service still queries transactions with `user equals 12`

#### Scenario: Request attempts conflicting user query param
- **WHEN** `getAdminUserTransactions(payload, "12", params)` receives `user=99`
- **THEN** the service ignores or rejects the conflicting user param and does not return user `99` records

### Requirement: Admin APIs require admin role
All `/api/admin/**` endpoints SHALL require an authenticated admin user.

#### Scenario: Normal user calls nested admin API
- **WHEN** an authenticated non-admin user calls `/api/admin/users/12/wallets`
- **THEN** the system returns 403 and no finance data

#### Scenario: Anonymous user calls nested admin API
- **WHEN** an unauthenticated request calls `/api/admin/users/12/wallets`
- **THEN** the system returns 401 and no finance data

### Requirement: API responses are narrow
Admin user finance APIs SHALL return narrow row contracts instead of full Payload documents with passwords, tokens, internal auth fields, or unneeded private fields.

#### Scenario: Admin requests user profile
- **WHEN** an admin requests `/api/admin/users/12/profile`
- **THEN** the response includes support-safe user fields such as id, email, name, role, currency, createdAt, setup status, and activity summary

#### Scenario: Admin requests user transactions
- **WHEN** an admin requests `/api/admin/users/12/transactions`
- **THEN** the response maps each transaction to the admin transaction row contract and excludes auth secrets and unrelated documents

### Requirement: Tests prove cross-user isolation
The implementation SHALL include tests proving nested admin endpoints do not leak records from other users.

#### Scenario: Two users have transactions
- **WHEN** user `12` and user `99` both have transactions
- **THEN** `GET /api/admin/users/12/transactions` returns user `12` transactions and excludes user `99` transactions
