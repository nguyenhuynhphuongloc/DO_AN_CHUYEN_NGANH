from __future__ import annotations

import logging
import time

from app.core.config import settings
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models import Receipt, ReceiptExtraction, ReceiptFeedback, ReceiptJob, ReceiptOcrResult, ReceiptParseJob, ReceiptParseSession  # noqa: F401
from app.services.parse_pipeline import process_parse_job, process_session_parse_job
from app.services.receipt_parser_service import get_receipt_parser_service
from app.services.receipt_queue import claim_next_parse_job, claim_next_session_parse_job
from app.services.session_finalize import cleanup_expired_parse_sessions

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger(__name__)


def run_worker() -> None:
    Base.metadata.create_all(bind=engine)
    get_receipt_parser_service().validate_runtime()
    logger.info(
        "Starting receipt worker with poll interval %.2fs",
        settings.worker_poll_interval_seconds,
    )

    while True:
        processed_any = False
        for _ in range(settings.worker_batch_size):
            with SessionLocal() as db:
                session_job = claim_next_session_parse_job(db)
                if session_job is not None:
                    processed_any = True
                    logger.info("Claimed parse session job %s for session %s", session_job.id, session_job.session_id)
                    process_session_parse_job(db, session_job.id)
                    continue

                job = claim_next_parse_job(db)
                if job is None:
                    break
                processed_any = True
                logger.info("Claimed parse job %s for receipt %s", job.id, job.receipt_id)
                process_parse_job(db, job.id)

        if not processed_any:
            with SessionLocal() as db:
                cleaned = cleanup_expired_parse_sessions(db)
                if cleaned:
                    logger.info("Cleaned %s expired parse sessions", cleaned)
            time.sleep(settings.worker_poll_interval_seconds)


if __name__ == "__main__":
    run_worker()
