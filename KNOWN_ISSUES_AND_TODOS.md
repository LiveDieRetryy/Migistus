# Known Issues & TODOs - MIGISTUS Platform
**Last Updated:** December 29, 2025 - Stripe Subscription Fix Deployed  
**Status:** Stripe columns migration ready, push notifications complete

---

## 🔴 URGENT - PRODUCTION ISSUE

### **Stripe Subscription Upgrade Broken - Missing Database Columns**
**Status:** 🔧 **FIX READY - MIGRATION REQUIRED**  
**Error:** "Failed to create customer: Unknown error"  
**File:** See `STRIPE_SUBSCRIPTION_FIX.md` for complete solution

**Problem:**
- Production database missing Stripe columns in `users` table
- Code attempts to save `stripe_customer_id` but column doesn't exist
- Membership upgrade buttons fail with generic error

**Solution:**
- ✅ Migration script created: `db/migrations/add_stripe_columns.sql`
- ✅ Schema updated: `db/schema.sql`
- ⏳ **ACTION REQUIRED:** Run migration in Vercel Postgres dashboard

**Quick Fix:**
```sql
-- Run this in Vercel SQL Editor:
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_status VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMP;
```

**Documentation:** `STRIPE_SUBSCRIPTION_FIX.md` (complete step-by-step guide)

---

## ✅ RECENTLY COMPLETED (December 29, 2025)

### **Push Notifications System** ✅
- **Completed:** Full web-push implementation with VAPID keys
- **Files Created/Updated:**
  - `public/service-worker.js` (NEW) - Browser push notification handler
  - `src/pages/api/push/send.ts` - Real push notification sending
  - `src/pages/api/push/subscribe.ts` - Device subscription management
  - `src/lib/db.ts` - Added push subscription functions
  - `db/schema.sql` - Added push_subscriptions table
  - `.env.local` - Added VAPID keys and subject
- **Result:**
  - Service worker handles push events, notification clicks, and dismissals
  - VAPID authentication configured (mailto:noreply@migistus.com)
  - Database functions: save, getUserSubs, getAllSubs, deactivate, delete
  - Production sends via webpush.sendNotification()
  - Auto-deactivates invalid subscriptions (410/404 errors)
  - Supports broadcast and targeted push notifications
  - Full TypeScript support with @types/web-push

### **Message Editing Functionality** ✅
- **Completed:** Full edit UI with keyboard shortcuts and indicators
- **Files Updated:**
  - `src/components/messaging/DirectMessageThread.tsx` - Edit state and UI
  - `src/components/messaging/MessageBubble.tsx` - Edit button and "(edited)" indicator
  - `src/pages/api/messages/conversation.ts` - PUT handler for edits
  - `db/schema.sql` - Added edited and edited_at columns
- **Result:**
  - Edit mode with blue banner showing original content
  - Keyboard shortcuts: Enter to save, Escape to cancel
  - Textarea switches between send/edit modes
  - "(edited)" indicator next to timestamp
  - Server validates ownership before allowing edits
  - Stores edit timestamp for transparency
  - Only own messages can be edited

### **Followers API - Database Migration** ✅
- **Completed:** Online status tracking implemented for both production and development
- **Files Updated:** `src/pages/api/followers/index.ts`
- **Result:** 
  - Production uses `db.isUserOnline()` for real-time status
  - Development uses `isUserOnlineFile()` for file-based status
  - Deleted users automatically removed via CASCADE DELETE
  - All follower database functions verified and working

### **Messages & Conversations - Database Migration** ✅
- **Status:** Already completed in previous session, verified this session
- **Files Verified:** 
  - `src/pages/api/messages/conversation.ts`
  - `src/pages/api/messages/conversations.ts`
- **Result:**
  - Messages stored in database with full feature support
  - Reactions, replies, and soft delete working
  - Proper CASCADE DELETE for deleted users
  - All message database functions verified

### **Database Schema Updates** ✅
- **Completed:** Added messaging tables to main schema file
- **File Updated:** `db/schema.sql`
- **Result:** Complete production-ready schema with all indexes

### **Supplier Application System - Complete Account Creation** ✅
- **Completed:** Full approval workflow with email integration
- **File Updated:** `src/pages/api/admin/process-supplier-application.ts`
- **Result:**
  - Creates user account with hashed password (bcrypt)
  - Creates supplier profile in database
  - Sends welcome email with login credentials
  - Production uses database, dev uses files

