-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Wallets table
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  label TEXT NOT NULL,
  public_key TEXT NOT NULL UNIQUE,
  secret_key TEXT,
  watch_only BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Scheduled Payments table
CREATE TABLE IF NOT EXISTS scheduled_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL,
  destination TEXT NOT NULL,
  amount DECIMAL(20, 7) NOT NULL,
  start_time BIGINT NOT NULL,
  interval_ms BIGINT DEFAULT 0,
  is_recurring BOOLEAN DEFAULT FALSE,
  enabled BOOLEAN DEFAULT TRUE,
  completed BOOLEAN DEFAULT FALSE,
  next_run BIGINT NOT NULL,
  last_error TEXT,
  retrying BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_wallet FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL,
  tx_hash TEXT UNIQUE,
  direction TEXT NOT NULL CHECK (direction IN ('in', 'out', 'self', 'lock', 'unlock')),
  counterparty TEXT,
  amount DECIMAL(20, 7) NOT NULL,
  asset TEXT DEFAULT 'Pi',
  memo TEXT,
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failed', 'pending')),
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_wallet FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE
);

-- Payment History table
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id UUID NOT NULL,
  wallet_id UUID NOT NULL,
  amount DECIMAL(20, 7) NOT NULL,
  destination TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('success', 'error', 'retry')),
  tx_hash TEXT,
  message TEXT,
  executed_at BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_schedule FOREIGN KEY (schedule_id) REFERENCES scheduled_payments(id) ON DELETE CASCADE,
  CONSTRAINT fk_wallet FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE
);

-- Sweep History table
CREATE TABLE IF NOT EXISTS sweep_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('claim', 'send', 'error', 'check')),
  amount DECIMAL(20, 7),
  count INTEGER,
  tx_hash TEXT,
  message TEXT,
  executed_at BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_wallet FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_wallets_user_id ON wallets(user_id);
CREATE INDEX idx_scheduled_payments_wallet_id ON scheduled_payments(wallet_id);
CREATE INDEX idx_scheduled_payments_next_run ON scheduled_payments(next_run);
CREATE INDEX idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX idx_transactions_hash ON transactions(tx_hash);
CREATE INDEX idx_payment_history_schedule_id ON payment_history(schedule_id);
CREATE INDEX idx_payment_history_wallet_id ON payment_history(wallet_id);
CREATE INDEX idx_sweep_history_wallet_id ON sweep_history(wallet_id);

-- Row Level Security
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE sweep_history ENABLE ROW LEVEL SECURITY;

-- Policies for wallets
CREATE POLICY "Users can view their own wallets" ON wallets
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own wallets" ON wallets
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own wallets" ON wallets
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own wallets" ON wallets
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for scheduled_payments
CREATE POLICY "Users can view scheduled payments for their wallets" ON scheduled_payments
  FOR SELECT USING (
    wallet_id IN (
      SELECT id FROM wallets WHERE user_id = auth.uid()
    )
  );
CREATE POLICY "Users can manage scheduled payments for their wallets" ON scheduled_payments
  FOR INSERT WITH CHECK (
    wallet_id IN (
      SELECT id FROM wallets WHERE user_id = auth.uid()
    )
  );
CREATE POLICY "Users can update scheduled payments for their wallets" ON scheduled_payments
  FOR UPDATE USING (
    wallet_id IN (
      SELECT id FROM wallets WHERE user_id = auth.uid()
    )
  );
CREATE POLICY "Users can delete scheduled payments for their wallets" ON scheduled_payments
  FOR DELETE USING (
    wallet_id IN (
      SELECT id FROM wallets WHERE user_id = auth.uid()
    )
  );

-- Similar policies for other tables
CREATE POLICY "Users can view transaction history for their wallets" ON transactions
  FOR SELECT USING (
    wallet_id IN (
      SELECT id FROM wallets WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view payment history for their wallets" ON payment_history
  FOR SELECT USING (
    wallet_id IN (
      SELECT id FROM wallets WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view sweep history for their wallets" ON sweep_history
  FOR SELECT USING (
    wallet_id IN (
      SELECT id FROM wallets WHERE user_id = auth.uid()
    )
  );
