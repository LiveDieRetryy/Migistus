# Remaining File Storage Migration Tasks

**Date:** December 30, 2025  
**Status:** 37 endpoints converted ✅ | 73 endpoints remaining 🔄

## Progress Summary

### ✅ Already Converted (37 endpoints)
- Account endpoints (6): votes, wishlist, pledges, settings, profile, change-password
- Tracking endpoints (3): sessions, live, record
- Voting/Polls suite (6): polls, create, delete, update-status, votes, voting-config
- Staff picks (2): index, toggle
- Refunds (2): index, [id]
- Reports (1): index (Note: [id] still needs conversion)
- Suppliers (3): testimonials, apply, index
- Supplier products (1): supplier/products
- Analytics (1): tracking/analytics
- Statistics (1): stats/index
- Configuration (3): tier-rewards, vote, voting/config

---

## 🔄 Remaining Endpoints to Convert (73 files)

### **PRIORITY 1: CRITICAL - Core User & Subscription Features** (9 files)

#### Subscriptions (4 files) - Revenue Critical ⚠️
1. **src/pages/api/subscriptions/verify-session.ts**
   - Function: Verifies Stripe checkout sessions, updates user tier
   - Uses: `isProduction()` dual-path logic
   - Database needs: `db.getUserById()`, `db.updateUser()`
   - Critical for: Subscription activation flow

2. **src/pages/api/subscriptions/create-customer.ts**
   - Function: Creates Stripe customer records
   - Uses: `isProduction()` dual-path logic
   - Database needs: `db.getUserById()`, `db.updateUser()`
   - Critical for: Payment processing setup

3. **src/pages/api/subscriptions/create-checkout-session.ts**
   - Function: Initiates Stripe checkout flow
   - Uses: `isProduction()` dual-path logic
   - Database needs: `db.getUserById()`
   - Critical for: Upgrade/subscription flow

4. **src/pages/api/subscriptions/cancel-subscription.ts**
   - Function: Cancels active subscriptions
   - Uses: File-based user data read/write
   - Database needs: `db.getUserById()`, `db.updateUser()`
   - Critical for: Subscription management

#### Users Management (5 files) - Core Functionality ⚠️
5. **src/pages/api/users/[id].ts**
   - Function: User CRUD operations (GET, PATCH, DELETE)
   - Uses: File-based users.json read/write
   - Database needs: `db.getUserById()`, `db.updateUser()`, `db.deleteUser()`
   - Critical for: User profile management, account deletion
   - Note: DELETE includes cascading to chats, reports

6. **src/pages/api/users/index.ts**
   - Function: List users, create users
   - Uses: `isProduction()` dual-path logic
   - Database needs: `db.getAllUsers()`, `db.createUser()`
   - Critical for: User registration, user listing

7. **src/pages/api/users/activity.ts**
   - Function: User activity history
   - Uses: File-based activity log
   - Database needs: Activity tracking queries
   - Critical for: User analytics

8. **src/pages/api/users/[id]/comprehensive.ts**
   - Function: Comprehensive user data aggregation
   - Uses: Separate comprehensive-data.json file
   - Database needs: Multiple joined queries
   - Critical for: Admin user overview

9. **src/pages/api/users/online.ts**
   - Function: Online user tracking
   - Uses: `isProduction()` dual-path logic
   - Database needs: `db.getOnlineUsers()`, `db.updateUserStatus()`
   - Critical for: Real-time user presence

---

### **PRIORITY 2: HIGH - Products & Core Business Logic** (12 files)

#### Products CRUD (6 files)
10. **src/pages/api/products/[id].ts**
    - Function: Get/update single product
    - Uses: File-based products.json
    - Database needs: `db.getProduct()`, `db.updateProduct()`

11. **src/pages/api/products/create.ts**
    - Function: Create new products
    - Uses: File-based products.json
    - Database needs: `db.createProduct()`

12. **src/pages/api/products/update.ts**
    - Function: Update product details
    - Uses: File-based products.json
    - Database needs: `db.updateProduct()`

13. **src/pages/api/products/update-status.ts**
    - Function: Update product status/stage
    - Uses: File-based products.json
    - Database needs: `db.updateProduct()`

14. **src/pages/api/products/delete.ts**
    - Function: Delete products
    - Uses: File-based products.json
    - Database needs: `db.deleteProduct()`

15. **src/pages/api/products/by-slug/[slug].ts**
    - Function: Get product by slug
    - Uses: File-based products.json
    - Database needs: `db.getProductBySlug()`

