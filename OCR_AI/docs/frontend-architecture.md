# Frontend Architecture Refactor Summary

## Old Structure Issues

- The previous frontend centered on `src/app/pages` plus a standalone `src/receipt-ocr` module, which made the product feel like an auth + OCR demo rather than a finance application.
- Service calls, auth state, page layout, and OCR UI were spread across folders that did not reflect domain boundaries.
- The protected experience only covered the OCR page, so the app had no reusable authenticated shell for future finance modules.
- Styling lived in a single legacy `src/styles.css` file tailored to the older auth and OCR views.

## New Structure

The frontend now follows a domain-oriented structure:

```text
src/
  app/
    App.tsx
    AppRoutes.tsx
    config.tsx
    pages/
  components/
    ai-vanilla/
    budgets/
    categories/
    dashboard/
    layout/
    ocr/
    reports/
    savings-goals/
    shared/
    transactions/
  features/
    ai-vanilla/services/
    auth/
    finance/hooks/
    finance/services/
    ocr/services/
  hooks/
  lib/
  mocks/
  styles/
  types/
```

## What Was Moved

- Auth state and persistence moved from `src/app/auth/*` to `src/features/auth/*`.
- Auth-service transport helpers moved from `src/app/api/auth.ts` to `src/features/auth/services/authService.ts`.
- Finance metadata transport moved from `src/app/api/finance.ts` to `src/features/finance/services/financeService.ts`.
- OCR transport and workflow responsibilities moved from `src/receipt-ocr/*` to `src/features/ocr/services/*` and `src/components/ocr/*`.
- Shared UI moved into dedicated layout and shared component folders instead of staying inline with page files.

## What Was Renamed Or Reframed

- The product entry now routes into a protected finance shell instead of only redirecting to `/ocr`.
- The OCR module was reframed from a standalone `ReceiptOcrModule` into reusable workflow pieces such as upload, preview, processing, review, and confirmation panels.
- Styling moved from `src/styles.css` to `src/styles/globals.css` with theme tokens for dark and light modes.

## What Was Removed

- Legacy `src/app/api/*`, `src/app/auth/*`, `src/app/components/*`, `src/app/TestApp.tsx`, `src/app/types.ts`, and the old `src/receipt-ocr/*` implementation.
- The old single-purpose style sheet after the new theme-aware shell and page system replaced it.

## Why The New Organization Is Better

- Page routes are now separated from reusable layout and domain UI, making future finance modules easier to scale.
- Service boundaries for `auth-service`, `finance-service`, OCR, and future assistant APIs are explicit.
- Mock data and shared types are centralized, so the UI remains demo-ready without blocking on backend integration.
- OCR can now be reused in both the dedicated receipt page and the `AI Vanilla` OCR tab without duplicating workflow logic.

## Future Integration Notes

- `auth-service`: profile, password reset, security settings, and session-management UI should extend `src/features/auth`.
- `finance-service`: replace mock dashboard, transaction, budget, category, savings, report, and notification data with domain hooks layered over service adapters.
- `receipt OCR service`: keep using `src/features/ocr/services/ocrService.ts`, and extend the response mapping if the backend begins returning tax lines, item arrays, or confidence scores.
