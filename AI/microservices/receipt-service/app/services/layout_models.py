from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


CANONICAL_LAYOUT_LABELS = (
    "header",
    "items",
    "totals",
    "footer",
    "payment_info",
    "metadata",
)


@dataclass(slots=True)
class RawLayoutDetection:
    raw_label: str
    confidence: float
    bbox: tuple[int, int, int, int]


@dataclass(slots=True)
class LayoutBlock:
    index: int
    raw_label: str
    label: str
    confidence: float
    bbox: tuple[int, int, int, int]
    area_ratio: float
    unknown_label: bool = False
    metadata: dict[str, Any] = field(default_factory=dict)

    @property
    def left(self) -> int:
        return self.bbox[0]

    @property
    def top(self) -> int:
        return self.bbox[1]

    @property
    def right(self) -> int:
        return self.bbox[2]

    @property
    def bottom(self) -> int:
        return self.bbox[3]

    @property
    def width(self) -> int:
        return max(self.right - self.left, 1)

    @property
    def height(self) -> int:
        return max(self.bottom - self.top, 1)

    def to_debug_dict(self) -> dict[str, Any]:
        return {
            "index": self.index,
            "label": self.label,
            "raw_label": self.raw_label,
            "confidence": round(float(self.confidence), 4),
            "bbox": list(self.bbox),
            "area_ratio": round(float(self.area_ratio), 6),
            "unknown_label": self.unknown_label,
            **self.metadata,
        }


@dataclass(slots=True)
class LayoutDetectionResult:
    enabled: bool
    used: bool
    backend: str
    blocks: list[LayoutBlock]
    runtime: dict[str, Any]
    raw_detections_count: int = 0
    postprocessed_block_count: int = 0
    debug_image_path: str | None = None
    fallback_reason: str | None = None

    def to_debug_dict(self) -> dict[str, Any]:
        return {
            "enabled": self.enabled,
            "used": self.used,
            "backend": self.backend,
            "raw_detections_count": self.raw_detections_count,
            "postprocessed_block_count": self.postprocessed_block_count,
            "debug_image_path": self.debug_image_path,
            "fallback_reason": self.fallback_reason,
            "runtime": self.runtime,
            "blocks": [block.to_debug_dict() for block in self.blocks],
        }
