# Database Coverage Audit
**Date:** December 30, 2025  
**Purpose:** Verify all file-based storage has database equivalents before removal

---

## Database Schema Coverage

### ✅ FULLY COVERED - Ready to remove file storage

| JSON File | Database Table | Status | Notes |
|-----------|---------------|--------|-------|
| **users.json** | users | ✅ Complete | All user fields, authentication, profiles |
| **sessions.json** | sessions | ✅ Complete | Session tracking, activity, visibility |
| **products.json** | products | ✅ Complete | Full product lifecycle support |
| **votes.json** | votes | ✅ Complete | Voting system with constraints |
| **staff-picks.json** | staff_picks | ✅ Complete | Staff picks with user/product refs |
| **pledges.json** | pledges | ✅ Complete | User pledges with amounts |
| **user-activity.json** | user_activity | ✅ Complete | Activity tracking and history |
| **profiles.json** | user_profiles | ✅ Complete | Extended user profiles |
| **followers.json** | follows | ✅ Complete | Follow relationships |
| **wishlist.json** | wishlist | ✅ Complete | User wishlists |
| **posts.json** | posts | ✅ Complete | Social posts |
| **product-reviews.json** | product_reviews | ✅ Complete | Reviews with ratings |
| **orders.json** | orders + order_items | ✅ Complete | Complete order management |
| **refunds.json** | refunds | ✅ Complete | Refund processing |
| **reports.json** | reports | ✅ Complete | User reports and moderation |
| **supplier-applications.json** | supplier_applications | ✅ Complete | Supplier application workflow |
| **supplier-products.json** | products (same table) | ✅ Complete | Supplier-submitted products |
| **supplier-testimonials.json** | supplier_testimonials | ✅ Complete | Supplier feedback |
| **suppliers.json** | supplier_profiles | ✅ Complete | Supplier business profiles |
| **live-drops.json** | live_drops + live_drop_participants | ✅ Complete | Live drop events |
| **voting.json** | voting_config + voting_settings | ✅ Complete | Voting configuration |
| **tier-rewards.json** | tier_benefits | ✅ Complete | Subscription tier benefits |
| **wallets.json** | users.wallet + wallet_transactions | ✅ Complete | Wallet balance + transaction log |
| **moderation.json** | moderation_actions | ✅ Complete | Moderation history |
| **verification-tokens.json** | (NOT NEEDED) | ✅ N/A | Using email-based codes instead |

### ✅ MESSAGING - Database Complete

| JSON File | Database Table | Status | Notes |
|-----------|---------------|--------|-------|
| **chat-*.json** | conversations + direct_messages | ✅ Complete | Full DM system in database |
| **chat-index.json** | conversations | ✅ Complete | Conversation indexing |
| **product-chat.json** | (separate system) | ✅ Kept | Product Q&A, not DMs |

### ⚠️ PARTIAL COVERAGE - Need Review

