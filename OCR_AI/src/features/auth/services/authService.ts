import type { AuthSession, AuthUser, LoginPayload, RegisterPayload } from "../../../types/auth";
import { requestJson } from "./http";

export async function registerWithAuthService(
  authServiceUrl: string,
  payload: RegisterPayload,
  fetchImpl?: typeof fetch
) {
  return requestJson<AuthSession>(`${authServiceUrl}/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    fetchImpl
  });
}

export async function loginWithAuthService(
  authServiceUrl: string,
  payload: LoginPayload,
  fetchImpl?: typeof fetch
) {
  return requestJson<AuthSession>(`${authServiceUrl}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    fetchImpl
  });
}

export async function fetchCurrentUser(
  authServiceUrl: string,
  accessToken: string,
  fetchImpl?: typeof fetch
) {
  return requestJson<{ user: AuthUser }>(`${authServiceUrl}/auth/me`, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
    fetchImpl
  });
}
