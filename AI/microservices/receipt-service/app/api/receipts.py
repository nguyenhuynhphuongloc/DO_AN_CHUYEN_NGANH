from datetime import UTC, datetime, timedelta
from decimal import Decimal
from pathlib import Path
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session, joinedload

from app.core.auth import AuthenticatedUser, get_current_user
from app.core.config import settings
from app.db.session import get_db
from app.models.receipt import (
    Receipt,
    ReceiptFeedback,
    ReceiptParseSession,
    compute_image_hash,
)
from app.schemas.receipt import (
    ParseReceiptResponse,
    ReceiptConfirmRequest,
    ReceiptExtractionResponse,
    ReceiptFeedbackResponse,
    ReceiptFeedbackRequest,
    ReceiptJobResponse,
    ReceiptMetadataResponse,
    ReceiptOcrDebugResponse,
    ReceiptOcrResultResponse,
    ReceiptParseJobResponse,
    ReceiptParseSessionMetadataResponse,
    ReceiptWorkflowResponse,
    SessionFeedbackResponse,
)
from app.services.receipt_queue import (
    enqueue_parse_job,
    enqueue_session_parse_job,
    get_active_parse_job,
    get_active_session_parse_job,
)
from app.services.receipt_storage import store_temp_upload
from app.services.session_finalize import finalize_parse_session, utc_now

router = APIRouter(prefix="/receipts", tags=["receipts"])


def _now() -> datetime:
    return datetime.now(UTC)


def _load_receipt(receipt_id: str, db: Session, user_id: UUID | None = None) -> Receipt:
    receipt = (
        db.query(Receipt)
        .options(
            joinedload(Receipt.ocr_result),
            joinedload(Receipt.extraction),
            joinedload(Receipt.feedback_items),
            joinedload(Receipt.jobs),
        )
        .filter(Receipt.id == UUID(receipt_id))
        .first()
    )
    if receipt is None:
        raise HTTPException(status_code=404, detail="Receipt not found")
    if user_id is not None and receipt.user_id != user_id:
        raise HTTPException(status_code=403, detail="Receipt does not belong to the authenticated user")
    return receipt


def _load_session(session_id: str, db: Session, user_id: UUID | None = None) -> ReceiptParseSession:
    session = (
        db.query(ReceiptParseSession)
        .options(joinedload(ReceiptParseSession.jobs), joinedload(ReceiptParseSession.confirmed_receipt))
        .filter(ReceiptParseSession.id == UUID(session_id))
        .first()
    )
    if session is None:
        raise HTTPException(status_code=404, detail="Receipt parse session not found")
    if user_id is not None and session.user_id != user_id:
        raise HTTPException(status_code=403, detail="Receipt parse session does not belong to the authenticated user")
    return session


def _merge_corrected_extraction_payload(original_data: dict | None, corrected_fields: dict, *, status: str) -> dict:
    payload = dict(original_data or {})
    fields = dict(payload.get("fields") or {})
    fields.update(corrected_fields)
    payload["fields"] = fields

    needs_review_fields = set(payload.get("needs_review_fields") or [])
    for field_name, field_value in corrected_fields.items():
        if field_value in (None, ""):
            needs_review_fields.add(field_name)
        else:
            needs_review_fields.discard(field_name)

    if needs_review_fields:
        payload["needs_review_fields"] = sorted(needs_review_fields)
    else:
        payload.pop("needs_review_fields", None)

    payload["review_status"] = status
    return payload


def _build_receipt_artifact_url(receipt_id: UUID | str, artifact: str) -> str:
    return f"/receipts/{receipt_id}/ocr-artifacts/{artifact}"


def _build_session_artifact_url(session_id: UUID | str, artifact: str) -> str:
    return f"/receipts/sessions/{session_id}/ocr-artifacts/{artifact}"


