from datetime import UTC, datetime
from decimal import Decimal
from pathlib import Path
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session, joinedload

from app.core.auth import AuthenticatedUser, get_current_user
from app.core.config import settings
from app.db.session import get_db
from app.models.receipt import (
    Receipt,
    ReceiptFeedback,
    compute_image_hash,
)
from app.schemas.receipt import (
    ParseReceiptResponse,
    ReceiptConfirmRequest,
    ReceiptDetailResponse,
    ReceiptFeedbackRequest,
    ReceiptOcrDebugResponse,
)
from app.services.finance_client import create_finance_transaction
from app.services.receipt_queue import enqueue_parse_job, get_active_parse_job

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


def _serialize_receipt(
    receipt: Receipt,
    finance_transaction_id: str | None = None,
    finance_warning: str | None = None,
) -> ReceiptDetailResponse:
    latest_feedback = receipt.feedback_items[0] if receipt.feedback_items else None
    ocr_debug = None
    active_job = get_active_parse_job(receipt)

    if receipt.ocr_result is not None:
        raw_json = receipt.ocr_result.raw_json or {}
        lines = raw_json.get("lines", [])
        ocr_debug = ReceiptOcrDebugResponse(
            raw_text=receipt.ocr_result.raw_text,
            lines=[str(line) for line in lines] if isinstance(lines, list) else [],
            provider=receipt.ocr_result.ocr_provider,
            confidence_score=float(receipt.ocr_result.confidence_score) if receipt.ocr_result.confidence_score is not None else None,
            device=str(raw_json.get("device")) if raw_json.get("device") else None,
        )

    return ReceiptDetailResponse(
        receipt=receipt,
        ocr_result=receipt.ocr_result,
        ocr_debug=ocr_debug,
        extraction_result=receipt.extraction,
        latest_feedback=latest_feedback,
        jobs=receipt.jobs,
        active_job=active_job,
        finance_transaction_id=finance_transaction_id,
        finance_warning=finance_warning,
    )


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


@router.post("/upload", response_model=ReceiptDetailResponse)
async def upload_receipt(
    file: UploadFile = File(...),
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ReceiptDetailResponse:
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


@router.get("/{receipt_id}", response_model=ReceiptDetailResponse)
def get_receipt(
    receipt_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ReceiptDetailResponse:
    return _serialize_receipt(_load_receipt(receipt_id, db, current_user.user_id))


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


@router.post("/{receipt_id}/feedback", response_model=ReceiptDetailResponse)
def save_feedback(
    receipt_id: str,
    payload: ReceiptFeedbackRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ReceiptDetailResponse:
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

    feedback = ReceiptFeedback(
        receipt_id=receipt.id,
        user_id=current_user.user_id,
        original_data_json=original_data,
        corrected_data_json=corrected_data,
        feedback_note=payload.feedback,
        created_at=now,
    )
    db.add(feedback)

    receipt.extraction.merchant_name = corrected_data["merchant_name"]
    receipt.extraction.transaction_date = (
        datetime.fromisoformat(corrected_data["transaction_date"]).date()
        if corrected_data["transaction_date"]
        else None
    )
    receipt.extraction.total_amount = Decimal(str(corrected_data["total_amount"])) if corrected_data["total_amount"] is not None else None
    receipt.extraction.tax_amount = Decimal(str(corrected_data["tax_amount"])) if corrected_data["tax_amount"] is not None else None
    receipt.extraction.currency = corrected_data["currency"]
    receipt.extraction.extracted_json = _merge_corrected_extraction_payload(
        original_data,
        corrected_data,
        status="reviewed",
    )
    receipt.extraction.review_status = "reviewed"
    receipt.extraction.updated_at = now
    receipt.status = "reviewed"
    receipt.updated_at = now

    db.commit()
    return _serialize_receipt(_load_receipt(receipt_id, db, current_user.user_id))


@router.post("/{receipt_id}/confirm", response_model=ReceiptDetailResponse)
def confirm_receipt(
    receipt_id: str,
    payload: ReceiptConfirmRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ReceiptDetailResponse:
    receipt = _load_receipt(receipt_id, db, current_user.user_id)
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
