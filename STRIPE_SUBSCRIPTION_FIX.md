# Stripe Subscription Fix - December 29, 2025

## 🐛 Problem Identified

**Error:** "Failed to create customer: Unknown error"

**Root Cause:** The production database is **missing required Stripe columns** in the `users` table:
- `stripe_customer_id`
- `stripe_subscription_id`
- `stripe_subscription_status`
- `subscription_current_period_end`

The code attempts to update these columns via `db.updateUser()`, but they don't exist in the database, causing SQL errors.

---

## ✅ Solution Implemented

### 1. Updated Database Schema
**File:** `db/schema.sql`

Added Stripe columns to the users table definition:
```sql
-- Stripe subscription fields
stripe_customer_id VARCHAR(255),
stripe_subscription_id VARCHAR(255),
stripe_subscription_status VARCHAR(50),
subscription_current_period_end TIMESTAMP
```

### 2. Created Migration Script
**File:** `db/migrations/add_stripe_columns.sql`

This script safely adds the columns with indexes for performance.

---

## 🚀 How to Fix Production Database

### Option 1: Run Migration via Vercel Dashboard (RECOMMENDED)

1. **Login to Vercel Dashboard**
   - Go to https://vercel.com/dashboard
   - Navigate to your MIGISTUS project
   - Click on "Storage" tab
   - Select your Postgres database

2. **Open SQL Query Editor**
   - Click "Query" or "Data" tab
   - You'll see a SQL query interface

3. **Run the Migration**
   - Copy the entire contents of `db/migrations/add_stripe_columns.sql`
   - Paste into the query editor
   - Click "Execute" or "Run Query"

4. **Verify Success**
   - You should see 4 rows returned showing the new columns:
     ```
     column_name                      | data_type
     ---------------------------------|------------
     stripe_customer_id               | character varying
     stripe_subscription_id           | character varying
     stripe_subscription_status       | character varying
     subscription_current_period_end  | timestamp without time zone
     ```

### Option 2: Run via Command Line

If you have the Vercel CLI installed:

```bash
# Connect to your database
vercel env pull
psql $POSTGRES_URL < db/migrations/add_stripe_columns.sql
```

### Option 3: Manual Column Addition

If you prefer to add columns manually, run these commands one at a time in Vercel SQL editor:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_status VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_stripe_subscription ON users(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(stripe_subscription_status);
```

---

## 🧪 Testing After Migration

### 1. Verify Columns Exist

Run this query in Vercel dashboard:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name LIKE '%stripe%' OR column_name LIKE '%subscription%'
ORDER BY column_name;
```

Expected output should show all 4 new columns.

### 2. Test Subscription Upgrade

1. Log into your deployed website
2. Go to membership upgrade page
3. Click "Upgrade Now" on Guild or Elite tier
4. You should now see the Stripe checkout page (not an error)

### 3. Check Server Logs

In Vercel dashboard → Deployment → Runtime Logs, you should see:
```
✅ Created Stripe customer cus_xxxxx for user 123
```

Instead of database errors.

---

## 📊 What Changed

### Before (Broken)
```
User clicks upgrade 
→ API tries to create Stripe customer
→ API attempts: UPDATE users SET stripe_customer_id = 'cus_xxx' WHERE id = 123
→ ❌ ERROR: column "stripe_customer_id" does not exist
→ User sees: "Failed to create customer: Unknown error"
```

### After (Fixed)
```
User clicks upgrade 
→ API creates Stripe customer
→ API executes: UPDATE users SET stripe_customer_id = 'cus_xxx' WHERE id = 123
→ ✅ SUCCESS: Customer ID saved to database
→ User redirected to Stripe checkout page
```

---

## 🔐 Additional Notes

### Stripe Configuration

Make sure these environment variables are set in Vercel:

```env
STRIPE_SECRET_KEY=sk_test_... (or sk_live_... for production)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... (or pk_live_...)
STRIPE_WEBHOOK_SECRET=whsec_... (for webhook signature verification)
```

### Price IDs

Update the Stripe price IDs in your code to match your actual Stripe products:

**File:** `src/pages/api/subscriptions/create-checkout-session.ts`

```typescript
const priceMap = {
  guild: 'price_XXXXXXXXXXXXX',  // Replace with actual Price ID
  elite: 'price_XXXXXXXXXXXXX'   // Replace with actual Price ID
};
```

To get Price IDs:
1. Go to Stripe Dashboard → Products
2. Click on your product (Guild Member or MIGISTUS Elite)
3. Copy the Price ID (starts with `price_`)

---

## 🎯 Next Steps

After running the migration:

1. ✅ Test membership upgrades on production
2. ✅ Verify Stripe customer creation works
3. ✅ Test subscription webhook handling
4. ✅ Confirm tier upgrades reflect in user profile
5. ✅ Test subscription cancellation flow

---

## 📝 Files Modified

- ✅ `db/schema.sql` - Added Stripe columns to CREATE TABLE statement
- ✅ `db/migrations/add_stripe_columns.sql` - Created migration script (NEW)
- ✅ `src/lib/db.ts` - Already handles Stripe columns (no changes needed)

---

## 🆘 Troubleshooting

### Error: "relation 'users' does not exist"
- Your database hasn't been created yet
- Run the full `db/schema.sql` first

### Error: "column 'stripe_customer_id' already exists"
- Migration already ran successfully
- Check with: `SELECT stripe_customer_id FROM users LIMIT 1;`

### Still Getting "Failed to create customer"
1. Check Vercel logs for actual error message
2. Verify STRIPE_SECRET_KEY is set correctly
3. Ensure Stripe API key is not expired/revoked
4. Check if columns were actually added: `\d users` in psql

### Stripe Checkout Not Loading
1. Verify `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set
2. Check browser console for JavaScript errors
3. Ensure Price IDs are correct in checkout session API

---

## ✅ Migration Checklist

- [ ] Backup production database (if possible)
- [ ] Run migration script in Vercel dashboard
- [ ] Verify columns exist with SELECT query
- [ ] Test membership upgrade on production
- [ ] Check Vercel logs for success message
- [ ] Verify Stripe customer created in Stripe dashboard
- [ ] Test complete checkout flow
- [ ] Update STRIPE_SUBSCRIPTIONS_GUIDE.md with completion date

---

**Status:** Migration ready to deploy  
**Impact:** Fixes membership upgrade functionality  
**Risk Level:** Low (adding columns is non-destructive)  
**Rollback:** Simply remove columns if issues occur (no data loss)
