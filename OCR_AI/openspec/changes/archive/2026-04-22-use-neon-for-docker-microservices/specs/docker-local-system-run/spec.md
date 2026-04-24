## MODIFIED Requirements

### Requirement: The repository provides one Docker local entrypoint for the full system
The system SHALL provide a root-level Docker local stack that can start the frontend, `auth-service`, `finance-service`, and OCR runtime from one orchestration entrypoint while preserving the configured external database connectivity of the microservices.

#### Scenario: Developer starts the Neon-backed local stack
- **WHEN** a developer runs the documented root Docker startup command
- **THEN** the full development system starts through one root orchestration flow and `auth-service` plus `finance-service` run against the database URLs configured for those services rather than a separately started manual process

### Requirement: Docker local runtime preserves service and database boundaries
The Docker local stack SHALL preserve the current architecture boundaries such that `auth-service` uses its configured `AUTH_DATABASE_URL`, `finance-service` uses its configured `FINANCE_DATABASE_URL`, and OCR remains a stateless integration runtime without dedicated persistence tables.

#### Scenario: Developer inspects the Docker local architecture
- **WHEN** a developer reviews the Docker local configuration
- **THEN** they find separate app services, no duplicated auth or finance database URLs in the root orchestrator env contract, and no OCR persistence service or receipt database

### Requirement: Docker local stack sources database URLs from service-local env files
The Docker local stack SHALL source `AUTH_DATABASE_URL` from `microservices/auth-service/.env` and `FINANCE_DATABASE_URL` from `microservices/finance-service/.env` so that each microservice keeps ownership of its own database connection configuration.

#### Scenario: Root Docker stack uses service-local connection strings
- **WHEN** a developer configures Neon connection strings in the service-local env files and starts the root Docker stack
- **THEN** `auth-service` connects using the value from `microservices/auth-service/.env` and `finance-service` connects using the value from `microservices/finance-service/.env`

### Requirement: Docker local stack documents the developer startup contract
The Docker local stack SHALL include developer-facing commands, environment expectations, and port mappings needed to boot, inspect, and stop the full local system, including which values belong in root `.env` versus service-local `.env` files.

#### Scenario: Developer follows Docker local instructions
- **WHEN** a developer reads the Docker local documentation
- **THEN** they can prepare the required root and service-local env files, start the stack, and understand that auth and finance persistence targets are Neon-backed
