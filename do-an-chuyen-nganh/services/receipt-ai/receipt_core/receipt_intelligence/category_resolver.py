from __future__ import annotations

import json
import re
import unicodedata
from dataclasses import dataclass
from typing import Any

import httpx

from .config import settings
from .errors import ReceiptCategoryResolutionError

DEBUG = True


def _log(prefix: str, data: Any) -> None:
    if DEBUG:
        try:
            print(f"[CategoryResolver] {prefix}: {json.dumps(data, ensure_ascii=False, indent=2)}")
        except Exception:
            print(f"[CategoryResolver] {prefix}: {data}")


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
            normalized.append(CategoryCandidate(id=category_id, name=name, type=category_type))
    return normalized


def _normalize_lookup_text(value: Any) -> str:
    if value in (None, ""):
        return ""
    text = unicodedata.normalize("NFKD", str(value).lower())
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    text = text.replace("đ", "d")
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9]+", " ", text)).strip()


def _receipt_search_text(normalized_receipt: dict[str, Any]) -> str:
    fields = normalized_receipt.get("fields") or {}
    summary = normalized_receipt.get("receipt_summary") or {}
    items = normalized_receipt.get("items") or summary.get("line_items") or []
    values: list[str] = []
    for key in ("merchant_name", "provider_category", "payment_method"):
        values.append(str(fields.get(key) or ""))
        values.append(str(summary.get(key) or ""))
    for item in items:
        if isinstance(item, dict):
            values.append(str(item.get("name") or ""))
    return _normalize_lookup_text(" ".join(values))


CATEGORY_ALIASES: dict[str, list[str]] = {
    "Ăn uống": [
        "an uong",
        "food",
        "drink",
        "restaurant",
        "cafe",
        "coffee",
        "family mart",
        "circle k",
        "gs25",
        "winmart",
        "ministop",
        "bach hoa xanh",
        "sieu thi",
        "mart",
        "com",
        "pho",
        "bun",
        "banh mi",
        "tra sua",
        "grabfood",
        "shopeefood",
        "baemin",
        "gojek",
        "foodpanda",
        "cong hoa",
    ],
    "Mua sắm": ["mua sam", "shopping", "shop", "shopee", "lazada", "tiki", "quan ao", "giay dep", "thoi trang", "quan", "ao", "dep", "the gioi di dong", "dien may xanh", "mediamart"],
    "Di chuyển": ["di chuyen", "transport", "grab", "taxi", "bus", "gojek", "be", "xang", "fuel", "parking", "xe", "oto", "may bay", "tau hoa", "xe buyt"],
    "Hóa đơn": ["hoa don", "bill", "electric", "water", "internet", "wifi", "dien", "nuoc", "viettel", "fpt", "vnpt"],
    "Nhà cửa": ["nha cua", "rent", "thue nha", "gas", "noi that", "gia dung", "tien nha", "thue nha"],
    "Sức khỏe": ["suc khoe", "pharmacy", "nha thuoc", "thuoc", "benh vien", "clinic", "kham", "doctor", "bao hiem", "vien", "phong kham"],
    "Giải trí": ["giai tri", "movie", "cinema", "netflix", "spotify", "game", "rap phim", "phim", "karaoke", "spotify", "youtube premium"],
    "Giáo dục": ["giao duc", "education", "school", "university", "sach", "book", "hoc phi", "sach", "ielts", "toeic"],
}


def _candidate_matches_name(candidate: CategoryCandidate, target_name: str) -> bool:
    candidate_name = _normalize_lookup_text(candidate.name)
    target = _normalize_lookup_text(target_name)
    return candidate_name == target or target in candidate_name or candidate_name in target


def _fallback_category(
    *,
    normalized_receipt: dict[str, Any],
    candidates: list[CategoryCandidate],
    reason: str = "keyword_fallback",
) -> dict[str, Any] | None:
    search_text = _receipt_search_text(normalized_receipt)
    _log("Fallback search_text", search_text)

    if not search_text:
        _log("Fallback", "No search text extracted, returning None")
        return None

    for category_name, aliases in CATEGORY_ALIASES.items():
        if not any(alias in search_text for alias in aliases):
            continue
        for candidate in candidates:
            if _candidate_matches_name(candidate, category_name):
                result = {
                    "category_id": candidate.id,
                    "category_name": candidate.name,
                    "reason": reason,
                    "confidence": 0.85,
                    "needs_review": False,
                }
                _log("Fallback matched", result)
                return result

    _log("Fallback", "No keyword match found")
    return None


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
                    "category_id": {
                        "type": ["string", "null"],
                        "enum": [candidate.id for candidate in candidates] + [None],
                    },
                    "category_name": {
                        "type": ["string", "null"],
                        "enum": [candidate.name for candidate in candidates] + [None],
                    },
                    "reason": {"type": "string"},
                    "confidence": {"type": "number", "minimum": 0.0, "maximum": 1.0},
                    "needs_review": {"type": "boolean"},
                },
                "required": ["category_id", "category_name", "reason", "confidence", "needs_review"],
            },
        },
    }


