// filepath: server/src/routes/wallet.ts
import { Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";
import { getSupabase } from "../lib/supabase.js";
import { getWalletBalance, getTransactions, sendPayment } from "../lib/pi-network.js";

export const walletRouter = new Hono();

walletRouter.use("*", cors());

// Validation schemas
const WalletParams = z.object({
  id: z.string(),
});

const CreateWalletBody = z.object({
  label: z.string().min(1).max(100),
  publicKey: z.string(),
  secretEncrypted: z.string().optional(),
  watchOnly: z.boolean().default(false),
});

const UpdateWalletBody = z.object({
  label: z.string().min(1).max(100).optional(),
});

// GET /api/wallets - List all wallets
walletRouter.get("/", async (c) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.from("wallets").select("*").order("created_at", { ascending: false });
    
    if (error) throw error;
    return c.json({ wallets: data || [] });
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

// GET /api/wallets/:id - Get single wallet with balance
walletRouter.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const supabase = getSupabase();
    
    const { data: wallet, error } = await supabase.from("wallets").select("*").eq("id", id).single();
    
    if (error) throw error;
    if (!wallet) return c.json({ error: "Wallet not found" }, 404);
    
    // Get balance from Pi Network
    const balance = await getWalletBalance(wallet.public_key);
    
    return c.json({ wallet: { ...wallet, balance } });
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

// POST /api/wallets - Create new wallet
walletRouter.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const validated = CreateWalletBody.parse(body);
    
    const supabase = getSupabase();
    const { data, error } = await supabase.from("wallets").insert({
      label: validated.label,
      public_key: validated.publicKey,
      secret_encrypted: validated.secretEncrypted || null,
      watch_only: validated.watchOnly,
    }).select().single();
    
    if (error) throw error;
    return c.json({ wallet: data }, 201);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return c.json({ error: "Validation error", details: err.errors }, 400);
    }
    return c.json({ error: String(err) }, 500);
  }
});

// PUT /api/wallets/:id - Update wallet
walletRouter.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const validated = UpdateWalletBody.parse(body);
    
    const supabase = getSupabase();
    const { data, error } = await supabase.from("wallets").update({
      label: validated.label,
      updated_at: new Date().toISOString(),
    }).eq("id", id).select().single();
    
    if (error) throw error;
    return c.json({ wallet: data });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return c.json({ error: "Validation error", details: err.errors }, 400);
    }
    return c.json({ error: String(err) }, 500);
  }
});

// DELETE /api/wallets/:id - Delete wallet
walletRouter.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const supabase = getSupabase();
    
    const { error } = await supabase.from("wallets").delete().eq("id", id);
    
    if (error) throw error;
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

// GET /api/wallets/:id/balance - Get wallet balance
walletRouter.get("/:id/balance", async (c) => {
  try {
    const id = c.req.param("id");
    const supabase = getSupabase();
    
    const { data: wallet, error } = await supabase.from("wallets").select("public_key").eq("id", id).single();
    
    if (error) throw error;
    if (!wallet) return c.json({ error: "Wallet not found" }, 404);
    
    const balance = await getWalletBalance(wallet.public_key);
    return c.json(balance);
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

// GET /api/wallets/:id/transactions - Get wallet transactions
walletRouter.get("/:id/transactions", async (c) => {
  try {
    const id = c.req.param("id");
    const supabase = getSupabase();
    
    const { data: wallet, error } = await supabase.from("wallets").select("public_key").eq("id", id).single();
    
    if (error) throw error;
    if (!wallet) return c.json({ error: "Wallet not found" }, 404);
    
    const transactions = await getTransactions(wallet.public_key);
    return c.json({ transactions });
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});