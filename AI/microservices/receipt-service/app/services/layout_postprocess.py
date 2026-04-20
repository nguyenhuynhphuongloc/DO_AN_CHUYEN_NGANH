from __future__ import annotations

"""
Receipt layout post-processing.

This module is handwritten repo logic. The rewrite below is informed by two
primary-source references for document layout analysis:

- Surya layout analysis / reading order:
  https://github.com/datalab-to/surya
- PaddleOCR PP-Structure layout analysis label families:
  https://www.paddleocr.ai/v3.0.0/en/version2.x/ppstructure/model_train/train_layout.html

The core idea is:
- normalize detector-specific labels into canonical receipt roles
- preserve reading order (top-to-bottom, left-to-right)
- identify one primary body block for line items
- identify summary/totals blocks only below the body block
- avoid promoting bottom barcode/footer-like regions into totals
"""

from typing import Any

from app.core.config import settings
from app.services.layout_models import CANONICAL_LAYOUT_LABELS, LayoutBlock, RawLayoutDetection

HEADER_ALIASES = {
    "header",
    "page-header",
    "page_header",
    "section-header",
    "section_header",
    "title",
    "store_header",
    "merchant_header",
    "shop_header",
    "page-title",
    "page_title",
}

ITEM_ALIASES = {
    "item",
    "items",
    "line_items",
    "item_table",
    "products",
    "product_list",
    "list",
    "list-item",
    "list_item",
    "table",
    "form",
}

TOTAL_ALIASES = {
    "totals",
    "summary",
    "payment_summary",
    "grand_total",
    "total_block",
    "summary_block",
}

FOOTER_ALIASES = {
    "footer",
    "page-footer",
    "page_footer",
    "signature_footer",
    "footnote",
    "reference",
}

PAYMENT_ALIASES = {
    "payment",
    "payment_info",
    "payment-method",
    "payment_method",
}

METADATA_ALIASES = {
    "info",
    "metadata",
    "meta",
    "address",
    "text",
    "caption",
    "formula",
    "figure",
    "picture",
    "image",
    "text-inline-math",
    "text_inline_math",
    "table-of-contents",
    "table_of_contents",
    "handwriting",
}

BARCODE_LIKE_ALIASES = {
    "barcode",
    "qr",
    "qrcode",
    "picture",
    "figure",
    "image",
}

_LABEL_TO_CANONICAL: dict[str, str] = {}
for label in HEADER_ALIASES:
    _LABEL_TO_CANONICAL[label] = "header"
for label in ITEM_ALIASES:
    _LABEL_TO_CANONICAL[label] = "items"
for label in TOTAL_ALIASES:
    _LABEL_TO_CANONICAL[label] = "totals"
for label in FOOTER_ALIASES:
    _LABEL_TO_CANONICAL[label] = "footer"
for label in PAYMENT_ALIASES:
    _LABEL_TO_CANONICAL[label] = "payment_info"
for label in METADATA_ALIASES:
    _LABEL_TO_CANONICAL[label] = "metadata"


def map_generic_yolo_to_canonical(
    raw_label: str,
    box: tuple[int, int, int, int],
    image_height: int,
) -> tuple[str | None, str | None]:
    cleaned = (raw_label or "").strip().lower()
    safe_height = max(int(image_height), 1)
    center_y = (float(box[1]) + float(box[3])) / 2.0
    y_center_ratio = center_y / float(safe_height)

    if cleaned in {"page-header", "page_header", "title"}:
        return "header", "generic_yolo_header"
    if cleaned in {"page-footer", "page_footer"}:
        return "footer", "generic_yolo_footer"
    if cleaned in {"table", "list-item", "list_item"}:
        if y_center_ratio > 0.65:
            return "totals", "generic_yolo_table_to_totals"
        return "items", "generic_yolo_table_to_items"
    if cleaned == "text":
        if y_center_ratio < 0.25:
            return "header", "generic_yolo_text_top_band"
        if y_center_ratio > 0.85:
            return "footer", "generic_yolo_text_bottom_band"
        if 0.65 < y_center_ratio <= 0.85:
            return "payment_info", "generic_yolo_text_payment_band"
        return "metadata", "generic_yolo_text_default_metadata"
    return None, None


