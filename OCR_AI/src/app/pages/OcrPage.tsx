import { PageShell } from "../../components/layout/PageShell";
import { LoadingState } from "../../components/shared/LoadingState";
import { InlineMessage } from "../../components/shared/InlineMessage";
import { ReceiptOcrWorkspace } from "../../components/ocr/ReceiptOcrWorkspace";
import { useAuth } from "../../features/auth/AuthContext";
import { useAppConfig } from "../config";
import { useFinanceMetadata } from "../../features/finance/hooks/useFinanceMetadata";

export function OcrPage() {
  const { session } = useAuth();
  const config = useAppConfig();
  const { wallets, categories, error, isLoading, defaultWalletId } = useFinanceMetadata(session);

  if (!session) {
    return null;
  }

  return (
    <PageShell
      eyebrow="OCR Receipts"
      title="Authenticated OCR"
      description="Review and refine extracted receipt data before posting it into your finance record set."
    >
      {error ? <InlineMessage tone="info">{error}</InlineMessage> : null}
      {isLoading ? (
        <LoadingState label="Loading wallet and category metadata..." />
      ) : (
        <ReceiptOcrWorkspace
          ocrEndpoint={config.ocrFormEndpoint}
          saveEndpoint={`${config.financeServiceUrl}/transactions/confirmed-ocr`}
          walletOptions={wallets}
          categoryOptions={categories}
          defaultWalletId={defaultWalletId}
          workspaceLabel="OCR Receipts / n8n Workflow"
          ocrRequestHeaders={{ Authorization: `Bearer ${session.access_token}` }}
          saveRequestHeaders={{
            Authorization: `Bearer ${session.access_token}`,
            "x-user-id": session.user.id
          }}
          demoFallbackOnOcrError={false}
        />
      )}
    </PageShell>
  );
}
