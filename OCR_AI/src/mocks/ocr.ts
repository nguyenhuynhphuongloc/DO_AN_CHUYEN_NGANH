import type { ReceiptReviewFormData } from "../types/ocr";

export const mockOcrReviewResult: ReceiptReviewFormData = {
  merchant_name: "Maison Aurelia",
  transaction_datetime: "2026-04-20 19:45",
  total_amount: 126.4,
  tax_amount: 10.2,
  currency: "USD",
  payment_method: "Visa Platinum",
  ai_suggested_category: "Dining",
  ai_suggested_category_id: "category-dining",
  warnings: [],
  needs_review: false,
  wallet_id: "wallet-main",
  final_category: "Dining",
  notes: "Team dinner with receipt uploaded from mobile.",
  line_items: [
    { id: "li-1", name: "Chef tasting menu", quantity: 2, price: 88 },
    { id: "li-2", name: "Sparkling water", quantity: 1, price: 8.2 },
    { id: "li-3", name: "Service fee", quantity: 1, price: 30.2 }
  ]
};
