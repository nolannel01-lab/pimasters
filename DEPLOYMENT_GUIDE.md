# Vercel Deployment Guide - Complete Setup

## 📋 Overview

Your PiVault project is deployed on two separate Vercel projects:
- **Frontend**: https://pimasters2.vercel.app/ 
- **Backend**: https://pimasters.vercel.app/

## ✅ Completed Setup

### Frontend Environment Variables (✅ COMPLETED)
- ✅ `VITE_SUPABASE_URL` = https://bkmvipmripskfrwanwqp.supabase.co
- ✅ `VITE_SUPABASE_ANON_KEY` = sb_publishable_ZerS7wii5ZPd5k_oFnu_FQ_tOxymqHK
- ✅ `VITE_API_URL` = https://pimasters.vercel.app
- ✅ `VITE_PI_MAINNET_URL` = https://api.mainnet.minepi.com

### Backend Environment Variables (⚠️ NEEDS COMPLETION)
- ⚠️ `SUPABASE_URL` = https://bkmvipmripskfrwanwqp.supabase.co (ADDED)
- ❌ `SUPABASE_KEY` = (NEEDS TO BE ADDED VIA WEB UI)

## 🌐 Complete Remaining Setup via Vercel Web Dashboard

### Add Backend SUPABASE_KEY:

1. **Go to Backend Project**
   - Visit: https://vercel.com/pivault-s-projects/pimasters/BmnQPqyJbrCDH8uoBD5doUCvpM3f
   - Or go to Vercel dashboard → Select "pimasters" project

2. **Navigate to Settings → Environment Variables**
   - Click on "Settings" tab
   - Find "Environment Variables" section

3. **Add SUPABASE_KEY**
   - Click "Add new"
   - Name: `SUPABASE_KEY`
   - Value: Your Supabase service role key (or anon key for now)
   - Select: `Production` only (sensitive)
   - Click "Save"

4. **Trigger Redeployment**
   - Go to "Deployments" tab
   - Find the latest deployment
   - Click the "..." menu
   - Select "Redeploy"

## 🚀 Current Deployment Status

### Frontend (pimasters2)
```
URL: https://pimasters2.vercel.app/
Status: ✅ Ready (all env vars configured)
Last Push: Just now
```

### Backend (pimasters)
```
URL: https://pimasters.vercel.app/
Status: ⏳ Waiting for SUPABASE_KEY environment variable
Last Status: Environment variables incomplete
```

## 📱 What's Deployed

### Frontend Features (Live at pimasters2.vercel.app)
- ✅ Multi-wallet dashboard
- ✅ Real-time Pi balance tracking
- ✅ Transaction UI
- ✅ Scheduled payments interface
- ✅ Auto-sweep controls
- ✅ Activity terminal

### Backend API (Deploying at pimasters.vercel.app)
- 🔄 Supabase database connection (needs SUPABASE_KEY)
- 🔄 WhatsApp bot endpoints
- 🔄 Scheduled payment processor
- 🔄 Transaction management

## 🔑 Environment Variables Reference

### Frontend (.env for pimasters2)
```
VITE_SUPABASE_URL=https://bkmvipmripskfrwanwqp.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_ZerS7wii5ZPd5k_oFnu_FQ_tOxymqHK
VITE_API_URL=https://pimasters.vercel.app
VITE_PI_MAINNET_URL=https://api.mainnet.minepi.com
```

### Backend (.env for pimasters)
```
SUPABASE_URL=https://bkmvipmripskfrwanwqp.supabase.co
SUPABASE_KEY=<your_supabase_secret_key>
```

## ⚙️ Next Steps

1. **Add SUPABASE_KEY to Backend via Web UI** (see instructions above)
2. **Trigger Redeployment** of backend
3. **Verify Frontend** loads at https://pimasters2.vercel.app/
4. **Test Backend API** by checking logs in Vercel dashboard

## 🔗 Quick Links

- **Frontend Dashboard**: https://vercel.com/pivault-s-projects/pimasters2
- **Backend Dashboard**: https://vercel.com/pivault-s-projects/pimasters
- **GitHub Repository**: https://github.com/nolannel01-lab/pimasters2
- **Supabase Console**: https://app.supabase.com

## ✅ Verification Checklist

- [ ] Frontend loads at https://pimasters2.vercel.app/
- [ ] Backend SUPABASE_KEY added to environment variables
- [ ] Backend redeployed and showing "Ready" status
- [ ] Can add wallets in frontend
- [ ] Can view balances
- [ ] API calls reach backend successfully
- [ ] Supabase database queries work

## 🐛 Troubleshooting

### Frontend Shows Blank Page
- Check browser console (F12) for errors
- Verify all VITE_* variables are set in Vercel
- Clear browser cache and hard reload (Ctrl+Shift+R)

### Backend Returns 500 Errors
- Verify SUPABASE_KEY is set in environment
- Check Vercel Functions logs for details
- Ensure Supabase project is accessible

### WhatsApp Bot Not Working
- Deploy bot separately (not on Vercel - serverless has timeout limits)
- Use Railway, Replit, or your own server
- Set webhook URL in bot configuration

## 📞 Support

If you need to make changes:
1. Update code locally
2. Push to GitHub (`git push origin main`)
3. Vercel auto-deploys from main branch
4. Monitor deployment in Vercel dashboard

---

**Deployment completed**: 2026-06-08
**Status**: Frontend live, Backend waiting for SUPABASE_KEY