### **Marketing Preferences - Database Migration** ✅
- **Completed:** Now uses user_settings table
- **File Updated:** `src/pages/api/marketing/preferences.ts`
- **Result:**
  - Stores preferences in user_settings JSONB field
  - Production uses database queries
  - Supports email_notifications and marketing_emails flags

---

## 🔴 CRITICAL PRIORITY

### ~~1. Followers API - Database Migration Incomplete~~ ✅ COMPLETED
**Status:** ✅ **COMPLETED December 29, 2025**
- Online status tracking implemented
- Database functions verified and working
- Deleted users properly handled via CASCADE DELETE
- See `DATABASE_MIGRATION_COMPLETE_PHASE_2.md` for details

### ~~2. Push Notifications - Missing Implementation~~ ✅ COMPLETED
**Status:** ✅ **COMPLETED December 29, 2025**
- Full web-push implementation with VAPID authentication
- Service worker created for browser notification handling
- Database functions and schema complete
- Production sends real push notifications
- See above for complete implementation details

---

## 🟠 HIGH PRIORITY

### 1. **Enforcement Management - Actions Not Wired Up**
**File:** `src/pages/kingdom/enforcement-management.tsx`  
**Lines:** 31, 38  
**Status:** ⚠️ UI COMPLETE, BACKEND NOT CONNECTED

**Problem:**
- Ban/unban buttons display but don't execute actions
- Mute/unmute buttons display but don't execute actions
- TODO comments indicate missing API integration

**Impact:**
- Admins cannot moderate users from the enforcement panel
- Must manually update database to ban/mute users

**Solution Required:**
1. Wire ban button to `POST/PUT /api/users/[id]` with `{ banned: true }`
2. Wire unban button to `POST/PUT /api/users/[id]` with `{ banned: false }`
3. Wire mute button to `POST/PUT /api/users/[id]` with `{ muted: true, mutedUntil: timestamp }`
4. Wire unmute button to `POST/PUT /api/users/[id]` with `{ muted: false }`
5. Add success/error notifications
6. Implement enforcement logging to track admin actions
7. Add email notifications to banned/muted users

**Code Location:**
```typescript
// Line 31
const handleBan = async (userId: number) => {
  // TODO: POST/PUT to /api/users/[id] to update ban status
};

// Line 38
const handleMute = async (userId: number) => {
  // TODO: POST/PUT to /api/users/[id] to update mute status
};
```

---

### ~~2. Supplier Application Approval System~~ ✅ COMPLETED
**Status:** ✅ **COMPLETED December 29, 2025**
- Account creation with bcrypt password hashing
- Database integration for user and supplier profile
- Welcome email with login credentials
- See `DATABASE_MIGRATION_COMPLETE_PHASE_2.md` for implementation details

---

### ~~3. Message Edit Functionality - Missing~~ ✅ COMPLETED
**Status:** ✅ **COMPLETED December 29, 2025**
- Full edit UI in DirectMessageThread with keyboard shortcuts
- Edit button in MessageBubble, "(edited)" indicator
- PUT handler in conversation API
- Database schema with edited and edited_at columns
- Server-side ownership validation

---
  - Vote results
  - Order updates

**Solution Required:**
1. Install `web-push` library: `npm install web-push`
2. Generate VAPID keys for push notifications
3. Implement subscription management (store user subscriptions)
4. Configure service worker for push handling
5. Implement actual push sending in `/api/push/send.ts`
6. Add notification permission request UI
7. Test across browsers (Chrome, Firefox, Safari)

**Code Location:**
```typescript
// Line 71
// TODO: Implement actual push notification sending with web-push library
```

**Additional Files Needed:**
- `public/service-worker.js` - Service worker for push handling
- `.env.local` - VAPID public/private keys
- Client-side subscription management

---

## 🟡 MEDIUM PRIORITY

### 3. **Message Edit Functionality**
**File:** `src/components/messaging/DirectMessageThread.tsx`  
**Line:** 518  
**Status:** ⚠️ UI PLACEHOLDER EXISTS

**Problem:**
- Message edit option appears in UI
- No actual edit functionality implemented
- Clicking edit does nothing

