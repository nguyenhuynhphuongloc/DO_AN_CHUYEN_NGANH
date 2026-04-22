# frontend-auth-flow Specification

## Purpose
TBD - created by archiving change add-authenticated-ocr-frontend-flow. Update Purpose after archive.
## Requirements
### Requirement: The frontend provides Register and Login pages for auth-service
The system SHALL provide a Register page and a Login page that connect to `auth-service` and allow a user to create an account and authenticate with the frontend application.

#### Scenario: User registers from the frontend
- **WHEN** a user submits valid full name, email, password, and confirm password values on the Register page
- **THEN** the frontend sends the registration request to `auth-service` and shows the resulting success or validation error state

#### Scenario: User logs in from the frontend
- **WHEN** a user submits valid email and password values on the Login page
- **THEN** the frontend sends the login request to `auth-service`, stores the returned auth session using the frontend auth-state pattern, and treats the user as authenticated

### Requirement: The frontend protects the OCR route behind authentication
The system SHALL require an authenticated frontend session before allowing a user to access the OCR page.

#### Scenario: Unauthenticated user requests the OCR page
- **WHEN** a user without a valid authenticated session navigates to the OCR route
- **THEN** the frontend redirects the user to the Login page instead of showing the OCR experience

#### Scenario: Authenticated user resumes the OCR flow
- **WHEN** a user with a valid authenticated session opens the application
- **THEN** the frontend restores the authenticated state and allows access to the protected OCR page

