## Context

The OCR backend foundation already defines a synchronous n8n webhook that returns either a normalized receipt payload or a structured HTTP 400 error. This frontend change builds directly on that contract by adding a reusable review module that any host application can embed without adopting a page framework, heavy component library, or centralized state container.

The module needs to cover the full user-facing review loop: local file selection, OCR submission to the configured endpoint, editable rendering of normalized fields, review notes, category override, and a final submission to a mock save endpoint. The UI should remain portable, so its public surface should be props-driven and its styling should remain Tailwind-friendly class markup rather than theme-bound components.

## Goals / Non-Goals

**Goals:**
- Deliver a single reusable React component that can be mounted inside an existing application.
- Keep the component implementation lightweight by using React, TypeScript, and Tailwind-compatible class names only.
- Call the OCR endpoint with `multipart/form-data` using the `receipt` file field and consume the normalized backend contract.
- Keep all OCR fields editable before submission and add `notes` plus a user-editable category dropdown.
- Provide clear upload, OCR loading, save loading, success, and error states.
- Add a mock save endpoint for reviewed data so the review workflow can be demonstrated end to end.

**Non-Goals:**
- Rebuilding or replacing the n8n OCR backend.
- Introducing heavyweight UI libraries, form frameworks, or complex global state management.
- Designing a full application shell, routing layer, or persistence database.
- Supporting multi-file upload, receipt history, or advanced validation workflows in the first pass.

## Decisions

### 1. Expose one embeddable `ReceiptOcrModule` component with prop-based integration points

The public module surface will be a single component that accepts at minimum `ocrEndpoint` and `saveEndpoint`, plus optional props such as category options, class overrides, and request headers if needed. That keeps integration simple and avoids coupling the module to a specific host app router or API client.

Alternative considered: exporting several smaller primitives only.
Why not: that improves flexibility but pushes orchestration complexity into each consuming app. A single default module is a better reusable baseline.

### 2. Manage state locally with React hooks and typed DTOs

The component will keep selected file state, preview URL, OCR result form state, notes, category override, submission state, and user messages inside local component state. Shared TypeScript interfaces will define the OCR success payload, OCR error payload, editable form state, and mock save request/response shape.

Alternative considered: introducing Zustand, Redux, or React Hook Form.
Why not: those tools are unnecessary for one self-contained module and would add integration weight the prompt explicitly avoids.

### 3. Use a staged request flow: upload -> OCR normalize -> review edit -> save

The component flow will be:
1. user selects a receipt image
2. component uploads it to `ocrEndpoint`
3. on success, normalized fields populate the editable form
4. user edits fields, notes, and category
5. component posts the reviewed payload to `saveEndpoint`

This keeps OCR and save concerns separate and makes failures easier to communicate at the right step.

Alternative considered: auto-save immediately after OCR.
Why not: it would remove the required user review step and create noisy save requests before corrections are made.

### 4. Treat OCR and save errors as first-class UI state instead of transient console failures

The component will parse backend error bodies when possible and render visible inline feedback to the user. OCR errors returned by n8n should block the review form from being treated as valid extracted data, while save errors should preserve the edited form so the user can retry.

Alternative considered: generic toast-only notifications.
Why not: transient notifications can disappear before users understand what failed, and the prompt explicitly requires visible errors.

### 5. Keep Tailwind-friendly styling at the markup layer with minimal assumptions

The component will use plain semantic HTML elements and utility-class-friendly class names so it drops into existing Tailwind projects without extra build-time integration beyond standard CSS processing. It should avoid design-system-specific tokens and keep layout structure simple: upload block, preview, editable form, status message, and submit action.

Alternative considered: CSS Modules or styled-components.
Why not: they are workable, but Tailwind-compatible markup is the stated requirement and improves portability into existing React codebases.

### 6. Define a mock save payload that extends the OCR contract with review fields

The save request will include the normalized OCR fields plus `notes`, the user-selected final category, and minimal receipt metadata if useful for simulation. The mock response should confirm success and echo a stable identifier so consuming apps can wire in later persistence without changing the review component contract.

Alternative considered: save the raw OCR payload only.
Why not: it would not represent the reviewed user-edited state and would make the mock endpoint less useful as a persistence substitute.

## Risks / Trade-offs

- [Host apps may need different category lists] -> Mitigation: make category options configurable via props and default to a sensible lightweight list.
- [The OCR endpoint may return non-JSON failures] -> Mitigation: fall back to HTTP status text and a generic message when structured parsing fails.
- [Image preview URLs can leak memory if unmanaged] -> Mitigation: revoke object URLs when files change or the component unmounts.
- [Mock save behavior may diverge from a future real API] -> Mitigation: keep request and response types explicit so the mock endpoint can be replaced behind the same interface.
- [Tailwind classes may not exist in non-Tailwind hosts] -> Mitigation: keep markup semantic and expose wrapper class overrides so hosts can restyle if needed.

## Migration Plan

1. Add shared TypeScript types for OCR payloads, reviewed form state, and mock save contracts.
2. Implement the reusable review component and lightweight helper utilities for request/response parsing.
3. Add the mock save endpoint and example integration wiring.
4. Verify the module against the existing n8n OCR endpoint using success and failure fixtures.
5. Document the embedding props and expected backend contracts for downstream consumers.

Rollback is low risk because this is an additive module: remove the component and mock endpoint files, and consuming apps simply stop rendering the module.

## Open Questions

- Should the default category dropdown include a fixed Vietnamese expense list, or should it rely entirely on host-provided options?
- Should `currency` remain freely editable text, or should it become a constrained dropdown in a later iteration?
- Does the host application need a callback prop such as `onSaveSuccess`, or is endpoint-only integration sufficient for the first pass?
