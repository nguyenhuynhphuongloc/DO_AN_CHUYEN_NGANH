## ADDED Requirements

### Requirement: User registration and login
The `auth-service` SHALL provide registration and login APIs that use the `auth_db` PostgreSQL database and return JWT access and refresh tokens for valid users.

#### Scenario: Successful registration
- **WHEN** a client submits a valid email, password, and role to `POST /auth/register`
- **THEN** the service creates the user in `auth_db` and returns a JWT access token and refresh token pair

#### Scenario: Successful login
- **WHEN** a client submits valid credentials to `POST /auth/login`
- **THEN** the service returns a JWT access token and refresh token pair for that user

#### Scenario: Invalid login
- **WHEN** a client submits an unknown email or incorrect password to `POST /auth/login`
- **THEN** the service returns an authentication error and does not issue tokens

### Requirement: Token refresh and protected profile access
The `auth-service` SHALL support access token renewal and protected profile lookup for authenticated users.

#### Scenario: Refresh token exchange
- **WHEN** a client submits a valid refresh token to `POST /auth/refresh`
- **THEN** the service returns a new access token and a valid refresh token according to the service token policy

#### Scenario: Authenticated profile request
- **WHEN** a client calls `GET /auth/profile` with a valid access token
- **THEN** the service returns the authenticated user's profile information

#### Scenario: Unauthorized profile request
- **WHEN** a client calls `GET /auth/profile` without a valid access token
- **THEN** the service returns an authorization error

### Requirement: Development seed user support
The `auth-service` SHALL provide a seed path that creates a development user with the configured test credentials for local setup.

#### Scenario: Seed creates the test user
- **WHEN** the seed script runs against an empty development database
- **THEN** it creates `testuser@example.com` with password `123456` and role `user`

#### Scenario: Seed remains repeatable
- **WHEN** the seed script runs more than once
- **THEN** it avoids creating duplicate test-user records
