# Render PostgreSQL Database Setup

## Problem
Your deliveries and customer data are not persisting because the app is using file storage instead of PostgreSQL. File storage doesn't work on Render's free tier.

## Solution: Add PostgreSQL Database

### Step 1: Create PostgreSQL Database on Render

1. Go to https://dashboard.render.com
2. Click **"New +"** button (top right)
3. Select **"PostgreSQL"**
4. Fill in the details:
   - **Name**: `suja-chick-delivery-db`
   - **Database**: `suja_db`
   - **User**: `suja_user`
   - **Region**: Same as your web service (for better performance)
   - **Plan**: **Free**
5. Click **"Create Database"**
6. Wait for database to be created (takes 1-2 minutes)

### Step 2: Get Database URL

1. Once created, click on your database name
2. Scroll down to **"Connections"** section
3. Copy the **"Internal Database URL"** (starts with `postgresql://`)
   - Example: `postgresql://suja_user:xxxxx@dpg-xxxxx/suja_db`

### Step 3: Add DATABASE_URL to Web Service

1. Go back to Dashboard
2. Click on your web service: **"suja-chick-delivery"**
3. Click **"Environment"** tab (left sidebar)
4. Click **"Add Environment Variable"**
5. Add:
   - **Key**: `DATABASE_URL`
   - **Value**: (paste the Internal Database URL from Step 2)
6. Click **"Save Changes"**

### Step 4: Redeploy

The service will automatically redeploy. Wait 2-3 minutes.

### Step 5: Verify

1. Open your app: https://suja-chick-delivery.onrender.com
2. Check the logs in Render dashboard
3. You should see: `✅ Using PostgreSQL storage - data will persist`
4. Test by creating a delivery - it should now persist!

## Troubleshooting

### If you see "Using file storage" in logs:
- Check that DATABASE_URL environment variable is set correctly
- Make sure you copied the **Internal Database URL** (not External)
- Redeploy the service

### If you see "PostgreSQL failed":
- Check the database is running (green status in Render dashboard)
- Verify the DATABASE_URL format is correct
- Check logs for specific error messages

## Important Notes

- **Free PostgreSQL database expires after 90 days** - you'll need to create a new one
- Data will be lost when the free database expires
- For production use, consider upgrading to a paid plan ($7/month)
- The database and web service should be in the same region for best performance
