# Additional Dependencies for Full Production Value

## Current Status ✅

You already have most of what you need! Here's what's in place:
- ✅ @vercel/postgres - Database package
- ✅ bcryptjs - Password hashing
- ✅ cookie - Cookie parsing/serialization
- ✅ zod - Schema validation (can use for env vars)
- ✅ Next.js API routes
- ✅ TypeScript

## Critical Issues Found 🔴

### 1. **Session Storage Problem**
**Current:** `src/lib/session.ts` uses **in-memory storage** for production
```typescript
// This gets WIPED on every serverless cold start!
let inMemorySessions: Record<string, Session> = {};
```

**Impact:**
- ❌ Sessions lost when serverless function restarts (every ~15 minutes)
- ❌ Users get logged out randomly
- ❌ No session persistence across deployments

**Solution:** Created `src/lib/session-new.ts` that uses PostgreSQL in production

### 2. **Missing Database Helper**
Your `db.ts` has `getSession()` but login.ts uses a different cookie name and doesn't integrate properly.

## Required Updates

### 1. Replace Session Library ⚠️ CRITICAL

**Action:** Replace `src/lib/session.ts` with `src/lib/session-new.ts`

```bash
# Backup old file
mv src/lib/session.ts src/lib/session-old.ts

# Use new database-backed version
mv src/lib/session-new.ts src/lib/session.ts
```

**Why:** New version uses PostgreSQL in production, files in development.

### 2. Update All API Routes Using Sessions

**Files to update:**
- `src/pages/api/auth/login.ts` ✅ (already updated to use db)
- `src/pages/api/auth/register.ts` - Needs async session functions
- `src/pages/api/auth/logout.ts` - Needs async deleteSession
- `src/pages/api/account/*.ts` - All need async requireAuth
- Any route using `requireAuth()` or `requireAdmin()`

**Change needed:**
```typescript
// OLD (sync):
const session = requireAuth(req, res);

// NEW (async):
const session = await requireAuth(req, res);
```

### 3. Add getUserByUsername to Database

Your login allows username OR email, but `db.ts` only has `getUser(email)`.

**Add to `src/lib/db.ts`:**
```typescript
async getUserByUsername(username: string) {
  const result = await sql`
    SELECT * FROM users WHERE username = ${username} LIMIT 1
  `;
  return result.rows[0] || null;
},

async getUserByEmailOrUsername(identifier: string) {
  const result = await sql`
    SELECT * FROM users 
    WHERE email = ${identifier} OR username = ${identifier}
    LIMIT 1
  `;
  return result.rows[0] || null;
},
```

## Recommended Dependencies (Optional)

### 1. **Environment Variable Validation**
```bash
npm install dotenv-safe
```

Create `.env.example`:
```env
POSTGRES_URL=
NODE_ENV=
VERCEL_ENV=
```

### 2. **Rate Limiting** (Prevent brute force attacks)
```bash
npm install express-rate-limit
```

### 3. **Input Sanitization**
```bash
npm install validator
```

For email validation, XSS prevention, etc.

### 4. **Logging** (Production debugging)
```bash
npm install pino pino-pretty
```

Better than console.log for production.

### 5. **Monitoring** (Optional but valuable)
```bash
npm install @sentry/nextjs
```

Track errors in production automatically.

## Security Enhancements Needed

### 1. **CSRF Protection**
Add CSRF tokens to forms (or use SameSite cookies - you already have this ✅)

### 2. **Rate Limiting on Auth Routes**
Prevent brute force password attacks:

```typescript
// Example rate limiter
const loginAttempts = new Map();

export function checkRateLimit(identifier: string): boolean {
  const attempts = loginAttempts.get(identifier) || { count: 0, timestamp: Date.now() };
  
  // Reset after 15 minutes
  if (Date.now() - attempts.timestamp > 15 * 60 * 1000) {
    attempts.count = 0;
    attempts.timestamp = Date.now();
  }
  
  attempts.count++;
  loginAttempts.set(identifier, attempts);
  
  return attempts.count <= 5; // Max 5 attempts per 15 minutes
}
```

### 3. **Password Requirements**
Your current minimum is 3 characters - should be at least 8:

```typescript
if (password.length < 8) {
  return res.status(400).json({ 
    error: "Password must be at least 8 characters" 
  });
}
```

