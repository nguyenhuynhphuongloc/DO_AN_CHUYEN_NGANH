CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================
-- Common trigger function for updated_at
-- =========================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- users
-- =========================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    avatar_url TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'active',
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_users_status
        CHECK (status IN ('active', 'inactive', 'blocked'))
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);

CREATE TRIGGER trg_users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- =========================================================
-- roles
-- =========================================================
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed roles cơ bản
INSERT INTO roles (name, description)
VALUES
    ('user', 'Default application user'),
    ('admin', 'System administrator')
ON CONFLICT (name) DO NOTHING;

-- =========================================================
-- user_roles
-- =========================================================
CREATE TABLE user_roles (
    user_id UUID NOT NULL,
    role_id UUID NOT NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user_roles_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);

-- =========================================================
-- refresh_tokens
-- =========================================================
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_refresh_tokens_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX idx_refresh_tokens_revoked_at ON refresh_tokens(revoked_at);


*finance_db 
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================
-- Common trigger function for updated_at
-- =========================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- IMPORTANT NOTE
-- user_id trong finance_db là ID từ auth-service.
-- Không tạo foreign key sang auth_db vì đây là kiến trúc microservice.
-- =========================================================

-- =========================================================
-- budget_profiles
-- Đại diện cho "tổng tiền hiện tại muốn cân bằng"
-- =========================================================
CREATE TABLE budget_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    base_amount NUMERIC(18,2) NOT NULL CHECK (base_amount >= 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'VND',
    calculation_mode VARCHAR(20) NOT NULL DEFAULT 'manual',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    effective_from DATE NOT NULL,
    effective_to DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_budget_profiles_calculation_mode
        CHECK (calculation_mode IN ('manual', 'sum_income_sources')),
    CONSTRAINT chk_budget_profiles_date_range
        CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

CREATE INDEX idx_budget_profiles_user_id ON budget_profiles(user_id);
CREATE INDEX idx_budget_profiles_is_active ON budget_profiles(is_active);

CREATE TRIGGER trg_budget_profiles_set_updated_at
BEFORE UPDATE ON budget_profiles
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- =========================================================
-- income_sources
-- Nguồn thu nhập / nguồn tiền
-- =========================================================
CREATE TABLE income_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    budget_profile_id UUID,
    name VARCHAR(100) NOT NULL,
    source_type VARCHAR(30) NOT NULL,
    amount NUMERIC(18,2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'VND',
    recurrence VARCHAR(20) NOT NULL DEFAULT 'monthly',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    received_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_income_sources_type
        CHECK (source_type IN ('salary', 'business', 'freelance', 'gift', 'investment', 'other')),
    CONSTRAINT chk_income_sources_recurrence
        CHECK (recurrence IN ('one_time', 'daily', 'weekly', 'monthly', 'yearly'))
);

ALTER TABLE income_sources
ADD CONSTRAINT fk_income_sources_budget_profile
FOREIGN KEY (budget_profile_id)
REFERENCES budget_profiles(id)
ON DELETE SET NULL;

CREATE INDEX idx_income_sources_user_id ON income_sources(user_id);
CREATE INDEX idx_income_sources_budget_profile_id ON income_sources(budget_profile_id);
CREATE INDEX idx_income_sources_is_active ON income_sources(is_active);

CREATE TRIGGER trg_income_sources_set_updated_at
BEFORE UPDATE ON income_sources
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- =========================================================
-- wallets
-- Ví / tài khoản tiền / thẻ
-- =========================================================
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    wallet_type VARCHAR(30) NOT NULL DEFAULT 'cash',
    currency VARCHAR(10) NOT NULL DEFAULT 'VND',
    balance NUMERIC(18,2) NOT NULL DEFAULT 0,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_wallet_type
        CHECK (wallet_type IN ('cash', 'bank', 'e_wallet', 'credit_card', 'other'))
);

CREATE UNIQUE INDEX uq_wallets_user_name ON wallets(user_id, name);
CREATE INDEX idx_wallets_user_id ON wallets(user_id);
CREATE INDEX idx_wallets_is_default ON wallets(user_id, is_default);

CREATE TRIGGER trg_wallets_set_updated_at
BEFORE UPDATE ON wallets
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- =========================================================
-- categories
-- Hũ chi tiêu / danh mục user tự tạo
-- =========================================================
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    category_type VARCHAR(20) NOT NULL DEFAULT 'expense',
    parent_id UUID,
    icon VARCHAR(100),
    color VARCHAR(20),
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_category_type
        CHECK (category_type IN ('income', 'expense'))
);

ALTER TABLE categories
ADD CONSTRAINT fk_categories_parent
FOREIGN KEY (parent_id)
REFERENCES categories(id)
ON DELETE SET NULL;

CREATE UNIQUE INDEX uq_categories_user_name_type
ON categories(user_id, name, category_type);

CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_is_active ON categories(user_id, is_active);

