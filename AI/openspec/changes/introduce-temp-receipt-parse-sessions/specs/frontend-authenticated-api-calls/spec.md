## MODIFIED Requirements

### Requirement: Protected frontend requests use the stored bearer token
The frontend SHALL attach `Authorization: Bearer <access_token>` to protected requests sent to finance-service and receipt-service, including session-first receipt upload, polling, feedback, and confirm calls, using the currently logged-in session stored after login.

#### Scenario: Protected finance request
- **WHEN** the frontend calls a protected finance endpoint such as dashboard, wallets, categories, or transactions while a user session exists
- **THEN** the request SHALL include the stored access token in the `Authorization` header

#### Scenario: Protected receipt request
- **WHEN** the frontend calls a protected receipt endpoint such as upload, session detail, session parse, session feedback, or session confirm while a user session exists
- **THEN** the request SHALL include the stored access token in the `Authorization` header

### Requirement: Protected request logic is centralized
The frontend SHALL implement bearer-token lookup and protected request header construction in a shared auth or API helper and SHALL support the session-first receipt workflow without duplicating auth logic for legacy and transitional response shapes.

#### Scenario: New protected page
- **WHEN** a developer adds another protected frontend page or action
- **THEN** the page SHALL be able to use the shared helper to make authenticated finance or receipt requests without re-implementing token lookup

#### Scenario: Upload contract compatibility phase
- **WHEN** the receipt upload response may return either legacy receipt-first data or session-first data during rollout
- **THEN** the frontend SHALL handle both response shapes through shared typed API helpers instead of duplicating token and request logic in the page component

### Requirement: Missing session is handled consistently on protected pages
The frontend SHALL fail gracefully when a protected page or action runs without a valid access token.

#### Scenario: Protected page loads without session
- **WHEN** a user opens a protected dashboard or receipt page without a stored access token
- **THEN** the frontend SHALL redirect to login or show a consistent authentication failure state instead of issuing anonymous protected requests

#### Scenario: Protected action runs after session loss
- **WHEN** a protected action is triggered after the access token is missing or cleared
- **THEN** the frontend SHALL stop the request locally or surface the resulting `401` consistently to the user
