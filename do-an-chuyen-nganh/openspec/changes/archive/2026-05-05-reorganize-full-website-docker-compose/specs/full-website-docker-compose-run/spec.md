## ADDED Requirements

### Requirement: Root Compose stack starts the website runtime
The repository SHALL provide a root Docker Compose workflow that starts all runtime services required for the website's primary user flows from inside `do-an-chuyen-nganh`.

#### Scenario: One-command startup
- **WHEN** a developer runs `docker compose up --build` from the repository root
- **THEN** the stack starts the website container and the OCR service container without requiring startup from a sibling repository

#### Scenario: Website routes are reachable after startup
- **WHEN** the Compose stack becomes healthy
- **THEN** the website runtime serves the main web application on its documented HTTP port

### Requirement: Compose wiring uses container-safe service discovery
The Compose stack SHALL configure the website container to reach the OCR service through Compose networking instead of loopback-only defaults.

#### Scenario: OCR service resolution inside Docker
- **WHEN** the website container needs to call the receipt OCR API
- **THEN** it uses a Compose service hostname and port that resolve from inside the container network

### Requirement: Compose startup preserves runtime data needed by the website
The Compose workflow SHALL persist website runtime data that must survive container recreation during local development.

#### Scenario: Media persistence across restarts
- **WHEN** a user uploads receipt media while the stack is running
- **THEN** the uploaded media remains available after the containers are restarted through Docker Compose
