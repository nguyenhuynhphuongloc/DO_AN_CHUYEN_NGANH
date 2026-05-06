## ADDED Requirements

### Requirement: Frontend health checks are lightweight
The Dockerized website runtime SHALL expose a health check path that verifies process liveness without rendering frontend pages, requiring authentication, querying the database, or invoking AI/OCR services.

#### Scenario: Health check does not compile app pages
- **WHEN** Docker checks whether the website container is healthy
- **THEN** the request targets a lightweight API health endpoint instead of `/`, `/dashboard`, or any authenticated frontend route

#### Scenario: Health endpoint responds without database dependency
- **WHEN** the website process is running but a remote database request would be slow
- **THEN** the health endpoint still returns a process-level success response without blocking on database access

### Requirement: Local navigation distinguishes first-hit compilation from runtime latency
The system SHALL document and support separate expectations for first navigation to a route in `next dev` and subsequent warmed navigation to the same route.

#### Scenario: First request compiles route in development
- **WHEN** a developer opens a page for the first time after starting `next dev`
- **THEN** documentation identifies that route compilation may add several seconds of delay

#### Scenario: Warmed request returns quickly
- **WHEN** a page route has already compiled and required data is available
- **THEN** navigation to that route completes without repeating the first-hit compile delay

### Requirement: Main routes can be warmed predictably
The Docker development workflow SHALL provide an intentional way to warm the main user-facing routes after startup so route compilation does not happen during the first manual click.

#### Scenario: Developer warms routes after startup
- **WHEN** the developer runs the documented warmup step after the web container is healthy
- **THEN** the main routes compile before the developer navigates through the UI

#### Scenario: Warmup tolerates authentication redirects
- **WHEN** a warmup request reaches an authenticated route without a user session
- **THEN** redirects are treated as acceptable warmup responses as long as the route compiles successfully

### Requirement: Server pages minimize avoidable database latency
Authenticated server-rendered pages SHALL avoid redundant Payload/Neon queries by using parallel fetching for independent data, selecting only needed fields, using `depth: 0` where relationships do not need expansion, and sharing repeated aggregate logic.

#### Scenario: Independent page data loads in parallel
- **WHEN** a page needs multiple independent datasets
- **THEN** the page fetches those datasets concurrently instead of waiting for each query sequentially

#### Scenario: Page queries return only needed fields
- **WHEN** a page loads data for display or interaction
- **THEN** the Payload queries use field selection and limits appropriate to that page's UI

### Requirement: Production-like Docker mode is available for performance testing
The repository SHALL provide documented commands or a Compose profile for running the website in a production-like mode that does not compile routes on first navigation.

#### Scenario: Developer tests realistic navigation speed
- **WHEN** a developer wants to evaluate UI responsiveness rather than edit code with hot reload
- **THEN** they can start a production-like Docker runtime and navigate pages without development route compilation delays

#### Scenario: Development mode remains available
- **WHEN** a developer needs hot reload and fast code iteration
- **THEN** the existing development Docker workflow remains available
