# receipt-jwt-user-enforcement Specification

## Purpose
TBD - created by archiving change enforce-authenticated-user-context. Update Purpose after archive.
## Requirements
### Requirement: Receipt endpoints require authenticated access
The `receipt-service` SHALL require a valid bearer token for upload, detail, parse, feedback, and confirm endpoints and SHALL reject missing or invalid tokens with `401`.

#### Scenario: Missing bearer token
- **WHEN** a client calls a protected receipt endpoint without a bearer token
- **THEN** the service SHALL return `401 Unauthorized`

#### Scenario: Invalid bearer token
- **WHEN** a client calls a protected receipt endpoint with an invalid or expired bearer token
- **THEN** the service SHALL return `401 Unauthorized`

### Requirement: Receipt ownership is derived from the authenticated user
The `receipt-service` SHALL persist and load receipt and feedback ownership from the validated JWT user id instead of default-user configuration or client-supplied identity.

#### Scenario: Upload receipt
- **WHEN** an authenticated user uploads a receipt through `POST /receipts/upload`
- **THEN** the created receipt SHALL store the JWT user id as `receipts.user_id`

#### Scenario: Save feedback
- **WHEN** an authenticated user submits feedback through `POST /receipts/{id}/feedback`
- **THEN** the stored feedback SHALL use the JWT user id as `feedback.user_id`

### Requirement: Receipt read and write operations enforce ownership
The `receipt-service` SHALL allow users to read, parse, review, and confirm only receipts they own and SHALL reject access to another user's receipt with `403`.

#### Scenario: Owner reads and updates receipt
- **WHEN** an authenticated user accesses `GET /receipts/{id}`, `POST /receipts/{id}/parse`, `POST /receipts/{id}/feedback`, or `POST /receipts/{id}/confirm` for a receipt they own
- **THEN** the service SHALL allow the operation subject to existing business validation

#### Scenario: Non-owner accesses receipt
- **WHEN** an authenticated user attempts to access or mutate a receipt owned by another user
- **THEN** the service SHALL return `403 Forbidden`

### Requirement: Receipt confirmation preserves authenticated user context into finance-service
The `receipt-service` SHALL preserve authenticated user context when creating a finance transaction during receipt confirmation and SHALL not rely on client-supplied `user_id`.

#### Scenario: Confirm receipt with owned finance resources
- **WHEN** an authenticated user confirms their receipt with a wallet and category they are allowed to use
- **THEN** the service SHALL create the finance transaction under that same authenticated user context

#### Scenario: Confirm receipt with another user's wallet
- **WHEN** an authenticated user confirms a receipt using a wallet owned by a different user
- **THEN** the finance integration SHALL reject the request and the receipt SHALL not be marked as successfully confirmed

