export interface OcrLineItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface OcrSuccessResponse {
  total_amount: number;
  tax_amount: number | null;
  currency: string;
  transaction_datetime: string | null;
  merchant_name: string | null;
  payment_method: string | null;
  ai_suggested_category: string | null;
  ai_suggested_category_id: string | null;
  warnings: string[];
  needs_review: boolean;
  notes?: string;
  line_items?: OcrLineItem[];
}

export interface OcrFormModeResponse {
  mode: "ocr_form";
  receipt_data: OcrSuccessResponse;
}

export interface OcrChatbotModeResponse {
  mode: "chatbot_ocr";
  ocr_data: OcrSuccessResponse;
}

export type OcrEndpointSuccessResponse = OcrFormModeResponse | OcrChatbotModeResponse;

export interface OcrErrorResponse {
  error_code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ReceiptReviewFormData extends OcrSuccessResponse {
  wallet_id: string;
  final_category: string;
  notes: string;
}

export interface ConfirmedOcrTransactionRequest {
  total_amount: number;
  currency: string;
  transaction_datetime: string;
  merchant_name: string;
  payment_method: string;
  ai_suggested_category: string;
  wallet_id: string;
  final_category: string;
  notes: string;
  original_suggested_category: string;
  category_id?: string;
}

export interface ConfirmedOcrTransactionResponse {
  success: true;
  message: string;
  transaction_id: string;
  data: {
    transaction: {
      id: string;
      user_id: string;
      wallet_id: string;
      category_id?: string | null;
      amount: number;
      currency: string;
      transaction_type: string;
      note?: string | null;
      merchant_name?: string | null;
      transaction_date: string;
      payment_method?: string | null;
      source_type: string;
      source_ref_id?: string | null;
      receipt_reference?: string | null;
      created_at: string;
      updated_at: string;
    };
    wallet_balance: number | null;
    budget?: {
      id: string;
      amount_limit: number;
      spent_amount: number;
      remaining_amount: number;
    } | null;
  };
}

export interface ApiError extends OcrErrorResponse {
  status: number;
}
