## ADDED Requirements

### Requirement: Auth service owns authentication data in `auth_db`
The system SHALL provide an `auth-service` microservice backed by `auth_db`, and that database SHALL contain the tables `users`, `roles`, `user_roles`, and `refresh_tokens`.

#### Scenario: Auth service initializes its database schema
- **WHEN** the auth service migrations are run against `auth_db`
- **THEN** the service creates the required auth tables and is able to connect using `AUTH_DATABASE_URL`

### Requirement: Auth service exposes the core authentication flows
The system SHALL provide starter API routes for register, login, refresh token, and current-user behaviors, and the service SHALL include password hashing and token issuance responsibilities.

#### Scenario: User registers and receives auth-managed identity
- **WHEN** a client submits a valid registration request
- **THEN** the auth service stores the user in `users`, applies password hashing, and returns the configured authentication response

#### Scenario: User refreshes an authenticated session
- **WHEN** a client submits a valid refresh token request
- **THEN** the auth service validates the refresh token against `refresh_tokens` and returns a new token response

### Requirement: Auth service includes service-local runtime structure
The system SHALL organize auth-service code into service-local configuration, migrations, repositories, handlers or controllers, routes, and health/bootstrap modules.

#### Scenario: Developer inspects auth-service layout
- **WHEN** a developer opens `microservices/auth-service`
- **THEN** the service folder clearly separates config, database, route, handler, repository, and migration concerns without depending on finance-service internals
