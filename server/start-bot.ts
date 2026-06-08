import { initializeWhatsAppBot } from "./src/whatsapp-bot";

/**
 * WhatsApp Bot Server Entry Point
 * Run this to start the WhatsApp bot
 *
 * Usage:
 * npx ts-node server/start-bot.ts
 * OR
 * node -r esbuild-register server/start-bot.ts
 */

async function startBot() {
  console.log("🚀 Starting WhatsApp Bot...");

  try {
    const bot = await initializeWhatsAppBot();
    console.log("✅ WhatsApp bot initialized successfully!");
    console.log("📱 Scan the QR code in your terminal with your WhatsApp app");
    console.log("💡 Keep this process running to maintain the connection");

    // Handle graceful shutdown
    process.on("SIGINT", () => {
      console.log("\n⏹️ Shutting down bot...");
      process.exit(0);
    });
  } catch (error) {
    console.error("❌ Failed to start WhatsApp bot:", error);
    process.exit(1);
  }
}

startBot();
