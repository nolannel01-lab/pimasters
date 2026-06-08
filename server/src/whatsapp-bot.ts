import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
} from "baileys";
import { Boom } from "@hapi/boom";
import qrcodeTerminal from "qrcode-terminal";

let socket: any;
let socketStatus = false;

export async function initializeWhatsAppBot() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState(
      "./auth_info_baileys"
    );

    socket = makeWASocket({
      auth: state,
      printQRInTerminal: true,
    });

    socket.ev.on("connection.update", async (update: any) => {
      const { connection, lastDisconnect } = update;

      if (connection === "close") {
        socketStatus = false;
        let reason = new Boom(lastDisconnect?.error).output.statusCode;

        if (
          reason === DisconnectReason.badSession ||
          reason === DisconnectReason.connectionClosed ||
          reason === DisconnectReason.connectionLost ||
          reason === DisconnectReason.connectionReplaced ||
          reason === DisconnectReason.restartRequired ||
          reason === DisconnectReason.timedOut
        ) {
          console.log("Connection closed, reconnecting...");
          initializeWhatsAppBot();
        } else if (reason === DisconnectReason.loggedOut) {
          console.log("Device logged out");
        } else {
          socket?.ws?.close();
        }
      } else if (connection === "open") {
        socketStatus = true;
        console.log("✅ WhatsApp bot connected successfully!");
      } else if (connection === "connecting") {
        console.log("🔄 Connecting to WhatsApp...");
      }
    });

    socket.ev.on("creds.update", saveCreds);

    socket.ev.on("messages.upsert", async (m: any) => {
      const message = m.messages[0];

      if (!message.message) return;
      if (message.key.fromMe) return; // Ignore own messages
      if (message.key.remoteJid === "status@broadcast") return; // Ignore status updates

      const sender = message.key.remoteJid;
      const text = message.message.conversation
        ? message.message.conversation
        : message.message.extendedTextMessage?.text || "";

      console.log(`📩 Message from ${sender}: ${text}`);

      // Handle incoming messages
      handleIncomingMessage(sender, text);
    });

    return socket;
  } catch (error) {
    console.error("WhatsApp Bot Error:", error);
    throw error;
  }
}

export async function handleIncomingMessage(
  sender: string,
  message: string
) {
  const lowerMessage = message.toLowerCase();

  // Simple command handling
  if (lowerMessage.startsWith("!help")) {
    await sendMessage(
      sender,
      "🤖 WhatsApp Bot Commands:\n\n!help - Show this help message\n!status - Get bot status\n!echo [text] - Echo text back to you"
    );
  } else if (lowerMessage === "!status") {
    await sendMessage(sender, "✅ Bot is online and working!");
  } else if (lowerMessage.startsWith("!echo")) {
    const echoText = message.substring(5).trim();
    if (echoText) {
      await sendMessage(sender, `Echo: ${echoText}`);
    }
  } else {
    // Default response
    await sendMessage(
      sender,
      "👋 Hello! I'm a WhatsApp bot. Type !help for available commands."
    );
  }
}

export async function sendMessage(chatId: string, text: string) {
  try {
    if (!socket || !socketStatus) {
      console.error("Socket not connected");
      return;
    }

    await socket.sendMessage(chatId, { text });
    console.log(`✉️ Message sent to ${chatId}`);
  } catch (error) {
    console.error("Error sending message:", error);
  }
}

export async function disconnectBot() {
  if (socket) {
    socket.ws?.close();
    socketStatus = false;
    console.log("WhatsApp bot disconnected");
  }
}

export function getSocketStatus() {
  return socketStatus;
}

export function getSocket() {
  return socket;
}
