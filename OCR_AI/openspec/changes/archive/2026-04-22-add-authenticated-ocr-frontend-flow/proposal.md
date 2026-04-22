## Why

The repository already has a reusable OCR review module, but it does not yet provide a real user-facing application flow for registration, login, protected access, and saving confirmed OCR data into the microservice architecture now used by the backend. The frontend needs to be upgraded from a standalone module into an authenticated OCR entry flow that matches `auth-service`, `finance-service`, and the stateless OCR design already agreed for the project.

## What Changes

- Add a lightweight frontend application flow with dedicated Register, Login, and protected OCR pages.
- Add frontend authentication behavior wired to `auth-service` for register, login, token storage, login redirect, and route protection.
- Add an authenticated OCR page that reuses the current OCR review module patterns while exposing only important extracted invoice fields.
- Replace the earlier mock-save direction in the frontend flow with real `finance-service` integration for wallets, categories, and confirmed transaction creation.
- Define category prefill behavior so AI-suggested OCR categories only preselect user-defined finance categories and the final saved category is always the user-confirmed selection.
- **BREAKING** Retire the frontend's intended dependency on the earlier mock reviewed-receipt save path as the primary save flow, in favor of authenticated `finance-service` transaction persistence.

## Capabilities

### New Capabilities
- `frontend-auth-flow`: Provide Register and Login pages, authentication state handling, token persistence, and protected-route behavior for the frontend.
- `authenticated-ocr-entry`: Provide the authenticated OCR page that uploads receipts, shows editable extracted fields, loads wallets and categories, and saves confirmed OCR data as a finance transaction.

### Modified Capabilities
- `receipt-ocr-client-integration`: Change the frontend integration contract from mock save behavior to real `auth-service` and `finance-service` endpoint usage, including configurable environment-based URLs and authenticated save requests.
- `receipt-ocr-review-ui`: Extend the OCR review UI behavior so the final host flow includes wallet selection, user category selection, editable important fields, and save submission into finance transactions rather than reviewed-receipt persistence.
- `receipt-ocr-e2e-consistency`: Update the end-to-end contract so the frontend flow reflects login redirect, protected OCR access, category and wallet loading, and finance transaction persistence instead of the older mock save path.

## Impact

- New frontend application pages, routing, auth state utilities, and route guard logic
- Updates to the reusable OCR module integration points and type contracts
- Removal of the frontend's primary dependency on mock save behavior as the target runtime flow
- New environment variables for auth, OCR, and finance endpoints
- Documentation and tests covering register/login, protected OCR access, and confirmed transaction save behavior
