# Vercel + Firebase Deployment Guide

## Quick Start (5 minutes)

### Step 1: Create Firebase Project
1. Go to https://console.firebase.google.com/
2. Click "Create a project"
3. Name: "Suja Chick Delivery"
4. Create project

### Step 2: Get Firebase Credentials
1. Click Settings (gear icon) → Project Settings
2. Go to "Service Accounts" tab
3. Click "Generate new private key"
4. Save as `firebase-key.json` in root directory
5. **IMPORTANT**: Add to `.gitignore` (don't commit!)

### Step 3: Enable Firebase Services
1. **Firestore Database**
   - Click "Firestore Database"
   - "Create database" → "Start in test mode"
   - Choose region → Create

2. **Firebase Storage**
   - Click "Storage"
   - "Get started" → "Start in test mode"
   - Choose region → Done

3. **Authentication** (optional)
   - Click "Authentication"
   - "Get started" → Enable "Email/Password"

### Step 4: Install Dependencies
```bash
npm install firebase-admin
npm install firebase
```

### Step 5: Deploy to Vercel

**Option A: Using Vercel CLI**
```bash
npm install -g vercel
vercel login
vercel
```

**Option B: Using GitHub**
1. Push code to GitHub
2. Go to https://vercel.com/
3. Click "New Project"
4. Import your GitHub repo
5. Deploy

### Step 6: Set Environment Variables in Vercel

In Vercel Dashboard → Settings → Environment Variables, add:

```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project-id.iam.gserviceaccount.com
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
```

**How to get these values:**
- Open `firebase-key.json`
- Copy the values from there

### Step 7: Update Backend Code

Replace the storage initialization in `app.js`:

```javascript
// OLD CODE (remove this)
// let storage;
// async function initStorage() { ... }

// NEW CODE (add this)
const admin = require('firebase-admin');
const serviceAccount = require('./firebase-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET
});

const db = admin.firestore();

// Update endpoints to use Firestore
app.get('/deliveries', async (req, res) => {
  const snapshot = await db.collection('deliveries').orderBy('createdAt', 'desc').get();
  const deliveries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  res.json(deliveries);
});

app.post('/deliveries', async (req, res) => {
  const delivery = req.body;
  const docRef = await db.collection('deliveries').add({
    ...delivery,
    createdAt: new Date().toISOString()
  });
  res.status(201).json({ id: docRef.id, ...delivery });
});
```

### Step 8: Test Locally

```bash
# Set environment variables locally
export FIREBASE_PROJECT_ID=your-project-id
export FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
export FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project-id.iam.gserviceaccount.com
export FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com

# Run backend
node app.js

# In another terminal, run frontend
cd frontend
npm run dev
```

### Step 9: Deploy

```bash
git add .
git commit -m "Add Firebase integration"
git push
```

Vercel will automatically deploy!

## Pricing

### Free Tier
- **Vercel**: Unlimited deployments, 100GB bandwidth/month
- **Firebase Firestore**: 1GB storage, 50K reads/day, 20K writes/day
- **Firebase Storage**: 5GB total
- **Total**: Completely FREE

### When You Need to Upgrade
- Firestore: $0.06 per 100K reads
- Storage: $0.18 per GB/month
- Very affordable for small apps

## Troubleshooting

### "Cannot find module 'firebase-admin'"
```bash
npm install firebase-admin
```

### "Firebase credentials not found"
- Check `firebase-key.json` exists in root
- Check environment variables in Vercel

### "Firestore permission denied"
- Go to Firebase Console → Firestore → Rules
- Change to test mode (allows all reads/writes)

### "Storage quota exceeded"
- Upgrade Firebase plan
- Or delete old data

## Benefits of This Setup

✅ **Vercel**
- Free frontend hosting
- Automatic deployments from GitHub
- Global CDN
- Serverless functions

✅ **Firebase**
- Managed database (no server management)
- Real-time updates possible
- Built-in authentication
- File storage included
- Scales automatically
- Free tier is generous

✅ **Combined**
- No server to manage
- Automatic backups
- Global distribution
- Pay-as-you-grow pricing
- Perfect for startups

## Next Steps

1. Create Firebase project
2. Get credentials
3. Update backend code
4. Set environment variables
5. Deploy to Vercel
6. Test the application
7. Monitor usage in Firebase Console

## Support

- Vercel Docs: https://vercel.com/docs
- Firebase Docs: https://firebase.google.com/docs
- Firestore Guide: https://firebase.google.com/docs/firestore
