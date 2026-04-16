## 1. Repository and environment scaffolding

- [x] 1.1 Create the root project structure for `frontend`, `auth-service`, `finance-service`, and `receipt-service`
- [x] 1.2 Add `.env.example` files for all four apps with database URLs, JWT settings, service URLs, and frontend public API variables
- [x] 1.3 Add a root README section with install, setup, and run commands for the MVP services

## 2. Auth service foundation

- [x] 2.1 Scaffold the NestJS `auth-service` with Prisma configured for `auth_db`
- [x] 2.2 Define Prisma models and database setup for users and refresh tokens
- [x] 2.3 Implement DTOs, validation, and the `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, and `GET /auth/profile` endpoints
- [x] 2.4 Add JWT guards, CORS setup, and basic error handling for the auth APIs
- [x] 2.5 Create a repeatable seed script for `testuser@example.com` with password `123456` and role `user`

## 3. Finance service foundation

- [x] 3.1 Scaffold the NestJS `finance-service` with Prisma configured for `finance_db`
- [x] 3.2 Define Prisma models and database setup for categories, wallets, and transactions
- [x] 3.3 Implement DTOs, validation, and the `GET /categories`, `GET /wallets`, `POST /wallets`, `GET /transactions`, and `POST /transactions` endpoints
- [x] 3.4 Implement `GET /dashboard/summary` using aggregate queries suitable for the dashboard page
- [x] 3.5 Add CORS setup, starter seed data for categories if needed, and basic API error handling

## 4. Receipt service foundation

- [x] 4.1 Scaffold the FastAPI `receipt-service` with SQLAlchemy configured for `receipt_db`
- [x] 4.2 Define the receipt persistence model, local upload directory handling, and Pydantic schemas for upload, parse, feedback, and confirmation flows
- [x] 4.3 Implement `POST /receipts/upload`, `GET /receipts/{id}`, and `POST /receipts/{id}/parse` with placeholder extracted fields
- [x] 4.4 Implement `POST /receipts/{id}/feedback` and `POST /receipts/{id}/confirm` with REST integration to `finance-service`
- [x] 4.5 Add CORS configuration and basic error handling for file, parse, and integration failures

## 5. Frontend MVP pages

- [x] 5.1 Scaffold the Next.js App Router frontend with Tailwind and shared API configuration helpers
- [x] 5.2 Implement the `/login` page and auth-service integration for login and token handling
- [x] 5.3 Implement the `/dashboard` and `/transactions` pages using finance-service endpoints
- [x] 5.4 Implement the `/receipts/upload` and `/receipts/[id]/review` pages with receipt-service upload, parse, edit, and confirm flows
- [x] 5.5 Add basic layout, loading states, and user-facing error messages across the MVP pages

## 6. End-to-end verification

- [ ] 6.1 Verify all services start with the documented environment variables and local commands
- [ ] 6.2 Verify authentication, wallet and transaction creation, receipt upload, mock parsing, and receipt confirmation end to end
- [x] 6.3 Update README notes with any required migration, seed, and test-user steps discovered during implementation
