from __future__ import annotations

import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .config import settings
from .errors import ReceiptAuthenticationError, ReceiptConfigurationError, ReceiptParserError

try:
    from veryfi import Client as VeryfiClient
    from veryfi.errors import BadRequest, ResourceNotFound, UnauthorizedAccessToken, VeryfiClientError
except ImportError:  # pragma: no cover
    VeryfiClient = None  # type: ignore[assignment]
    VeryfiClientError = Exception  # type: ignore[assignment]
    UnauthorizedAccessToken = Exception  # type: ignore[assignment]
    BadRequest = Exception  # type: ignore[assignment]
    ResourceNotFound = Exception  # type: ignore[assignment]


@dataclass(slots=True)
class ReceiptParserResult:
    provider: str
    raw_text: str
    document: dict[str, Any]
    runtime: dict[str, Any]


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
        }
        if VeryfiClient is None:
            raise ReceiptConfigurationError("Veryfi SDK is not installed. Install the 'veryfi' package.")
        if missing:
            raise ReceiptConfigurationError(
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
                return ReceiptParserResult(
                    provider=self.provider_name,
                    raw_text=raw_text,
                    document=document,
                    runtime=runtime,
                )
            except UnauthorizedAccessToken as exc:
                raise ReceiptAuthenticationError("Veryfi credentials were rejected") from exc
            except (BadRequest, ResourceNotFound) as exc:
                raise ReceiptParserError(str(exc) or "Veryfi rejected the document request") from exc
            except VeryfiClientError as exc:
                last_error = exc
                if attempt >= attempt_count:
                    break
            except Exception as exc:  # pragma: no cover
                last_error = exc
                if attempt >= attempt_count:
                    break

        raise ReceiptParserError(str(last_error) or "Veryfi parsing failed")
