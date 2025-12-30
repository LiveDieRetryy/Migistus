# Stripe Payment Integration - Setup Guide

## 🎉 Integration Complete!

The Stripe payment system has been successfully integrated into the MIGISTUS platform. Users can now deposit funds into their wallets using:
- 💳 Credit/Debit Cards
- 📱 PayPal
- 🍎 Apple Pay
- 📲 Google Pay

---

## 📋 What Was Implemented

### 1. **Backend APIs**
- `/api/payments/create-intent` - Creates Stripe PaymentIntents
- `/api/webhooks/stripe` - Processes Stripe webhook events (payment confirmations)

### 2. **Frontend Components**
- `StripeDepositForm` - Complete payment UI with Stripe Elements
- Updated wallet page with deposit modal

### 3. **Database Integration**
- Automatic wallet crediting upon successful payment
- Transaction history tracking with PaymentIntent IDs
- Metadata storage for payment methods and charges

### 4. **Security Features**
- Webhook signature verification
- Session-based authentication
- No card data stored on your servers (PCI compliance)

---

## 🚀 Setup Instructions

### Step 1: Create a Stripe Account

1. Go to [https://stripe.com](https://stripe.com)
2. Click "Sign Up"
3. Complete the registration process
4. Verify your email address

### Step 2: Get Your API Keys

#### For Development (Test Mode):
1. Log into your Stripe Dashboard
2. Navigate to: **Developers** → **API keys**
3. Find your **Publishable key** (starts with `pk_test_`)
4. Find your **Secret key** (starts with `sk_test_`)
   - Click "Reveal test key" to see it
5. Copy both keys

#### Update .env.local:
```bash
# Replace these placeholders with your actual test keys
STRIPE_SECRET_KEY=sk_test_YOUR_ACTUAL_SECRET_KEY_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_PUBLISHABLE_KEY_HERE
```

### Step 3: Configure Webhooks

Webhooks are how Stripe notifies your server about successful payments.

#### Local Development:
1. Install Stripe CLI: [https://stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)
2. Run: `stripe login`
3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
4. Copy the webhook signing secret (starts with `whsec_`)
5. Add to `.env.local`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
   ```

#### Production:
1. In Stripe Dashboard, go to: **Developers** → **Webhooks**
2. Click **"Add endpoint"**
3. Enter your webhook URL:
   ```
   https://yourdomain.com/api/webhooks/stripe
   ```
4. Select events to listen to:
   - `payment_intent.succeeded` ✅
   - `payment_intent.payment_failed` ✅
   - `charge.refunded` ✅
5. Copy the **Signing secret** (starts with `whsec_`)
6. Add to your production environment variables

### Step 4: Test the Integration

#### Test Card Numbers:
```
Success:         4242 4242 4242 4242
3D Secure:       4000 0027 6000 3184
Decline:         4000 0000 0000 0002

Expiration:      Any future date (e.g., 12/25)
CVC:             Any 3 digits (e.g., 123)
ZIP:             Any 5 digits (e.g., 12345)
```

#### Testing Flow:
1. Start your dev server: `npm run dev`
2. Log into your platform
3. Navigate to `/wallet`
4. Enter an amount (e.g., $10.00)
5. Click "💳 Deposit with Stripe"
6. Enter test card: `4242 4242 4242 4242`
7. Complete the payment
8. Verify:
   - Wallet balance updates
   - Transaction appears in history
   - Webhook logs in terminal show success

---

## 💰 Payment Limits

- **Minimum:** $1.00
- **Maximum:** $10,000.00 per transaction

To change these limits, edit:
- [src/pages/api/payments/create-intent.ts](src/pages/api/payments/create-intent.ts) (lines 27-29)
- [src/pages/wallet.tsx](src/pages/wallet.tsx) (line 287)

---

## 🔍 Monitoring Payments

### Stripe Dashboard:
- **Payments**: View all transactions
- **Customers**: See customer profiles
- **Events**: Monitor webhook deliveries
- **Logs**: Debug API requests

### Your Platform:
- Check `wallet_transactions` table in database
- View transaction history on wallet page
- Monitor webhook logs in your server console

---

## 🌐 Going Live

### When You're Ready for Production:

1. **Complete Stripe Account Activation**
   - Provide business information
   - Add bank account for payouts
   - Complete identity verification

2. **Switch to Live Mode**
   - In Stripe Dashboard, toggle from **Test** to **Live**
   - Get your live API keys (they start with `pk_live_` and `sk_live_`)
   - Update your production environment variables:
     ```bash
     STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY
     NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_PUBLISHABLE_KEY
     ```

3. **Configure Production Webhook**
   - Add webhook endpoint with your production URL
   - Update `STRIPE_WEBHOOK_SECRET` with live webhook secret

4. **Test Everything**
   - Make a small test transaction with a real card
   - Verify webhook delivery
   - Confirm wallet crediting works

---

## 📊 Database Schema

### wallet_transactions Table:
```sql
- id (PRIMARY KEY)
- user_id (FOREIGN KEY → users.id)
- amount (DECIMAL)
- type (credit/debit)
- description (TEXT)
- created_at (TIMESTAMP)
- payment_intent_id (TEXT) -- Stripe PaymentIntent ID
- metadata (JSON) -- Contains paymentMethod, stripeChargeId, etc.
```

---

## 🔐 Security Best Practices

1. **Never commit API keys to git**
   - Keys are in `.env.local` which is gitignored
   - Use environment variables in production

2. **Always verify webhook signatures**
   - Already implemented in `/api/webhooks/stripe`
   - Prevents unauthorized requests

3. **Use HTTPS in production**
   - Required for Stripe webhooks
   - Required for secure payment processing

4. **Monitor for fraud**
   - Use Stripe Radar (included)
   - Set up alerts for suspicious activity

---

## 🆘 Troubleshooting

### "Webhook signature verification failed"
- Ensure `STRIPE_WEBHOOK_SECRET` matches your endpoint's secret
- Check that the raw request body is used (not parsed JSON)

### "Payment succeeds but wallet not credited"
- Check webhook delivery in Stripe Dashboard
- Verify webhook endpoint is reachable from internet
- Check server logs for errors in webhook handler

### "Test card declined"
- Ensure using test mode keys (pk_test_, sk_test_)
- Use correct test card numbers from above
- Check Stripe Dashboard for decline reason

### Payments work but no transaction history
- Check `wallet_transactions` table in database
- Verify `/api/wallet/transactions` endpoint works
- Check browser console for API errors

---

## 📚 Additional Resources

- **Stripe Documentation**: [https://stripe.com/docs](https://stripe.com/docs)
- **Stripe CLI**: [https://stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)
- **Testing Guide**: [https://stripe.com/docs/testing](https://stripe.com/docs/testing)
- **Webhook Events**: [https://stripe.com/docs/webhooks](https://stripe.com/docs/webhooks)
- **PayPal via Stripe**: [https://stripe.com/docs/payments/paypal](https://stripe.com/docs/payments/paypal)

---

## 🎯 Next Steps

1. **Create Stripe account** and get test keys
2. **Update .env.local** with your API keys
3. **Test deposits** using test card numbers
4. **Set up webhook endpoint** for local testing
5. **Monitor transactions** in Stripe Dashboard
6. **Go live** when ready for real payments

---

## 💡 Tips

- Start with small test amounts
- Test all payment methods (card, PayPal, etc.)
- Monitor webhook delivery carefully
- Keep test and live modes separate
- Enable Stripe Radar for fraud prevention
- Set up email notifications for payments
- Regularly check Stripe Dashboard for insights

---

## ✅ Integration Checklist

- [x] Stripe packages installed
- [x] Environment variables configured
- [x] Payment intent API created
- [x] Webhook handler implemented
- [x] Deposit UI component built
- [x] Wallet page updated
- [x] Build successful
- [ ] Stripe account created
- [ ] Test keys added to .env.local
- [ ] Webhook endpoint configured
- [ ] Test transactions completed
- [ ] Live keys configured (when ready)
- [ ] Production webhook configured

---

**Need Help?** Contact Stripe support or refer to their comprehensive documentation at [https://stripe.com/docs](https://stripe.com/docs)
