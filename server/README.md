# PiVault Backend Server

Express.js server for PiVault Pi Network wallet dashboard with Supabase integration.

## Features

- REST API for wallet management
- Transaction tracking
- Scheduled payment management
- Auto-sweep event logging
- Supabase integration with Row Level Security

## Setup

### Prerequisites

- Node.js 18+
- Supabase project credentials

### Installation

```bash
npm install
```

### Environment Variables

Create `.env` file:

```
VITE_SUPABASE_URL=https://cdqxnujteyxbygaxlwsq.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_kpCQP9FzLYcUhp4aeQCpnw_mj_kxZox
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:Lidlesh344!!@db.cdqxnujteyxbygaxlwsq.supabase.co:5432/postgres
FRONTEND_URL=http://localhost:5173
```

### Development

```bash
npm run dev
```

Server runs on `http://localhost:3000`

### Build

```bash
npm run build
npm start
```

### Database Migrations

```bash
# Login to Supabase
supabase login

# Link to existing project
supabase link --project-ref cdqxnujteyxbygaxlwsq

# Push migrations
supabase db push

# Run migrations
supabase migration up
```

## API Endpoints

### Wallets

- `GET /api/wallets?user_id=<id>` - Get user's wallets
- `GET /api/wallets/:id` - Get wallet details
- `POST /api/wallets` - Create wallet
- `PATCH /api/wallets/:id` - Update wallet
- `DELETE /api/wallets/:id` - Delete wallet

### Transactions

- `GET /api/transactions/wallet/:walletId` - Get wallet transactions
- `POST /api/transactions` - Record transaction
- `PATCH /api/transactions/:id` - Update transaction

### Scheduled Payments

- `GET /api/payments?user_id=<id>` - Get user's scheduled payments
- `POST /api/payments` - Create scheduled payment
- `PATCH /api/payments/:id` - Update scheduled payment
- `DELETE /api/payments/:id` - Delete scheduled payment

### Health

- `GET /api/health` - Server health check

## Deployment

### Vercel

1. Connect GitHub repository
2. Select `server` folder as root directory
3. Set environment variables in Vercel dashboard
4. Deploy

## Project Structure

```
server/
├── src/
│   ├── index.ts           # Main Express app
│   ├── routes/            # API endpoints
│   │   ├── wallets.ts
│   │   ├── transactions.ts
│   │   └── payments.ts
│   ├── middleware/        # Express middleware
│   │   └── errorHandler.ts
│   └── utils/             # Utilities
│       └── database.ts    # Supabase client
├── dist/                  # Compiled output
├── package.json
├── tsconfig.json
└── .env
```

## License

MIT
