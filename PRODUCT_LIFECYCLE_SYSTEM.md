# Product Lifecycle System - Complete Documentation

**Created:** December 8, 2025  
**Status:** ✅ Implemented  
**Version:** 2.0.0

---

## 🔄 Product Lifecycle Overview

The MIGISTUS platform uses an automated 4-stage product lifecycle system that moves products through different phases based on community engagement and time-based rules.

```
┌─────────┐   7 days    ┌──────────────┐   Friday    ┌────────────────┐   7 days    ┌────────────────────┐
│ Voting  │────────────▶│ Coming Soon  │────────────▶│ Community Drops│────────────▶│Recently Completed  │
└─────────┘  (10+ votes)└──────────────┘  (launches) └────────────────┘             └────────────────────┘
```

---

## 📊 Lifecycle Stages

### Stage 1: Voting (7 days)
**Purpose:** Community votes on products they want to see  
**Duration:** 7 days maximum  
**Advancement Criteria:**
- Minimum 10 votes required
- Must complete 7 days in voting

**Characteristics:**
- Products start here by default
- Users cast weighted votes based on tier
- Top products advance to Coming Soon

**Route:** `/voting`

---

### Stage 2: Coming Soon (7 days)
**Purpose:** Build anticipation for upcoming launches  
**Duration:** 7 days  
**Advancement Criteria:**
- Automatically advances after 7 days
- **Must wait until Friday to launch**

**Characteristics:**
- Shows top 10 products per category
- Displays vote rankings
- Countdown to Friday drop
- Products cannot be purchased yet

**Route:** `/coming-soon`

---

### Stage 3: Community Drops (7 days)
**Purpose:** Live time-limited group buying opportunity  
**Launch Day:** **Friday only**  
**Duration:** 7 days (Friday to Friday)  
**Advancement Criteria:**
- Automatically completes after 7 days

**Characteristics:**
- Products available for purchase
- Limited time offer (7 days)
- Group buying mechanics active
- Pledge/purchase tracking
- Always launches on Friday

**Route:** `/community-drops`

---

### Stage 4: Recently Completed (Permanent)
**Purpose:** Archive of completed drops  
**Duration:** Permanent  
**Advancement:** Terminal stage (no further movement)

**Characteristics:**
- Historical record
- Shows final stats
- Products no longer available
- Community can reference past drops

**Route:** `/recently-completed` (to be created)

---

## ⚙️ Configuration

### Default Settings
```typescript
{
  votingDuration: 7,                // Days in voting stage
  votingToComingSoonThreshold: 10,  // Minimum votes to graduate
  comingSoonDuration: 7,            // Days in coming soon
  communityDropsDuration: 7,        // Days live
  dropStartDay: 5,                  // 5 = Friday (0 = Sunday)
  autoPromotionEnabled: true        // Enable automatic transitions
}
```

### Customization
Edit `src/utils/productLifecycle.ts`:
```typescript
export const DEFAULT_LIFECYCLE_CONFIG: LifecycleConfig = {
  votingDuration: 7,              // Change duration
  votingToComingSoonThreshold: 10, // Change vote requirement
  comingSoonDuration: 7,
  communityDropsDuration: 7,
  dropStartDay: 5,                // Change launch day
  autoPromotionEnabled: true
};
```

---

## 🤖 Automatic Transitions

### Transition Rules

#### Voting → Coming Soon
**Triggers when:**
- Product has been in Voting for 7 days AND
- Product has at least 10 votes

**Action:**
- Update `stage` to `"coming-soon"`
- Set `stageEnteredAt` to current date
- Set `promotedAt` timestamp

#### Coming Soon → Community Drops
**Triggers when:**
- Product has been in Coming Soon for 7 days AND
- **Current day is Friday**

**Special Rule:** Products wait until Friday even if they've been in Coming Soon for more than 7 days

**Action:**
- Update `stage` to `"community-drops"`
- Set `stageEnteredAt` to current Friday
- Set `promotedAt` timestamp

#### Community Drops → Recently Completed
**Triggers when:**
- Product has been in Community Drops for 7 days

**Action:**
- Update `stage` to `"recently-completed"`
- Set `stageEnteredAt` to current date
- Set `completedAt` timestamp

---

## 🛠️ Implementation Functions

### Core Functions

#### `shouldAutoTransition(product, config)`
Checks if a product should automatically move to next stage.

**Returns:** `boolean`

**Example:**
```typescript
import { shouldAutoTransition } from '@/utils/productLifecycle';

const product = {
  id: 1,
  name: "Product",
  votes: 15,
  stage: "voting",
  stageEnteredAt: "2025-12-01T00:00:00Z"
};

if (shouldAutoTransition(product)) {
  // Product ready to advance
}
```

