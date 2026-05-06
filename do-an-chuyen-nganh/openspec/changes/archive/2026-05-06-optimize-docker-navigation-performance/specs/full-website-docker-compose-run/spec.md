## MODIFIED Requirements

### Requirement: Root Compose stack starts the website runtime
The repository SHALL provide a root Docker Compose workflow that starts all runtime services required for the website's primary user flows from inside `do-an-chuyen-nganh`, with a documented distinction between hot-reload development mode and production-like performance testing mode.

#### Scenario: One-command startup
- **WHEN** a developer runs `docker compose up --build` from the repository root
- **THEN** the stack starts the website container and the OCR service container without requiring startup from a sibling repository

#### Scenario: Website routes are reachable after startup
- **WHEN** the Compose stack becomes healthy
- **THEN** the website runtime serves the main web application on its documented HTTP port

#### Scenario: Production-like startup is available
- **WHEN** a developer needs to evaluate realistic navigation speed
- **THEN** the repository provides a documented Docker command or profile that runs the website without `next dev` route compilation on first click

### Requirement: Compose wiring uses container-safe service discovery
The Compose stack SHALL configure the website container to reach the OCR service through Compose networking instead of loopback-only defaults, and the health check SHALL use a container-local lightweight website endpoint.

#### Scenario: OCR service resolution inside Docker
- **WHEN** the website container needs to call the receipt OCR API
- **THEN** it uses a Compose service hostname and port that resolve from inside the container network

#### Scenario: Website health check avoids frontend routes
- **WHEN** Compose determines whether the website container is healthy
- **THEN** it calls a lightweight endpoint inside the website container instead of an authenticated frontend page

### Requirement: Compose startup preserves runtime data needed by the website
The Compose workflow SHALL persist website runtime data that must survive container recreation during local development.

#### Scenario: Media persistence across restarts
- **WHEN** a user uploads receipt media while the stack is running
- **THEN** the uploaded media remains available after the containers are restarted through Docker Compose
