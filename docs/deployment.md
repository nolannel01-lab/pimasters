# PiVault - Deployment Guide

## GitHub Repository

**Repository URL**: https://github.com/skygridtec06/pivault.git

## Deployment to Vercel

### Prerequisites

1. A [Vercel](https://vercel.com) account
2. A [GitHub](https://github.com) account
3. Your code pushed to GitHub

### Step 1: Push Code to GitHub

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit with Supabase integration"

# Add remote (if not already set)
git remote add origin https://github.com/skygridtec06/pivault.git

# Push to GitHub
git push -u origin main
```

### Step 2: Deploy to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New...** → **Project**
3. Import your GitHub repository (`pivault`)
4. Configure the project:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build` or `vite build`
   - **Output Directory**: `dist`
5. Add Environment Variables:
   ```
   VITE_SUPABASE_URL=https://hzfommxbhfsxzxdelpzi.supabase.co
   VITE_SUPABASE_ANON_KEY=sb_publishable_yLyLckjm5AEA5lG_IRbz6A_fBtL0d6I
   ```
6. Click **Deploy**

### Step 3: Verify Deployment

Once deployed, Vercel will provide a URL like `pivault.vercel.app`.

## Environment Variables Reference

| Variable                 | Description            | Required |
| ------------------------ | ---------------------- | -------- |
| `VITE_SUPABASE_URL`      | Supabase project URL   | Yes      |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes      |

## Cloudflare Pages (Alternative)

This project uses `@cloudflare/vite-plugin` and can also be deployed to Cloudflare Pages:

1. Push code to GitHub
2. Go to Cloudflare Dashboard → Pages
3. Connect to GitHub and select the repository
4. Build settings:
   - **Build command**: `npm run build`
   - **Build output**: `dist`
5. Add environment variables in Cloudflare settings
6. Deploy

## Troubleshooting

### Common Issues

1. **Missing Environment Variables**: Ensure `.env` variables are added to Vercel/Cloudflare
2. **Build Failures**: Check that all dependencies are in `package.json`
3. **Supabase Connection Errors**: Verify project URL and anon key are correct

### Checking Logs

- **Vercel**: Dashboard → Deployment → Functions logs
- **Cloudflare**: Dashboard → Pages → Deployment logs
