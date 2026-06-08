# Baileys WhatsApp Bot Setup Guide

## 📱 Overview
This guide explains how to set up and run the WhatsApp bot using Baileys in your PiVault project.

## ✅ Prerequisites
- Node.js and npm installed
- A valid WhatsApp account
- A smartphone with WhatsApp installed

## 🚀 Installation Steps

### 1. Packages Already Installed
The following packages have been added to your project:
- **baileys** - WhatsApp Web API library
- **qrcode-terminal** - Terminal QR code display
- **dotenv** - Environment variable management

### 2. Files Created
The following files have been created in your project:

#### `server/src/whatsapp-bot.ts`
Main WhatsApp bot service with:
- Bot initialization and connection handling
- Message reception and processing
- Command handling (!help, !status, !echo)
- Connection management and error handling

#### `server/start-bot.ts`
Entry point to start the WhatsApp bot server

## 📋 How to Use

### Step 1: Start the Bot
```bash
# Run from the project root
npm run dev  # or your development command

# In another terminal, start the bot
npx ts-node server/start-bot.ts
```

### Step 2: Scan QR Code
When you run the bot, you'll see:
1. A QR code will be displayed in the terminal
2. Open WhatsApp on your phone
3. Go to **Settings** → **Linked devices** (or **Linked Accounts**)
4. Click **Link a device** (or **Link a device**)
5. Scan the QR code with your phone camera
6. Once scanned, the bot will connect to your WhatsApp account

### Step 3: Test the Bot
Once connected, send messages to any chat:
- Type `!help` to see available commands
- Type `!status` to check if bot is online
- Type `!echo hello` to test the echo command

## 🛠️ Customize Bot Commands

Edit `server/src/whatsapp-bot.ts` in the `handleIncomingMessage` function to add your own commands:

```typescript
export async function handleIncomingMessage(
  sender: string,
  message: string
) {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.startsWith("!mycommand")) {
    await sendMessage(sender, "Your custom response here");
  }
  // Add more commands...
}
```

## 🔐 Security Considerations

⚠️ **Important:**
1. The `auth_info_baileys` folder contains authentication tokens
2. Add this to `.gitignore`: `auth_info_baileys/`
3. Never commit authentication files to version control
4. Keep your bot's process secure and monitored

## 📊 Features Included

✅ Auto-reconnection on disconnect
✅ QR code terminal display
✅ Message event handling
✅ Command parsing
✅ Error handling and logging
✅ Graceful shutdown

## 🐛 Troubleshooting

### Bot doesn't connect
- Ensure your phone's WhatsApp is using the same account
- Try logging out from Linked Devices and rescanning
- Delete `auth_info_baileys` folder and restart

### QR code not displaying
- Your terminal must support Unicode characters
- Try using Windows Terminal or PowerShell instead of CMD

### Messages not being received
- Ensure bot is running (keep terminal window open)
- Check console for any error messages
- Verify WhatsApp is properly linked

## 📚 Next Steps

1. **API Integration**: Create API endpoints in TanStack Start to trigger bot messages
2. **Message Queue**: Implement a queue system for message handling
3. **Database**: Store message history in Supabase
4. **Webhooks**: Set up incoming webhooks to trigger bot responses

## 🔗 Useful Resources
- [Baileys GitHub](https://github.com/WhiskeySockets/Baileys)
- [WhatsApp Bot Examples](https://github.com/WhiskeySockets/Baileys/blob/master/Example/example.js)
