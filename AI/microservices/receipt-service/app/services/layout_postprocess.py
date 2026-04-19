from __future__ import annotations

import logging
import re
import unicodedata
from collections import defaultdict
from typing import Any

from app.core.config import settings
from app.services.layout_models import CANONICAL_LAYOUT_LABELS, LayoutBlock, RawLayoutDetection

logger = logging.getLogger(__name__)

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
    "page header": "header",
    "item": "items",
    "items": "items",
    "line_items": "items",
    "item_table": "items",
    "products": "items",
    "list": "items",
    "list-item": "items",
    "list_item": "items",
    "plain text": "items",
    "plaintext": "items",
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
    "page footer": "footer",
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
    "table_caption": "metadata",
    "table-caption": "metadata",
    "formula": "metadata",
    "isolate_formula": "metadata",
    "figure": "metadata",
    "picture": "metadata",
    "image": "metadata",
}

_SEMANTIC_PRIORITY = {
    "header": 0,
    "items": 1,
    "totals": 2,
    "footer": 3,
    "payment_info": 4,
    "metadata": 5,
}

_TABLE_ANCHOR_KEYWORDS = (
    "ten hang",
    "so luong",
    "sl",
    "d gia",
    "don gia",
    "thanh tien",
)

_TEXT_LIKE_RAW_LABELS = {
    "header",
    "plain text",
    "plaintext",
    "text",
    "metadata",
}

_TEXT_LIKE_LABELS = {"header", "items", "metadata"}


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


def _normalize_keyword_text(value: str) -> str:
    normalized = unicodedata.normalize("NFD", value or "")
    without_marks = "".join(ch for ch in normalized if not unicodedata.combining(ch))
    without_marks = without_marks.replace("\u0111", "d").replace("\u0110", "D")
    lowered = without_marks.lower()
    return re.sub(r"\s+", " ", re.sub(r"[^0-9a-z\s]", " ", lowered)).strip()


def _is_table_anchor_line(text: str) -> bool:
    normalized = f" {_normalize_keyword_text(text)} "
    return any(f" {keyword} " in normalized for keyword in _TABLE_ANCHOR_KEYWORDS)


def _semantic_priority(label: str) -> int:
    return _SEMANTIC_PRIORITY.get(label, len(_SEMANTIC_PRIORITY))


def _sorted_blocks(blocks: list[LayoutBlock]) -> list[LayoutBlock]:
    return sorted(blocks, key=lambda item: (_semantic_priority(item.label), item.top, item.left, item.index))


def _with_image_area(block: LayoutBlock, *, image_shape: tuple[int, int]) -> LayoutBlock:
    block.area_ratio = _box_area_ratio(block.bbox, image_shape)
    return block


def _initialize_refinement_metadata(block: LayoutBlock) -> None:
    block.metadata.setdefault("original_label", block.label)
    block.metadata["refined_label"] = block.label
    block.metadata.setdefault("is_split", False)
    block.metadata.setdefault("is_synthesized", False)
    block.metadata.setdefault("split_source_block_id", None)


def _set_refined_label(block: LayoutBlock, label: str, *, source: str) -> None:
    block.label = label
    block.metadata["refined_label"] = label
    block.metadata["semantic_source"] = source


def _is_false_footer_artifact(block: LayoutBlock, *, image_shape: tuple[int, int]) -> bool:
    image_height, image_width = image_shape
    width_ratio = block.width / float(max(image_width, 1))
    height_ratio = block.height / float(max(image_height, 1))
    return width_ratio < 0.35 and height_ratio > 0.6 and block.left > int(0.65 * image_width)


def _is_oversized_textlike_block(
    block: LayoutBlock,
    *,
    image_shape: tuple[int, int],
    totals_block: LayoutBlock | None,
) -> bool:
    image_height, image_width = image_shape
    width_ratio = block.width / float(max(image_width, 1))
    height_ratio = block.height / float(max(image_height, 1))
    raw_label_normalized = _normalize_keyword_text(block.raw_label)
    text_like = block.label in _TEXT_LIKE_LABELS or raw_label_normalized in _TEXT_LIKE_RAW_LABELS
    if not text_like:
        return False
    if width_ratio <= 0.5 or height_ratio <= 0.45:
        return False
    if totals_block is None:
        return True
    body_gap = max(24, int(image_height * 0.06))
    return block.top < totals_block.top and block.bottom >= (totals_block.top - body_gap)


