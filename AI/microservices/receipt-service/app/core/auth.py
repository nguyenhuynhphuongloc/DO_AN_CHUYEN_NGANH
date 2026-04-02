import base64
import hashlib
import hmac
import json
import time
from dataclasses import dataclass
from uuid import UUID

from fastapi import Header, HTTPException

from app.core.config import settings


@dataclass
class AuthenticatedUser:
    user_id: UUID
    email: str
    role: str
    token: str


def _decode_base64url(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(f"{value}{padding}")


def _unauthorized(detail: str = "Unauthorized") -> HTTPException:
    return HTTPException(status_code=401, detail=detail)


def verify_access_token(token: str) -> AuthenticatedUser:
    parts = token.split(".")
    if len(parts) != 3:
        raise _unauthorized("Invalid access token")

    header_segment, payload_segment, signature_segment = parts

    try:
        header = json.loads(_decode_base64url(header_segment))
        payload = json.loads(_decode_base64url(payload_segment))
    except (ValueError, json.JSONDecodeError) as exc:
        raise _unauthorized("Invalid access token") from exc

    if header.get("alg") != "HS256":
        raise _unauthorized("Unsupported access token")

    signing_input = f"{header_segment}.{payload_segment}".encode("utf-8")
    expected_signature = hmac.new(
        settings.jwt_access_secret.encode("utf-8"),
        signing_input,
        hashlib.sha256,
    ).digest()

    try:
        provided_signature = _decode_base64url(signature_segment)
    except ValueError as exc:
        raise _unauthorized("Invalid access token") from exc

    if not hmac.compare_digest(expected_signature, provided_signature):
        raise _unauthorized("Invalid access token")

    now = int(time.time())
    if isinstance(payload.get("nbf"), int) and payload["nbf"] > now:
        raise _unauthorized("Access token is not active")
    if isinstance(payload.get("exp"), int) and payload["exp"] <= now:
        raise _unauthorized("Access token has expired")

    subject = payload.get("sub")
    email = payload.get("email")
    role = payload.get("role")
    if not isinstance(subject, str) or not isinstance(email, str) or not isinstance(role, str):
        raise _unauthorized("Invalid access token")

    try:
        user_id = UUID(subject)
    except ValueError as exc:
        raise _unauthorized("Invalid access token") from exc

    return AuthenticatedUser(user_id=user_id, email=email, role=role, token=token)


def get_current_user(authorization: str | None = Header(default=None)) -> AuthenticatedUser:
    if not authorization or not authorization.startswith("Bearer "):
        raise _unauthorized("Missing bearer token")

    token = authorization.removeprefix("Bearer ").strip()
    if not token:
        raise _unauthorized("Missing bearer token")

    return verify_access_token(token)
