## 1. Frontend Runtime Packaging

- [x] 1.1 Replace the Docker Compose frontend path so it no longer runs the Vite development server inside the container.
- [x] 1.2 Add a basic production-oriented frontend build-and-serve flow suitable for Docker Compose local usage.
- [x] 1.3 Verify the frontend service still respects the configured frontend port and service endpoint environment variables.

## 2. Route And Runtime Verification

- [x] 2.1 Ensure the production-serving path supports single-page application route fallback for direct route access and refresh.
- [x] 2.2 Verify the frontend still loads correctly through Docker Compose after the runtime change.

## 3. Typography Baseline

- [x] 3.1 Add `Plus Jakarta Sans` as the frontend’s primary typeface with explicit fallback fonts.
- [x] 3.2 Update the global frontend typography baseline so the new font applies consistently across the application shell and pages.

## 4. Final Validation

- [x] 4.1 Confirm the frontend feature set remains unchanged after the runtime and typography updates.
- [x] 4.2 Re-run the relevant frontend build and runtime checks to confirm the change is ready for use.
