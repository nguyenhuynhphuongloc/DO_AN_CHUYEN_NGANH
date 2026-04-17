from __future__ import annotations

import json
import sys
import tempfile
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.core.config import settings
from app.services.extraction_service import extract_all
from app.services.image_preprocess import preprocess_image_with_metadata
from app.services.ocr_pipeline import (
    get_paddle_detector,
    get_paddle_recognizer,
    get_vietocr_recognizer,
)
from app.services.ocr_service import get_ocr_service

REQUIRED_TOP_LEVEL_KEYS = {
    "raw_text",
    "lines",
    "confidence",
    "confidences",
    "device",
    "provider",
    "ocr_language",
    "fallback_used",
    "low_quality_ratio",
    "postprocess",
    "raw_lines_before_postprocess",
    "profile",
    "line_count",
    "detected_box_count",
    "short_line_ratio",
    "engine_config",
    "runtime",
}


def _reset_runtime(backend: str) -> None:
    settings.ocr_recognizer_backend = backend
    settings.ocr_fallback_recognizer_backend = ""
    get_ocr_service.cache_clear()
    get_paddle_detector.cache_clear()
    get_paddle_recognizer.cache_clear()
    get_vietocr_recognizer.cache_clear()


def _validate_backend(image_path: Path, backend: str) -> dict[str, Any]:
    _reset_runtime(backend)
    with tempfile.TemporaryDirectory(prefix=f"{backend}-contract-") as temp_dir:
        processed_path = Path(temp_dir) / f"{image_path.stem}-fast.png"
        _, preprocess_metadata = preprocess_image_with_metadata(str(image_path), str(processed_path), profile="fast")
        payload = get_ocr_service().extract_text(str(processed_path), profile="fast")
        extraction = extract_all(lines=list(payload.get("lines", [])), raw_text=str(payload.get("raw_text") or ""))
    missing_keys = sorted(REQUIRED_TOP_LEVEL_KEYS - set(payload.keys()))
    runtime = dict(payload.get("runtime") or {})
    engine_config = dict(payload.get("engine_config") or {})
    issues: list[str] = []
    if missing_keys:
        issues.append(f"missing_top_level_keys:{','.join(missing_keys)}")
    if runtime.get("recognizer_backend") != backend:
        issues.append(f"runtime_backend_mismatch:{runtime.get('recognizer_backend')}")
    if engine_config.get("recognizer_backend") != backend:
        issues.append(f"engine_config_backend_mismatch:{engine_config.get('recognizer_backend')}")
    if not isinstance(payload.get("lines"), list):
        issues.append("lines_not_list")
    if not isinstance(runtime, dict):
        issues.append("runtime_not_dict")
    if not isinstance(engine_config, dict):
        issues.append("engine_config_not_dict")
    return {
        "backend": backend,
        "issues": issues,
        "provider": payload.get("provider"),
        "device": payload.get("device"),
        "line_count": payload.get("line_count"),
        "detected_box_count": payload.get("detected_box_count"),
        "runtime": runtime,
        "engine_config": engine_config,
        "extraction": {
            "merchant_name": extraction.get("merchant_name"),
            "total_amount": extraction.get("total_amount"),
            "transaction_date": extraction.get("transaction_date"),
        },
        "preprocess": preprocess_metadata,
    }


def _markdown(results: list[dict[str, Any]]) -> str:
    lines = [
        "# OCR Contract Validation",
        "",
        "| Backend | Device | Provider | Lines | Boxes | Issues | Merchant | Total | Date |",
        "| --- | --- | --- | ---: | ---: | --- | --- | --- | --- |",
    ]
    for result in results:
        extraction = result["extraction"]
        issues = ", ".join(result["issues"]) if result["issues"] else "none"
        lines.append(
            f"| {result['backend']} | {result['device']} | {result['provider']} | {result['line_count']} | {result['detected_box_count']} | {issues} | {extraction.get('merchant_name') or ''} | {extraction.get('total_amount') or ''} | {extraction.get('transaction_date') or ''} |"
        )
    lines.extend(["", "```json", json.dumps(results, indent=2, ensure_ascii=False), "```", ""])
    return "\n".join(lines)


def main() -> int:
    if len(sys.argv) != 4:
        raise SystemExit("Usage: validate_recognizer_contract.py <image> <output-json> <output-md>")
    image_path = Path(sys.argv[1]).resolve()
    output_json = Path(sys.argv[2]).resolve()
    output_md = Path(sys.argv[3]).resolve()
    if not image_path.exists():
        raise SystemExit(f"Image not found: {image_path}")

    results = [_validate_backend(image_path, backend) for backend in ("paddle", "vietocr")]
    output_json.parent.mkdir(parents=True, exist_ok=True)
    output_md.parent.mkdir(parents=True, exist_ok=True)
    output_json.write_text(json.dumps(results, indent=2, ensure_ascii=False), encoding="utf-8")
    output_md.write_text(_markdown(results), encoding="utf-8")
    if any(result["issues"] for result in results):
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

