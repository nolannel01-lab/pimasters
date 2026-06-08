# PiVault — Multi-Wallet Pi Network Dashboard

A comprehensive, production-grade web application for managing multiple Pi Network (Stellar-based) wallets in real-time. **PiVault** provides a unified dashboard to track balances, view lockup schedules, execute transactions, and automate sweeps—all while keeping your private keys secure in your browser.

## 🌟 Features

### Core Wallet Management
- **Multi-wallet support**: Track unlimited Pi Network wallets simultaneously
- **Watch-only mode**: Monitor public addresses without exposing private keys
- **Self-custody mode**: Full control with secret key import (keys stored only in browser localStorage)
- **Real-time balance tracking**: Available and locked balances with automatic 30-second refresh
- **Lockup schedules**: View unlock dates for matured and pending lockups

### Transaction Management
- **Send Pi**: Execute direct payments on Pi Mainnet with custom memos
- **Transaction history**: Full transaction record with links to blockchain explorer
- **Balance claims**: Automatic claiming of matured lockups
- **Auto-sweep**: Continuously sweep available balances to a configured destination
- **Scheduled payments**: Set up recurring automated transactions

### Advanced Features
- **WhatsApp Bot Integration**: Manage wallets and execute transactions via WhatsApp commands
- **Activity terminal**: Real-time activity feed showing all transaction events
- **Security alerts**: Built-in warnings for private key management
- **Responsive UI**: Beautiful, modern interface built with Radix UI and Tailwind CSS

## 🏗️ Architecture

### Frontend Stack
- **Framework**: TanStack Start (Full-stack React framework with Vite)
- **Router**: TanStack Router for file-based routing
- **UI Components**: Radix UI with Tailwind CSS
- **State Management**: React Query + Custom hooks
- **Forms**: React Hook Form with Zod validation

### Backend Stack
- **Blockchain**: Stellar SDK for Pi Network (Mainnet) interactions
- **Database**: Supabase (PostgreSQL) for scheduled payments storage
- **Server**: Node.js/Express via Vercel
- **Chat Integration**: Baileys (WhatsApp Web API)
- **Storage**: Cloudflare Workers for edge computing

### Key Services
- **Pi Network Service** (`src/lib/pi-network.ts`): Handles all blockchain transactions
- **Wallet Store** (`src/lib/wallet-store.ts`): Local storage management for wallet metadata
- **Auto-sweep Engine** (`src/lib/auto-sweep.ts`): Continuous balance monitoring and sweeping
- **Scheduled Payments** (`src/lib/scheduled-payment.ts`): Recurring transaction scheduler
- **WhatsApp Bot** (`server/src/whatsapp-bot.ts`): Message handling and command processing

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ (Bun 1.0+ recommended)
- Bun package manager (`npm install -g bun`)
- Pi Network wallet with public key and optional secret key
- Supabase account (for scheduled payments)
- Vercel account (for deployment)

### Installation

```bash
# Clone the repository
git clone https://github.com/nolannel01-lab/pimasters.git
cd pimasters

# Install dependencies
bun install

# Set up environment variables
cp .env.whatsapp.example .env.local
# Edit .env.local with your Supabase credentials and WhatsApp settings
```

### Development

```bash
# Start development server
bun run dev
# Access at http://localhost:5173

# Start WhatsApp bot (in separate terminal)
bun run server/start-bot.ts

# Build for production
bun run build

# Lint code
bun run lint

# Format code
bun run format
```

## 📋 Environment Variables

Create a `.env.local` file with the following:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# WhatsApp Bot (optional)
WHATSAPP_BOT_ENABLED=true
WHATSAPP_SESSION_DIR=./whatsapp-sessions

