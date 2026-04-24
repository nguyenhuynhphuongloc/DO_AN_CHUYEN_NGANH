## Why

The current frontend is limited to authentication and a standalone OCR flow, which is not sufficient for a personal finance product that needs a cohesive dashboard, transaction management, budgeting, savings, reporting, and an integrated AI workspace. A proposal is needed now to align the UI direction, module boundaries, and frontend architecture before implementation expands into more pages and integrations.

## What Changes

- Introduce a premium personal-finance application shell with a persistent header, footer, left navigation sidebar, and required user menu section.
- Add a full finance-oriented page set for dashboard, transactions, budgets, categories, savings goals, reports, OCR receipts, settings, and the AI assistant workspace named `AI Vanilla`.
- Redesign the login experience to match the premium dark fintech visual system while preserving the existing authentication flow.
- Expand the protected OCR experience into a more polished, multi-state workflow with upload, preview, processing, editable extracted fields, and finance-record confirmation.
- Add an `AI Vanilla` workspace that supports chatbot mode and OCR mode inside the same module, including text input, image upload, conversation history, and OCR actions.
- Reorganize the frontend codebase into clearer route, shared component, feature, hook, service, type, theme, and mock-data boundaries so future auth-service, finance-service, and OCR-service integrations remain maintainable.

## Capabilities

### New Capabilities
- `premium-finance-shell`: Premium application shell, navigation, theming, responsive layout, and reusable shared UI patterns for the finance product.
- `personal-finance-management-ui`: Dashboard, transactions, budgets, categories, savings goals, reports, settings, and demo-ready page workflows for the finance experience.
- `ai-vanilla-workspace`: Unified intelligent workspace named `AI Vanilla` with chatbot mode, OCR mode, image upload, and shared OCR/chat interaction surfaces.

### Modified Capabilities
- `frontend-auth-flow`: Upgrade login presentation and post-auth entry expectations so authentication fits the premium finance product experience.
- `authenticated-ocr-entry`: Expand the protected OCR page requirements to support the refined receipt workflow, navigation-shell integration, and finance-record confirmation states.
- `receipt-ocr-review-ui`: Evolve the reusable OCR review UI so it supports the richer receipt upload, preview, processing, review, and confirmation experience required by the new product shell and AI workspace.

## Impact

- Affected frontend code under `src/`, including routing, page composition, shared UI components, auth entry pages, and OCR module integration.
- New reusable component layers, navigation configuration, mock data, theme primitives, and placeholder service boundaries for future backend integration.
- Existing auth-service, finance-service, and OCR client integrations remain relevant but will need clearer frontend consumption points after the refactor.
- Styling and component dependencies will likely expand to support the premium UI system, charts, and reusable interaction patterns.
