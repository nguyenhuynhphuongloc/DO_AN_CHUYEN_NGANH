## 1. Microservice Foundation

- [x] 1.1 Create the `microservices/` root with `auth-service` and `finance-service` directory structures
- [x] 1.2 Add per-service env templates, config loaders, health endpoints, and application bootstrap files
- [x] 1.3 Add Neon/Postgres connection modules using `AUTH_DATABASE_URL` and `FINANCE_DATABASE_URL`

## 2. Auth Service

- [x] 2.1 Add auth-service migrations for `users`, `roles`, `user_roles`, and `refresh_tokens`
- [x] 2.2 Add auth-service repositories, handlers or controllers, and routes for register, login, refresh token, and current-user flows
- [x] 2.3 Add password hashing and token issuance utilities wired into the auth-service starter flow

## 3. Finance Service

- [x] 3.1 Add finance-service migrations for `budget_profiles`, `income_sources`, `wallets`, `categories`, `category_allocation_rules`, `budgets`, and `transactions`
- [x] 3.2 Add finance-service repositories, handlers or controllers, and routes for wallets, categories, budget profiles, category allocation rules, and transactions
- [x] 3.3 Add finance-service transaction creation logic that saves confirmed OCR results directly into `transactions` and updates wallet and budget state

## 4. OCR Handoff And Docs

- [x] 4.1 Remove the new architecture’s dependency on receipt-persistence direction in service scaffolding and docs
- [x] 4.2 Document the stateless OCR handoff flow from OCR extraction to confirmed finance transaction persistence
- [x] 4.3 Add service notes or README guidance explaining folder structure, env variables, migration commands, and run flow for the new microservices
