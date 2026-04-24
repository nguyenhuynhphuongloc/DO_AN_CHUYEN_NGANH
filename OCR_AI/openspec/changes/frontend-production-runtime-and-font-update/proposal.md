## Why

The frontend currently runs through the Vite development server inside Docker Compose, which adds avoidable runtime overhead and makes the premium UI feel less smooth than intended. This change is needed now to move the frontend container to a basic production-serving path and align typography with the intended product polish by switching to Plus Jakarta Sans.

## What Changes

- Replace the Docker Compose frontend runtime from a development server workflow to a basic production-oriented workflow that builds static assets and serves them from a lightweight runtime.
- Update the frontend typography baseline to use `Plus Jakarta Sans` across the application while preserving the existing premium black-and-gold visual direction.
- Keep the current route structure and product modules intact; this change is focused on delivery mode, perceived responsiveness, and typography consistency rather than feature expansion.

## Capabilities

### New Capabilities
- `frontend-production-runtime`: Production-oriented frontend container behavior for Docker Compose, including static asset build and serving expectations.
- `frontend-typography-baseline`: Typography baseline requirements for the frontend, including the switch to Plus Jakarta Sans for the premium finance experience.

### Modified Capabilities
- None.

## Impact

- Affected Docker frontend packaging and Compose runtime behavior.
- Affected frontend styling entrypoints, font loading strategy, and theme baseline.
- No backend API behavior changes are expected.
