export interface ChatAttachment {
  id: string;
  name: string;
  type: "image";
}

export interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  author: string;
  content: string;
  timestamp: string;
  attachments?: ChatAttachment[];
}

export type AiVanillaMode = "chatbot" | "ocr";
