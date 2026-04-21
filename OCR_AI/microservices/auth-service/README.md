# Auth Service

Neon-backed authentication microservice for `auth_db`.

## Responsibilities

- register
- login
- refresh token
- current-user
- password hashing
- token issuance

## Run

```bash
npm run migrate:auth
npm run service:auth
```

## Required env

- `AUTH_DATABASE_URL`
- `AUTH_JWT_SECRET`
- `AUTH_REFRESH_TOKEN_SECRET`

Optional:

- `HOST`
- `PORT`
- `AUTH_AUTO_MIGRATE`
- `AUTH_ACCESS_TOKEN_TTL`
- `AUTH_REFRESH_TOKEN_TTL`

## Endpoints

- `GET /health`
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `GET /auth/me`
