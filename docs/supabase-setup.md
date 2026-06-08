# PiVault - Supabase Database Setup

## Overview

PiVault uses Supabase as its backend database to store wallet data, enabling cross-device synchronization.

## Supabase Configuration

### Environment Variables

Create a `.env` file in the project root with the following variables:

```env
VITE_SUPABASE_URL=https://hzfommxbhfsxzxdelpzi.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_yLyLckjm5AEA5lG_IRbz6A_fBtL0d6I
```

### Database Schema

The database consists of two main tables:

#### 1. `wallets` Table

| Column             | Type      | Description                   |
| ------------------ | --------- | ----------------------------- |
| `id`               | UUID      | Primary key                   |
| `user_id`          | TEXT      | Anonymous user identifier     |
| `label`            | TEXT      | Wallet label/name             |
| `public_key`       | TEXT      | Wallet public key (unique)    |
| `secret_encrypted` | TEXT      | Encrypted secret key (Base64) |
| `watch_only`       | BOOLEAN   | Whether wallet is watch-only  |
| `created_at`       | TIMESTAMP | Creation timestamp            |
| `updated_at`       | TIMESTAMP | Last update timestamp         |

#### 2. `transactions` Table

| Column         | Type      | Description              |
| -------------- | --------- | ------------------------ |
| `id`           | UUID      | Primary key              |
| `wallet_id`    | UUID      | Foreign key to wallets   |
| `tx_hash`      | TEXT      | Transaction hash         |
| `amount`       | TEXT      | Transaction amount       |
| `type`         | TEXT      | incoming/outgoing        |
| `status`       | TEXT      | pending/confirmed/failed |
| `counterparty` | TEXT      | Other party address      |
| `created_at`   | TIMESTAMP | Creation timestamp       |

## Setting Up the Database

### Option 1: Run SQL in Supabase Editor

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor**
4. Copy and run the contents of [`supabase/schema.sql`](supabase/schema.sql)

### Option 2: Using Supabase CLI

```bash
# Login to Supabase
supabase login

# Initialize Supabase (if not done)
supabase init

# Link to your project
supabase link --project-ref hzfommxbhfsxzxdelpzi

# Push the schema
supabase db push
```

## Data Sync Strategy

1. **Anonymous Users**: Each browser/device generates a unique anonymous user ID stored in localStorage
2. **Initial Load**: On app load, wallets are fetched from Supabase first
3. **Local Backup**: Wallets are also stored in localStorage as backup
4. **Bidirectional Sync**: Changes are synced to Supabase after local operations

## Security Notes

- Secret keys are Base64 encoded (not truly encrypted) - consider adding proper encryption for production
- Row Level Security (RLS) policies ensure users can only access their own data
- The anon key is safe to expose in client-side code (configured in Supabase)
