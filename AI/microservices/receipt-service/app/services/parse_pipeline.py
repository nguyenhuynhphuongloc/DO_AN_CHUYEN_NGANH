from __future__ import annotations

import logging
import time
from datetime import date, datetime
from decimal import Decimal
from pathlib import Path
from uuid import UUID

from sqlalchemy.orm import Session, joinedload

from app.core.config import settings
from app.models.receipt import (
    Receipt,
    ReceiptExtraction,
    ReceiptJob,
    ReceiptOcrResult,
    ReceiptParseJob,
    ReceiptParseSession,
)
from app.services.extraction_service import extract_all
from app.services.image_preprocess import preprocess_image_with_metadata
from app.services.ocr_service import get_ocr_service

logger = logging.getLogger(__name__)


def _load_parse_job(db: Session, job_id: UUID) -> ReceiptJob:
    job = (
        db.query(ReceiptJob)
        .options(
            joinedload(ReceiptJob.receipt).joinedload(Receipt.ocr_result),
            joinedload(ReceiptJob.receipt).joinedload(Receipt.extraction),
        )
        .filter(ReceiptJob.id == job_id)
        .first()
    )
    if job is None or job.receipt is None:
        raise ValueError(f"Receipt parse job {job_id} was not found")
    return job


def _load_session_parse_job(db: Session, job_id: UUID) -> ReceiptParseJob:
    job = (
        db.query(ReceiptParseJob)
        .options(joinedload(ReceiptParseJob.session))
        .filter(ReceiptParseJob.id == job_id)
        .first()
    )
    if job is None or job.session is None:
        raise ValueError(f"Receipt parse session job {job_id} was not found")
    return job


def _job_now(job: ReceiptJob | ReceiptParseJob) -> datetime:
    return datetime.now(job.created_at.tzinfo) if job.created_at.tzinfo else datetime.utcnow()


def _set_receipt_phase(job: ReceiptJob, phase: str, *, error_message: str | None = None, finished: bool = False) -> None:
    now = _job_now(job)
    job.status = phase
    job.error_message = error_message
    job.receipt.updated_at = now
    if phase == "failed":
        job.receipt.status = "failed"
    elif phase == "ready_for_review":
        job.receipt.status = "ready_for_review"
        job.receipt.processed_at = now
    else:
        job.receipt.status = "processing"
    if finished:
        job.finished_at = now


def _set_session_phase(
    job: ReceiptParseJob,
    phase: str,
    *,
    error_message: str | None = None,
    finished: bool = False,
) -> None:
    now = _job_now(job)
    job.status = phase
    job.error_message = error_message
    job.session.updated_at = now
    if phase == "failed":
        job.session.status = "failed"
    elif phase == "ready_for_review":
        job.session.status = "ready_for_review"
        job.session.processed_at = now
    else:
        job.session.status = "processing"
    if finished:
        job.finished_at = now


def _to_date(value: object) -> date | None:
    if value in (None, ""):
        return None
    return datetime.fromisoformat(str(value)).date()


def _build_ocr_debug_json(
    processed_path: Path,
    ocr_payload: dict,
    preprocess_metadata: dict,
    *,
    selected_path: str,
    timings: dict,
    recovery_reasons: list[str],
) -> dict:
    lines = list(ocr_payload.get("lines", []))
    confidences = [float(value) for value in list(ocr_payload.get("confidences", []))]
    return {
        "lines": lines,
        "confidences": confidences,
        "processed_image_path": str(processed_path),
        "device": ocr_payload.get("device"),
        "ocr_language": ocr_payload.get("ocr_language"),
        "fallback_used": ocr_payload.get("fallback_used"),
        "low_quality_ratio": ocr_payload.get("low_quality_ratio"),
        "line_count": ocr_payload.get("line_count"),
        "detected_box_count": ocr_payload.get("detected_box_count"),
        "short_line_ratio": ocr_payload.get("short_line_ratio"),
        "raw_lines_before_postprocess": ocr_payload.get("raw_lines_before_postprocess"),
        "postprocess": ocr_payload.get("postprocess"),
        "runtime": ocr_payload.get("runtime"),
        "engine_config": ocr_payload.get("engine_config"),
        "preprocess": preprocess_metadata,
        "profile": ocr_payload.get("profile"),
        "selected_path": selected_path,
        "timings": timings,
        "recovery_reasons": recovery_reasons,
    }


