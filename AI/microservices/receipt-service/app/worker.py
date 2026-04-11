from __future__ import annotations

import logging
import time

from app.core.config import settings
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models import Receipt, ReceiptExtraction, ReceiptFeedback, ReceiptJob, ReceiptOcrResult  # noqa: F401
from app.services.parse_pipeline import process_parse_job
from app.services.receipt_queue import claim_next_parse_job

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger(__name__)


def run_worker() -> None:
    Base.metadata.create_all(bind=engine)
    logger.info(
        "Starting receipt worker with poll interval %.2fs",
        settings.worker_poll_interval_seconds,
    )

    while True:
        processed_any = False
        for _ in range(settings.worker_batch_size):
            with SessionLocal() as db:
                job = claim_next_parse_job(db)
                if job is None:
                    break
                processed_any = True
                logger.info("Claimed parse job %s for receipt %s", job.id, job.receipt_id)
                process_parse_job(db, job.id)

        if not processed_any:
            time.sleep(settings.worker_poll_interval_seconds)


if __name__ == "__main__":
    run_worker()
