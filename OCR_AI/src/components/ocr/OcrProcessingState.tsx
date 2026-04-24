export function OcrProcessingState({ isProcessing }: { isProcessing: boolean }) {
  return (
    <div className="ocr-processing-state">
      <div className={`ocr-processing-state__dot${isProcessing ? " is-live" : ""}`} />
      <div>
        <strong>{isProcessing ? "Processing OCR" : "Ready to scan"}</strong>
        <span>
          {isProcessing
            ? "Extracting merchant, amount, tax, and category suggestions."
            : "Run OCR to populate editable finance fields."}
        </span>
      </div>
    </div>
  );
}
