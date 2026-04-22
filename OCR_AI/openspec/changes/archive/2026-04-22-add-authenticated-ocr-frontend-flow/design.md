## Context

The repository currently exposes a reusable OCR review component, a stateless OCR backend, and Neon-backed `auth-service` and `finance-service` backends. What is still missing is a host frontend flow that turns those pieces into a usable application experience: user registration, user login, protected access to the OCR flow, and real transaction persistence into `finance-service`.

The current frontend surface is library-like rather than app-like. There is no existing routed UI, auth state model, or page structure for `/register`, `/login`, and `/ocr`. The design therefore needs to add a minimal frontend application shell without introducing heavy frontend dependencies or breaking the reusable OCR component.

## Goals / Non-Goals

**Goals:**
- Add a lightweight routed frontend with Register, Login, and protected OCR pages.
- Reuse the current React/TypeScript/Tailwind-friendly frontend direction already present in the repo.
- Connect frontend auth actions directly to `auth-service` endpoints for register, login, session bootstrap, and protected access behavior.
- Connect the OCR page to the existing OCR endpoint, then fetch wallets and categories from `finance-service` for final user confirmation.
- Persist only confirmed transaction data to `finance-service` using the canonical OCR field contract plus explicit user-confirmed fields such as wallet, category, and note.
- Keep endpoint URLs configurable through frontend environment variables so the UI can be embedded or repointed later.

**Non-Goals:**
- Replacing the stateless OCR backend with a DB-backed OCR service.
- Adding full account management, password reset, logout on all devices, or advanced auth hardening beyond the starter login/register flow.
- Introducing heavyweight UI kits or complex global state libraries.
- Persisting raw OCR text, raw OCR JSON, draft receipts, or receipt lifecycle state.

## Decisions

### 1. Add a lightweight React app shell instead of only extending the reusable component

The repo already has a reusable OCR component but not a routed application. The change will therefore add a lightweight React app shell with pages and route protection while keeping the OCR form logic modular and reusable.

Alternative considered: keeping everything inside one embeddable component with no routed shell.
Why not: that would not satisfy the requirement for Register, Login, redirect, and protected `/ocr` behavior.

### 2. Use simple React routing and auth context rather than introducing a heavy frontend framework

The current repo has React-oriented code but no Next.js or existing page framework. The new frontend should therefore use a simple React router-based structure and a small auth context or equivalent auth state utility.

Alternative considered: introducing Next.js or a more opinionated app framework.
Why not: the repo does not currently justify the additional framework surface, and the prompt explicitly prefers a lightweight approach.

### 3. Store auth session data using the existing lightweight frontend pattern, with local-development pragmatism

The frontend will store the authenticated session in a simple client-side mechanism appropriate for the current lightweight app, such as local storage plus in-memory auth context hydration on app startup. This keeps the implementation small and works with the existing local-development architecture.

Alternative considered: cookie-only server-managed sessions.
Why not: there is no existing frontend server or gateway layer in the repo to support it cleanly in this change.

### 4. Keep the OCR page thin and focused on important fields only

The protected OCR page will show receipt upload plus editable important extracted fields only:
- amount
- currency
- transaction date
- merchant name
- payment method
- suggested category

It will additionally collect wallet, final category, and note because those are needed for transaction save.

Alternative considered: exposing more raw OCR detail for debugging.
Why not: the agreed architecture says OCR remains stateless and only important confirmed invoice fields are part of the save flow.

### 5. Load wallets and categories from `finance-service` after authentication

Once the user is authenticated and visits `/ocr`, the frontend will load the user’s wallets and categories from `finance-service`. The page will attempt to prefill category selection by matching `ai_suggested_category` to the user’s category names, but the final submitted category will always be the user-confirmed one.

Alternative considered: hardcoding frontend categories or reusing static dropdown defaults.
Why not: categories are user-defined finance data owned by `finance_db.categories`.

### 6. Submit confirmed OCR data to `finance-service` as a transaction, not to mock or receipt-specific save endpoints

After OCR and user confirmation, the frontend will submit a transaction payload to `finance-service` with the final confirmed values. The frontend will set `source_type` to an OCR-based value such as `receipt`, and it will not send raw OCR text or raw OCR JSON.

Alternative considered: keeping the older mock-save API as the primary runtime path.
Why not: the backend architecture has already moved to `finance-service` as the canonical destination for confirmed OCR transactions.

## Risks / Trade-offs

- [Client-side token storage is simpler than a server-managed auth model] -> Mitigation: keep the auth utility small, explicit, and easy to replace later when a host app introduces stronger session handling.
- [The repo currently lacks a full host frontend app] -> Mitigation: add only the minimum app shell needed for the required pages and reuse the existing OCR module where possible.
- [Finance endpoints may require user identity headers or bearer auth conventions that evolve later] -> Mitigation: centralize API clients and environment configuration so request wiring can be adjusted without rewriting page components.
- [Matching OCR suggested category to user-defined categories may be imperfect] -> Mitigation: treat matching only as a prefill convenience and require explicit user confirmation before save.
- [Existing OCR specs and docs still mention older save patterns] -> Mitigation: update the modified capability specs and the implementation docs together in this change.

## Migration Plan

1. Add the frontend app shell, route structure, and environment configuration for auth, OCR, and finance endpoints.
2. Add auth API client logic, session bootstrap, Register and Login pages, and protected route behavior.
3. Extend the OCR page flow to load wallets and categories from `finance-service`.
4. Reuse or adapt the OCR review module so it supports wallet selection, user category confirmation, and transaction save submission.
5. Update docs and tests to reflect authenticated OCR access and finance transaction persistence rather than mock save behavior.

Rollback is straightforward because this change is additive at the frontend level: the routed app shell and auth flow can be reverted without changing the existing stateless OCR backend or microservice schemas.

## Open Questions

- None required for this proposal because the page set, backend ownership boundaries, and stateless OCR persistence rules are already fixed.