#### `transitionProductStage(product, config)`
Transitions a product to its next stage.

**Returns:** `ProductWithStage` (updated product)

**Example:**
```typescript
import { transitionProductStage } from '@/utils/productLifecycle';

const updatedProduct = transitionProductStage(product);
// updatedProduct.stage = "coming-soon"
// updatedProduct.stageEnteredAt = current ISO date
```

#### `processLifecycleTransitions(products, config)`
Processes all products and auto-transitions where needed.

**Returns:** `ProductWithStage[]` (updated products array)

**Example:**
```typescript
import { processLifecycleTransitions } from '@/utils/productLifecycle';

const products = await fetchProducts();
const updatedProducts = processLifecycleTransitions(products);
await saveProducts(updatedProducts);
```

#### `getProductLifecycleStatus(product, config)`
Gets detailed lifecycle status for a product.

**Returns:** Status object with progress info

**Example:**
```typescript
import { getProductLifecycleStatus } from '@/utils/productLifecycle';

const status = getProductLifecycleStatus(product);
console.log(status);
// {
//   currentStage: "voting",
//   daysInStage: 3,
//   daysRemaining: 4,
//   statusMessage: "7 more votes needed • 4 days left",
//   readyToTransition: false,
//   nextStage: "coming-soon",
//   stageProgress: 42
// }
```

### Utility Functions

#### `getNextFriday(fromDate)`
Gets the next Friday from a given date.

**Example:**
```typescript
import { getNextFriday } from '@/utils/productLifecycle';

const nextDrop = getNextFriday(new Date());
console.log(nextDrop); // Date object for next Friday at midnight
```

#### `isFriday(date)`
Checks if a date is Friday.

**Example:**
```typescript
import { isFriday } from '@/utils/productLifecycle';

if (isFriday()) {
  console.log("Launch day!");
}
```

#### `getDaysUntilNextFriday()`
Gets number of days until next Friday.

**Example:**
```typescript
import { getDaysUntilNextFriday } from '@/utils/productLifecycle';

const daysLeft = getDaysUntilNextFriday();
console.log(`Drops in ${daysLeft} days`);
```

#### `getProductsWaitingForFriday(products, config)`
Gets products ready to launch but waiting for Friday.

**Example:**
```typescript
import { getProductsWaitingForFriday } from '@/utils/productLifecycle';

const waitingProducts = getProductsWaitingForFriday(products);
console.log(`${waitingProducts.length} products dropping Friday!`);
```

---

## 🔌 API Integration

### Recommended API Structure

#### GET /api/products
```typescript
export default async function handler(req, res) {
  // 1. Fetch products from database
  let products = await fetchProductsFromDB();
  
  // 2. Process lifecycle transitions
  products = processLifecycleTransitions(products);
  
  // 3. Save updated products
  await saveProductsToDB(products);
  
  // 4. Return products
  res.json({ products });
}
```

#### Automatic Processing
Add lifecycle processing to your products API:

```typescript
import { processLifecycleTransitions } from '@/utils/productLifecycle';

// In your API route
const rawProducts = await db.products.findAll();
const processedProducts = processLifecycleTransitions(rawProducts);

// Update database with new stages
for (const product of processedProducts) {
  if (product.stage !== rawProducts.find(p => p.id === product.id)?.stage) {
    await db.products.update(product.id, {
      stage: product.stage,
      stageEnteredAt: product.stageEnteredAt,
      promotedAt: product.promotedAt
    });
  }
}
```

---

## 📅 Friday Launch System

### Why Friday?

**Strategic Benefits:**
1. **Weekend Shopping** - People have more time to browse
2. **Community Engagement** - Higher user activity on Fridays
3. **Predictable Schedule** - Users know when to expect drops
4. **Marketing Rhythm** - Weekly cadence for promotions

### Implementation

**Waiting for Friday:**
```typescript
// Product in Coming Soon for 7+ days on Wednesday
{
  stage: "coming-soon",
  stageEnteredAt: "2025-11-27T00:00:00Z" // 11 days ago
}

// Current day: Wednesday
// Action: Keep in Coming Soon until Friday

// Current day: Friday
// Action: Auto-transition to Community Drops
```

**Next Friday Calculation:**
```typescript
const getNextFriday = (fromDate = new Date()) => {
  const result = new Date(fromDate);
  const dayOfWeek = result.getDay();
  const daysUntilFriday = (5 - dayOfWeek + 7) % 7;
  const actualDaysToAdd = daysUntilFriday === 0 ? 7 : daysUntilFriday;
  result.setDate(result.getDate() + actualDaysToAdd);
  result.setHours(0, 0, 0, 0);
  return result;
};
```

---

## 🎯 Page-Specific Implementation