def _run_attempt(
    source_path: Path,
    processed_dir: Path,
    *,
    file_stem: str,
    profile: str,
) -> tuple[Path, dict, dict, dict]:
    processed_path = processed_dir / f"{file_stem}-{profile}.png"

    preprocess_start = time.perf_counter()
    _, preprocess_metadata = preprocess_image_with_metadata(str(source_path), str(processed_path), profile=profile)
    preprocess_seconds = time.perf_counter() - preprocess_start

    ocr_start = time.perf_counter()
    ocr_payload = get_ocr_service().extract_text(str(processed_path), profile=profile)
    ocr_seconds = time.perf_counter() - ocr_start

    extraction_start = time.perf_counter()
    extracted_fields = extract_all(
        lines=list(ocr_payload.get("lines", [])),
        raw_text=str(ocr_payload.get("raw_text", "")),
    )
    extraction_seconds = time.perf_counter() - extraction_start

    timings = {
        "preprocess_seconds": round(preprocess_seconds, 4),
        "ocr_seconds": round(ocr_seconds, 4),
        "extraction_seconds": round(extraction_seconds, 4),
    }
    logger.info(
        "OCR attempt profile=%s device=%s det=%s rec=%s boxes=%s lines=%s image_size=%s timings=%s",
        profile,
        ocr_payload.get("device"),
        (ocr_payload.get("runtime") or {}).get("text_detection_model_name"),
        (ocr_payload.get("runtime") or {}).get("text_recognition_model_name"),
        ocr_payload.get("detected_box_count"),
        ocr_payload.get("line_count"),
        preprocess_metadata.get("output_size"),
        timings,
    )
    return processed_path, ocr_payload, extracted_fields, {**preprocess_metadata, "timings": timings}


def _line_fragment_metrics(lines: list[str]) -> tuple[float, float]:
    if not lines:
        return 1.0, 1.0
    fragmented = 0
    short = 0
    for line in lines:
        normalized = line.strip()
        alpha_count = sum(1 for char in normalized if char.isalpha())
        if len(normalized) <= 4 or alpha_count <= 2:
            short += 1
        if len(normalized) <= 3 or alpha_count <= 1:
            fragmented += 1
    return fragmented / len(lines), short / len(lines)


def _needs_recovery(
    ocr_payload: dict,
    extracted_fields: dict,
    preprocess_metadata: dict,
) -> tuple[bool, list[str]]:
    reasons: list[str] = []
    confidence = float(ocr_payload.get("confidence") or 0.0)
    low_quality_ratio = float(ocr_payload.get("low_quality_ratio") or 0.0)
    raw_text = str(ocr_payload.get("raw_text") or "")
    merchant_name = extracted_fields.get("merchant_name")
    transaction_date = extracted_fields.get("transaction_date")
    total_amount = extracted_fields.get("total_amount")
    line_count = int(ocr_payload.get("line_count") or 0)
    lines = list(ocr_payload.get("lines", []))
    fragmented_ratio, short_line_ratio = _line_fragment_metrics(lines)
    postprocess = dict(ocr_payload.get("postprocess") or {})
    extracted_json = dict(extracted_fields.get("extracted_json") or {})
    field_confidence = dict(extracted_json.get("field_confidence") or {})
    merchant_confidence = field_confidence.get("merchant_name")
    header_lines = list((extracted_json.get("zones") or {}).get("header") or [])
    header_fragmented_ratio, header_short_ratio = _line_fragment_metrics(header_lines)
    corruption_signal_score = low_quality_ratio + float(postprocess.get("postprocess_low_quality_ratio") or 0.0)

    if confidence < settings.ocr_fast_confidence_threshold:
        reasons.append("low_confidence")
    if low_quality_ratio >= settings.ocr_fast_low_quality_threshold:
        reasons.append("corrupted_text_ratio")
    if corruption_signal_score >= settings.ocr_fast_max_corruption_signal_score:
        reasons.append("strong_vietnamese_corruption")
    short_text = len(raw_text.strip()) < settings.ocr_fast_min_text_length
    if short_text:
        reasons.append("short_ocr_output")
    if line_count < settings.ocr_fast_min_detected_lines and (total_amount in (None, "") or short_text or confidence < settings.ocr_fast_confidence_threshold):
        reasons.append("too_few_detected_lines")
    if fragmented_ratio >= settings.ocr_fast_max_fragmented_line_ratio:
        reasons.append("fragmented_line_output")
    if header_lines and header_short_ratio >= settings.ocr_fast_max_short_header_ratio:
        reasons.append("fragmented_header_lines")
    if header_lines and header_fragmented_ratio >= settings.ocr_fast_max_fragmented_line_ratio:
        reasons.append("weak_header_quality")
    if short_line_ratio >= settings.ocr_fast_max_short_header_ratio and line_count >= settings.ocr_fast_min_detected_lines:
        reasons.append("excessive_short_lines")
    if total_amount in (None, ""):
        reasons.append("missing_total_amount")
    merchant_is_weak = merchant_confidence is None or float(merchant_confidence) < settings.ocr_fast_merchant_confidence_threshold
    if merchant_is_weak and (
        total_amount in (None, "")
        or low_quality_ratio >= settings.ocr_fast_low_quality_threshold
        or fragmented_ratio >= settings.ocr_fast_max_fragmented_line_ratio
        or short_text
    ):
        reasons.append("weak_merchant_candidate")
    if not merchant_name and not transaction_date:
        reasons.append("missing_critical_context")
    if preprocess_metadata.get("rotated_90") and (
        total_amount in (None, "")
        or confidence < settings.ocr_fast_confidence_threshold
        or fragmented_ratio >= settings.ocr_fast_max_fragmented_line_ratio
    ):
        reasons.append("orientation_corrected")
    if abs(float(preprocess_metadata.get("deskew_angle") or 0.0)) >= 1.5 and total_amount in (None, ""):
        reasons.append("deskew_needed")
    return bool(reasons), sorted(set(reasons))