def _serialize_receipt(receipt: Receipt, *, finance_transaction_id: str | None = None, finance_warning: str | None = None) -> ReceiptWorkflowResponse:
    latest_feedback = ReceiptFeedbackResponse.model_validate(receipt.feedback_items[0]) if receipt.feedback_items else None
    raw_json = receipt.ocr_result.raw_json if receipt.ocr_result is not None and isinstance(receipt.ocr_result.raw_json, dict) else {}
    ocr_debug = None
    if receipt.ocr_result is not None:
        ocr_debug = ReceiptOcrDebugResponse(
            raw_text=receipt.ocr_result.raw_text,
            lines=[str(line) for line in raw_json.get("lines", [])] if isinstance(raw_json.get("lines"), list) else [],
            provider=receipt.ocr_result.ocr_provider,
            confidence_score=float(receipt.ocr_result.confidence_score) if receipt.ocr_result.confidence_score is not None else None,
            display_mode=str(raw_json.get("display_mode")) if raw_json.get("display_mode") else None,
            boxed_image_url=_build_receipt_artifact_url(receipt.id, "image") if raw_json.get("boxed_image_path") else None,
            layout_image_url=_build_receipt_artifact_url(receipt.id, "layout") if raw_json.get("layout_image_path") else None,
            text_file_url=_build_receipt_artifact_url(receipt.id, "text") if raw_json.get("ocr_text_file_path") else None,
            device=str(raw_json.get("device")) if raw_json.get("device") else None,
            ocr_language=str(raw_json.get("ocr_language")) if raw_json.get("ocr_language") else None,
            fallback_used=bool(raw_json.get("fallback_used")) if raw_json.get("fallback_used") is not None else None,
            low_quality_ratio=float(raw_json.get("low_quality_ratio")) if isinstance(raw_json.get("low_quality_ratio"), (float, int)) else None,
            profile=str(raw_json.get("profile")) if raw_json.get("profile") else None,
            selected_path=str(raw_json.get("selected_path")) if raw_json.get("selected_path") else None,
            timings=raw_json.get("timings") if isinstance(raw_json.get("timings"), dict) else None,
            preprocess=raw_json.get("preprocess") if isinstance(raw_json.get("preprocess"), dict) else None,
            line_count=int(raw_json.get("line_count")) if isinstance(raw_json.get("line_count"), int) else None,
            detected_box_count=int(raw_json.get("detected_box_count")) if isinstance(raw_json.get("detected_box_count"), int) else None,
            short_line_ratio=float(raw_json.get("short_line_ratio")) if isinstance(raw_json.get("short_line_ratio"), (float, int)) else None,
            runtime=raw_json.get("runtime") if isinstance(raw_json.get("runtime"), dict) else None,
            engine_config=raw_json.get("engine_config") if isinstance(raw_json.get("engine_config"), dict) else None,
            ordering=raw_json.get("ordering") if isinstance(raw_json.get("ordering"), dict) else None,
            layout=raw_json.get("layout") if isinstance(raw_json.get("layout"), dict) else None,
            structured_json=raw_json.get("structured_json") if isinstance(raw_json.get("structured_json"), dict) else None,
            provider_document_id=raw_json.get("provider_document_id"),
            provider_payload_summary=raw_json.get("provider_payload_summary") if isinstance(raw_json.get("provider_payload_summary"), dict) else None,
            provider_payload=raw_json.get("provider_payload") if isinstance(raw_json.get("provider_payload"), dict) else None,
        )

    return ReceiptWorkflowResponse(
        receipt=ReceiptMetadataResponse.model_validate(receipt),
        session=None,
        confirmed_receipt=None,
        ocr_result=ReceiptOcrResultResponse.model_validate(receipt.ocr_result) if receipt.ocr_result is not None else None,
        ocr_debug=ocr_debug,
        extraction_result=ReceiptExtractionResponse.model_validate(receipt.extraction) if receipt.extraction is not None else None,
        latest_feedback=latest_feedback,
        jobs=[ReceiptJobResponse.model_validate(job) for job in receipt.jobs],
        session_jobs=[],
        active_job=ReceiptJobResponse.model_validate(get_active_parse_job(receipt)) if get_active_parse_job(receipt) is not None else None,
        finance_transaction_id=finance_transaction_id,
        finance_warning=finance_warning,
    )


