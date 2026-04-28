## Why

`do-an-chuyen-nganh` currently ships with a legacy Docker Compose setup that still assumes MongoDB and does not start the Python AI OCR dependency used by the scan flow. As a result, the website cannot be brought up reliably with a single `docker compose up --build`, which slows onboarding, testing, and deployment validation.

## What Changes

- Replace the legacy root Docker Compose workflow with a stack that starts the Payload/Next.js website and the receipt AI service together from inside `do-an-chuyen-nganh`.
- Reorganize the repository so the Docker-owned AI OCR runtime required by the website lives under `do-an-chuyen-nganh` instead of depending on a sibling repo path at runtime.
- Add explicit Docker environment, volume, and service wiring so the website can reach the OCR service through Compose networking instead of `localhost`.
- Add local run documentation and validation steps for the one-command Docker workflow.

## Capabilities

### New Capabilities
- `full-website-docker-compose-run`: Running Docker Compose from `do-an-chuyen-nganh` brings up all services required for the website's primary user flows.
- `embedded-receipt-ai-service`: The repository contains the Dockerized receipt AI runtime that powers the website's OCR scan flow.
- `dockerized-developer-workspace`: The repository documents and structures the local Docker workflow, environment variables, and persisted runtime data needed for repeatable startup.

### Modified Capabilities

None.

## Impact

- Affected code and config:
  - `docker-compose.yml`
  - Dockerfiles and service entrypoints
  - OCR runtime files packaged into `do-an-chuyen-nganh`
  - environment examples and startup docs
- Affected systems:
  - Payload/Next.js web runtime
  - Python receipt AI runtime
  - local media persistence and container networking
