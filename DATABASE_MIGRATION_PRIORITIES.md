# Database Migration Priorities

## Overview
The MIGISTUS platform currently has extensive localStorage and file-based storage that needs to be migrated to the PostgreSQL database for production readiness.

## Critical Systems to Migrate

### 1. ✅ COMPLETED: Session Management
- **Status**: Migrated to database
- **Tables**: `sessions`
- **Functionality**: User sessions, online status tracking

---

### 2. 🔴 HIGH PRIORITY: User Profiles & Data

**Current State**: Uses `userStorage.ts` with localStorage keys like:
- `user_{id}_profile`
- `user_{id}_activity`
- `user_{id}_pledges`
- `user_{id}_votes`
- `user_{id}_joined_drops`
- `migistus_user_registry`
- `user_{id}_settings`

**Database Tables Needed**:
```sql
-- User profile extensions
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  avatar TEXT,
  banner TEXT,
  badges JSONB DEFAULT '[]',
  titles JSONB DEFAULT '[]',
  links JSONB DEFAULT '[]',
  guild_tokens INTEGER DEFAULT 100,
  voting_power INTEGER DEFAULT 1,
  is_invisible BOOLEAN DEFAULT false,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User statistics (denormalized for performance)
CREATE TABLE IF NOT EXISTS user_stats (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  followers INTEGER DEFAULT 0,
  following INTEGER DEFAULT 0,
  total_pledges INTEGER DEFAULT 0,
  total_votes INTEGER DEFAULT 0,
  drops_joined INTEGER DEFAULT 0,
  profile_views INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User settings
CREATE TABLE IF NOT EXISTS user_settings (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  show_online_status BOOLEAN DEFAULT true,
  allow_messages BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT false,
  preferences JSONB DEFAULT '{}',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Migration Strategy**:
1. Create database tables
2. Create API endpoints for CRUD operations
3. Update `userStorage.ts` to use database in production
4. Maintain localStorage for development
5. Create migration script for existing users

---

### 3. 🔴 HIGH PRIORITY: Follows/Followers System

**Current State**: Uses `migistus_follows` localStorage array

**Database Tables Needed**:
```sql
CREATE TABLE IF NOT EXISTS follows (
  id SERIAL PRIMARY KEY,
  follower_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  following_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(follower_id, following_id)
);

CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);
```

**Files to Update**:
- `src/utils/userStorage.ts` (follow/unfollow functions)
- `src/components/FollowButton.tsx`

---

### 4. 🔴 HIGH PRIORITY: Social Posts & Comments

**Current State**: Uses `socialPostsStorage.ts` with `migistus_social_posts` localStorage

**Database Tables Needed**:
```sql
CREATE TABLE IF NOT EXISTS social_posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  visibility VARCHAR(20) DEFAULT 'public', -- public, followers, private
  post_type VARCHAR(50) DEFAULT 'general', -- general, vote, pledge, comment
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  likes INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS post_likes (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES social_posts(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS post_comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES social_posts(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_posts_user_id ON social_posts(user_id);
CREATE INDEX idx_posts_created_at ON social_posts(created_at DESC);
CREATE INDEX idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX idx_post_comments_post_id ON post_comments(post_id);
```

---

### 5. 🟡 MEDIUM PRIORITY: Supplier Profiles

**Current State**: Uses localStorage keys:
- `supplierProfile_{id}`
- `supplier_followers_{id}`
- `followedSuppliers_{userId}`

**Database Tables Needed**:
```sql
CREATE TABLE IF NOT EXISTS suppliers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  company_name VARCHAR(255),
  logo TEXT,
  banner_image TEXT,
  description TEXT,
  short_bio TEXT,
  location_country VARCHAR(100),
  location_city VARCHAR(100),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  contact_website VARCHAR(500),
  social_media JSONB,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS supplier_stats (
  supplier_id INTEGER PRIMARY KEY REFERENCES suppliers(id) ON DELETE CASCADE,
  followers INTEGER DEFAULT 0,
  total_products INTEGER DEFAULT 0,
  total_sales INTEGER DEFAULT 0,
  avg_rating DECIMAL(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS supplier_follows (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  supplier_id INTEGER REFERENCES suppliers(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, supplier_id)
);
```

---

### 6. 🟡 MEDIUM PRIORITY: Product Reviews & Ratings

**Current State**: File `public/data/product-reviews.json`

**Already in Schema**: `products` table exists, just need reviews table

```sql
CREATE TABLE IF NOT EXISTS product_reviews (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  content TEXT,
  verified_purchase BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reviews_product_id ON product_reviews(product_id);
CREATE INDEX idx_reviews_user_id ON product_reviews(user_id);
```

---

### 7. 🟡 MEDIUM PRIORITY: Orders & Transactions

**Current State**: File `public/data/product-orders.json`

```sql
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  payment_status VARCHAR(50) DEFAULT 'pending',
  shipping_address JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 8. 🟡 MEDIUM PRIORITY: Wishlist

**Current State**: File `public/data/wishlist.json`

```sql
CREATE TABLE IF NOT EXISTS wishlist (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_wishlist_user_id ON wishlist(user_id);
```

---

### 9. 🟢 LOW PRIORITY: Images & Media

**Current State**: File `public/data/image-registry.json`

**Recommendation**: Use cloud storage (Vercel Blob, AWS S3, Cloudinary)
- Keep image URLs in database
- Store actual files in object storage
- Don't store binary data in PostgreSQL

---

### 10. 🟢 LOW PRIORITY: Marketing & Analytics

**Current State**: Files:
- `marketing-preferences.json`
- `live-tracking.json`
- `user-tracking/`

**Database Tables**:
```sql
CREATE TABLE IF NOT EXISTS marketing_preferences (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  email_marketing BOOLEAN DEFAULT false,
  sms_marketing BOOLEAN DEFAULT false,
  push_notifications BOOLEAN DEFAULT true,
  preferences JSONB DEFAULT '{}',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User activity already exists in schema as user_activity table
```

---

## Migration Execution Plan

### Phase 1: Core User Data (Week 1)
1. ✅ Sessions & Online Status (DONE)
2. User Profiles & Stats tables
3. User Settings table
4. Follows/Followers system
5. Update API endpoints
6. Update frontend components

### Phase 2: Social Features (Week 2)
1. Social Posts table
2. Post Likes & Comments
3. Update SocialPostsStorage
4. Update community pages
5. Real-time updates via database

### Phase 3: E-Commerce (Week 3)
1. Supplier profiles
2. Product reviews
3. Orders & order items
4. Wishlist
5. Payment integration

### Phase 4: Optimization (Week 4)
1. Database indexes optimization
2. Query performance tuning
3. Caching strategy (Redis)
4. CDN for images
5. Load testing

---

## Development Strategy

### Dual-Mode Support
All storage utilities should support both localStorage (dev) and database (prod):

```typescript
export const UserService = {
  async getProfile(userId: number) {
    if (isProduction()) {
      return await db.getUserProfile(userId);
    } else {
      return localStorage.getItem(`user_${userId}_profile`);
    }
  }
};
```

### Migration Scripts
Create migration endpoints to move existing localStorage data to database:

```typescript
// /api/migrate/user-data
POST /api/migrate/user-data
{
  "userId": 123,
  "localStorageData": {...}
}
```

---

## Critical Files Requiring Updates

### Storage Utilities
- ✅ `src/lib/session.ts` (DONE)
- 🔴 `src/utils/userStorage.ts` (CRITICAL)
- 🔴 `src/utils/socialPostsStorage.ts` (CRITICAL)
- 🟡 `src/utils/imageRegistry.ts`
- 🟡 `src/utils/userSyncService.ts`
- 🟡 `src/utils/activityTracker.ts`

### Components
- 🔴 `src/components/FollowButton.tsx`
- 🟡 `src/components/OnlineStatus.tsx` (partially done)
- 🟡 `src/components/CreatePost.tsx`
- 🟡 `src/components/PostCard.tsx`

### Pages
- 🔴 `src/context/AuthContext.tsx` (session management)
- 🔴 `src/pages/community/index.tsx`
- 🟡 `src/pages/account/profile/[slug].tsx`
- 🟡 `src/pages/supplier/[slug].tsx`

---

## Testing Strategy

1. **Unit Tests**: Each database function
2. **Integration Tests**: API endpoints
3. **Migration Tests**: localStorage → database
4. **Performance Tests**: Query optimization
5. **E2E Tests**: User workflows

---

## Rollback Plan

1. Keep localStorage code as fallback
2. Feature flags for database vs localStorage
3. Database backups before migrations
4. Gradual rollout (10% → 50% → 100%)

---

## Estimated Timeline

- **Phase 1**: 1 week (Core user data)
- **Phase 2**: 1 week (Social features)
- **Phase 3**: 1 week (E-commerce)
- **Phase 4**: 1 week (Optimization)

**Total**: 4 weeks for full migration

---

## Next Immediate Steps

1. **Create Phase 1 tables** in database schema
2. **Update db.ts** with new functions
3. **Update userStorage.ts** with dual-mode support
4. **Create migration API endpoints**
5. **Test with development database**
6. **Deploy to production incrementally**
