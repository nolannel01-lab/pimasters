// filepath: server/src/index.ts
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { timing } from "hono/timing";
import { serve } from "@hono/node-server";
import { healthRouter } from "./routes/health.js";
import { walletRouter } from "./routes/wallet.js";
import { transactionRouter } from "./routes/transaction.js";

const app = new Hono();

app.use("*", logger());
app.use("*", timing());
app.use("*", cors());

app.route("/health", healthRouter);
app.route("/api/wallets", walletRouter);
app.route("/api/transactions", transactionRouter);

app.notFound(() => c => c.json({ message: "Not Found" }, 404));

const port = parseInt(process.env.PORT || "3000");

console.log(`🚀 PiVault Server starting on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});