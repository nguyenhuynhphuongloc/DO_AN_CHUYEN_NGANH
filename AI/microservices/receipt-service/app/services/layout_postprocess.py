from __future__ import annotations

from collections import defaultdict
from typing import Any

from app.core.config import settings
from app.services.layout_models import CANONICAL_LAYOUT_LABELS, LayoutBlock, RawLayoutDetection

_LABEL_ALIASES: dict[str, str] = {
    "header": "header",
    "store_header": "header",
    "merchant_header": "header",
    "shop_header": "header",
    "title": "header",
    "section-header": "header",
    "section_header": "header",
    "page-header": "header",
    "page_header": "header",
    "item": "items",
    "items": "items",
    "line_items": "items",
    "item_table": "items",
    "products": "items",
    "list": "items",
    "table": "items",
    "totals": "totals",
    "summary": "totals",
    "payment_summary": "totals",
    "grand_total": "totals",
    "total_block": "totals",
    "footer": "footer",
    "signature_footer": "footer",
    "page-footer": "footer",
    "page_footer": "footer",
    "footnote": "footer",
    "payment": "payment_info",
    "payment_info": "payment_info",
    "payment_method": "payment_info",
    "info": "metadata",
    "metadata": "metadata",
    "meta": "metadata",
    "address": "metadata",
    "text": "metadata",
    "caption": "metadata",
    "formula": "metadata",
    "figure": "metadata",
    "picture": "metadata",
    "image": "metadata",
}


def _normalize_raw_label(
    raw_label: str,
    *,
    bbox: tuple[int, int, int, int],
    image_shape: tuple[int, int],
) -> tuple[str, bool, str]:
    cleaned = (raw_label or "").strip().lower()
    normalized = _LABEL_ALIASES.get(cleaned)
    if normalized in CANONICAL_LAYOUT_LABELS:
        if cleaned == "text":
            return _infer_text_semantic_label(bbox, image_shape)
        return normalized, False, "alias"
    return _infer_text_semantic_label(bbox, image_shape, unknown_label=True)


def _infer_text_semantic_label(
    bbox: tuple[int, int, int, int],
    image_shape: tuple[int, int],
    *,
    unknown_label: bool = False,
) -> tuple[str, bool, str]:
    image_height, image_width = image_shape
    width = max(bbox[2] - bbox[0], 1)
    height = max(bbox[3] - bbox[1], 1)
    top_ratio = bbox[1] / float(max(image_height, 1))
    bottom_ratio = bbox[3] / float(max(image_height, 1))
    center_ratio = ((bbox[1] + bbox[3]) / 2.0) / float(max(image_height, 1))
    width_ratio = width / float(max(image_width, 1))
    height_ratio = height / float(max(image_height, 1))

    if top_ratio <= 0.22:
        return "header", unknown_label, "geometry_top_band"
    if bottom_ratio >= 0.72 and width_ratio >= 0.35 and height_ratio <= 0.24:
        return "totals", unknown_label, "geometry_bottom_summary"
    if 0.18 <= center_ratio <= 0.72 and width_ratio >= 0.45 and height_ratio >= 0.08:
        return "items", unknown_label, "geometry_middle_body"
    if bottom_ratio >= 0.84:
        return "footer", unknown_label, "geometry_footer_band"
    return "metadata", unknown_label, "geometry_default_metadata"


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


def _horizontal_overlap_ratio(first: LayoutBlock, second: LayoutBlock) -> float:
    overlap = max(0, min(first.right, second.right) - max(first.left, second.left))
    return overlap / float(max(min(first.width, second.width), 1))


def _should_merge(first: LayoutBlock, second: LayoutBlock, gap_pixels: int) -> bool:
    if first.label != second.label:
        return False
    if first.label not in {"items", "totals", "footer"}:
        return False
    vertical_gap = second.top - first.bottom
    return 0 <= vertical_gap <= gap_pixels and _horizontal_overlap_ratio(first, second) >= 0.4


def _merge_blocks(first: LayoutBlock, second: LayoutBlock, *, merged_index: int) -> LayoutBlock:
    bbox = (
        min(first.left, second.left),
        min(first.top, second.top),
        max(first.right, second.right),
        max(first.bottom, second.bottom),
    )
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
        label=first.label,
        confidence=max(first.confidence, second.confidence),
        bbox=bbox,
        area_ratio=max(first.area_ratio, second.area_ratio),
        unknown_label=first.unknown_label or second.unknown_label,
        metadata=metadata,
    )


