# Kingdom Admin System - Database Integration Audit
**Date:** December 29, 2025  
**Audit Focus:** Identify all data collection and backend systems in /kingdom pages that need database integration

---

## 🔍 EXECUTIVE SUMMARY

After comprehensive review of all 31 Kingdom admin pages and their associated APIs, I've identified **11 critical systems** that still rely on file-based storage and need database migration for production readiness.

### Priority Breakdown
- **🔴 Critical:** 4 systems (Admin settings, Reports, Refunds, Live Drops)
- **🟠 High:** 4 systems (Voting config, Tier rewards, Supplier applications, Analytics)
- **🟡 Medium:** 3 systems (Marketing preferences, Testimonials, Tracking/Analytics)

---

## 🔴 CRITICAL PRIORITY - Production Blockers

### 1. **Admin Settings System**
**Status:** ⚠️ FILE-BASED ONLY  
**API:** `src/pages/api/admin/settings.ts`  
**File:** `public/data/admin-settings.json`  
**Kingdom Page:** `src/pages/kingdom/settings.tsx`

**What It Manages:**
- Site configuration (name, description, maintenance mode)
- Voting rules (max votes, cooldowns, tier multipliers)
- Drop configuration (max active, duration, participant limits)
- Feature toggles (chat, marketing, analytics, notifications)
- Security settings (login attempts, session timeout, rate limiting)

**Why Critical:**
- Controls platform-wide behavior
- Affects all users instantly
- No versioning or audit trail
- Lost on deployment without migration
- Single point of failure

**Database Schema Needed:**
```sql
CREATE TABLE admin_settings (
  id SERIAL PRIMARY KEY,
  category VARCHAR(50) NOT NULL, -- site, voting, drops, features, security
  key VARCHAR(100) NOT NULL,
  value JSONB NOT NULL,
  updated_by INTEGER REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(category, key)
);

CREATE INDEX idx_admin_settings_category ON admin_settings(category);
```

**Migration Priority:** 🔴 **CRITICAL** - Affects entire platform operation

---

### 2. **Reports & Moderation System**
**Status:** ⚠️ FILE-BASED ONLY  
**APIs:** 
- `src/pages/api/reports/index.ts`
- `src/pages/api/reports/[id].ts`
**File:** `public/data/reports.json`  
**Kingdom Pages:**
- `src/pages/kingdom/reports.tsx` (main reports)
- `src/pages/kingdom/reported-chats.tsx` (chat-specific)

**What It Manages:**
- User reports (harassment, spam, inappropriate content)
- Report status tracking (pending, reviewed, resolved, dismissed)
- Moderator actions and notes
- Report metadata (reporter, reported user, reason, timestamp)

**Current Issues:**
- No proper audit trail
- Reports can be lost
- No filtering/search capability
- Manual status updates error-prone
- No moderator accountability

**Database Schema Needed:**
```sql
CREATE TABLE reports (
  id SERIAL PRIMARY KEY,
  reporter_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reported_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  reported_content_type VARCHAR(50), -- user, message, post, product, chat
  reported_content_id INTEGER,
  reason VARCHAR(50) NOT NULL, -- harassment, spam, inappropriate, scam, other
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- pending, under_review, resolved, dismissed
  reviewed_by INTEGER REFERENCES users(id),
  reviewer_notes TEXT,
  action_taken VARCHAR(100), -- warning, temp_ban, perm_ban, content_removed, none
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP,
  resolved_at TIMESTAMP
);

CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_reporter ON reports(reporter_id);
CREATE INDEX idx_reports_reported_user ON reports(reported_user_id);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);
```

**Additional Tables Needed:**
```sql
CREATE TABLE moderation_actions (
  id SERIAL PRIMARY KEY,
  report_id INTEGER REFERENCES reports(id) ON DELETE CASCADE,
  moderator_id INTEGER REFERENCES users(id),
  action_type VARCHAR(50), -- ban, mute, warning, content_removal
  duration INTERVAL, -- for temp bans/mutes
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_moderation_actions_report ON moderation_actions(report_id);
CREATE INDEX idx_moderation_actions_moderator ON moderation_actions(moderator_id);
```

