## 1. Orientation Correction

- [x] 1.1 Inspect and update document-level orientation decision logic in `microservices/receipt-service/app/services/ocr_service.py` so a majority upside-down signal can trigger full-image 180-degree rotation before row ordering proceeds.
- [x] 1.2 Preserve and verify OCR debug metadata for document orientation decisions, including whether checking ran, whether rotation was applied, and the supporting consensus metrics.
- [x] 1.3 Validate the updated orientation path against upside-down receipt samples to confirm line ordering is emitted top-to-bottom after OCR.

## 2. Layout Configuration

- [x] 2.1 Update `microservices/receipt-service/app/core/config.py` to enable layout-guided OCR by default and document a placeholder `ocr_layout_model_path` for a DocLayout-YOLO compatible weight file.
- [x] 2.2 Confirm the existing layout fallback path still returns whole-image OCR when the configured model path is missing or unusable.

## 3. Layout Label Normalization

- [x] 3.1 Add a generic YOLO-to-canonical mapping helper in `microservices/receipt-service/app/services/layout_postprocess.py` for `Page-header`, `Title`, `Page-footer`, `Table`, `List-item`, and `Text`.
- [x] 3.2 Implement Y-center geometric fallback rules so ambiguous generic labels map safely into `header`, `items`, `totals`, `footer`, `payment_info`, or `metadata`.
- [x] 3.3 Verify that normalized layout blocks continue to drive `_layout_payload(...)` without breaking existing overlap suppression, merge, or semantic reassignment behavior.

## 4. Regression Verification

- [x] 4.1 Run targeted receipt OCR checks for normal and upside-down images and compare layout/debug outputs between whole-image and layout-guided paths.
- [ ] 4.2 Review extraction results for header, item-table, and payment-summary regions to confirm the new layout mapping reduces dependence on heuristic zoning without regressing fallback safety.
