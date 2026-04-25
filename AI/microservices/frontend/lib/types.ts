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
  id: string | number;
  name: string;
  balance: number;
  currency: string;
  isDefault?: boolean;
};

export type Category = {
  id: string | number;
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
  receiptId?: string | number | null;
  wallet?: Wallet;
  category?: Category;
};

export type ReceiptMetadata = {
  id: string | number;
  user_id: string | number;
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
  id: string | number;
  receipt_id: string | number;
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
  display_mode?: string | null;
  boxed_image_url?: string | null;
  layout_image_url?: string | null;
  text_file_url?: string | null;
  device: string | null;
  ocr_language?: string | null;
  fallback_used?: boolean | null;
  low_quality_ratio?: number | null;
  profile?: string | null;
  selected_path?: string | null;
  timings?: Record<string, unknown> | null;
  preprocess?: Record<string, unknown> | null;
  line_count?: number | null;
  detected_box_count?: number | null;
  short_line_ratio?: number | null;
  runtime?: Record<string, unknown> | null;
  engine_config?: Record<string, unknown> | null;
  ordering?: Record<string, unknown> | null;
  layout?: Record<string, unknown> | null;
  structured_json?: Record<string, unknown> | null;
  provider_document_id?: string | number | null;
  provider_payload_summary?: Record<string, unknown> | null;
  provider_payload?: Record<string, unknown> | null;
};

export type ReceiptExtraction = {
  id: string | number;
  receipt_id: string | number;
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
  transaction_datetime?: string | null;
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

export type ReceiptSummary = {
  merchant_name?: string | null;
  transaction_date?: string | null;
  transaction_datetime?: string | null;
  total_amount?: number | null;
  currency?: string | null;
  provider_category?: string | null;
  line_items?: ReceiptStructuredItem[] | null;
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
  field_provenance?: Record<string, unknown> | null;
  needs_review_fields?: string[] | null;
  description_text?: string | null;
  extraction_version?: string | null;
  extraction_notes?: string[] | null;
  parser_metadata?: Record<string, unknown> | null;
  provider_document_summary?: Record<string, unknown> | null;
  receipt_summary?: ReceiptSummary | null;
  review_defaults?: {
    merchant_name?: string | null;
    amount?: number | null;
    transaction_time?: string | null;
    description?: string | null;
    wallet_id?: string | number | null;
    category_id?: string | number | null;
    category_name?: string | null;
    category_reason?: string | null;
  } | null;
};

export type ReceiptFeedback = {
  id: string;
  receipt_id: string | number;
  user_id: string | number;
  original_data_json: Record<string, unknown> | null;
  corrected_data_json: Record<string, unknown>;
  feedback_note: string | null;
  created_at: string;
};

export type ReceiptJob = {
  id: string;
  receipt_id: string | number;
  job_type: string;
  status: string;
  error_message: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
};

export type ReceiptParseSessionMetadata = {
  id: string;
  user_id: string | number;
  file_name: string;
  temp_url: string;
  permanent_url: string | null;
  mime_type: string | null;
  file_size: number | null;
  image_hash: string | null;
  status: string;
  processed_at: string | null;
  expires_at: string;
  finalized_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ReceiptParseJob = {
  id: string;
  session_id: string;
  job_type: string;
  status: string;
  error_message: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
};

export type SessionFeedback = {
  corrected_data_json: Record<string, unknown>;
  feedback_note: string | null;
};

export type ReceiptWorkflow = {
  receipt: ReceiptMetadata | null;
  session: ReceiptParseSessionMetadata | null;
  confirmed_receipt: ReceiptMetadata | null;
  ocr_result: ReceiptOcrResult | null;
  ocr_debug: ReceiptOcrDebug | null;
  extraction_result: ReceiptExtraction | null;
  extraction_details?: ReceiptStructuredExtraction | null;
  latest_feedback: ReceiptFeedback | SessionFeedback | null;
  jobs: ReceiptJob[];
  session_jobs: ReceiptParseJob[];
  active_job: ReceiptJob | ReceiptParseJob | null;
  finance_transaction_id: string | null;
  finance_warning: string | null;
};