### Voting Page (`/voting`)

**Auto-transition logic:**
```typescript
useEffect(() => {
  const fetchData = async () => {
    const response = await fetch("/api/products");
    const data = await response.json();
    
    // Filter only voting stage
    const votingProducts = data.products.filter(
      p => p.stage === "voting"
    );
    
    setProducts(votingProducts);
  };
  
  fetchData();
}, []);
```

**Status display:**
```typescript
const status = getProductLifecycleStatus(product);

<div>
  <p>{status.statusMessage}</p>
  <ProgressBar value={status.stageProgress} />
  <p>Days in voting: {status.daysInStage}/{config.votingDuration}</p>
</div>
```

### Coming Soon Page (`/coming-soon`)

**Friday countdown:**
```typescript
const waitingForFriday = getProductsWaitingForFriday(products);
const daysToFriday = getDaysUntilNextFriday();

{waitingForFriday.length > 0 && (
  <div className="alert">
    🎉 {waitingForFriday.length} products dropping this Friday!
    {daysToFriday > 0 && ` (in ${daysToFriday} days)`}
  </div>
)}
```

### Community Drops Page (`/community-drops`)

**Live drop display:**
```typescript
const activeDrops = products.filter(p => p.stage === "community-drops");
const dropStatus = getProductLifecycleStatus(product);

<div>
  <h2>Active Drop - {dropStatus.daysRemaining} days left</h2>
  <p>Drop ends: {getDropEndDate(product)}</p>
</div>
```

### Recently Completed Page (New)

**Archive view:**
```typescript
const completedProducts = products.filter(
  p => p.stage === "recently-completed"
);

// Sort by completion date (most recent first)
completedProducts.sort((a, b) => 
  new Date(b.completedAt) - new Date(a.completedAt)
);
```

---

## 🧪 Testing Lifecycle Transitions

### Manual Testing

#### Test Voting → Coming Soon
```typescript
// Create test product
const testProduct = {
  id: 999,
  name: "Test Product",
  votes: 10,
  stage: "voting",
  stageEnteredAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
};

// Should transition (7+ days, 10+ votes)
const shouldTransition = shouldAutoTransition(testProduct);
console.log(shouldTransition); // true

const transitioned = transitionProductStage(testProduct);
console.log(transitioned.stage); // "coming-soon"
```

#### Test Coming Soon → Community Drops
```typescript
// Create test product (ready to drop)
const testProduct = {
  id: 999,
  name: "Test Product",
  votes: 15,
  stage: "coming-soon",
  stageEnteredAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
};

// Mock Friday
const mockFriday = () => {
  const friday = new Date();
  friday.setDate(friday.getDate() + ((5 - friday.getDay() + 7) % 7));
  return friday;
};

// Should only transition on Friday
const shouldTransition = shouldAutoTransition(testProduct);
const isItFriday = isFriday();

console.log(`Should transition: ${shouldTransition}`);
console.log(`Is Friday: ${isItFriday}`);
```

### Automated Testing

```typescript
describe('Product Lifecycle', () => {
  it('should transition from voting after 7 days with 10+ votes', () => {
    const product = createTestProduct('voting', 7, 15);
    expect(shouldAutoTransition(product)).toBe(true);
    
    const transitioned = transitionProductStage(product);
    expect(transitioned.stage).toBe('coming-soon');
  });
  
  it('should wait for Friday before launching drops', () => {
    const product = createTestProduct('coming-soon', 8, 20);
    
    // Not Friday
    if (!isFriday()) {
      expect(shouldAutoTransition(product)).toBe(false);
    }
  });
  
  it('should complete drop after 7 days', () => {
    const product = createTestProduct('community-drops', 7, 25);
    expect(shouldAutoTransition(product)).toBe(true);
    
    const transitioned = transitionProductStage(product);
    expect(transitioned.stage).toBe('recently-completed');
    expect(transitioned.completedAt).toBeDefined();
  });
});
```

---

## 📈 Analytics & Tracking

### Lifecycle Events to Track

1. **Stage Transitions**
   - When: Product moves to new stage
   - Data: productId, fromStage, toStage, timestamp
   
2. **Voting Completions**
   - When: Product meets vote threshold
   - Data: productId, finalVotes, daysInVoting
   
3. **Friday Launches**
   - When: Products go live on Friday
   - Data: productIds[], launchDate, productsCount
   
4. **Drop Completions**
   - When: Drop ends after 7 days
   - Data: productId, totalPledges, revenue

### Implementation Example

