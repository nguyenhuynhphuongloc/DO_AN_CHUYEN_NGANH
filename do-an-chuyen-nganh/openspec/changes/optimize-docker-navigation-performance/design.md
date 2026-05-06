## Context

The current local stack uses Docker Compose to run a Next.js/Payload website container and an embedded OCR service container. The web container runs `next dev`, which compiles App Router segments on first request. This is appropriate for development, but it makes the first click into pages such as `/categories`, `/reports`, `/transactions`, and `/savings` appear slow or broken after a container recreate.

The observed navigation delays come from multiple layers:

- Next.js route compilation occurs on first request in development mode.
- Docker health checks previously hit frontend routes, which can compile authenticated pages before the developer actually uses the app.
- Several server pages perform auth/setup checks plus multiple Payload/Neon queries before rendering.
- The database is Neon/Postgres remote, so every avoidable query adds network latency.
- The route/function inventory is currently implicit in code, making it difficult to reason about page responsibilities and performance risks.

## Goals / Non-Goals

**Goals:**

- Make local Docker navigation predictable by separating health checks, warmup behavior, and real page requests.
- Reduce repeated server work on main pages through parallel fetching, scoped field selection, and shared data services.
- Provide a production-like Docker path so UI performance can be tested without development compilation overhead.
- Document page-level functions, user interactions, API calls, and data dependencies in `SYSTEM_PAGE_FUNCTION_MAP.md`.
- Keep existing user-facing behavior and database schema intact.

**Non-Goals:**

- Replacing Payload CMS or Neon/Postgres.
- Rewriting the UI or changing page layouts as part of the performance pass.
- Changing business rules for wallets, transactions, categories, budgets, OCR, chatbot, or reports.
- Introducing a persistent external cache such as Redis unless a later proposal proves it is needed.

## Decisions

### Use a lightweight health endpoint

Docker health checks SHALL call a lightweight API endpoint that does not authenticate, query the database, render React, or compile large frontend route bundles.

Alternatives considered:

- **Health check `/`**: simple, but it triggers redirects and can compile frontend routes.
- **Health check `/dashboard`**: validates more of the app, but it is expensive and session-dependent.
- **Health check `/api/health`**: narrow and reliable; chosen because health should validate process liveness, not full user flow readiness.

### Keep development and production-like Docker modes separate

The default development workflow can keep `next dev` for hot reload, but the repository should also document or provide a production-like run path using `next build` and `next start` or an equivalent production Docker target.

Alternatives considered:

- **Only use `next dev`**: convenient but misleading for performance testing.
- **Only use production mode**: faster and realistic, but slower iteration for code changes.
- **Support both modes**: chosen because development and demonstration/testing have different needs.

### Warm main routes intentionally

If local development should feel responsive immediately after startup, route compilation should be warmed deliberately after the web service is ready, not accidentally through health checks or user clicks.

Warmup should be optional and documented because it consumes CPU at startup. It should target the main authenticated shell routes and should tolerate redirects when no session exists.

### Standardize server-page data fetching

Main server-rendered pages should follow a consistent pattern:

1. Authenticate the user.
2. Check wallet setup state.
3. Run independent Payload queries with `Promise.all`.
4. Use `select`, `depth: 0`, and sensible `limit` values.
5. Move repeated aggregate logic into shared services.

This keeps behavior close to existing code while removing avoidable latency.

### Keep page/function documentation close to implementation

`SYSTEM_PAGE_FUNCTION_MAP.md` should be a maintained system document at repository root. It should describe each page in terms of route, purpose, visible functions, user actions, APIs, data dependencies, and performance notes.

This document is intentionally not generated from code in the first iteration; manual curation is more useful while the system is still changing quickly.

## Risks / Trade-offs

- **Risk: Production-like Docker mode adds operational complexity** -> Mitigation: keep the dev workflow unchanged and document production-like mode as an optional command/profile.
- **Risk: Route warmup increases startup CPU and memory use** -> Mitigation: make warmup optional and limited to main routes.
- **Risk: Query optimization accidentally changes access behavior** -> Mitigation: preserve Payload access rules and use `overrideAccess: false` whenever passing `user` to Local API.
- **Risk: Documentation becomes stale** -> Mitigation: add a task to update `SYSTEM_PAGE_FUNCTION_MAP.md` whenever page routes or interactions change.
- **Risk: Remote Neon latency remains visible** -> Mitigation: reduce query count first; consider local Postgres for dev in a later change if latency remains unacceptable.

## Migration Plan

1. Add or verify a lightweight health endpoint and update Compose health checks.
2. Recreate the web container so env and health changes take effect.
3. Add production-like Docker instructions/profile without removing `next dev`.
4. Optimize high-traffic pages incrementally, starting with pages that show slow logs.
5. Add route smoke/timing checks and document expected first-hit vs warm-hit behavior.
6. Add `SYSTEM_PAGE_FUNCTION_MAP.md` and keep it updated with the final route list.

Rollback is straightforward: restore the previous Compose command/health check and revert page-level query optimizations. No database migration is required.

## Open Questions

- Should the production-like Docker mode be a separate Compose profile, a separate Compose file, or a documented command sequence?
- Should route warmup run automatically after startup, or remain a manual helper script?
- Should development use local Postgres in Docker while production/demo uses Neon?
- What navigation timing threshold is acceptable for warmed pages: under 500ms, under 1s, or another target?
