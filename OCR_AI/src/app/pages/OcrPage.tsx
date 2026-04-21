import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";

import { fetchCategories, fetchWallets } from "../api/finance";
import { useAuth } from "../auth/AuthContext";
import { InlineMessage } from "../components/InlineMessage";
import { PageShell } from "../components/PageShell";
import { useAppConfig } from "../config";
import { ReceiptOcrModule } from "../../receipt-ocr/ReceiptOcrModule";
import type { ApiError } from "../../receipt-ocr/types";
import type { CategoryOption, WalletOption } from "../types";

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as ApiError).message);
  }

  return "Unable to load finance data.";
}

export function OcrPage() {
  const config = useAppConfig();
  const { session, logout } = useAuth();
  const [wallets, setWallets] = useState<WalletOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      return;
    }

    setIsLoading(true);
    setError("");

    Promise.all([
      fetchWallets(config.financeServiceUrl, session.user.id, session.access_token),
      fetchCategories(config.financeServiceUrl, session.user.id, session.access_token)
    ])
      .then(([walletResponse, categoryResponse]) => {
        setWallets(walletResponse.data);
        setCategories(categoryResponse.data.filter((category) => category.category_type === "expense"));
      })
      .catch((loadingError) => {
        setError(getErrorMessage(loadingError));
      })
      .finally(() => setIsLoading(false));
  }, [config.financeServiceUrl, session]);

  const defaultWalletId = useMemo(
    () => wallets.find((wallet) => wallet.is_default)?.id ?? wallets[0]?.id ?? "",
    [wallets]
  );

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <PageShell
      title="Authenticated OCR"
      description="Upload a receipt, review the important extracted fields, then save the confirmed result as a finance transaction."
      actions={
        <button
          className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white"
          type="button"
          onClick={logout}
        >
          Logout
        </button>
      }
    >
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
        Logged in as <span className="font-medium text-slate-900">{session.user.email}</span>
      </div>

      {error ? <InlineMessage tone="error">{error}</InlineMessage> : null}

      {isLoading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
          Loading wallets and categories...
        </div>
      ) : wallets.length === 0 ? (
        <InlineMessage tone="info">
          No wallets were found for this user. Create at least one wallet in finance-service before
          saving OCR transactions.
        </InlineMessage>
      ) : (
        <ReceiptOcrModule
          ocrEndpoint={config.ocrEndpoint}
          saveEndpoint={`${config.financeServiceUrl}/transactions/confirmed-ocr`}
          walletOptions={wallets}
          defaultWalletId={defaultWalletId}
          categoryOptions={categories.map((category) => category.name)}
          saveRequestHeaders={{
            "x-user-id": session.user.id,
            Authorization: `Bearer ${session.access_token}`
          }}
        />
      )}
    </PageShell>
  );
}
