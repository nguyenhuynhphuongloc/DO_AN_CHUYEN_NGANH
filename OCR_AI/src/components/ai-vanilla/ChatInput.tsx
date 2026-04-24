export function ChatInput({
  value,
  onChange,
  onSend,
  onUpload,
  attachmentName
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onUpload: React.ChangeEventHandler<HTMLInputElement>;
  attachmentName?: string;
}) {
  return (
    <div className="chat-input">
      <textarea
        className="field-control field-control--textarea"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Ask AI Vanilla about spending patterns, budgets, or receipt context."
      />
      <div className="chat-input__actions">
        <label className="button button--ghost">
          Upload image
          <input className="visually-hidden" type="file" accept="image/*" onChange={onUpload} />
        </label>
        <button className="button button--primary" type="button" onClick={onSend}>
          Send
        </button>
      </div>
      {attachmentName ? <div className="chat-attachment-pill">{attachmentName}</div> : null}
    </div>
  );
}
