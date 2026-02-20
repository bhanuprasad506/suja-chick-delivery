# Database Setup for Persistent Storage

## Problem
Render's free tier has ephemeral storage - data disappears after 15 minutes of inactivity.

## Solutions

### Option 1: Upgrade Render Plan (Recommended)
- **Cost**: $7/month
- **Benefits**: Persistent disk storage, always-on server
- **Setup**: Go to Render dashboard → Upgrade to Starter plan

### Option 2: Free PostgreSQL Database
Use any of these free PostgreSQL services:

#### A. Render PostgreSQL (Free)
1. Go to Render dashboard
2. Click "New" → "PostgreSQL"
3. Name: `suja-deliveries-db`
4. Plan: Free
5. Copy the "External Database URL"
6. In your web service settings, add environment variable:
   - Key: `DATABASE_URL`
   - Value: [paste the database URL]

#### B. Supabase (Free)
1. Go to supabase.com
2. Create new project
3. Go to Settings → Database
4. Copy connection string
5. Add to Render as `DATABASE_URL`

#### C. ElephantSQL (Free)
1. Go to elephantsql.com
2. Create free "Tiny Turtle" plan
3. Copy URL
4. Add to Render as `DATABASE_URL`

### Option 3: Other Free Databases
- **Aiven**: 1 month free PostgreSQL
- **PlanetScale**: Free MySQL (with adapter)
- **MongoDB Atlas**: Free tier

## After Setup
1. Add `DATABASE_URL` environment variable to Render
2. Redeploy your app
3. Data will now persist permanently!

## Verification
Check your app logs - you should see:
```
Using PostgreSQL storage
Database initialized successfully
```

Instead of:
```
Using file storage (data may not persist on free hosting)
```