def _canonical_label(raw_label: str, *, bbox: tuple[int, int, int, int], image_shape: tuple[int, int]) -> tuple[str | None, str]:
    cleaned = (raw_label or "").strip().lower()
    normalized, source = map_generic_yolo_to_canonical(raw_label, bbox, image_shape[0])
    if normalized in CANONICAL_LAYOUT_LABELS:
        return normalized, source or "generic_yolo"
    normalized = _LABEL_TO_CANONICAL.get(cleaned)
    if normalized in CANONICAL_LAYOUT_LABELS:
        return normalized, "alias"
    return None, "geometry"


def _box_area_ratio(bbox: tuple[int, int, int, int], image_shape: tuple[int, int]) -> float:
    width = max(bbox[2] - bbox[0], 1)
    height = max(bbox[3] - bbox[1], 1)
    image_area = max(image_shape[0] * image_shape[1], 1)
    return (width * height) / float(image_area)


def _iou(first: tuple[int, int, int, int], second: tuple[int, int, int, int]) -> float:
    x1 = max(first[0], second[0])
    y1 = max(first[1], second[1])
    x2 = min(first[2], second[2])
    y2 = min(first[3], second[3])
    if x2 <= x1 or y2 <= y1:
        return 0.0
    intersection = (x2 - x1) * (y2 - y1)
    first_area = max((first[2] - first[0]) * (first[3] - first[1]), 1)
    second_area = max((second[2] - second[0]) * (second[3] - second[1]), 1)
    return intersection / float(first_area + second_area - intersection)


def _vertical_gap(first: LayoutBlock, second: LayoutBlock) -> int:
    return second.top - first.bottom


def _horizontal_overlap_ratio(first: LayoutBlock, second: LayoutBlock) -> float:
    overlap = max(0, min(first.right, second.right) - max(first.left, second.left))
    return overlap / float(max(min(first.width, second.width), 1))


def _top_ratio(block: LayoutBlock, image_shape: tuple[int, int]) -> float:
    return block.top / float(max(image_shape[0], 1))


def _bottom_ratio(block: LayoutBlock, image_shape: tuple[int, int]) -> float:
    return block.bottom / float(max(image_shape[0], 1))


def _center_ratio(block: LayoutBlock, image_shape: tuple[int, int]) -> float:
    return ((block.top + block.bottom) / 2.0) / float(max(image_shape[0], 1))


def _width_ratio(block: LayoutBlock, image_shape: tuple[int, int]) -> float:
    return block.width / float(max(image_shape[1], 1))


def _height_ratio(block: LayoutBlock, image_shape: tuple[int, int]) -> float:
    return block.height / float(max(image_shape[0], 1))


def _is_barcode_like(block: LayoutBlock, image_shape: tuple[int, int]) -> bool:
    raw = (block.raw_label or "").strip().lower()
    if raw in BARCODE_LIKE_ALIASES:
        return True
    return (
        _bottom_ratio(block, image_shape) >= 0.82
        and _width_ratio(block, image_shape) >= 0.5
        and _height_ratio(block, image_shape) <= 0.11
    )


def _infer_geometry_label(
    raw_label: str,
    *,
    bbox: tuple[int, int, int, int],
    image_shape: tuple[int, int],
    unknown_label: bool = False,
) -> tuple[str, bool, str]:
    block = LayoutBlock(
        index=-1,
        raw_label=raw_label,
        label="metadata",
        confidence=0.0,
        bbox=bbox,
        area_ratio=_box_area_ratio(bbox, image_shape),
        unknown_label=unknown_label,
    )
    top = _top_ratio(block, image_shape)
    bottom = _bottom_ratio(block, image_shape)
    center = _center_ratio(block, image_shape)
    width = _width_ratio(block, image_shape)
    height = _height_ratio(block, image_shape)

    if top <= 0.16 and width >= 0.3:
        return "header", unknown_label, "geometry_top_band"
    if 0.25 <= center <= 0.75 and width >= 0.5 and height >= 0.1:
        return "items", unknown_label, "geometry_main_body"
    if 0.5 <= top <= 0.82 and bottom <= 0.9 and width >= 0.3 and 0.035 <= height <= 0.18:
        return "totals", unknown_label, "geometry_summary_band"
    if bottom >= 0.84:
        return "footer", unknown_label, "geometry_footer_band"
    return "metadata", unknown_label, "geometry_default_metadata"


