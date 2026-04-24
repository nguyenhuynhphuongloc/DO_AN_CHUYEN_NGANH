import { useState } from "react";

import { AiModeTabs } from "../../components/ai-vanilla/AiModeTabs";
import { ChatInput } from "../../components/ai-vanilla/ChatInput";
import { ChatMessageList } from "../../components/ai-vanilla/ChatMessageList";
import { PageShell } from "../../components/layout/PageShell";
import { ReceiptOcrWorkspace } from "../../components/ocr/ReceiptOcrWorkspace";
import { useAuth } from "../../features/auth/AuthContext";
import { useFinanceMetadata } from "../../features/finance/hooks/useFinanceMetadata";
import { initialChatMessages } from "../../mocks/chat";
import type { AiVanillaMode } from "../../types/chat";
import { useAppConfig } from "../config";

export function AiVanillaPage() {
  const { session } = useAuth();
  const config = useAppConfig();
  const { wallets, categories, defaultWalletId } = useFinanceMetadata(session);
  const [mode, setMode] = useState<AiVanillaMode>("chatbot");
  const [messages, setMessages] = useState(initialChatMessages);
  const [draft, setDraft] = useState("");
  const [attachmentName, setAttachmentName] = useState("");

  function handleSend() {
    if (!draft.trim() && !attachmentName) {
      return;
    }

    setMessages((current) => [
      ...current,
      {
        id: `msg-${current.length + 1}`,
        role: "user",
        author: "You",
        content: draft || "Shared an image for review.",
        timestamp: "Now",
        attachments: attachmentName ? [{ id: "att-1", name: attachmentName, type: "image" }] : undefined
      },
      {
        id: `msg-${current.length + 2}`,
        role: "assistant",
        author: "AI Vanilla",
        content:
          "I can help summarize the receipt, suggest a category, or propose a tighter weekly spending plan from this context.",
        timestamp: "Now"
      }
    ]);
    setDraft("");
    setAttachmentName("");
  }

  return (
    <PageShell
      eyebrow="AI Vanilla"
      title="AI Vanilla"
      description="Unified intelligent workspace with chatbot mode and OCR mode in one premium module."
    >
      <div className="panel-card ai-shell">
        <div className="ai-shell__header">
          <div>
            <div className="section-header__eyebrow">Intelligent workspace</div>
            <h3>Switch between Chatbot and OCR without leaving AI Vanilla.</h3>
          </div>
          <AiModeTabs mode={mode} onModeChange={setMode} />
        </div>

        {mode === "chatbot" ? (
          <div className="ai-chat-layout">
            <ChatMessageList messages={messages} />
            <ChatInput
              value={draft}
              onChange={setDraft}
              onSend={handleSend}
              onUpload={(event) => setAttachmentName(event.target.files?.[0]?.name ?? "")}
              attachmentName={attachmentName}
            />
          </div>
        ) : (
          <ReceiptOcrWorkspace
            ocrEndpoint={config.ocrChatbotEndpoint}
            saveEndpoint={`${config.financeServiceUrl}/transactions/confirmed-ocr`}
            walletOptions={wallets}
            categoryOptions={categories}
            defaultWalletId={defaultWalletId}
            workspaceLabel="AI Vanilla / OCR"
            ocrRequestHeaders={session ? { Authorization: `Bearer ${session.access_token}` } : undefined}
            saveRequestHeaders={
              session
                ? {
                    Authorization: `Bearer ${session.access_token}`,
                    "x-user-id": session.user.id
                  }
                : undefined
            }
          />
        )}
      </div>
    </PageShell>
  );
}
