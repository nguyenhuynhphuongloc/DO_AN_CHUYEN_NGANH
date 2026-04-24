## Context

The current frontend is a Vite + React + TypeScript application with React Router, a lightweight auth context, and a protected OCR page. It does not yet provide a cohesive personal-finance product shell, shared domain-oriented UI architecture, or page coverage for transactions, budgeting, savings, reporting, and AI-assisted workflows. The requested change introduces a premium fintech-style interface while also restructuring the frontend so future `auth-service`, `finance-service`, and receipt OCR integrations remain straightforward.

The repository does not currently run on Next.js, so the implementation needs to respect the existing Vite-based setup unless a larger framework migration is explicitly planned later. The design therefore focuses on delivering the requested UI, architecture cleanup, and integration boundaries within the current frontend runtime while organizing files in a way that would keep a future App Router migration possible.

## Goals / Non-Goals

**Goals:**
- Deliver a premium dark personal-finance UI with black-dominant styling, restrained gold accents, and a polished desktop-first layout that remains responsive on smaller screens.
- Add a consistent app shell with header, footer, left sidebar, active navigation states, and mandatory bottom user section with avatar, username, and settings menu.
- Add demo-ready pages for dashboard, transactions, budgets, categories, savings goals, reports, OCR receipts, settings, and the required `AI Vanilla` workspace.
- Expand the OCR experience into a reusable workflow that supports upload, preview, processing, extracted-result review, editing, and save confirmation.
- Create a modular frontend structure that separates route composition, shared UI, domain-specific components, hooks, service adapters, mock data, and shared types.
- Preserve current auth-service and finance-service integration paths while clarifying where future API wiring belongs.

**Non-Goals:**
- Rebuild backend services or change the existing auth, finance, or OCR APIs in this proposal.
- Deliver production-grade chatbot intelligence or live OCR orchestration beyond UI-facing integration placeholders and mock/demo states.
- Migrate the repository to Next.js as part of this change.
- Replace every existing frontend file blindly; reusable code should be retained where practical and only moved or refactored when it improves maintainability.

## Decisions

### 1. Keep the existing Vite + React Router runtime and perform an incremental architectural refactor
The implementation will stay inside the current Vite application instead of attempting a simultaneous framework migration. This reduces delivery risk, preserves current entrypoints, and keeps the change focused on the product UI and code organization.

Alternative considered:
- Migrate immediately to Next.js App Router. Rejected for this change because the repo is not currently structured for Next.js, and combining a framework migration with a full UI redesign would make scope, routing, and deployment risk much higher.

### 2. Introduce a domain-oriented frontend structure under `src/`
The target layout should separate route-level screens from reusable layout and shared UI, while isolating domain-specific modules for dashboard, transactions, budgets, categories, savings goals, reports, OCR, and `AI Vanilla`. Shared hooks, theme constants, navigation config, mock data, and service placeholders should sit in explicit cross-cutting locations.

Alternative considered:
- Keep page-heavy files inside the current `src/app/pages` structure. Rejected because the requested module breadth and future service integrations would quickly make page files too large and cross-domain responsibilities too tangled.

### 3. Establish a reusable premium visual system with dark default theme and optional light variant
The UI should use a black-dominant background, muted surfaces, subtle borders, restrained gold accents, compact information density, and consistent radius/spacing/hover/focus states. A navigation/theme configuration layer should centralize tokens so the appearance remains coherent across all modules.

Alternative considered:
- Style each page independently using ad hoc CSS. Rejected because it would produce visual drift and make future theming or component reuse expensive.

### 4. Use reusable stateful UI modules backed by mock data and local component state first
Each major page should be navigable and demonstrable before complete backend wiring exists. Mock dashboards, sample transactions, budget data, savings goals, chart inputs, AI messages, and OCR review data will allow the shell and workflows to be validated while service adapters remain clearly separated for later integration.

Alternative considered:
- Wait for full backend integration before building the UI. Rejected because it blocks the frontend redesign and makes it harder to iterate on information architecture, usability, and component reuse.

