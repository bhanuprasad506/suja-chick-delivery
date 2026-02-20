# Firebase + Vercel Setup Guide

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Name it "Suja Chick Delivery"
4. Enable Google Analytics (optional)
5. Create project

## Step 2: Set Up Firebase Services

### Enable Firestore Database
1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Select "Start in test mode" (for development)
4. Choose region closest to you
5. Create database

### Enable Firebase Storage
1. Go to "Storage"
2. Click "Get started"
3. Start in test mode
4. Choose region
5. Done

### Enable Firebase Authentication
1. Go to "Authentication"
2. Click "Get started"
3. Enable "Email/Password" provider
4. Enable "Anonymous" (optional)

## Step 3: Get Firebase Credentials

1. Go to Project Settings (gear icon)
2. Click "Service Accounts"
3. Click "Generate new private key"
4. Save the JSON file securely
5. Also copy the Web API credentials from "Your apps" section

## Step 4: Install Firebase Admin SDK

```bash
npm install firebase-admin
npm install firebase
```

## Step 5: Create Firebase Configuration

Create `server/src/firebase-config.ts`:

```typescript
import * as admin from 'firebase-admin';
import * as serviceAccount from '../../firebase-key.json';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  storageBucket: 'your-project-id.appspot.com'
});

export const db = admin.firestore();
export const storage = admin.storage();
export const auth = admin.auth();
```

## Step 6: Update Backend to Use Firebase

Replace file storage with Firestore:

```typescript
// In app.js or server/src/index.ts
const { db } = require('./firebase-config');

// Get deliveries
app.get('/deliveries', async (req, res) => {
  const snapshot = await db.collection('deliveries').orderBy('createdAt', 'desc').get();
  const deliveries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  res.json(deliveries);
});

// Create delivery
app.post('/deliveries', async (req, res) => {
  const delivery = req.body;
  const docRef = await db.collection('deliveries').add({
    ...delivery,
    createdAt: new Date().toISOString()
  });
  res.status(201).json({ id: docRef.id, ...delivery });
});
```

## Step 7: Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel
```

## Step 8: Set Environment Variables in Vercel

1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add:
   - `FIREBASE_PROJECT_ID`: your-project-id
   - `FIREBASE_PRIVATE_KEY`: (from service account JSON)
   - `FIREBASE_CLIENT_EMAIL`: (from service account JSON)
   - `FIREBASE_STORAGE_BUCKET`: your-project-id.appspot.com

## Firebase Free Tier Limits

- **Firestore**: 1GB storage, 50,000 reads/day, 20,000 writes/day
- **Storage**: 5GB total
- **Authentication**: Unlimited users
- **Hosting**: 1GB bandwidth/month

## Upgrade Options

If you exceed limits:
- Firestore: $0.06 per 100K reads
- Storage: $0.18 per GB/month
- Very affordable for small apps

## Benefits

✅ Scalable database (Firestore)
✅ File storage (Firebase Storage)
✅ Authentication built-in
✅ Real-time updates possible
✅ Free tier is generous
✅ Easy to upgrade when needed
✅ Vercel handles frontend perfectly
✅ No server management needed

## Next Steps

1. Create Firebase project
2. Get credentials
3. Update backend code
4. Set environment variables
5. Deploy to Vercel
6. Test the application
