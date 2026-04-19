from __future__ import annotations

import argparse
import json
import sys
import tempfile
import time
from pathlib import Path
from statistics import mean
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.core.config import settings
from app.services.extraction_service import extract_all
from app.services.image_preprocess import preprocess_image_with_metadata
from app.services.layout_service import get_layout_service
from app.services.ocr_pipeline import (
    get_paddle_detector,
    get_paddle_recognizer,
    get_vietocr_recognizer,
)
from app.services.ocr_service import get_ocr_service


def _reset_runtime(backend: str, fallback: str = "") -> None:
    settings.ocr_recognizer_backend = backend
    settings.ocr_fallback_recognizer_backend = fallback
    settings.ocr_layout_enabled = False
    settings.ocr_layout_model_path = ""
    get_ocr_service.cache_clear()
    get_layout_service.cache_clear()
    get_paddle_detector.cache_clear()
    get_paddle_recognizer.cache_clear()
    get_vietocr_recognizer.cache_clear()


def _benchmark_image(image_path: Path, *, profile: str) -> dict[str, Any]:
    backends = ["paddle", "vietocr"]
    image_result: dict[str, Any] = {"image": str(image_path), "profile": profile, "results": {}}
    with tempfile.TemporaryDirectory(prefix="vietocr-benchmark-") as temp_dir:
        processed_path = Path(temp_dir) / f"{image_path.stem}-{profile}.png"
        _, preprocess_metadata = preprocess_image_with_metadata(str(image_path), str(processed_path), profile=profile)
        image_result["preprocess"] = preprocess_metadata
        for backend in backends:
            _reset_runtime(backend)
            service = get_ocr_service()
            started = time.perf_counter()
            ocr_payload = service.extract_text(str(processed_path), profile=profile)
            elapsed = time.perf_counter() - started
            extracted = extract_all(lines=list(ocr_payload.get("lines", [])), raw_text=str(ocr_payload.get("raw_text") or ""))
            image_result["results"][backend] = {
                "provider": ocr_payload.get("provider"),
                "device": ocr_payload.get("device"),
                "confidence": ocr_payload.get("confidence"),
                "line_count": ocr_payload.get("line_count"),
                "detected_box_count": ocr_payload.get("detected_box_count"),
                "low_quality_ratio": ocr_payload.get("low_quality_ratio"),
                "runtime": ocr_payload.get("runtime"),
                "engine_config": ocr_payload.get("engine_config"),
                "timings": {
                    "ocr_seconds": round(elapsed, 4),
                    "detection_seconds": (ocr_payload.get("runtime") or {}).get("detection_seconds"),
                    "crop_seconds": (ocr_payload.get("runtime") or {}).get("crop_seconds"),
                    "recognition_seconds": (ocr_payload.get("runtime") or {}).get("recognition_seconds"),
                    "total_ocr_seconds": (ocr_payload.get("runtime") or {}).get("total_ocr_seconds"),
                },
                "sample_text": str(ocr_payload.get("raw_text") or "")[:1200],
                "merchant_name": extracted.get("merchant_name"),
                "total_amount": extracted.get("total_amount"),
                "transaction_date": extracted.get("transaction_date"),
            }
    return image_result


def _build_markdown(results: list[dict[str, Any]]) -> str:
    lines: list[str] = [
        "# Paddle vs VietOCR Benchmark",
        "",
        "| Image | Backend | Device | Detector | Recognizer | OCR Seconds | Confidence | Lines | Boxes | Merchant | Total |",
        "| --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | --- | --- |",
    ]
    for result in results:
        for backend, payload in result["results"].items():
            runtime = payload.get("runtime") or {}
            lines.append(
                "| {image} | {backend} | {device} | {detector} | {recognizer} | {ocr_seconds} | {confidence} | {line_count} | {box_count} | {merchant} | {total} |".format(
                    image=Path(result["image"]).name,
                    backend=backend,
                    device=payload.get("device") or "unknown",
                    detector=runtime.get("text_detection_model_name") or "unknown",
                    recognizer=runtime.get("text_recognition_model_name") or "unknown",
                    ocr_seconds=payload["timings"].get("ocr_seconds"),
                    confidence=round(float(payload.get("confidence") or 0.0), 4),
                    line_count=payload.get("line_count") or 0,
                    box_count=payload.get("detected_box_count") or 0,
                    merchant=(payload.get("merchant_name") or "")[:32],
                    total=payload.get("total_amount") or "",
                )
            )
    lines.extend(["", "## Raw Text Samples", ""])
    for result in results:
        lines.append(f"### {Path(result['image']).name}")
        for backend, payload in result["results"].items():
            lines.extend(
                [
                    "",
                    f"#### {backend}",
                    "",
                    "```text",
                    payload.get("sample_text") or "",
                    "```",
                ]
            )
    averages = {}
    for backend in ("paddle", "vietocr"):
        backend_results = [entry["results"][backend] for entry in results if backend in entry.get("results", {})]
        if not backend_results:
            continue
        averages[backend] = {
            "ocr_seconds": round(mean(float(item["timings"].get("ocr_seconds") or 0.0) for item in backend_results), 4),
            "confidence": round(mean(float(item.get("confidence") or 0.0) for item in backend_results), 4),
            "line_count": round(mean(float(item.get("line_count") or 0.0) for item in backend_results), 2),
        }
    lines.extend(["", "## Aggregate Summary", "", "```json", json.dumps(averages, indent=2, ensure_ascii=False), "```"])
    return "\n".join(lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description="Benchmark Paddle and VietOCR recognizers on the same receipt images.")
    parser.add_argument("images", nargs="+", help="One or more receipt image paths.")
    parser.add_argument("--profile", default="fast", choices=["fast", "recovery"], help="OCR profile to benchmark.")
    parser.add_argument("--output-json", required=True, help="Path to write the JSON benchmark report.")
    parser.add_argument("--output-md", required=True, help="Path to write the markdown benchmark summary.")
    args = parser.parse_args()

    image_paths = [Path(path).resolve() for path in args.images]
    for image_path in image_paths:
        if not image_path.exists():
            raise SystemExit(f"Image not found: {image_path}")

    results = [_benchmark_image(image_path, profile=args.profile) for image_path in image_paths]
    output_json = Path(args.output_json)
    output_md = Path(args.output_md)
    output_json.parent.mkdir(parents=True, exist_ok=True)
    output_md.parent.mkdir(parents=True, exist_ok=True)
    output_json.write_text(json.dumps({"profile": args.profile, "results": results}, indent=2, ensure_ascii=False), encoding="utf-8")
    output_md.write_text(_build_markdown(results), encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