**Impact:**
- Users cannot correct typos or mistakes in messages
- Must delete and resend messages

**Solution Required:**
1. Add edit mode state for messages
2. Show input field with current message content
3. Add save/cancel buttons
4. Update message in database/file storage
5. Add "edited" indicator to message
6. Track edit history (optional)
7. Add edit time limit (e.g., 15 minutes after sending)

**Code Location:**
```typescript
// Line 518
// TODO: Implement edit functionality
```

---

### ~~4. Messages/Conversations - Database Migration Pending~~ ✅ COMPLETED
**Status:** ✅ **ALREADY MIGRATED - Verified December 29, 2025**
- Messages and conversations fully in database
- Proper CASCADE DELETE for deleted users
- Full feature support (reactions, replies, soft delete)
- Performance optimized with indexes
- See `DATABASE_MIGRATION_COMPLETE_PHASE_2.md` for details

---

### ~~5. Marketing Preferences - File-Based Storage~~ ✅ COMPLETED
**Status:** ✅ **COMPLETED December 29, 2025**
- Now uses user_settings table with JSONB preferences field
- Production reads/writes from database
- Development maintains file fallback
- See `DATABASE_MIGRATION_COMPLETE_PHASE_2.md` for implementation details

---

## 🟢 LOW PRIORITY / ENHANCEMENTS

### 6. **Order Confirmation Emails - Not Integrated**
**File:** `src/lib/emailTemplates.ts`  
**Status:** ✅ TEMPLATE READY, ⚠️ NOT INTEGRATED

**Details:**
- Professional template exists and tested
- Not called from order processing APIs
- Manual integration needed when orders implemented

**Solution:**
- Wire up email sending in order completion flow
- Test with real order data

---

### 7. **Drop Notification Emails - Not Integrated**
**File:** `src/lib/emailTemplates.ts`  
**Status:** ✅ TEMPLATE READY, ⚠️ NOT INTEGRATED

**Details:**
- Template exists for notifying users of new drops
- Not automatically sent when products go live
- Would improve user engagement

**Solution:**
- Send emails when product transitions to "community-drops" stage
- Include product details, launch time, and link
- Allow users to opt-in/opt-out

---

### 10. **Supplier Welcome Emails - Not Integrated**
**File:** `src/lib/emailTemplates.ts`  
**Status:** ✅ TEMPLATE READY, ⚠️ NOT INTEGRATED

**Details:**
- Professional welcome email for new suppliers
- Should be sent when supplier account approved
- Part of Issue #3 (Supplier Application Approval)

**Solution:**
- Integrate with supplier approval workflow
- Include login credentials or setup link
- Add getting started guide

---

### 11. **Message Notification Emails - Not Integrated**
**File:** `src/lib/emailTemplates.ts`  
**Status:** ✅ TEMPLATE READY, ⚠️ NOT INTEGRATED

**Details:**
- Email notification for new direct messages
- Template ready but not triggered
- Would improve user engagement

**Solution:**
- Send email when user receives message while offline
- Include message preview and link to conversation
- Add opt-out preference setting

---

## 📊 TECHNICAL DEBT

### 12. **Development Server Instability**
**Evidence:** Terminal history shows multiple failed `npm run dev` attempts  
**Status:** ⚠️ INTERMITTENT ISSUE

**Problem:**
- Dev server frequently exits with code 1
- `.next` directory sometimes needs manual deletion
- Node processes sometimes need force kill

**Possible Causes:**
- Port conflicts
- File locking issues
- Memory leaks
- Turbopack instability

**Temporary Workarounds:**
```powershell
# Current manual fix
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
npm run dev
```

**Solution Required:**
1. Investigate error logs for root cause
2. Check for port conflicts (3000 already in use)
3. Add graceful shutdown handling
4. Consider disabling Turbopack if unstable
5. Add dev server restart script

---

### 13. **Multiple Data Files for Same Purpose**
**Location:** `public/data/`  
**Status:** ⚠️ CLEANUP NEEDED

**Problem:**
- Multiple session files: `sessions.json`, `user-sessions.json`
- Chat files with inconsistent naming
- Backup folders accumulating

**Impact:**
- Confusion about which files are active
- Risk of using wrong data file
- Git repository bloat

