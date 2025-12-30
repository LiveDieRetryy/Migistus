# Stripe Subscriptions Implementation Guide

## 🎯 Overview

This guide covers the complete implementation of Stripe subscription management for MIGISTUS membership tiers (Guild Member and MIGISTUS Elite).

## 📁 Files Created/Modified

### API Endpoints
1. **`src/pages/api/subscriptions/create-customer.ts`** - Creates or retrieves Stripe Customer records
2. **`src/pages/api/subscriptions/create-checkout-session.ts`** - Generates Stripe Checkout Sessions for subscriptions
3. **`src/pages/api/subscriptions/cancel-subscription.ts`** - Handles subscription cancellation
4. **`src/pages/api/webhooks/stripe.ts`** - Updated with subscription event handlers

### Components & Pages
5. **`src/components/subscription/SubscriptionUpgrade.tsx`** - Subscription tier selection UI
6. **`src/pages/account/subscription.tsx`** - Subscription management page

### Configuration
7. **`.env.local`** - Added subscription-specific environment variables

## 🔧 Setup Instructions

### Step 1: Get Stripe Price IDs

You already created the subscription products in Stripe Dashboard. Now you need to get their Price IDs:

1. Go to [Stripe Dashboard → Products](https://dashboard.stripe.com/test/products)
2. Click on **"Guild Member"** product
3. Copy the **Price ID** (starts with `price_`)
4. Do the same for **"MIGISTUS Elite"**

### Step 2: Update Environment Variables

Update `.env.local` with your actual Stripe keys and price IDs:

```env
# Stripe API Keys (already set if you completed wallet deposits)
STRIPE_SECRET_KEY=sk_test_51...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51...
STRIPE_WEBHOOK_SECRET=whsec_...

# Subscription Price IDs (NEW - add these)
STRIPE_GUILD_PRICE_ID=price_XXXXX  # Guild Member $9.99/month
STRIPE_ELITE_PRICE_ID=price_YYYYY  # MIGISTUS Elite $19.99/month

# Base URL for redirects
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Step 3: Database Schema Updates

Your database needs these additional fields on the `users` table:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_status VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMP;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_stripe_subscription ON users(stripe_subscription_id);
```

### Step 4: Update Database Functions

Add these methods to your `src/lib/db.ts` file in the `updateUser` function:

```typescript
if (data.stripeCustomerId !== undefined) updateFields.stripe_customer_id = data.stripeCustomerId;
if (data.stripeSubscriptionId !== undefined) updateFields.stripe_subscription_id = data.stripeSubscriptionId;
if (data.stripeSubscriptionStatus !== undefined) updateFields.stripe_subscription_status = data.stripeSubscriptionStatus;
if (data.subscriptionCurrentPeriodEnd !== undefined) updateFields.subscription_current_period_end = data.subscriptionCurrentPeriodEnd;
```

### Step 5: Update User Type Definition

Add these fields to your `UserProfile` interface in `src/types/user.ts`:

```typescript
export interface UserProfile {
  // ... existing fields ...
  
  // Stripe Subscription Fields
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripeSubscriptionStatus?: string;
  subscriptionCurrentPeriodEnd?: string;
}
```

## 🎨 Subscription Flow

### User Journey

1. **User visits `/account/subscription`**
2. **Sees three tier options:**
   - Initiate (Free) - Current tier displayed
   - Guild Member ($9.99/month)
   - MIGISTUS Elite ($19.99/month)

3. **Clicks "Upgrade Now"**
   - System creates/retrieves Stripe Customer
   - Creates Stripe Checkout Session
   - Redirects to Stripe-hosted checkout page

4. **User completes payment**
   - Stripe processes payment
   - Redirects back to `/account/subscription?success=true`
   - Shows success message

5. **Webhook updates user tier**
   - Stripe sends `customer.subscription.created` webhook
   - Backend updates user's tier in database
   - User now has access to tier benefits

### Backend Flow

```
User clicks upgrade
    ↓
POST /api/subscriptions/create-customer
    ↓ (returns customerId)
POST /api/subscriptions/create-checkout-session
    ↓ (returns checkout URL)
Redirect to Stripe Checkout
    ↓ (user completes payment)
Stripe sends webhook event
    ↓
POST /api/webhooks/stripe
    ↓ (handles customer.subscription.created)
Update user tier in database
    ↓
User redirected back with success
```

## 🔔 Webhook Events Handled

### `customer.subscription.created`
- Fired when new subscription is created
- **Action:** Grant tier access, store subscription ID

### `customer.subscription.updated`
- Fired when subscription status changes (active, past_due, canceled, etc.)
- **Action:** Update tier based on status

### `customer.subscription.deleted`
- Fired when subscription is canceled/expires
- **Action:** Downgrade user to Initiate tier

### `invoice.payment_succeeded`
- Fired when recurring payment succeeds
- **Action:** Log successful renewal (optional)

### `invoice.payment_failed`
- Fired when recurring payment fails
- **Action:** Send notification email (optional)

## 🧪 Testing

### Test Cards

Stripe provides test card numbers:

| Card Number | Scenario |
|-------------|----------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0025 0000 3155` | Requires 3D Secure authentication |
| `4000 0000 0000 9995` | Declined card |
| `4000 0000 0000 0341` | Attaches and succeeds |

Use any future expiration date and any 3-digit CVC.

### Testing Flow

1. **Start development server:**
   ```bash
   npm run dev
   ```

2. **Forward webhooks to localhost:**
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
   Copy the webhook signing secret (starts with `whsec_`) and update `.env.local`

3. **Navigate to subscription page:**
   ```
   http://localhost:3000/account/subscription
   ```

4. **Click "Upgrade Now" on Guild Member or MIGISTUS Elite**

5. **Use test card:** `4242 4242 4242 4242`

6. **Complete checkout**

7. **Verify:**
   - User tier updated in database
   - Subscription ID stored
   - Success message displayed
   - Webhook event logged in terminal

### Verifying Webhooks

Check your terminal running `stripe listen` for webhook events:

```
✅ customer.subscription.created
✅ invoice.payment_succeeded
✅ checkout.session.completed
```

Check your app logs for database updates:

```
✅ Created Stripe customer cus_... for user 123
✅ Created checkout session cs_... for user 123 - guild tier
✅ Updated user 123 tier to Guild (subscription sub_...)
```

## 🚀 Production Deployment

### 1. Switch to Live Mode

1. Get live API keys from Stripe Dashboard (toggle "Test mode" off)
2. Update `.env.local` with live keys:
   ```env
   STRIPE_SECRET_KEY=sk_live_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   ```

3. Create live products and prices in Stripe Dashboard
4. Update price IDs:
   ```env
   STRIPE_GUILD_PRICE_ID=price_live_...
   STRIPE_ELITE_PRICE_ID=price_live_...
   ```

### 2. Configure Production Webhook

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter your production URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the webhook signing secret
6. Update production environment variable:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_live_...
   ```

### 3. Set Production URL

Update `.env` in your production environment:

```env
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

## 🎯 Feature Checklist

- ✅ Create Stripe Customer for users
- ✅ Generate Checkout Sessions for subscriptions
- ✅ Handle subscription webhooks (created, updated, deleted)
- ✅ Update user tier based on subscription status
- ✅ Display subscription management UI
- ✅ Handle successful subscription confirmations
- ✅ Handle canceled checkout flows
- ✅ Support subscription cancellation
- ⏳ Customer Portal integration (optional - use Stripe's hosted portal)
- ⏳ Email notifications for subscription events (future enhancement)
- ⏳ Proration handling for mid-cycle upgrades (future enhancement)

## 📊 Tier Mapping

| Subscription Tier | User Tier | Monthly Price | Votes | Support Level |
|------------------|-----------|---------------|-------|---------------|
| None (Free) | Initiate | $0 | 1 | Community |
| Guild Member | Guild | $9.99 | 3 | Priority |
| MIGISTUS Elite | MIGISTUS | $19.99 | 10 | Premium 24/7 |

## 🔐 Security Considerations

1. **Webhook Signature Verification:** ✅ Implemented
   - All webhooks verify Stripe signature before processing

2. **Customer ID Validation:** ✅ Implemented
   - User ID stored in metadata and verified

3. **Idempotency:** ✅ Handled by Stripe
   - Webhooks may be sent multiple times, handle safely

4. **Database Updates:** ✅ Error handling
   - Failed updates logged but don't return errors to Stripe

## 📝 Next Steps

1. **Get Price IDs from Stripe Dashboard**
2. **Update environment variables**
3. **Run database migrations**
4. **Test with Stripe CLI**
5. **Verify webhook handling**
6. **Test complete subscription flow**

## 🆘 Troubleshooting

### Webhook not receiving events
- Verify `STRIPE_WEBHOOK_SECRET` is correct
- Check `stripe listen` is running
- Ensure endpoint is publicly accessible (in production)

### User tier not updating
- Check webhook logs in terminal
- Verify database schema has required columns
- Check `db.updateUser()` includes new fields

### Checkout session failing
- Verify price IDs are correct
- Check Stripe Dashboard for errors
- Ensure `NEXT_PUBLIC_BASE_URL` is set correctly

## 📚 Additional Resources

- [Stripe Subscriptions Documentation](https://stripe.com/docs/billing/subscriptions/overview)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Testing Cards](https://stripe.com/docs/testing)
- [Stripe Customer Portal](https://stripe.com/docs/billing/subscriptions/integrating-customer-portal)

---

**Need Help?** Check the Stripe Dashboard → Logs → Webhooks for detailed event information.
