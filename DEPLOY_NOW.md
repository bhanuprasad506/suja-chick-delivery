# 🚀 Deploy Now - Quick Start

## What I Just Did

✅ Created Firebase Functions backend (`functions/` folder)
✅ Configured Firebase project files
✅ Set up environment variables for frontend
✅ Created deployment guide

---

## 🎯 Deploy in 3 Steps (20 minutes)

### STEP 1: Install Firebase CLI & Login (5 min)

```bash
npm install -g firebase-tools
firebase login
```

### STEP 2: Deploy Backend to Firebase (10 min)

```bash
# 1. Create Firebase project at https://console.firebase.google.com/
#    - Project name: suja-chick-delivery
#    - Enable Firestore Database

# 2. Link your project
firebase use --add
# Select your project, alias: default

# 3. Install dependencies
cd functions
npm install
cd ..

# 4. Deploy backend
firebase deploy --only functions

# 5. Copy the API URL shown after deployment
# Example: https://us-central1-suja-chick-delivery-xxxxx.cloudfunctions.net/api
```

### STEP 3: Deploy Frontend to Vercel (5 min)

```bash
# 1. Update frontend/.env.production with your Firebase Functions URL
# Replace: VITE_API_URL=https://YOUR_REGION-YOUR_PROJECT_ID.cloudfunctions.net/api

# 2. Push to GitHub
git add .
git commit -m "Deploy to Firebase + Vercel"
git push origin main

# 3. Go to https://vercel.com/
#    - Import your repository
#    - Root Directory: frontend
#    - Build Command: npm run build
#    - Output Directory: dist
#    - Click Deploy
```

---

## 📚 Detailed Guide

For step-by-step instructions with screenshots, see:
**`FIREBASE_VERCEL_DEPLOYMENT_GUIDE.md`**

---

## 💰 Cost

**FREE** - $0/month

- Firebase Functions: 2M invocations/month free
- Firestore: 1GB storage free
- Vercel: 100GB bandwidth free

---

## 🎉 After Deployment

Your app will be live at:
- **Frontend:** https://suja-chick-delivery.vercel.app
- **Backend API:** https://us-central1-your-project.cloudfunctions.net/api
- **Database:** Firebase Firestore

---

## 🆘 Need Help?

Read: `FIREBASE_VERCEL_DEPLOYMENT_GUIDE.md`

---

**Ready? Start with Step 1!** 👆
