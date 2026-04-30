// filepath: server/src/routes/transaction.ts
import { Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";
import { getSupabase } from "../lib/supabase.js";
import { sendPayment } from "../lib/pi-network.js";

export const transactionRouter = new Hono();

transactionRouter.use("*", cors());

// Validation schemas
const SendPaymentBody = z.object({
  walletId: z.string(),
  toAddress: z.string(),
  amount: z.string().transform((v) => parseFloat(v)),
  memo: z.string().optional(),
});

// GET /api/transactions - List all transactions
transactionRouter.get("/", async (c) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    
    if (error) throw error;
    return c.json({ transactions: data || [] });
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

// GET /api/transactions/:id - Get single transaction
transactionRouter.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const supabase = getSupabase();
    
    const { data, error } = await supabase.from("transactions").select("*").eq("id", id).single();
    
    if (error) throw error;
    if (!data) return c.json({ error: "Transaction not found" }, 404);
    
    return c.json({ transaction: data });
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

// POST /api/transactions/send - Send payment
transactionRouter.post("/send", async (c) => {
  try {
    const body = await c.req.json();
    const validated = SendPaymentBody.parse(body);
    
    const supabase = getSupabase();
    
    // Get wallet secret
    const { data: wallet, error: walletError } = await supabase
      .from("wallets")
      .select("secret_encrypted, public_key")
      .eq("id", validated.walletId)
      .single();
    
    if (walletError) throw walletError;
    if (!wallet?.secret_encrypted) {
      return c.json({ error: "Wallet does not have a secret key (watch-only)" }, 400);
    }
    
    // Decrypt secret (in production, use proper encryption)
    const secret = wallet.secret_encrypted;
    
    // Send payment via Pi Network
    const result = await sendPayment(
      secret,
      validated.toAddress,
      validated.amount.toString(),
      validated.memo
    );
    
    // Record transaction in database
    const { data: txRecord, error: txError } = await supabase.from("transactions").insert({
      wallet_id: validated.walletId,
      tx_hash: result.hash,
      amount: validated.amount.toString(),
      type: "outgoing",
      status: "pending",
      counterparty: validated.toAddress,
    }).select().single();
    
    if (txError) throw txError;
    
    return c.json({ transaction: txRecord, result });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return c.json({ error: "Validation error", details: err.errors }, 400);
    }
    return c.json({ error: String(err) }, 500);
  }
});

// GET /api/transactions/wallet/:walletId - Get transactions for a wallet
transactionRouter.get("/wallet/:walletId", async (c) => {
  try {
    const walletId = c.req.param("walletId");
    const supabase = getSupabase();
    
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("wallet_id", walletId)
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    return c.json({ transactions: data || [] });
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});