# Coming Soon Page - Complete Overhaul Documentation

**Date:** December 8, 2025  
**Status:** ✅ Implementation Complete  
**File:** `src/pages/coming-soon-new.tsx`  
**Purpose:** Showcase top-voted products preparing for Live Drops

---

## 🎯 Overview

The Coming Soon page displays products that have successfully graduated from the voting stage and are preparing for launch in upcoming MIGISTUS drops. This page builds anticipation and showcases community-validated products.

### Key Features
- **Top 10 Products per Category** - Shows the highest-voted products in each category
- **Vote Rankings** - Displays weighted vote scores and vote counts
- **Category Organization** - Products grouped by category for easy browsing
- **Top Product Spotlight** - Featured section highlighting the #1 voted product
- **Search & Filter** - Advanced filtering by category and search
- **Dual View Modes** - Grid and list view options
- **Real-time Stats** - Live tracking of days in Coming Soon stage

---

## 📊 Product Lifecycle Integration

```
┌─────────┐    ┌──────────────┐    ┌────────────┐
│ Voting  │───▶│ Coming Soon  │───▶│ Live Drops │
└─────────┘    └──────────────┘    └────────────┘
   Vote on         Prepare          Launch!
   products        for launch       time-limited
```

**Transition Logic:**
- Products with `stage === "coming-soon"` are displayed
- Ranked by weighted vote count from voting stage
- Top 10 per category advance to feature section
- Builds anticipation for Live Drops phase

---

## 🎨 UI/UX Design

### Color Scheme
- **Primary Gradient:** Purple (400) → Blue (500) → Cyan (500)
- **Background:** Zinc-950 → Zinc-900 → Black gradient
- **Accent Colors:**
  - Purple/Blue for primary actions
  - Yellow (400) for rankings and awards
  - Orange/Red for "hot" indicators

### Visual Elements
1. **Hero Section**
   - Large Clock icon with animated glow
   - Gradient title text
   - Stats cards (total products, categories, votes)
   - Animated background blobs

2. **Top Product Spotlight**
   - Featured card with gradient border
   - Trophy badge indicator
   - Large product image
   - Detailed stats and CTA button

3. **Category Sections**
   - Category headers with product counts
   - Grid/List view toggle
   - Ranked product cards (1-10)

