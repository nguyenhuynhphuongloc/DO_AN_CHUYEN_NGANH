from __future__ import annotations

import json
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.core.config import settings
from app.services.layout_service import get_layout_service
from app.services.ocr_pipeline import get_paddle_detector, get_paddle_recognizer, get_vietocr_recognizer
from app.services.ocr_service import get_ocr_service


def _reset_runtime(*, backend: str, layout_enabled: bool, layout_model_path: str = "") -> None:
    settings.ocr_recognizer_backend = backend
    settings.ocr_fallback_recognizer_backend = ""
    settings.ocr_layout_enabled = layout_enabled
    settings.ocr_layout_model_path = layout_model_path
    get_ocr_service.cache_clear()
    get_layout_service.cache_clear()
    get_paddle_detector.cache_clear()
    get_paddle_recognizer.cache_clear()
    get_vietocr_recognizer.cache_clear()


def _validate(image_path: Path, *, backend: str, layout_enabled: bool, layout_model_path: str = "", case: str) -> dict:
    _reset_runtime(backend=backend, layout_enabled=layout_enabled, layout_model_path=layout_model_path)
    issues: list[str] = []
    with tempfile.TemporaryDirectory(prefix="layout-validate-") as temp_dir:
        from app.services.image_preprocess import preprocess_image_with_metadata

        processed_path = Path(temp_dir) / f"{image_path.stem}-fast.png"
        preprocess_image_with_metadata(str(image_path), str(processed_path), profile="fast")
        payload = get_ocr_service().extract_text(str(processed_path), profile="fast", debug_tag=f"{image_path.stem}-{case}")
    if "layout" not in payload:
        issues.append("missing_layout_key")
    layout = payload.get("layout")
    if layout_enabled and not isinstance(layout, dict):
        issues.append("layout_not_dict")
    if case == "layout_disabled":
        if not isinstance(layout, dict) or layout.get("used") is not False or layout.get("fallback_reason") != "layout_disabled":
            issues.append("unexpected_disabled_layout_state")
    if case == "layout_missing_model":
        if not isinstance(layout, dict) or layout.get("used") is not False or layout.get("fallback_reason") != "missing_model":
            issues.append("unexpected_missing_model_state")
    if case == "layout_enabled_valid" and layout_model_path:
        if not isinstance(layout, dict) or layout.get("used") is not True:
            issues.append("layout_not_used_with_valid_model")
        if not isinstance(layout, dict) or int(layout.get("raw_detections_count") or 0) <= 0:
            issues.append("layout_missing_raw_detections")
        if not isinstance(layout, dict) or int(layout.get("postprocessed_block_count") or 0) <= 0:
            issues.append("layout_missing_postprocessed_blocks")
        if not isinstance(layout, dict) or not list(layout.get("blocks") or []):
            issues.append("layout_blocks_empty")
        if not isinstance(layout, dict) or not str(layout.get("debug_image_path") or "").strip():
            issues.append("layout_debug_image_missing")
        runtime_info = dict((layout or {}).get("runtime") or {})
        if not runtime_info.get("model_path"):
            issues.append("layout_runtime_model_path_missing")
        if runtime_info.get("model_loaded") is not True:
            issues.append("layout_runtime_model_not_loaded")
    runtime = dict(payload.get("runtime") or {})
    if runtime.get("recognizer_backend") != backend:
        issues.append(f"backend_mismatch:{runtime.get('recognizer_backend')}")
    return {
        "case": case,
        "backend": backend,
        "layout_enabled": layout_enabled,
        "layout_model_path": layout_model_path or None,
        "issues": issues,
        "provider": payload.get("provider"),
        "device": payload.get("device"),
        "layout": layout,
        "runtime": runtime,
    }


def main() -> int:
    if len(sys.argv) not in {4, 5}:
        raise SystemExit("Usage: validate_layout_modes.py <image> <output-json> <output-md> [layout-model-path]")
    image_path = Path(sys.argv[1]).resolve()
    output_json = Path(sys.argv[2]).resolve()
    output_md = Path(sys.argv[3]).resolve()
    layout_model_path = sys.argv[4] if len(sys.argv) == 5 else ""
    if not image_path.exists():
        raise SystemExit(f"Image not found: {image_path}")

    results = [
        _validate(image_path, backend="vietocr", layout_enabled=False, case="layout_disabled"),
        _validate(image_path, backend="vietocr", layout_enabled=True, case="layout_missing_model"),
        _validate(image_path, backend="paddle", layout_enabled=False, case="layout_disabled"),
        _validate(image_path, backend="paddle", layout_enabled=True, case="layout_missing_model"),
    ]
    if layout_model_path:
        results.extend(
            [
                _validate(
                    image_path,
                    backend="vietocr",
                    layout_enabled=True,
                    layout_model_path=layout_model_path,
                    case="layout_enabled_valid",
                ),
                _validate(
                    image_path,
                    backend="paddle",
                    layout_enabled=True,
                    layout_model_path=layout_model_path,
                    case="layout_enabled_valid",
                ),
            ]
        )
    output_json.parent.mkdir(parents=True, exist_ok=True)
    output_md.parent.mkdir(parents=True, exist_ok=True)
    output_json.write_text(json.dumps(results, indent=2, ensure_ascii=False), encoding="utf-8")
    lines = [
        "# Layout OCR Validation",
        "",
        "| Case | Backend | Layout Used | Fallback | Raw Detections | Blocks | Model Loaded | Device | Issues |",
        "| --- | --- | --- | --- | ---: | ---: | --- | --- | --- |",
    ]
    for result in results:
        layout = result.get("layout") or {}
        runtime_info = dict((layout or {}).get("runtime") or {})
        lines.append(
            "| {case} | {backend} | {used} | {fallback} | {raw} | {blocks} | {loaded} | {device} | {issues} |".format(
                case=result["case"],
                backend=result["backend"],
                used=(layout or {}).get("used"),
                fallback=(layout or {}).get("fallback_reason") or "",
                raw=(layout or {}).get("raw_detections_count") or 0,
                blocks=(layout or {}).get("postprocessed_block_count") or 0,
                loaded=runtime_info.get("model_loaded"),
                device=runtime_info.get("device") or result.get("device") or "",
                issues=", ".join(result["issues"]) if result["issues"] else "none",
            )
        )
    lines.extend(["", "```json", json.dumps(results, indent=2, ensure_ascii=False), "```", ""])
    output_md.write_text("\n".join(lines), encoding="utf-8")
    return 1 if any(result["issues"] for result in results) else 0


if __name__ == "__main__":
    raise SystemExit(main())
