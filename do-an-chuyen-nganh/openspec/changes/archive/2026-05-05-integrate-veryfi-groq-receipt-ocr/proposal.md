## Why

The main `do-an-chuyen-nganh` application already exposes a receipt scan screen, but the current OCR backend still relies on local `pytesseract`, regex extraction, and hardcoded categorization. That path is too weak for real receipt understanding and does not support a reliable review-and-confirm workflow for production use.

The team already has a stronger receipt intelligence workflow in the separate AI codebase using Veryfi for document parsing and Groq for constrained category suggestion. This change brings that workflow into the main application architecture without importing the old receipt draft/session subsystem, so the main app can offer a stable scan-review-confirm experience while keeping data ownership inside Payload.

## What Changes

- Replace the current local OCR receipt parsing path used by the main application with a Veryfi-based parsing workflow exposed through the existing Python AI service.
- Add a portable `receipt_intelligence` module to the Python AI service for Veryfi parsing, receipt normalization, Groq category suggestion, and default description generation.
- Introduce a dedicated Next/Payload OCR parse route that authenticates the user, prepares the category candidate set, calls the Python AI service, and returns review-ready OCR fields.
- Introduce a dedicated Next/Payload confirm route that accepts the reviewed OCR fields, uploads the receipt image to `media`, creates the transaction, and returns a success or failure result.
- Upgrade the scan page UI from raw OCR output to a two-column review flow with editable fields for merchant, date, amount, currency, category, description, and user note.
- Extend `transactions` with minimal source-tracking and receipt-summary fields needed to understand OCR-created entries after they are saved.
- Keep the UI free of raw parser text and structured debug JSON in v1; only human-readable review fields are shown.

## Capabilities

### New Capabilities
- `receipt-ai-ocr-parsing`: Parse receipt images with Veryfi and return a normalized OCR result contract that is ready for user review.
- `receipt-ai-category-selection`: Suggest a category with Groq using only the current user's allowed expense categories after candidate filtering and de-duplication.
- `receipt-ocr-review-confirm`: Support a scan-review-confirm flow in the main application that saves the receipt image only after user confirmation and creates an expense transaction from the reviewed fields.

### Modified Capabilities
- None.

## Impact

- Affected app code: `src/app/(frontend)/scan/page.tsx`, new OCR API routes under `src/app/api/ai/ocr/`, and `src/collections/Transactions.ts`.
- Affected AI backend code: `AI/main.py`, `AI/services/ocr_service.py`, and a new `AI/services/receipt_intelligence/` module composed from the existing receipt-service logic.
- Affected dependencies and configuration: Veryfi and Groq environment variables, the Python AI service request/response contract, and category filtering logic in the main application.
- Affected user workflow: receipt scanning becomes a review-confirm flow instead of immediate raw OCR output and manual follow-up entry.
