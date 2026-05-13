# Deployment Guide - PiVault

This guide covers deploying PiVault to Vercel with separate frontend and backend projects.

## Prerequisites

- GitHub account with the repository pushed
- Vercel account
- Supabase credentials

## Project Structure

```
pivault/
├── src/                    # Frontend React code
├── public/                 # Static assets
├── package.json           # Frontend dependencies
├── vercel.json            # Frontend Vercel config
└── server/                # Backend Express API
    ├── src/               # API source code
    ├── package.json       # Backend dependencies
    └── vercel.json        # Backend Vercel config
```

## Deployment Steps

### 1. Frontend Deployment (Vercel)

1. Go to https://vercel.com/new
2. Select "Import Git Repository"
3. Find and select `https://github.com/metrogain09-cmd/pivault`
4. **Important**: Set the "Root Directory" to `./` (default - not "server")
5. Click "Environment Variables" and add:
   - `VITE_SUPABASE_URL`: `https://cdqxnujteyxbygaxlwsq.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `sb_publishable_kpCQP9FzLYcUhp4aeQCpnw_mj_kxZox`
   - `VITE_API_URL`: `https://your-backend-domain.vercel.app/api` (set after backend deployment)
6. Click "Deploy"

### 2. Backend Deployment (Vercel)

1. Go to https://vercel.com/new
2. Select "Import Git Repository"
3. Find and select `https://github.com/metrogain09-cmd/pivault`
4. **Important**: Set the "Root Directory" to `./server`
5. Click "Environment Variables" and add:
   - `VITE_SUPABASE_URL`: `https://cdqxnujteyxbygaxlwsq.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `sb_publishable_kpCQP9FzLYcUhp4aeQCpnw_mj_kxZox`
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase Service Role Key (from Supabase Dashboard > Settings > API)
   - `PORT`: `3000`
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: `postgresql://postgres:Lidlesh344!!@db.cdqxnujteyxbygaxlwsq.supabase.co:5432/postgres`
   - `FRONTEND_URL`: `https://your-frontend-domain.vercel.app` (your frontend Vercel URL)
6. Click "Deploy"

### 3. Update Frontend Environment (After Backend Deployment)

1. Go to Frontend project settings on Vercel
2. Update `VITE_API_URL` environment variable with your backend URL: `https://your-backend-domain.vercel.app/api`
3. Redeploy frontend

## Environment Variables Reference

### Frontend (.env / .env.local)
```
VITE_SUPABASE_URL=https://cdqxnujteyxbygaxlwsq.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_kpCQP9FzLYcUhp4aeQCpnw_mj_kxZox
VITE_API_URL=https://your-backend.vercel.app/api
```

### Backend (server/.env)
```
VITE_SUPABASE_URL=https://cdqxnujteyxbygaxlwsq.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_kpCQP9FzLYcUhp4aeQCpnw_mj_kxZox
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
PORT=3000
NODE_ENV=production
DATABASE_URL=postgresql://postgres:Lidlesh344!!@db.cdqxnujteyxbygaxlwsq.supabase.co:5432/postgres
FRONTEND_URL=https://your-frontend.vercel.app
```

## API Endpoints (After Backend Deployment)

- Health Check: `https://your-backend.vercel.app/api/health`
- Wallets: `https://your-backend.vercel.app/api/wallets`
- Transactions: `https://your-backend.vercel.app/api/transactions`
- Payments: `https://your-backend.vercel.app/api/payments`

## Supabase Service Role Key

To get the Service Role Key:
1. Go to https://app.supabase.com
2. Select your project
3. Go to Settings → API
4. Find "Service Role Key" under "Project API Keys"
5. Copy the key (keep it secret!)

## Local Development

### Terminal 1 - Frontend
```bash
npm run dev
```
Runs on http://localhost:5173

### Terminal 2 - Backend
```bash
cd server
npm run dev
```
Runs on http://localhost:3000

## Database

The Supabase database is already configured with:
- Users table (for anonymous users)
- Wallets table (stores wallet data)
- Transactions table (stores transaction history)
- Scheduled Payments table (for automated payments)
- Auto Sweep Config table (for auto-sweep settings)
- Row Level Security (RLS) policies enabled

Migrations were applied via CLI:
```bash
supabase db push
```

## Troubleshooting

### CORS Issues
Make sure the backend's `FRONTEND_URL` environment variable matches your frontend's actual Vercel URL.

### Database Connection Issues
Verify the `DATABASE_URL` is correct and the IP whitelist on Supabase includes Vercel's IP range.

### Service Role Key Issues
Regenerate it from Supabase Dashboard if needed (Settings → API).

## What's Next?

1. Deploy both projects on Vercel
2. Update frontend with the backend API URL
3. Test API connectivity from frontend
4. Monitor deployments in Vercel Dashboard
5. Set up custom domain (optional)
