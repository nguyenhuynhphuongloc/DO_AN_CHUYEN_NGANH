## Why

FinTrack currently feels slow when switching pages in Docker because the development server compiles routes on first navigation, some frontend health checks and redirects trigger expensive page compilation, and several server-rendered pages perform multiple Payload/Neon database queries before returning. The system also lacks a maintained page/function map, making it harder to reason about what each route loads and which interactions are expected.

## What Changes

- Add a Docker/navigation performance pass focused on reducing first-click delays, unnecessary route compilation, redundant redirects, and repeated server queries.
- Establish a lightweight health endpoint and ensure container health checks never hit authenticated frontend pages or routes that compile large UI bundles.
- Review main user-facing pages for server-side query patterns and standardize parallel data fetching, `select` usage, limits, and shared finance data services.
- Add a route pre-warming strategy for local Docker development so the main app pages compile predictably after startup instead of during user clicks.
- Add a documented production-like Docker run path for realistic UI testing outside `next dev`.
- Normalize environment guidance for remote Neon/Postgres SSL settings to avoid misleading runtime warnings.
- Add and maintain a system page/function map document describing each user-facing page, its functions, APIs, data dependencies, and user interactions.
- No breaking API or database contract changes are intended.

## Capabilities

### New Capabilities

- `navigation-performance`: Docker and Next.js navigation responsiveness, route warmup, health checks, production-like local runs, and server-page query performance requirements.
- `system-page-function-map`: Documentation requirements for page inventory, page functions, API interactions, data dependencies, and expected user workflows.

### Modified Capabilities

- `dockerized-developer-workspace`: Docker development behavior changes so health checks, env reloads, and route compilation do not make page navigation appear broken or unusually slow.
- `full-website-docker-compose-run`: Docker Compose run behavior changes to support both development and production-like testing modes with clear expectations.

## Impact

- Docker/runtime: `docker-compose.yml`, Dockerfile/runtime scripts, health checks, optional warmup scripts, and local development commands.
- Next.js routes: `/`, `/dashboard`, `/transactions`, `/categories`, `/reports`, `/savings`, `/chat`, `/scan`, `/setup`, `/auth/login`, `/auth/register`, and `/receipts/[id]`.
- Frontend utilities: `Sidebar`, `MonthFilter`, shared layout/navigation behavior, and route loading states.
- Server data services: `getWalletSetupState`, `getFinanceStats`, and page-level Payload query patterns.
- Environment files: `.env`, `.env.example`, and documentation around Neon/Postgres SSL mode.
- Documentation: new `SYSTEM_PAGE_FUNCTION_MAP.md`.
- Tests/checks: TypeScript check, targeted route smoke checks, Docker health check validation, and optional timing benchmarks for common navigation paths.
