from __future__ import annotations

import logging
import time
from datetime import date, datetime
from decimal import Decimal
from pathlib import Path
from uuid import UUID

from sqlalchemy.orm import Session, joinedload

from app.core.config import settings
from app.models.receipt import Receipt, ReceiptJob, ReceiptParseJob, ReceiptParseSession, ReceiptParserResult
from app.services.image_preprocess import preprocess_image_with_metadata
from app.services.receipt_category_resolution_service import (
    ReceiptCategoryResolutionError,
    ReceiptCategoryResolutionService,
)
from app.services.receipt_description_service import build_receipt_description
from app.services.receipt_parser_normalizer import normalize_veryfi_document
from app.services.receipt_parser_service import ReceiptParserResult as ProviderParserResult
from app.services.receipt_parser_service import get_receipt_parser_service
from app.services.shared_finance_lookup_service import get_allowed_categories, get_default_wallet_id

logger = logging.getLogger(__name__)


def _write_parser_artifacts(*, processed_path: Path, raw_text: str) -> tuple[Path | None, Path | None, Path | None]:
    artifacts_dir = processed_path.parent / "ocr_artifacts"
    artifacts_dir.mkdir(parents=True, exist_ok=True)
    text_output_path = artifacts_dir / f"{processed_path.stem}.txt"
    text_output_path.write_text(raw_text or "", encoding="utf-8")
    return None, text_output_path, None