**Solution:**
1. Audit all data files and their usage
2. Remove unused/duplicate files
3. Document purpose of each file
4. Add `.gitignore` entries for backups
5. Consider consolidating related data

---

## 🔍 NEEDS INVESTIGATION

### 14. **Next.js Route Duplicates** (May be resolved)
**Mentioned in:** `DEVELOPMENT_PRIORITIES.md`  
**Status:** ⚠️ UNCLEAR IF STILL EXISTS

**Previous Issue:**
- Duplicate routes: `src/pages/account/profile.tsx` and `src/pages/account/profile/index.tsx`
- Caused dev server warnings

**Action Required:**
- Check if both files still exist
- Verify only one profile route exists
- Test profile page loads correctly

---

### 15. **Authentication Context Duplicates** (May be resolved)
**Mentioned in:** `DEVELOPMENT_PRIORITIES.md`  
**Status:** ⚠️ UNCLEAR IF CLEANED UP

**Previous Issue:**
- 4 different AuthContext files existed
- Recommended to keep only `src/context/AuthContext.tsx`

**Files to Check:**
- ✅ KEEP: `src/context/AuthContext.tsx` (main implementation)
- ❓ Check if exists: `src/components/context/AuthContext.tsx`
- ❓ Check if exists: `src/lib/auth.tsx`
- ❓ Check if exists: `src/providers/AuthProvider.tsx`

**Action Required:**
- Verify only main AuthContext exists
- Check all imports use correct path
- Remove any duplicate implementations

---

## 📝 SUMMARY

### By Priority
- **~~Critical~~:** ~~1 issue~~ ✅ **0 issues (Followers migration complete!)**
- **High:** 4 issues (Enforcement, Supplier approval, Push notifications, Message editing)
- **Medium:** 2 issues (Marketing preferences, ~~Message DB migration~~)
- **Low:** 4 issues (Email integrations)
- **Technical Debt:** 2 issues (Dev server, Data files)
- **Needs Investigation:** 2 issues (Route/Auth duplicates)

### By Category
- **~~Database Migration~~:** ~~3 issues~~ ✅ **All Complete! (Followers, Messages)**
- **Feature Implementation:** 5 issues (Enforcement, Push, Message edit, Email integrations)
- **System Integration:** 2 issues (Supplier approval, Drop notifications)
- **Technical Issues:** 2 issues (Dev server stability, File cleanup)
- **Code Cleanup:** 2 issues (Route/Auth duplicates)

### Quick Wins (< 2 hours each)
1. Wire enforcement ban/mute buttons
2. Integrate email templates (order, drop, supplier, message)
3. Check and remove duplicate files (routes, auth contexts)
4. Clean up data file duplicates

### Major Projects (> 4 hours each)
1. ~~Complete followers API database migration~~ ✅ **DONE**
2. Implement push notification system
3. ~~Migrate messages/conversations to database~~ ✅ **DONE**
4. Build supplier approval automation

---

## 🎯 RECOMMENDED NEXT STEPS

### Week 1: Critical Issues
1. ✅ Complete followers API database migration
2. ✅ Wire up enforcement management actions
3. ✅ Test and verify deleted users are fully removed

### Week 2: High Priority Features
1. ✅ Implement supplier approval automation
2. ✅ Set up push notification system
3. ✅ Add message editing functionality

### Week 3: Polish & Integration
1. ✅ Integrate all email templates
2. ✅ Migrate messages to database
3. ✅ Clean up technical debt

### Week 4: Testing & Optimization
1. ✅ End-to-end testing of all features
2. ✅ Performance optimization
3. ✅ Production deployment preparation

---

## 📚 RELATED DOCUMENTATION

- `DATABASE_MIGRATION_SESSION_SUMMARY.md` - Latest migration work
- `PRODUCTION_READY_SUMMARY.md` - Security implementation details
- `DEVELOPMENT_PRIORITIES.md` - Previous priority recommendations
- `EMAIL_SYSTEM_COMPLETE.md` - Email template documentation
- `PLATFORM_OVERVIEW.md` - Complete platform architecture

---

**Note:** This document should be updated as issues are resolved and new issues are discovered. Each resolved issue should be marked with ✅ and moved to a "Recently Completed" section at the bottom of the document.
