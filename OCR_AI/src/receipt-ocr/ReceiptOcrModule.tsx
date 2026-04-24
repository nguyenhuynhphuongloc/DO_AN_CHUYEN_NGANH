import { useMemo } from "react";

import { ReceiptOcrWorkspace } from "../components/ocr/ReceiptOcrWorkspace";
import type { CategoryOption, WalletOption } from "../types/finance";

export function ReceiptOcrModule({
  ocrEndpoint,
  saveEndpoint,
  walletOptions,
  defaultWalletId,
  categoryOptions = [],
  className,
  ocrRequestHeaders,
  saveRequestHeaders,
  fetchImpl,
  onSaveSuccess
}: {
  ocrEndpoint: string;
  saveEndpoint: string;
  walletOptions: WalletOption[];
  defaultWalletId?: string;
  categoryOptions?: string[];
  className?: string;
  ocrRequestHeaders?: Record<string, string>;
  saveRequestHeaders?: Record<string, string>;
  fetchImpl?: typeof fetch;
  onSaveSuccess?: (response: { message: string }) => void;
}) {
  const normalizedCategories = useMemo<CategoryOption[]>(
    () =>
      categoryOptions.map((name, index) => ({
        id: `legacy-category-${index}`,
        name,
        category_type: "expense"
      })),
    [categoryOptions]
  );

  return (
    <div className={className}>
      <ReceiptOcrWorkspace
        ocrEndpoint={ocrEndpoint}
        saveEndpoint={saveEndpoint}
        walletOptions={walletOptions}
        categoryOptions={normalizedCategories}
        defaultWalletId={defaultWalletId ?? walletOptions[0]?.id ?? ""}
        ocrRequestHeaders={ocrRequestHeaders}
        saveRequestHeaders={saveRequestHeaders}
        fetchImpl={fetchImpl}
        demoFallbackOnOcrError={false}
        onSaveSuccess={(message) => onSaveSuccess?.({ message })}
      />
    </div>
  );
}