def _promote_semantic_anchors(blocks: list[LayoutBlock], *, image_shape: tuple[int, int]) -> list[LayoutBlock]:
    if not blocks:
        return blocks

    image_height, image_width = image_shape

    def top_ratio(block: LayoutBlock) -> float:
        return block.top / float(max(image_height, 1))

    def bottom_ratio(block: LayoutBlock) -> float:
        return block.bottom / float(max(image_height, 1))

    def center_ratio(block: LayoutBlock) -> float:
        return ((block.top + block.bottom) / 2.0) / float(max(image_height, 1))

    def width_ratio(block: LayoutBlock) -> float:
        return block.width / float(max(image_width, 1))

    def set_label(block: LayoutBlock, label: str, source: str) -> None:
        block.label = label
        block.metadata["semantic_source"] = source

    if not any(block.label == "header" for block in blocks):
        header_candidates = [
            block for block in blocks if top_ratio(block) <= 0.30 and block.label not in {"totals", "footer"}
        ]
        if header_candidates:
            set_label(min(header_candidates, key=lambda block: (block.top, block.left)), "header", "anchor_topmost")

    if not any(block.label == "items" for block in blocks):
        item_candidates = [
            block
            for block in blocks
            if 0.18 <= center_ratio(block) <= 0.75 and block.label not in {"header", "totals", "footer"}
        ]
        if item_candidates:
            set_label(max(item_candidates, key=lambda block: (block.area_ratio, width_ratio(block))), "items", "anchor_largest_body")

    if not any(block.label == "totals" for block in blocks):
        totals_candidates = [
            block
            for block in blocks
            if top_ratio(block) >= 0.50 and block.label not in {"header", "payment_info"}
        ]
        if totals_candidates:
            set_label(
                max(totals_candidates, key=lambda block: (bottom_ratio(block), width_ratio(block), block.area_ratio)),
                "totals",
                "anchor_lower_summary",
            )

    if not any(block.label == "footer" for block in blocks):
        footer_candidates = [
            block for block in blocks if bottom_ratio(block) >= 0.86 and block.label not in {"header", "totals"}
        ]
        if footer_candidates:
            set_label(max(footer_candidates, key=lambda block: (block.bottom, block.left)), "footer", "anchor_bottommost")

    return blocks


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
    min_area_ratio = (
        settings.ocr_layout_min_block_area_ratio if min_block_area_ratio is None else min_block_area_ratio
    )
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
        label, unknown, semantic_source = _normalize_raw_label(
            detection.raw_label,
            bbox=detection.bbox,
            image_shape=image_shape,
        )
        area_ratio = _box_area_ratio(detection.bbox, image_shape)
        if area_ratio < min_area_ratio:
            skipped_small_blocks += 1
            continue
        filtered.append(
            LayoutBlock(
                index=raw_index,
                raw_label=detection.raw_label,
                label=label,
                confidence=detection.confidence,
                bbox=detection.bbox,
                area_ratio=area_ratio,
                unknown_label=unknown,
                metadata={"semantic_source": semantic_source},
            )
        )

    suppressed: list[LayoutBlock] = []
    skipped_overlap = 0
    for block in sorted(filtered, key=lambda item: item.confidence, reverse=True):
        if any(existing.label == block.label and _iou(existing.bbox, block.bbox) >= max_iou for existing in suppressed):
            skipped_overlap += 1
            continue
        suppressed.append(block)

    by_label: dict[str, list[LayoutBlock]] = defaultdict(list)
    for block in sorted(suppressed, key=lambda item: (item.top, item.left, item.index)):
        by_label[block.label].append(block)

    merged: list[LayoutBlock] = []
    merged_count = 0
    next_index = 0
    for label in CANONICAL_LAYOUT_LABELS:
        label_blocks = by_label.get(label, [])
        current: LayoutBlock | None = None
        for block in label_blocks:
            if current is None:
                current = block
                continue
            if _should_merge(current, block, merge_gap):
                current = _merge_blocks(current, block, merged_index=next_index)
                merged_count += 1
            else:
                current.index = next_index
                merged.append(current)
                next_index += 1
                current = block
        if current is not None:
            current.index = next_index
            merged.append(current)
            next_index += 1

    ordered = sorted(merged, key=lambda item: (item.top, item.left, item.index))
    ordered = _promote_semantic_anchors(ordered, image_shape=image_shape)
    capped = ordered[:max_allowed_blocks]
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