#### Product Features (6 files)
16. **src/pages/api/products/reviews/[id].ts**
    - Function: Product review CRUD
    - Uses: File-based reviews.json
    - Database needs: `db.getProductReviews()`, `db.createProductReview()`, etc.

17. **src/pages/api/products/reviews/helpful/[reviewId].ts**
    - Function: Mark review as helpful
    - Uses: File-based reviews.json
    - Database needs: Review helpfulness tracking

18. **src/pages/api/products/chat/[id].ts**
    - Function: Product-specific chat messages
    - Uses: File-based chat data
    - Database needs: Chat message queries

19. **src/pages/api/products/chat/report.ts**
    - Function: Report chat messages
    - Uses: File-based chat reports
    - Database needs: `db.createReport()`

20. **src/pages/api/pledges/[productId].ts**
    - Function: Get/create product pledges
    - Uses: File-based pledges.json
    - Database needs: `db.getProductPledges()`, `db.createPledge()`

21. **src/pages/api/product-orders.ts**
    - Function: Order management
    - Uses: File-based orders.json
    - Database needs: `db.getOrders()`, `db.createOrder()`

---

### **PRIORITY 3: MEDIUM - Admin & Management** (14 files)

#### Admin User Management (2 files)
22. **src/pages/api/admin/users/[userId].ts**
    - Function: Admin user operations
    - Uses: File-based users.json
    - Database needs: `db.getUserById()`, `db.updateUser()`

23. **src/pages/api/admin/unfollow.ts**
    - Function: Admin force-unfollow
    - Uses: File-based follows.json
    - Database needs: `db.deleteFollow()`

#### Admin Supplier Management (5 files)
24. **src/pages/api/admin/suppliers.ts**
    - Function: List/manage suppliers
    - Uses: File-based suppliers.json
    - Database needs: Supplier profile queries

25. **src/pages/api/admin/supplier-products.ts**
    - Function: Manage supplier products
    - Uses: File-based supplier-products.json
    - Database needs: Product queries with supplier filter

26. **src/pages/api/admin/supplier-product-stats.ts**
    - Function: Supplier product statistics
    - Uses: File-based data aggregation
    - Database needs: Aggregate queries

27. **src/pages/api/admin/supplier-applications.ts**
    - Function: View supplier applications
    - Uses: File-based applications.json
    - Database needs: `db.getSupplierApplications()`

28. **src/pages/api/admin/supplier-application-stats.ts**
    - Function: Application statistics
    - Uses: File-based aggregation
    - Database needs: Application aggregate queries

29. **src/pages/api/admin/process-supplier-application.ts**
    - Function: Approve/reject applications
    - Uses: File-based applications.json
    - Database needs: `db.updateSupplierApplication()`

#### Admin Statistics (3 files)
30. **src/pages/api/admin/stats/users.ts**
    - Function: User statistics dashboard
    - Uses: File-based data
    - Database needs: User aggregate queries

31. **src/pages/api/admin/stats/products.ts**
    - Function: Product statistics dashboard
    - Uses: File-based data
    - Database needs: Product aggregate queries

32. **src/pages/api/admin/stats/voting.ts**
    - Function: Voting statistics dashboard
    - Uses: File-based data
    - Database needs: Vote aggregate queries

#### Admin Settings (2 files)
33. **src/pages/api/admin/settings.ts**
    - Function: Admin settings management
    - Uses: File-based settings.json
    - Database needs: `db.getSystemSettings()`, `db.updateSystemSetting()`

34. **src/pages/api/admin/reset-password.ts**
    - Function: Admin password reset
    - Uses: File-based users.json
    - Database needs: `db.updateUser()`

#### Admin Reports (1 file)
35. **src/pages/api/reports/[id].ts**
    - Function: Get/update/delete specific report
    - Uses: File-based reports.json (Note: reports/index already converted)
    - Database needs: `db.getReportById()`, `db.updateReport()`, `db.deleteReport()`

---

### **PRIORITY 4: MEDIUM-LOW - Auth & Authentication** (7 files)

36. **src/pages/api/auth/login.ts**
    - Function: User authentication
    - Uses: File-based users.json
    - Database needs: `db.getUser()`, `db.createSession()`
    - Note: May already work with database, verify

37. **src/pages/api/auth/register.ts**
    - Function: User registration
    - Uses: File-based users.json
    - Database needs: `db.createUser()`

38. **src/pages/api/auth/admin-login.ts**
    - Function: Admin authentication
    - Uses: File-based users.json
    - Database needs: `db.getUser()`, admin verification

39. **src/pages/api/auth/supplier-login.ts**
    - Function: Supplier authentication
    - Uses: File-based data
    - Database needs: Supplier auth queries

