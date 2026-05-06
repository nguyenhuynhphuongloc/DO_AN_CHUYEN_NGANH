## MODIFIED Requirements

### Requirement: Docker startup failures are diagnosable
The Dockerized workspace SHALL provide clear startup boundaries for missing configuration, unavailable dependent services, and health check failures without causing expensive frontend route compilation as part of routine health checks.

#### Scenario: Missing runtime configuration
- **WHEN** required configuration for the Dockerized website stack is absent or invalid
- **THEN** the developer receives a clear failure mode through documentation, container logs, or startup validation instead of a silent partial startup

#### Scenario: Health check uses lightweight endpoint
- **WHEN** Docker evaluates the website container health
- **THEN** the health check calls a lightweight API endpoint that does not require authentication, database access, or rendering a frontend route

### Requirement: Docker workflow is documented for local developers
The repository SHALL document the environment variables, folder layout, and commands required to run the full website stack through Docker Compose, including the difference between development mode and production-like performance testing mode.

#### Scenario: Developer follows Docker setup instructions
- **WHEN** a developer reads the repository startup documentation
- **THEN** they can identify the required environment variables and the command sequence for starting the full website stack with Docker Compose

#### Scenario: Developer chooses performance testing mode
- **WHEN** a developer wants to test navigation speed without development route compilation overhead
- **THEN** the documentation identifies the production-like Docker command or profile to use

### Requirement: Docker environment examples reflect the full website stack
The repository SHALL provide environment guidance that matches the Compose-based web and OCR services, including database SSL mode guidance that avoids misleading PostgreSQL driver warnings.

#### Scenario: Environment configuration for Compose
- **WHEN** a developer configures local environment variables for the Docker workflow
- **THEN** the documented variables include the values needed by both the website runtime and the embedded OCR runtime

#### Scenario: Database SSL mode is explicit
- **WHEN** a developer uses Neon/Postgres over TLS
- **THEN** the environment guidance uses an explicit SSL mode compatible with the current driver behavior
