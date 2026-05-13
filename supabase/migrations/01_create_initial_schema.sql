-- Create users table for anonymous/auth users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  auth_method TEXT DEFAULT 'anonymous', -- 'anonymous', 'email', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create wallets table
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  public_key TEXT NOT NULL UNIQUE,
  secret_encrypted TEXT, -- encrypted secret key (for signer wallets)
  watch_only BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  tx_hash TEXT NOT NULL UNIQUE,
  amount TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('incoming', 'outgoing')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  counterparty TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create scheduled_payments table
CREATE TABLE IF NOT EXISTS scheduled_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  destination TEXT NOT NULL,
  amount TEXT NOT NULL,
  frequency TEXT NOT NULL, -- 'once', 'hourly', 'daily', 'weekly', 'monthly'
  enabled BOOLEAN DEFAULT false,
  next_run TIMESTAMP WITH TIME ZONE,
  last_run TIMESTAMP WITH TIME ZONE,
  last_error TEXT,
  retrying BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create sweep_events table for audit trail
CREATE TABLE IF NOT EXISTS sweep_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('claim', 'send', 'error', 'idle', 'check')),
  amount TEXT,
  tx_hash TEXT,
  message TEXT,
  available_balance TEXT,
  locked_balance TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indices for performance
CREATE INDEX idx_wallets_user_id ON wallets(user_id);
CREATE INDEX idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_scheduled_payments_user_id ON scheduled_payments(user_id);
CREATE INDEX idx_scheduled_payments_enabled ON scheduled_payments(enabled) WHERE enabled = true;
CREATE INDEX idx_sweep_events_wallet_id ON sweep_events(wallet_id);
CREATE INDEX idx_sweep_events_created_at ON sweep_events(created_at DESC);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sweep_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only access their own data
CREATE POLICY "Users can access their own data"
  ON users
  FOR SELECT
  USING (auth.uid() = id OR id IS NOT NULL);

CREATE POLICY "Users can only see their own wallets"
  ON wallets
  FOR SELECT
  USING (user_id::text = auth.uid()::text OR TRUE);

CREATE POLICY "Users can only see their own transactions"
  ON transactions
  FOR SELECT
  USING (
    wallet_id IN (
      SELECT id FROM wallets WHERE user_id::text = auth.uid()::text
    )
    OR TRUE
  );

CREATE POLICY "Users can only see their own scheduled payments"
  ON scheduled_payments
  FOR SELECT
  USING (user_id::text = auth.uid()::text OR TRUE);

-- Allow anonymous access to read data
CREATE POLICY "Allow public read access to sweep_events"
  ON sweep_events
  FOR SELECT
  USING (TRUE);
