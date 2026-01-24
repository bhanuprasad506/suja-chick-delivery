# Suja Chick Delivery App

A mobile-friendly web application for managing chick deliveries with WhatsApp sharing capabilities.

## Features
- ✅ Add delivery records with customer details
- ✅ Track loaded/empty box weights and calculate net weight
- ✅ Share delivery details via WhatsApp
- ✅ Delete delivery records
- ✅ Mobile-responsive design
- ✅ PWA capabilities for offline use

## Quick Deploy (Choose One):

### 1. Render.com (Free - Recommended)
1. Fork this repository to your GitHub
2. Go to [render.com](https://render.com) and sign up
3. Click "New Web Service"
4. Connect your GitHub repo
5. Use these settings:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Environment**: Node
   - **Plan**: Free

### 2. Railway.app (Free)
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "Deploy from GitHub repo"
4. Select your repository
5. Railway will auto-deploy

### 3. Heroku (Free tier discontinued, but still works)
```bash
npm install -g heroku
heroku create your-app-name
git push heroku main
```

## Local Development
```bash
npm install
npm run build
npm start
```

## Mobile Usage
1. Open the deployed URL in your mobile browser
2. Tap "Share" → "Add to Home Screen"
3. Now you have a native app experience!

## Tech Stack
- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express
- Storage: In-memory (for simplicity)
- PWA: Service Worker for offline capabilities