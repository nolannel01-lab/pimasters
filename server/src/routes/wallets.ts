import { Router, Request, Response } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import { supabase } from "../utils/database.js";

const router = Router();

interface WalletRequest extends Request {
  userId?: string;
}

// Get all wallets for user
router.get(
  "/",
  asyncHandler(async (req: WalletRequest, res: Response) => {
    const userId = req.query.user_id as string;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: { message: "user_id is required" },
      });
    }

    const { data, error } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({ success: true, data });
  })
);

// Get single wallet
router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("wallets")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  })
);

// Create wallet
router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const { user_id, label, public_key, watch_only } = req.body;

    if (!user_id || !label || !public_key) {
      return res.status(400).json({
        success: false,
        error: { message: "Missing required fields" },
      });
    }

    const { data, error } = await supabase
      .from("wallets")
      .insert([
        {
          user_id,
          label,
          public_key,
          watch_only: watch_only || true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data });
  })
);

// Update wallet
router.patch(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from("wallets")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  })
);

// Delete wallet
router.delete(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const { error } = await supabase.from("wallets").delete().eq("id", id);

    if (error) throw error;

    res.json({ success: true, message: "Wallet deleted" });
  })
);

export default router;
