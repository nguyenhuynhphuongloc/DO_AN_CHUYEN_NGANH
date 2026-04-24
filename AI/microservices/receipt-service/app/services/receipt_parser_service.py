from __future__ import annotations

import logging
import time
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any, Protocol

from app.core.config import settings

try:
    from veryfi import Client as VeryfiClient
    from veryfi.errors import BadRequest, ResourceNotFound, UnauthorizedAccessToken, VeryfiClientError
except ImportError:  # pragma: no cover - optional until dependency is installed in runtime
    VeryfiClient = None  # type: ignore[assignment]
    VeryfiClientError = Exception  # type: ignore[assignment]
    UnauthorizedAccessToken = Exception  # type: ignore[assignment]
    BadRequest = Exception  # type: ignore[assignment]
    ResourceNotFound = Exception  # type: ignore[assignment]

logger = logging.getLogger(__name__)


class ReceiptParserError(RuntimeError):
    """Base error raised when the configured receipt parser fails."""


class ReceiptParserConfigurationError(ReceiptParserError):
    """Raised when parser configuration is incomplete or invalid."""


class ReceiptParserAuthenticationError(ReceiptParserError):
    """Raised when provider credentials are rejected."""


@dataclass(slots=True)
class ReceiptParserResult:
    provider: str
    raw_text: str
    document: dict[str, Any]
    runtime: dict[str, Any]


class ReceiptParser(Protocol):
    def validate_runtime(self) -> dict[str, Any]: ...

    def parse_document(self, image_path: str, *, external_id: str | None = None) -> ReceiptParserResult: ...


def _coerce_dict(value: Any) -> dict[str, Any]:
    return dict(value) if isinstance(value, dict) else {}


class VeryfiReceiptParser:
    provider_name = "veryfi"

    def __init__(self) -> None:
        self._client: VeryfiClient | None = None

    @staticmethod
    def _missing_config_fields() -> list[str]:
        missing: list[str] = []
        for field_name in ("veryfi_client_id", "veryfi_client_secret", "veryfi_username", "veryfi_api_key"):
            if not getattr(settings, field_name, ""):
                missing.append(field_name)
        return missing

    def validate_runtime(self) -> dict[str, Any]:
        missing = self._missing_config_fields()
        runtime = {
            "provider": self.provider_name,
            "configured": not missing,
            "missing_fields": missing,
            "base_url": settings.veryfi_base_url,
            "api_version": settings.veryfi_api_version,
            "timeout_seconds": settings.veryfi_timeout_seconds,
            "max_retries": settings.veryfi_max_retries,
            "debug_include_provider_payload": settings.receipt_parser_debug_include_provider_payload,
        }
        if VeryfiClient is None:
            runtime["sdk_ready"] = False
            runtime["sdk_error"] = "veryfi package is not installed"
            raise ReceiptParserConfigurationError("Veryfi SDK is not installed. Install the 'veryfi' package.")
        runtime["sdk_ready"] = True
        if missing:
            raise ReceiptParserConfigurationError(
                f"Veryfi parser is not fully configured. Missing: {', '.join(missing)}"
            )
        return runtime

    def _get_client(self) -> VeryfiClient:
        self.validate_runtime()
        if self._client is None:
            assert VeryfiClient is not None
            self._client = VeryfiClient(
                client_id=settings.veryfi_client_id,
                client_secret=settings.veryfi_client_secret,
                username=settings.veryfi_username,
                api_key=settings.veryfi_api_key,
                base_url=settings.veryfi_base_url,
                api_version=settings.veryfi_api_version,
                timeout=settings.veryfi_timeout_seconds,
            )
        return self._client

    def parse_document(self, image_path: str, *, external_id: str | None = None) -> ReceiptParserResult:
        candidate = Path(image_path)
        if not candidate.exists() or not candidate.is_file():
            raise ReceiptParserError("Receipt image is missing or unreadable for Veryfi parsing")

        runtime = self.validate_runtime()
        parse_start = time.perf_counter()
        last_error: Exception | None = None
        attempt_count = max(settings.veryfi_max_retries, 0) + 1

        for attempt in range(1, attempt_count + 1):
            try:
                document = _coerce_dict(
                    self._get_client().process_document(
                        file_path=str(candidate),
                        external_id=external_id or candidate.stem,
                    )
                )
                elapsed = time.perf_counter() - parse_start
                runtime.update(
                    {
                        "attempt": attempt,
                        "parser_seconds": round(elapsed, 4),
                        "document_id": document.get("id"),
                        "document_type": document.get("document_type"),
                    }
                )
                raw_text = str(document.get("ocr_text") or "").strip()
                logger.info(
                    "Veryfi parse completed attempt=%s document_id=%s type=%s seconds=%.4f",
                    attempt,
                    document.get("id"),
                    document.get("document_type"),
                    elapsed,
                )
                return ReceiptParserResult(
                    provider=self.provider_name,
                    raw_text=raw_text,
                    document=document,
                    runtime=runtime,
                )
            except UnauthorizedAccessToken as exc:
                raise ReceiptParserAuthenticationError("Veryfi credentials were rejected") from exc
            except (BadRequest, ResourceNotFound) as exc:
                raise ReceiptParserError(str(exc) or "Veryfi rejected the document request") from exc
            except VeryfiClientError as exc:
                last_error = exc
                logger.warning("Veryfi parser attempt %s/%s failed: %s", attempt, attempt_count, exc)
                if attempt >= attempt_count:
                    break
            except Exception as exc:  # pragma: no cover - defensive provider wrapper
                last_error = exc
                logger.warning("Unexpected Veryfi parser failure attempt %s/%s: %s", attempt, attempt_count, exc)
                if attempt >= attempt_count:
                    break

        raise ReceiptParserError(str(last_error) or "Veryfi parsing failed")


class ReceiptParserService:
    def __init__(self) -> None:
        provider_name = (settings.receipt_parser_provider or "veryfi").strip().lower()
        if provider_name != "veryfi":
            raise ReceiptParserConfigurationError(
                f"Unsupported receipt parser provider '{provider_name}'. Only 'veryfi' is supported."
            )
        self._provider: ReceiptParser = VeryfiReceiptParser()

    def validate_runtime(self) -> dict[str, Any]:
        return self._provider.validate_runtime()

    def parse_document(self, image_path: str, *, external_id: str | None = None) -> ReceiptParserResult:
        return self._provider.parse_document(image_path, external_id=external_id)


@lru_cache(maxsize=1)
def get_receipt_parser_service() -> ReceiptParserService:
    return ReceiptParserService()
