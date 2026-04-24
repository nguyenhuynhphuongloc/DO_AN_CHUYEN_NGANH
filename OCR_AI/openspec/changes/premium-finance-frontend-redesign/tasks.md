## 1. Frontend Foundation

- [x] 1.1 Audit the current `src/` frontend structure, routes, OCR module, auth flow, and reusable pieces to identify what should be preserved, moved, renamed, or removed.
- [x] 1.2 Add or configure the styling and UI dependencies needed for the premium finance interface, including theme tokens, shared primitives, and a charting solution compatible with the current Vite React stack.
- [x] 1.3 Create the target frontend folder structure for route-level screens, shared layout components, domain components, hooks, service placeholders, mock data, shared types, and configuration files.

## 2. App Shell And Navigation

- [x] 2.1 Implement the authenticated finance application shell with header, footer, left sidebar, page container, and responsive behavior.
- [x] 2.2 Add the finance navigation configuration for Dashboard, Transactions, Budgets, Categories, Savings Goals, Reports, OCR Receipts, AI Vanilla, Notifications, and Settings.
- [x] 2.3 Build the mandatory sidebar bottom user section with avatar, username, gear icon, and dropdown actions for Profile, Settings, Security, and Logout.
- [x] 2.4 Update protected routing so authenticated users enter the finance shell while public users remain on the auth routes.

## 3. Auth Entry Experience

- [x] 3.1 Redesign the login page into the premium personal-finance entry experience with refined hierarchy, remember-me, forgot-password, and consistent focus and action states.
- [x] 3.2 Align the register page styling and flow with the new auth visual system while preserving current auth-service integration behavior.
- [x] 3.3 Verify auth session restoration, redirect behavior, and logout behavior across the new shell routes.

## 4. Core Finance Pages

- [x] 4.1 Build the dashboard page with KPI cards, recent transactions, budget progress, spending by category, savings progress, and quick actions.
- [x] 4.2 Implement the transactions page with searchable table or list, filters, empty state, and add/edit/delete or detail interactions.
- [x] 4.3 Implement the budgets, categories, and savings goals pages with polished cards or tables, progress indicators, and create or edit flows.
- [x] 4.4 Implement the reports or analytics page with readable dark-theme charts, trend views, category breakdowns, and filter controls.
- [x] 4.5 Add settings and notifications placeholder pages that fit the shell and preserve navigation completeness.

## 5. OCR Experience

- [x] 5.1 Refactor the existing OCR module into reusable upload, preview, processing, result review, and confirmation components.
- [x] 5.2 Implement the dedicated OCR Receipts page using the shared OCR workflow and finance-data-backed review fields.
- [x] 5.3 Ensure the OCR review flow supports merchant name, transaction date, total amount, tax amount, category suggestion, notes, and optional line-item display before save.
- [x] 5.4 Preserve or improve current error, loading, and save-success handling for OCR-related interactions.

## 6. AI Vanilla Workspace

- [x] 6.1 Build the protected `AI Vanilla` page and label the workspace exactly as required.
- [x] 6.2 Implement the top mode switch for `Chatbot` and `OCR` inside the AI Vanilla module.
- [x] 6.3 Build the chatbot interaction area with conversation list, text input, send action, and image upload support using local demo state or service placeholders.
- [x] 6.4 Reuse the shared OCR components inside the AI Vanilla OCR tab so OCR can be triggered without leaving the assistant workspace.

## 7. Data Boundaries And Mock State

- [x] 7.1 Add navigation, theme, and constants files that centralize shell configuration and shared UI behavior.
- [x] 7.2 Create mock data files for dashboard metrics, transactions, budgets, categories, savings goals, reports, OCR review data, and AI conversation demos.
- [x] 7.3 Introduce feature-level service placeholders and shared types for future `auth-service`, `finance-service`, OCR, and AI integrations.

## 8. Refactor, Cleanup, And Verification

- [x] 8.1 Move existing frontend files into the new architecture, rename weakly named files or folders, and remove only clearly obsolete duplicates after parity is confirmed.
- [x] 8.2 Fix imports, route wiring, and component references after the restructure so the frontend builds cleanly.
- [x] 8.3 Verify the implemented routes, responsive shell behavior, auth gating, OCR workflow, and AI Vanilla mode switching in the running frontend.
- [x] 8.4 Document the old structure issues, the new structure, moved or renamed files, removed duplicates, and future backend integration notes for auth-service, finance-service, and receipt OCR service.
