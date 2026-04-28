from __future__ import annotations

import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


def _get_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _get_int(name: str, default: int) -> int:
    value = os.getenv(name)
    if value is None:
        return default
    try:
        return int(value)
    except ValueError:
        return default


@dataclass(slots=True)
class ReceiptIntelligenceSettings:
    veryfi_client_id: str = os.getenv("VERYFI_CLIENT_ID", "")
    veryfi_client_secret: str = os.getenv("VERYFI_CLIENT_SECRET", "")
    veryfi_username: str = os.getenv("VERYFI_USERNAME", "")
    veryfi_api_key: str = os.getenv("VERYFI_API_KEY", "")
    veryfi_base_url: str = os.getenv("VERYFI_BASE_URL", "https://api.veryfi.com/api/")
    veryfi_api_version: str = os.getenv("VERYFI_API_VERSION", "v8")
    veryfi_timeout_seconds: int = _get_int("VERYFI_TIMEOUT_SECONDS", 30)
    veryfi_max_retries: int = _get_int("VERYFI_MAX_RETRIES", 2)
    groq_api_key: str = os.getenv("GROQ_API_KEY", "")
    groq_base_url: str = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")
    groq_model: str = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")
    groq_timeout_seconds: int = _get_int("GROQ_TIMEOUT_SECONDS", 20)
    groq_category_resolution_enabled: bool = _get_bool("GROQ_CATEGORY_RESOLUTION_ENABLED", True)
    receipt_preprocess_enabled: bool = _get_bool("RECEIPT_PREPROCESS_ENABLED", False)


settings = ReceiptIntelligenceSettings()