class ReceiptCategoryResolutionService:
    def resolve_category(
        self,
        *,
        normalized_receipt: dict[str, Any],
        categories: list[dict[str, Any]],
    ) -> dict[str, Any] | None:
        candidates = _normalize_candidates(categories)
        _log("Input categories", [{"id": c.id, "name": c.name, "type": c.type} for c in candidates])
        _log("Normalized receipt fields", normalized_receipt.get("fields"))

        if not candidates:
            _log("resolve_category", "No candidates, returning None")
            return None

        # 1. Try keyword fallback first (fastest, deterministic)
        fallback_suggestion = _fallback_category(
            normalized_receipt=normalized_receipt,
            candidates=candidates,
            reason="keyword_fallback",
        )

        if not settings.groq_category_resolution_enabled or not settings.groq_api_key:
            _log("resolve_category", "Groq disabled, using fallback")
            return fallback_suggestion

        # 2. Build Vietnamese prompt for Groq
        merchant_name = (
            normalized_receipt.get("fields", {}).get("merchant_name")
            or normalized_receipt.get("receipt_summary", {}).get("merchant_name")
            or ""
        )
        total_amount = (
            normalized_receipt.get("fields", {}).get("total_amount")
            or normalized_receipt.get("receipt_summary", {}).get("total_amount")
        )
        items_text = ""
        items = normalized_receipt.get("items") or []
        if items:
            item_names = [str(i.get("name", "")) for i in items if i.get("name")]
            items_text = " | Items: " + " | ".join(item_names)

        system_prompt = (
            "Bạn là chuyên gia phân loại hóa đơn tài chính cá nhân tiếng Việt.\n"
            "Nhiệm vụ: chọn ĐÚNG MỘT danh mục phù hợp nhất từ danh sách cho phép.\n\n"
            "QUY TẮC PHÂN LOẠI:\n"
            "1. Cửa hàng tiện lợi (Family Mart, Circle K, GS25, WinMart, Bách Hóa Xanh, ...) "
            "→ ưu tiên 'Ăn uống' nếu có, hoặc 'Mua sắm'.\n"
            "2. Quán ăn, nhà hàng, cafe, trà sữa → 'Ăn uống'.\n"
            "3. Mua quần áo, giày dép, túi xách, shopee, lazada, tiki → 'Mua sắm'.\n"
            "4. Grab, taxi, xăng, xe buýt, máy bay → 'Di chuyển'.\n"
            "5. Tiền điện, nước, internet, wifi, điện thoại → 'Hóa đơn'.\n"
            "6. Khám bệnh, mua thuốc, bệnh viện → 'Sức khỏe'.\n"
            "7. Xem phim, netflix, game, karaoke → 'Giải trí'.\n"
            "8. Sách, học phí, khóa học → 'Giáo dục'.\n"
            "9. THUÊ NHÀ, mua đồ nội thất → 'Nhà cửa'.\n"
            "10. Nếu không chắc chắn → đặt needs_review = true và chọn danh mục gần đúng nhất.\n"
            "11. TUYỆT ĐỐI KHÔNG tự tạo danh mục mới ngoài danh sách cho phép.\n"
            "12. Trả lời BẰNG TIẾNG VIỆT CÓ DẤU cho reason.\n\n"
            "confidence: 0.0-0.4 = không chắc, cần review; 0.5-0.7 = khá chắc; 0.8-1.0 = rất chắc.\n"
            "needs_review: true nếu nghi ngờ, false nếu chắc chắn."
        )

        user_prompt = (
            f"Hóa đơn từ: {merchant_name or 'Không rõ'}\n"
            f"Tổng tiền: {total_amount or 'Không rõ'} VND{items_text}\n\n"
            f"Danh sách danh mục cho phép:\n"
            + "\n".join(
                f"- {c.name} (id={c.id}, type={c.type})"
                for c in candidates
            )
        )

        payload = {
            "model": settings.groq_model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "response_format": _build_category_schema(candidates),
        }

        _log("Groq payload", payload)

        try:
            response = httpx.post(
                f"{settings.groq_base_url.rstrip('/')}/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.groq_api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
                timeout=settings.groq_timeout_seconds,
            )
        except httpx.HTTPError as exc:
            _log("Groq HTTP error, falling back", str(exc))
            if fallback_suggestion:
                return fallback_suggestion
            raise ReceiptCategoryResolutionError("Groq category resolution request failed") from exc

        if response.status_code >= 400:
            _log(f"Groq HTTP {response.status_code}, falling back", response.text[:200])
            if fallback_suggestion:
                return fallback_suggestion
            raise ReceiptCategoryResolutionError(
                f"Groq category resolution failed with status {response.status_code}: {response.text}"
            )

        try:
            content = response.json()["choices"][0]["message"]["content"]
            suggestion = json.loads(content)
            _log("Groq raw response", suggestion)
        except (KeyError, IndexError, TypeError, ValueError) as exc:
            _log("Groq malformed response, falling back", str(exc))
            if fallback_suggestion:
                return fallback_suggestion
            raise ReceiptCategoryResolutionError("Groq category resolution returned malformed content") from exc

        category_id = _clean_text(suggestion.get("category_id"))
        category_name = _clean_text(suggestion.get("category_name"))
        reason = _clean_text(suggestion.get("reason")) or "model_suggestion"
        confidence = suggestion.get("confidence", 0.5)
        needs_review = suggestion.get("needs_review", True)

        valid_ids = {candidate.id for candidate in candidates}
        valid_names = {candidate.name for candidate in candidates}

        if category_id and category_id not in valid_ids:
            _log("Groq invalid category_id, falling back", category_id)
            return fallback_suggestion
        if category_name and category_name not in valid_names:
            _log("Groq invalid category_name, falling back", category_name)
            return fallback_suggestion

        if not category_id or not category_name:
            _log("Groq returned null, using fallback")
            return fallback_suggestion

        result = {
            "category_id": category_id,
            "category_name": category_name,
            "reason": reason,
            "confidence": float(confidence),
            "needs_review": bool(needs_review),
        }
        _log("Final result", result)
        return result
