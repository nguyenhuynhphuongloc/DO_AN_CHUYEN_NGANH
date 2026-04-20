## ADDED Requirements

### Requirement: Receipt OCR can run with layout guidance enabled
The receipt OCR service SHALL support layout-guided OCR when layout detection is enabled in configuration and a compatible YOLO layout model is available at the configured model path.

#### Scenario: Layout-guided OCR is selected when layout output is usable
- **WHEN** layout detection is enabled and returns usable semantic blocks for a receipt image
- **THEN** the service runs OCR within ordered layout blocks and passes layout block metadata into downstream extraction

#### Scenario: Whole-image OCR remains the fallback when layout is unusable
- **WHEN** layout detection is enabled but the model path is missing, the model fails to load, or the detected layout blocks are unusable
- **THEN** the service falls back to the existing whole-image OCR path and records the layout fallback reason in debug metadata

### Requirement: Generic YOLO layout labels are normalized into canonical receipt regions
The receipt OCR service SHALL map generic YOLO layout labels into the canonical receipt block labels `header`, `items`, `totals`, `footer`, `payment_info`, and `metadata`, using geometric fallback for ambiguous labels.

#### Scenario: Generic header and footer labels map directly
- **WHEN** a layout model emits raw labels such as `Page-header`, `Title`, or `Page-footer`
- **THEN** the service normalizes them into canonical `header` or `footer` blocks before layout-guided OCR runs

#### Scenario: Table-like labels split into items or totals by vertical position
- **WHEN** a layout model emits `Table` or `List-item` for a detected block
- **THEN** the service maps the block to `items` above the configured lower-page threshold and to `totals` below that threshold

#### Scenario: Generic text labels use geometric fallback
- **WHEN** a layout model emits a generic `Text` label for a detected block
- **THEN** the service assigns the block to `header`, `footer`, `payment_info`, or `metadata` according to the block's relative vertical position on the page