**Migration Priority:** 🔴 **CRITICAL** - Essential for platform safety

---

### 3. **Refunds Management System**
**Status:** ⚠️ FILE-BASED ONLY  
**APIs:**
- `src/pages/api/refunds/index.ts`
- `src/pages/api/refunds/[id].ts`
**File:** `public/data/refunds.json`  
**Kingdom Page:** `src/pages/kingdom/refunds.tsx`

**What It Manages:**
- Refund requests from users
- Refund status tracking (pending, approved, denied, processing, completed)
- Order references
- Admin decisions and notes
- Financial tracking

**Current Issues:**
- No connection to orders table
- Financial data at risk
- No audit trail for money movements
- Can't query by date/status efficiently
- Compliance risk (financial records)

**Database Schema Needed:**
```sql
CREATE TABLE refunds (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  reason VARCHAR(50) NOT NULL, -- defective, wrong_item, not_satisfied, other
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, denied, processing, completed, cancelled
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_by INTEGER REFERENCES users(id),
  reviewed_at TIMESTAMP,
  reviewer_notes TEXT,
  processed_at TIMESTAMP,
  refund_method VARCHAR(50), -- original_payment, store_credit, bank_transfer
  refund_reference VARCHAR(255) -- external transaction ID
);

CREATE INDEX idx_refunds_order ON refunds(order_id);
CREATE INDEX idx_refunds_user ON refunds(user_id);
CREATE INDEX idx_refunds_status ON refunds(status);
CREATE INDEX idx_refunds_requested_at ON refunds(requested_at DESC);
```

**Migration Priority:** 🔴 **CRITICAL** - Financial and compliance risk

---

### 4. **Live Drops Management**
**Status:** ⚠️ FILE-BASED ONLY  
**API:** `src/pages/api/live-drops/index.ts`  
**File:** `public/data/live-drops.json`  
**Kingdom Page:** `src/pages/kingdom/live-drops.tsx`

**What It Manages:**
- Active live drop events
- Drop scheduling (start time, duration)
- Participant tracking
- Pledge goals and progress
- Drop status (active, scheduled, ended)
- Real-time statistics

**Current Issues:**
- Can't handle concurrent updates
- Stats recalculated every request (inefficient)
- No relationship to products table
- Race conditions possible
- Limited query capabilities

**Database Schema Needed:**
```sql
CREATE TABLE live_drops (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  product_name VARCHAR(255) NOT NULL,
  pledge_goal DECIMAL(10,2) NOT NULL,
  current_pledges DECIMAL(10,2) DEFAULT 0,
  participants_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, active, ended, cancelled
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  duration_hours INTEGER DEFAULT 24,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP,
  ended_at TIMESTAMP
);

CREATE INDEX idx_live_drops_product ON live_drops(product_id);
CREATE INDEX idx_live_drops_status ON live_drops(status);
CREATE INDEX idx_live_drops_start_time ON live_drops(start_time);

CREATE TABLE live_drop_participants (
  id SERIAL PRIMARY KEY,
  drop_id INTEGER REFERENCES live_drops(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  pledge_amount DECIMAL(10,2) NOT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(drop_id, user_id)
);

CREATE INDEX idx_live_drop_participants_drop ON live_drop_participants(drop_id);
CREATE INDEX idx_live_drop_participants_user ON live_drop_participants(user_id);
```

**Migration Priority:** 🔴 **CRITICAL** - Core revenue feature

---

## 🟠 HIGH PRIORITY - Feature Completeness

### 5. **Voting Configuration System**
**Status:** ⚠️ FILE-BASED ONLY  
**API:** `src/pages/api/voting-config/index.ts`  
**File:** `public/data/voting.json`  
**Kingdom Pages:**
- `src/pages/kingdom/voting-config.tsx`
- `src/pages/kingdom/VotingConfigPanel.tsx`

