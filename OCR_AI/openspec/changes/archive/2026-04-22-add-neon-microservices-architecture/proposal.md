## Why

The current repository contains an OCR flow, review UI, and a reviewed-receipt save path, but it does not yet reflect the target microservice architecture that the project has now fixed. The backend needs to be reorganized around Neon-backed `auth-service` and `finance-service`, while explicitly removing the earlier receipt-persistence direction so the implementation matches the agreed product boundaries.

## What Changes

- Add a new `microservices/` folder structure that becomes the canonical backend layout for service-oriented development.
- Scaffold `auth-service` with Neon PostgreSQL connectivity for `auth_db`, migrations, repository/controller/route/config organization, and starter endpoints for register, login, refresh token, and current-user.
- Scaffold `finance-service` with Neon PostgreSQL connectivity for `finance_db`, migrations, repository/controller/route/config organization, and starter endpoints for wallets, categories, budget profiles, category allocation rules, and transactions.
- Define the finance persistence flow so confirmed OCR results are saved directly into `finance_db.transactions`.
- Keep OCR stateless and explicitly avoid receipt-review persistence, raw OCR storage, OCR job tables, OCR feedback tables, and any `receipt_db` design.
- **BREAKING** Retire the old persistence direction around `receipt-save-service`, `receipt_reviews`, `ocr-audit-service`, and receipt-centric OCR persistence as the intended target architecture.

## Capabilities

### New Capabilities
- `auth-service`: Provide a dedicated authentication microservice backed by `auth_db` with user, role, token, and session-related behaviors.
- `finance-service`: Provide a dedicated finance microservice backed by `finance_db` with wallet, category, budget, rule, and transaction management behaviors.
- `stateless-ocr-handoff`: Define the handoff from OCR extraction to confirmed finance transaction persistence without introducing OCR database persistence.

### Modified Capabilities
- None.

## Impact

- New `microservices/auth-service` and `microservices/finance-service` directories with service-local config, env, route, handler, repository, migration, and bootstrap files
- New Neon/Postgres connection handling using service-specific database URLs
- New migrations for `auth_db` and `finance_db` tables already fixed by the target design
- Documentation updates explaining the new microservice structure, env variables, and run flow
- Deprecation of the old receipt-persistence direction as the future implementation target
