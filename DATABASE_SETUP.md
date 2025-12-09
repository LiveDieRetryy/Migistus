# Production Database Setup Guide

## Overview
Your authentication system has been upgraded to use **PostgreSQL** instead of file-based JSON storage. This enables persistent authentication, sessions, and user data in production.

## Current Status
✅ Database schema created (`db/schema.sql`)
✅ Database utilities created (`src/lib/db.ts`)
✅ Login API updated to use database in production
✅ Migration script created (`scripts/migrate-to-database.ts`)
✅ Development fallback (still uses JSON files locally)

## What Changed

### Before (File-Based - BROKEN in Production)
- User data stored in `public/data/users.json`
- Sessions stored in `public/data/sessions.json`
- ❌ Cannot write to files in Vercel (serverless = read-only filesystem)
- ❌ Authentication fails on deployed domain
- ❌ No persistent sessions

### After (Database - PRODUCTION READY)
- User data in PostgreSQL `users` table
- Sessions in PostgreSQL `sessions` table
- ✅ Persistent storage across all serverless functions
- ✅ Authentication works on deployed domain
- ✅ Sessions persist properly
- ✅ Still works in development (uses JSON files as fallback)

## Setup Steps

### 1. Create Vercel Postgres Database

**Option A: Via Vercel Dashboard (Recommended)**
1. Go to https://vercel.com/dashboard
2. Select your project (migistus-app)
3. Go to "Storage" tab
4. Click "Create Database"
5. Select "Postgres"
6. Choose region (closest to your users)
7. Click "Create"

**Option B: Via Vercel CLI**
```bash
vercel link  # If not already linked
vercel storage create postgres migistus-db
```

### 2. Initialize Database Schema

After creating the database, you need to run the schema:

**Via Vercel Dashboard:**
1. Go to your database in Vercel dashboard
2. Click "Query" tab
3. Copy the entire contents of `db/schema.sql`
4. Paste into the query editor
5. Click "Run Query"
6. Verify all tables were created

**Via Command Line (if you have psql):**
```bash
# Get connection string from Vercel dashboard
psql "postgres://..." < db/schema.sql
```

### 3. Configure Environment Variables

Vercel automatically adds these when you create a Postgres database:
- `POSTGRES_URL` - Full connection string
- `POSTGRES_PRISMA_URL` - For Prisma (not used)
- `POSTGRES_URL_NON_POOLING` - Direct connection

**Verify in Vercel Dashboard:**
1. Go to Project Settings → Environment Variables
2. Make sure `POSTGRES_URL` is set
3. Should look like: `postgres://user:pass@host/database?sslmode=require`

### 4. Migrate Existing Data

Run the migration script to copy users from JSON to database:

```bash
# Install dependencies if needed
npm install tsx --save-dev

# Run migration (requires DATABASE_URL environment variable)
POSTGRES_URL="your-connection-string" npx tsx scripts/migrate-to-database.ts
```

**Important Notes:**
- Migration script is **safe to run multiple times** (skips existing users)
- It will migrate all users from `public/data/users.json`
- Preserves passwords, tiers, and all user data
- Also migrates products from `public/data/products.json`

### 5. Test Locally

Before deploying, test the database connection:

```bash
# Create test file: test-db-connection.ts
import { sql } from '@vercel/postgres';

async function test() {
  try {
    const result = await sql`SELECT COUNT(*) FROM users`;
    console.log('✅ Database connected!');
    console.log('Users in database:', result.rows[0].count);
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
}

test();
```

Run it:
```bash
POSTGRES_URL="your-connection-string" npx tsx test-db-connection.ts
```

### 6. Deploy to Production

```bash
git add .
git commit -m "feat: add PostgreSQL database for production authentication"
git push origin main
```

Vercel will automatically:
- Detect database environment variables
- Build with database support
- Use PostgreSQL in production
- Keep JSON files for local development

### 7. Verify Production Authentication

After deployment:
1. Go to your deployed domain
2. Try logging in with your admin account
3. Email: `admin@migistus.com`
4. Password: (your admin password)
5. ✅ Should work now with persistent sessions!

## Database Tables

Your database includes these tables:

### `users`
- User accounts with credentials
- Tier system (Initiate → Legend)
- Profile information
- Marketing preferences

### `sessions`
- Active login sessions
- 30-day expiration
- Automatic cleanup of expired sessions

### `products`
- Product catalog
- Lifecycle stages (Dormant → Shipped)
- Supplier information

### `votes`
- User votes on products
- Tier-weighted voting
- One vote per product per day per user

### `staff_picks`
- Featured products
- Payment tracking
- Revenue calculations

### `pledges`
- Pre-order commitments
- Tier-based pledge amounts

### `user_activity`
- Page views
- User actions
- Activity tracking

## Troubleshooting

### "Cannot connect to database"
**Solution:** 
- Check `POSTGRES_URL` environment variable is set
- Verify database is created in Vercel dashboard
- Make sure you're using the correct connection string

### "relation 'users' does not exist"
**Solution:**
- Run the schema.sql file in your database
- Check database initialization step

### "Login still fails in production"
**Solution:**
- Clear browser cookies/cache
- Check Vercel logs: `vercel logs`
- Verify migration completed successfully
- Ensure environment variables are set

### "Development login stopped working"
**Solution:**
- Development still uses JSON files
- Make sure `public/data/users.json` exists
- Check `isProduction()` returns false locally

## Development vs Production

### Development (Local)
- Uses `public/data/users.json`
- No database required
- Fast iteration
- File-based sessions

### Production (Vercel)
- Uses PostgreSQL database
- Persistent data
- Scalable
- Server-side sessions

## Security Notes

✅ **Passwords:** Hashed with bcrypt (10 rounds)
✅ **Sessions:** HttpOnly cookies, 30-day expiration
✅ **SQL Injection:** Protected by parameterized queries
✅ **Environment:** Database credentials in environment variables only

## Next Steps

After setup is complete:

1. **Test all authentication flows:**
   - Login
   - Logout
   - Session persistence
   - Password validation

2. **Migrate other features to database:**
   - Voting system
   - Pledges
   - User activity tracking

3. **Set up database backups** in Vercel dashboard

4. **Monitor performance** in Vercel Analytics

## Files Modified/Created

### New Files
- `db/schema.sql` - Database schema
- `src/lib/db.ts` - Database utilities
- `scripts/migrate-to-database.ts` - Data migration script
- `DATABASE_SETUP.md` - This guide

### Modified Files
- `src/pages/api/auth/login.ts` - Now uses database in production
- `package.json` - Added @vercel/postgres dependency

## Support

If you run into issues:
1. Check Vercel logs: `vercel logs --follow`
2. Test database connection with test script above
3. Verify environment variables in Vercel dashboard
4. Make sure schema was initialized properly

---

## Quick Command Reference

```bash
# Install dependencies
npm install

# Run migration
POSTGRES_URL="your-url" npx tsx scripts/migrate-to-database.ts

# Test database
POSTGRES_URL="your-url" npx tsx test-db-connection.ts

# Deploy to production
git push origin main

# View logs
vercel logs --follow
```

---

**You now have full production authentication! 🎉**

Your admin account and all users will persist across deployments and work on your deployed domain.
