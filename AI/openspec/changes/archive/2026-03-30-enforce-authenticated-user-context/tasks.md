## 1. Audit Current Auth Context Gaps

- [x] 1.1 Inspect frontend login, session storage, and shared API helpers to document how the access token is stored and where protected finance or receipt calls currently omit `Authorization`
- [x] 1.2 Inspect finance-service endpoints and services to identify global queries, default-user behavior, and any places that derive ownership without JWT context
- [x] 1.3 Inspect receipt-service endpoints and finance integration to identify `RECEIPT_DEFAULT_USER_ID`, client-trusted identity inputs, and missing receipt ownership checks
- [x] 1.4 Reconcile the implementation assumptions with the proposal, design, and spec text before coding so the change artifacts reflect the real system

## 2. Frontend Authenticated Request Handling

- [x] 2.1 Add or update a shared frontend auth/session helper that returns the current access token and a consistent missing-session result for protected pages
- [x] 2.2 Centralize protected fetch behavior in the shared API layer so finance-service and receipt-service requests automatically attach `Authorization: Bearer <access_token>`
- [x] 2.3 Update dashboard and receipt page flows to use the shared protected-request helper and redirect or fail gracefully when the token is missing
- [x] 2.4 Verify that no protected frontend flow still sends raw `user_id` or duplicates token-attachment logic in individual pages

## 3. Finance-Service JWT Enforcement

- [x] 3.1 Add JWT validation, authenticated-user extraction, and protected-route enforcement for finance-service dashboard, wallet, category, and transaction endpoints
- [x] 3.2 Scope dashboard summary, wallet listing, and transaction listing queries to the authenticated user instead of returning global data
- [x] 3.3 Update wallet and transaction creation to derive ownership from the JWT user and remove reliance on `FINANCE_DEFAULT_USER_ID`
- [x] 3.4 Add ownership checks that return `403` when a user attempts to use another user's wallet or view another user's finance data

## 4. Receipt-Service JWT Enforcement

- [x] 4.1 Add JWT validation, authenticated-user extraction, and protected-route enforcement for receipt upload, detail, parse, feedback, and confirm endpoints
- [x] 4.2 Replace `RECEIPT_DEFAULT_USER_ID` ownership writes by persisting `receipts.user_id` and `feedback.user_id` from the authenticated JWT user
- [x] 4.3 Scope receipt loading and mutation paths to the authenticated owner and return `403` for another user's receipt
- [x] 4.4 Update receipt-service to preserve authenticated user context during confirm by forwarding the validated bearer token or equivalent trusted auth context into finance-service

## 5. Verification and Final Review

- [x] 5.1 Run service-specific validation or tests for the frontend, finance-service, and receipt-service after the auth-context changes compile cleanly
- [x] 5.2 Perform end-to-end verification for login, authenticated dashboard load, receipt upload, parse, review, feedback, and confirm, confirming the resulting finance transaction belongs to the logged-in user
- [x] 5.3 If feasible locally, verify that a second user cannot access another user's receipt, wallet, transaction, or dashboard-backed data
- [x] 5.4 Capture the final delivery summary with files changed, auth-context issues found, exact fixes made, commands run, and any remaining limitations after local testing passes
