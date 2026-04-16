## ADDED Requirements

### Requirement: Authentication and page access flow
The `frontend` SHALL provide a login page and use configured service URLs to authenticate against `auth-service`.

#### Scenario: Login from the web app
- **WHEN** a user submits valid credentials on `/login`
- **THEN** the frontend calls `NEXT_PUBLIC_AUTH_API_URL` and transitions the user to the dashboard on success

#### Scenario: Login error handling
- **WHEN** the auth API rejects the submitted credentials
- **THEN** the frontend displays an error message and keeps the user on the login page

### Requirement: Dashboard and transaction views
The `frontend` SHALL provide dashboard and transaction pages backed by `finance-service`.

#### Scenario: View dashboard summary
- **WHEN** a user opens `/dashboard`
- **THEN** the frontend requests `GET /dashboard/summary` from `finance-service` and displays the returned summary values

#### Scenario: View transaction list
- **WHEN** a user opens `/transactions`
- **THEN** the frontend requests `GET /transactions` from `finance-service` and displays the returned transactions

### Requirement: Receipt upload and review workflow
The `frontend` SHALL provide receipt upload and review pages backed by `receipt-service`.

#### Scenario: Upload a receipt
- **WHEN** a user submits a file on `/receipts/upload`
- **THEN** the frontend uploads it to `receipt-service` and navigates to the review flow for the created receipt

#### Scenario: Review extracted receipt data
- **WHEN** a user opens `/receipts/[id]/review`
- **THEN** the frontend shows the extracted receipt fields in an editable form sourced from `receipt-service`

#### Scenario: Confirm a reviewed receipt
- **WHEN** a user confirms the edited receipt data from the review page
- **THEN** the frontend calls the receipt confirmation endpoint and reflects success or failure to the user
