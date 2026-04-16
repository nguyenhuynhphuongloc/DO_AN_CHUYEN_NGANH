# frontend-authenticated-api-calls Specification

## Purpose
TBD - created by archiving change enforce-authenticated-user-context. Update Purpose after archive.
## Requirements
### Requirement: Protected frontend requests use the stored bearer token
The frontend SHALL attach `Authorization: Bearer <access_token>` to protected requests sent to finance-service and receipt-service, using the currently logged-in session stored after login.

#### Scenario: Protected finance request
- **WHEN** the frontend calls a protected finance endpoint such as dashboard, wallets, categories, or transactions while a user session exists
- **THEN** the request SHALL include the stored access token in the `Authorization` header

#### Scenario: Protected receipt request
- **WHEN** the frontend calls a protected receipt endpoint such as upload, detail, parse, feedback, or confirm while a user session exists
- **THEN** the request SHALL include the stored access token in the `Authorization` header

### Requirement: Protected request logic is centralized
The frontend SHALL implement bearer-token lookup and protected request header construction in a shared auth or API helper instead of duplicating token attachment logic across pages.

#### Scenario: New protected page
- **WHEN** a developer adds another protected frontend page or action
- **THEN** the page SHALL be able to use the shared helper to make authenticated finance or receipt requests without re-implementing token lookup

#### Scenario: Session storage changes
- **WHEN** session persistence behavior changes in the future
- **THEN** the frontend SHALL require changes in one shared session or request helper path rather than every protected page

### Requirement: Missing session is handled consistently on protected pages
The frontend SHALL fail gracefully when a protected page or action runs without a valid access token.

#### Scenario: Protected page loads without session
- **WHEN** a user opens a protected dashboard or receipt page without a stored access token
- **THEN** the frontend SHALL redirect to login or show a consistent authentication failure state instead of issuing anonymous protected requests

#### Scenario: Protected action runs after session loss
- **WHEN** a protected action is triggered after the access token is missing or cleared
- **THEN** the frontend SHALL stop the request locally or surface the resulting `401` consistently to the user

