## Requirements

### Requirement: Category suggestion is constrained to the current user's expense categories
The system SHALL prepare the category candidate set from categories the authenticated user can access, limited to expense categories only, before sending the request to Groq.

#### Scenario: User has visible expense categories
- **WHEN** the OCR parse route prepares the category candidates for a signed-in user
- **THEN** it includes only categories that are both visible to that user and marked as expense categories

#### Scenario: User has income categories or hidden categories
- **WHEN** the user's accessible category set contains income categories or categories outside their access scope
- **THEN** those categories are excluded from the Groq candidate set

### Requirement: Candidate set is de-duplicated before Groq selection
The system SHALL de-duplicate exact category name collisions after normalization before sending the candidate set to Groq.

#### Scenario: User-visible categories contain duplicate normalized names
- **WHEN** multiple candidate categories normalize to the same expense category name
- **THEN** the system sends only one canonical candidate for that normalized name to Groq

### Requirement: Groq returns a suggestion, not a forced final category
The system SHALL return the Groq-selected category as an editable suggestion in the OCR review fields and SHALL NOT treat it as final until the user confirms the review form.

#### Scenario: Groq selects a category
- **WHEN** Groq returns a valid category from the constrained candidate set
- **THEN** the category is prefilled in the review form and remains editable by the user before confirmation

#### Scenario: Groq cannot produce a valid category
- **WHEN** Groq fails or returns no valid category from the constrained candidate set
- **THEN** the OCR review form is still returned with an empty category selection that the user can choose manually
