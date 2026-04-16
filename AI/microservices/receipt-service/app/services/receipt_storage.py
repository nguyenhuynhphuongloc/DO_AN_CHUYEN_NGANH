from __future__ import annotations

import shutil
from pathlib import Path
from uuid import uuid4

from app.core.config import settings


def get_temp_upload_dir() -> Path:
    path = Path(settings.receipt_temp_upload_dir)
    path.mkdir(parents=True, exist_ok=True)
    return path


def get_permanent_upload_dir() -> Path:
    path = Path(settings.receipt_upload_dir)
    path.mkdir(parents=True, exist_ok=True)
    return path


def store_temp_upload(file_name: str | None, content: bytes) -> tuple[str, str]:
    extension = Path(file_name or "").suffix or ".bin"
    stored_file_name = f"{uuid4()}{extension}"
    destination = get_temp_upload_dir() / stored_file_name
    destination.write_bytes(content)
    return stored_file_name, str(destination)


def promote_temp_upload(temp_path: str, file_name: str | None = None) -> str:
    source = Path(temp_path)
    if not source.exists():
        raise FileNotFoundError("Temporary receipt image is missing")

    extension = source.suffix or Path(file_name or "").suffix or ".bin"
    destination = get_permanent_upload_dir() / f"{uuid4()}{extension}"
    if settings.receipt_session_retain_confirmed_image:
        shutil.copy2(source, destination)
    else:
        shutil.move(str(source), str(destination))
    return str(destination)


def delete_file_quietly(path: str | None) -> None:
    if not path:
        return
    candidate = Path(path)
    try:
        if candidate.exists():
            candidate.unlink()
    except OSError:
        return
