## Context

`do-an-chuyen-nganh` is now a PostgreSQL-backed Payload/Next.js application, but its root Docker assets still come from an older template that assumes MongoDB and only starts the web container. The scan flow additionally depends on a Python AI OCR runtime, and that runtime currently lives in the sibling `AI` repository rather than under the website repository that developers actually start.

The immediate constraint is operational simplicity: a developer or tester should be able to enter `do-an-chuyen-nganh` and run one Docker Compose command that brings up the website stack needed for normal use, including OCR. The stack should keep using the existing external Neon database instead of introducing a second local database path during this change.

## Goals / Non-Goals

**Goals:**
- Make `do-an-chuyen-nganh` the self-contained Docker startup root for the website.
- Ensure `docker compose up --build` starts both the web runtime and the receipt AI runtime.
- Package the OCR runtime assets required by the scan flow inside `do-an-chuyen-nganh`.
- Replace `localhost` assumptions with Compose service discovery and explicit environment wiring.
- Document the environment and startup workflow so local execution is repeatable.

**Non-Goals:**
- Rebuild or redesign the OCR business logic itself.
- Migrate the website from Neon to a local Postgres container.
- Containerize every experimental or unrelated service from the sibling `AI` repository.
- Solve production deployment orchestration for environments outside this repository.

## Decisions

### 1. `do-an-chuyen-nganh` becomes the Docker deployment root

The repository SHALL own the Docker assets that are necessary to boot the website, including the OCR runtime it directly depends on.

Why:
- Developers start the website from `do-an-chuyen-nganh`, not from the sibling `AI` repo.
- A compose file that references sibling paths is brittle across machines and CI environments.
- Packaging the OCR runtime under this repo makes the stack reproducible and archive-friendly.

Alternative considered:
- Keep the OCR runtime in `../AI` and reference it as an external build context.
  - Rejected because it creates hidden cross-repo coupling and breaks the goal of one self-contained startup root.

### 2. The Compose stack runs only the website and the receipt AI service

The root stack SHALL contain two first-class services:
- `web`: Payload/Next.js runtime
- `receipt-ai`: Python AI OCR runtime

Why:
- These are the services required for the website's primary user-facing flows.
- The current website already uses external Neon, so adding local Postgres would create a second runtime mode without solving the immediate startup problem.

Alternative considered:
- Add a local Postgres container to Compose.
  - Rejected for this change because the existing app is already wired to Neon and the user asked for a working full-website startup, not a database migration.

### 3. The OCR runtime is packaged as a minimal embedded service

Only the files required to serve the receipt OCR API SHALL be embedded under a dedicated service subtree inside `do-an-chuyen-nganh`, rather than copying the entire sibling `AI` repository.

Why:
- The full sibling repo contains unrelated services, specs, experiments, and documents.
- The website only needs the OCR-serving subset at runtime.
- A minimal service subtree is easier to build, test, and maintain in Docker.

Alternative considered:
- Vendor the entire `AI` repository.
  - Rejected because it would bloat the website repo and carry unrelated runtime baggage.

### 4. Service communication uses Compose networking, not loopback assumptions

The web container SHALL resolve the OCR runtime through the Compose service hostname, and Docker environment examples SHALL reflect that.

Why:
- `localhost` inside a container points to that container, not to the sibling service.
- OCR startup must work the same way for every developer using Compose.

Alternative considered:
- Keep `AI_SERVICE_URL` defaulting to `http://localhost:8000` in Docker.
  - Rejected because it is only correct for non-container local runs.

### 5. Persist user-generated media and define health-checked startup

The stack SHALL mount/persist media output and define service health checks or startup dependencies that prevent the website from racing the OCR runtime.

Why:
- Uploaded receipt files should survive container restarts during local development.
- OCR-related UI flows should not fail immediately because the service has not finished booting.

Alternative considered:
- Rely on container start order without health signaling.
  - Rejected because it creates flaky startup behavior and ambiguous failure modes.

## Risks / Trade-offs

- **[Risk] Embedded OCR runtime drifts from the sibling `AI` repo** → Mitigation: isolate the embedded runtime to the minimal serving subset and document its source ownership clearly.
- **[Risk] Docker startup works but non-Docker local workflows diverge** → Mitigation: keep environment keys consistent and document both Docker and direct local run modes.
- **[Risk] External Neon dependency still prevents fully offline startup** → Mitigation: document that this change targets one-command website startup, not offline local database emulation.
- **[Risk] Media volume layout changes could affect existing paths** → Mitigation: preserve the current Payload upload path semantics and validate receipt upload/read behavior after the change.

## Migration Plan

1. Create a service subtree inside `do-an-chuyen-nganh` for the embedded receipt AI runtime.
2. Replace the legacy Mongo-oriented `docker-compose.yml` with a stack for `web` and `receipt-ai`.
3. Add or adjust Dockerfiles, entrypoints, and env examples for both services.
4. Update the website runtime configuration to use Compose-friendly OCR hostnames when containerized.
5. Validate `docker compose up --build` from repo root, then smoke test:
   - website homepage
   - auth flow
   - scan page
   - OCR route reachability
6. Remove obsolete Docker assumptions and docs that still reference Mongo-only startup.

Rollback:
- Restore the previous `docker-compose.yml` and Dockerfiles.
- Remove the embedded OCR runtime subtree.
- Revert env and documentation changes.

## Open Questions

- Whether the embedded OCR runtime should remain source-copied or later be extracted into a shared package is intentionally deferred.
- Whether to add a production-oriented Compose variant is out of scope unless implementation reveals a hard need.
