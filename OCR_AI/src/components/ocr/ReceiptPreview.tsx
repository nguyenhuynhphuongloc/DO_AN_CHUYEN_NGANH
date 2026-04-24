export function ReceiptPreview({ previewUrl }: { previewUrl: string | null }) {
  return previewUrl ? (
    <div className="receipt-preview">
      <img src={previewUrl} alt="Receipt preview" />
    </div>
  ) : (
    <div className="receipt-preview receipt-preview--empty">Preview appears here after selecting a file.</div>
  );
}
