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
  device: string | null;
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

export type ReceiptStructuredItem = {
  name: string | null;
  quantity: number | null;
  unit_price: number | null;
  line_total: number | null;
  confidence: number | null;
  source_lines: number[];
};

export type ReceiptStructuredFields = {
  merchant_name?: string | null;
  transaction_date?: string | null;
  total_amount?: number | null;
  currency?: string | null;
  subtotal_amount?: number | null;
  tax_amount?: number | null;
  discount_amount?: number | null;
  service_charge?: number | null;
  payment_method?: string | null;
  receipt_number?: string | null;
  merchant_address?: string | null;
  merchant_phone?: string | null;
  cashier_name?: string | null;
  table_number?: string | null;
  guest_count?: number | null;
  time_in?: string | null;
  time_out?: string | null;
};

export type ReceiptStructuredExtraction = {
  normalized_text?: {
    raw_text?: string;
    normalized_text?: string;
    normalized_lines?: string[];
    header_lines?: string[];
    body_lines?: string[];
    footer_lines?: string[];
  } | null;
  zones?: {
    header?: string[];
    metadata?: string[];
    item_table?: string[];
    payment_summary?: string[];
    footer?: string[];
  } | null;
  fields?: ReceiptStructuredFields | null;
  items?: ReceiptStructuredItem[] | null;
  field_confidence?: Record<string, number | null> | null;
  source_lines?: Record<string, unknown> | null;
  needs_review_fields?: string[] | null;
  description_text?: string | null;
  extraction_version?: string | null;
  extraction_notes?: string[] | null;
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
  extraction_details?: ReceiptStructuredExtraction | null;
  latest_feedback: ReceiptFeedback | null;
  jobs: ReceiptJob[];
  active_job: ReceiptJob | null;
  finance_transaction_id: string | null;
  finance_warning: string | null;
};