def _persist_receipt_results(
    job: ReceiptJob,
    processed_path: Path,
    ocr_payload: dict,
    extracted_fields: dict,
    *,
    preprocess_metadata: dict,
    timings: dict,
    selected_path: str,
    recovery_reasons: list[str],
) -> None:
    now = _job_now(job)
    receipt = job.receipt
    raw_text = str(ocr_payload.get("raw_text", ""))
    confidence = min(max(float(ocr_payload.get("confidence", 0.0)), 0.0), 1.0)
    confidence_decimal = Decimal(f"{confidence:.4f}")
    raw_json = _build_ocr_debug_json(
        processed_path,
        ocr_payload,
        preprocess_metadata,
        selected_path=selected_path,
        timings=timings,
        recovery_reasons=recovery_reasons,
    )

    if receipt.ocr_result is None:
        receipt.ocr_result = ReceiptOcrResult(
            receipt_id=receipt.id,
            ocr_provider=str(ocr_payload.get("provider", "paddleocr")),
            raw_text=raw_text,
            raw_json=raw_json,
            confidence_score=confidence_decimal,
            created_at=now,
        )
    else:
        receipt.ocr_result.ocr_provider = str(ocr_payload.get("provider", "paddleocr"))
        receipt.ocr_result.raw_text = raw_text
        receipt.ocr_result.raw_json = raw_json
        receipt.ocr_result.confidence_score = confidence_decimal

    merchant_name = extracted_fields.get("merchant_name")
    transaction_date = _to_date(extracted_fields.get("transaction_date"))
    total_amount = Decimal(str(extracted_fields["total_amount"])) if extracted_fields.get("total_amount") is not None else None
    tax_amount = Decimal(str(extracted_fields["tax_amount"])) if extracted_fields.get("tax_amount") is not None else None
    extraction_payload = extracted_fields.get("extracted_json") or {}
    extraction_payload["parse_debug"] = {
        "selected_path": selected_path,
        "timings": timings,
        "recovery_reasons": recovery_reasons,
    }
    extraction_confidence = Decimal(f"{float(extracted_fields.get('confidence_score') or confidence):.4f}")

    if receipt.extraction is None:
        receipt.extraction = ReceiptExtraction(
            receipt_id=receipt.id,
            merchant_name=merchant_name,
            transaction_date=transaction_date,
            total_amount=total_amount,
            tax_amount=tax_amount,
            currency=str(extracted_fields.get("currency")) if extracted_fields.get("currency") else None,
            extracted_json=extraction_payload,
            confidence_score=extraction_confidence,
            review_status="needs_review",
            created_at=now,
            updated_at=now,
        )
    else:
        receipt.extraction.merchant_name = merchant_name
        receipt.extraction.transaction_date = transaction_date
        receipt.extraction.total_amount = total_amount
        receipt.extraction.tax_amount = tax_amount
        receipt.extraction.currency = str(extracted_fields.get("currency")) if extracted_fields.get("currency") else None
        receipt.extraction.extracted_json = extraction_payload
        receipt.extraction.confidence_score = extraction_confidence
        receipt.extraction.review_status = "needs_review"
        receipt.extraction.updated_at = now


