# 🚨 STRIPE SUBSCRIPTION FIX - QUICK REFERENCE

## The Problem
❌ **Error:** "Failed to create customer: Unknown error"  
❌ **Cause:** Database missing Stripe columns  
❌ **Impact:** Membership upgrades completely broken on production

---

## The Solution (5 Minutes)

### Step 1: Login to Vercel
```
https://vercel.com/dashboard
→ Your MIGISTUS project
→ Storage tab
→ Your Postgres database
→ Click "Query" or "Data"
```

### Step 2: Copy & Paste This SQL
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_status VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_stripe_subscription ON users(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(stripe_subscription_status);
```

### Step 3: Verify It Worked
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name LIKE '%stripe%';
```

Should return:
- stripe_customer_id
- stripe_subscription_id  
- stripe_subscription_status

### Step 4: Test
1. Go to your website
2. Login with a database account
3. Click "Upgrade Now" on any tier
4. Should now redirect to Stripe checkout (no error!)

---

## Files Created/Updated

✅ `db/schema.sql` - Added Stripe columns  
✅ `db/migrations/add_stripe_columns.sql` - Migration script  
✅ `STRIPE_SUBSCRIPTION_FIX.md` - Full documentation  
✅ `KNOWN_ISSUES_AND_TODOS.md` - Updated with urgent notice

---

## What This Fixes

**Before:**
```
User clicks "Upgrade Now"
→ API creates Stripe customer
→ Tries: UPDATE users SET stripe_customer_id = 'cus_123'
→ ❌ ERROR: column doesn't exist
→ User sees error message
```

**After:**
```
User clicks "Upgrade Now"
→ API creates Stripe customer
→ UPDATE users SET stripe_customer_id = 'cus_123'
→ ✅ SUCCESS
→ Redirects to Stripe checkout
```

---

## Why This Happened

The subscription system was implemented but the database schema wasn't updated in production. The code expects these columns to exist (and they're in the code), but they were never added to the live database.

---

## Rollback (If Needed)

```sql
ALTER TABLE users DROP COLUMN IF EXISTS stripe_customer_id;
ALTER TABLE users DROP COLUMN IF EXISTS stripe_subscription_id;
ALTER TABLE users DROP COLUMN IF EXISTS stripe_subscription_status;
ALTER TABLE users DROP COLUMN IF EXISTS subscription_current_period_end;
```

---

## Next Steps After Fix

1. ✅ Test membership upgrades work
2. ✅ Verify Stripe customer creation in Stripe dashboard
3. ✅ Test webhook handling
4. ✅ Commit schema changes to git
5. ✅ Update documentation with completion date

---

**Estimated Fix Time:** 5 minutes  
**Risk Level:** Low (just adding columns)  
**Can Break Existing Features:** No  
**Requires Code Deploy:** No (database-only fix)