40. **src/pages/api/auth/supplier-registration.ts**
    - Function: Supplier registration
    - Uses: File-based data
    - Database needs: Supplier creation

41. **src/pages/api/auth/reset-password.ts**
    - Function: Password reset flow
    - Uses: File-based users.json
    - Database needs: `db.updateUser()`, token management

42. **src/pages/api/auth/verify-email.ts**
    - Function: Email verification
    - Uses: File-based tokens
    - Database needs: `db.getVerificationToken()`, `db.updateUser()`

---

### **PRIORITY 5: LOW - Wallet & Financial** (3 files)

43. **src/pages/api/wallet/index.ts**
    - Function: Wallet CRUD operations
    - Uses: `isProduction()` dual-path logic
    - Database needs: `db.getWallet()`, `db.updateWallet()`

44. **src/pages/api/wallet/balance.ts**
    - Function: Get wallet balance
    - Uses: `isProduction()` dual-path logic
    - Database needs: `db.getWalletBalance()`

45. **src/pages/api/wallet/transactions.ts**
    - Function: Transaction history
    - Uses: `isProduction()` dual-path logic
    - Database needs: `db.getWalletTransactions()`

---

### **PRIORITY 6: LOW - Social Features** (5 files)

46. **src/pages/api/followers/index.ts**
    - Function: Follow/unfollow operations
    - Uses: File-based follows.json
    - Database needs: `db.createFollow()`, `db.deleteFollow()`

47. **src/pages/api/chat/[productId].ts**
    - Function: Chat message handling
    - Uses: File-based chat data
    - Database needs: Message queries

48. **src/pages/api/messages/send.ts**
    - Function: Send direct messages
    - Uses: File-based messages
    - Database needs: `db.createMessage()`

49. **src/pages/api/messages/conversations.ts**
    - Function: List conversations
    - Uses: File-based data
    - Database needs: `db.getUserConversations()`

50. **src/pages/api/messages/conversation.ts**
    - Function: Get conversation details
    - Uses: File-based data
    - Database needs: `db.getConversation()`

51. **src/pages/api/messages/conversation-info.ts**
    - Function: Conversation metadata
    - Uses: File-based data
    - Database needs: Conversation queries

52. **src/pages/api/messages/upload.ts**
    - Function: Message attachment upload
    - Uses: File system for attachments
    - Database needs: Attachment metadata storage

---

### **PRIORITY 7: LOW - Live Drops System** (4 files)

53. **src/pages/api/live-drops/index.ts**
    - Function: List/get live drops
    - Uses: File-based live-drops.json
    - Database needs: `db.getAllLiveDrops()`, `db.getLiveDropsByStatus()`

54. **src/pages/api/live-drops/create.ts**
    - Function: Create live drop
    - Uses: File-based live-drops.json
    - Database needs: `db.createLiveDrop()`

55. **src/pages/api/live-drops/extend.ts**
    - Function: Extend drop duration
    - Uses: File-based live-drops.json
    - Database needs: `db.updateLiveDrop()`

56. **src/pages/api/live-drops/update-status.ts**
    - Function: Update drop status
    - Uses: File-based live-drops.json
    - Database needs: `db.updateLiveDrop()`

---

### **PRIORITY 8: LOW - Moderation** (3 files)

57. **src/pages/api/moderation/index.ts**
    - Function: Moderation actions
    - Uses: File-based moderation logs
    - Database needs: `db.createModerationAction()`

58. **src/pages/api/moderation/logs.ts**
    - Function: Moderation log viewing
    - Uses: File-based logs
    - Database needs: `db.getModerationActions()`

59. **src/pages/api/moderation/report-action.ts**
    - Function: Handle report actions
    - Uses: File-based reports
    - Database needs: `db.createModerationActionForReport()`

---

### **PRIORITY 9: LOW - Product Lifecycle** (2 files)

60. **src/pages/api/product-lifecycle/config.ts**
    - Function: Lifecycle configuration
    - Uses: File-based config
    - Database needs: Config table queries

61. **src/pages/api/product-lifecycle/process.ts**
    - Function: Process lifecycle events
    - Uses: File-based data
    - Database needs: Product status updates

