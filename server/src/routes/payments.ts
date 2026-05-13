import { Router, Request, Response } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import { supabase } from "../utils/database.js";

const router = Router();

// Get scheduled payments
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.query.user_id as string;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: { message: "user_id is required" },
      });
    }

    const { data, error } = await supabase
      .from("scheduled_payments")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({ success: true, data });
  })
);

// Create scheduled payment
router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const {
      user_id,
      wallet_id,
      destination,
      amount,
      frequency,
      enabled,
    } = req.body;

    if (!user_id || !wallet_id || !destination || !amount || !frequency) {
      return res.status(400).json({
        success: false,
        error: { message: "Missing required fields" },
      });
    }

    const { data, error } = await supabase
      .from("scheduled_payments")
      .insert([
        {
          user_id,
          wallet_id,
          destination,
          amount,
          frequency,
          enabled: enabled || false,
          next_run: new Date().toISOString(),
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

// Update scheduled payment
router.patch(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from("scheduled_payments")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  })
);

// Delete scheduled payment
router.delete(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const { error } = await supabase
      .from("scheduled_payments")
      .delete()
      .eq("id", id);

    if (error) throw error;

    res.json({ success: true, message: "Scheduled payment deleted" });
  })
);

export default router;
