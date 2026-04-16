# Session-First Receipt Rollout

## Feature flag

- `RECEIPT_SESSION_FIRST_ENABLED=false`
  - `POST /receipts/upload` keeps the legacy receipt-first flow.
- `RECEIPT_SESSION_FIRST_ENABLED=true`
  - `POST /receipts/upload` creates a temporary parse session and returns session-first review payloads.

## Temp-session lifecycle defaults

- Temporary uploads are stored under `RECEIPT_TEMP_UPLOAD_DIR`.
- Sessions expire after `RECEIPT_SESSION_EXPIRY_HOURS`.
- Expired unconfirmed sessions become cleanup-eligible after `RECEIPT_SESSION_CLEANUP_GRACE_HOURS`.
- Worker cleanup runs opportunistically when no parse jobs are available.

## Image retention

- Before confirm: image remains in temporary storage only.
- After confirm:
  - if `RECEIPT_SESSION_RETAIN_CONFIRMED_IMAGE=true`, the temp image is copied into permanent receipt storage.
  - if `RECEIPT_SESSION_RETAIN_CONFIRMED_IMAGE=false`, the temp image is moved into permanent receipt storage.

## Rollout / rollback

1. Deploy schema and code with `RECEIPT_SESSION_FIRST_ENABLED=false`.
2. Upgrade the frontend so it accepts both legacy `receiptId` and new `sessionId` flows.
3. Enable `RECEIPT_SESSION_FIRST_ENABLED=true` in non-prod and validate upload, parse, feedback, confirm, and cleanup behavior.
4. Promote the flag to default once session-first behavior is stable.
5. Roll back by switching `RECEIPT_SESSION_FIRST_ENABLED=false`; historical confirmed receipts remain unaffected.
