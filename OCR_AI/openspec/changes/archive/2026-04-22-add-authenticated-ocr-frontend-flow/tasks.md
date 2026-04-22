## 1. Frontend App Shell

- [x] 1.1 Add a lightweight frontend app shell with route structure for `/register`, `/login`, and `/ocr`
- [x] 1.2 Add frontend environment configuration for auth, OCR, and finance endpoint URLs
- [x] 1.3 Add a shared API client layer and app-level loading or error utilities for auth and OCR flows

## 2. Authentication Flow

- [x] 2.1 Implement Register page UI with full name, email, password, confirm password, validation, and auth-service integration
- [x] 2.2 Implement Login page UI with email, password, validation, auth-service integration, and login redirect to `/ocr`
- [x] 2.3 Add frontend auth state persistence, session bootstrap, and protected-route guard behavior for the OCR page

## 3. Authenticated OCR Entry

- [x] 3.1 Adapt or extend the OCR review UI so the protected OCR page shows upload, important OCR fields, wallet selection, category selection, and note entry
- [x] 3.2 Load wallets and categories from finance-service after authentication and prefill the final category when the OCR suggestion matches a user-defined category
- [x] 3.3 Submit the confirmed OCR payload to finance-service as a transaction with OCR-based source metadata and user-confirmed wallet or category values

## 4. Validation And Docs

- [x] 4.1 Add frontend tests for register, login, route protection, OCR happy path, OCR failure, and save failure behavior
- [x] 4.2 Update frontend and end-to-end docs to describe login redirect, protected OCR access, configurable endpoints, and finance-service save behavior
- [x] 4.3 Add run instructions for the frontend auth + OCR flow with auth-service, OCR backend, and finance-service dependencies