def _serialize_session(session: ReceiptParseSession, *, finance_warning: str | None = None) -> ReceiptWorkflowResponse:
    ocr_debug_json = session.ocr_debug_json if isinstance(session.ocr_debug_json, dict) else {}
    ocr_result = None
    if session.ocr_raw_text is not None or session.ocr_debug_json is not None:
            ocr_result = ReceiptOcrResultResponse(
                id=session.id,
                receipt_id=session.id,
                ocr_provider=session.ocr_provider or "veryfi",
                raw_text=session.ocr_raw_text,
                raw_json=session.ocr_debug_json,
                confidence_score=float(session.ocr_confidence_score) if session.ocr_confidence_score is not None else None,
            created_at=session.created_at,
        )

    extraction_result = None
    if session.extracted_json is not None or session.merchant_name is not None:
        extraction_result = ReceiptExtractionResponse(
            id=session.id,
            receipt_id=session.id,
            merchant_name=session.merchant_name,
            transaction_date=session.transaction_date,
            total_amount=float(session.total_amount) if session.total_amount is not None else None,
            tax_amount=float(session.tax_amount) if session.tax_amount is not None else None,
            currency=session.currency,
            extracted_json=session.extracted_json,
            confidence_score=float(session.extraction_confidence_score) if session.extraction_confidence_score is not None else None,
            review_status=session.review_status,
            created_at=session.created_at,
            updated_at=session.updated_at,
        )

    latest_feedback = None
    if session.reviewer_feedback_json or session.reviewer_note:
        latest_feedback = SessionFeedbackResponse(
            corrected_data_json=session.reviewer_feedback_json or {},
            feedback_note=session.reviewer_note,
        )

    confirmed_receipt = ReceiptMetadataResponse.model_validate(session.confirmed_receipt) if session.confirmed_receipt is not None else None
    return ReceiptWorkflowResponse(
        receipt=None,
        session=ReceiptParseSessionMetadataResponse.model_validate(session),
        confirmed_receipt=confirmed_receipt,
        ocr_result=ocr_result,
        ocr_debug=ReceiptOcrDebugResponse(
            raw_text=session.ocr_raw_text,
            lines=[str(line) for line in ocr_debug_json.get("lines", [])] if isinstance(ocr_debug_json.get("lines"), list) else [],
            provider=session.ocr_provider,
            confidence_score=float(session.ocr_confidence_score) if session.ocr_confidence_score is not None else None,
            display_mode=str(ocr_debug_json.get("display_mode")) if ocr_debug_json.get("display_mode") else None,
            boxed_image_url=_build_session_artifact_url(session.id, "image") if ocr_debug_json.get("boxed_image_path") else None,
            layout_image_url=_build_session_artifact_url(session.id, "layout") if ocr_debug_json.get("layout_image_path") else None,
            text_file_url=_build_session_artifact_url(session.id, "text") if ocr_debug_json.get("ocr_text_file_path") else None,
            device=str(ocr_debug_json.get("device")) if ocr_debug_json.get("device") else None,
            ocr_language=str(ocr_debug_json.get("ocr_language")) if ocr_debug_json.get("ocr_language") else None,
            fallback_used=bool(ocr_debug_json.get("fallback_used")) if ocr_debug_json.get("fallback_used") is not None else None,
            low_quality_ratio=float(ocr_debug_json.get("low_quality_ratio")) if isinstance(ocr_debug_json.get("low_quality_ratio"), (float, int)) else None,
            profile=str(ocr_debug_json.get("profile")) if ocr_debug_json.get("profile") else None,
            selected_path=str(ocr_debug_json.get("selected_path")) if ocr_debug_json.get("selected_path") else None,
            timings=ocr_debug_json.get("timings") if isinstance(ocr_debug_json.get("timings"), dict) else None,
            preprocess=ocr_debug_json.get("preprocess") if isinstance(ocr_debug_json.get("preprocess"), dict) else None,
            line_count=int(ocr_debug_json.get("line_count")) if isinstance(ocr_debug_json.get("line_count"), int) else None,
            detected_box_count=int(ocr_debug_json.get("detected_box_count")) if isinstance(ocr_debug_json.get("detected_box_count"), int) else None,
            short_line_ratio=float(ocr_debug_json.get("short_line_ratio")) if isinstance(ocr_debug_json.get("short_line_ratio"), (float, int)) else None,
            runtime=ocr_debug_json.get("runtime") if isinstance(ocr_debug_json.get("runtime"), dict) else None,
            engine_config=ocr_debug_json.get("engine_config") if isinstance(ocr_debug_json.get("engine_config"), dict) else None,
            ordering=ocr_debug_json.get("ordering") if isinstance(ocr_debug_json.get("ordering"), dict) else None,
            layout=ocr_debug_json.get("layout") if isinstance(ocr_debug_json.get("layout"), dict) else None,
            structured_json=ocr_debug_json.get("structured_json") if isinstance(ocr_debug_json.get("structured_json"), dict) else None,
            provider_document_id=ocr_debug_json.get("provider_document_id"),
            provider_payload_summary=ocr_debug_json.get("provider_payload_summary") if isinstance(ocr_debug_json.get("provider_payload_summary"), dict) else None,
            provider_payload=ocr_debug_json.get("provider_payload") if isinstance(ocr_debug_json.get("provider_payload"), dict) else None,
        ) if ocr_result is not None else None,
        extraction_result=extraction_result,
        latest_feedback=latest_feedback,
        jobs=[],
        session_jobs=[ReceiptParseJobResponse.model_validate(job) for job in session.jobs],
        active_job=ReceiptParseJobResponse.model_validate(get_active_session_parse_job(session)) if get_active_session_parse_job(session) is not None else None,
        finance_transaction_id=session.finance_transaction_id,
        finance_warning=finance_warning,
    )


