## ADDED Requirements

### Requirement: Repository contains the OCR runtime needed by the website
The repository SHALL contain the receipt AI runtime files required to serve the website's OCR scan flow without depending on a sibling repository checkout at runtime.

#### Scenario: OCR runtime is packaged inside the website repository
- **WHEN** a developer inspects the Docker-owned service layout for the website stack
- **THEN** the receipt AI runtime assets needed by the scan flow are present under `do-an-chuyen-nganh`

### Requirement: Embedded OCR service exposes the receipt scan API
The embedded OCR runtime SHALL expose the HTTP API contract required by the website's scan flow.

#### Scenario: OCR API availability
- **WHEN** the embedded OCR container is running in the Compose stack
- **THEN** it serves the receipt OCR endpoint used by the website scan feature

### Requirement: Embedded OCR service remains limited to website-facing runtime scope
The embedded OCR runtime SHALL include only the files and dependencies needed for the website OCR flow, not unrelated services from the broader AI workspace.

#### Scenario: Minimal embedded service scope
- **WHEN** the embedded OCR runtime is packaged for Docker
- **THEN** the service tree excludes unrelated application modules that are not required to serve the website's OCR endpoint
