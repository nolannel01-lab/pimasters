// filepath: server/src/routes/health.ts
import { Hono } from "hono";
import { cors } from "hono/cors";

export const healthRouter = new Hono();

healthRouter.use("*", cors());

healthRouter.get("/", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "pivault-server",
  });
});

healthRouter.get("/ready", (c) => {
  return c.json({ ready: true });
});