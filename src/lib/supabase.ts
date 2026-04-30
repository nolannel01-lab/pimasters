import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env");
}

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");

// Database table types
export interface DatabaseWallet {
  id: string;
  user_id: string;
  label: string;
  public_key: string;
  secret_encrypted: string | null;
  watch_only: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatabaseTransaction {
  id: string;
  wallet_id: string;
  tx_hash: string;
  amount: string;
  type: "incoming" | "outgoing";
  status: "pending" | "confirmed" | "failed";
  counterparty: string;
  created_at: string;
}