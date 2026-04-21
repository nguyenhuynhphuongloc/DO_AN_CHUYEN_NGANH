# Microservices

This directory is the canonical backend layout for the Neon-backed microservice architecture.

Services:

- `auth-service`: owns `auth_db` and authentication flows
- `finance-service`: owns `finance_db` and persists confirmed OCR transactions

The OCR workflow remains outside this folder because it is stateless. It extracts important receipt fields and returns them to the frontend; the frontend then submits confirmed data to `finance-service`.

Each service contains:

- `.env.example`
- `migrations/`
- `src/config`
- `src/db`
- `src/controllers`
- `src/repositories`
- `src/routes`
- `src/server.js` and `src/app.js`

Root scripts:

- `npm run service:auth`
- `npm run service:finance`
- `npm run migrate:auth`
- `npm run migrate:finance`

For the standard full local workflow, use the root Docker stack so frontend, both microservices, OCR runtime, and local PostgreSQL start together through one `docker compose` entrypoint.
