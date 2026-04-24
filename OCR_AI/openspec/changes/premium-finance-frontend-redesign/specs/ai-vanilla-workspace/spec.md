## ADDED Requirements

### Requirement: The frontend provides an AI assistant workspace named AI Vanilla
The system SHALL provide a protected assistant page named exactly `AI Vanilla`, and that page SHALL present a refined workspace for intelligent finance assistance inside the main application shell.

#### Scenario: User opens AI Vanilla
- **WHEN** an authenticated user navigates to the AI Vanilla page
- **THEN** the frontend renders an assistant workspace labeled `AI Vanilla` within the shared finance shell

### Requirement: AI Vanilla supports Chatbot and OCR workspace modes
The AI Vanilla page SHALL provide a top tab or switch control with `Chatbot` and `OCR` modes, and switching modes SHALL swap the main workspace content without leaving the AI Vanilla route.

#### Scenario: User switches from Chatbot to OCR mode
- **WHEN** the user activates the OCR tab inside AI Vanilla
- **THEN** the page replaces the chat-focused content with the OCR-focused workspace while preserving the AI Vanilla module context

### Requirement: Chatbot mode supports text, image upload, and conversation interaction
When Chatbot mode is active, the system SHALL provide a conversation area, text-message composition input, send action, and image upload or attachment support suitable for finance-related assistant interactions.

#### Scenario: User sends a chat message with an image
- **WHEN** the user attaches an image and submits a text message in Chatbot mode
- **THEN** the frontend shows the pending or sent message inside the conversation area and keeps the input controls available for continued interaction

### Requirement: OCR mode reuses the OCR workflow within the AI workspace
When OCR mode is active, the system SHALL provide image upload and OCR-triggering controls inside AI Vanilla by reusing OCR-related components where practical, and the OCR mode SHALL present progress and review states consistent with the dedicated OCR page.

#### Scenario: User runs OCR from AI Vanilla
- **WHEN** the user uploads a receipt image and starts OCR from the AI Vanilla OCR tab
- **THEN** the frontend shows the OCR workflow states and review interface within the AI Vanilla workspace rather than redirecting the user to a different page
