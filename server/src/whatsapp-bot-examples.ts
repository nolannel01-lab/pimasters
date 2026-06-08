/**
 * Advanced WhatsApp Bot Examples
 * These examples show how to integrate Baileys with your TanStack Start application
 */

import { sendMessage, getSocket } from "./src/whatsapp-bot";

// Example 1: Send message from API endpoint
export async function sendMessageFromAPI(phoneNumber: string, text: string) {
  // Format: "5511999999999@s.whatsapp.net" (country code + phone number)
  const chatId = `${phoneNumber}@s.whatsapp.net`;

  try {
    await sendMessage(chatId, text);
    return { success: true, message: "Message sent" };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

// Example 2: Send message to group
export async function sendGroupMessage(groupId: string, text: string) {
  const socket = getSocket();
  if (!socket) {
    throw new Error("Bot not connected");
  }

  try {
    await socket.sendMessage(groupId, { text });
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

// Example 3: Send message with media
export async function sendMediaMessage(
  chatId: string,
  mediaPath: string,
  caption?: string
) {
  const socket = getSocket();
  if (!socket) {
    throw new Error("Bot not connected");
  }

  try {
    const fs = await import("fs");
    const media = fs.readFileSync(mediaPath);
    const mimeType = getMimeType(mediaPath);

    await socket.sendMessage(chatId, {
      image: media,
      caption: caption || "",
      mimetype: mimeType,
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

// Example 4: Fetch contact information
export async function getContactInfo(phoneNumber: string) {
  const socket = getSocket();
  if (!socket) {
    throw new Error("Bot not connected");
  }

  try {
    const chatId = `${phoneNumber}@s.whatsapp.net`;
    const contact = await socket.getContactMessage(chatId);
    return contact;
  } catch (error) {
    return null;
  }
}

// Example 5: Send payment message (if supported)
export async function sendPaymentNotification(
  phoneNumber: string,
  amount: number,
  description: string
) {
  const chatId = `${phoneNumber}@s.whatsapp.net`;
  const message = `💰 Payment Notification\n\nAmount: $${amount}\nDescription: ${description}\n\nThank you for using PiVault!`;

  try {
    await sendMessage(chatId, message);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

// Example 6: Schedule messages using node-schedule
export async function scheduleMessage(
  chatId: string,
  text: string,
  cronExpression: string
) {
  // You'll need to: npm install node-schedule
  try {
    const schedule = await import("node-schedule");

    schedule.scheduleJob(cronExpression, async () => {
      await sendMessage(chatId, text);
      console.log(`Scheduled message sent to ${chatId}`);
    });

    return { success: true, message: "Message scheduled" };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

// Helper function to get MIME type
function getMimeType(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase();
  const mimeTypes: { [key: string]: string } = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    pdf: "application/pdf",
    mp3: "audio/mpeg",
    mp4: "video/mp4",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };
  return mimeTypes[ext || ""] || "application/octet-stream";
}

// Example 7: AI-powered response using OpenAI (requires: npm install openai)
/*
export async function getAIResponse(userMessage: string) {
  try {
    const { OpenAI } = await import("openai");
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful WhatsApp bot assistant for PiVault",
        },
        { role: "user", content: userMessage },
      ],
      max_tokens: 100,
    });

    return response.choices[0].message.content;
  } catch (error) {
    return "I apologize, I couldn't process that request.";
  }
}
*/

// Example 8: Handle automated responses with delay
export async function sendDelayedResponse(
  chatId: string,
  messages: string[],
  delayMs: number = 2000
) {
  for (const msg of messages) {
    await sendMessage(chatId, msg);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}
