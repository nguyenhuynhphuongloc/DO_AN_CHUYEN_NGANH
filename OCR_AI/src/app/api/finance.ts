import type { CategoryOption, WalletOption } from "../types";
import { requestJson } from "./http";

function createFinanceHeaders(userId: string, accessToken: string) {
  return {
    "x-user-id": userId,
    Authorization: `Bearer ${accessToken}`
  };
}

export async function fetchWallets(
  financeServiceUrl: string,
  userId: string,
  accessToken: string,
  fetchImpl?: typeof fetch
) {
  return requestJson<{ data: WalletOption[] }>(`${financeServiceUrl}/wallets`, {
    method: "GET",
    headers: createFinanceHeaders(userId, accessToken),
    fetchImpl
  });
}

export async function fetchCategories(
  financeServiceUrl: string,
  userId: string,
  accessToken: string,
  fetchImpl?: typeof fetch
) {
  return requestJson<{ data: CategoryOption[] }>(`${financeServiceUrl}/categories`, {
    method: "GET",
    headers: createFinanceHeaders(userId, accessToken),
    fetchImpl
  });
}
