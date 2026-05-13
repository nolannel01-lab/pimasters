# ✅ PiVault Deployment Checklist

## What's Been Done ✓

✅ Server folder created with Express.js backend
✅ Database schema created in Supabase with SQL migrations
✅ Supabase project linked and configured
✅ Database migrations pushed to Supabase
✅ Project pushed to GitHub: https://github.com/metrogain09-cmd/pivault
✅ Environment variables configured for both frontend and backend
✅ API routes created (Wallets, Transactions, Payments)

## Next Steps: Deploy to Vercel

### Step 1: Deploy Frontend to Vercel

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Login with GitHub if prompted
4. Search for and select: `metrogain09-cmd/pivault`
5. **IMPORTANT**: Leave "Root Directory" empty or set to `./` (this deploys from root)
6. Click "Environment Variables" and add:
   ```
   VITE_SUPABASE_URL = https://cdqxnujteyxbygaxlwsq.supabase.co
   VITE_SUPABASE_ANON_KEY = sb_publishable_kpCQP9FzLYcUhp4aeQCpnw_mj_kxZox
   VITE_API_URL = http://localhost:3000/api
   ```
7. Click "Deploy" and wait for build to complete
8. Note the frontend URL (e.g., `https://pivault.vercel.app`)

### Step 2: Deploy Backend to Vercel

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Search for and select: `metrogain09-cmd/pivault`
4. **IMPORTANT**: Set "Root Directory" to `./server`
5. Click "Environment Variables" and add:
   ```
   VITE_SUPABASE_URL = https://cdqxnujteyxbygaxlwsq.supabase.co
   VITE_SUPABASE_ANON_KEY = sb_publishable_kpCQP9FzLYcUhp4aeQCpnw_mj_kxZox
   SUPABASE_SERVICE_ROLE_KEY = [Get from Supabase Dashboard > Settings > API]
   PORT = 3000
   NODE_ENV = production
   DATABASE_URL = postgresql://postgres:Lidlesh344!!@db.cdqxnujteyxbygaxlwsq.supabase.co:5432/postgres
   FRONTEND_URL = https://your-frontend-name.vercel.app
   ```
6. Click "Deploy" and wait for build to complete
7. Note the backend URL (e.g., `https://pivault-api.vercel.app`)

### Step 3: Get Supabase Service Role Key

1. Go to https://app.supabase.com
2. Login and select your project
3. Click "Settings" → "API"
4. Find "Service Role Key" under "Project API Keys"
5. Copy the key (⚠️ Keep this SECRET!)

### Step 4: Update Frontend with Backend API URL

After backend deployment:

1. Go to Vercel frontend project settings
2. Click "Environment Variables"
3. Update `VITE_API_URL` to your backend URL:
   ```
   VITE_API_URL = https://your-backend-name.vercel.app/api
   ```
4. Click "Deployments" → "Redeploy" to rebuild with new URL

## Database Status

✅ Supabase Database Initialized with:
- Users table
- Wallets table
- Transactions table
- Scheduled Payments table
- Auto Sweep Config table
- Row Level Security (RLS) enabled
- Proper indexes for performance

All tables are ready to use!

## API Endpoints (After Backend Deploy)

```
GET    /api/health
GET    /api/wallets?user_id=<id>
GET    /api/wallets/:id
POST   /api/wallets
PATCH  /api/wallets/:id
DELETE /api/wallets/:id

GET    /api/transactions/wallet/:walletId
POST   /api/transactions
PATCH  /api/transactions/:id

GET    /api/payments?user_id=<id>
POST   /api/payments
PATCH  /api/payments/:id
DELETE /api/payments/:id
```

## Local Development (Before Deploying)

### Terminal 1: Frontend
```bash
npm install
npm run dev
```
Runs on http://localhost:5173

### Terminal 2: Backend
```bash
cd server
npm install
npm run dev
```
Runs on http://localhost:3000

### Verify Database Connection
```bash
# Test Supabase connection
node -e "const {supabase} = require('./server/dist/utils/database'); supabase.from('wallets').select('*').then(r => console.log('Connected:', r.data))"
```

## Environment Variable Guide

### Frontend (`/.env` or `/.env.local`)
```
VITE_SUPABASE_URL=https://cdqxnujteyxbygaxlwsq.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_kpCQP9FzLYcUhp4aeQCpnw_mj_kxZox
VITE_API_URL=https://your-backend.vercel.app/api
```

### Backend (`/server/.env`)
```
VITE_SUPABASE_URL=https://cdqxnujteyxbygaxlwsq.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_kpCQP9FzLYcUhp4aeQCpnw_mj_kxZox
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PORT=3000
NODE_ENV=production
DATABASE_URL=postgresql://postgres:Lidlesh344!!@db.cdqxnujteyxbygaxlwsq.supabase.co:5432/postgres
FRONTEND_URL=https://your-frontend.vercel.app
```

## Troubleshooting

### CORS Issues
- Verify `FRONTEND_URL` in backend environment matches your frontend Vercel URL
- Check backend has proper CORS headers configured

### Database Connection Errors
- Verify `DATABASE_URL` is correct
- Check Supabase project allows remote connections
- Verify `SUPABASE_SERVICE_ROLE_KEY` is correct

### Build Failures
- Check Node.js version (18+ required)
- Run `npm install` in both root and `server/` folders
- Verify TypeScript compiles: `npm run build` in each folder

## Repository Information

- **GitHub**: https://github.com/metrogain09-cmd/pivault
- **Supabase Project**: https://app.supabase.com
  - Project URL: https://cdqxnujteyxbygaxlwsq.supabase.co
  - Project Ref: cdqxnujteyxbygaxlwsq

## File Structure for Vercel

```
pivault/                          ← Frontend Root
├── src/                          ← React source
├── package.json                  ← Frontend dependencies
├── vercel.json                   ← Frontend Vercel config
├── vite.config.ts
├── tsconfig.json
└── server/                       ← Backend Root (separate Vercel project)
    ├── src/
    │   ├── index.ts              ← Express entry point
    │   ├── routes/               ← API endpoints
    │   ├── middleware/
    │   └── utils/
    ├── package.json              ← Backend dependencies
    ├── vercel.json               ← Backend Vercel config
    └── tsconfig.json
```

## Quick Links

- Vercel New Project: https://vercel.com/new
- Supabase Dashboard: https://app.supabase.com
- GitHub Repository: https://github.com/metrogain09-cmd/pivault
- TanStack Router: https://tanstack.com/router/latest
- Express.js: https://expressjs.com

## Need Help?

1. Check **DEPLOYMENT.md** for detailed setup
2. Review **server/README.md** for backend info
3. Check Vercel deployment logs for build errors
4. Verify all environment variables are set correctly
5. Test backend health: `GET https://your-backend.vercel.app/api/health`
