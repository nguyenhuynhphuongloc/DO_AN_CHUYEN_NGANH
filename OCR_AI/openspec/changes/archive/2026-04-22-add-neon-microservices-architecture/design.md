## Context

The repo already contains a local OCR backend, a reusable OCR review module, and an earlier reviewed-receipt persistence path. The target architecture has now been fixed more narrowly: OCR remains stateless, while actual persistence is split across two Neon-backed microservices with separate databases, `auth_db` and `finance_db`.

This is a cross-cutting architectural change because it introduces a new canonical backend layout under `microservices/`, formalizes service boundaries, and intentionally rejects the old receipt-centric persistence model. The design must make it easy to extend later while remaining lightweight and maintainable in a repo that currently follows simple Node.js conventions rather than an established NestJS or monorepo framework.

## Goals / Non-Goals

**Goals:**
- Create a clean `microservices/` folder with isolated `auth-service` and `finance-service` scaffolds.
- Use Neon PostgreSQL with one database URL per DB-backed service: `AUTH_DATABASE_URL` and `FINANCE_DATABASE_URL`.
- Provide migrations, repositories, handlers/controllers, routes, config modules, and env templates per service.
- Keep the implementation lightweight by using maintainable Node.js + Express-style service structure.
- Persist only confirmed business data in `finance_db.transactions` after OCR review confirmation.
- Make the architecture easy to extend with more endpoints and repositories later without redesigning the folder structure.

**Non-Goals:**
- Creating `receipt_db`, `receipt_reviews`, OCR audit tables, OCR job tables, or any raw OCR persistence.
- Reworking the n8n OCR backend into a DB-backed OCR service.
- Designing a full production deployment platform, service discovery layer, or API gateway in this change.
- Building every possible auth or finance business rule in depth; this change focuses on starter service scaffolding and the fixed domain tables.

## Decisions

### 1. Introduce `microservices/` as the canonical backend root for service-oriented code

The repo will gain a top-level `microservices/` directory containing `auth-service` and `finance-service`. Each service will own its own env file, runtime bootstrap, route registration, config, Neon database access, migrations, and service-local modules.

Alternative considered: extending the existing `src/receipt-ocr` area with more service code.
Why not: that would mix UI/module code with backend service concerns and make the eventual architecture harder to reason about.

### 2. Use lightweight Node.js + Express structure instead of introducing a larger backend framework

The repo currently does not establish a NestJS, Fastify, or other server framework convention. The new services should therefore use a lightweight Node.js + Express structure with clear separation into config, database, repositories, handlers/controllers, routes, and health/bootstrap files.

Alternative considered: adopting NestJS for the new microservices.
Why not: it would add more framework weight and repo-wide conventions than the current codebase justifies at this stage.

### 3. Use separate database URLs per service boundary

The services will use:
- `AUTH_DATABASE_URL` for `auth-service`
- `FINANCE_DATABASE_URL` for `finance-service`

This aligns with the fixed architecture that each service owns its own database boundary, even though both databases live on Neon PostgreSQL.

Alternative considered: one shared connection string and one shared database.
Why not: it would violate the already-fixed separation into `auth_db` and `finance_db`.

### 4. Keep OCR stateless and hand off only confirmed finance data

The OCR path remains:
1. OCR processes receipt input
2. frontend receives important extracted fields
3. user confirms/edits the fields
4. frontend submits confirmed data directly to `finance-service`
5. `finance-service` persists it to `transactions`

No receipt lifecycle or OCR persistence tables will be created.

Alternative considered: persisting draft receipt-review state in a receipt-specific service.
Why not: that is explicitly ruled out by the fixed architecture.

### 5. Implement finance-side transaction persistence as the canonical destination for confirmed OCR data

Confirmed OCR data will be represented as a normal finance transaction in `finance_db.transactions`, with relevant business fields such as amount, currency, merchant name, transaction date, payment method, and source type. Related budget and wallet effects should be handled inside `finance-service`.

Alternative considered: a separate receipts table plus later projection into transactions.
Why not: the target architecture explicitly says only important confirmed invoice fields are persisted, and they belong directly in `transactions`.

### 6. Treat the earlier receipt-persistence path as superseded architecture

The implementation should not continue the old direction around:
- `receipt-save-service`
- `receipt_reviews`
- `ocr-audit-service`
- `receipt_db`
- OCR persistence tables

If compatibility notes are needed, they should be documented as architectural supersession rather than extended as first-class future direction.

Alternative considered: keeping both architectures side by side indefinitely.
Why not: it would create ambiguity about the intended backend target and slow future implementation.

## Risks / Trade-offs

- [Two service scaffolds add more structure than the repo currently has] -> Mitigation: keep the runtime lightweight, use consistent folder conventions, and avoid unnecessary framework complexity.
- [Existing code and docs reference the older reviewed-save direction] -> Mitigation: document the new architecture clearly and keep the new change explicit about superseding the old persistence path.
- [Cross-database boundaries remove foreign keys between auth and finance] -> Mitigation: treat `user_id` in finance as an external identifier owned by auth-service and document that no cross-DB foreign keys exist.
- [Starter scaffolding may not yet capture every business rule detail] -> Mitigation: include clear route/repository/migration placeholders and keep the table/model boundaries decision-complete for future implementation.
- [Neon-specific runtime details may differ between local and cloud usage] -> Mitigation: centralize DB config per service and keep the connection logic environment-driven.

## Migration Plan

1. Create the `microservices/` root and scaffold `auth-service` and `finance-service`.
2. Add per-service env templates, config loaders, Neon/Postgres connection modules, and health/bootstrap routes.
3. Add migrations for the fixed `auth_db` and `finance_db` schemas.
4. Add starter repositories, handlers/controllers, and routes for the fixed service responsibilities.
5. Document how the OCR frontend/backend flow now hands confirmed data into `finance-service` rather than receipt persistence.
6. Keep the older receipt-persistence code as historical repo state for now, but treat the new microservice layout as the intended implementation target.

Rollback is straightforward because this is an additive architecture scaffold: revert the new `microservices/` tree and docs if needed without changing the existing OCR module behavior.

## Open Questions

- None required for this proposal because the architecture, database split, and OCR statelessness are already fixed in the prompt.
