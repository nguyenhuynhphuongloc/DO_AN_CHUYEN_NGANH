## Why

The system already issues JWTs at login, but the authenticated user context is not enforced consistently after that point. The frontend stores the access token without attaching it to protected finance and receipt requests, while finance-service and receipt-service still rely on default-user fallbacks or implicitly trusted resource selection, which prevents safe multi-user behavior and ownership enforcement.

## What Changes

- Audit and correct all protected frontend API calls so finance-service and receipt-service receive the logged-in user's bearer token instead of relying on anonymous requests.
- Introduce a shared frontend session and API-auth helper path so protected pages consistently read the current session, attach `Authorization: Bearer <access_token>`, and fail gracefully when the token is missing.
- Enforce JWT-derived user identity in finance-service for dashboard, wallets, transactions, and related ownership checks instead of using global counts, wallet-derived implicit access, or default-user creation behavior.
- Enforce JWT-derived user identity in receipt-service for upload, receipt detail, parse, feedback, and confirm flows, removing `RECEIPT_DEFAULT_USER_ID`-driven ownership behavior for protected operations.
- Preserve the existing receipt OCR, review, feedback, and finance confirmation flow while making receipt confirmation propagate the authenticated user context safely to finance-service.
- Standardize unauthorized and forbidden responses so missing or invalid tokens return `401` and cross-user access returns `403` without introducing schema changes.

## Capabilities

### New Capabilities
- `frontend-authenticated-api-calls`: Ensure protected frontend finance and receipt requests use the logged-in bearer token and shared session handling.
- `finance-jwt-user-enforcement`: Require finance-service protected endpoints and mutations to resolve the acting user from JWT claims and enforce resource ownership.
- `receipt-jwt-user-enforcement`: Require receipt-service protected endpoints and confirmation flow to resolve and enforce receipt ownership from validated JWT identity.

### Modified Capabilities
- None.

## Impact

- Affected frontend code: shared API client, auth/session storage utilities, dashboard and receipt pages
- Affected backend APIs: finance-service dashboard, wallets, categories, transactions; receipt-service upload, detail, parse, feedback, confirm
- Affected service integration: receipt-service to finance-service transaction creation during receipt confirmation
- No database schema changes expected
- Local verification must cover login, dashboard, upload, parse, review, confirm, and ownership/authorization behavior
