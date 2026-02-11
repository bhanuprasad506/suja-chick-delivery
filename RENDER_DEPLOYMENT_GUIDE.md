# 🚀 Render Deployment Guide - Suja Chick Delivery

## Overview
This guide will help you deploy both frontend and backend together on Render (FREE tier).

## What You'll Get
- ✅ Frontend + Backend on same domain
- ✅ Automatic HTTPS
- ✅ Free hosting (750 hours/month)
- ✅ Auto-deploy on git push
- ✅ No configuration needed for API calls (same domain)

---

## Prerequisites
1. GitHub account
2. Render account (sign up at https://render.com)
3. Your code pushed to GitHub

---

## Step 1: Push Code to GitHub

```bash
git add .
git commit -m "Configure for Render deployment"
git push origin main
```

---

## Step 2: Deploy on Render

### 2.1 Go to Render Dashboard
1. Open https://dashboard.render.com
2. Click "New +" button
3. Select "Web Service"

### 2.2 Connect GitHub Repository
1. Click "Connect GitHub" (if not already connected)
2. Find and select your repository: `suja-chick-delivery`
3. Click "Connect"

### 2.3 Configure Service
Render will auto-detect settings from `render.yaml`, but verify:

- **Name:** `suja-chick-delivery`
- **Environment:** `Node`
- **Build Command:** `npm install && cd frontend && npm install && npm run build && cd ..`
- **Start Command:** `node app.js`
- **Plan:** `Free`

### 2.4 Environment Variables (Optional)
If you want SMS notifications, add these:
- `TWILIO_ACCOUNT_SID` - Your Twilio Account SID
- `TWILIO_AUTH_TOKEN` - Your Twilio Auth Token
- `TWILIO_PHONE_NUMBER` - Your Twilio Phone Number

### 2.5 Deploy
1. Click "Create Web Service"
2. Wait 5-10 minutes for first deployment
3. Watch the build logs

---

## Step 3: Get Your URL

After deployment completes:
1. Your app will be live at: `https://suja-chick-delivery.onrender.com`
2. Customer Portal: `https://suja-chick-delivery.onrender.com/`
3. Admin Portal: `https://suja-chick-delivery.onrender.com/admin`

**Note:** The exact URL might have random characters if the name is taken.

---

## Step 4: Test Your App

### Test on Desktop
1. Open `https://your-app-name.onrender.com`
2. Try customer portal (place an order)
3. Try admin portal (login with authorized number)

### Test on Mobile
1. Open the same URL on your phone
2. Login should work now!
3. Test all features

---

## Important Notes

### Free Tier Limitations
- ✅ 750 hours/month (enough for 24/7 if only one app)
- ⚠️ Spins down after 15 minutes of inactivity
- ⚠️ First request after spin-down takes 30-60 seconds
- ✅ Unlimited bandwidth
- ✅ Automatic SSL/HTTPS

### Data Storage
- Data is stored in `server/data/` folder
- ⚠️ Files are ephemeral (reset on redeploy)
- ✅ Automatic backups every 5 minutes to `server/data/backup_*.json`
- 💡 Use the `/export` endpoint to download data regularly

### Auto-Deploy
After initial setup, every git push automatically deploys:
```bash
git add .
git commit -m "Update feature"
git push origin main
```
Render will automatically rebuild and redeploy!

---

## Troubleshooting

### Build Failed
**Check build logs in Render dashboard**
- Common issue: Missing dependencies
- Solution: Make sure `package.json` has all dependencies

### App Not Loading
**Check if service is running**
- Go to Render dashboard
- Check service status
- View logs for errors

### Login Not Working on Mobile
**This should be fixed now!**
- Frontend and backend are on same domain
- No CORS issues
- No localhost references

### Data Lost After Redeploy
**This is expected with file storage**
- Download data regularly using `/export` endpoint
- Consider upgrading to persistent disk (paid) if needed
- Or migrate to Firebase/MongoDB for permanent storage

---

## Monitoring

### Render Dashboard
Monitor:
- Service status (running/stopped)
- Build logs
- Runtime logs
- Bandwidth usage

### Health Check
Your app has a health endpoint:
- `https://your-app-name.onrender.com/health`
- Should return: `{"status":"ok","storage":"file"}`

---

## Upgrading (Optional)

### Custom Domain
1. Go to Render dashboard
2. Click on your service
3. Go to "Settings" > "Custom Domain"
4. Add your domain (e.g., `suja.com`)
5. Update DNS records as instructed

### Persistent Storage
If you need data to persist across deploys:
1. Upgrade to paid plan ($7/month)
2. Add persistent disk
3. Or migrate to external database (Firebase/MongoDB)

---

## Cost Breakdown

### Free Tier (Current)
- **Cost:** $0/month
- **Uptime:** 750 hours/month
- **Storage:** Ephemeral (resets on deploy)
- **Perfect for:** Testing, small businesses

### Paid Tier (If Needed)
- **Cost:** $7/month
- **Uptime:** 24/7 (no spin-down)
- **Storage:** Persistent disk available
- **Perfect for:** Production, growing businesses

---

## Next Steps After Deployment

1. ✅ Test all features on live site
2. ✅ Share URL with team/customers
3. ✅ Set up regular data exports
4. ✅ Monitor usage in Render dashboard
5. ✅ Consider custom domain (optional)

---

## Support

- **Render Docs:** https://render.com/docs
- **Render Community:** https://community.render.com
- **Check Logs:** Render Dashboard > Your Service > Logs

---

## Quick Reference

**Render Dashboard:** https://dashboard.render.com
**Your App URL:** `https://suja-chick-delivery.onrender.com` (or your custom URL)
**Health Check:** `https://your-app-name.onrender.com/health`
**Export Data:** `https://your-app-name.onrender.com/export`

**Admin Login:**
- Phone: 8519984203 (or other authorized numbers)
- Password: suja123

---

**Ready to deploy? Follow the steps above! 🚀**

Created: February 11, 2026
