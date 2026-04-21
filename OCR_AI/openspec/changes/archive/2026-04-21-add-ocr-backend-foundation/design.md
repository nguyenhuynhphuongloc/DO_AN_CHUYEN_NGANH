## Context

The repository does not yet contain an OCR backend, so this change establishes both the local runtime and the integration contract. The target module is a self-hosted n8n workflow started with Docker Compose, with Veryfi used as the OCR provider behind that workflow boundary. The frontend should only know about one webhook endpoint and one normalized response format.

Veryfi's current receipts/invoices API supports synchronous document processing through `POST /api/v8/partner/documents`, supports direct file upload, and can return confidence metadata when `confidence_details=true` is enabled. That makes it suitable for a request-response OCR flow, but the provider response is broad and vendor-specific, so normalization and validation need to happen inside the workflow before anything is returned to a caller.

## Goals / Non-Goals

**Goals:**
- Start the OCR backend locally with Docker Compose and a local n8n instance.
- Accept a receipt image from a frontend through one synchronous webhook entrypoint.
- Call Veryfi from inside the workflow using credentials stored in environment variables.
- Return a strict normalized JSON contract on success and meaningful HTTP 400 errors for user-correctable OCR failures.
- Keep provider-specific field mapping and category suggestion logic isolated so the module can be plugged into other systems later.

**Non-Goals:**
- Building the expense-management frontend, database persistence, or user authentication.
- Supporting asynchronous job queues, webhooks from Veryfi, or batch ingestion in the first iteration.
- Exposing raw Veryfi JSON directly to callers.
- Implementing multi-provider OCR switching in this first foundation pass.

## Decisions

### 1. Use Docker Compose to run local n8n as the orchestration boundary

The module will be delivered as a local stack with `docker-compose.yml`, an env file template, and one or more n8n workflow exports. This keeps setup reproducible, gives a single runtime entrypoint, and avoids coupling the OCR flow to any existing backend framework.

Alternative considered: a custom Express or FastAPI service.
Why not: it offers more control, but it adds application code before the contract is even validated. n8n is sufficient for the first reusable integration layer and keeps the orchestration visible.

### 2. Use one synchronous receipt-upload webhook for the initial contract

The first version will expose a single `POST` webhook that accepts one receipt image and returns the final result within the same request. This matches the requested frontend behavior and keeps the module easy to plug into simple clients.

Alternative considered: asynchronous processing with callbacks or polling.
Why not: it adds delivery guarantees, callback registration, and state handling that are unnecessary for the initial local module.

### 3. Send the uploaded image to Veryfi as a direct file upload and request confidence details

The workflow will forward the uploaded image to Veryfi's synchronous document endpoint using direct upload rather than a public `file_url` or base64 payload. It will enable confidence details so the workflow can make validation decisions using returned quality signals instead of treating every OCR response as equally trustworthy.

Alternative considered: base64 upload.
Why not: Veryfi documents that `file_data` is the least effective upload method, and it adds unnecessary payload expansion.

### 4. Normalize the provider response in a dedicated transformation step

The workflow will map Veryfi output to the frontend schema using deterministic rules:
- `total_amount`: normalized from the OCR total value
- `currency`: normalized from `currency_code` as uppercase ISO 4217
- `merchant_name`: preferred from cleaned vendor name, falling back to raw vendor name
- `transaction_datetime`: normalized to ISO 8601 UTC; when only a calendar date is available, the workflow will emit that date at `00:00:00Z`
- `payment_method`: preferred from payment display name, then payment type, else `Unknown`
- `ai_suggested_category`: derived from a configurable rule map using Veryfi category signals and merchant hints, with fallback `Khác`

Alternative considered: returning a lightly filtered Veryfi payload.
Why not: it would leak provider-specific structure into the frontend and make future provider changes expensive.

### 5. Treat image-quality and missing-core-field cases as caller-facing validation failures

The workflow will return HTTP 400 for these correctable cases:
- invalid or missing file upload
- blurry or low-confidence receipt image
- OCR completed but required fields cannot produce a trustworthy normalized result

Expected error codes are `INVALID_INPUT`, `BLURRY_IMAGE`, `OCR_FAILED`, and `INSUFFICIENT_DATA`. Unexpected infrastructure faults such as bad credentials or n8n runtime issues should still be logged distinctly so they can be diagnosed without pretending they are user-correctable data problems.

Alternative considered: returning HTTP 200 with partial data and warnings.
Why not: the requested contract requires either a valid normalized payload or a meaningful failure, and partial success would force downstream consumers to guess what is safe to trust.

## Risks / Trade-offs

- [Veryfi field variability across receipt layouts] -> Mitigation: treat `total_amount`, `currency`, `merchant_name`, and transaction date as required for success and validate them explicitly before responding.
- [Receipts may not contain a time component] -> Mitigation: normalize date-only receipts to midnight UTC and document that convention in the contract.
- [Blur and confidence thresholds may be too strict or too lax] -> Mitigation: make thresholds configurable through environment variables and validate them with sample receipts during implementation.
- [Category suggestions may be too coarse for real expense reporting] -> Mitigation: keep category mapping rule-based and externalized so labels can evolve without changing the webhook contract.
- [n8n workflow JSON can drift from repository expectations] -> Mitigation: commit workflow exports, env templates, and usage documentation together and verify them with a smoke test request.

## Migration Plan

1. Add the Docker Compose stack, env template, and workflow export files to the repository.
2. Configure local Veryfi credentials in the env file and boot the stack.
3. Import or provision the OCR workflow in n8n and activate the webhook.
4. Run smoke tests with at least one valid receipt, one blurry receipt, and one insufficient-data receipt.
5. Publish the webhook contract and local run instructions for downstream consumers.

Rollback is straightforward because this is a new module: stop the Compose stack, remove the workflow import from n8n, and revert the added files if the integration is not ready.

## Open Questions

- Which exact Vietnamese category set should replace the initial fallback rule map beyond `Ăn uống` and `Khác`?
- Should the first iteration reject non-image uploads entirely, or also allow PDFs because Veryfi supports them?
- Does the target deployment need persistent n8n storage from day one, or is local ephemeral workflow storage acceptable for this foundation phase?
