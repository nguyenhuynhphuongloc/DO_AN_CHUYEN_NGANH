## Context

The project now has two additive changes: a backend OCR flow that produces a normalized receipt payload through n8n and a frontend review module that edits and submits that payload to a mock save endpoint. The remaining work is not a new feature surface so much as an integration-hardening pass that makes those pieces behave like one production-like local module with a stable contract, testable behavior, and clear developer onboarding.

This pass is cross-cutting because the same data contract now spans three boundaries: OCR webhook response, client-side editable form state, and reviewed save payload. The module also needs stronger developer usability so another team can run it locally, understand what each endpoint expects, test happy and failure paths, and embed it into an existing system without reverse-engineering the implementation.

## Goals / Non-Goals

**Goals:**
- Keep one canonical field contract across backend OCR success responses, frontend editable state, and mock save submissions.
- Keep error behavior predictable, including HTTP status expectations and a structured user-facing message format.
- Add local run instructions, sample payloads, packaging guidance, and troubleshooting notes for developers.
- Define end-to-end validation scenarios that cover OCR success, OCR failure, review edits, and save success/failure.
- Preserve the existing architecture while tightening consistency and usability.

**Non-Goals:**
- Replacing n8n, Veryfi, React, or the current mock save approach with a different architecture.
- Introducing new heavyweight dependencies, test frameworks, or deployment platforms.
- Building production persistence, authentication, or non-local deployment automation in this pass.
- Expanding scope to unrelated expense-management features beyond the OCR module boundary.

## Decisions

### 1. Define one canonical contract and treat other shapes as internal implementation details

The end-to-end module will treat the normalized OCR success payload as canonical:
- `total_amount`
- `currency`
- `transaction_datetime`
- `merchant_name`
- `payment_method`
- `ai_suggested_category`

The reviewed save request will extend that shape with review-specific fields such as `final_category` and `notes`, rather than renaming the canonical OCR fields. This keeps the OCR contract stable while still representing user-reviewed data clearly.

Alternative considered: reusing `ai_suggested_category` as the saved final category.
Why not: it blurs the distinction between OCR suggestion and user-confirmed choice, which makes downstream behavior harder to reason about.

### 2. Use one structured error format wherever user-correctable failures are exposed

The module should use a stable error body with at least `error_code` and `message` for OCR and mock-save failures that are meant to reach the UI. The frontend should parse that shape first and degrade gracefully when an endpoint fails with non-JSON or unexpected content.

Alternative considered: separate bespoke error formats per endpoint.
Why not: it would force the client to special-case each boundary and makes documentation and testing noisier.

### 3. Add validation artifacts that are cheap to run locally

Because this repository is still local-development oriented, the integration check should favor lightweight smoke tests, sample HTTP requests, fixture payloads, and documented manual test flows rather than introducing a large new testing stack. The module should still be verifiable end to end with a short, repeatable checklist.

Alternative considered: broad end-to-end browser automation.
Why not: it may be worthwhile later, but it adds setup cost that is not necessary to lock down the current contract.

### 4. Package the solution as a reusable module boundary, not as one app-specific implementation

Packaging guidance should make clear which pieces are reusable and how to swap host-specific concerns:
- n8n OCR webhook endpoint
- React review module with endpoint props
- mock save route that can later be replaced by a real save API
- shared request/response contract examples

Alternative considered: documenting only the current local app wiring.
Why not: the prompt explicitly requires a reusable module that can be plugged into any existing system.

### 5. Keep documentation close to the implementation and driven by concrete examples

The developer documentation should include:
- local prerequisites and startup steps
- environment configuration
- sample OCR success response
- sample OCR error response
- sample reviewed save request/response
- test scenarios and expected results
- notes on how to embed the frontend module elsewhere

Alternative considered: keeping documentation high-level only.
Why not: the integration surface is narrow enough that concrete examples are more useful than abstract prose.

## Risks / Trade-offs

- [Canonical contract may drift from implementation code over time] -> Mitigation: centralize shared TypeScript types or contract documentation and validate them in smoke tests.
- [The mock save API may not mirror a future real backend exactly] -> Mitigation: document which parts are stable contract versus mock-only convenience fields.
- [Local documentation can become stale as scripts and paths change] -> Mitigation: tie docs updates to the same task group as integration changes and include executable sample commands.
- [Error text may vary between backend and frontend if parsing is inconsistent] -> Mitigation: define a preferred error shape and a frontend fallback parsing rule for unexpected responses.
- [Developers may still embed the module incorrectly] -> Mitigation: provide a minimal integration example and explicit packaging guidance for replacing only endpoints, not internal component logic.

## Migration Plan

1. Audit the existing backend, frontend, and mock save code for field-name and error-shape mismatches.
2. Align the canonical schema and update any inconsistent save request or UI state mappings.
3. Add or refine lightweight validation flows, fixture payloads, and sample requests/responses.
4. Write local setup, usage, packaging, and troubleshooting documentation next to the module.
5. Verify the full local flow from receipt upload through reviewed save using the documented scenarios.

Rollback is low risk because the change is mostly hardening and documentation: revert the consistency and docs updates and the underlying OCR and review features still remain available.

## Open Questions

- Should the mock save API use `final_category`, `category`, or both for the reviewed user-selected category?
- Is there an existing preferred location in the repo for integration docs and request/response fixtures?
- Should local validation include a scriptable smoke test command, or is a documented manual checklist sufficient for the first pass?
