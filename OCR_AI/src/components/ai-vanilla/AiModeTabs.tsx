import type { AiVanillaMode } from "../../types/chat";
import { cn } from "../../lib/utils";

export function AiModeTabs({
  mode,
  onModeChange
}: {
  mode: AiVanillaMode;
  onModeChange: (mode: AiVanillaMode) => void;
}) {
  return (
    <div className="ai-tabs">
      {(["chatbot", "ocr"] as const).map((value) => (
        <button
          key={value}
          type="button"
          className={cn("ai-tabs__button", mode === value && "ai-tabs__button--active")}
          onClick={() => onModeChange(value)}
        >
          {value === "chatbot" ? "Chatbot" : "OCR"}
        </button>
      ))}
    </div>
  );
}