**What It Manages:**
- Voting rules and mechanics
- Daily vote limits per tier
- Vote multipliers by tier
- Auto-approval thresholds
- Voting period duration

**Current Settings Structure:**
```json
{
  "tierLimits": {
    "Initiate": 5,
    "Guild": 10,
    "MIGISTUS": 20
  },
  "tierMultipliers": {
    "Initiate": 1,
    "Guild": 2,
    "MIGISTUS": 4
  },
  "autoApproveThreshold": 100,
  "votingPeriodDays": 14
}
```

**Why Important:**
- Controls core platform mechanic
- Affects fairness and balance
- Need change history for analysis
- Should coordinate with tier rewards

**Database Schema Needed:**
```sql
CREATE TABLE voting_config (
  id SERIAL PRIMARY KEY,
  tier VARCHAR(50) NOT NULL,
  daily_vote_limit INTEGER NOT NULL,
  vote_multiplier INTEGER NOT NULL,
  updated_by INTEGER REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tier)
);

CREATE TABLE voting_settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_by INTEGER REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Migration Priority:** 🟠 **HIGH** - Core platform feature

---

### 6. **Tier Rewards System**
**Status:** ⚠️ FILE-BASED ONLY  
**API:** `src/pages/api/tier-rewards/index.ts`  
**File:** `public/data/tier-rewards.json`  
**Kingdom Pages:**
- `src/pages/kingdom/subscription-tiers.tsx`
- `src/pages/kingdom/TierEditor.tsx`

**What It Manages:**
- Tier benefits and perks
- Voting power multipliers
- Chat cooldown times
- Discount percentages
- Exclusive features per tier

**Current Structure:**
```json
{
  "Initiate": {
    "perks": ["Access to drops", "1x voting power"],
    "votingMultiplier": 1,
    "chatCooldown": 30,
    "discount": 0
  },
  "Guild": {
    "perks": ["All Initiate perks", "2x voting power", "Priority support"],
    "votingMultiplier": 2,
    "chatCooldown": 10,
    "discount": 2
  },
  "MIGISTUS": {
    "perks": ["All Guild perks", "4x voting power", "Exclusive deals", "Early access"],
    "votingMultiplier": 4,
    "chatCooldown": 3,
    "discount": 5
  }
}
```

**Why Important:**
- Defines subscription value proposition
- Affects revenue model
- Need to track changes over time
- Should coordinate with voting config

**Database Schema Needed:**
```sql
CREATE TABLE tier_benefits (
  id SERIAL PRIMARY KEY,
  tier VARCHAR(50) NOT NULL,
  benefit_type VARCHAR(50) NOT NULL, -- perk, multiplier, cooldown, discount
  benefit_key VARCHAR(100) NOT NULL,
  benefit_value JSONB NOT NULL,
  display_order INTEGER,
  is_active BOOLEAN DEFAULT true,
  updated_by INTEGER REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tier, benefit_key)
);

