from __future__ import annotations

from sqlalchemy import text
from sqlalchemy.engine import Engine

RECEIPT_ALLOWED_STATUSES = (
    "uploaded",
    "queued",
    "processing",
    "preprocessing",
    "ocr_running",
    "extracting",
    "ready_for_review",
    "parsed",
    "reviewed",
    "confirmed",
    "failed",
)

RECEIPT_JOB_ALLOWED_TYPES = (
    "parse",
    "ocr",
    "extract",
    "classify",
)

RECEIPT_JOB_ALLOWED_STATUSES = (
    "queued",
    "running",
    "preprocessing",
    "ocr_running",
    "extracting",
    "ready_for_review",
    "success",
    "failed",
)


def _quoted_list(values: tuple[str, ...]) -> str:
    return ", ".join(f"'{value}'" for value in values)


def ensure_runtime_schema(engine: Engine) -> None:
    receipt_statuses = _quoted_list(RECEIPT_ALLOWED_STATUSES)
    job_types = _quoted_list(RECEIPT_JOB_ALLOWED_TYPES)
    job_statuses = _quoted_list(RECEIPT_JOB_ALLOWED_STATUSES)

    statements = (
        "ALTER TABLE receipts DROP CONSTRAINT IF EXISTS chk_receipt_status",
        f"""
        ALTER TABLE receipts
        ADD CONSTRAINT chk_receipt_status
        CHECK (status IN ({receipt_statuses}))
        """,
        "ALTER TABLE receipt_jobs DROP CONSTRAINT IF EXISTS chk_job_type",
        f"""
        ALTER TABLE receipt_jobs
        ADD CONSTRAINT chk_job_type
        CHECK (job_type IN ({job_types}))
        """,
        "ALTER TABLE receipt_jobs DROP CONSTRAINT IF EXISTS chk_job_status",
        f"""
        ALTER TABLE receipt_jobs
        ADD CONSTRAINT chk_job_status
        CHECK (status IN ({job_statuses}))
        """,
    )

    with engine.begin() as conn:
        for statement in statements:
            conn.execute(text(statement))
