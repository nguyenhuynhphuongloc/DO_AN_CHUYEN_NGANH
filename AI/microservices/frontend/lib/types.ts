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

export type ReceiptOcrLineDebug = {
  text: string;
  normalized_text?: string | null;
  confidence?: number | null;
  box?: number[] | number[][] | null;
  angle?: number | null;
};

export type ReceiptOcrDebug = {
  raw_text: string | null;
  normalized_text?: string | null;
  lines: string[];
  normalized_lines?: string[];
  confidences: number[];
  line_details: ReceiptOcrLineDebug[];
  provider: string | null;
  confidence_score: number | null;
  model_lang?: string | null;
  model_device?: string | null;
  preprocessing?: Record<string, unknown> | null;
  doc_preprocessor?: Record<string, unknown> | null;
};

export type ReceiptItem = {
  name: string;
  amount: number;
  line?: string;
};

export type ReceiptExtractionJson = {
  merchant_name?: string | null;
  transaction_date?: string | null;
  total_amount?: number | null;
  tax_amount?: number | null;
  currency?: string | null;
  merchant_address?: string | null;
  receipt_number?: string | null;
  payment_method?: string | null;
  subtotal_amount?: number | null;
  discount_amount?: number | null;
  service_charge?: number | null;
  items?: ReceiptItem[] | null;
  finance_transaction_id?: string | null;
} & Record<string, unknown>;

export type ReceiptExtraction = {
  id: string;
  receipt_id: string;
  merchant_name: string | null;
  transaction_date: string | null;
  total_amount: number | null;
  tax_amount: number | null;
  currency: string | null;
  extracted_json: ReceiptExtractionJson | null;
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

export type ReceiptParseState =
  | 'uploaded'
  | 'queued'
  | 'preprocessing'
  | 'ocr_running'
  | 'extracting'
  | 'ready_for_review'
  | 'failed'
  | 'reviewed'
  | 'confirmed'
  | string;

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

export type ParsedReceiptFields = {
  merchant_name?: string | null;
  transaction_date?: string | null;
  total_amount?: number | null;
  tax_amount?: number | null;
  currency?: string | null;
  extracted_json?: ReceiptExtractionJson | null;
};
