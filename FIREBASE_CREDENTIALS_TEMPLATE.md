# Firebase Credentials Setup

## 📥 After Downloading firebase-key.json

Your `firebase-key.json` file will look like this:

```json
{
  "type": "service_account",
  "project_id": "suja-chick-delivery-xxxxx",
  "private_key_id": "xxxxxxxxxxxxx",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@suja-chick-delivery-xxxxx.iam.gserviceaccount.com",
  "client_id": "xxxxxxxxxxxxx",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40suja-chick-delivery-xxxxx.iam.gserviceaccount.com"
}
```

---

## 🔑 Extract These Values for Vercel

### 1. FIREBASE_PROJECT_ID
Copy the value of `project_id`:
```
suja-chick-delivery-xxxxx
```

### 2. FIREBASE_PRIVATE_KEY
Copy the ENTIRE value of `private_key` (including the BEGIN and END lines):
```
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
(multiple lines)
...xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
-----END PRIVATE KEY-----
```

**IMPORTANT**: Keep the `\n` characters as they are!

### 3. FIREBASE_CLIENT_EMAIL
Copy the value of `client_email`:
```
firebase-adminsdk-xxxxx@suja-chick-delivery-xxxxx.iam.gserviceaccount.com
```

### 4. FIREBASE_STORAGE_BUCKET
This is your `project_id` + `.appspot.com`:
```
suja-chick-delivery-xxxxx.appspot.com
```

---

## 📋 Copy-Paste Format for Vercel

When adding environment variables in Vercel, use this format:

**Variable 1:**
```
Name: FIREBASE_PROJECT_ID
Value: suja-chick-delivery-xxxxx
```

**Variable 2:**
```
Name: FIREBASE_PRIVATE_KEY
Value: -----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n
```

**Variable 3:**
```
Name: FIREBASE_CLIENT_EMAIL
Value: firebase-adminsdk-xxxxx@suja-chick-delivery-xxxxx.iam.gserviceaccount.com
```

**Variable 4:**
```
Name: FIREBASE_STORAGE_BUCKET
Value: suja-chick-delivery-xxxxx.appspot.com
```

**Variable 5:**
```
Name: DATABASE_TYPE
Value: firebase
```

---

## ⚠️ Security Notes

1. **NEVER commit firebase-key.json to GitHub**
   - Already added to .gitignore ✅

2. **Keep the file secure**
   - Store in a safe location
   - Don't share publicly
   - Don't paste in public forums

3. **Environment variables are safe**
   - Vercel encrypts them
   - Only accessible to your deployment
   - Not visible in public logs

---

## 🧪 Test Locally First (Optional)

Before deploying, test Firebase connection locally:

**Windows CMD:**
```cmd
set FIREBASE_PROJECT_ID=your-project-id
set FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYourKeyHere\n-----END PRIVATE KEY-----\n
set FIREBASE_CLIENT_EMAIL=your-client-email
set FIREBASE_STORAGE_BUCKET=your-bucket
npm start
```

**Windows PowerShell:**
```powershell
$env:FIREBASE_PROJECT_ID="your-project-id"
$env:FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYourKeyHere\n-----END PRIVATE KEY-----\n"
$env:FIREBASE_CLIENT_EMAIL="your-client-email"
$env:FIREBASE_STORAGE_BUCKET="your-bucket"
npm start
```

Look for: `✅ Firebase initialized successfully`

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Vercel deployment shows "✅ Firebase initialized successfully" in logs
- [ ] Can create new delivery in admin portal
- [ ] Data appears in Firebase Console → Firestore Database
- [ ] Customer can place order
- [ ] Order appears in admin portal
- [ ] Delivery details save correctly

---

## 🆘 Troubleshooting

### "Firebase credentials not found"
- Check all 5 environment variables are set in Vercel
- Verify no typos in variable names
- Redeploy after adding variables

### "Invalid private key"
- Ensure you copied the ENTIRE private_key value
- Keep the `\n` characters
- Include BEGIN and END lines

### "Permission denied"
- Go to Firebase Console → Firestore → Rules
- Ensure rules are in "test mode"

### "Project not found"
- Verify FIREBASE_PROJECT_ID matches your Firebase project
- Check Firebase Console for correct project ID

---

**Ready?** Follow DEPLOYMENT_STEPS.md to deploy! 🚀
