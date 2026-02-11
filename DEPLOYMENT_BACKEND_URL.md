# Backend URL Configuration for Production

## Current Issue
The mobile app shows "Login failed, check your connection" because the frontend is trying to connect to localhost instead of your Render backend.

## Solution Applied
Updated the code to use environment variables for the backend URL.

## Steps to Complete Deployment

### 1. Get Your Render Backend URL
1. Go to your Render dashboard: https://dashboard.render.com
2. Find your backend service (the Node.js app)
3. Copy the URL (it should look like: `https://your-app-name.onrender.com`)

### 2. Update the Production Environment File
Edit `frontend/.env.production` and replace:
```
VITE_API_URL=https://YOUR_RENDER_APP_NAME.onrender.com
```

With your actual Render URL, for example:
```
VITE_API_URL=https://suja-chick-delivery.onrender.com
```

### 3. Rebuild and Redeploy Frontend
After updating the .env.production file:

```bash
cd frontend
npm run build
```

Then deploy the `frontend/dist` folder to your hosting service (Vercel/Netlify/etc.)

### 4. Configure CORS on Backend
Make sure your backend (on Render) allows requests from your frontend domain.

In your `app.js`, the CORS should include your frontend URL:
```javascript
const cors = require('cors');
app.use(cors({
  origin: ['https://your-frontend-domain.com', 'http://localhost:3000'],
  credentials: true
}));
```

## Testing
After deployment:
1. Open the app on mobile
2. Try to login/signup
3. Check browser console for any errors
4. Verify the API calls are going to your Render URL (not localhost)

## Files Changed
- `frontend/src/App.tsx` - Updated getBackendUrl to use environment variable
- `frontend/src/components/CustomerPortal.tsx` - Updated all fetch calls to use environment variable
- `frontend/.env.production` - Added VITE_API_URL configuration
- `frontend/src/vite-env.d.ts` - Added TypeScript definitions for environment variables