def _load_parse_job(db: Session, job_id: UUID) -> ReceiptJob:
    job = (
        db.query(ReceiptJob)
        .options(
            joinedload(ReceiptJob.receipt).joinedload(Receipt.parser_result),
            joinedload(ReceiptJob.receipt).joinedload(Receipt.feedback_items),
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


def _build_parser_debug_json(
    processed_path: Path,
    parser_result: ProviderParserResult,
    extracted_fields: dict,
    preprocess_metadata: dict,
    *,
    text_output_path: Path | None,
    timings: dict,
) -> dict:
    raw_text = parser_result.raw_text or ""
    lines = [line for line in raw_text.splitlines() if line.strip()]
    return {
        "display_mode": "parser",
        "lines": lines,
        "processed_image_path": str(processed_path),
        "boxed_image_path": None,
        "ocr_text_file_path": str(text_output_path) if text_output_path is not None else None,
        "layout_image_path": None,
        "device": None,
        "ocr_language": None,
        "fallback_used": False,
        "low_quality_ratio": None,
        "line_count": len(lines),
        "detected_box_count": None,
        "short_line_ratio": None,
        "runtime": parser_result.runtime,
        "engine_config": {
            "provider": parser_result.provider,
            "api_version": settings.veryfi_api_version,
            "timeout_seconds": settings.veryfi_timeout_seconds,
            "max_retries": settings.veryfi_max_retries,
        },
        "ordering": None,
        "layout": None,
        "preprocess": preprocess_metadata,
        "profile": "veryfi",
        "selected_path": "veryfi",
        "timings": timings,
        "structured_json": extracted_fields.get("extracted_json"),
        "provider_document_id": parser_result.document.get("id"),
        "provider_payload_summary": {
            "id": parser_result.document.get("id"),
            "document_type": parser_result.document.get("document_type"),
            "category": parser_result.document.get("category"),
            "created_date": parser_result.document.get("created_date"),
        },
        "provider_payload": parser_result.document if settings.receipt_parser_debug_include_provider_payload else None,
    }


def _prepare_processed_source(
    source_path: Path,
    processed_dir: Path,
    *,
    file_stem: str,
    profile: str,
) -> tuple[Path, dict, float]:
    if not settings.receipt_parser_preprocess_enabled:
        return source_path, {"profile": "disabled", "output_size": None, "pipeline": []}, 0.0

    processed_path = processed_dir / f"{file_stem}-{profile}.png"
    preprocess_start = time.perf_counter()
    _, preprocess_metadata = preprocess_image_with_metadata(
        str(source_path),
        str(processed_path),
        profile=settings.receipt_parser_preprocess_profile,
    )
    return processed_path, preprocess_metadata, time.perf_counter() - preprocess_start


def _run_primary_parse(
    processed_path: Path,
    *,
    debug_tag: str,
) -> tuple[ProviderParserResult, dict, float, float]:
    parse_start = time.perf_counter()
    parser_result = get_receipt_parser_service().parse_document(str(processed_path), external_id=debug_tag)
    parse_seconds = time.perf_counter() - parse_start

    normalize_start = time.perf_counter()
    extracted_fields = normalize_veryfi_document(
        parser_result.document,
        raw_text=parser_result.raw_text,
        runtime=parser_result.runtime,
    )
    normalize_seconds = time.perf_counter() - normalize_start
    logger.info(
        "Parser attempt provider=%s document_id=%s lines=%s image=%s parse_seconds=%.4f normalize_seconds=%.4f",
        parser_result.provider,
        parser_result.document.get("id"),
        len([line for line in parser_result.raw_text.splitlines() if line.strip()]),
        processed_path,
        parse_seconds,
        normalize_seconds,
    )
    return parser_result, extracted_fields, parse_seconds, normalize_seconds


def _apply_shared_review_suggestions(
    db: Session,
    *,
    owner_user_id: int,
    extracted_fields: dict,
) -> tuple[dict | None, str | None, str | None]:
    extracted_json = dict(extracted_fields.get("extracted_json") or {})
    review_defaults = dict(extracted_json.get("review_defaults") or {})
    parser_metadata = dict(extracted_json.get("parser_metadata") or {})
    normalized_text = dict(extracted_json.get("normalized_text") or {})

    category_suggestion = None
    categories = get_allowed_categories(db, user_id=owner_user_id, transaction_type="EXPENSE")
    if categories:
        try:
            category_suggestion = ReceiptCategoryResolutionService().resolve_category(
                normalized_receipt={
                    "fields": extracted_json.get("fields") or {},
                    "description_text": extracted_json.get("description_text"),
                    "parser_metadata": parser_metadata,
                    "normalized_text": {
                        "raw_text": normalized_text.get("raw_text"),
                        "normalized_lines": normalized_text.get("normalized_lines"),
                    },
                },
                categories=categories,
            )
        except ReceiptCategoryResolutionError as exc:
            logger.warning("Groq category resolution failed for user %s: %s", owner_user_id, exc)

    default_wallet_id = get_default_wallet_id(db, user_id=owner_user_id)
    if default_wallet_id:
        review_defaults["wallet_id"] = default_wallet_id

    suggested_category_name = None
    suggested_category_id = None
    if category_suggestion:
        suggested_category_id = category_suggestion.get("category_id")
        suggested_category_name = category_suggestion.get("category_name")
        review_defaults["category_id"] = suggested_category_id
        review_defaults["category_name"] = suggested_category_name
        review_defaults["category_reason"] = category_suggestion.get("reason")
        parser_metadata["category_suggestion"] = category_suggestion

    suggested_description = build_receipt_description(
        merchant_name=review_defaults.get("merchant_name") or extracted_fields.get("merchant_name"),
        category_name=suggested_category_name or parser_metadata.get("category"),
        transaction_date=review_defaults.get("transaction_time") or extracted_fields.get("transaction_date"),
        total_amount=review_defaults.get("amount") or extracted_fields.get("total_amount"),
        currency=extracted_fields.get("currency"),
    )
    if suggested_description:
        extracted_json["description_text"] = suggested_description
        review_defaults["description"] = suggested_description

    extracted_json["review_defaults"] = review_defaults
    extracted_json["parser_metadata"] = parser_metadata
    extracted_fields["extracted_json"] = extracted_json
    return category_suggestion, default_wallet_id, suggested_description


def _persist_receipt_results(
    db: Session,
    job: ReceiptJob,
    processed_path: Path,
    text_output_path: Path | None,
    parser_result: ProviderParserResult,
    extracted_fields: dict,
    *,
    preprocess_metadata: dict,
    timings: dict,
) -> None:
    now = _job_now(job)
    receipt = job.receipt
    raw_json = _build_parser_debug_json(
        processed_path,
        parser_result,
        extracted_fields,
        preprocess_metadata,
        text_output_path=text_output_path,
        timings=timings,
    )
    category_suggestion, _, suggested_description = _apply_shared_review_suggestions(
        db,
        owner_user_id=receipt.user_id,
        extracted_fields=extracted_fields,
    )
    normalized_json = dict(extracted_fields.get("extracted_json") or {})
    normalized_json["confidence_score"] = float(extracted_fields.get("confidence_score") or 0.0)
    normalized_json["parse_debug"] = {
        "selected_path": "veryfi",
        "timings": timings,
        "provider": parser_result.provider,
    }

    if receipt.parser_result is None:
        receipt.parser_result = ReceiptParserResult(
            receipt_id=receipt.id,
            provider=parser_result.provider,
            raw_text=parser_result.raw_text,
            provider_json=raw_json,
            normalized_json=normalized_json,
            suggested_category_id=int(category_suggestion["category_id"]) if category_suggestion and category_suggestion.get("category_id") else None,
            suggested_description=suggested_description,
            created_at=now,
            updated_at=now,
        )
    else:
        receipt.parser_result.provider = parser_result.provider
        receipt.parser_result.raw_text = parser_result.raw_text
        receipt.parser_result.provider_json = raw_json
        receipt.parser_result.normalized_json = normalized_json
        receipt.parser_result.suggested_category_id = (
            int(category_suggestion["category_id"]) if category_suggestion and category_suggestion.get("category_id") else None
        )
        receipt.parser_result.suggested_description = suggested_description
        receipt.parser_result.updated_at = now


def _persist_session_results(
    db: Session,
    job: ReceiptParseJob,
    processed_path: Path,
    text_output_path: Path | None,
    parser_result: ProviderParserResult,
    extracted_fields: dict,
    *,
    preprocess_metadata: dict,
    timings: dict,
) -> None:
    now = _job_now(job)
    session = job.session
    confidence = min(max(float(extracted_fields.get("confidence_score") or 0.0), 0.0), 1.0)
    extraction_confidence = float(extracted_fields.get("confidence_score") or confidence)
    category_suggestion, default_wallet_id, suggested_description = _apply_shared_review_suggestions(
        db,
        owner_user_id=session.user_id,
        extracted_fields=extracted_fields,
    )

    session.ocr_provider = parser_result.provider
    session.ocr_raw_text = parser_result.raw_text
    session.ocr_confidence_score = Decimal(f"{confidence:.4f}")
    session.ocr_debug_json = _build_parser_debug_json(
        processed_path,
        parser_result,
        extracted_fields,
        preprocess_metadata,
        text_output_path=text_output_path,
        timings=timings,
    )
    session.merchant_name = extracted_fields.get("merchant_name")
    transaction_date = extracted_fields.get("transaction_date")
    session.transaction_date = datetime.fromisoformat(str(transaction_date)) if transaction_date else None
    session.total_amount = Decimal(str(extracted_fields["total_amount"])) if extracted_fields.get("total_amount") is not None else None
    session.tax_amount = Decimal(str(extracted_fields["tax_amount"])) if extracted_fields.get("tax_amount") is not None else None
    session.currency = str(extracted_fields.get("currency")) if extracted_fields.get("currency") else None
    extracted_json = dict(extracted_fields.get("extracted_json") or {})
    extracted_json["confidence_score"] = extraction_confidence
    extracted_json["parse_debug"] = {
        "selected_path": "veryfi",
        "timings": timings,
        "provider": parser_result.provider,
    }
    if category_suggestion:
        extracted_json["suggested_category"] = category_suggestion
    if default_wallet_id:
        extracted_json["suggested_wallet_id"] = default_wallet_id
    if suggested_description:
        extracted_json["suggested_description"] = suggested_description
    session.extracted_json = extracted_json
    session.extraction_confidence_score = Decimal(f"{extraction_confidence:.4f}")
    session.review_status = "needs_review"
    session.updated_at = now


def _build_total_timings(
    job: ReceiptJob | ReceiptParseJob,
    attempt_timings: dict,
) -> dict:
    queue_delay = 0.0
    if job.started_at is not None:
        queue_delay = max((job.started_at - job.created_at).total_seconds(), 0.0)
    total = queue_delay
    total += float(attempt_timings.get("preprocess_seconds") or 0.0)
    total += float(attempt_timings.get("parser_seconds") or 0.0)
    total += float(attempt_timings.get("normalize_seconds") or 0.0)
    return {
        "queue_delay_seconds": round(queue_delay, 4),
        "primary_path": attempt_timings,
        "total_parse_seconds": round(total, 4),
    }


def process_parse_job(db: Session, job_id: UUID) -> None:
    job = _load_parse_job(db, job_id)
    source_path = Path(job.receipt.image_url)
    processed_dir = source_path.parent / "processed"

    try:
        if not source_path.exists():
            raise FileNotFoundError("Stored receipt image is missing from the uploads folder")

        _set_receipt_phase(job, "preprocessing")
        db.commit()

        processed_path, preprocess_metadata, preprocess_seconds = _prepare_processed_source(
            source_path,
            processed_dir,
            file_stem=source_path.stem,
            profile="veryfi",
        )

        _set_receipt_phase(job, "ocr_running")
        db.commit()

        parser_result, extracted_fields, parser_seconds, normalize_seconds = _run_primary_parse(
            processed_path,
            debug_tag=source_path.stem,
        )
        _, text_output_path, _ = _write_parser_artifacts(
            processed_path=processed_path,
            raw_text=parser_result.raw_text,
        )

        _set_receipt_phase(job, "extracting")
        db.commit()

        timings = _build_total_timings(
            job,
            {
                "preprocess_seconds": round(preprocess_seconds, 4),
                "parser_seconds": round(parser_seconds, 4),
                "normalize_seconds": round(normalize_seconds, 4),
            },
        )
        _persist_receipt_results(
            db,
            job,
            processed_path,
            text_output_path,
            parser_result,
            extracted_fields,
            preprocess_metadata=preprocess_metadata,
            timings=timings,
        )
        _set_receipt_phase(job, "ready_for_review", finished=True)
        db.commit()
    except Exception as exc:
        logger.exception("Receipt parse failed for job %s", job_id)
        db.rollback()
        failed_job = _load_parse_job(db, job_id)
        _set_receipt_phase(failed_job, "failed", error_message=str(exc) or "Receipt parsing failed", finished=True)
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

        processed_path, preprocess_metadata, preprocess_seconds = _prepare_processed_source(
            source_path,
            processed_dir,
            file_stem=source_path.stem,
            profile="veryfi",
        )

        _set_session_phase(job, "ocr_running")
        db.commit()

        parser_result, extracted_fields, parser_seconds, normalize_seconds = _run_primary_parse(
            processed_path,
            debug_tag=source_path.stem,
        )
        _, text_output_path, _ = _write_parser_artifacts(
            processed_path=processed_path,
            raw_text=parser_result.raw_text,
        )

        _set_session_phase(job, "extracting")
        db.commit()

        timings = _build_total_timings(
            job,
            {
                "preprocess_seconds": round(preprocess_seconds, 4),
                "parser_seconds": round(parser_seconds, 4),
                "normalize_seconds": round(normalize_seconds, 4),
            },
        )
        _persist_session_results(
            db,
            job,
            processed_path,
            text_output_path,
            parser_result,
            extracted_fields,
            preprocess_metadata=preprocess_metadata,
            timings=timings,
        )
        _set_session_phase(job, "ready_for_review", finished=True)
        db.commit()
    except Exception as exc:
        logger.exception("Receipt parse session failed for job %s", job_id)
        db.rollback()
        failed_job = _load_session_parse_job(db, job_id)
        _set_session_phase(failed_job, "failed", error_message=str(exc) or "Receipt parsing failed", finished=True)
        db.commit()