def _initial_block(
    detection: RawLayoutDetection,
    *,
    raw_index: int,
    image_shape: tuple[int, int],
) -> LayoutBlock:
    normalized, source = _canonical_label(
        detection.raw_label,
        bbox=detection.bbox,
        image_shape=image_shape,
    )
    unknown = normalized is None
    if normalized is None:
        normalized, unknown, source = _infer_geometry_label(
            detection.raw_label,
            bbox=detection.bbox,
            image_shape=image_shape,
            unknown_label=True,
        )
    return LayoutBlock(
        index=raw_index,
        raw_label=detection.raw_label,
        label=normalized,
        confidence=detection.confidence,
        bbox=detection.bbox,
        area_ratio=_box_area_ratio(detection.bbox, image_shape),
        unknown_label=unknown,
        metadata={"semantic_source": source},
    )


def _is_mergeable_label(label: str) -> bool:
    return label in {"header", "items", "totals", "footer", "metadata", "payment_info"}


def _should_merge(first: LayoutBlock, second: LayoutBlock, image_shape: tuple[int, int], gap_pixels: int) -> bool:
    if not (_is_mergeable_label(first.label) and _is_mergeable_label(second.label)):
        return False

    overlap = _horizontal_overlap_ratio(first, second)
    gap = _vertical_gap(first, second)
    if gap < 0 or gap > gap_pixels:
        return False

    first_top = _top_ratio(first, image_shape)
    second_top = _top_ratio(second, image_shape)
    if first.label == second.label:
        return overlap >= 0.35

    top_band_merge = first_top <= 0.35 and second_top <= 0.45 and {first.label, second.label} <= {"header", "metadata"}
    bottom_band_merge = {first.label, second.label} <= {"totals", "payment_info", "metadata"} and _bottom_ratio(second, image_shape) <= 0.92
    return overlap >= 0.45 and (top_band_merge or bottom_band_merge)


def _merge_blocks(first: LayoutBlock, second: LayoutBlock, *, merged_index: int, image_shape: tuple[int, int]) -> LayoutBlock:
    bbox = (
        min(first.left, second.left),
        min(first.top, second.top),
        max(first.right, second.right),
        max(first.bottom, second.bottom),
    )
    merged_area_ratio = _box_area_ratio(bbox, image_shape)

    if first.label == second.label:
        merged_label = first.label
    elif {first.label, second.label} <= {"header", "metadata"}:
        merged_label = "header"
    elif {first.label, second.label} <= {"totals", "payment_info", "metadata"}:
        merged_label = "totals"
    else:
        merged_label = first.label

    metadata = {
        "merged_from_indices": [first.index, second.index],
        "merged": True,
        "semantic_source": "merged",
        "merged_semantic_sources": [
            first.metadata.get("semantic_source"),
            second.metadata.get("semantic_source"),
        ],
    }
    return LayoutBlock(
        index=merged_index,
        raw_label=f"{first.raw_label}+{second.raw_label}",
        label=merged_label,
        confidence=max(first.confidence, second.confidence),
        bbox=bbox,
        area_ratio=merged_area_ratio,
        unknown_label=first.unknown_label or second.unknown_label,
        metadata=metadata,
    )


def _merge_pass(blocks: list[LayoutBlock], *, image_shape: tuple[int, int], gap_pixels: int) -> tuple[list[LayoutBlock], int]:
    if not blocks:
        return [], 0
    merged_count = 0
    result: list[LayoutBlock] = []
    current = blocks[0]
    next_index = 0

    for block in blocks[1:]:
        if _should_merge(current, block, image_shape, gap_pixels):
            current = _merge_blocks(current, block, merged_index=next_index, image_shape=image_shape)
            merged_count += 1
            continue
        current.index = next_index
        result.append(current)
        next_index += 1
        current = block

    current.index = next_index
    result.append(current)
    return result, merged_count


