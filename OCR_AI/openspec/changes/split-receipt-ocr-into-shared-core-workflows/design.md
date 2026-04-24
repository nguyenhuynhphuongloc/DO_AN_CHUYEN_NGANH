## Context

The current receipt OCR implementation is a single n8n webhook that validates an uploaded `receipt`, calls Veryfi, applies hardcoded normalization and category regexes, and returns one frontend-oriented JSON shape. That design worked for the original OCR review page, but it now creates three problems:

1. OCR logic is coupled to one entry point instead of being reusable by both the OCR review form and `AI Vanilla`.
2. Category suggestion is based on static regex groups rather than the caller's current category model.
3. The success payload is too narrow and too brittle for the new frontend flows, which need guaranteed field presence including `tax_amount`, review warnings, and review status.

The repo already treats OCR as stateless handoff logic between the frontend and an OCR provider. That constraint remains. The design therefore keeps n8n focused on orchestration and normalization, not persistence.

## Goals / Non-Goals

**Goals:**
- Introduce a shared-core OCR sub-workflow that centralizes validation, provider access, normalization, and category matching.
- Expose two public entry points on top of the shared core: one for the OCR review form and one for chatbot mode.
- Guarantee a stable structured OCR payload so the frontend does not crash when optional fields are absent.
- Replace hardcoded category-only matching with caller-provided `categories_json` while still supporting deterministic fallback behavior.
- Keep the OCR flows stateless and isolated from `finance-service` writes and raw OCR persistence.

**Non-Goals:**
- Persist receipts, OCR lifecycle events, raw Veryfi output, or review state in n8n.
- Save transactions directly to `finance-service`.
- Redesign the frontend save flow beyond consuming the new OCR contracts.
- Add a conversational LLM step inside the core OCR workflow.
- Rework OCR provider selection; Veryfi remains the provider for this change.

## Decisions

### Decision: Split the single workflow into a shared sub-workflow plus two public endpoints

The system will use three workflows:
- `Receipt OCR Core`: invoked only through `Execute Workflow`, contains the reusable OCR logic.
- `Receipt OCR Form Endpoint`: public webhook used by the OCR review form.
- `Receipt OCR Chatbot Endpoint`: public webhook used by chatbot mode.

Rationale:
- It eliminates duplicated Veryfi and normalization logic.
- It lets each public endpoint shape the response for its own consumer without forking the OCR extraction pipeline.
- It creates a clean boundary for future test coverage and future endpoint variants.

Alternatives considered:
- Keep one webhook and pass a `mode` flag. Rejected because it keeps public contract branching inside one workflow and encourages UI-specific logic in the shared extraction path.
- Duplicate two workflows. Rejected because normalization drift would become likely.

### Decision: The shared core accepts `receipt` binary plus optional `categories_json`

The core workflow contract will accept:
- binary file `receipt`
- optional JSON string `categories_json`

The core will validate the image upload, call Veryfi, normalize the OCR result, and match the best category suggestion against `categories_json`. If category input is missing or unusable, the core will still return a stable payload with `ai_suggested_category` and `ai_suggested_category_id` set to `null` or fallback label data plus a warning.

Rationale:
- The caller, not n8n, owns the live category model.
- This keeps the OCR core decoupled from any database or service lookup.

Alternatives considered:
- Fetch categories from `finance-service` inside n8n. Rejected because it adds coupling, auth concerns, and failure modes unrelated to OCR extraction.
- Keep regex-only mapping. Rejected because it cannot honor user-defined category sets.

### Decision: Normalize to a stable superset schema before endpoint-specific shaping

The core success payload will always include:
- `merchant_name`
- `transaction_datetime`
- `total_amount`
- `tax_amount`
- `currency`
- `payment_method`
- `ai_suggested_category`
- `ai_suggested_category_id`
- `warnings`
- `needs_review`

Field presence is mandatory even when value confidence is low. Missing or weakly extracted fields are represented with `null`, `0`, or warnings instead of omitting keys.

Rationale:
- Frontend OCR consumers must be able to rely on presence checks instead of defensive optional chaining everywhere.
- The form endpoint and chatbot endpoint can both derive their shapes from the same stable data object.

Alternatives considered:
- Preserve the smaller legacy schema and let each endpoint enrich it. Rejected because it spreads fallback logic outward and recreates frontend brittleness.

### Decision: Use warnings plus `needs_review` instead of failing every imperfect OCR result

The core will distinguish between:
- hard failures: invalid input, provider failure, or unusable extraction
- usable but imperfect extraction: return structured data with warnings and `needs_review: true`

Examples of warnings:
- tax missing
- category unmatched
- low confidence on merchant/date/total
- normalized payment method fell back to `other` or `null`

Rationale:
- OCR review form mode specifically exists to let users fix imperfect data.
- The chatbot can decide whether to ask follow-up questions based on `warnings` and `needs_review`.

Alternatives considered:
- Reject any response with low confidence. Rejected because it overuses failure states for data that is still valuable to review.

### Decision: Assume the third workflow is a chatbot OCR endpoint and record that assumption explicitly

The user prompt was truncated after defining the OCR form endpoint. This design assumes the third required workflow is `Receipt OCR Chatbot Endpoint`, because the new architecture explicitly must support both OCR review form mode and chatbot mode.

The chatbot endpoint will:
- accept the same `receipt` upload contract as the form endpoint
- forward optional `categories_json`
- invoke the shared core
- return a chatbot-safe response that contains the structured OCR data and mode metadata, without embedding provider output or persistence behavior

Rationale:
- It is the minimal assumption consistent with the stated architecture.
- The exact chatbot prose or downstream AI usage can remain outside this change.

Alternatives considered:
- Stop and require clarification. Rejected for now because the available context is strong enough to produce a useful apply-ready change.

## Risks / Trade-offs

- [Workflow call contract drifts between endpoints and the core] -> Define a narrow handoff contract in specs and keep endpoint-specific shaping outside the core.
- [Category matching quality varies with malformed `categories_json`] -> Treat category input as optional, validate it defensively, and emit warnings when matching cannot be trusted.
- [Legacy frontend code still expects the old OCR response shape] -> Modify the client integration spec and tasks to update the OCR form consumer to the new `mode: "ocr_form"` contract.
- [n8n sub-workflow execution can be harder to debug than a single flow] -> Keep node responsibilities narrow, use explicit success/error branches, and standardize node naming across workflows.
- [The chatbot endpoint requirements may need refinement once its UI contract is finalized] -> Keep the chatbot response focused on structured OCR data plus mode metadata and record unresolved chat-specific presentation as an open question.

## Migration Plan

1. Add the new shared core workflow JSON and two public endpoint workflow JSONs alongside the existing workflow.
2. Update environment/config wiring and deployment import commands so n8n imports all three workflows.
3. Update the OCR form frontend to call the new form webhook and parse the new `mode: "ocr_form"` response shape.
4. Introduce chatbot endpoint consumption only after the endpoint contract is wired and verified.
5. Remove or retire the old single `receipt-ocr` workflow once both consumers are migrated and local tests pass.
6. Roll back by re-importing the prior single workflow and restoring the original frontend OCR endpoint configuration.

## Open Questions

- Should the chatbot endpoint return only structured OCR data, or also a lightweight assistant-facing summary field for the chat UI?
- Should `tax_amount` default to `null` or `0` when Veryfi does not provide tax? The specs can allow either for the core, while the form endpoint may normalize to `null`.
- What exact schema should `categories_json` use: array of `{ id, name }` only, or richer objects with aliases and colors that the matcher ignores?
