from datetime import datetime


def parse_receipt_placeholder(file_name: str) -> dict[str, str | float]:
    normalized = file_name.rsplit(".", 1)[0].replace("_", " ").replace("-", " ").strip() or "Sample Store"
    return {
        "merchant_name": normalized.title(),
        "transaction_date": datetime.utcnow().isoformat(),
        "total_amount": 125000.0,
    }
