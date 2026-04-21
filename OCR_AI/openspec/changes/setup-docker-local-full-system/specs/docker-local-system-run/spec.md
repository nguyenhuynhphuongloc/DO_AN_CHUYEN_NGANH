## ADDED Requirements

### Requirement: The repository provides one Docker local entrypoint for the full system
The system SHALL provide a root-level Docker local stack that can start the frontend, `auth-service`, `finance-service`, OCR runtime, and local PostgreSQL dependencies from one orchestration entrypoint.

#### Scenario: Developer starts the local stack
- **WHEN** a developer runs the documented Docker local startup command
- **THEN** the full development system starts through one root orchestration flow rather than separate manual commands for each service

### Requirement: Docker local runtime preserves service and database boundaries
The Docker local stack SHALL preserve the current architecture boundaries such that `auth-service` uses `auth_db`, `finance-service` uses `finance_db`, and OCR remains a stateless integration runtime without dedicated persistence tables.

#### Scenario: Developer inspects the Docker local architecture
- **WHEN** a developer reviews the Docker local configuration
- **THEN** they find separate app services, local database wiring for `auth_db` and `finance_db`, and no OCR persistence service or receipt database

### Requirement: Docker local stack includes local database bootstrap for both service databases
The Docker local stack SHALL initialize local PostgreSQL so both `auth_db` and `finance_db` are available for migrations and runtime usage by their respective services.

#### Scenario: Services connect after container startup
- **WHEN** the local database container becomes ready
- **THEN** `auth-service` can run against `auth_db` and `finance-service` can run against `finance_db` without requiring external Neon databases

### Requirement: Docker local stack documents the developer startup contract
The Docker local stack SHALL include developer-facing commands, environment expectations, and port mappings needed to boot, inspect, and stop the full local system.

#### Scenario: Developer follows Docker local instructions
- **WHEN** a developer reads the Docker local documentation
- **THEN** they can start the stack, access the frontend and service endpoints, and understand which env values or secrets must be provided
