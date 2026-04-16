## Context

The current system already authenticates users through `auth-service` and issues access tokens whose JWT payload contains `sub`, `email`, and `role`. The main gap is after login: the frontend stores the access token in local storage, but the shared API helper does not attach it to finance-service or receipt-service requests, finance-service endpoints currently operate without JWT guards and query global data, and receipt-service still writes receipt and feedback ownership using `RECEIPT_DEFAULT_USER_ID`.

This is a cross-cutting security change that spans the Next.js frontend, NestJS finance-service, and FastAPI receipt-service. The existing OCR, review, feedback, and confirm flow must keep working, no schema migration is desired, and the resulting behavior must be testable through the end-to-end receipt confirmation path.

## Goals / Non-Goals

**Goals:**
- Ensure all protected frontend finance and receipt requests attach the logged-in bearer token through one shared helper path.
- Ensure protected finance-service endpoints derive the acting user from validated JWT claims and scope data access by that user.
- Ensure protected receipt-service endpoints derive receipt and feedback ownership from validated JWT claims and reject cross-user access.
- Preserve the existing receipt confirmation path while safely propagating authenticated user context when receipt-service calls finance-service.
- Standardize missing or invalid token responses to `401` and ownership violations to `403`.

**Non-Goals:**
- Introducing a new authentication provider, refresh-token flow redesign, or schema migration.
- Rebuilding the frontend routing model or replacing local-storage session persistence.
- Adding a full service-to-service trust framework beyond what is required for the receipt confirmation MVP flow.
- Changing OCR extraction logic, receipt data model shape, or finance transaction semantics outside user-context enforcement.

## Decisions

### Reuse the existing access token as the single source of user identity
The authenticated user id will come from the JWT `sub` claim that auth-service already issues. Frontend, finance-service, and receipt-service will treat that claim as the canonical acting user instead of accepting user identity from request bodies or environment defaults.

Alternative considered:
- Adding a separate user-context header or database lookup contract. Rejected because the JWT already contains the required identity and introducing a parallel identity channel would increase inconsistency risk.

### Centralize frontend bearer-token attachment in the shared API layer
The frontend will keep session persistence in the existing auth-storage utility, but protected API helpers will read that session through one shared helper that adds `Authorization: Bearer <access_token>` and normalizes missing-session handling. Protected pages can redirect to login or surface a consistent auth error without duplicating token plumbing in individual pages.

Alternative considered:
- Manually attaching tokens inside each page or component. Rejected because it is already missing in the current codebase and would continue to drift as new calls are added.

### Add lightweight JWT validation inside finance-service and receipt-service using the shared auth secret
Finance-service and receipt-service will validate the bearer token locally using the same access-token secret used by auth-service and expose a request-scoped authenticated user object. Finance-service will protect dashboard, wallets, transactions, and categories endpoints; receipt-service will protect upload, detail, parse, feedback, and confirm endpoints.

Alternative considered:
- Calling auth-service for token introspection on each request. Rejected for the MVP because auth-service already defines the JWT contract and local verification avoids adding synchronous cross-service auth dependencies.

### Scope finance data access and mutation ownership by authenticated user
Finance-service queries will filter wallets, transactions, and dashboard aggregates by the authenticated user id. Transaction creation will ignore any client-supplied user identity and verify that referenced wallet and category usage is valid for the acting user. Wallet creation will stop depending on `FINANCE_DEFAULT_USER_ID` and instead assign ownership from the JWT user id. Categories may remain globally defined, but access to the endpoint will still require authentication for consistency.

Alternative considered:
- Continuing to infer transaction ownership from the selected wallet alone without verifying request identity. Rejected because it allows cross-user wallet references if wallet ownership checks are incomplete.

### Enforce receipt ownership at load time and propagate the caller token during confirmation
Receipt-service will resolve the acting user once per protected request, load receipts within that user scope, and persist `receipts.user_id` and `feedback.user_id` from the validated token. For receipt confirmation, the simplest reliable MVP approach is to forward the inbound bearer token to finance-service when creating the transaction. Finance-service then performs its own JWT validation and wallet ownership checks before creating the transaction for the authenticated user.

Alternative considered:
- Passing `user_id` explicitly from receipt-service to finance-service. Rejected because it duplicates trust decisions and recreates the exact client-supplied identity problem this change is meant to remove.

## Risks / Trade-offs

- [Finance-service and receipt-service must share JWT verification settings with auth-service] -> Mitigation: document and reuse the existing access-token secret and algorithm configuration rather than inventing new token settings.
- [Protecting endpoints may expose previously hidden anonymous-call assumptions in the frontend] -> Mitigation: centralize protected fetch behavior, add graceful missing-session handling, and verify each protected page flow locally.
- [Receipt confirmation now depends on forwarding the caller token correctly] -> Mitigation: keep the forwarding logic isolated in the finance client and cover confirm flow in end-to-end verification.
- [Some current APIs may leak `user_id` fields in response bodies even after ownership is enforced] -> Mitigation: do not depend on those fields for authorization, and only remove or hide them if doing so does not break existing UI expectations.
- [Categories may not be user-owned] -> Mitigation: treat categories as authenticated reference data for this change while enforcing ownership strictly on wallets, transactions, dashboard data, and receipts.

## Migration Plan

1. Add shared frontend protected-request handling and update existing finance and receipt API helpers to use it.
2. Introduce JWT validation and authenticated-user extraction in finance-service, then scope dashboard, wallet, and transaction behavior by that user.
3. Introduce JWT validation and authenticated-user extraction in receipt-service, replace default-user ownership writes, and enforce receipt ownership on read/write flows.
4. Update receipt-service finance integration to forward the inbound bearer token when confirming a receipt.
5. Run local end-to-end verification for login, dashboard load, receipt upload, parse, review, feedback, confirm, and cross-user access checks where feasible.

Rollback:
- Revert the new guards and helper wiring in each service if a deployment issue appears.
- Restore the previous unauthenticated fetch behavior only as a temporary emergency fallback; do not keep mixed identity modes long term because they create inconsistent ownership behavior.

## Open Questions

- Whether receipt-service and finance-service already have environment wiring for the auth access-token secret or need small config additions to verify the same JWTs as auth-service.
- Whether a practical local multi-user test fixture already exists, or whether cross-user authorization testing will need a minimal second user created during verification.
