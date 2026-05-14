import express, { Express, Request, Response } from "express";
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

// Health check - route will be /api/health when called through Vercel
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API routes - will be at /api/wallets, /api/transactions, /api/payments
app.use("/wallets", walletRoutes);
app.use("/transactions", transactionRoutes);
app.use("/payments", paymentRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Export for Vercel serverless function
export default app;
