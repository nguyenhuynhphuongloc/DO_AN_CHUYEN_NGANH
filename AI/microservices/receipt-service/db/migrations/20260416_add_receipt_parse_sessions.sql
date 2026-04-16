CREATE TABLE IF NOT EXISTS receipt_parse_sessions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    temp_url TEXT NOT NULL,
    permanent_url TEXT,
    mime_type VARCHAR(100),
    file_size BIGINT,
    image_hash VARCHAR(128),
    status VARCHAR(30) NOT NULL DEFAULT 'uploaded',
    ocr_provider VARCHAR(100),
    ocr_raw_text TEXT,
    ocr_debug_json JSONB,
    ocr_confidence_score NUMERIC(5,4),
    merchant_name VARCHAR(255),
    transaction_date DATE,
    total_amount NUMERIC(18,2),
    tax_amount NUMERIC(18,2),
    currency VARCHAR(10),
    extracted_json JSONB,
    extraction_confidence_score NUMERIC(5,4),
    review_status VARCHAR(30) NOT NULL DEFAULT 'needs_review',
    reviewer_feedback_json JSONB,
    reviewer_note TEXT,
    finance_transaction_id VARCHAR(255),
    confirmed_receipt_id UUID REFERENCES receipts(id) ON DELETE SET NULL,
    processed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    finalized_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS receipt_parse_jobs (
    id UUID PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES receipt_parse_sessions(id) ON DELETE CASCADE,
    job_type VARCHAR(30) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'queued',
    error_message TEXT,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_receipt_parse_sessions_user_id ON receipt_parse_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_receipt_parse_sessions_status ON receipt_parse_sessions(status);
CREATE INDEX IF NOT EXISTS idx_receipt_parse_sessions_expires_at ON receipt_parse_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_receipt_parse_jobs_session_id ON receipt_parse_jobs(session_id);
CREATE INDEX IF NOT EXISTS idx_receipt_parse_jobs_status ON receipt_parse_jobs(status);
