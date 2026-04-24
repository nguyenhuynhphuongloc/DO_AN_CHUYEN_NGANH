import { useEffect, useMemo, useState } from "react";

import { useAppConfig } from "../../../app/config";
import { financeCategories, wallets as fallbackWallets } from "../../../mocks/finance";
import type { AuthSession } from "../../../types/auth";
import type { CategoryOption, WalletOption } from "../../../types/finance";
import type { ApiError } from "../../../types/ocr";
import { fetchCategories, fetchWallets } from "../services/financeService";

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as ApiError).message);
  }

  return "Unable to load finance data.";
}

export function useFinanceMetadata(session: AuthSession | null) {
  const config = useAppConfig();
  const [wallets, setWallets] = useState<WalletOption[]>(fallbackWallets);
  const [categories, setCategories] = useState<CategoryOption[]>(
    financeCategories.filter((item) => item.category_type === "expense")
  );
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(Boolean(session));

  useEffect(() => {
    if (!session) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");

    Promise.all([
      fetchWallets(config.financeServiceUrl, session.user.id, session.access_token),
      fetchCategories(config.financeServiceUrl, session.user.id, session.access_token)
    ])
      .then(([walletResponse, categoryResponse]) => {
        setWallets(walletResponse.data.length ? walletResponse.data : fallbackWallets);
        const expenseCategories = categoryResponse.data.filter(
          (category) => category.category_type === "expense"
        );
        setCategories(expenseCategories.length ? expenseCategories : financeCategories);
      })
      .catch((loadingError) => {
        setError(`${getErrorMessage(loadingError)} Using local demo data.`);
      })
      .finally(() => setIsLoading(false));
  }, [config.financeServiceUrl, session]);

  const defaultWalletId = useMemo(
    () => wallets.find((wallet) => wallet.is_default)?.id ?? wallets[0]?.id ?? "",
    [wallets]
  );

  return {
    wallets,
    categories,
    error,
    isLoading,
    defaultWalletId
  };
}