def _artifact_response(path_value: str | None, artifact: str, *, fallback_name: str) -> FileResponse:
    path = Path(path_value or "")
    if not path.exists() or not path.is_file():
        raise HTTPException(status_code=404, detail=f"OCR {artifact} artifact not found")
    media_type = "image/png" if artifact in {"image", "layout"} else "text/plain; charset=utf-8"
    if artifact == "image":
        filename = f"{fallback_name}-ocr-boxes.png"
    elif artifact == "layout":
        filename = f"{fallback_name}-layout-blocks.png"
    else:
        filename = f"{fallback_name}-ocr.txt"
    return FileResponse(path, media_type=media_type, filename=filename)


async def _upload_legacy_receipt(
    file: UploadFile,
    current_user: AuthenticatedUser,
    db: Session,
) -> ReceiptWorkflowResponse:
    upload_dir = Path(settings.receipt_upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")
    extension = Path(file.filename or "").suffix or ".bin"
    stored_file_name = f"{uuid4()}{extension}"
    destination = upload_dir / stored_file_name
    destination.write_bytes(file_bytes)

    timestamp = _now()
    receipt = Receipt(
        user_id=current_user.user_id,
        file_name=file.filename or stored_file_name,
        original_url=str(destination),
        mime_type=file.content_type,
        file_size=len(file_bytes),
        image_hash=compute_image_hash(file_bytes),
        status="uploaded",
        uploaded_at=timestamp,
        created_at=timestamp,
        updated_at=timestamp,
    )
    db.add(receipt)
    db.flush()
    enqueue_parse_job(db, receipt)
    db.commit()
    return _serialize_receipt(_load_receipt(str(receipt.id), db))


@router.post("/upload", response_model=ReceiptWorkflowResponse)
async def upload_receipt(
    file: UploadFile = File(...),
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ReceiptWorkflowResponse:
    if not settings.receipt_session_first_enabled:
        return await _upload_legacy_receipt(file, current_user, db)

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")
    stored_file_name, temp_url = store_temp_upload(file.filename, file_bytes)
    timestamp = utc_now()

    session = ReceiptParseSession(
        user_id=current_user.user_id,
        file_name=file.filename or stored_file_name,
        temp_url=temp_url,
        mime_type=file.content_type,
        file_size=len(file_bytes),
        image_hash=compute_image_hash(file_bytes),
        status="uploaded",
        expires_at=timestamp + timedelta(hours=settings.receipt_session_expiry_hours),
        created_at=timestamp,
        updated_at=timestamp,
    )
    db.add(session)
    db.flush()
    enqueue_session_parse_job(db, session)
    db.commit()
    return _serialize_session(_load_session(str(session.id), db))


@router.get("/{receipt_id}", response_model=ReceiptWorkflowResponse)
def get_receipt(
    receipt_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ReceiptWorkflowResponse:
    return _serialize_receipt(_load_receipt(receipt_id, db, current_user.user_id))


@router.get("/{receipt_id}/ocr-artifacts/{artifact}")
def get_receipt_ocr_artifact(
    receipt_id: str,
    artifact: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FileResponse:
    if artifact not in {"image", "layout", "text"}:
        raise HTTPException(status_code=404, detail="OCR artifact not found")
    receipt = _load_receipt(receipt_id, db, current_user.user_id)
    raw_json = receipt.ocr_result.raw_json if receipt.ocr_result is not None and isinstance(receipt.ocr_result.raw_json, dict) else {}
    if artifact == "image":
        path_value = raw_json.get("boxed_image_path")
    elif artifact == "layout":
        path_value = raw_json.get("layout_image_path")
    else:
        path_value = raw_json.get("ocr_text_file_path")
    return _artifact_response(str(path_value) if path_value else None, artifact, fallback_name=Path(receipt.file_name).stem or str(receipt.id))


@router.post("/{receipt_id}/parse", response_model=ParseReceiptResponse)
def parse_receipt(
    receipt_id: str,
    force: bool = Query(default=False),
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ParseReceiptResponse:
    receipt = _load_receipt(receipt_id, db, current_user.user_id)
    enqueue_parse_job(db, receipt, force=force)
    db.commit()
    refreshed = _load_receipt(receipt_id, db, current_user.user_id)
    extraction_payload = refreshed.extraction.extracted_json if refreshed.extraction is not None else None
    return ParseReceiptResponse(receipt=_serialize_receipt(refreshed), extracted_fields=extraction_payload)


@router.post("/{receipt_id}/feedback", response_model=ReceiptWorkflowResponse)
def save_feedback(
    receipt_id: str,
    payload: ReceiptFeedbackRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ReceiptWorkflowResponse:
    receipt = _load_receipt(receipt_id, db, current_user.user_id)
    now = _now()
    if receipt.extraction is None:
        raise HTTPException(status_code=400, detail="Receipt must be parsed before feedback")

    original_data = receipt.extraction.extracted_json or {}
    corrected_data = {
        "merchant_name": payload.merchant_name if payload.merchant_name is not None else receipt.extraction.merchant_name,
        "transaction_date": (
            payload.transaction_date.date().isoformat()
            if payload.transaction_date is not None
            else (receipt.extraction.transaction_date.isoformat() if receipt.extraction.transaction_date else None)
        ),
        "total_amount": (
            payload.total_amount
            if payload.total_amount is not None
            else (float(receipt.extraction.total_amount) if receipt.extraction.total_amount is not None else None)
        ),
        "tax_amount": (
            payload.tax_amount
            if payload.tax_amount is not None
            else (float(receipt.extraction.tax_amount) if receipt.extraction.tax_amount is not None else None)
        ),
        "currency": payload.currency if payload.currency is not None else receipt.extraction.currency,
    }
    db.add(
        ReceiptFeedback(
            receipt_id=receipt.id,
            user_id=current_user.user_id,
            original_data_json=original_data,
            corrected_data_json=corrected_data,
            feedback_note=payload.feedback,
            created_at=now,
        )
    )
    receipt.extraction.merchant_name = corrected_data["merchant_name"]
    receipt.extraction.transaction_date = (
        datetime.fromisoformat(corrected_data["transaction_date"]).date()
        if corrected_data["transaction_date"]
        else None
    )
    receipt.extraction.total_amount = Decimal(str(corrected_data["total_amount"])) if corrected_data["total_amount"] is not None else None
    receipt.extraction.tax_amount = Decimal(str(corrected_data["tax_amount"])) if corrected_data["tax_amount"] is not None else None
    receipt.extraction.currency = corrected_data["currency"]
    receipt.extraction.extracted_json = _merge_corrected_extraction_payload(original_data, corrected_data, status="reviewed")
    receipt.extraction.review_status = "reviewed"
    receipt.extraction.updated_at = now
    receipt.status = "reviewed"
    receipt.updated_at = now
    db.commit()
    return _serialize_receipt(_load_receipt(receipt_id, db, current_user.user_id))


@router.post("/{receipt_id}/confirm", response_model=ReceiptWorkflowResponse)
def confirm_receipt(
    receipt_id: str,
    payload: ReceiptConfirmRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ReceiptWorkflowResponse:
    receipt = _load_receipt(receipt_id, db, current_user.user_id)
    from app.services.finance_client import create_finance_transaction

    now = _now()
    finance_result = create_finance_transaction(
        wallet_id=payload.wallet_id,
        category_id=payload.category_id,
        transaction_type=payload.type,
        amount=payload.amount,
        description=payload.description,
        merchant_name=payload.merchant_name,
        transaction_date=payload.transaction_date,
        access_token=current_user.token,
    )
    finance_transaction_id = finance_result["id"]
    finance_warning = finance_result["warning"]

    if receipt.extraction is not None:
        receipt.extraction.merchant_name = payload.merchant_name
        receipt.extraction.transaction_date = payload.transaction_date.date()
        receipt.extraction.total_amount = Decimal(str(payload.amount))
        receipt.extraction.review_status = "confirmed"
        extracted_json = _merge_corrected_extraction_payload(
            receipt.extraction.extracted_json,
            {
                "merchant_name": payload.merchant_name,
                "transaction_date": payload.transaction_date.date().isoformat(),
                "total_amount": payload.amount,
            },
            status="confirmed",
        )
        extracted_json["finance_transaction_id"] = finance_transaction_id
        receipt.extraction.extracted_json = extracted_json
        receipt.extraction.updated_at = now

    receipt.status = "confirmed"
    receipt.processed_at = now
    receipt.updated_at = now
    db.commit()
    return _serialize_receipt(
        _load_receipt(receipt_id, db, current_user.user_id),
        finance_transaction_id=finance_transaction_id,
        finance_warning=finance_warning,
    )


@router.get("/sessions/{session_id}", response_model=ReceiptWorkflowResponse)
def get_receipt_session(
    session_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ReceiptWorkflowResponse:
    return _serialize_session(_load_session(session_id, db, current_user.user_id))


@router.get("/sessions/{session_id}/ocr-artifacts/{artifact}")
def get_receipt_session_ocr_artifact(
    session_id: str,
    artifact: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FileResponse:
    if artifact not in {"image", "layout", "text"}:
        raise HTTPException(status_code=404, detail="OCR artifact not found")
    session = _load_session(session_id, db, current_user.user_id)
    raw_json = session.ocr_debug_json if isinstance(session.ocr_debug_json, dict) else {}
    if artifact == "image":
        path_value = raw_json.get("boxed_image_path")
    elif artifact == "layout":
        path_value = raw_json.get("layout_image_path")
    else:
        path_value = raw_json.get("ocr_text_file_path")
    return _artifact_response(str(path_value) if path_value else None, artifact, fallback_name=Path(session.file_name).stem or str(session.id))


@router.post("/sessions/{session_id}/parse", response_model=ParseReceiptResponse)
def parse_receipt_session(
    session_id: str,
    force: bool = Query(default=False),
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ParseReceiptResponse:
    session = _load_session(session_id, db, current_user.user_id)
    enqueue_session_parse_job(db, session, force=force)
    db.commit()
    refreshed = _load_session(session_id, db, current_user.user_id)
    return ParseReceiptResponse(receipt=_serialize_session(refreshed), extracted_fields=refreshed.extracted_json)


@router.post("/sessions/{session_id}/feedback", response_model=ReceiptWorkflowResponse)
def save_session_feedback(
    session_id: str,
    payload: ReceiptFeedbackRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ReceiptWorkflowResponse:
    session = _load_session(session_id, db, current_user.user_id)
    if session.extracted_json is None:
        raise HTTPException(status_code=400, detail="Receipt parse session must be parsed before feedback")
    corrected_data = {
        "merchant_name": payload.merchant_name if payload.merchant_name is not None else session.merchant_name,
        "transaction_date": (
            payload.transaction_date.date().isoformat()
            if payload.transaction_date is not None
            else (session.transaction_date.isoformat() if session.transaction_date else None)
        ),
        "total_amount": payload.total_amount if payload.total_amount is not None else (float(session.total_amount) if session.total_amount is not None else None),
        "tax_amount": payload.tax_amount if payload.tax_amount is not None else (float(session.tax_amount) if session.tax_amount is not None else None),
        "currency": payload.currency if payload.currency is not None else session.currency,
    }
    session.merchant_name = corrected_data["merchant_name"]
    session.transaction_date = datetime.fromisoformat(corrected_data["transaction_date"]).date() if corrected_data["transaction_date"] else None
    session.total_amount = Decimal(str(corrected_data["total_amount"])) if corrected_data["total_amount"] is not None else None
    session.tax_amount = Decimal(str(corrected_data["tax_amount"])) if corrected_data["tax_amount"] is not None else None
    session.currency = corrected_data["currency"]
    session.extracted_json = _merge_corrected_extraction_payload(session.extracted_json, corrected_data, status="reviewed")
    session.reviewer_feedback_json = corrected_data
    session.reviewer_note = payload.feedback
    session.review_status = "reviewed"
    session.status = "reviewed"
    session.updated_at = _now()
    db.commit()
    return _serialize_session(_load_session(session_id, db, current_user.user_id))


@router.post("/sessions/{session_id}/confirm", response_model=ReceiptWorkflowResponse)
def confirm_receipt_session(
    session_id: str,
    payload: ReceiptConfirmRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ReceiptWorkflowResponse:
    session = _load_session(session_id, db, current_user.user_id)
    session, receipt, finance_transaction_id, finance_warning = finalize_parse_session(db, session, payload, current_user)
    refreshed = _load_session(str(session.id), db, current_user.user_id)
    serialized = _serialize_session(refreshed, finance_warning=finance_warning)
    serialized.finance_transaction_id = finance_transaction_id
    serialized.confirmed_receipt = ReceiptMetadataResponse.model_validate(receipt)
    return serialized