def _suppress_overlaps(blocks: list[LayoutBlock], *, iou_threshold: float) -> tuple[list[LayoutBlock], int]:
    kept: list[LayoutBlock] = []
    skipped = 0
    for block in sorted(blocks, key=lambda item: item.confidence, reverse=True):
        if any(_iou(existing.bbox, block.bbox) >= iou_threshold for existing in kept):
            skipped += 1
            continue
        kept.append(block)
    return sorted(kept, key=lambda item: (item.top, item.left, item.index)), skipped


def _body_score(block: LayoutBlock, image_shape: tuple[int, int]) -> float:
    top = _top_ratio(block, image_shape)
    center = _center_ratio(block, image_shape)
    bottom = _bottom_ratio(block, image_shape)
    width = _width_ratio(block, image_shape)
    score = block.area_ratio * 2.8
    score += width * 1.5
    if block.label == "items":
        score += 1.3
    if (block.raw_label or "").strip().lower() in ITEM_ALIASES:
        score += 1.0
    if 0.22 <= center <= 0.76:
        score += 0.8
    if top <= 0.25:
        score -= 1.2
    if bottom >= 0.88:
        score -= 1.6
    if _is_barcode_like(block, image_shape):
        score -= 3.0
    return score


def _summary_score(block: LayoutBlock, image_shape: tuple[int, int], *, body_bottom: int | None) -> float:
    top = _top_ratio(block, image_shape)
    bottom = _bottom_ratio(block, image_shape)
    center = _center_ratio(block, image_shape)
    width = _width_ratio(block, image_shape)
    height = _height_ratio(block, image_shape)
    score = block.area_ratio * 1.5 + width
    if block.label in {"totals", "payment_info"}:
        score += 1.0
    raw = (block.raw_label or "").strip().lower()
    if raw in TOTAL_ALIASES or raw in PAYMENT_ALIASES:
        score += 0.8
    if 0.5 <= top <= 0.86 and bottom <= 0.92:
        score += 0.6
    if 0.035 <= height <= 0.2:
        score += 0.5
    if body_bottom is not None and block.top >= body_bottom:
        score += 0.5
    if _is_barcode_like(block, image_shape):
        score -= 3.0
    if center >= 0.9:
        score -= 1.5
    return score


def _assign_semantic_roles(blocks: list[LayoutBlock], *, image_shape: tuple[int, int]) -> list[LayoutBlock]:
    if not blocks:
        return blocks

    ordered = sorted(blocks, key=lambda item: (item.top, item.left, item.index))
    body_candidates = [block for block in ordered if _body_score(block, image_shape) > 0.8]
    body_anchor = max(body_candidates, key=lambda block: _body_score(block, image_shape)) if body_candidates else None

    if body_anchor is not None:
        body_anchor.label = "items"
        body_anchor.metadata["semantic_source"] = "body_anchor"

    summary_candidates = [
        block
        for block in ordered
        if block is not body_anchor and _summary_score(block, image_shape, body_bottom=body_anchor.bottom if body_anchor else None) > 0.9
    ]
    summary_anchor = max(
        summary_candidates,
        key=lambda block: _summary_score(block, image_shape, body_bottom=body_anchor.bottom if body_anchor else None),
    ) if summary_candidates else None

    if summary_anchor is not None:
        summary_anchor.label = "totals"
        summary_anchor.metadata["semantic_source"] = "summary_anchor"

    for block in ordered:
        if block is body_anchor or block is summary_anchor:
            continue

        top = _top_ratio(block, image_shape)
        bottom = _bottom_ratio(block, image_shape)
        raw = (block.raw_label or "").strip().lower()

        if top <= 0.18:
            block.label = "header" if _width_ratio(block, image_shape) >= 0.25 else "metadata"
            block.metadata["semantic_source"] = "top_band"
            continue

        if body_anchor is not None and block.bottom <= body_anchor.top:
            if top <= 0.4:
                block.label = "header" if raw in HEADER_ALIASES or top <= 0.18 else "metadata"
                block.metadata["semantic_source"] = "pre_body_band"
            else:
                block.label = "metadata"
                block.metadata["semantic_source"] = "pre_body_metadata"
            continue

        if body_anchor is not None and block.top >= body_anchor.bottom:
            if summary_anchor is not None and block.top >= summary_anchor.top:
                if _is_barcode_like(block, image_shape) or bottom >= 0.9:
                    block.label = "footer"
                    block.metadata["semantic_source"] = "post_summary_footer"
                elif raw in PAYMENT_ALIASES:
                    block.label = "payment_info"
                    block.metadata["semantic_source"] = "post_summary_payment"
                else:
                    block.label = "metadata"
                    block.metadata["semantic_source"] = "post_summary_metadata"
            else:
                if raw in PAYMENT_ALIASES:
                    block.label = "payment_info"
                    block.metadata["semantic_source"] = "post_body_payment"
                elif _summary_score(block, image_shape, body_bottom=body_anchor.bottom) > 0.8:
                    block.label = "totals"
                    block.metadata["semantic_source"] = "post_body_summary"
                else:
                    block.label = "footer" if bottom >= 0.86 else "metadata"
                    block.metadata["semantic_source"] = "post_body_tail"
            continue

        if _is_barcode_like(block, image_shape) or bottom >= 0.9:
            block.label = "footer"
            block.metadata["semantic_source"] = "bottom_footer"
        elif block.label == "items":
            block.label = "metadata"
            block.metadata["semantic_source"] = "items_demoted_without_anchor"
        else:
            block.label = "metadata"
            block.metadata["semantic_source"] = "mid_metadata"

    return ordered


