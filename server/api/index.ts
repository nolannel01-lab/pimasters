import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import walletRoutes from "../src/routes/wallets.js";
import transactionRoutes from "../src/routes/transactions.js";
import paymentRoutes from "../src/routes/payments.js";
import { errorHandler, notFound } from "../src/middleware/errorHandler.js";

dotenv.config();

const app: Express = express();

// CORS configuration
const FRONTEND_URL = process.env.FRONTEND_URL || "https://pivault-alpha.vercel.app";

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/wallets", walletRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/payments", paymentRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Export for Vercel handler
export default app;

// Also export as a default handler for serverless
export const handler = app;