def _find_primary_totals(blocks: list[LayoutBlock]) -> LayoutBlock | None:
    totals = [block for block in blocks if block.label == "totals"]
    if not totals:
        return None
    return min(totals, key=lambda block: (block.top, -block.bottom, block.left))


def _split_header_items_block(
    block: LayoutBlock,
    *,
    next_index: int,
    image_shape: tuple[int, int],
    totals_block: LayoutBlock | None,
    ocr_lines: list[dict[str, Any]] | None,
) -> tuple[list[LayoutBlock], bool]:
    image_height, _ = image_shape
    split_bottom = block.bottom
    if totals_block is not None and totals_block.top > block.top:
        split_bottom = min(split_bottom, totals_block.top)
    minimum_piece_height = max(32, int(image_height * 0.03))
    if split_bottom - block.top < minimum_piece_height * 2:
        return [block], False

    anchor_y: int | None = None
    block_lines = list(ocr_lines or block.metadata.get("ocr_lines") or [])
    for line in block_lines:
        text = str(line.get("text") or "")
        if not _is_table_anchor_line(text):
            continue
        y_value = line.get("y") or line.get("top")
        if y_value is None:
            continue
        candidate_y = int(y_value)
        if block.top + minimum_piece_height <= candidate_y <= split_bottom - minimum_piece_height:
            anchor_y = candidate_y
            break

    if anchor_y is None:
        anchor_y = block.top + int((split_bottom - block.top) * 0.25)
    anchor_y = max(block.top + minimum_piece_height, min(anchor_y, split_bottom - minimum_piece_height))

    base_metadata = dict(block.metadata)
    base_metadata["split_source_block_id"] = block.index
    base_metadata["is_split"] = True
    base_metadata["is_synthesized"] = False

    header_metadata = dict(base_metadata)
    header_metadata["semantic_source"] = "receipt_refine_split_header"
    header_metadata["refined_label"] = "header"

    items_metadata = dict(base_metadata)
    items_metadata["semantic_source"] = "receipt_refine_split_items"
    items_metadata["refined_label"] = "items"

    header_block = LayoutBlock(
        index=next_index,
        raw_label=block.raw_label,
        label="header",
        confidence=block.confidence,
        bbox=(block.left, block.top, block.right, anchor_y),
        area_ratio=_box_area_ratio((block.left, block.top, block.right, anchor_y), image_shape),
        unknown_label=block.unknown_label,
        metadata=header_metadata,
    )
    items_block = LayoutBlock(
        index=next_index + 1,
        raw_label=block.raw_label,
        label="items",
        confidence=block.confidence,
        bbox=(block.left, anchor_y, block.right, split_bottom),
        area_ratio=_box_area_ratio((block.left, anchor_y, block.right, split_bottom), image_shape),
        unknown_label=block.unknown_label,
        metadata=items_metadata,
    )
    return [header_block, items_block], True


def _synthesize_items_block(
    source_block: LayoutBlock,
    *,
    next_index: int,
    image_shape: tuple[int, int],
    top: int,
    bottom: int,
) -> LayoutBlock | None:
    if bottom <= top:
        return None
    bbox = (source_block.left, top, source_block.right, bottom)
    return LayoutBlock(
        index=next_index,
        raw_label=source_block.raw_label,
        label="items",
        confidence=source_block.confidence,
        bbox=bbox,
        area_ratio=_box_area_ratio(bbox, image_shape),
        unknown_label=source_block.unknown_label,
        metadata={
            **source_block.metadata,
            "semantic_source": "receipt_refine_synthesized_items",
            "original_label": source_block.metadata.get("original_label", source_block.label),
            "refined_label": "items",
            "is_split": False,
            "is_synthesized": True,
            "split_source_block_id": source_block.index,
        },
    )


