## ADDED Requirements

### Requirement: Docker Compose serves the frontend through a production-oriented runtime
The system SHALL run the frontend service in Docker Compose through a production-oriented static-serving path rather than the Vite development server, and the frontend container SHALL serve the built frontend assets on the configured frontend port.

#### Scenario: User starts the stack through Docker Compose
- **WHEN** the user runs Docker Compose for the application stack
- **THEN** the frontend container builds the frontend application and serves the built assets through a production-oriented runtime on the configured frontend port

### Requirement: The frontend production runtime preserves SPA route access
The system SHALL preserve frontend route access for the single-page application when served through the production-oriented runtime so that direct navigation or refresh on application routes continues to load the frontend successfully.

#### Scenario: User refreshes a frontend route
- **WHEN** the user opens or refreshes a non-root frontend route such as a dashboard or OCR page
- **THEN** the frontend runtime returns the application entry document so the client-side router can render the requested route

### Requirement: Frontend runtime configuration remains environment-driven
The system SHALL continue to use environment-driven frontend service endpoint configuration for auth-service, finance-service, OCR service, and frontend port values after the runtime migration.

#### Scenario: Compose provides frontend environment variables
- **WHEN** the frontend container starts with configured service URL and port environment variables
- **THEN** the served frontend uses those configured values rather than hard-coded service endpoints
