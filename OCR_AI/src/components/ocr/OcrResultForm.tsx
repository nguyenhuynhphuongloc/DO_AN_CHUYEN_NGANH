import type { CategoryOption, WalletOption } from "../../types/finance";
import type { ReceiptReviewFormData } from "../../types/ocr";

export function OcrResultForm({
  formData,
  wallets,
  categories,
  onChange
}: {
  formData: ReceiptReviewFormData;
  wallets: WalletOption[];
  categories: CategoryOption[];
  onChange: <K extends keyof ReceiptReviewFormData>(field: K, value: ReceiptReviewFormData[K]) => void;
}) {
  return (
    <div className="ocr-form-grid">
      <label className="field">
        <span>Merchant name</span>
        <input className="field-control" value={formData.merchant_name ?? ""} onChange={(event) => onChange("merchant_name", event.target.value)} />
      </label>
      <label className="field">
        <span>Transaction date</span>
        <input className="field-control" value={formData.transaction_datetime ?? ""} onChange={(event) => onChange("transaction_datetime", event.target.value)} />
      </label>
      <label className="field">
        <span>Total amount</span>
        <input className="field-control" type="number" value={formData.total_amount || ""} onChange={(event) => onChange("total_amount", Number(event.target.value))} />
      </label>
      <label className="field">
        <span>Tax amount</span>
        <input className="field-control" type="number" value={formData.tax_amount ?? ""} onChange={(event) => onChange("tax_amount", Number(event.target.value))} />
      </label>
      <label className="field">
        <span>Payment method</span>
        <input className="field-control" value={formData.payment_method ?? ""} onChange={(event) => onChange("payment_method", event.target.value)} />
      </label>
      <label className="field">
        <span>Category suggestion</span>
        <input className="field-control" value={formData.ai_suggested_category ?? ""} onChange={(event) => onChange("ai_suggested_category", event.target.value)} />
      </label>
      <label className="field">
        <span>Wallet</span>
        <select className="field-control" value={formData.wallet_id} onChange={(event) => onChange("wallet_id", event.target.value)}>
          <option value="">Select a wallet</option>
          {wallets.map((wallet) => (
            <option key={wallet.id} value={wallet.id}>
              {wallet.name} ({wallet.currency})
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Category</span>
        <select className="field-control" value={formData.final_category} onChange={(event) => onChange("final_category", event.target.value)}>
          <option value="">Select a category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.name}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <label className="field field--full">
        <span>Notes</span>
        <textarea className="field-control field-control--textarea" value={formData.notes} onChange={(event) => onChange("notes", event.target.value)} />
      </label>
    </div>
  );
}
