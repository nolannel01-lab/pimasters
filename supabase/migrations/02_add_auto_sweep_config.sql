-- Migration: Add auto-sweep configuration table
CREATE TABLE IF NOT EXISTS auto_sweep_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  destination TEXT NOT NULL,
  enabled BOOLEAN DEFAULT false,
  poll_interval_ms INTEGER DEFAULT 1000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE auto_sweep_config ENABLE ROW LEVEL SECURITY;

-- Create policy for auto_sweep_config
CREATE POLICY "Users can only see their own sweep config"
  ON auto_sweep_config
  FOR SELECT
  USING (user_id::text = auth.uid()::text OR TRUE);

-- Create index
CREATE INDEX idx_auto_sweep_config_user_id ON auto_sweep_config(user_id);
