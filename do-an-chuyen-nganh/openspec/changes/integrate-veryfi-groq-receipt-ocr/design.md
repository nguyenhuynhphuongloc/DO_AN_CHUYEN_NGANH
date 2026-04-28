## Context

`do-an-chuyen-nganh` is the main Next.js + Payload application and already contains a receipt scan page plus a generic AI proxy route. The current receipt OCR path calls the Python AI service, but that service still uses local `pytesseract`, regex extraction, and hardcoded categorization. The result is not robust enough for a production receipt flow.

The stronger receipt understanding logic already exists in the separate AI codebase under `AI/microservices/receipt-service`, where Veryfi is used for receipt parsing and Groq is used for constrained category suggestion. That code cannot be copied whole into the main app because it also contains session tables, review workflow state, finance linkage, and local OCR components that are outside the main app's scope.

The main app owns authentication, categories, media, and transactions through Payload. That means the integration boundary must preserve Payload as the system of record while delegating receipt parsing and category suggestion to the Python AI service.

## Goals / Non-Goals

**Goals:**
- Replace the current local OCR receipt parsing path with a Veryfi + Groq workflow.
- Keep the OCR integration boundary small and portable by moving only the parse, normalize, and category suggestion logic.
- Provide a review-ready scan UI where all OCR fields can be edited before save.
- Save the receipt image only after confirmation and create a standard expense transaction in Payload.
- Extend `transactions` with only the minimal extra fields needed to understand OCR-created entries later.

**Non-Goals:**
- Do not import the old receipt draft/session/job workflow from `AI/microservices/receipt-service`.
- Do not add wallet-based accounting or shared finance-service persistence into the main app.
- Do not display raw OCR text or structured parser debug JSON in the v1 review UI.
- Do not attempt to clean or redesign the entire category taxonomy as part of this change.

## Decisions

### 1. Keep the main architecture as Next/Payload -> Python AI service
The main app already depends on a Python AI service through `AI_SERVICE_URL`. Reusing that boundary avoids rewriting the Veryfi and Groq logic into Node.js and keeps external AI dependencies isolated in one runtime.

Alternative considered:
- Rewriting the receipt intelligence flow into Next/Payload server code. This was rejected because it would duplicate provider integration logic, complicate deployment, and blur the service boundary already present in the application.

### 2. Extract a focused `receipt_intelligence` module instead of copying the old receipt-service workflow
The portable part of the AI code is the combination of Veryfi parsing, receipt normalization, Groq category suggestion, and default description generation. The old parse/session/finalize subsystem is intentionally excluded because the main app does not want server-side drafts or receipt-specific persistence tables.

Alternative considered:
- Copying `parse_pipeline.py` and related API/model files into the main system. This was rejected because those files are tightly coupled to SQLAlchemy models, queue/session lifecycle, and persistence assumptions that do not match Payload.

### 3. Use dedicated OCR parse and confirm routes in the main app
The generic catch-all AI proxy route is too thin because it cannot enrich the request with category candidates or own the confirm save flow. Two dedicated routes are required:
- `POST /api/ai/ocr/receipt` for parse + suggestion
- `POST /api/ai/ocr/receipt/confirm` for media upload + transaction create

Alternative considered:
- Calling the Payload transaction API directly from the frontend after OCR parse. This was rejected because confirm is a multi-step operation and is easier to validate and fail safely from a dedicated server route.

### 4. Constrain Groq with user-visible expense categories only
The current category data is not clean enough to send wholesale to Groq. Categories can be created dynamically by existing chatbot flows, and live data already contains duplicate normalized names and narrow user-created labels. The parse route will therefore build a candidate set from:
- categories visible to the authenticated user
- expense categories only
- exact normalized de-duplication before sending to Groq

Alternative considered:
- Sending all categories from the database or letting Groq generate arbitrary category labels. This was rejected because it would increase noisy suggestions and produce invalid categories the main app cannot safely persist.

### 5. Save only minimal OCR summary fields on the transaction
The transaction schema will add only:
- `merchantName`
- `currency`
- `sourceType`

This keeps OCR-created transactions understandable without storing parser-heavy metadata in the main database.

Alternative considered:
- Storing raw OCR text, normalized JSON, and provider debug payload in the transaction. This was rejected because the user-facing goal is readability, not technical trace dumps.

### 6. Store the receipt image only after confirm
The confirm route will accept the original image again, upload it to `media`, and then create the transaction. This avoids creating orphaned receipt uploads during the review stage.

Alternative considered:
- Uploading media immediately at parse time. This was rejected because it would create storage records for scans the user may never confirm.

## Risks / Trade-offs

- **[Category candidate noise]** The category set is still user-generated and may contain narrow or inconsistent labels. → Mitigation: limit to user-visible expense categories, exact de-duplication, and keep category editable in the UI.
- **[Provider dependency]** Veryfi or Groq outages will affect receipt scan quality. → Mitigation: return parse/save failures cleanly and preserve manual review/edit paths instead of auto-saving.
- **[Two-runtime coordination]** The main app and Python AI service must stay aligned on request/response contracts. → Mitigation: define the contract explicitly in both TypeScript and Python before implementation and validate end-to-end.
- **[Partial save edge cases]** Media upload may succeed while transaction create fails. → Mitigation: return a save failure to the user in v1 and keep the confirm route logic centralized so cleanup can be added later if needed.

## Migration Plan

1. Create the OpenSpec capabilities, design, and implementation tasks in `do-an-chuyen-nganh`.
2. Add the minimal `transactions` schema fields and any related UI/admin labels in Payload.
3. Add the new `receipt_intelligence` module to the Python AI service and switch the existing OCR endpoint to the new workflow.
4. Implement the dedicated parse route in the main app that loads the filtered candidate set and forwards the image to the Python AI service.
5. Implement the dedicated confirm route that uploads the image to `media` and creates the transaction.
6. Replace the current scan page result UI with the editable review-confirm workflow.
7. Run validation for parse success, parse failure, confirm success, confirm failure, candidate filtering, and transaction creation.

Rollback strategy:
- Revert the scan page to the previous OCR flow.
- Restore the old Python OCR handler if the Veryfi/Groq integration proves unstable.
- Keep the added transaction fields benign so existing transactions remain valid if the feature is disabled.

## Open Questions

- Should the confirm route attempt to delete the uploaded media record if transaction creation fails, or is a user-facing error sufficient for v1?
- Should `currency` remain freely editable in the review form, or should it default to the parser result with limited overrides?
- Should future versions introduce an explicit “OCR-eligible category” flag if user-created categories continue to grow noisier over time?
