## Validation

Date: 2026-04-28

### Build and startup

Executed from `do-an-chuyen-nganh` root:

```bash
docker compose config
docker compose up --build -d
docker compose ps
```

Observed result:

- `web` built successfully with the standalone Next.js runtime
- `receipt-ai` built successfully from `services/receipt-ai/`
- both containers reached `healthy`

### Website smoke checks

Validated against the Dockerized stack at `http://127.0.0.1:3000`:

- `GET /auth/login` -> `200`
- `GET /auth/register` -> `200`
- `GET /` while unauthenticated -> `307` redirect to `/auth/login`
- register user via `POST /api/users` -> `201`
- login via `POST /api/users/login` -> `200`
- authenticated `GET /scan` -> `200`

### Embedded AI reachability

Validated through the website and through internal Compose networking:

- `POST /api/ai/advisor` through the website returned `200`
- `docker compose exec -T web node -e "fetch('http://receipt-ai:8000/health')..."` returned `200` with `{\"ok\":true}`

This confirms the `web` service can reach `receipt-ai` by Compose hostname rather than loopback.

### Media persistence

Validated by:

1. creating an authenticated expense category
2. posting a receipt image to `POST /api/ai/ocr/receipt/confirm`
3. confirming transaction creation and media upload
4. fetching:
   - `GET /api/media/<id>` -> `200`
   - `GET /api/media/file/<filename>` -> `200`
5. restarting `web` with `docker compose restart web`
6. fetching the same media record and file again

Observed result after restart:

- media record remained available -> `200`
- uploaded file remained available -> `200`
- response body size stayed non-zero (`68` bytes in the smoke fixture)

### Issues discovered and fixed during validation

1. `web` image originally selected `npm ci` because `package-lock.json` existed, even though the repo is `pnpm`-first.
   - Fix: Dockerfile now prefers `pnpm-lock.yaml` and falls back to `npm install` only when pnpm is unavailable.

2. `pnpm run build -- --no-lint` inside Docker passed `--no-lint` as a directory argument to `next build`.
   - Fix: Dockerfile now invokes `./node_modules/.bin/next build --no-lint` directly with explicit `NODE_OPTIONS`.

3. receipt confirm initially failed with `EACCES: permission denied, open 'media/receipt.png'`.
   - Cause: the named Docker volume mounted at `/app/media` was root-owned while the image ran as `nextjs`.
   - Fix: the local Compose stack now runs the `web` service as root so uploaded files remain writable in the mounted dev volume.

### Cleanup

After validation, temporary smoke data was removed:

- deleted the generated `docker.*@example.com` users
- deleted the related validation categories
- deleted the related validation transactions
- deleted the related media records and uploaded `receipt*.png` files
- removed the temporary local validation workspace under `tmp/docker-validate`
