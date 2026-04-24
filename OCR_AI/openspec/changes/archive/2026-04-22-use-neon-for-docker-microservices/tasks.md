## 1. Docker Env Wiring

- [x] 1.1 Update the root Docker compose contract so `auth-service` reads `microservices/auth-service/.env` and `finance-service` reads `microservices/finance-service/.env`
- [x] 1.2 Remove or replace the local PostgreSQL connection wiring that currently injects `@postgres:5432/auth_db` and `@postgres:5432/finance_db` into the microservice containers
- [x] 1.3 Decide whether the root `postgres` service remains in the stack and reflect that decision consistently in compose dependencies and health checks

## 2. Env Templates And Safety

- [x] 2.1 Normalize root `.env.example` so it keeps only orchestrator-level variables and does not imply auth or finance database URLs belong there
- [x] 2.2 Normalize `microservices/auth-service/.env.example` and `microservices/finance-service/.env.example` as the canonical Docker and manual-run source for Neon connection strings
- [x] 2.3 Verify sensitive connection strings and API keys are represented safely in env examples and documented setup flow

## 3. Documentation

- [x] 3.1 Update the Docker local run guide to state that auth and finance containers persist to Neon using the service-local env files
- [x] 3.2 Document which env file is read by each runtime path: root Docker stack, OCR-only Docker stack, frontend local dev, and manual microservice run
- [x] 3.3 Document the migration and auto-migrate implications of running the Docker stack against Neon

## 4. Verification

- [x] 4.1 Verify the root Docker stack boots successfully with Neon-backed auth and finance configuration
- [x] 4.2 Verify auth and finance writes from the Docker stack land in the expected Neon databases
- [x] 4.3 Verify the documented startup flow is consistent with the actual env-loading behavior in code and compose