def postprocess_layout_blocks(
    raw_detections: list[RawLayoutDetection],
    *,
    image_shape: tuple[int, int],
    confidence_threshold: float | None = None,
    iou_threshold: float | None = None,
    max_blocks: int | None = None,
    min_block_area_ratio: float | None = None,
    merge_same_label_gap_pixels: int | None = None,
) -> tuple[list[LayoutBlock], dict[str, Any]]:
    min_conf = settings.ocr_layout_confidence_threshold if confidence_threshold is None else confidence_threshold
    max_iou = settings.ocr_layout_iou_threshold if iou_threshold is None else iou_threshold
    max_allowed_blocks = settings.ocr_layout_max_blocks if max_blocks is None else max_blocks
    min_area_ratio = settings.ocr_layout_min_block_area_ratio if min_block_area_ratio is None else min_block_area_ratio
    merge_gap = (
        settings.ocr_layout_merge_same_label_gap_pixels
        if merge_same_label_gap_pixels is None
        else merge_same_label_gap_pixels
    )

    filtered: list[LayoutBlock] = []
    skipped_low_confidence = 0
    skipped_small_blocks = 0
    for raw_index, detection in enumerate(raw_detections):
        if detection.confidence < min_conf:
            skipped_low_confidence += 1
            continue
        block = _initial_block(detection, raw_index=raw_index, image_shape=image_shape)
        if block.area_ratio < min_area_ratio:
            skipped_small_blocks += 1
            continue
        filtered.append(block)

    suppressed, skipped_overlap = _suppress_overlaps(filtered, iou_threshold=max_iou)
    merged, merged_count = _merge_pass(suppressed, image_shape=image_shape, gap_pixels=merge_gap)
    relabeled = _assign_semantic_roles(merged, image_shape=image_shape)
    ordered = sorted(relabeled, key=lambda item: (item.top, item.left, item.index))

    capped = ordered[:max_allowed_blocks]
    for new_index, block in enumerate(capped):
        block.index = new_index
    capped_count = max(0, len(ordered) - len(capped))

    metadata = {
        "confidence_threshold": min_conf,
        "iou_threshold": max_iou,
        "min_block_area_ratio": min_area_ratio,
        "merge_same_label_gap_pixels": merge_gap,
        "max_blocks": max_allowed_blocks,
        "raw_detection_count": len(raw_detections),
        "filtered_count": len(filtered),
        "suppressed_count": len(suppressed),
        "merged_count": merged_count,
        "final_count": len(capped),
        "skipped_low_confidence": skipped_low_confidence,
        "skipped_small_blocks": skipped_small_blocks,
        "skipped_overlap": skipped_overlap,
        "capped_count": capped_count,
    }
    return capped, metadata
