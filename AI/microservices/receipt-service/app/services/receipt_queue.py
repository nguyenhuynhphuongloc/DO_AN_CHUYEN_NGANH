from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.models.receipt import Receipt, ReceiptJob

PARSE_JOB_TYPE = "parse"
PARSE_JOB_ACTIVE_STATUSES = {"queued", "preprocessing", "ocr_running", "extracting"}
PARSE_JOB_TERMINAL_STATUSES = {"ready_for_review", "failed"}
PARSE_JOB_ALL_STATUSES = PARSE_JOB_ACTIVE_STATUSES | PARSE_JOB_TERMINAL_STATUSES


def utc_now() -> datetime:
    return datetime.now(UTC)


def get_latest_parse_job_query(receipt_id: UUID) -> Select[tuple[ReceiptJob]]:
    return (
        select(ReceiptJob)
        .where(ReceiptJob.receipt_id == receipt_id, ReceiptJob.job_type == PARSE_JOB_TYPE)
        .order_by(ReceiptJob.created_at.desc())
    )


def get_latest_parse_job(db: Session, receipt_id: UUID) -> ReceiptJob | None:
    return db.execute(get_latest_parse_job_query(receipt_id).limit(1)).scalar_one_or_none()


def get_active_parse_job(receipt: Receipt) -> ReceiptJob | None:
    for job in receipt.jobs:
        if job.job_type == PARSE_JOB_TYPE:
            return job
    return None


def has_completed_parse(receipt: Receipt, latest_job: ReceiptJob | None) -> bool:
    return bool(
        latest_job is not None
        and latest_job.status == "ready_for_review"
        and receipt.ocr_result is not None
        and receipt.extraction is not None
    )


def enqueue_parse_job(db: Session, receipt: Receipt, *, force: bool = False) -> tuple[ReceiptJob, bool]:
    latest_job = get_latest_parse_job(db, receipt.id)
    now = utc_now()

    if latest_job is not None and latest_job.status in PARSE_JOB_ACTIVE_STATUSES:
        return latest_job, False

    if not force and has_completed_parse(receipt, latest_job):
        return latest_job, False

    job = ReceiptJob(
        receipt_id=receipt.id,
        job_type=PARSE_JOB_TYPE,
        status="queued",
        created_at=now,
    )
    db.add(job)
    receipt.status = "queued"
    receipt.updated_at = now
    db.flush()
    return job, True


def claim_next_parse_job(db: Session) -> ReceiptJob | None:
    job = db.execute(
        select(ReceiptJob)
        .where(ReceiptJob.job_type == PARSE_JOB_TYPE, ReceiptJob.status == "queued")
        .order_by(ReceiptJob.created_at.asc())
        .with_for_update(skip_locked=True)
        .limit(1)
    ).scalar_one_or_none()

    if job is None:
        return None

    now = utc_now()
    job.status = "preprocessing"
    job.started_at = now
    job.finished_at = None
    job.error_message = None
    job.receipt.status = "processing"
    job.receipt.updated_at = now
    db.commit()
    db.refresh(job)
    return job