### 5. Expand OCR into a shared workflow reused by both the OCR page and `AI Vanilla`
The OCR experience should be factored into reusable pieces such as upload box, image preview, processing state, result review form, and confirmation actions. The dedicated OCR page will provide the full receipt workflow, while the `AI Vanilla` OCR tab will reuse the same flow inside the assistant workspace.

Alternative considered:
- Build a separate OCR interface inside `AI Vanilla`. Rejected because duplicated OCR interaction logic would drift and increase maintenance cost.

### 6. Promote route protection from a single OCR page to the finance application shell
Authentication should continue to gate protected functionality, but the protected area should expand from only `/ocr` to the main finance workspace. Public auth routes stay outside the shell, while authenticated routes share layout, navigation, and session controls.

Alternative considered:
- Keep only the OCR page protected and leave the rest of the finance UI public. Rejected because the requested application is a personal finance product, and the shell should assume authenticated user context.

### 7. Add explicit service and integration boundaries for future backend wiring
Feature folders should expose service placeholders and shared types for `auth-service`, `finance-service`, OCR submission, and future AI requests. UI components should depend on domain hooks or view models rather than calling endpoints directly whenever practical.

Alternative considered:
- Leave API calls embedded in page components. Rejected because it couples view composition to integration details and makes the coming frontend expansion difficult to maintain.

### 8. Use a charting library that fits the React frontend without requiring a larger stack migration
Reports and dashboard analytics should use a modern React charting library suitable for dark-theme rendering and reusable card composition. The choice should favor low integration friction with the current stack.

Alternative considered:
- Custom SVG charts. Rejected because the effort is unnecessary for this phase and would slow delivery of the finance pages.

## Risks / Trade-offs

- [Introducing Tailwind-style utility patterns and new UI primitives into a CSS-based Vite app] -> Mitigation: add the styling system incrementally, keep a small shared token layer, and avoid mixing multiple competing styling approaches inside the same module.
- [A broad page redesign can create inconsistent UX if components are built page by page] -> Mitigation: define shared shell, card, table, empty, loading, filter, and form primitives before finishing page-specific views.
- [The current repo may contain useful files in the existing frontend structure] -> Mitigation: inspect and reuse good pieces, move files gradually, and avoid deleting anything unless clearly obsolete or replaced.
- [Mock-data-driven demos can drift from backend realities] -> Mitigation: isolate mock data in dedicated files and create service placeholders with integration notes so future replacement is explicit.
- [Protecting the full finance shell changes frontend navigation behavior] -> Mitigation: update the auth-flow requirements clearly and keep unauthenticated redirects deterministic.
- [OCR reuse between the dedicated OCR page and AI workspace can create prop complexity] -> Mitigation: split OCR into composable subcomponents and keep shared domain types close to the OCR feature boundary.

## Migration Plan

1. Audit the current frontend routes, shared components, auth state, OCR module, and styling approach.
2. Introduce the target folder structure and move or wrap existing auth/OCR pieces into clearer feature boundaries.
3. Build the app shell, navigation config, theme tokens, shared layout components, and demo data primitives.
4. Implement the dashboard and finance management pages using reusable cards, tables, filters, and chart containers.
5. Refactor the OCR flow into reusable components and embed it both in the dedicated OCR page and the `AI Vanilla` OCR tab.
6. Implement the `AI Vanilla` chat workspace with mock conversation state and image upload support.
7. Update protected routing so authenticated users enter the finance shell while public users remain on auth pages.
8. Verify navigation, imports, route rendering, and placeholder integration boundaries; remove only clearly obsolete duplicates after parity is confirmed.

Rollback strategy:
- Because this is a frontend-only reorganization and UI expansion, rollback can be handled by reverting the frontend change set if route composition or styling introduces regressions.

## Open Questions

- Whether the implementation should formally adopt Tailwind CSS and shadcn/ui inside the current Vite app, or emulate the same component patterns with the repo’s existing styling approach if setup cost becomes disproportionate.
- Which charting library is preferred for the repo if there is already an internal standard not yet visible in the current frontend.
- Whether the post-login default route should be the dashboard root or resume the last visited protected module.
- How much of the future AI chat interaction surface should be wired to real services during the first implementation pass versus remaining mock-driven.
