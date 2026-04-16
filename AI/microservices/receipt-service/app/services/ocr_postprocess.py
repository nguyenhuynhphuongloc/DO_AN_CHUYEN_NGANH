from __future__ import annotations

import re

_STRONG_NORMALIZATIONS: tuple[tuple[re.Pattern[str], str], ...] = (
    (re.compile(r"\bhoa\s+don\b", re.I), "hóa đơn"),
    (re.compile(r"\bhoa\s+đon\b", re.I), "hóa đơn"),
    (re.compile(r"\bthanh\s+toan\b", re.I), "thanh toán"),
    (re.compile(r"\bcam\s+on\b", re.I), "cảm ơn"),
    (re.compile(r"\bcåm\s+on\b", re.I), "cảm ơn"),
    (re.compile(r"\bhen\s+gp\s+lai\b", re.I), "hẹn gặp lại"),
    (re.compile(r"\bhen\s+gap\s+lai\b", re.I), "hẹn gặp lại"),
    (re.compile(r"\bthu\s+ngan\b", re.I), "thu ngân"),
    (re.compile(r"\bgio\b", re.I), "giờ"),
)


def _replace_case_sensitive(source: str, target: str) -> str:
    if source.isupper():
        return target.upper()
    if source.istitle():
        return target.title()
    return target


def _apply_strong_rules(line: str) -> tuple[str, bool]:
    updated = line
    changed = False
    for pattern, replacement in _STRONG_NORMALIZATIONS:
        def _mapper(match: re.Match[str]) -> str:
            nonlocal changed
            changed = True
            return _replace_case_sensitive(match.group(0), replacement)

        updated = pattern.sub(_mapper, updated)
    return updated, changed


def estimate_low_quality(line: str) -> bool:
    folded = line.casefold()
    mojibake_tokens = ("å", "Ã", "Ä‘", "â‚", "�")
    if any(token in line for token in mojibake_tokens):
        return True
    if any(term in folded for term in ("hoa don", "thanh toan", "cam on", "hen gap lai", "gio", "thu ngan")):
        return True
    return False


def normalize_vietnamese_lines(lines: list[str], confidences: list[float]) -> tuple[list[str], dict]:
    corrected_lines: list[str] = []
    applied_rules: list[str] = []
    low_quality_count = 0
    changed_count = 0

    for line in lines:
        low_quality = estimate_low_quality(line)
        if low_quality:
            low_quality_count += 1
        fixed, changed = _apply_strong_rules(line)
        if changed:
            changed_count += 1
            applied_rules.append(line)
        corrected_lines.append(fixed)

    low_quality_ratio = (low_quality_count / len(lines)) if lines else 0.0
    average_confidence = (sum(confidences) / len(confidences)) if confidences else 0.0

    metadata = {
        "postprocess_changed_lines": changed_count,
        "postprocess_low_quality_ratio": round(low_quality_ratio, 4),
        "postprocess_applied_examples": applied_rules[:8],
        "postprocess_average_confidence": round(average_confidence, 4),
        "likely_diacritic_loss": low_quality_ratio >= 0.35,
    }

    return corrected_lines, metadata
