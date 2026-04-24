import type { RefObject } from "react";

export function ReceiptUploadBox({
  onBrowse,
  fileInputRef,
  onFileChange,
  selectedFileName,
  inputId = "receipt-upload-input"
}: {
  onBrowse: () => void;
  fileInputRef: RefObject<HTMLInputElement>;
  onFileChange: React.ChangeEventHandler<HTMLInputElement>;
  selectedFileName?: string;
  inputId?: string;
}) {
  return (
    <div className="ocr-upload-box">
      <div>
        <div className="section-header__eyebrow">1. Upload image</div>
        <h3>Receipt intake</h3>
        <p>Select a receipt to review, classify, and convert into a finance record.</p>
      </div>
      <button className="button button--primary" type="button" onClick={onBrowse}>
        Choose Receipt
      </button>
      <input
        ref={fileInputRef}
        id={inputId}
        aria-label="Choose a receipt image"
        className="visually-hidden"
        type="file"
        accept="image/*"
        onChange={onFileChange}
      />
      <label className="upload-dropzone" htmlFor={inputId}>
        <strong>Drop or browse a receipt image</strong>
        <span>{selectedFileName ?? "PNG, JPG, HEIC, or camera capture"}</span>
      </label>
    </div>
  );
}
