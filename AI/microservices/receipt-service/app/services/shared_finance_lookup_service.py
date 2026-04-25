from __future__ import annotations

from typing import Any

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session


def resolve_shared_user_id(db: Session, *, email: str) -> int:
    row = db.execute(
        text(
            """
            SELECT id
            FROM public.users
            WHERE email = :email
            LIMIT 1
            """
        ),
        {"email": email},
    ).mappings().first()
    if row is None:
        raise HTTPException(status_code=403, detail="Authenticated user does not exist in the shared finance database")
    return int(row["id"])


def ensure_default_wallet(db: Session, *, user_id: int) -> None:
    existing_wallet = db.execute(
        text(
            """
            SELECT id, is_default
            FROM public.wallets
            WHERE user_id = :user_id
            ORDER BY is_default DESC, created_at ASC, id ASC
            LIMIT 1
            """
        ),
        {"user_id": user_id},
    ).mappings().first()

    if existing_wallet is None:
        db.execute(
            text(
                """
                INSERT INTO public.wallets (user_id, name, wallet_type, currency, balance, is_default)
                VALUES (:user_id, 'Default Wallet', 'cash', 'VND', 0, TRUE)
                """
            ),
            {"user_id": user_id},
        )
        db.commit()
        return

    if not bool(existing_wallet["is_default"]):
        db.execute(
            text(
                """
                UPDATE public.wallets
                SET is_default = TRUE, updated_at = NOW()
                WHERE id = :wallet_id
                """
            ),
            {"wallet_id": existing_wallet["id"]},
        )
        db.commit()


def get_allowed_categories(db: Session, *, user_id: int, transaction_type: str = "EXPENSE") -> list[dict[str, Any]]:
    rows = db.execute(
        text(
            """
            SELECT id, name, type, user_id, is_default
            FROM public.categories
            WHERE type = :category_type
              AND (user_id = :user_id OR user_id IS NULL)
            ORDER BY CASE WHEN user_id = :user_id THEN 0 ELSE 1 END, name ASC
            """
        ),
        {"user_id": user_id, "category_type": transaction_type.lower()},
    ).mappings().all()
    return [
        {
            "id": str(row["id"]),
            "name": row["name"],
            "type": str(row["type"]).upper(),
            "user_id": row["user_id"],
            "is_default": bool(row["is_default"]) if row["is_default"] is not None else False,
        }
        for row in rows
    ]


def get_wallet_suggestions(db: Session, *, user_id: int) -> list[dict[str, Any]]:
    ensure_default_wallet(db, user_id=user_id)
    rows = db.execute(
        text(
            """
            SELECT id, name, currency, balance, is_default
            FROM public.wallets
            WHERE user_id = :user_id
            ORDER BY is_default DESC, created_at ASC, id ASC
            """
        ),
        {"user_id": user_id},
    ).mappings().all()
    return [
        {
            "id": str(row["id"]),
            "name": row["name"],
            "currency": row["currency"],
            "balance": float(row["balance"]) if row["balance"] is not None else 0.0,
            "is_default": bool(row["is_default"]),
        }
        for row in rows
    ]


def get_default_wallet_id(db: Session, *, user_id: int) -> str | None:
    wallets = get_wallet_suggestions(db, user_id=user_id)
    return wallets[0]["id"] if wallets else None


def get_transaction_by_receipt_id(db: Session, *, receipt_id: int) -> dict[str, Any] | None:
    row = db.execute(
        text(
            """
            SELECT id, wallet_id, category_id, merchant_name, description, date, source_type, source_ref_id
            FROM public.transactions
            WHERE receipt_id = :receipt_id
            ORDER BY created_at DESC, id DESC
            LIMIT 1
            """
        ),
        {"receipt_id": receipt_id},
    ).mappings().first()
    if row is None:
        return None
    return {
        "id": str(row["id"]),
        "wallet_id": str(row["wallet_id"]) if row["wallet_id"] is not None else None,
        "category_id": str(row["category_id"]) if row["category_id"] is not None else None,
        "merchant_name": row["merchant_name"],
        "description": row["description"],
        "transaction_date": row["date"].isoformat() if row["date"] is not None else None,
        "source_type": row["source_type"],
        "source_ref_id": row["source_ref_id"],
    }