62. **src/pages/api/product-lifecycle-config.ts** (duplicate?)
    - Function: Lifecycle configuration (may be duplicate of #60)
    - Uses: File-based config
    - Database needs: Config queries

---

### **PRIORITY 10: LOW - Content Management** (4 files)

63. **src/pages/api/page-code.ts**
    - Function: CMS page code editor
    - Uses: File-based pages
    - Database needs: `db.getPage()`, `db.updatePage()`

64. **src/pages/api/page-layout.ts**
    - Function: CMS page layout
    - Uses: File-based pages
    - Database needs: Page queries

65. **src/pages/api/page-rendered-html.ts**
    - Function: Render page HTML
    - Uses: File-based pages
    - Database needs: Page content queries

66. **src/pages/api/coming-soon/index.ts**
    - Function: Coming soon products
    - Uses: File-based data
    - Database needs: Product stage queries

---

### **PRIORITY 11: LOW - Marketing & Misc** (2 files)

67. **src/pages/api/marketing/campaigns.ts**
    - Function: Marketing campaigns
    - Uses: File-based campaigns.json
    - Database needs: Campaign management tables

68. **src/pages/api/maintenance-status.ts**
    - Function: Maintenance mode status
    - Uses: File-based config
    - Database needs: `db.getSystemSetting('maintenanceMode')`

---

### **SPECIAL CATEGORY: Upload Handlers** (2 files)
*May legitimately need fs for file handling*

69. **src/pages/api/upload/image.ts**
    - Function: Single image upload
    - Uses: fs for file operations
    - Note: May need fs for actual file writing

70. **src/pages/api/upload/images.ts**
    - Function: Multiple image uploads
    - Uses: fs for file operations
    - Note: May need fs for actual file writing

---

### **EXCLUDE: Migration Scripts** (7 files)
*One-time use, can be ignored*

71. src/pages/api/migrate/admin-data.ts
72. src/pages/api/migrate/chat-data.ts
73. src/pages/api/migrate/cms-data.ts
74. src/pages/api/migrate/notification-data.ts
75. src/pages/api/migrate/payment-data.ts
76. src/pages/api/migrate/product-data.ts
77. src/pages/api/migrate/search-data.ts

---

## Conversion Strategy

### Phase 1: Critical Path (Priority 1) - 9 files
Start with subscriptions and users endpoints as these are revenue-critical and most frequently used.

**Estimated Impact:** High - Core functionality
**Risk:** Medium - Requires careful testing
**Dependencies:** None - can start immediately

### Phase 2: Core Business (Priority 2) - 12 files
Convert product management endpoints.

**Estimated Impact:** High - Main business logic
**Risk:** Medium - Many interconnected features
**Dependencies:** Users endpoints should be converted first

### Phase 3: Admin Tools (Priority 3) - 14 files
Convert admin management and statistics.

**Estimated Impact:** Medium - Admin workflow
**Risk:** Low - Admin-only features
**Dependencies:** Users and products should be converted first

### Phase 4: Auth & Supporting (Priorities 4-11) - 31 files
Convert remaining endpoints in order of priority.

**Estimated Impact:** Low to Medium - Various features
**Risk:** Low - Individual isolated features
**Dependencies:** Varies by endpoint

---

## Conversion Checklist (Per Endpoint)

- [ ] Read current endpoint implementation
- [ ] Identify all file operations (fs.readFileSync, fs.writeFileSync, etc.)
- [ ] Identify isProduction() checks
- [ ] Verify database functions exist in db.ts (or create them)
- [ ] Remove fs and path imports
- [ ] Remove isProduction logic
- [ ] Replace file operations with database calls
- [ ] Build and verify TypeScript compilation
- [ ] Test endpoint functionality
- [ ] Update this document with completion status

---

## Database Functions Status

### ✅ Verified Available
- User operations: getUser, getUserById, getAllUsers, createUser, updateUser, deleteUser
- Session operations: getSession, createSession, deleteSession
- Vote operations: getVotes, createVote, getProductVotes
- Pledge operations: getPledges, createPledge, getProductPledges
- Product operations: getProducts, getProduct, getProductBySlug, createProduct, updateProduct, deleteProduct
- Follow operations: createFollow, deleteFollow, getFollowers, getFollowing
- Wallet operations: getWallet, getWalletBalance, getWalletTransactions
- Report operations: getAllReports, getReportById, createReport, updateReport, deleteReport
- Refund operations: getAllRefunds, getRefundById, createRefund, updateRefund, deleteRefund

### ❓ May Need Creation
- User activity tracking functions
- Comprehensive user data aggregation
- Product review helpfulness tracking
- Chat message queries
- Live drop operations
- Moderation action logging
- Product lifecycle automation
- CMS page operations
- Marketing campaign management

---

## Notes

- **Total Reduction Target:** ~5000+ lines of dual-path code
- **Estimated Time:** 2-4 hours for Phase 1, 8-12 hours total
- **Testing Required:** Manual testing of critical flows (login, subscription, product creation)
- **Rollback Plan:** Git branches for each phase

**Last Updated:** December 30, 2025