```typescript
// Track stage transition
const trackTransition = (product: ProductWithStage, fromStage: string) => {
  analytics.track('Product Stage Transition', {
    productId: product.id,
    productName: product.name,
    fromStage,
    toStage: product.stage,
    timestamp: new Date().toISOString(),
    daysInPreviousStage: getDaysInStage(product.stageEnteredAt)
  });
};

// In transition function
const oldStage = product.stage;
const newProduct = transitionProductStage(product);
if (newProduct.stage !== oldStage) {
  trackTransition(newProduct, oldStage);
}
```

---

## 🚨 Error Handling

### Common Issues

#### Products Stuck in Stage
**Symptom:** Product not advancing despite meeting criteria  
**Causes:**
- `autoPromotionEnabled` set to false
- API not processing lifecycle transitions
- Missing `stageEnteredAt` timestamp

**Fix:**
```typescript
// Check configuration
console.log(config.autoPromotionEnabled); // Should be true

// Verify stageEnteredAt exists
if (!product.stageEnteredAt) {
  product.stageEnteredAt = new Date().toISOString();
}

// Manually process
const updated = processLifecycleTransitions([product]);
```

#### Friday Launch Not Working
**Symptom:** Products not launching on Friday  
**Causes:**
- Timezone issues
- Server time not matching expected timezone
- Friday check failing

**Fix:**
```typescript
// Debug Friday check
const now = new Date();
console.log('Current day:', now.getDay()); // Should be 5 for Friday
console.log('Is Friday?', isFriday());
console.log('Server time:', now.toISOString());

// Force transition (admin only)
if (isAdmin) {
  const forced = transitionProductStage(product);
  await updateProduct(forced);
}
```

#### Premature Transitions
**Symptom:** Products advancing too early  
**Causes:**
- Incorrect date calculations
- Missing duration checks

**Fix:**
```typescript
// Verify days calculation
const days = getDaysInStage(product.stageEnteredAt);
console.log(`Days in stage: ${days}`);
console.log(`Required: ${config.votingDuration}`);

// Add safety checks
if (days < config.votingDuration) {
  console.warn('Product not ready to transition');
  return product;
}
```

---

## 🔐 Admin Controls

### Manual Promotion

Admins can manually promote products:

```typescript
const promoteProduct = async (productId: number) => {
  const product = await getProduct(productId);
  const nextStage = getNextStage(product.stage);
  
  if (!nextStage) {
    throw new Error('Product at final stage');
  }
  
  const updated = {
    ...product,
    stage: nextStage,
    stageEnteredAt: new Date().toISOString(),
    promotedAt: new Date().toISOString(),
    manuallyPromoted: true
  };
  
  await updateProduct(updated);
  return updated;
};
```

### Rollback Stage

```typescript
const rollbackProduct = async (productId: number) => {
  const product = await getProduct(productId);
  const previousStage = getPreviousStage(product.stage);
  
  if (!previousStage) {
    throw new Error('Product at first stage');
  }
  
  const updated = {
    ...product,
    stage: previousStage,
    stageEnteredAt: new Date().toISOString()
  };
  
  await updateProduct(updated);
  return updated;
};
```

---

## 📚 Best Practices

### 1. Always Process Transitions on API Fetch
```typescript
// ✅ Good
const products = await fetchProducts();
const processed = processLifecycleTransitions(products);
return processed;

// ❌ Bad
const products = await fetchProducts();
return products; // Missing lifecycle processing
```

### 2. Use Status Functions for UI
```typescript
// ✅ Good
const status = getProductLifecycleStatus(product);
<div>{status.statusMessage}</div>

// ❌ Bad
<div>Days: {getDaysInStage(product.stageEnteredAt)}</div>
```

### 3. Respect Friday Launch Rule
```typescript
// ✅ Good
if (product.stage === 'coming-soon' && shouldAutoTransition(product)) {
  if (isFriday()) {
    transitionProductStage(product);
  }
}

// ❌ Bad
if (shouldAutoTransition(product)) {
  transitionProductStage(product); // Ignores Friday rule
}
```

### 4. Track All Transitions
```typescript
// ✅ Good
const oldStage = product.stage;
const updated = transitionProductStage(product);
if (updated.stage !== oldStage) {
  await trackTransition(updated, oldStage);
  await notifyUsers(updated);
}

// ❌ Bad
transitionProductStage(product); // No tracking
```

---

## 🎯 Quick Reference

| Stage | Duration | Entry Requirement | Exit Trigger | Launch Day |
|-------|----------|------------------|--------------|------------|
| Voting | 7 days | Default start | 7 days + 10 votes | Any |
| Coming Soon | 7 days | From voting | 7 days | Any |
| Community Drops | 7 days | From coming soon | 7 days | **Friday** |
| Recently Completed | Permanent | From drops | None | N/A |

---

**Last Updated:** December 8, 2025  
**Maintained By:** MIGISTUS Development Team  
**Status:** ✅ Production Ready