# API Configuration
VITE_API_URL=http://localhost:5173/api
VITE_PI_MAINNET_URL=https://api.mainnet.minepi.com
```

## 🔐 Security Considerations

### Private Key Management
- ✅ Keys are **never sent to any server**
- ✅ All transactions are **signed locally in your browser**
- ✅ Keys are stored only in **browser localStorage** (encrypted via browser security)
- ⚠️ **WARNING**: Anyone with access to your device can spend your Pi

### Best Practices
1. **Use watch-only mode** for maximum security (public key only)
2. **Never share your secret key** with anyone
3. **Use separate wallets** for hot (frequently used) and cold (stored) funds
4. **Enable 2FA** on your Supabase account
5. **Keep your browser and OS updated**

## 💰 Core Functionality

### Balance Tracking
```typescript
// Fetch wallet balance including locked amounts
const balance = await fetchWalletBalance("G...");
// Returns: { available, locked[], totalLocked, reserved, exists }
```

### Send Transactions
```typescript
// Send Pi from one wallet to another
const result = await sendPi({
  secret: "S...",        // Private key
  destination: "G...",   // Recipient address
  amount: "100.0",       // Amount in Pi
  memo: "Payment memo"   // Optional transaction memo
});
```

### Auto-sweep
```typescript
// Continuously claim matured lockups and forward to destination
startSweep();
subscribeSweep((events) => {
  console.log("Sweep event:", events);
});
```

### Scheduled Payments
```typescript
// Set up recurring automated payments
const schedule = {
  walletId: "wallet_123",
  destination: "G...",
  amount: "50.0",
  interval: "daily",     // daily, weekly, monthly
  enabled: true
};
```

## 📁 Project Structure

```
pimasters/
├── src/                           # Frontend source
│   ├── routes/                    # TanStack Router pages
│   │   ├── __root.tsx            # Root layout
│   │   └── index.tsx             # Dashboard
│   ├── components/                # React components
│   │   ├── WalletCard.tsx        # Wallet display
│   │   ├── SendDialog.tsx        # Transaction form
│   │   ├── ScheduledPaymentsDialog.tsx
│   │   └── ui/                   # Radix UI components
│   ├── lib/                       # Utilities and services
│   │   ├── pi-network.ts         # Stellar/Pi blockchain service
│   │   ├── wallet-store.ts       # Wallet state management
│   │   ├── auto-sweep.ts         # Auto-sweep engine
│   │   └── scheduled-payment.ts  # Payment scheduler
│   ├── hooks/                     # Custom React hooks
│   ├── styles/                    # Tailwind CSS
│   └── router.tsx                # Route configuration
├── server/                        # Backend source
│   ├── start-bot.ts              # WhatsApp bot entry
│   ├── src/
│   │   ├── whatsapp-bot.ts       # Bot logic
│   │   ├── api/                  # Express endpoints
│   │   └── utils/                # Server utilities
│   └── api/                       # Vercel serverless functions
├── supabase/                      # Database
│   ├── schema.sql                # Database schema
│   └── migrations/               # Migration files
├── docs/                          # Documentation
├── package.json                   # Dependencies
├── vite.config.ts                # Vite configuration
├── tsconfig.json                 # TypeScript config
├── wrangler.jsonc                # Cloudflare Workers config
└── README.md                      # This file
```

## 🔄 Deployment

### Deploy to GitHub
```bash
git init
git add .
git commit -m "Initial commit: PiVault multi-wallet dashboard"
git remote add origin https://github.com/nolannel01-lab/pimasters.git
git branch -M main
git push -u origin main
```

### Deploy to Vercel

1. **Connect Repository**
   - Go to [Vercel Dashboard](https://vercel.com)
   - Click "New Project"
   - Import from GitHub: `nolannel01-lab/pimasters`

2. **Configure Environment Variables**
   ```
   VITE_SUPABASE_URL
   VITE_SUPABASE_ANON_KEY
   VITE_PI_MAINNET_URL (optional, defaults to mainnet)
   WHATSAPP_BOT_ENABLED (optional)
   ```

3. **Build Settings**
   - **Framework Preset**: Other
   - **Build Command**: `bun run build`
   - **Output Directory**: `dist`
   - **Install Command**: `bun install`

4. **Frontend/Backend Separation**
   - **Frontend**: Deployed on Vercel CDN (automatic)
   - **API Routes**: `api/` directory (automatic serverless functions)
   - **WhatsApp Bot**: Run separately on own server (doesn't scale on Vercel)

### Deploy WhatsApp Bot

For continuous WhatsApp bot operation, deploy separately:

```bash
# Option 1: Railway.app
# Push to GitHub, connect Railway, set env variables

# Option 2: Replit
# Fork project, set environment variables, run

# Option 3: Your own server
npm install
npx ts-node server/start-bot.ts
```

## 📊 Database Schema

### Scheduled Payments Table
```sql
CREATE TABLE scheduled_payments (
  id UUID PRIMARY KEY,
  wallet_id TEXT NOT NULL,
  destination TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  interval TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  last_executed TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🛠️ API Endpoints

### Public API (no auth required for read)
- `GET /api/wallet/:publicKey` - Fetch wallet balance
- `GET /api/transactions/:publicKey` - Fetch transaction history

### Protected API (requires auth)
- `POST /api/send` - Send Pi transaction
- `GET /api/scheduled-payments` - List scheduled payments
- `POST /api/scheduled-payments` - Create scheduled payment

## 🐛 Troubleshooting

### Issue: "Access token not provided"
**Solution**: Run `supabase login` or set `SUPABASE_ACCESS_TOKEN` environment variable

### Issue: WhatsApp bot won't connect
**Solution**: 
1. Check internet connection
2. Make sure WhatsApp is installed on your phone
3. Scan QR code in terminal with WhatsApp
4. Check for duplicate bot instances

### Issue: Transactions fail with "Invalid destination"
**Solution**: Ensure destination is a valid Pi Network public key (starts with 'G', 43 characters)

### Issue: Balance not updating
**Solution**: 
1. Refresh page (F5)
2. Check Pi Mainnet API status: https://api.mainnet.minepi.com
3. Verify wallet exists on Pi Mainnet

## 📚 Documentation

- [Deployment Guide](./docs/deployment.md)
- [Supabase Setup](./docs/supabase-setup.md)
- [WhatsApp Bot Setup](./WHATSAPP_BOT_SETUP.md)
- [WhatsApp Security](./WHATSAPP_SECURITY.md)

## 📚 Pi Network Resources

- [Pi Network Documentation](https://docs.minepi.com)
- [Pi Mainnet API](https://pi-testnet-api-docs.appspot.com)
- [Stellar Documentation](https://developers.stellar.org)

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

**PiVault is provided as-is without any warranty.** Users are solely responsible for:
- Protecting their private keys
- Verifying transaction recipients
- Understanding Pi Network transaction fees
- Backing up their wallet recovery information

Always test with small amounts before transferring large quantities of Pi.

## 💬 Support

For issues and questions:
1. Check existing [GitHub Issues](https://github.com/nolannel01-lab/pimasters/issues)
2. Open a new issue with detailed information
3. Include environment details (OS, Node version, browser)

## 🙏 Acknowledgments

- Built with [TanStack](https://tanstack.com) frameworks
- UI components from [Radix UI](https://www.radix-ui.com)
- Blockchain via [Stellar SDK](https://developers.stellar.org)
- Database by [Supabase](https://supabase.com)
- Deployed on [Vercel](https://vercel.com)
- WhatsApp integration via [Baileys](https://github.com/WhiskeySockets/Baileys)

---

**Happy trading! 🚀**

*Last updated: 2026-06-08*
