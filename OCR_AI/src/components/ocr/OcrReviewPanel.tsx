import type { ReceiptReviewFormData } from "../../types/ocr";
import { formatCurrency } from "../../lib/utils";

export function OcrReviewPanel({ formData }: { formData: ReceiptReviewFormData }) {
  return (
    <div className="ocr-review-panel">
      <div className="ocr-review-panel__header">
        <div>
          <div className="section-header__eyebrow">2. Review extracted result</div>
          <h3>OCR finance review</h3>
        </div>
        <span>{formatCurrency(formData.total_amount || 0, formData.currency || "USD")}</span>
      </div>
      {formData.line_items?.length ? (
        <div className="line-items">
          {formData.line_items.map((item) => (
            <div key={item.id} className="line-items__row">
              <span>{item.name}</span>
              <span>
                {item.quantity} x {formatCurrency(item.price, formData.currency || "USD")}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="line-items line-items--empty">No itemized lines provided by the OCR response.</div>
      )}
      {formData.warnings.length ? (
        <div className="line-items line-items--empty">Review warnings: {formData.warnings.join(", ")}</div>
      ) : null}
    </div>
  );
}
