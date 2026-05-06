## 1. Repository Layout Preparation

- [x] 1.1 Identify the minimal receipt AI runtime files currently living in the sibling `AI` workspace that are required by the website OCR flow
- [x] 1.2 Create a dedicated embedded service subtree inside `do-an-chuyen-nganh` for the Docker-owned receipt AI runtime
- [x] 1.3 Move or copy the required OCR runtime files, dependencies, and entrypoints into the embedded service subtree without bringing unrelated AI modules

## 2. Docker Stack Rework

- [x] 2.1 Replace the legacy Mongo-oriented `docker-compose.yml` with a stack that starts `web` and `receipt-ai`
- [x] 2.2 Add or update Dockerfiles and startup commands for the web runtime and embedded OCR runtime
- [x] 2.3 Configure Compose networking, health checks, and startup dependencies so the web runtime can reliably reach the OCR service
- [x] 2.4 Add persistent volume handling for website media and any OCR runtime data that must survive container restarts

## 3. Runtime Configuration Alignment

- [x] 3.1 Update website runtime configuration to use Compose-safe OCR hostnames instead of loopback assumptions when containerized
- [x] 3.2 Add or revise environment examples for both the web runtime and embedded OCR runtime
- [x] 3.3 Remove or replace outdated Docker assumptions in the repository that still reference Mongo-only startup

## 4. Developer Workflow and Documentation

- [x] 4.1 Update repository documentation to explain the new folder layout and one-command Docker startup flow
- [x] 4.2 Document required environment variables and how they map to the `web` and `receipt-ai` services
- [x] 4.3 Document expected startup failure modes and where developers should inspect logs when the full stack does not come up cleanly

## 5. Validation

- [x] 5.1 Validate `docker compose up --build` from the root of `do-an-chuyen-nganh`
- [x] 5.2 Validate that the website homepage, auth flow, and scan page load against the Dockerized stack
- [x] 5.3 Validate that the Dockerized website can reach the embedded OCR service through Compose networking
- [x] 5.4 Validate media persistence across container restart for an uploaded receipt or other website-managed file
