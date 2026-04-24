import type { ChatMessage } from "../types/chat";

export const initialChatMessages: ChatMessage[] = [
  {
    id: "msg-1",
    role: "assistant",
    author: "AI Vanilla",
    content: "Your dining spend is trending below plan this month. Want a quick summary or a tighter budget proposal?",
    timestamp: "09:12"
  },
  {
    id: "msg-2",
    role: "user",
    author: "You",
    content: "Give me a concise summary of where I can save more this week.",
    timestamp: "09:13"
  },
  {
    id: "msg-3",
    role: "assistant",
    author: "AI Vanilla",
    content: "Transport and subscription spend are your fastest levers. If you defer two non-essential rides and one software renewal, you free roughly $180.",
    timestamp: "09:13"
  }
];
