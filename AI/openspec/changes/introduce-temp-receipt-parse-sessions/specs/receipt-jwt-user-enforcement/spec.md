## MODIFIED Requirements

### Requirement: Receipt ownership is derived from the authenticated user
The `receipt-service` SHALL persist and load ownership for temporary parse sessions, confirmed receipts, and receipt feedback from the validated JWT user id instead of default-user configuration or client-supplied identity.

#### Scenario: Upload receipt
- **WHEN** an authenticated user uploads a receipt through `POST /receipts/upload`
- **THEN** the created temp parse session or legacy receipt SHALL store the JWT user id as the owning user record

#### Scenario: Save feedback
- **WHEN** an authenticated user submits feedback through a temp session or confirmed receipt feedback endpoint
- **THEN** the stored feedback or reviewer edits SHALL use the JWT user id as the owner of that mutation

### Requirement: Receipt read and write operations enforce ownership
The `receipt-service` SHALL allow users to read, parse, review, finalize, and confirm only temporary parse sessions and confirmed receipts they own and SHALL reject access to another user's resource with `403`.

#### Scenario: Owner reads and updates receipt workflow
- **WHEN** an authenticated user accesses their own temp session or confirmed receipt for detail, parse, feedback, or confirm operations
- **THEN** the service SHALL allow the operation subject to existing business validation

#### Scenario: Non-owner accesses temp session or receipt
- **WHEN** an authenticated user attempts to access or mutate a temp session or confirmed receipt owned by another user
- **THEN** the service SHALL return `403 Forbidden`

### Requirement: Receipt confirmation preserves authenticated user context into finance-service
The `receipt-service` SHALL preserve authenticated user context when creating a finance transaction during receipt confirmation from a temp session or confirmed receipt flow and SHALL not rely on client-supplied `user_id`.

#### Scenario: Confirm receipt with owned finance resources
- **WHEN** an authenticated user confirms their temp session or receipt with a wallet and category they are allowed to use
- **THEN** the service SHALL create the finance transaction under that same authenticated user context

#### Scenario: Confirm receipt with another user's wallet
- **WHEN** an authenticated user confirms a temp session or receipt using a wallet owned by a different user
- **THEN** the finance integration SHALL reject the request and the workflow SHALL not be marked as successfully confirmed
