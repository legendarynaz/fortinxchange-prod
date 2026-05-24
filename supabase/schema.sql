-- 4ortin-X Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Fee Transactions Table
CREATE TABLE IF NOT EXISTS fee_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK(type IN ('swap', 'onramp', 'bridge', 'nft', 'premium')),
  user_address TEXT,
  chain_id INTEGER NOT NULL,
  tx_hash TEXT UNIQUE,
  
  -- Amounts
  gross_amount TEXT NOT NULL,
  fee_amount TEXT NOT NULL,
  fee_percent DECIMAL(5,2) NOT NULL,
  fee_usd DECIMAL(18,2),
  
  -- Token info
  token_symbol TEXT,
  token_address TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'failed')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  
  -- Metadata (JSON)
  metadata JSONB
);

-- Daily Revenue Aggregates
CREATE TABLE IF NOT EXISTS daily_revenue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  chain_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  
  -- Totals
  transaction_count INTEGER DEFAULT 0,
  total_volume_usd DECIMAL(18,2) DEFAULT 0,
  total_fees_usd DECIMAL(18,2) DEFAULT 0,
  
  -- Unique users
  unique_users INTEGER DEFAULT 0,
  
  UNIQUE(date, chain_id, type)
);

-- User Tiers (premium subscriptions)
CREATE TABLE IF NOT EXISTS user_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  address TEXT UNIQUE NOT NULL,
  tier TEXT NOT NULL CHECK(tier IN ('standard', 'premium', 'vip')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wallet Balances (tracked from blockchain)
CREATE TABLE IF NOT EXISTS wallet_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chain_id INTEGER NOT NULL,
  token_address TEXT NOT NULL,
  token_symbol TEXT NOT NULL,
  balance TEXT NOT NULL,
  balance_usd DECIMAL(18,2),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(chain_id, token_address)
);

-- Admin Users
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'admin' CHECK(role IN ('admin', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- Withdrawal Records
CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chain_id INTEGER NOT NULL,
  to_address TEXT NOT NULL,
  token_address TEXT NOT NULL,
  token_symbol TEXT NOT NULL,
  amount TEXT NOT NULL,
  amount_usd DECIMAL(18,2),
  tx_hash TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'submitted', 'confirmed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  created_by TEXT
);

-- Email Verification Codes
CREATE TABLE IF NOT EXISTS email_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  user_address TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Price Alerts
CREATE TABLE IF NOT EXISTS price_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_address TEXT NOT NULL,
  user_email TEXT,
  token_symbol TEXT NOT NULL,
  token_address TEXT,
  chain_id INTEGER DEFAULT 1,
  target_price DECIMAL(18,8) NOT NULL,
  condition TEXT NOT NULL CHECK(condition IN ('above', 'below')),
  is_triggered BOOLEAN DEFAULT FALSE,
  triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Notification Settings
CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_address TEXT UNIQUE NOT NULL,
  email TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  notify_transactions BOOLEAN DEFAULT TRUE,
  notify_price_alerts BOOLEAN DEFAULT TRUE,
  notify_security BOOLEAN DEFAULT TRUE,
  notify_marketing BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_fee_transactions_user ON fee_transactions(user_address);
CREATE INDEX IF NOT EXISTS idx_fee_transactions_type ON fee_transactions(type);
CREATE INDEX IF NOT EXISTS idx_fee_transactions_chain ON fee_transactions(chain_id);
CREATE INDEX IF NOT EXISTS idx_fee_transactions_created ON fee_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_fee_transactions_status ON fee_transactions(status);
CREATE INDEX IF NOT EXISTS idx_daily_revenue_date ON daily_revenue(date);
CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email);
CREATE INDEX IF NOT EXISTS idx_price_alerts_user ON price_alerts(user_address);
CREATE INDEX IF NOT EXISTS idx_price_alerts_token ON price_alerts(token_symbol);

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE fee_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- Public read access for public stats
CREATE POLICY "Public can view confirmed transactions count" ON fee_transactions
  FOR SELECT USING (status = 'confirmed');

-- Service role has full access (for API routes)
CREATE POLICY "Service role full access to fee_transactions" ON fee_transactions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to user_tiers" ON user_tiers
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to email_verifications" ON email_verifications
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to price_alerts" ON price_alerts
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to user_notifications" ON user_notifications
  FOR ALL USING (auth.role() = 'service_role');
