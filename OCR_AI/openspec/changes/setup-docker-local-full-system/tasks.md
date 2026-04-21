## 1. Root Docker Orchestration

- [x] 1.1 Add a root `docker-compose.yml` that orchestrates frontend, `auth-service`, `finance-service`, OCR runtime, and local PostgreSQL through one startup entrypoint
- [x] 1.2 Define Docker networking, ports, volumes, and startup dependencies so the services can reach each other consistently in local development
- [x] 1.3 Add any required `.dockerignore`, env templates, or helper scripts needed by the root Docker local workflow

## 2. Service Containerization

- [x] 2.1 Add development-oriented Dockerfiles or equivalent container build definitions for the frontend app, `auth-service`, and `finance-service`
- [x] 2.2 Adapt the OCR runtime wiring so it can be brought up from the root Docker stack without requiring a separate compose command
- [x] 2.3 Ensure each container uses the correct local env wiring and internal service URLs for Docker networking

## 3. Local Database Bootstrap

- [x] 3.1 Add local PostgreSQL bootstrap logic that creates both `auth_db` and `finance_db` inside the Docker local stack
- [x] 3.2 Wire `auth-service` to `auth_db` and `finance-service` to `finance_db` using service-specific database URLs in Docker
- [x] 3.3 Add a verifiable migration or startup flow so both microservices can initialize successfully against the local Docker database

## 4. Docs And Verification

- [x] 4.1 Update developer docs and run guides so Docker local full-system startup is the standard local workflow
- [x] 4.2 Document required secrets or env values, service endpoints, and the commands to start, inspect, and stop the stack
- [x] 4.3 Verify the Docker local stack can boot the full system and document the expected health checks or smoke-test steps
