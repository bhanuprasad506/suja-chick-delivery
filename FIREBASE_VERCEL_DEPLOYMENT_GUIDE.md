# 🚀 Firebase Functions + Vercel Deployment Guide

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│  USERS (Mobile/Desktop)                     │
└──────────────┬──────────────────────────────┘
               │
               │ HTTPS
               │
┌──────────────▼──────────────────────────────┐
│  VERCEL (Frontend Only)                     │
│  - React App                                │
│  - Static Files                             │
│  - Global CDN                               │
└──────────────┬──────────────────────────────┘
               │
               │ API Calls
               │
┌──────────────▼──────────────────────────────┐
│  FIREBASE FUNCTIONS (Backend API)           │
│  - Express.js API                           │
│  - Serverless Functions                     │
│  - Auto-scaling                             │
└──────────────┬──────────────────────────────┘
               │
               │ Firebase SDK
               │
┌──────────────▼──────────────────────────────┐
│  FIRESTORE (Database)                       │
│  - NoSQL Database                           │
│  - 1GB Free Storage                         │
│  - Real-time Updates                        │
└─────────────────────────────────────────────┘
```

---

## 📋 Prerequisites

- [ ] Google account
- [ ] GitHub account
- [ ] Node.js installed (v18 or higher)
- [ ] Firebase CLI installed
- [ ] Git installed

---

## PART 1: Firebase Setup & Backend Deployment

### Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
```

### Step 2: Login to Firebase

```bash
firebase login
```

This will open a browser window. Login with your Google account.

### Step 3: Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Click "Add project"
3. Project name: `suja-chick-delivery`
4. Enable Google Analytics (optional)
5. Click "Create project"
6. Wait for creation (~30 seconds)

### Step 4: Enable Firestore Database

1. In Firebase Console, click "Firestore Database"
2. Click "Create database"
3. Location: `asia-south1` (Mumbai, India)
4. Security rules: "Start in test mode"
5. Click "Enable"

### Step 5: Link Your Project

In your project folder, run:

```bash
firebase use --add
```

- Select your project: `suja-chick-delivery`
- Alias: `default` (press Enter)

This will update `.firebaserc` with your project ID.

### Step 6: Update .firebaserc

Open `.firebaserc` and verify it looks like:

```json
{
  "projects": {
    "default": "suja-chick-delivery-xxxxx"
  }
}
```

### Step 7: Install Backend Dependencies

```bash
cd functions
npm install
cd ..
```

### Step 8: Deploy Backend to Firebase Functions

```bash
firebase deploy --only functions
```

Wait 2-3 minutes for deployment.

### Step 9: Get Your API URL

After deployment, you'll see:

```
✔  functions[api(us-central1)] https://us-central1-suja-chick-delivery-xxxxx.cloudfunctions.net/api
```

**Copy this URL!** You'll need it for the frontend.

---

## PART 2: Frontend Deployment to Vercel

### Step 10: Update Frontend API URL

Open `frontend/.env.production` and update:

```
VITE_API_URL=https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/api
```

Replace with your actual Firebase Functions URL from Step 9.

### Step 11: Build Frontend

```bash
cd frontend
npm install
npm run build
cd ..
```

### Step 12: Push to GitHub

```bash
git add .
git commit -m "Deploy to Firebase Functions + Vercel"
git push origin main
```

### Step 13: Deploy to Vercel

1. Go to https://vercel.com/
2. Sign up/login with GitHub
3. Click "Add New..." → "Project"
4. Import your repository
5. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
6. Click "Deploy"
7. Wait 2-3 minutes

### Step 14: Test Your Deployed App

Your app will be live at: `https://suja-chick-delivery.vercel.app`

Test:
- Customer Portal: https://your-app.vercel.app/
- Admin Portal: https://your-app.vercel.app/admin

---

## 💰 Cost Breakdown

### Firebase Functions (Backend)
**Free Tier:**
- 2 million invocations/month
- 400,000 GB-seconds/month
- 200,000 CPU-seconds/month

**Your app usage estimate:**
- ~1,000 API calls/day = 30,000/month
- Well within free tier! ✅

**If you exceed:**
- $0.40 per million invocations
- Very affordable!

### Firestore (Database)
**Free Tier:**
- 1GB storage
- 50,000 reads/day
- 20,000 writes/day

**Your app usage estimate:**
- ~500 deliveries/day = well within limits ✅

### Vercel (Frontend)
**Free Tier:**
- 100GB bandwidth/month
- Unlimited deployments
- Free HTTPS & CDN

**Total Cost: $0/month** 🎉

---

## 🔧 Local Development

### Run Backend Locally

```bash
# Terminal 1: Start Firebase emulator
firebase emulators:start --only functions
```

Backend will run at: http://localhost:5001/YOUR_PROJECT_ID/us-central1/api

### Run Frontend Locally

```bash
# Terminal 2: Start frontend
cd frontend
npm run dev
```

Frontend will run at: http://localhost:3000

---

## 🔄 Update Workflow

### Update Backend

```bash
# Make changes to functions/index.js
firebase deploy --only functions
```

### Update Frontend

```bash
git add .
git commit -m "Update frontend"
git push origin main
```

Vercel auto-deploys in 2-3 minutes!

---

## 📊 Monitor Your App

### Firebase Console
https://console.firebase.google.com/

Monitor:
- Function invocations
- Firestore reads/writes
- Error logs
- Performance

### Vercel Dashboard
https://vercel.com/dashboard

Monitor:
- Deployment status
- Build logs
- Analytics
- Bandwidth usage

---

## 🆘 Troubleshooting

### "Firebase command not found"
```bash
npm install -g firebase-tools
```

### "Permission denied" during deployment
```bash
firebase login --reauth
```

### "CORS error" in frontend
- Check that your Firebase Functions URL is correct in `.env.production`
- CORS is already configured in `functions/index.js`

### "Function not found"
- Ensure you deployed functions: `firebase deploy --only functions`
- Check Firebase Console → Functions for deployment status

### Frontend shows "Network Error"
- Verify API URL in `frontend/.env.production`
- Check Firebase Functions logs: `firebase functions:log`

---

## 🎯 Quick Commands Reference

```bash
# Deploy backend
firebase deploy --only functions

# Deploy Firestore rules
firebase deploy --only firestore:rules

# View function logs
firebase functions:log

# Test functions locally
firebase emulators:start --only functions

# Build frontend
cd frontend && npm run build

# Deploy frontend (auto via git push)
git push origin main
```

---

## ✅ Deployment Checklist

### Firebase Backend
- [ ] Firebase CLI installed
- [ ] Logged in to Firebase
- [ ] Project created in Firebase Console
- [ ] Firestore enabled
- [ ] Project linked (`.firebaserc` updated)
- [ ] Functions deployed
- [ ] API URL copied

### Vercel Frontend
- [ ] API URL updated in `.env.production`
- [ ] Frontend built successfully
- [ ] Code pushed to GitHub
- [ ] Vercel project created
- [ ] Deployment successful
- [ ] App tested and working

---

## 🎉 You're Done!

Your app is now live with:
- ✅ Backend on Firebase Functions (serverless, auto-scaling)
- ✅ Frontend on Vercel (global CDN, fast loading)
- ✅ Database on Firestore (1GB free storage)
- ✅ $0/month cost (free tier)
- ✅ Auto-deploy on git push

**Share your live URL with customers!** 🚀

---

**Created:** February 10, 2026
**Architecture:** Firebase Functions + Vercel
**Status:** Ready to Deploy ✅
