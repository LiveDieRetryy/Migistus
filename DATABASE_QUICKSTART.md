# 🚀 Quick Start: Production Database

## TL;DR
Your authentication now uses PostgreSQL in production instead of JSON files. This fixes the login issue on your deployed domain.

## Setup (5 Steps)

### 1️⃣ Create Database
```
Vercel Dashboard → Storage → Create Database → Postgres
```

### 2️⃣ Run Schema
```
Database → Query tab → Paste db/schema.sql → Run
```

### 3️⃣ Migrate Data
```bash
POSTGRES_URL="your-connection-string" npm run db:migrate
```

### 4️⃣ Deploy
```bash
git add .
git commit -m "feat: production database"
git push origin main
```

### 5️⃣ Test Login
```
Go to your deployed domain
Login with: admin@migistus.com
✅ Should work now!
```

## What Changed

| Before | After |
|--------|-------|
| ❌ JSON files (read-only in Vercel) | ✅ PostgreSQL database |
| ❌ Login fails in production | ✅ Login works everywhere |
| ❌ Sessions don't persist | ✅ 30-day persistent sessions |
| ❌ Admin account inaccessible | ✅ Full admin access |

## Files Created

1. **db/schema.sql** - Database tables
2. **src/lib/db.ts** - Database helpers
3. **scripts/migrate-to-database.ts** - Data migration
4. **scripts/test-db-connection.ts** - Connection test
5. **DATABASE_SETUP.md** - Full setup guide
6. **DATABASE_MIGRATION_COMPLETE.md** - What we did

## New Commands

```bash
npm run db:test      # Test database connection
npm run db:migrate   # Migrate data from JSON
```

## How It Works

**Development (Local):**
- Uses `public/data/users.json`
- No database needed
- Works as before

**Production (Vercel):**
- Uses PostgreSQL database
- Persistent sessions
- Scalable & secure

## Need Help?

See **DATABASE_SETUP.md** for detailed instructions.

---

**You're ready to deploy!** 🎉

No more file-based auth. This is full production value.
