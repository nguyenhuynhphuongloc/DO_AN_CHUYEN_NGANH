import type { ChatMessage } from "../../types/chat";

export function ChatMessageList({ messages }: { messages: ChatMessage[] }) {
  return (
    <div className="chat-message-list">
      {messages.map((message) => (
        <article key={message.id} className={`chat-bubble chat-bubble--${message.role}`}>
          <div className="chat-bubble__meta">
            <strong>{message.author}</strong>
            <span>{message.timestamp}</span>
          </div>
          <p>{message.content}</p>
          {message.attachments?.length ? (
            <div className="chat-attachments">
              {message.attachments.map((attachment) => (
                <span key={attachment.id}>{attachment.name}</span>
              ))}
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}
