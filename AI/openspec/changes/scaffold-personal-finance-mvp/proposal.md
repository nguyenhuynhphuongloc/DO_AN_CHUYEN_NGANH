## Why

The project needs an end-to-end MVP baseline for a personal finance platform so the team can develop and demo the capstone against the already provisioned cloud PostgreSQL databases. Building the core services and frontend flow now reduces integration risk early and gives the project a runnable foundation for authentication, transaction tracking, and AI-assisted receipt ingestion.

## What Changes

- Scaffold a microservice-based project structure with `frontend`, `auth-service`, `finance-service`, and `receipt-service`.
- Add service-level environment templates, local development instructions, and starter configuration for cloud PostgreSQL connections.
- Implement JWT-based authentication APIs with a development seed user and profile retrieval.
- Implement finance APIs for categories, wallets, transactions, and dashboard summary.
- Implement receipt upload, placeholder OCR parsing, review, feedback, and confirmation flows.
- Connect receipt confirmation to finance transaction creation through a REST call from `receipt-service` to `finance-service`.
- Build frontend pages for login, dashboard, receipt upload and review, and transaction listing against the backend services.
- Add MVP-grade CORS, DTO/schema definitions, basic error handling, and local-development README content.

## Capabilities

### New Capabilities
- `auth-service-foundation`: JWT authentication service with registration, login, refresh, profile, and seed-user support for development.
- `finance-service-foundation`: Wallet, category, transaction, and dashboard summary APIs backed by the finance database.
- `receipt-service-foundation`: Receipt upload and placeholder extraction workflow with confirmation that creates finance transactions.
- `finance-web-app-foundation`: Next.js frontend for login, dashboard, receipt review, and transaction management across the backend services.

### Modified Capabilities

None.

## Impact

Affected systems include the new frontend application, three backend services, local development documentation, service environment configuration, and cross-service REST integration. Dependencies include Next.js, NestJS, Prisma, FastAPI, SQLAlchemy, PostgreSQL, JWT token handling, and local file upload support for receipt storage.
