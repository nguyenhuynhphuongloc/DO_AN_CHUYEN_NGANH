export type AuthResponse = {
  user: {
    id: string;
    email: string;
    role: string;
  };
  accessToken: string;
  refreshToken: string;
};

export type DashboardSummary = {
  walletCount: number;
  transactionCount: number;
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  recentTransactions: Transaction[];
};

export type Wallet = {
  id: string;
  name: string;
  balance: number;
  currency: string;
};

export type Category = {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
};

export type Transaction = {
  id: string;
  amount: number;
  description?: string;
  type: 'INCOME' | 'EXPENSE';
  merchantName?: string;
  transactionDate: string;
  wallet?: Wallet;
  category?: Category;
};

export type ReceiptMetadata = {
  id: string;
  user_id: string;
  file_name: string;
  original_url: string;
  mime_type: string | null;
  file_size: number | null;
  image_hash: string | null;
  status: string;
  uploaded_at: string;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ReceiptOcrResult = {
  id: string;
  receipt_id: string;
  ocr_provider: string;
  raw_text: string | null;
  raw_json: Record<string, unknown> | null;
  confidence_score: number | null;
  created_at: string;
};

export type ReceiptOcrDebug = {
  raw_text: string | null;
  lines: string[];
  provider: string | null;
  confidence_score: number | null;
};

export type ReceiptExtraction = {
  id: string;
  receipt_id: string;
  merchant_name: string | null;
  transaction_date: string | null;
  total_amount: number | null;
  tax_amount: number | null;
  currency: string | null;
  extracted_json: Record<string, unknown> | null;
  confidence_score: number | null;
  review_status: string;
  created_at: string;
  updated_at: string;
};

export type ReceiptFeedback = {
  id: string;
  receipt_id: string;
  user_id: string;
  original_data_json: Record<string, unknown> | null;
  corrected_data_json: Record<string, unknown>;
  feedback_note: string | null;
  created_at: string;
};

export type ReceiptJob = {
  id: string;
  receipt_id: string;
  job_type: string;
  status: string;
  error_message: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
};

export type Receipt = {
  receipt: ReceiptMetadata;
  ocr_result: ReceiptOcrResult | null;
  ocr_debug: ReceiptOcrDebug | null;
  extraction_result: ReceiptExtraction | null;
  latest_feedback: ReceiptFeedback | null;
  jobs: ReceiptJob[];
  finance_transaction_id: string | null;
  finance_warning: string | null;
};
