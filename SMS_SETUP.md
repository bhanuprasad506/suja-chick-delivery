# SMS Notification Setup Guide

## Overview
When an admin marks an order as "Delivered" (Mark as Done), the system will automatically send an SMS notification to the customer's mobile number.

## How It Works

1. **Customer places order** → Provides their mobile number
2. **Admin confirms order** → Status changes to "Confirmed"
3. **Admin clicks "Mark as Delivered"** → 
   - Order status becomes "Delivered"
   - A delivery record is created in the system
   - **SMS notification is sent to customer's phone** ✅
4. **Customer receives SMS** with order delivery confirmation

## Setting Up Twilio SMS Service

### Step 1: Create a Twilio Account
1. Go to [https://www.twilio.com/console](https://www.twilio.com/console)
2. Sign up for a free account (includes $15 trial credit)
3. Verify your email and phone number

### Step 2: Get Your Credentials
1. From the Twilio Console, copy:
   - **Account SID** (starts with AC...)
   - **Auth Token** (keep this secret!)
2. Get a Twilio phone number:
   - Click "Phone Numbers" → "Manage Numbers"
   - Click "Get your first Twilio phone number"
   - Accept the suggested number or choose one
   - Copy the phone number (format: +1234567890)

### Step 3: Configure Environment Variables
1. Open the `.env` file in the project root
2. Uncomment and fill in the Twilio credentials:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

3. Save the file

### Step 4: Restart the Server
```bash
npm start --prefix server
```

The server will log:
```
✅ Twilio SMS service initialized
```

## SMS Message Format

When an order is marked as delivered, the customer receives:

```
🐣 Suja Chick Delivery

Hi [Customer Name],

Your order has been delivered!

📦 Order Details:
• Type: [Chick Type]
• Quantity: [Number] boxes
• Status: Delivered

Thank you for your order!

📞 Contact us for any queries.
```

## Testing SMS Notifications

### With Twilio Trial Account:
- You can only send SMS to verified phone numbers
- Add your test phone number to Twilio Console:
  - Go to "Verified Caller IDs"
  - Add your phone number and verify it
- Then test by placing an order with that number

### With Paid Twilio Account:
- Can send SMS to any phone number
- Charges apply per SMS sent

## Troubleshooting

### SMS Not Sending?
1. Check if Twilio credentials are correct in `.env`
2. Verify the phone number format (should be +91XXXXXXXXXX for India)
3. Check server logs for error messages
4. Ensure Twilio account has sufficient balance/credits

### Phone Number Format
- **India**: +91 followed by 10-digit number
- **US**: +1 followed by 10-digit number
- **Other countries**: +[country code][number]

### Server Logs
If SMS service is not configured:
```
⚠️ Twilio credentials not configured - SMS notifications disabled
```

If SMS fails to send:
```
❌ Failed to send SMS: [error message]
```

## Disabling SMS Notifications

If you want to disable SMS notifications:
1. Comment out or remove the Twilio environment variables in `.env`
2. Restart the server
3. Orders will still be marked as delivered, but no SMS will be sent

## Cost Considerations

- **Twilio Free Trial**: $15 credit (usually covers ~30-50 SMS)
- **After trial**: ~$0.0075 per SMS in India
- **Monthly**: ~$20-50 depending on order volume

## Support

For Twilio support: [https://support.twilio.com](https://support.twilio.com)
