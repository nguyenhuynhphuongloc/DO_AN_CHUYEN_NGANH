## ADDED Requirements

### Requirement: Receipt layout refinement SHALL split oversized coarse text regions
The system SHALL refine coarse receipt layout detections after the existing normalization, prune, suppression, merge, and anchor-promotion stages so that oversized text-like regions can be split into separate semantic `header` and `items` blocks.

#### Scenario: Table-header anchors are detected inside an oversized text block
- **WHEN** a refined receipt contains an oversized block above the totals region with a text-like label and OCR lines containing item-table anchors such as `Tên hàng`, `SL`, `Đơn giá`, or `Thành tiền`
- **THEN** the system SHALL split that block vertically into a `header` block above the anchor and an `items` block from the anchor down to the totals boundary

#### Scenario: Table-header anchors are missing inside an oversized text block
- **WHEN** a refined receipt contains an oversized block above the totals region with a text-like label but no detectable item-table anchors
- **THEN** the system SHALL split that block using a geometric fallback that assigns the top portion to `header` and the remaining body to `items` until the totals boundary

### Requirement: Receipt layout refinement SHALL synthesize missing items coverage when safe
The system SHALL synthesize an `items` block when totals are present, no usable `items` block exists after refinement, and the receipt body still exposes a viable region between header and totals.

#### Scenario: Totals exist but items block is missing
- **WHEN** refinement finishes with a valid `totals` block and no `items` block
- **THEN** the system SHALL create a synthesized `items` block from the usable body region between the header boundary and totals top and mark that block as synthesized

#### Scenario: Body region is not usable for synthesis
- **WHEN** refinement cannot derive a valid body region for `items`
- **THEN** the system SHALL leave the block set unchanged and preserve existing downstream fallback behavior

### Requirement: Receipt layout refinement SHALL demote right-side artifact columns to metadata
The system SHALL reclassify narrow right-side vertical artifact strips from `footer`-like output to `metadata` when their geometry matches receipt noise rather than true footer structure.

#### Scenario: Right-side artifact strip matches metadata geometry
- **WHEN** a block is narrow, very tall, and positioned in the right-most area of the receipt image
- **THEN** the system SHALL assign its refined semantic label to `metadata` instead of `footer`

### Requirement: Receipt layout refinement SHALL preserve totals and final semantic ordering
The system SHALL preserve `totals` blocks without split or merge during refinement and SHALL emit final blocks in receipt semantic order.

#### Scenario: Totals block is already present
- **WHEN** refinement receives a block labeled `totals`
- **THEN** the system SHALL keep that block intact and prioritize it in the final semantic ordering

#### Scenario: Final blocks are emitted after refinement
- **WHEN** refinement completes successfully
- **THEN** the system SHALL order final blocks as `header`, `items`, `totals`, optional `footer`, then `metadata`, using y-position only as a secondary sort within that semantic priority
