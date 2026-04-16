## Context

The receipt OCR system already exposes receipt metadata, extraction results, and confirmation actions through the review page at `/receipts/[id]/review`. Real PaddleOCR output is now available in `receipt_ocr_results`, but UI testing still requires an easy way to inspect raw OCR output without mixing debug content into the extraction form or changing the receipt workflow.

This change spans the receipt-service response shape and the frontend review page, but it must remain lightweight, read-only, and removable. Database schema, parse behavior, feedback behavior, and finance integration are fixed constraints.

## Goals / Non-Goals

**Goals:**
- Add a safe OCR debug payload to `GET /receipts/{id}` using only existing OCR result data.
- Render OCR debug information in a dedicated, read-only frontend panel.
- Keep the debug panel isolated behind a local toggle so it can be disabled or deleted with minimal impact.
- Preserve the existing review form, receipt actions, and API behavior outside the added debug payload.

**Non-Goals:**
- Changing OCR parsing, extraction, feedback, or confirmation behavior.
- Adding new storage, database columns, or backend write paths.
- Introducing a feature flag system or persistent debug preferences.
- Coupling the debug panel to form state or validation.

## Decisions

### Add an additive `ocr_debug` response field to `GET /receipts/{id}`
The backend will extend the receipt detail response with an `ocr_debug` object derived from `receipt_ocr_results`. This is additive and backward-compatible with the existing core fields.

Alternative considered:
- Reusing the existing `ocr_result` object directly in the UI. Rejected because it exposes backend persistence shape instead of a small debug-oriented view model and makes removal harder later.

### Keep debug payload read-only and derived from existing OCR records
The API will not write or transform additional data for the debug panel beyond formatting `raw_text`, `lines`, `provider`, and `confidence_score`. If OCR data is absent, the field will be `null` or contain safe empty values.

Alternative considered:
- Storing a separate debug projection. Rejected because it adds schema and maintenance cost for a temporary debugging feature.

### Isolate the UI into a dedicated component
The review page will render a standalone component such as `receipt-ocr-debug-panel.tsx`, receiving only debug display props. The extraction form will not import business logic from this component.

Alternative considered:
- Embedding OCR debug markup directly inside the review form. Rejected because it makes removal noisy and creates unnecessary coupling between debug output and form layout.

### Use a simple local boolean toggle in the review page
The review page will define `showOcrDebug = true` locally and conditionally render the debug panel. This satisfies the requirement for easy disablement without introducing new app-wide configuration.

Alternative considered:
- Environment variables or persisted user settings. Rejected because the feature is explicitly temporary and isolated.

## Risks / Trade-offs

- [Response shape grows slightly] → Mitigation: keep the new field additive and scoped to `GET /receipts/{id}` only.
- [Debug panel could drift into product UI] → Mitigation: label it clearly as debug-only and keep it in a removable component behind a local toggle.
- [OCR raw text can be long or messy] → Mitigation: use a scrollable bordered card with monospaced text and preserved line breaks.
- [Future removal could accidentally break review UI] → Mitigation: keep the review form independent and pass only read-only props into the panel.

## Migration Plan

1. Extend the receipt detail response type in receipt-service with an additive `ocr_debug` field.
2. Update frontend receipt types and the review page fetch usage to consume the new field.
3. Add the isolated debug panel component and conditionally render it from the review page.
4. Build the frontend and verify the review page still loads with and without OCR data.

Rollback:
- Remove the panel component usage from the review page.
- Remove the additive `ocr_debug` field from the backend response model if no longer needed.

## Open Questions

- None. The toggle, API shape, and scope are intentionally simple and bounded for a removable debug feature.