def refine_receipt_layout(
    blocks: list[LayoutBlock],
    *,
    image_shape: tuple[int, int],
    ocr_lines: list[dict[str, Any]] | None = None,
) -> tuple[list[LayoutBlock], dict[str, Any]]:
    if not blocks:
        return blocks, {
            "before_count": 0,
            "after_count": 0,
            "split_count": 0,
            "synthesized_items": False,
            "demoted_to_metadata": 0,
            "usable_block_count": 0,
        }

    for block in blocks:
        _initialize_refinement_metadata(block)

    before_count = len(blocks)
    demoted_to_metadata = 0
    for block in blocks:
        if block.label == "totals":
            continue
        if _is_false_footer_artifact(block, image_shape=image_shape):
            if block.label != "metadata":
                demoted_to_metadata += 1
            _set_refined_label(block, "metadata", source="receipt_refine_demoted_right_strip")

    totals_block = _find_primary_totals(blocks)
    refined: list[LayoutBlock] = []
    next_index = 0
    split_count = 0

    for block in sorted(blocks, key=lambda item: (item.top, item.left, item.index)):
        if block.label == "totals":
            block.index = next_index
            block.metadata["refined_label"] = block.label
            refined.append(_with_image_area(block, image_shape=image_shape))
            next_index += 1
            continue
        if _is_oversized_textlike_block(block, image_shape=image_shape, totals_block=totals_block):
            split_blocks, did_split = _split_header_items_block(
                block,
                next_index=next_index,
                image_shape=image_shape,
                totals_block=totals_block,
                ocr_lines=ocr_lines,
            )
            if did_split:
                logger.debug(
                    "Receipt layout refinement split source_block=%s original_label=%s into=%s",
                    block.index,
                    block.metadata.get("original_label", block.label),
                    [child.label for child in split_blocks],
                )
                split_count += 1
                for child in split_blocks:
                    refined.append(_with_image_area(child, image_shape=image_shape))
                next_index += len(split_blocks)
                continue
        block.index = next_index
        block.metadata["refined_label"] = block.label
        refined.append(_with_image_area(block, image_shape=image_shape))
        next_index += 1

    totals_block = _find_primary_totals(refined)
    synthesized_items = False
    if totals_block is not None and not any(block.label == "items" for block in refined):
        header_candidates = [
            block
            for block in refined
            if block.label == "header"
            and block.top < totals_block.top
            and block.width / float(max(image_shape[1], 1)) > 0.5
        ]
        metadata_candidates = [
            block
            for block in refined
            if block.label == "metadata"
            and block.top < totals_block.top
            and block.width / float(max(image_shape[1], 1)) > 0.5
        ]
        candidates = header_candidates or metadata_candidates
        if candidates:
            source_block = max(candidates, key=lambda item: (item.area_ratio, item.bottom, item.left))
            top = source_block.bottom
            bottom = totals_block.top
            synthesized = _synthesize_items_block(
                source_block,
                next_index=next_index,
                image_shape=image_shape,
                top=top,
                bottom=bottom,
            )
            if synthesized is not None and synthesized.height > max(32, int(image_shape[0] * 0.04)):
                refined.append(synthesized)
                next_index += 1
                synthesized_items = True
                logger.debug(
                    "Receipt layout refinement synthesized items source_block=%s bbox=%s",
                    source_block.index,
                    synthesized.bbox,
                )

    ordered = _sorted_blocks(refined)
    for index, block in enumerate(ordered):
        block.index = index
        block.metadata["refined_label"] = block.label
        _with_image_area(block, image_shape=image_shape)

    usable = [block for block in ordered if block.label != "metadata"]
    if len(usable) < 2:
        ordered = usable

    summary = {
        "before_count": before_count,
        "after_count": len(ordered),
        "split_count": split_count,
        "synthesized_items": synthesized_items,
        "demoted_to_metadata": demoted_to_metadata,
        "usable_block_count": len([block for block in ordered if block.label != "metadata"]),
    }
    logger.debug(
        "Receipt layout refinement before=%s after=%s split=%s synthesized_items=%s demoted_to_metadata=%s usable=%s",
        summary["before_count"],
        summary["after_count"],
        summary["split_count"],
        summary["synthesized_items"],
        summary["demoted_to_metadata"],
        summary["usable_block_count"],
    )
    return ordered, summary


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
    ocr_lines: list[dict[str, Any]] | None = None,
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
    refined, refinement = refine_receipt_layout(ordered, image_shape=image_shape, ocr_lines=ocr_lines)
    capped = refined[:max_allowed_blocks]
    capped_count = max(0, len(refined) - len(capped))

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
        "refinement": refinement,
    }
    return capped, metadata
