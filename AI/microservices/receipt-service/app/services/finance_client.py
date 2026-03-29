from datetime import datetime

import requests
from fastapi import HTTPException

from app.core.config import settings


def create_finance_transaction(
    wallet_id: str,
    category_id: str,
    transaction_type: str,
    amount: float,
    description: str | None,
    merchant_name: str | None,
    transaction_date: datetime,
) -> dict[str, str | None]:
    try:
        response = requests.post(
            f"{settings.finance_service_url}/transactions",
            json={
                "walletId": wallet_id,
                "categoryId": category_id,
                "type": transaction_type,
                "amount": amount,
                "description": description,
                "merchantName": merchant_name,
                "transactionDate": transaction_date.isoformat(),
                "source": "receipt",
            },
            timeout=10,
        )
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail="Finance service is unavailable") from exc

    if response.status_code >= 400:
        try:
            payload = response.json()
        except ValueError:
            payload = None

        detail = "Finance service rejected the receipt confirmation"
        if isinstance(payload, dict):
            detail = str(payload.get("message") or payload.get("detail") or detail)

        raise HTTPException(status_code=response.status_code, detail=detail)

    payload = response.json()
    return {
        "id": str(payload["id"]),
        "warning": str(payload["warning"]) if payload.get("warning") else None,
    }
