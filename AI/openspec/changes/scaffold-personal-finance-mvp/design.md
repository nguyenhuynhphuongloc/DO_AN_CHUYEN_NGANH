## Context

The repository does not yet contain the target MVP structure for the finance platform. The requested scope spans four deliverables that must work together: a Next.js frontend, two NestJS services using Prisma and separate PostgreSQL databases, and one FastAPI receipt service using SQLAlchemy and its own PostgreSQL database. The project is intentionally development-stage, so the design needs to prioritize a runnable end-to-end workflow over production-hardening details such as password hashing, cloud object storage, asynchronous messaging, or advanced observability.

The major constraint is service separation by database and responsibility:
- `auth-service` owns authentication users, refresh tokens, and JWT issuance against `auth_db`.
- `finance-service` owns wallets, categories, transactions, and summary queries against `finance_db`.
- `receipt-service` owns receipt uploads, extraction state, feedback, and confirmation records against `receipt_db`.
- `frontend` integrates with all three services through environment-configured REST endpoints.

## Goals / Non-Goals

**Goals:**
- Establish a monorepo-style folder structure that is easy to run locally and extend for the capstone.
- Provide minimal but complete database connection setup for each backend using the required stack.
- Define REST APIs and data contracts that support login, finance tracking, and receipt-assisted transaction creation.
- Support a simple receipt workflow: upload, parse mock fields, review/edit, confirm, then create a finance transaction.
- Keep setup friction low with `.env.example` files, seed data, CORS configuration, and local-development documentation.

**Non-Goals:**
- Production security hardening such as password hashing, secret rotation, token revocation lists, or file antivirus scanning.
- Event-driven infrastructure such as Kafka, queues, background workers, or distributed sagas.
- Cloud file storage, CDN delivery, or OCR vendor integration beyond a placeholder extraction function.
- Advanced frontend state management, offline support, or complex UI component libraries beyond what Tailwind and App Router need for the MVP.

## Decisions

### 1. Use a repo-root service-per-folder layout

The change will create top-level folders for `frontend`, `auth-service`, `finance-service`, and `receipt-service`, each with its own configuration and README-relevant commands. This matches the requested architecture and keeps boundaries clear for students working on separate services.

Alternative considered:
- Nesting everything under a single `apps/` directory. Rejected because the current repo is small and the explicit service names at the root reduce ambiguity for an academic MVP.

### 2. Keep service communication synchronous over REST

`receipt-service` will call `finance-service` directly during receipt confirmation to create a transaction once the user has approved extracted fields. This is simple to understand, easy to test locally, and aligned with the requirement to avoid Kafka or additional infrastructure.

Alternative considered:
- Storing a pending confirmation event and processing it asynchronously. Rejected because it adds orchestration complexity without improving the MVP learning outcome.

### 3. Use service-owned schemas and lightweight domain models

Each backend will define only the entities required for the requested endpoints:
- `auth-service`: `User`, `RefreshToken`
- `finance-service`: `Category`, `Wallet`, `Transaction`
- `receipt-service`: `Receipt`, plus extracted-field and feedback columns on the receipt record

This keeps the implementation runnable with minimal joins and avoids cross-database coupling.

Alternative considered:
- A richer shared domain model with cross-service identifiers and reconciliation tables. Rejected because it over-designs the MVP and slows implementation.

### 4. Issue JWT access and refresh tokens from auth-service

The frontend authenticates against `auth-service`, stores the token pair client-side for development, and uses the access token when calling protected APIs. `auth-service` remains the only issuer of user identity.

Alternative considered:
- Session-based auth or a single long-lived JWT. Rejected because the requested architecture explicitly requires access and refresh tokens.

### 5. Keep the receipt parsing flow deterministic and mockable

`receipt-service` will save upload metadata locally, create a receipt record with parse status, and populate placeholder extracted fields through a deterministic parser function. The response contract will mirror future OCR integration by returning `merchant_name`, `transaction_date`, and `total_amount`.

Alternative considered:
- Integrating a real OCR provider immediately. Rejected because the user requested a placeholder-first scaffold.

### 6. Build the frontend with server-rendered page shells and client components for forms

The App Router pages will provide the requested routes and a straightforward UI using Tailwind. Form-heavy interactions such as login, upload, review edits, and transaction creation will live in client components or client-side fetch handlers, while the page structure remains simple and readable.

Alternative considered:
- Building a more complex data layer with React Query or global state libraries. Rejected because the MVP can rely on direct fetch wrappers and local state.

## Risks / Trade-offs

- Cross-service confirmation can fail after receipt approval -> Mitigation: mark confirmation status clearly, return actionable errors, and make the finance-service call explicit in the confirmation handler.
- Plain-text seed password is insecure -> Mitigation: confine it to documented development-only seed behavior and call it out in README and design artifacts.
- Local file uploads can accumulate or diverge from DB state -> Mitigation: store only local metadata for now and use a dedicated upload directory with predictable paths.
- Separate services increase local setup burden -> Mitigation: provide `.env.example` files, startup commands, and minimal dependencies per service.
- Placeholder OCR may give unrealistic expectations -> Mitigation: define parse output as mock extracted fields and document OCR integration as a future extension, not current functionality.

## Migration Plan

1. Add the new service folders and starter code without altering the existing Python files outside the requested scaffold.
2. Configure environment examples and database connection modules for each service.
3. Add initial schemas, migrations or model definitions, and seed scripts.
4. Implement backend endpoints and local upload handling.
5. Implement frontend pages and API integration using environment-based URLs.
6. Verify the end-to-end flow locally using the development seed user and the placeholder receipt parse flow.

Rollback is straightforward because the change is additive at this stage: remove the added service folders or revert the change before any production deployment.

## Open Questions

- Whether the frontend should store tokens in memory, local storage, or cookies for development can be settled during implementation; local storage is acceptable for the MVP but should remain clearly temporary.
- The exact finance summary fields can start with totals and counts, then expand later if the capstone needs charts or trend data.
- Receipt file validation rules can remain minimal initially and tighten later if the team sees malformed-upload issues during testing.
