from __future__ import annotations

import argparse
import json
import sys
import tempfile
import time
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.core.config import settings
from app.services.extraction_service import extract_all
from app.services.image_preprocess import preprocess_image_with_metadata
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


def _quality_score(extracted: dict[str, Any]) -> float:
    score = 0.0
    if extracted.get("merchant_name"):
        score += 1.0
    if extracted.get("transaction_date"):
        score += 1.0
    if extracted.get("total_amount") is not None:
        score += 1.0
    score += float(extracted.get("confidence_score") or 0.0)
    return round(score, 4)


def _run_case(image_path: Path, *, profile: str, backend: str, layout_enabled: bool, layout_model_path: str = "") -> dict[str, Any]:
    _reset_runtime(backend=backend, layout_enabled=layout_enabled, layout_model_path=layout_model_path)
    with tempfile.TemporaryDirectory(prefix="layout-ocr-benchmark-") as temp_dir:
        processed_path = Path(temp_dir) / f"{image_path.stem}-{profile}.png"
        _, preprocess = preprocess_image_with_metadata(str(image_path), str(processed_path), profile=profile)
        started = time.perf_counter()
        payload = get_ocr_service().extract_text(str(processed_path), profile=profile)
        elapsed = time.perf_counter() - started
        extracted = extract_all(
            lines=list(payload.get("lines", [])),
            raw_text=str(payload.get("raw_text") or ""),
            layout_blocks=((payload.get("layout") or {}).get("blocks") if isinstance(payload.get("layout"), dict) else None),
        )
    return {
        "layout_enabled": layout_enabled,
        "backend": backend,
        "device": payload.get("device"),
        "provider": payload.get("provider"),
        "timings": {
            "ocr_seconds": round(elapsed, 4),
            "total_ocr_seconds": ((payload.get("runtime") or {}).get("total_ocr_seconds")),
        },
        "layout": payload.get("layout"),
        "runtime": payload.get("runtime"),
        "extraction": {
            "merchant_name": extracted.get("merchant_name"),
            "transaction_date": extracted.get("transaction_date"),
            "total_amount": extracted.get("total_amount"),
            "confidence_score": extracted.get("confidence_score"),
            "quality_score": _quality_score(extracted),
        },
        "preprocess": preprocess,
    }


def _comparison_label(baseline: dict[str, Any], layout: dict[str, Any]) -> str:
    if layout["extraction"]["quality_score"] > baseline["extraction"]["quality_score"]:
        return "improved"
    if layout["extraction"]["quality_score"] < baseline["extraction"]["quality_score"]:
        return "regressed"
    return "matched"


def _field_comparisons(baseline: dict[str, Any], layout: dict[str, Any]) -> dict[str, str]:
    comparisons: dict[str, str] = {}
    for field in ("merchant_name", "transaction_date", "total_amount"):
        baseline_value = baseline["extraction"].get(field)
        layout_value = layout["extraction"].get(field)
        if baseline_value == layout_value:
            comparisons[field] = "matched"
        elif layout_value and not baseline_value:
            comparisons[field] = "improved"
        elif baseline_value and not layout_value:
            comparisons[field] = "regressed"
        else:
            comparisons[field] = "changed"
    return comparisons


def _build_markdown(results: list[dict[str, Any]]) -> str:
    lines = [
        "# Layout OCR Benchmark",
        "",
        "| Image | Backend | Layout | Device | OCR Seconds | Merchant | Date | Total | Quality | Result |",
        "| --- | --- | --- | --- | ---: | --- | --- | --- | ---: | --- |",
    ]
    for result in results:
        baseline = result["cases"]["no_layout"]
        layout = result["cases"]["layout"]
        for label, payload in (("no-layout", baseline), ("layout-aware", layout)):
            lines.append(
                "| {image} | {backend} | {layout_label} | {device} | {ocr_seconds} | {merchant} | {date} | {total} | {quality} | {result_label} |".format(
                    image=result["image"],
                    backend=result["backend"],
                    layout_label=label,
                    device=payload.get("device") or "unknown",
                    ocr_seconds=payload["timings"].get("ocr_seconds"),
                    merchant=(payload["extraction"].get("merchant_name") or "")[:32],
                    date=payload["extraction"].get("transaction_date") or "",
                    total=payload["extraction"].get("total_amount") or "",
                    quality=payload["extraction"].get("quality_score"),
                    result_label=result["comparison"],
                )
            )
    lines.extend(["", "## Detailed JSON", "", "```json", json.dumps(results, indent=2, ensure_ascii=False), "```", ""])
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description="Compare no-layout OCR and layout-aware OCR on the same receipt images.")
    parser.add_argument("images", nargs="+", help="Receipt image paths.")
    parser.add_argument("--profile", default="fast", choices=["fast", "recovery"])
    parser.add_argument("--backend", default="vietocr", choices=["vietocr", "paddle"])
    parser.add_argument("--layout-model-path", default="", help="Optional Ultralytics YOLO layout model path.")
    parser.add_argument("--output-json", required=True)
    parser.add_argument("--output-md", required=True)
    args = parser.parse_args()

    image_paths = [Path(path).resolve() for path in args.images]
    for image_path in image_paths:
        if not image_path.exists():
            raise SystemExit(f"Image not found: {image_path}")

    results: list[dict[str, Any]] = []
    for image_path in image_paths:
        baseline = _run_case(image_path, profile=args.profile, backend=args.backend, layout_enabled=False)
        layout = _run_case(
            image_path,
            profile=args.profile,
            backend=args.backend,
            layout_enabled=True,
            layout_model_path=args.layout_model_path,
        )
        results.append(
            {
                "image": image_path.name,
                "backend": args.backend,
                "profile": args.profile,
                "comparison": _comparison_label(baseline, layout),
                "field_comparisons": _field_comparisons(baseline, layout),
                "cases": {
                    "no_layout": baseline,
                    "layout": layout,
                },
            }
        )

    output_json = Path(args.output_json)
    output_md = Path(args.output_md)
    output_json.parent.mkdir(parents=True, exist_ok=True)
    output_md.parent.mkdir(parents=True, exist_ok=True)
    output_json.write_text(json.dumps(results, indent=2, ensure_ascii=False), encoding="utf-8")
    output_md.write_text(_build_markdown(results), encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
