from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any

from app.core.config import settings

try:
    import requests
except ImportError:  # pragma: no cover - optional in stripped local test env
    requests = None  # type: ignore[assignment]


class ReceiptCategoryResolutionError(RuntimeError):
    """Raised when Groq-backed category resolution fails."""


@dataclass(slots=True)
class CategoryCandidate:
    id: str
    name: str
    type: str


def _clean_text(value: Any) -> str | None:
    if value in (None, ""):
        return None
    normalized = str(value).strip()
    return normalized or None


def _normalize_candidates(categories: list[dict[str, Any]]) -> list[CategoryCandidate]:
    normalized: list[CategoryCandidate] = []
    for entry in categories:
        category_id = _clean_text(entry.get("id"))
        name = _clean_text(entry.get("name"))
        category_type = _clean_text(entry.get("type"))
        if category_id and name and category_type:
            normalized.append(CategoryCandidate(id=category_id, name=name, type=category_type.upper()))
    return normalized


def _build_category_schema(candidates: list[CategoryCandidate]) -> dict[str, Any]:
    return {
        "type": "json_schema",
        "json_schema": {
            "name": "receipt_category_suggestion",
            "strict": True,
            "schema": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "category_id": {"type": ["string", "null"], "enum": [candidate.id for candidate in candidates] + [None]},
                    "category_name": {
                        "type": ["string", "null"],
                        "enum": [candidate.name for candidate in candidates] + [None],
                    },
                    "reason": {"type": "string"},
                },
                "required": ["category_id", "category_name", "reason"],
            },
        },
    }


class ReceiptCategoryResolutionService:
    def validate_runtime(self) -> dict[str, Any]:
        configured = bool(settings.groq_api_key and settings.groq_category_resolution_enabled)
        return {
            "enabled": settings.groq_category_resolution_enabled,
            "configured": configured,
            "base_url": settings.groq_base_url,
            "model": settings.groq_model,
            "timeout_seconds": settings.groq_timeout_seconds,
        }

    def resolve_category(
        self,
        *,
        normalized_receipt: dict[str, Any],
        categories: list[dict[str, Any]],
    ) -> dict[str, str | None] | None:
        candidates = _normalize_candidates(categories)
        if not settings.groq_category_resolution_enabled or not settings.groq_api_key or not candidates:
            return None
        if requests is None:
            raise ReceiptCategoryResolutionError("The 'requests' package is required for Groq category resolution")

        payload = {
            "model": settings.groq_model,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You classify personal-finance receipt data. "
                        "Choose exactly one allowed category from the provided list, "
                        "or return null if the receipt is ambiguous."
                    ),
                },
                {
                    "role": "user",
                    "content": json.dumps(
                        {
                            "receipt": normalized_receipt,
                            "allowed_categories": [candidate.__dict__ for candidate in candidates],
                        },
                        ensure_ascii=False,
                    ),
                },
            ],
            "response_format": _build_category_schema(candidates),
        }

        try:
            response = requests.post(
                f"{settings.groq_base_url.rstrip('/')}/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.groq_api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
                timeout=settings.groq_timeout_seconds,
            )
        except requests.RequestException as exc:
            raise ReceiptCategoryResolutionError("Groq category resolution request failed") from exc

        if response.status_code >= 400:
            raise ReceiptCategoryResolutionError(
                f"Groq category resolution failed with status {response.status_code}: {response.text}"
            )

        try:
            content = response.json()["choices"][0]["message"]["content"]
            suggestion = json.loads(content)
        except (KeyError, IndexError, TypeError, ValueError) as exc:
            raise ReceiptCategoryResolutionError("Groq category resolution returned malformed content") from exc

        category_id = _clean_text(suggestion.get("category_id"))
        category_name = _clean_text(suggestion.get("category_name"))
        reason = _clean_text(suggestion.get("reason")) or "model_suggestion"

        valid_ids = {candidate.id for candidate in candidates}
        valid_names = {candidate.name for candidate in candidates}
        if category_id and category_id not in valid_ids:
            raise ReceiptCategoryResolutionError("Groq returned a category_id outside the allowed category set")
        if category_name and category_name not in valid_names:
            raise ReceiptCategoryResolutionError("Groq returned a category_name outside the allowed category set")

        return {
            "category_id": category_id,
            "category_name": category_name,
            "reason": reason,
        }