CREATE INDEX idx_tier_benefits_tier ON tier_benefits(tier);
CREATE INDEX idx_tier_benefits_type ON tier_benefits(benefit_type);
```

**Migration Priority:** 🟠 **HIGH** - Subscription system core

---

### 7. **Supplier Application System**
**Status:** ⚠️ PARTIALLY IMPLEMENTED  
**APIs:**
- `src/pages/api/auth/supplier-registration.ts`
- `src/pages/api/admin/supplier-applications.ts`
- `src/pages/api/admin/process-supplier-application.ts`
**Files:**
- `public/data/supplier-applications.json`
**Kingdom Page:** `src/pages/kingdom/suppliers.tsx`

**What It Manages:**
- New supplier applications
- Application review workflow
- Approval/rejection decisions
- Supplier onboarding process

**Current Issues:**
- **CRITICAL TODO:** Line 85 in `/api/admin/supplier-applications.ts`
  ```typescript
  case 'approve':
    // TODO: Create supplier account and send welcome email
    application.status = 'approved';
    break;
  ```
- No automated account creation
- No welcome emails sent
- Manual process required
- Poor supplier experience

**Database Status:**
- ✅ `supplier_applications` table EXISTS in schema
- ✅ `supplier_profiles` table EXISTS in schema
- ⚠️ APIs using files instead of database

**What Needs Integration:**
1. Switch APIs to use database tables
2. Implement approval automation:
   - Create user account with `tier: 'Supplier'`
   - Create supplier profile entry
   - Generate login credentials
   - Send welcome email
   - Notify admin of completion

**Migration Priority:** 🟠 **HIGH** - Supplier onboarding broken

---

### 8. **Analytics & Tracking System**
**Status:** ⚠️ FILE-BASED ONLY  
**APIs:**
- `src/pages/api/tracking/record.ts`
- `src/pages/api/tracking/live.ts`
- `src/pages/api/tracking/analytics.ts`
**File:** `public/data/live-tracking.json`  
**Kingdom Page:** `src/pages/kingdom/analytics.tsx`

**What It Tracks:**
- Page views and navigation
- User sessions and activity
- Product interactions
- Conversion funnels
- Real-time user presence

**Current Issues:**
- Very large JSON files
- Slow queries
- Can't do complex analytics
- No data retention policy
- No aggregation capabilities

**Database Schema Needed:**
```sql
CREATE TABLE analytics_events (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  session_id VARCHAR(255),
  event_type VARCHAR(50) NOT NULL, -- page_view, product_view, vote, pledge, etc
  event_data JSONB,
  page_url VARCHAR(500),
  referrer VARCHAR(500),
  user_agent TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Partitioned by month for performance
CREATE INDEX idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at DESC);

CREATE TABLE analytics_aggregates (
  id SERIAL PRIMARY KEY,
  metric_name VARCHAR(100) NOT NULL,
  metric_value NUMERIC,
  dimensions JSONB, -- {tier: 'Guild', page: '/products', etc}
  aggregation_period VARCHAR(20), -- hour, day, week, month
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(metric_name, dimensions, period_start)
);

CREATE INDEX idx_analytics_aggregates_metric ON analytics_aggregates(metric_name);
CREATE INDEX idx_analytics_aggregates_period ON analytics_aggregates(period_start DESC);
```

**Migration Priority:** 🟠 **HIGH** - Performance and scalability

---

## 🟡 MEDIUM PRIORITY - Enhancements

### 9. **Marketing Preferences System**
**Status:** ⚠️ FILE-BASED ONLY  
**API:** `src/pages/api/marketing/preferences.ts`  
**File:** `public/data/marketing-preferences.json`  
**Kingdom Page:** `src/pages/kingdom/marketing.tsx`

**What It Manages:**
- User opt-in/opt-out preferences
- Email notification settings
- Marketing email preferences
- Product update notifications
- Order update preferences

**Why Medium Priority:**
- Affects user communication
- GDPR/compliance consideration
- Should be in users table
- Not mission-critical

**Migration Plan:**
- Add columns to existing `user_settings` table
- Migrate preference data
- Update API to use database
- Keep file as backup during transition

**Database Schema (Already Exists):**
```sql
-- Existing table in schema:
CREATE TABLE user_settings (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  show_online_status BOOLEAN DEFAULT true,
  allow_messages BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT false,
  preferences JSONB DEFAULT '{}',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Action Required:**
- Update API to use `user_settings` table
- Remove file-based storage

**Migration Priority:** 🟡 **MEDIUM** - Enhancement

---

### 10. **Supplier Testimonials**
**Status:** ⚠️ FILE-BASED ONLY  
**API:** `src/pages/api/suppliers/testimonials.ts`  
**File:** `public/data/supplier-testimonials.json`  
**Kingdom Page:** None (public-facing feature)

**What It Manages:**
- Supplier testimonials/reviews
- Rating and feedback
- Display status

**Why Medium Priority:**
- Marketing feature
- Low volume data
- Not critical for operations
- Easy to migrate

**Database Schema Needed:**
```sql
CREATE TABLE supplier_testimonials (
  id SERIAL PRIMARY KEY,
  supplier_id INTEGER REFERENCES supplier_profiles(id) ON DELETE CASCADE,
  author_name VARCHAR(255) NOT NULL,
  author_company VARCHAR(255),
  content TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  is_featured BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  approved_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMP
);

CREATE INDEX idx_supplier_testimonials_supplier ON supplier_testimonials(supplier_id);
CREATE INDEX idx_supplier_testimonials_featured ON supplier_testimonials(is_featured) WHERE is_featured = true;
```

**Migration Priority:** 🟡 **MEDIUM** - Nice to have

---

### 11. **Enforcement Actions** (UI Only - No Backend)
**Status:** ⚠️ NOT IMPLEMENTED  
**File:** `src/pages/kingdom/enforcement-management.tsx`  
**Lines:** 31, 38 (TODO comments)

**What It Should Do:**
- Ban users
- Mute users
- Track enforcement actions
- Audit trail

**Current State:**
- UI displays banned/muted users
- Unban/unmute buttons exist
- **NO backend integration**
- Changes only update local state
- No persistence

**Implementation Needed:**
```typescript
// Line 31-32 TODO
const handleUnban = async (userId: number) => {
  const response = await fetch(`/api/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ banned: false })
  });
  // Handle response...
};

