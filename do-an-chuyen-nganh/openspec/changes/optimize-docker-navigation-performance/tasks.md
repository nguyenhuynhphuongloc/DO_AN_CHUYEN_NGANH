## 1. Docker Runtime And Health

- [x] 1.1 Verify or add a lightweight `/api/health` endpoint that does not query Payload, Neon, OCR, or authenticated frontend pages.
- [x] 1.2 Update Docker Compose health checks to call the lightweight health endpoint.
- [x] 1.3 Recreate the web container and verify the container environment uses explicit database SSL mode.
- [x] 1.4 Remove or document any health check behavior that triggers `/`, `/dashboard`, `/categories`, or other expensive frontend routes.

## 2. Development And Production-Like Workflows

- [x] 2.1 Document current `next dev` behavior, including first-hit route compilation delays after container startup.
- [x] 2.2 Add or document a production-like Docker command/profile for UI performance testing without development route compilation.
- [x] 2.3 Add or document an optional route warmup command for main user-facing routes.
- [x] 2.4 Verify development hot reload remains available after workflow changes.

## 3. Navigation And Server Data Optimization

- [x] 3.1 Fix route helpers such as `MonthFilter` so they preserve the current route instead of redirecting through `/`.
- [x] 3.2 Audit `/dashboard`, `/categories`, `/transactions`, `/reports`, `/savings`, `/chat`, and `/scan` for sequential Payload queries.
- [x] 3.3 Convert independent server-page queries to `Promise.all` where access behavior remains unchanged.
- [x] 3.4 Add `select`, `depth: 0`, and sensible `limit` values to page queries where full documents are not needed.
- [x] 3.5 Consolidate repeated wallet setup and finance aggregation logic into shared services where appropriate.

## 4. Page Function Map Documentation

- [x] 4.1 Create `SYSTEM_PAGE_FUNCTION_MAP.md` at repository root.
- [x] 4.2 Document each primary frontend route with page purpose, visible functions, user actions, API calls, and data dependencies.
- [x] 4.3 Add performance notes for routes with server queries, charts, OCR/AI calls, or redirects.
- [x] 4.4 Add a maintenance note requiring page map updates when primary routes or interactions change.

## 5. Verification

- [x] 5.1 Run `npx.cmd tsc --noEmit`.
- [x] 5.2 Verify Docker Compose starts healthy without compiling authenticated frontend routes through health checks.
- [x] 5.3 Measure first-hit and warm-hit response times for `/dashboard`, `/categories`, `/transactions`, `/reports`, `/savings`, `/chat`, and `/scan`.
- [x] 5.4 Confirm PostgreSQL SSL warning no longer appears after container recreation.
- [x] 5.5 Run relevant integration or e2e smoke tests for navigation and page loading.
