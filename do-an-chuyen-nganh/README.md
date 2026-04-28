# FinTrack Website

`do-an-chuyen-nganh` is the main FinTrack website. It runs on Payload CMS + Next.js and uses an external PostgreSQL database through `DATABASE_URL`.

This repository now also contains the minimal embedded AI runtime that the website needs for:

- AI-assisted text parsing from chat input
- Receipt OCR parsing and category suggestion

## Docker layout

Run Docker from the root of this repository.

The local stack contains:

- `web`: Payload + Next.js website
- `receipt-ai`: embedded FastAPI service for `nlp/parse`, `ai/advisor`, and `ocr/receipt`

The embedded AI runtime lives in:

- `services/receipt-ai/`

The stack keeps using the existing external Neon/Postgres database. This change does not add a local database container.

## Environment variables

Create `.env` from `.env.example` and set at least:

- `DATABASE_URL`
- `PAYLOAD_SECRET`

For full receipt OCR support, also set:

- `VERYFI_CLIENT_ID`
- `VERYFI_CLIENT_SECRET`
- `VERYFI_USERNAME`
- `VERYFI_API_KEY`
- `GROQ_API_KEY`

`AI_SERVICE_URL` is used differently depending on the run mode:

- local non-Docker run: `http://localhost:8000`
- Docker Compose run: overridden inside the `web` container to `http://receipt-ai:8000`

## Start with Docker Compose

From the repository root:

```bash
docker compose up --build
```

After startup:

- website: `http://localhost:3000`
- embedded AI service: `http://localhost:8000`

## Local run without Docker

Website:

```bash
pnpm install
pnpm dev
```

Embedded AI runtime:

```bash
cd services/receipt-ai
pip install -r requirements.txt
uvicorn app:app --host 127.0.0.1 --port 8000 --reload
```

## Persisted data

Website media uploads are stored in the Docker volume:

- `media-data`

This keeps uploaded receipt files available after the `web` container is recreated.

## Quick smoke checks

1. Open `http://localhost:3000`
2. Open `http://localhost:3000/auth/login`
3. Register or log in
4. Open `http://localhost:3000/chat`
5. Open `http://localhost:3000/scan`

## Common failure modes

### Website does not start

Check:

- `docker compose logs web`
- `DATABASE_URL`
- `PAYLOAD_SECRET`

### OCR route fails

Check:

- `docker compose logs receipt-ai`
- `VERYFI_*`
- `GROQ_*`

### Chat AI routes fail

Check:

- `docker compose logs receipt-ai`
- `AI_SERVICE_URL` inside the `web` container

### Media upload fails in Docker

Check:

- `docker compose ps`
- `docker compose logs web`

The compose stack intentionally runs the `web` service as root in local Docker mode so the mounted `media-data` volume remains writable after container recreation.

## Useful commands

```bash
docker compose ps
docker compose logs -f web
docker compose logs -f receipt-ai
docker compose restart web
```