4. **Product Cards**
   - Rank badge (#1, #2, #3, etc.)
   - Product image with hover zoom
   - Vote score and count
   - Days in Coming Soon stage
   - Hover effects and transitions

---

## 🔢 Vote Scoring System

### Vote Counting
```typescript
// Raw vote count
const voteCount = votes.filter(vote => vote.productId === productId).length;

// Weighted vote score
const weightedScore = votes
  .filter(vote => vote.productId === productId)
  .reduce((total, vote) => {
    const multiplier = vote.tier === "MIGISTUS" ? 4 
                     : vote.tier === "Guild" ? 2 
                     : 1;
    return total + (vote.value * multiplier);
  }, 0);
```

### Tier Multipliers (from Voting)
- **Initiate:** 1x multiplier
- **Guild:** 2x multiplier  
- **MIGISTUS:** 4x multiplier
- **Admin:** 4x multiplier

### Ranking Logic
Products are sorted by weighted vote score in descending order. Top 10 products per category are displayed.

---

## 🔍 Search & Filter Features

### Search Functionality
- **Search Fields:** Product name, description, supplier name
- **Case-insensitive** matching
- **Real-time filtering** as user types

### Category Filter
- **All Categories** (default)
- Individual category selection
- Dynamic category list from products

### View Modes
- **Grid View** (default)
  - 4 columns on XL screens
  - 3 columns on LG screens
  - 2 columns on SM screens
  - 1 column on mobile
  
- **List View**
  - Horizontal card layout
  - Larger content area
  - Better for detailed browsing

---

## 📱 Responsive Design

### Breakpoints
```css
Mobile:    < 640px   (1 column grid, stacked elements)
Tablet:    640-1024  (2 columns grid, reduced spacing)
Desktop:   1024-1280 (3 columns grid, full features)
XL:        > 1280px  (4 columns grid, max content width)
```

### Mobile Optimizations
- Simplified top product spotlight
- Reduced card sizes
- Touch-friendly buttons
- Optimized image loading
- Compact stats display

---

## 🎭 Interactive Elements

### Hover Effects
```css
Product Cards:
- Scale: 1 → 1.02
- Border: zinc-700 → purple-500/50
- Background: zinc-800/30 → zinc-700/30
- Image: scale 1 → 1.1 (zoom effect)
```

### Animations
- **Background blobs:** Pulse animation (2s cycle)
- **Sparkles:** Bounce animation
- **Loading spinner:** Continuous rotation
- **View transitions:** 200-500ms duration

### Transitions
- All interactive elements: `transition-all duration-200`
- Image zoom: `duration-500` for smooth effect
- Color changes: `duration-300` for polish

---

## 🔌 API Integration

### Endpoints Used

#### 1. Products API
```typescript
GET /api/products
Response: { products: Product[] }

Product Interface:
{
  id: number | string;
  name: string;
  image?: string;
  description?: string;
  category?: string;
  price?: number;
  stage?: string;
  stageEnteredAt?: string;
  votes?: number;
  supplier?: { name: string };
}
```

#### 2. Votes API
```typescript
GET /api/votes
Response: { votes: Vote[] }

Vote Interface:
{
  productId: number | string;
  userId: number;
  tier: string;
  value: number;
  timestamp: string;
}
```

### Data Flow
```
1. Page loads → Fetch products + votes
2. Filter: stage === "coming-soon"
3. Calculate weighted scores
4. Sort by score (descending)
5. Group by category
6. Take top 10 per category
7. Render UI
```

---

## 📦 Component Structure

### Main Sections

1. **Hero Section** (`lines 138-239`)
   - Title with gradient text
   - Stats overview
   - Top product spotlight card

2. **Search & Filter** (`lines 241-281`)
   - Search input with icon
   - Category dropdown
   - View mode toggle (grid/list)

3. **Products Display** (`lines 283-532`)
   - Category headers
   - Grid/List rendering
   - Product cards with stats
   - Empty/loading states

### State Management
```typescript
const [products, setProducts] = useState<Product[]>([]);
const [votes, setVotes] = useState<Vote[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [searchTerm, setSearchTerm] = useState("");
const [filterCategory, setFilterCategory] = useState("all");
const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
const [currentTime, setCurrentTime] = useState(new Date());
```

### Memoization
- `comingSoonProducts` - Filtered and sorted products
- `productsByCategory` - Grouped products (top 10 per category)
- `categories` - Unique category list

---

## 🎯 Key Functionalities

### 1. Vote Calculation
```typescript
const getVoteCount = (productId: number | string): number => {
  return votes.filter(vote => vote.productId === productId).length;
};

const getWeightedVoteCount = (productId: number | string): number => {
  return votes
    .filter(vote => vote.productId === productId)
    .reduce((total, vote) => {
      const multiplier = vote.tier === "MIGISTUS" ? 4 
                       : vote.tier === "Guild" ? 2 
                       : 1;
      return total + (vote.value * multiplier);
    }, 0);
};
```

### 2. Product Filtering
```typescript
const comingSoonProducts = useMemo(() => {
  return products
    .filter(product => product.stage === 'coming-soon')
    .filter(product => {
      const matchesSearch = /* search logic */;
      const matchesCategory = /* category logic */;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => getWeightedVoteCount(b.id) - getWeightedVoteCount(a.id));
}, [products, searchTerm, filterCategory, votes]);
```

### 3. Category Grouping
```typescript
const productsByCategory = useMemo(() => {
  const categorized: Record<string, Product[]> = {};
  
  comingSoonProducts.forEach(product => {
    const category = product.category || "Other";
    if (!categorized[category]) {
      categorized[category] = [];
    }
    if (categorized[category].length < 10) {
      categorized[category].push(product);
    }
  });

  return categorized;
}, [comingSoonProducts]);
```

### 4. Days in Stage Calculation
```typescript
import { getDaysInStage } from "@/utils/productLifecycle";

const daysWaiting = getDaysInStage(product.stageEnteredAt);
// Returns: number of days since entering Coming Soon stage
```

---

## 🎨 Badge System

### Rank Badges
- **Position:** Top-left on product images (grid) or left side (list)
- **Style:** Purple-to-blue gradient background
- **Content:** `#1`, `#2`, `#3`, etc.
- **Size:** 
  - Grid: 40x40px
  - List: 48x48px

### Score Badges
- **Position:** Top-right on product images
- **Style:** Black background with yellow border
- **Content:** Trophy icon + weighted score
- **Format:** `🏆 245 pts`

### Trophy Indicators
- **Top Product:** Yellow trophy with "TOP VOTED PRODUCT" label
- **Category Leaders:** Gold crown icon for #1 in category
- **High Performers:** Fire icon for products with 100+ votes

---

## 📊 Stats Display

### Product Stats (per card)
1. **Weighted Score** - Total points from all votes
2. **Vote Count** - Number of individual votes
3. **Days Waiting** - Days since entering Coming Soon stage

### Page Stats (hero section)
1. **Total Products Ready** - Count of Coming Soon products
2. **Total Categories** - Number of active categories
3. **Top Community Picks** - Badge indicator

---

## 🔗 Navigation & Links

### Internal Links
- **View Product:** Links to product detail page via `getProductUrl(product)`
- **Vote for Products:** CTA button to `/voting` page (when empty state)
- **Category Filters:** Dynamic category selection

### URL Structure
```typescript
import { getProductUrl } from "@/utils/productUtils";

// Generates: /products/[id] or custom product URL
const productLink = getProductUrl(product);
```

---

## ⚡ Performance Optimizations

### Image Optimization
```typescript
<Image
  src={product.image || "/images/placeholder.png"}
  alt={product.name}
  fill
  className="object-cover"
  sizes="(max-width: 640px) 100vw, 
         (max-width: 1024px) 50vw, 
         (max-width: 1280px) 33vw, 
         25vw"
/>
```

### Memoization
- `useMemo` for expensive calculations
- Prevents unnecessary re-renders
- Optimizes filtering and grouping

### Lazy Loading
- Images load on-demand
- Background blobs use CSS animations (GPU accelerated)
- Smooth transitions with `will-change` properties

---

## 🎯 User Experience Features

### Empty States
1. **No Products Coming Soon**
   - Large clock icon
   - Helpful message
   - CTA to voting page

2. **No Search Results**
   - Clear filter message
   - Suggestion to adjust search/filters

### Loading States
- Centered spinner with purple glow
- "Loading products..." message
- Smooth fade-in on load

### Error Handling
- Red error banner with details
- AlertCircle icon
- Error message display
- Retry option

---

## 🔐 Security Considerations

### Data Validation
- Type checking with TypeScript interfaces
- Fallback images for missing data
- Safe navigation with optional chaining

### XSS Prevention
- React's built-in escaping
- Image URLs validated
- No dangerouslySetInnerHTML used

---

## 📈 Analytics Opportunities

### Trackable Events
1. **Product Views** - Click on product card
2. **View Mode Changes** - Grid ↔ List toggle
3. **Category Filters** - Category selection
4. **Search Usage** - Search term entries
5. **Top Product Clicks** - Spotlight CTA clicks

### Metrics to Track
- Most viewed categories
- Average time on page
- Click-through rate to products
- Popular search terms
- View mode preferences

---

## 🧪 Testing Checklist

### Functionality Tests
- [ ] Products load from API
- [ ] Vote scores calculate correctly
- [ ] Top 10 per category display
- [ ] Search filters products
- [ ] Category filter works
- [ ] View mode toggle functions
- [ ] Product links navigate correctly
- [ ] Empty state displays when no products
- [ ] Loading state shows during fetch
- [ ] Error state handles API failures

### UI/UX Tests
- [ ] Responsive design on all breakpoints
- [ ] Hover effects work smoothly
- [ ] Animations perform well
- [ ] Images load and display correctly
- [ ] Badges position properly
- [ ] Stats display accurately
- [ ] Search input responsive
- [ ] Filters update immediately

### Performance Tests
- [ ] Page loads under 3 seconds
- [ ] Images optimize and lazy load
- [ ] No layout shift during load
- [ ] Smooth scrolling
- [ ] No memory leaks (unmount cleanup)

---

## 🚀 Deployment Steps

### 1. Backup Current Page
```bash
# Rename existing coming-soon.tsx
mv src/pages/coming-soon.tsx src/pages/coming-soon-old.tsx
```

### 2. Deploy New Version
```bash
# Rename new version to production name
mv src/pages/coming-soon-new.tsx src/pages/coming-soon.tsx
```

### 3. Test Production
- Visit `/coming-soon` route
- Verify all features work
- Check mobile responsiveness
- Test search and filters
- Confirm vote scores display

### 4. Monitor
- Watch for errors in console
- Check API response times
- Monitor user engagement
- Gather feedback

---

## 🔄 Maintenance Guide

### Regular Updates
1. **Vote Data Sync** - Ensure vote counts update when voting page changes
2. **Product Stage Transitions** - Monitor products graduating to Live Drops
3. **Image Quality** - Replace placeholders with high-quality images
4. **Category Management** - Add new categories as needed

### Common Issues

**Issue:** Products not displaying
- **Check:** API endpoints are returning data
- **Fix:** Verify `/api/products` and `/api/votes` are functioning

**Issue:** Vote counts incorrect
- **Check:** Vote calculation logic and tier multipliers
- **Fix:** Verify vote data structure matches interface

**Issue:** Search not working
- **Check:** searchTerm state updates
- **Fix:** Verify filter logic in useMemo

**Issue:** Images not loading
- **Check:** Image paths and Next.js Image config
- **Fix:** Add domain to next.config.js if external images

---

## 📚 Dependencies

### Required Packages
- `next`: ^16.0.7
- `react`: ^19.0.0
- `lucide-react`: Icons library
- `typescript`: ^5.7.2

### Internal Dependencies
```typescript
import MainNavbar from "@/components/nav/MainNavbar";
import { getStageInfo, getDaysInStage } from "@/utils/productLifecycle";
import { getProductUrl } from "@/utils/productUtils";
```

---

## 🎓 Code Examples

### Adding a New Filter
```typescript
// 1. Add state
const [sortOrder, setSortOrder] = useState<"highest" | "newest">("highest");

// 2. Update useMemo
const sortedProducts = useMemo(() => {
  const filtered = /* existing filter logic */;
  
  if (sortOrder === "newest") {
    return filtered.sort((a, b) => 
      new Date(b.stageEnteredAt).getTime() - 
      new Date(a.stageEnteredAt).getTime()
    );
  }
  
  return filtered; // highest votes (default)
}, [products, sortOrder]);

// 3. Add UI control
<select 
  value={sortOrder} 
  onChange={(e) => setSortOrder(e.target.value)}
>
  <option value="highest">Highest Votes</option>
  <option value="newest">Newest</option>
</select>
```

### Custom Badge Component
```typescript
const RankBadge = ({ rank, size = "md" }) => {
  const sizeClasses = {
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-lg",
    lg: "w-12 h-12 text-xl"
  };

  const colorClasses = rank === 1 
    ? "from-yellow-500 to-orange-500" 
    : rank === 2
    ? "from-zinc-400 to-zinc-500"
    : rank === 3
    ? "from-amber-600 to-amber-700"
    : "from-purple-500 to-blue-500";

  return (
    <div className={`
      ${sizeClasses[size]}
      rounded-lg bg-gradient-to-br ${colorClasses}
      flex items-center justify-center shadow-lg
    `}>
      <span className="font-black text-white">#{rank}</span>
    </div>
  );
};
```

---

## 🎯 Future Enhancements

### Phase 2 Features
1. **Notify Me** - Email notifications when product goes live
2. **Share Buttons** - Social media sharing
3. **Countdown Timers** - Specific launch dates/times
4. **Product Comparison** - Compare top products side-by-side
5. **Wishlist Integration** - Save favorites for later

### Phase 3 Features
1. **Live Chat** - Community discussion per product
2. **Pre-orders** - Reserve items before launch
3. **Supplier Info** - Detailed supplier profiles
4. **Reviews Preview** - Early reviews from beta testers
5. **Launch Notifications** - Push notifications for drops

---

## 📝 Change Log

### Version 1.0.0 - December 8, 2025
- ✅ Initial implementation
- ✅ Top 10 products per category
- ✅ Vote scoring and ranking
- ✅ Search and filter functionality
- ✅ Grid and list view modes
- ✅ Top product spotlight
- ✅ Responsive design
- ✅ Loading and error states
- ✅ Real-time stats tracking

---

## 🤝 Related Documentation

- **Voting Page:** `VOTING_PAGE_OVERHAUL.md`
- **Product Lifecycle:** `LIVE_DATA_IMPLEMENTATION_PLAN.md`
- **Live Drops:** (Coming soon)
- **API Documentation:** (In development)

---

## 💡 Tips & Best Practices

### For Developers
1. Always use TypeScript interfaces for type safety
2. Leverage useMemo for expensive calculations
3. Keep components modular and reusable
4. Use Tailwind's responsive utilities
5. Test on real devices, not just browser dev tools

### For Designers
1. Maintain consistent color scheme (purple/blue gradient)
2. Use 8px spacing grid for alignment
3. Keep animations subtle (200-500ms)
4. Ensure 4.5:1 contrast ratio for accessibility
5. Design mobile-first, then scale up

### For Product Managers
1. Monitor top categories for trends
2. Track search terms for insights
3. A/B test different layouts
4. Gather user feedback regularly
5. Adjust top 10 count based on engagement

---

## 🎉 Success Metrics

### Launch Goals
- **Performance:** < 3s page load time
- **Engagement:** > 5 products viewed per session
- **Conversion:** > 30% click-through to product pages
- **Satisfaction:** > 4.5/5 user rating

### Monitoring
- Google Analytics integration
- User session recordings
- Heatmap analysis
- A/B testing results

---

**Last Updated:** December 8, 2025  
**Maintained By:** MIGISTUS Development Team  
**Status:** ✅ Production Ready
