import { Router, Request, Response } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import { supabase } from "../utils/database.js";

const router = Router();

// Get transactions for wallet
router.get(
  "/wallet/:walletId",
  asyncHandler(async (req: Request, res: Response) => {
    const { walletId } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const { data, error, count } = await supabase
      .from("transactions")
      .select("*", { count: "exact" })
      .eq("wallet_id", walletId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      success: true,
      data,
      pagination: { count, limit, offset },
    });
  })
);

// Record transaction
router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const {
      wallet_id,
      tx_hash,
      amount,
      type,
      status,
      counterparty,
    } = req.body;

    if (!wallet_id || !tx_hash || !amount || !type) {
      return res.status(400).json({
        success: false,
        error: { message: "Missing required fields" },
      });
    }

    const { data, error } = await supabase
      .from("transactions")
      .insert([
        {
          wallet_id,
          tx_hash,
          amount,
          type,
          status: status || "pending",
          counterparty: counterparty || "",
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data });
  })
);

// Update transaction status
router.patch(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    const { data, error } = await supabase
      .from("transactions")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  })
);

export default router;