def _persist_session_results(
    job: ReceiptParseJob,
    processed_path: Path,
    ocr_payload: dict,
    extracted_fields: dict,
    *,
    preprocess_metadata: dict,
    timings: dict,
    selected_path: str,
    recovery_reasons: list[str],
) -> None:
    now = _job_now(job)
    session = job.session
    confidence = min(max(float(ocr_payload.get("confidence", 0.0)), 0.0), 1.0)
    extraction_confidence = float(extracted_fields.get("confidence_score") or confidence)
    session.ocr_provider = str(ocr_payload.get("provider", "paddleocr"))
    session.ocr_raw_text = str(ocr_payload.get("raw_text", ""))
    session.ocr_confidence_score = Decimal(f"{confidence:.4f}")
    session.ocr_debug_json = _build_ocr_debug_json(
        processed_path,
        ocr_payload,
        preprocess_metadata,
        selected_path=selected_path,
        timings=timings,
        recovery_reasons=recovery_reasons,
    )
    session.merchant_name = extracted_fields.get("merchant_name")
    session.transaction_date = _to_date(extracted_fields.get("transaction_date"))
    session.total_amount = Decimal(str(extracted_fields["total_amount"])) if extracted_fields.get("total_amount") is not None else None
    session.tax_amount = Decimal(str(extracted_fields["tax_amount"])) if extracted_fields.get("tax_amount") is not None else None
    session.currency = str(extracted_fields.get("currency")) if extracted_fields.get("currency") else None
    extracted_json = dict(extracted_fields.get("extracted_json") or {})
    extracted_json["parse_debug"] = {
        "selected_path": selected_path,
        "timings": timings,
        "recovery_reasons": recovery_reasons,
    }
    session.extracted_json = extracted_json
    session.extraction_confidence_score = Decimal(f"{extraction_confidence:.4f}")
    session.review_status = "needs_review"
    session.updated_at = now


def _build_total_timings(
    job: ReceiptJob | ReceiptParseJob,
    fast_timings: dict,
    recovery_timings: dict | None = None,
) -> dict:
    queue_delay = 0.0
    if job.started_at is not None:
        queue_delay = max((job.started_at - job.created_at).total_seconds(), 0.0)
    total = queue_delay
    total += float(fast_timings.get("preprocess_seconds") or 0.0)
    total += float(fast_timings.get("ocr_seconds") or 0.0)
    total += float(fast_timings.get("extraction_seconds") or 0.0)
    if recovery_timings:
        total += float(recovery_timings.get("preprocess_seconds") or 0.0)
        total += float(recovery_timings.get("ocr_seconds") or 0.0)
        total += float(recovery_timings.get("extraction_seconds") or 0.0)
    return {
        "queue_delay_seconds": round(queue_delay, 4),
        "fast_path": fast_timings,
        "recovery_path": recovery_timings,
        "total_parse_seconds": round(total, 4),
    }


