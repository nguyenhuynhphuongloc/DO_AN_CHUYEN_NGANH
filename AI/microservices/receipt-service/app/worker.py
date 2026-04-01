from __future__ import annotations

import logging
import time

from app.core.config import settings
from app.db.base import Base
from app.db.runtime_schema import ensure_runtime_schema
from app.db.session import SessionLocal, engine
from app.models import Receipt, ReceiptExtraction, ReceiptFeedback, ReceiptJob, ReceiptOcrResult  # noqa: F401
from app.services.ocr_service import get_ocr_service
from app.services.receipt_processing import claim_next_parse_job, mark_parse_job_failed, mark_stale_parse_jobs, process_parse_job

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger(__name__)


def main() -> None:
    Base.metadata.create_all(bind=engine)
    ensure_runtime_schema(engine)
    logger.info("Starting receipt worker")
    ocr_service = None

    while True:
        with SessionLocal() as db:
            recovered = mark_stale_parse_jobs(db, settings.receipt_job_stale_seconds)
            if recovered:
                logger.warning("Marked %s stale parse job(s) as failed", recovered)
            job = claim_next_parse_job(db)

        if job is None:
            time.sleep(settings.receipt_worker_poll_seconds)
            continue

        if ocr_service is None:
            ocr_service = get_ocr_service()

        logger.info("Processing queued receipt parse job %s for receipt %s", job.id, job.receipt_id)
        try:
            with SessionLocal() as db:
                process_parse_job(db, job.id, ocr_service)
        except Exception as exc:  # pragma: no cover - integration path
            logger.exception("Receipt parse job %s failed", job.id)
            with SessionLocal() as db:
                mark_parse_job_failed(db, job.id, str(exc) or "Receipt OCR failed")


if __name__ == "__main__":
    main()
