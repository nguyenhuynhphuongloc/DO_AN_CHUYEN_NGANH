## Context

The current Docker Compose frontend service runs the Vite development server inside the container. That setup is useful for development, but it adds watch-mode overhead, depends on mounted source files and live reload behavior, and does not represent the runtime profile expected for a smoother production-like experience. The current frontend also uses a mixed typography baseline rather than the requested `Plus Jakarta Sans`, which weakens the intended polished presentation.

This change is intentionally narrow. It does not redesign pages or add new modules; it only changes how the frontend is packaged and served in Docker Compose, and it standardizes the base font family.

## Goals / Non-Goals

**Goals:**
- Move the Docker Compose frontend path from Vite dev-server execution to a basic production-oriented static build and serving flow.
- Preserve the current route structure and frontend feature set while improving the runtime profile used through Compose.
- Establish `Plus Jakarta Sans` as the default frontend typeface while preserving existing theme colors, spacing, and layout hierarchy.
- Keep the operational path simple enough for local Docker Compose usage without introducing unnecessary infrastructure complexity.

**Non-Goals:**
- Rework the premium UI layout, chart composition, or interaction patterns.
- Change backend APIs or service contracts.
- Introduce CDN, asset hashing strategy changes beyond the frontend build output, or broader deployment platform concerns.
- Solve every possible performance issue in the UI; this change focuses on runtime mode and typography baseline only.

## Decisions

### 1. Serve a production build instead of running Vite dev inside Docker Compose
The frontend container should build static assets with the existing frontend build process and serve those assets from a lightweight runtime. This removes dev-only file watching, HMR behavior, and polling overhead from the Docker path.

Alternative considered:
- Keep Vite dev in Compose and only tune watcher behavior. Rejected because it still leaves the Compose path tied to development-mode overhead and does not match the desired production-like behavior.

### 2. Keep the production runtime basic and local-friendly
The implementation should use a straightforward static-serving approach appropriate for Docker Compose local usage. The goal is not to design a full production hosting platform, only to stop using the development server for the main Compose frontend path.

Alternative considered:
- Add a more complex frontend gateway or reverse-proxy topology. Rejected because the scope does not require it and it would complicate local iteration unnecessarily.

### 3. Load Plus Jakarta Sans as the frontend-wide typography baseline
The global style entry should switch the base font stack to `Plus Jakarta Sans`, while preserving acceptable fallbacks if the font cannot be loaded. Typography updates should happen at the global layer rather than by patching page components individually.

Alternative considered:
- Change fonts per page or per component. Rejected because typography consistency is a cross-cutting concern and should be controlled centrally.

### 4. Preserve current frontend routes and integration environment variables
This change should not alter the frontend module map or service URLs. The runtime packaging may change, but the same frontend app, routes, and environment-driven service endpoints should continue to work.

Alternative considered:
- Couple runtime migration with route or environment refactors. Rejected because it expands scope and makes verification less focused.

## Risks / Trade-offs

- [Production serving path differs from the current dev workflow] → Mitigation: keep local `npm run dev` available outside Compose while using Compose for the production-like runtime path.
- [Font loading may depend on external availability or packaging choices] → Mitigation: define clear fallback fonts and keep the global font declaration centralized.
- [Static-serving configuration may break SPA route refreshes if not handled correctly] → Mitigation: ensure the chosen runtime supports frontend route fallback to the main entry document.
- [Perceived smoothness may improve but not fully eliminate heavy UI rendering costs] → Mitigation: treat this as a targeted runtime-and-typography change, not a full rendering optimization pass.

## Migration Plan

1. Replace the current Docker frontend container command path so Compose builds and serves the production frontend output.
2. Preserve the existing environment variable contract used by the frontend build/runtime.
3. Update the global frontend style baseline to load and apply `Plus Jakarta Sans`.
4. Verify the frontend still serves correctly via Docker Compose, including direct route access and static asset loading.
5. Keep the standard local development workflow available separately from the Compose production-like path.

Rollback strategy:
- Revert the frontend container back to the current Vite dev-server-based Compose configuration and restore the previous font baseline.

## Open Questions

- Whether the static-serving runtime should be Nginx or a thinner Node-based static server in this repo’s local environment.
- Whether the font should be bundled locally or loaded from a remote provider during initial implementation.