CREATE TRIGGER trg_categories_set_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- =========================================================
-- category_allocation_rules
-- Rule chia hũ theo số tiền cố định hoặc %
-- =========================================================
CREATE TABLE category_allocation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    budget_profile_id UUID NOT NULL,
    category_id UUID NOT NULL,
    allocation_mode VARCHAR(20) NOT NULL,
    allocation_value NUMERIC(18,4) NOT NULL,
    priority INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_category_allocation_mode
        CHECK (allocation_mode IN ('fixed_amount', 'percentage')),
    CONSTRAINT chk_category_allocation_value_positive
        CHECK (allocation_value >= 0),
    CONSTRAINT chk_category_allocation_percentage
        CHECK (
            (allocation_mode = 'percentage' AND allocation_value <= 100)
            OR allocation_mode = 'fixed_amount'
        )
);

ALTER TABLE category_allocation_rules
ADD CONSTRAINT fk_category_allocation_rules_budget_profile
FOREIGN KEY (budget_profile_id)
REFERENCES budget_profiles(id)
ON DELETE CASCADE;

ALTER TABLE category_allocation_rules
ADD CONSTRAINT fk_category_allocation_rules_category
FOREIGN KEY (category_id)
REFERENCES categories(id)
ON DELETE CASCADE;

CREATE UNIQUE INDEX uq_category_allocation_profile_category
ON category_allocation_rules(budget_profile_id, category_id);

CREATE INDEX idx_category_allocation_rules_user_id
ON category_allocation_rules(user_id);

CREATE INDEX idx_category_allocation_rules_budget_profile_id
ON category_allocation_rules(budget_profile_id);

CREATE INDEX idx_category_allocation_rules_category_id
ON category_allocation_rules(category_id);

CREATE TRIGGER trg_category_allocation_rules_set_updated_at
BEFORE UPDATE ON category_allocation_rules
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- =========================================================
-- budgets
-- Snapshot ngân sách theo tháng / năm cho từng hũ
-- =========================================================
CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    budget_profile_id UUID NOT NULL,
    category_id UUID NOT NULL,
    month INT NOT NULL,
    year INT NOT NULL,
    amount_limit NUMERIC(18,2) NOT NULL CHECK (amount_limit >= 0),
    spent_amount NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (spent_amount >= 0),
    remaining_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_budget_month CHECK (month BETWEEN 1 AND 12),
    CONSTRAINT uq_budget_user_profile_category_month
        UNIQUE (user_id, budget_profile_id, category_id, month, year)
);

ALTER TABLE budgets
ADD CONSTRAINT fk_budgets_budget_profile
FOREIGN KEY (budget_profile_id)
REFERENCES budget_profiles(id)
ON DELETE CASCADE;

ALTER TABLE budgets
ADD CONSTRAINT fk_budgets_category
FOREIGN KEY (category_id)
REFERENCES categories(id)
ON DELETE CASCADE;

CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_budgets_budget_profile_id ON budgets(budget_profile_id);
CREATE INDEX idx_budgets_category_id ON budgets(category_id);
CREATE INDEX idx_budgets_month_year ON budgets(year, month);

CREATE TRIGGER trg_budgets_set_updated_at
BEFORE UPDATE ON budgets
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- =========================================================
-- transactions
-- Chỉ lưu các field quan trọng từ hóa đơn sau khi user xác nhận
-- Không lưu raw OCR / raw JSON
-- =========================================================
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    wallet_id UUID NOT NULL,
    category_id UUID,
    amount NUMERIC(18,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'VND',
    transaction_type VARCHAR(20) NOT NULL,
    note TEXT,
    merchant_name VARCHAR(255),
    transaction_date TIMESTAMPTZ NOT NULL,
    payment_method VARCHAR(30),
    source_type VARCHAR(30) NOT NULL DEFAULT 'manual',
    source_ref_id UUID,
    receipt_reference VARCHAR(150),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_transaction_type
        CHECK (transaction_type IN ('income', 'expense', 'transfer')),
    CONSTRAINT chk_source_type
        CHECK (source_type IN ('manual', 'receipt', 'ai_parse', 'import')),
    CONSTRAINT chk_payment_method
        CHECK (
            payment_method IS NULL
            OR payment_method IN ('cash', 'bank_transfer', 'credit_card', 'debit_card', 'e_wallet', 'other')
        )
);

ALTER TABLE transactions
ADD CONSTRAINT fk_transactions_wallet
FOREIGN KEY (wallet_id)
REFERENCES wallets(id)
ON DELETE RESTRICT;

ALTER TABLE transactions
ADD CONSTRAINT fk_transactions_category
FOREIGN KEY (category_id)
REFERENCES categories(id)
ON DELETE SET NULL;

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);
CREATE INDEX idx_transactions_transaction_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_source_type ON transactions(source_type);
CREATE INDEX idx_transactions_user_date ON transactions(user_id, transaction_date DESC);

CREATE TRIGGER trg_transactions_set_updated_at
BEFORE UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();