// Line 38-39 TODO
const handleUnmute = async (userId: number) => {
  const response = await fetch(`/api/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      mutedUntil: null,
      muted: false 
    })
  });
  // Handle response...
};
```

**Database Support:**
- ✅ `users` table has `banned` field (needs verification)
- ⚠️ May need `muted_until` column
- ❓ Should add to `moderation_actions` table for audit

**Migration Priority:** 🟡 **MEDIUM** - Already in KNOWN_ISSUES

---

## ✅ ALREADY USING DATABASE

These systems are **already migrated** and working correctly:

### ✅ **User Management**
- **API:** `/api/users/`
- **Page:** `/kingdom/users.tsx`
- **Status:** Database in production, files in development
- **Tables:** `users`, `user_profiles`, `user_stats`

### ✅ **Product Management**
- **API:** `/api/products/`
- **Pages:** `/kingdom/products.tsx`, `/kingdom/product-pool.tsx`
- **Status:** Database in production
- **Tables:** `products`

### ✅ **Staff Picks** (Database functions exist)
- **API:** `/api/staff-picks/`
- **Page:** `/kingdom/staff-picks.tsx`
- **Status:** ⚠️ API still uses files, but DB functions exist in `db.ts`
- **Tables:** `staff_picks` table exists
- **Action:** Need to update API to use `db.createStaffPick()`, `db.getAllStaffPicks()`, etc.

### ✅ **Voting System** (Votes themselves)
- **API:** `/api/votes/`, `/api/vote.ts`
- **Pages:** `/kingdom/voting.tsx`, `/kingdom/voting-stats.tsx`
- **Status:** Database in production
- **Tables:** `votes`
- **Note:** Vote *configuration* still in files (see #5 above)

### ✅ **Followers/Following**
- **API:** `/api/followers/`
- **Status:** ✅ Just completed in Phase 2 migration
- **Tables:** `follows`

### ✅ **Messages**
- **API:** `/api/messages/`
- **Status:** ✅ Verified in Phase 2 migration
- **Tables:** `conversations`, `direct_messages`

---

## 📊 MIGRATION SUMMARY

### By Priority

| Priority | Count | Systems |
|----------|-------|---------|
| 🔴 Critical | 4 | Admin Settings, Reports, Refunds, Live Drops |
| 🟠 High | 4 | Voting Config, Tier Rewards, Supplier Apps, Analytics |
| 🟡 Medium | 3 | Marketing Prefs, Testimonials, Enforcement Actions |
| **Total** | **11** | **Systems needing database integration** |

### By Complexity

| Complexity | Systems | Estimated Time |
|------------|---------|----------------|
| **Simple** (1-2 hours) | Marketing Prefs, Enforcement Actions, Testimonials | 4-6 hours |
| **Medium** (3-4 hours) | Voting Config, Tier Rewards, Live Drops | 9-12 hours |
| **Complex** (5-8 hours) | Admin Settings, Reports, Refunds, Supplier Apps, Analytics | 25-40 hours |
| **Total Effort** | 11 systems | **38-58 hours** |

### By Risk Level

| Risk | Systems | Impact if Not Migrated |
|------|---------|------------------------|
| **Critical** | Admin Settings, Refunds | Platform failure, financial loss |
| **High** | Reports, Live Drops, Supplier Apps | Security issues, revenue loss |
| **Medium** | Analytics, Voting/Tier Config | Performance issues, poor UX |
| **Low** | Marketing, Testimonials, Enforcement | Minor feature degradation |

---

## 🎯 RECOMMENDED MIGRATION ORDER

### Phase 1: Critical Blockers (Week 1)
1. **Admin Settings** - Platform-wide impact
2. **Refunds** - Financial compliance
3. **Reports** - Safety and moderation
4. **Live Drops** - Core revenue feature

### Phase 2: High Priority Features (Week 2)
5. **Supplier Applications** - Fix approval workflow
6. **Voting Configuration** - Core mechanic
7. **Tier Rewards** - Subscription system
8. **Staff Picks API** - Use existing DB functions

### Phase 3: Enhancements (Week 3)
9. **Analytics** - Performance optimization
10. **Marketing Preferences** - Use existing table
11. **Enforcement Actions** - Wire up UI
12. **Testimonials** - Polish feature

---

## 📝 IMPLEMENTATION CHECKLIST

For each system migration:

### Pre-Migration
- [ ] Review current file structure
- [ ] Design database schema
- [ ] Create migration script for existing data
- [ ] Document API changes
- [ ] Plan rollback strategy

### Migration
- [ ] Add database schema to `db/schema.sql`
- [ ] Implement database functions in `src/lib/db.ts`
- [ ] Update API to check `isProduction()`
- [ ] Implement production path (database)
- [ ] Keep development path (files)
- [ ] Add proper error handling
- [ ] Add logging

### Post-Migration
- [ ] Test in development (file-based)
- [ ] Test in production simulation
- [ ] Run data migration script
- [ ] Verify data integrity
- [ ] Update documentation
- [ ] Monitor for issues

---

## 🚀 QUICK WINS

These can be done quickly for immediate impact:

### 1. **Staff Picks API** (30 minutes)
- Database functions already exist
- Just need to update API to use them
- Immediate benefit: Proper CASCADE DELETE

### 2. **Enforcement Actions** (1 hour)
- Wire up existing ban/mute buttons
- Use existing `/api/users/[id]` endpoint
- Add success/error notifications

### 3. **Marketing Preferences** (1-2 hours)
- `user_settings` table already exists
- Update API to read/write there
- Remove file dependency

---

## 📚 RELATED DOCUMENTATION

- `DATABASE_MIGRATION_COMPLETE_PHASE_2.md` - Recent followers/messages work
- `KNOWN_ISSUES_AND_TODOS.md` - Tracking document
- `db/schema.sql` - Current database schema
- `src/lib/db.ts` - Database helper functions

---

## 🎉 CONCLUSION

**Status:** 11 systems need database migration for full production readiness

**Estimated Effort:** 38-58 hours of development work

**Recommended Approach:** Phased migration over 3 weeks, starting with critical blockers

**Biggest Risks:**
1. Admin settings loss on deployment
2. Financial data in refunds system
3. Supplier onboarding completely broken
4. No audit trail for moderation actions

**Quick Wins Available:**
- Staff Picks API (30 min)
- Enforcement Actions (1 hour)
- Marketing Preferences (2 hours)

**Next Step:** Begin Phase 1 with Admin Settings migration

---

**Audit Completed:** December 29, 2025  
**Auditor:** AI Assistant  
**Pages Reviewed:** 31 Kingdom pages  
**APIs Analyzed:** 50+ endpoints  
**Issues Found:** 11 systems requiring migration
