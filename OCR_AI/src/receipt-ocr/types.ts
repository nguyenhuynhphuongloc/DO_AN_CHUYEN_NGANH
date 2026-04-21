export interface OcrSuccessResponse {
  total_amount: number;
  currency: string;
  transaction_datetime: string;
  merchant_name: string;
  payment_method: string;
  ai_suggested_category: string;
}

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

export interface ConfirmedOcrTransactionRequest extends ReceiptReviewFormData {
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

export interface WalletOption {
  id: string;
  name: string;
  currency: string;
  balance: number;
  is_default?: boolean;
}

export interface ReceiptOcrModuleProps {
  ocrEndpoint: string;
  saveEndpoint: string;
  walletOptions: WalletOption[];
  defaultWalletId?: string;
  categoryOptions?: string[];
  className?: string;
  ocrRequestHeaders?: Record<string, string>;
  saveRequestHeaders?: Record<string, string>;
  fetchImpl?: typeof fetch;
  onSaveSuccess?: (response: ConfirmedOcrTransactionResponse) => void;
}

export interface ApiError extends OcrErrorResponse {
  status: number;
}