def _run_profiled_parse(
    source_path: Path,
    processed_dir: Path,
    *,
    file_stem: str,
    job: ReceiptJob | ReceiptParseJob,
) -> tuple[Path, dict, dict, dict, str, list[str]]:
    fast_processed_path, fast_ocr_payload, fast_extracted_fields, fast_preprocess = _run_attempt(
        source_path,
        processed_dir,
        file_stem=file_stem,
        profile="fast",
    )
    needs_recovery, recovery_reasons = _needs_recovery(fast_ocr_payload, fast_extracted_fields, fast_preprocess)
    if not needs_recovery:
        timings = _build_total_timings(job, fast_preprocess["timings"])
        preprocess_metadata = dict(fast_preprocess)
        preprocess_metadata.pop("timings", None)
        logger.info("Selected fast OCR path for job %s", job.id)
        return fast_processed_path, fast_ocr_payload, fast_extracted_fields, {**preprocess_metadata, "timings": timings}, "fast", []

    recovery_processed_path, recovery_ocr_payload, recovery_extracted_fields, recovery_preprocess = _run_attempt(
        source_path,
        processed_dir,
        file_stem=file_stem,
        profile="recovery",
    )
    timings = _build_total_timings(job, fast_preprocess["timings"], recovery_preprocess["timings"])
    recovery_score = float(recovery_extracted_fields.get("confidence_score") or recovery_ocr_payload.get("confidence") or 0.0)
    fast_score = float(fast_extracted_fields.get("confidence_score") or fast_ocr_payload.get("confidence") or 0.0)
    if recovery_score >= fast_score:
        preprocess_metadata = dict(recovery_preprocess)
        preprocess_metadata.pop("timings", None)
        logger.info("Selected recovery OCR path for job %s (%s)", job.id, ", ".join(recovery_reasons))
        return recovery_processed_path, recovery_ocr_payload, recovery_extracted_fields, {**preprocess_metadata, "timings": timings}, "recovery", recovery_reasons

    preprocess_metadata = dict(fast_preprocess)
    preprocess_metadata.pop("timings", None)
    logger.info("Kept fast OCR result for job %s after recovery comparison (%s)", job.id, ", ".join(recovery_reasons))
    return fast_processed_path, fast_ocr_payload, fast_extracted_fields, {**preprocess_metadata, "timings": timings}, "fast", recovery_reasons


def process_parse_job(db: Session, job_id: UUID) -> None:
    job = _load_parse_job(db, job_id)
    source_path = Path(job.receipt.original_url)
    processed_dir = source_path.parent / "processed"

    try:
        if not source_path.exists():
            raise FileNotFoundError("Stored receipt image is missing from the uploads folder")

        _set_receipt_phase(job, "preprocessing")
        db.commit()

        processed_path, ocr_payload, extracted_fields, preprocess_metadata, selected_path, recovery_reasons = _run_profiled_parse(
            source_path,
            processed_dir,
            file_stem=source_path.stem,
            job=job,
        )

        _set_receipt_phase(job, "extracting")
        db.commit()

        timings = preprocess_metadata.pop("timings", {})
        _persist_receipt_results(
            job,
            processed_path,
            ocr_payload,
            extracted_fields,
            preprocess_metadata=preprocess_metadata,
            timings=timings,
            selected_path=selected_path,
            recovery_reasons=recovery_reasons,
        )
        _set_receipt_phase(job, "ready_for_review", finished=True)
        db.commit()
    except Exception as exc:
        logger.exception("Receipt parse failed for job %s", job_id)
        db.rollback()
        failed_job = _load_parse_job(db, job_id)
        _set_receipt_phase(failed_job, "failed", error_message=str(exc) or "Receipt OCR failed", finished=True)
        db.commit()


def process_session_parse_job(db: Session, job_id: UUID) -> None:
    job = _load_session_parse_job(db, job_id)
    source_path = Path(job.session.temp_url)
    processed_dir = source_path.parent / "processed"

    try:
        if not source_path.exists():
            raise FileNotFoundError("Temporary receipt image is missing from the uploads folder")

        _set_session_phase(job, "preprocessing")
        db.commit()

        processed_path, ocr_payload, extracted_fields, preprocess_metadata, selected_path, recovery_reasons = _run_profiled_parse(
            source_path,
            processed_dir,
            file_stem=source_path.stem,
            job=job,
        )

        _set_session_phase(job, "extracting")
        db.commit()

        timings = preprocess_metadata.pop("timings", {})
        _persist_session_results(
            job,
            processed_path,
            ocr_payload,
            extracted_fields,
            preprocess_metadata=preprocess_metadata,
            timings=timings,
            selected_path=selected_path,
            recovery_reasons=recovery_reasons,
        )
        _set_session_phase(job, "ready_for_review", finished=True)
        db.commit()
    except Exception as exc:
        logger.exception("Receipt parse session failed for job %s", job_id)
        db.rollback()
        failed_job = _load_session_parse_job(db, job_id)
        _set_session_phase(failed_job, "failed", error_message=str(exc) or "Receipt OCR failed", finished=True)
        db.commit()
