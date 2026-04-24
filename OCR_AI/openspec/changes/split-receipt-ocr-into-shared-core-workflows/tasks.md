## 1. Workflow Contracts

- [ ] 1.1 Define the shared `Receipt OCR Core` input and output contract in the n8n workflow JSON structure, including `receipt`, optional `categories_json`, structured success data, and structured error branches.
- [ ] 1.2 Define the public `Receipt OCR Form Endpoint` webhook contract and response shaping for `mode: "ocr_form"` with a nested `receipt_data` object.
- [ ] 1.3 Define the public `Receipt OCR Chatbot Endpoint` webhook contract and chatbot-safe response shaping built from the shared core output.

## 2. n8n Workflow Refactor

- [ ] 2.1 Create the `Receipt OCR Core` workflow with validation, Veryfi request, OCR normalization, review signaling, and category matching from `categories_json`.
- [ ] 2.2 Create the `Receipt OCR Form Endpoint` workflow that prepares input, executes the shared core sub-workflow, and responds with the OCR form payload.
- [ ] 2.3 Create the `Receipt OCR Chatbot Endpoint` workflow that prepares input, executes the shared core sub-workflow, and responds with the chatbot OCR payload.
- [ ] 2.4 Update n8n import/startup configuration so all new workflow JSON files are imported in local Docker runs.
- [ ] 2.5 Retire or replace the legacy single-flow `receipt-ocr` workflow path once the two new public endpoints are wired.

## 3. Frontend Integration

- [ ] 3.1 Update frontend OCR configuration to support separate OCR-form and chatbot OCR endpoints.
- [ ] 3.2 Update the OCR review flow to send category context when available and parse the new `mode: "ocr_form"` response without assuming missing fields can be omitted.
- [ ] 3.3 Update the AI Vanilla OCR mode to call the chatbot OCR endpoint and consume the structured chatbot OCR response.
- [ ] 3.4 Harden OCR response parsing so null or non-JSON OCR responses surface visible errors instead of causing property-access crashes.

## 4. Verification

- [ ] 4.1 Validate both public OCR endpoints locally with multipart receipt uploads and representative `categories_json` inputs.
- [ ] 4.2 Verify success, invalid-input, provider-failure, and weak-extraction paths return the expected structured payloads and warnings.
- [ ] 4.3 Verify the OCR review form and chatbot OCR mode both function correctly through Docker Compose using the new workflow architecture.
