from __future__ import annotations

from datetime import UTC, datetime, timedelta
from decimal import Decimal
from pathlib import Path

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
import logging

from app.core.auth import AuthenticatedUser
from app.core.config import settings
from app.models.receipt import (
    Receipt,
    ReceiptFeedback,
    ReceiptParserResult,
    ReceiptParseSession,
    compute_image_hash,
)
from app.services.finance_client import create_finance_transaction
from app.services.receipt_storage import delete_file_quietly, promote_temp_upload
from app.services.shared_finance_lookup_service import resolve_shared_user_id

logger = logging.getLogger(__name__)


def utc_now() -> datetime:
    return datetime.now(UTC)


def cleanup_expired_parse_sessions(db: Session) -> int:
    now = utc_now()
    grace_cutoff = now - timedelta(hours=settings.receipt_session_cleanup_grace_hours)
    sessions = (
        db.execute(
            select(ReceiptParseSession)
            .where(
                ReceiptParseSession.finalized_at.is_(None),
                ReceiptParseSession.expires_at <= grace_cutoff,
            )
            .order_by(ReceiptParseSession.expires_at.asc())
            .limit(settings.receipt_session_cleanup_batch_size)
        )
        .scalars()
        .all()
    )
    cleaned = 0
    for session in sessions:
        delete_file_quietly(session.temp_url)
        logger.info("Cleaning expired parse session %s", session.id)
        db.delete(session)
        cleaned += 1
    if cleaned:
        db.commit()
    return cleaned


def finalize_parse_session(
    db: Session,
    session: ReceiptParseSession,
    payload,
    current_user: AuthenticatedUser,
) -> tuple[ReceiptParseSession, Receipt, str, str | None]:
    shared_user_id = resolve_shared_user_id(db, email=current_user.email)
    if session.user_id != shared_user_id:
        raise HTTPException(status_code=403, detail="Receipt parse session does not belong to the authenticated user")
    if session.status not in {"ready_for_review", "reviewed", "confirmed"}:
        raise HTTPException(status_code=400, detail="Receipt parse session must be parsed before confirmation")
    if session.finalized_at is not None and session.confirmed_receipt_id is not None:
        confirmed_receipt = db.get(Receipt, session.confirmed_receipt_id)
        if confirmed_receipt is None:
            raise HTTPException(status_code=404, detail="Confirmed receipt is missing")
        return session, confirmed_receipt, session.finance_transaction_id or "", None

    now = utc_now()
    permanent_url = promote_temp_upload(session.temp_url, session.file_name)
    try:
        image_hash = Path(session.temp_url).read_bytes()
    except OSError:
        image_hash = b""

    receipt = Receipt(
        user_id=shared_user_id,
        file_name=session.file_name,
        image_url=permanent_url,
        mime_type=session.mime_type,
        file_size=session.file_size,
        image_hash=compute_image_hash(image_hash) if image_hash else session.image_hash,
        status="reviewed",
        uploaded_at=session.created_at,
        processed_at=session.processed_at or now,
        created_at=now,
        updated_at=now,
    )
    db.add(receipt)
    db.flush()

    corrected_fields = {
        "merchant_name": payload.merchant_name if payload.merchant_name is not None else session.merchant_name,
        "transaction_date": payload.transaction_date.isoformat(),
        "total_amount": payload.amount,
        "tax_amount": float(session.tax_amount) if session.tax_amount is not None else None,
        "currency": session.currency or "VND",
    }
    extracted_json = dict(session.extracted_json or {})
    extracted_json["fields"] = {
        **dict(extracted_json.get("fields") or {}),
        **corrected_fields,
    }
    extracted_json["review_status"] = "confirmed"
    receipt.parser_result = ReceiptParserResult(
        receipt_id=receipt.id,
        provider=session.ocr_provider or "veryfi",
        raw_text=session.ocr_raw_text,
        provider_json=session.ocr_debug_json,
        normalized_json=extracted_json,
        suggested_category_id=(
            int(extracted_json["review_defaults"]["category_id"])
            if isinstance(extracted_json.get("review_defaults"), dict)
            and extracted_json["review_defaults"].get("category_id")
            else None
        ),
        suggested_description=payload.description,
        created_at=now,
        updated_at=now,
    )

    if session.reviewer_feedback_json or session.reviewer_note:
        db.add(
            ReceiptFeedback(
                receipt_id=receipt.id,
                user_id=shared_user_id,
                original_data_json=session.extracted_json,
                corrected_data_json=session.reviewer_feedback_json or corrected_fields,
                feedback_note=session.reviewer_note,
                created_at=now,
            )
        )

    finance_result = create_finance_transaction(
        wallet_id=payload.wallet_id,
        category_id=payload.category_id,
        transaction_type=payload.type,
        amount=payload.amount,
        description=payload.description,
        merchant_name=payload.merchant_name,
        transaction_date=payload.transaction_date,
        receipt_id=receipt.id,
        access_token=current_user.token,
    )
    finance_transaction_id = finance_result["id"]
    finance_warning = finance_result["warning"]

    receipt.parser_result.normalized_json = {
        **dict(receipt.parser_result.normalized_json or {}),
        "finance_transaction_id": finance_transaction_id,
    }
    session.status = "confirmed"
    session.review_status = "confirmed"
    session.permanent_url = permanent_url
    session.confirmed_receipt_id = receipt.id
    session.finance_transaction_id = finance_transaction_id
    session.finalized_at = now
    session.updated_at = now
    receipt.status = "confirmed"
    receipt.updated_at = now
    receipt.processed_at = session.processed_at or now
    db.commit()
    db.refresh(session)
    db.refresh(receipt)
    logger.info("Finalized parse session %s into confirmed receipt %s", session.id, receipt.id)
    return session, receipt, finance_transaction_id, finance_warning