### 4. **SQL Injection Protection**
You're using parameterized queries with `@vercel/postgres` - ✅ Already protected!

## Database Migration Checklist

### Before Production Deploy:

- [ ] Replace session.ts with database-backed version
- [ ] Update all routes to use async session functions
- [ ] Add getUserByUsername to db.ts
- [ ] Test locally with database connection
- [ ] Run migration script (`npm run db:migrate`)
- [ ] Verify all sessions persist after restart
- [ ] Test login/logout flow
- [ ] Test protected routes
- [ ] Deploy to Vercel
- [ ] Verify production login works

## File Changes Summary

### Files Created:
1. ✅ `db/schema.sql` - Database schema
2. ✅ `src/lib/db.ts` - Database helpers
3. ✅ `src/lib/session-new.ts` - NEW async session management
4. ✅ `scripts/migrate-to-database.ts` - Data migration
5. ✅ `scripts/test-db-connection.ts` - Connection test

### Files Need Updating:
1. ⚠️ `src/lib/session.ts` - Replace with new version
2. ⚠️ `src/pages/api/auth/register.ts` - Use async sessions
3. ⚠️ `src/pages/api/auth/logout.ts` - Use async deleteSession
4. ⚠️ `src/pages/api/account/*.ts` - Use async requireAuth
5. ⚠️ `src/pages/api/auth/login.ts` - Use proper cookie name (migistus_session)

### Cookie Name Mismatch! 🔴

**Issue:**
- `session.ts` uses `migistus_session`
- `login.ts` uses `session`

**Fix:** Update login.ts to use consistent cookie name or import from session.ts

## Immediate Action Items

### 1. Fix Session Storage (CRITICAL)
```bash
# Backup current file
cp src/lib/session.ts src/lib/session-backup.ts

# Replace with database version
cp src/lib/session-new.ts src/lib/session.ts
```

### 2. Fix Cookie Name in login.ts
Use `setSessionCookie` from session.ts instead of custom implementation.

### 3. Make All Session Functions Async
Search and replace in all API routes:
```bash
# Find routes using requireAuth
grep -r "requireAuth" src/pages/api/
```

Update each one to use `await requireAuth()`.

### 4. Add Missing DB Functions
Add `getUserByEmailOrUsername` to `src/lib/db.ts`.

### 5. Test Thoroughly
```bash
# Test database connection
npm run db:test

# Run migration
npm run db:migrate

# Test build
npm run build

# Test locally
npm run dev
```

## Production Checklist

- [ ] Database created in Vercel
- [ ] Schema initialized
- [ ] Data migrated
- [ ] Session storage uses database
- [ ] All routes use async session functions
- [ ] Cookie names consistent
- [ ] Environment variables set
- [ ] Build passes
- [ ] Local testing complete
- [ ] Deploy to Vercel
- [ ] Production testing complete
- [ ] Admin login works
- [ ] Sessions persist
- [ ] No random logouts

## Performance Considerations

### Connection Pooling
`@vercel/postgres` handles this automatically ✅

### Database Indexes
Your schema already has indexes on:
- ✅ username (unique)
- ✅ email (unique)
- ✅ session_id (unique)
- ✅ expires_at (for cleanup queries)

### Session Cleanup
Add a cron job to clean expired sessions:

```typescript
// src/pages/api/cron/cleanup-sessions.ts
import { db } from '@/lib/db';

export default async function handler(req, res) {
  // Verify it's a cron request
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await db.cleanupExpiredSessions();
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Cleanup failed' });
  }
}
```

Then configure in `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/cleanup-sessions",
    "schedule": "0 0 * * *"
  }]
}
```

## Summary

### You Have:
✅ Database package
✅ Database schema
✅ Migration scripts
✅ Most security features

### You Need:
❌ Session storage to use database (not in-memory)
❌ All routes to use async session functions
❌ Consistent cookie names
❌ getUserByEmailOrUsername helper

### Recommended:
- Environment variable validation
- Rate limiting on auth routes
- Better password requirements (8+ chars)
- Production logging
- Error monitoring

### Time to Production:
- **Fix session storage:** 5 minutes
- **Update API routes:** 15 minutes  
- **Test locally:** 10 minutes
- **Deploy:** 5 minutes
- **Total:** ~35 minutes to full production value

---

**The main blocker is the session storage using in-memory instead of database. Fix that, and you're production-ready!**
