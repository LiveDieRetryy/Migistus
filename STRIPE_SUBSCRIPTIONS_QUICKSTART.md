# Stripe Subscriptions Quick Start

## 🚀 What We Built

Complete subscription system for MIGISTUS membership tiers:
- **Guild Member**: $9.99/month (3 votes, priority support)
- **MIGISTUS Elite**: $19.99/month (10 votes, premium support)

## 📋 Setup Checklist

### 1. Get Your Stripe Price IDs
- [ ] Go to [Stripe Dashboard → Products](https://dashboard.stripe.com/test/products)
- [ ] Click "Guild Member" → Copy the Price ID (starts with `price_`)
- [ ] Click "MIGISTUS Elite" → Copy the Price ID
- [ ] Update `.env.local`:
  ```env
  STRIPE_GUILD_PRICE_ID=price_XXXXX
  STRIPE_ELITE_PRICE_ID=price_YYYYY
  ```

### 2. Update Database
Run these SQL commands on your database:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_status VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_stripe_subscription ON users(stripe_subscription_id);
```

### 3. Update db.ts
Add these lines to the `updateUser` function in `src/lib/db.ts`:

```typescript
if (data.stripeCustomerId !== undefined) updateFields.stripe_customer_id = data.stripeCustomerId;
if (data.stripeSubscriptionId !== undefined) updateFields.stripe_subscription_id = data.stripeSubscriptionId;
if (data.stripeSubscriptionStatus !== undefined) updateFields.stripe_subscription_status = data.stripeSubscriptionStatus;
if (data.subscriptionCurrentPeriodEnd !== undefined) updateFields.subscription_current_period_end = data.subscriptionCurrentPeriodEnd;
```

### 4. Update User Types
Add to `src/types/user.ts` in `UserProfile` interface:

```typescript
stripeCustomerId?: string;
stripeSubscriptionId?: string;
stripeSubscriptionStatus?: string;
subscriptionCurrentPeriodEnd?: string;
```

### 5. Test Locally
```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Forward webhooks
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Copy the webhook secret (whsec_...) to .env.local
```

Navigate to: `http://localhost:3000/account/subscription`

### 6. Test Subscription
- Click "Upgrade Now" on Guild Member or MIGISTUS Elite
- Use test card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits
- Complete checkout
- Verify user tier updated

## 🗂️ Files Created

### APIs (4 files)
- `/api/subscriptions/create-customer.ts` - Create Stripe customers
- `/api/subscriptions/create-checkout-session.ts` - Generate checkout sessions
- `/api/subscriptions/cancel-subscription.ts` - Cancel subscriptions
- `/api/webhooks/stripe.ts` - Updated with subscription handlers

### UI (2 files)
- `/components/subscription/SubscriptionUpgrade.tsx` - Tier selection UI
- `/pages/account/subscription.tsx` - Subscription management page

### Docs (2 files)
- `STRIPE_SUBSCRIPTIONS_GUIDE.md` - Complete implementation guide
- `STRIPE_SUBSCRIPTIONS_QUICKSTART.md` - This file

## 🎯 User Flow

1. User visits `/account/subscription`
2. Sees current tier and upgrade options
3. Clicks "Upgrade Now"
4. Redirects to Stripe Checkout
5. Completes payment
6. Returns to app with success message
7. Tier automatically updated via webhook

## 🔔 Webhook Events

The system handles these events automatically:
- ✅ `customer.subscription.created` - Grant tier access
- ✅ `customer.subscription.updated` - Update tier if status changes
- ✅ `customer.subscription.deleted` - Downgrade to Initiate
- ✅ `invoice.payment_succeeded` - Log successful renewal
- ✅ `invoice.payment_failed` - Log failed payment

## 🧪 Test Cards

| Card | Result |
|------|--------|
| `4242 4242 4242 4242` | ✅ Success |
| `4000 0025 0000 3155` | 🔐 3D Secure |
| `4000 0000 0000 9995` | ❌ Declined |

## 🚨 Common Issues

**Webhook not working?**
- Run `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- Copy the new webhook secret to `.env.local`

**User tier not updating?**
- Check terminal logs for webhook events
- Verify database columns exist
- Check `db.updateUser()` has new fields

**Price ID error?**
- Make sure `STRIPE_GUILD_PRICE_ID` and `STRIPE_ELITE_PRICE_ID` are set
- Verify they start with `price_`
- Check they're from the correct Stripe mode (test/live)

## 📚 Full Documentation

For detailed setup and troubleshooting, see: `STRIPE_SUBSCRIPTIONS_GUIDE.md`

## ✅ You're Ready When...

- [ ] Price IDs added to `.env.local`
- [ ] Database columns added
- [ ] `db.ts` updated with new fields
- [ ] User types updated
- [ ] Test subscription works end-to-end
- [ ] User tier updates after payment
- [ ] Webhook events logged successfully

---

**Next Steps:** Once tested locally, follow the "Production Deployment" section in the full guide to go live!
