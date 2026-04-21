CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS budget_profiles (
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

CREATE INDEX IF NOT EXISTS idx_budget_profiles_user_id ON budget_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_profiles_is_active ON budget_profiles(is_active);

DROP TRIGGER IF EXISTS trg_budget_profiles_set_updated_at ON budget_profiles;
CREATE TRIGGER trg_budget_profiles_set_updated_at
BEFORE UPDATE ON budget_profiles
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS income_sources (
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
DROP CONSTRAINT IF EXISTS fk_income_sources_budget_profile;
ALTER TABLE income_sources
ADD CONSTRAINT fk_income_sources_budget_profile
FOREIGN KEY (budget_profile_id)
REFERENCES budget_profiles(id)
ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_income_sources_user_id ON income_sources(user_id);
CREATE INDEX IF NOT EXISTS idx_income_sources_budget_profile_id ON income_sources(budget_profile_id);
CREATE INDEX IF NOT EXISTS idx_income_sources_is_active ON income_sources(is_active);

DROP TRIGGER IF EXISTS trg_income_sources_set_updated_at ON income_sources;
CREATE TRIGGER trg_income_sources_set_updated_at
BEFORE UPDATE ON income_sources
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS wallets (
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

CREATE UNIQUE INDEX IF NOT EXISTS uq_wallets_user_name ON wallets(user_id, name);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_is_default ON wallets(user_id, is_default);

DROP TRIGGER IF EXISTS trg_wallets_set_updated_at ON wallets;
CREATE TRIGGER trg_wallets_set_updated_at
BEFORE UPDATE ON wallets
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS categories (
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
DROP CONSTRAINT IF EXISTS fk_categories_parent;
ALTER TABLE categories
ADD CONSTRAINT fk_categories_parent
FOREIGN KEY (parent_id)
REFERENCES categories(id)
ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_categories_user_name_type
ON categories(user_id, name, category_type);

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(user_id, is_active);

DROP TRIGGER IF EXISTS trg_categories_set_updated_at ON categories;
CREATE TRIGGER trg_categories_set_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS category_allocation_rules (
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
DROP CONSTRAINT IF EXISTS fk_category_allocation_rules_budget_profile;
ALTER TABLE category_allocation_rules
ADD CONSTRAINT fk_category_allocation_rules_budget_profile
FOREIGN KEY (budget_profile_id)
REFERENCES budget_profiles(id)
ON DELETE CASCADE;

ALTER TABLE category_allocation_rules
DROP CONSTRAINT IF EXISTS fk_category_allocation_rules_category;
ALTER TABLE category_allocation_rules
ADD CONSTRAINT fk_category_allocation_rules_category
FOREIGN KEY (category_id)
REFERENCES categories(id)
ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS uq_category_allocation_profile_category
ON category_allocation_rules(budget_profile_id, category_id);

CREATE INDEX IF NOT EXISTS idx_category_allocation_rules_user_id
ON category_allocation_rules(user_id);

CREATE INDEX IF NOT EXISTS idx_category_allocation_rules_budget_profile_id
ON category_allocation_rules(budget_profile_id);

CREATE INDEX IF NOT EXISTS idx_category_allocation_rules_category_id
ON category_allocation_rules(category_id);

DROP TRIGGER IF EXISTS trg_category_allocation_rules_set_updated_at ON category_allocation_rules;
CREATE TRIGGER trg_category_allocation_rules_set_updated_at
BEFORE UPDATE ON category_allocation_rules
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS budgets (
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
DROP CONSTRAINT IF EXISTS fk_budgets_budget_profile;
ALTER TABLE budgets
ADD CONSTRAINT fk_budgets_budget_profile
FOREIGN KEY (budget_profile_id)
REFERENCES budget_profiles(id)
ON DELETE CASCADE;

ALTER TABLE budgets
DROP CONSTRAINT IF EXISTS fk_budgets_category;
ALTER TABLE budgets
ADD CONSTRAINT fk_budgets_category
FOREIGN KEY (category_id)
REFERENCES categories(id)
ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_budget_profile_id ON budgets(budget_profile_id);
CREATE INDEX IF NOT EXISTS idx_budgets_category_id ON budgets(category_id);
CREATE INDEX IF NOT EXISTS idx_budgets_month_year ON budgets(year, month);

DROP TRIGGER IF EXISTS trg_budgets_set_updated_at ON budgets;
CREATE TRIGGER trg_budgets_set_updated_at
BEFORE UPDATE ON budgets
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS transactions (
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
DROP CONSTRAINT IF EXISTS fk_transactions_wallet;
ALTER TABLE transactions
ADD CONSTRAINT fk_transactions_wallet
FOREIGN KEY (wallet_id)
REFERENCES wallets(id)
ON DELETE RESTRICT;

ALTER TABLE transactions
DROP CONSTRAINT IF EXISTS fk_transactions_category;
ALTER TABLE transactions
ADD CONSTRAINT fk_transactions_category
FOREIGN KEY (category_id)
REFERENCES categories(id)
ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_source_type ON transactions(source_type);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, transaction_date DESC);

DROP TRIGGER IF EXISTS trg_transactions_set_updated_at ON transactions;
CREATE TRIGGER trg_transactions_set_updated_at
BEFORE UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
