-- PiVault Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor to create the required tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Wallets table
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL, -- Anonymous user identifier (device/browser based)
  label TEXT NOT NULL,
  public_key TEXT NOT NULL UNIQUE,
  secret_encrypted TEXT, -- Encrypted secret key (only for non-watch-only wallets)
  watch_only BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_public_key ON wallets(public_key);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  tx_hash TEXT NOT NULL,
  amount TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('incoming', 'outgoing')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  counterparty TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_tx_hash ON transactions(tx_hash);

-- Enable Row Level Security (RLS)
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policy for wallets (users can only see their own wallets)
CREATE POLICY "Users can manage their own wallets" ON wallets
  FOR ALL
  USING (user_id = current_setting('app.current_user_id', true));

-- RLS Policy for transactions (users can only see their own transactions)
CREATE POLICY "Users can manage their own transactions" ON transactions
  FOR ALL
  USING (
    wallet_id IN (
      SELECT id FROM wallets WHERE user_id = current_setting('app.current_user_id', true)
    )
  );