| JSON File | Database Table | Status | Action Needed |
|-----------|---------------|--------|---------------|
| **user-sessions.json** | user_sessions | ⚠️ Duplicate | sessions table already exists - consolidate |
| **user-tracking/** | analytics_events + analytics_aggregates | ⚠️ Check | Verify all tracking migrated |
| **live-tracking.json** | analytics_events | ⚠️ Check | Verify real-time tracking works |
| **marketing-preferences.json** | users.agree_to_marketing | ⚠️ Limited | May need separate table for detailed prefs |

### 📝 CONFIGURATION FILES - Keep as Files

| JSON File | Purpose | Keep? | Reason |
|-----------|---------|-------|--------|
| **homepage.json** | CMS content | ✅ Keep | Static content, rarely changes |
| **settings.json** | App configuration | ✅ Keep | Config file, not user data |
| **admin-settings.json** | Admin config | ⚠️ Hybrid | Has database table, but may keep file for fallback |
| **coming-soon.json** | Feature announcements | ✅ Keep | Static content |
| **product-lifecycle-config.json** | Lifecycle rules | ⚠️ Hybrid | Has database table, could migrate |
| **image-registry.json** | Image management | ✅ Keep | Development tool |
| **product-orders.json** | (Unclear) | ❓ Check | May be duplicate of orders table |

---

## Database Table Inventory

### Core Tables (25+)
1. **users** - User accounts, authentication, profiles
2. **sessions** - Active sessions with tracking
3. **products** - All products (user + supplier)
4. **votes** - Product voting
5. **staff_picks** - Featured products
6. **pledges** - User pledges on products
7. **user_activity** - Activity log
8. **user_profiles** - Extended profiles
9. **user_stats** - User statistics
10. **user_settings** - User preferences
11. **follows** - Follow relationships
12. **wishlist** - User wishlists
13. **posts** - Social posts
14. **post_likes** - Post likes
15. **post_comments** - Post comments
16. **supplier_applications** - Supplier requests
17. **supplier_profiles** - Supplier businesses
18. **product_reviews** - Product reviews
19. **review_helpful** - Review helpfulness votes
20. **orders** - Orders
21. **order_items** - Order line items
22. **conversations** - DM conversations
23. **direct_messages** - Individual messages
24. **admin_settings** - Admin configuration
25. **refunds** - Refund requests
26. **reports** - User reports
27. **moderation_actions** - Moderation log
28. **live_drops** - Live drop events
29. **live_drop_participants** - Drop participants
30. **voting_config** - Voting configuration
31. **voting_settings** - Voting settings
32. **tier_benefits** - Subscription benefits
33. **analytics_events** - Event tracking
34. **analytics_aggregates** - Analytics summaries
35. **user_sessions** - Session tracking (possible duplicate)
36. **supplier_testimonials** - Supplier reviews
37. **enforcement_log** - Ban/mute log
38. **push_subscriptions** - Web push notifications
39. **wallet_transactions** - Financial transactions

---

## API Endpoints Using File Storage

### High Priority - Switch to Database
```typescript
// src/pages/api/users/index.ts
const usersFilePath = path.resolve("public/data/users.json");
// ✅ Has db.getAllUsers() - READY TO MIGRATE

// src/pages/api/stats/index.ts
const users = safeRead(path.resolve("public/data/users.json"));
const votes = safeRead(path.resolve("public/data/votes.json"));
const products = safeRead(path.resolve("public/data/products.json"));
// ✅ All have database equivalents - READY TO MIGRATE
```

### Medium Priority - Review Logic
```typescript
// src/pages/api/voting-config/index.ts
const filePath = path.resolve("public/data/voting.json");
// ⚠️ Check if voting_config table is being used

// src/pages/api/tier-rewards/index.ts
const FILE_PATH = path.resolve("public/data/tier-rewards.json");
// ⚠️ Check if tier_benefits table is being used
```

### Low Priority - Configuration
```typescript
// src/pages/api/tracking/*.ts
// Multiple files use live-tracking.json and user-sessions.json
// ⚠️ Verify analytics_events table handles all tracking
```

---

## Verification Checklist

### Before Removing File Storage

- [ ] **User Authentication**
  - [x] Login works with database
  - [x] Registration creates database records
  - [x] Email verification updates database
  - [x] Password reset works
  
- [ ] **Products & Voting**
  - [ ] Products can be created in database
  - [ ] Products can be updated in database
  - [ ] Voting works with database
  - [ ] Product lifecycle transitions work
  
- [ ] **Social Features**
  - [ ] Following/unfollowing works
  - [ ] Posts can be created
  - [ ] Comments work
  - [ ] Wishlists work
  
- [ ] **Messaging**
  - [ ] DM conversations work
  - [ ] Messages send and receive
  - [ ] Product chat still works (separate system)
  
- [ ] **E-commerce**
  - [ ] Orders can be placed
  - [ ] Order history works
  - [ ] Refunds can be requested
  - [ ] Stripe integration works
  
- [ ] **Admin Features**
  - [ ] User management works
  - [ ] Product moderation works
  - [ ] Reports work
  - [ ] Bans/mutes work

---

## Migration Strategy

### Phase 1: Enable Database Mode
```env
# Add to .env.local
NEXT_PUBLIC_USE_DATABASE=true
```

### Phase 2: Test All Features
1. Test user registration and login
2. Test product creation and voting
3. Test messaging system
4. Test order placement
5. Test admin functions

### Phase 3: Identify Gaps
- Log any errors referencing missing columns
- Note any features that fail
- Document any data not in database

### Phase 4: Add Missing Implementations
- Add any missing database operations to src/lib/db.ts
- Update API endpoints to use database exclusively
- Remove conditional logic checking NEXT_PUBLIC_USE_DATABASE

### Phase 5: Remove File Storage Code
- Delete file read/write operations
- Remove path.resolve() for JSON files
- Clean up unused imports (fs, path)
- Remove NEXT_PUBLIC_USE_DATABASE checks

### Phase 6: Archive JSON Files
- Move public/data/*.json to public/data/archived/
- Keep only configuration files needed
- Document what was removed

---

## Potential Issues

### 1. Session Tracking Duplication
**Issue:** Both `sessions` and `user_sessions` tables exist  
**Solution:** Consolidate into one table, likely `sessions`

### 2. Marketing Preferences
**Issue:** Only basic agree_to_marketing in users table  
**Solution:** May need separate marketing_preferences table for detailed options

### 3. Product Orders vs Orders
**Issue:** product-orders.json file exists alongside orders table  
**Solution:** Verify what product-orders.json contains, may be obsolete

### 4. Analytics Tracking
**Issue:** Multiple tracking files and systems  
**Solution:** Ensure analytics_events captures everything currently tracked

### 5. Configuration vs Data
**Issue:** Some JSON files are configuration, not data  
**Solution:** Keep config files (homepage.json, settings.json, etc.)

---

## Benefits After Migration

1. **Single Source of Truth** - All data in database, no sync issues
2. **Better Performance** - Database queries faster than file I/O
3. **Simpler Code** - No dual code paths checking NEXT_PUBLIC_USE_DATABASE
4. **Easier Development** - Less confusion about which system to use
5. **Better Scalability** - Database handles concurrent writes properly
6. **Atomic Operations** - Transactions ensure data consistency
7. **Better Querying** - Complex queries without loading entire files

---

## Next Steps

1. **Set NEXT_PUBLIC_USE_DATABASE=true in .env.local**
2. **Run full feature test suite**
3. **Document any failures or missing implementations**
4. **Add missing database operations if needed**
5. **Remove file storage code systematically**
6. **Archive old JSON files**
7. **Update documentation**

---

## Recommendation

✅ **Database coverage is excellent!** Almost everything has proper database tables and implementations in src/lib/db.ts. 

**Safe to proceed with:**
1. Enable database mode in local dev
2. Test thoroughly
3. Remove file storage code for covered features
4. Keep configuration files that make sense as files

**Review needed for:**
- user_sessions vs sessions table (consolidate?)
- marketing preferences (expand users table or separate table?)
- Analytics/tracking migration completeness
