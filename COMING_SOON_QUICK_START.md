# Coming Soon Page - Quick Start Guide

**Created:** December 8, 2025  
**Page:** `/coming-soon`  
**File:** `src/pages/coming-soon-new.tsx`

---

## 🚀 Quick Deploy

### Step 1: Backup Current Version
```bash
# From project root
cd src/pages
mv coming-soon.tsx coming-soon-old.tsx
```

### Step 2: Activate New Version
```bash
mv coming-soon-new.tsx coming-soon.tsx
```

### Step 3: Test
- Visit `http://localhost:3000/coming-soon`
- Check products display correctly
- Test search and filters
- Verify vote counts show
- Test grid/list view toggle

---

## 📋 What This Page Does

**Shows:** Top 10 voted products per category preparing for Live Drops  
**Data:** Products with `stage === "coming-soon"`  
**Sorting:** By weighted vote score (highest first)  
**Grouping:** By product category  
**Features:** Search, filter, dual view modes, ranking badges

---

## 🎯 Key Features at a Glance

### 1. Top Product Spotlight
- Featured card showing #1 overall product
- Large image, full description
- Vote count and days waiting
- Prominent "View Details" CTA

### 2. Category Sections
- Products grouped by category
- Top 10 per category
- Category headers with counts
- Sorted by vote score

### 3. Search & Filter
- Search by name, description, supplier
- Filter by category
- Real-time results
- Case-insensitive matching

### 4. Dual View Modes
- **Grid View:** 4-column product cards (responsive)
- **List View:** Horizontal cards with more details

### 5. Ranking System
- Rank badges (#1, #2, #3...)
- Weighted vote scores displayed
- Raw vote counts shown
- Trophy icons for leaders

---

## 📊 Vote Scoring (Same as Voting Page)

```
Initiate votes:  1x multiplier
Guild votes:     2x multiplier
MIGISTUS votes:  4x multiplier
Admin votes:     4x multiplier

Weighted Score = Sum of (vote.value × tier_multiplier)
```

**Example:**
- 10 Initiate votes (1x) = 10 points
- 5 Guild votes (2x) = 10 points  
- 2 MIGISTUS votes (4x) = 8 points
- **Total:** 28 points

---

## 🎨 Visual Design

### Color Palette
- **Primary:** Purple (#A855F7) to Blue (#3B82F6)
- **Accents:** Yellow (#FACC15) for rankings
- **Background:** Zinc-950 to Black gradient
- **Text:** White/Zinc-300 on dark

### Badges
- **Rank Badge:** Purple-blue gradient, white text
- **Score Badge:** Black bg, yellow border, trophy icon
- **Top Product:** Yellow trophy with "TOP VOTED" label

### Animations
- Background blob pulse (2s)
- Image zoom on hover (0.5s)
- Card lift on hover (0.2s)
- Sparkle bounce

---

## 🔍 How Search Works

```typescript
Searches these fields:
✅ Product name
✅ Product description  
✅ Supplier name

Matching: Case-insensitive, partial matches
Updates: Real-time as you type
```

---

## 📱 Responsive Breakpoints

```
Mobile:    1 column (< 640px)
Tablet:    2 columns (640-1024px)  
Desktop:   3 columns (1024-1280px)
XL:        4 columns (> 1280px)
```

**List View:** Always 1 column, optimized for all screens

---

## 🔌 API Endpoints Used

### Products API
```
GET /api/products
Returns: { products: Product[] }
```

### Votes API
```
GET /api/votes  
Returns: { votes: Vote[] }
```

**Data Processing:**
1. Fetch both endpoints in parallel
2. Filter products: `stage === "coming-soon"`
3. Calculate vote scores per product
4. Sort by weighted score (descending)
5. Group by category
6. Take top 10 per category
7. Render UI

---

## 🎯 Product Card Info

### Grid View Card
```
┌─────────────────┐
│ #1    🏆245 pts │  <- Badges
│                 │
│   [Product]     │  <- Image
│                 │
├─────────────────┤
│ Product Name    │  <- Title
│ Description...  │  <- Description
├─────────────────┤
│ 👥 50  ⏰ 7d   │  <- Stats
│ [View Product]  │  <- CTA
└─────────────────┘
```

### List View Card
```
┌──┬───────┬──────────────────────────────────────┬─→┐
│#1│[Image]│ Product Name                         │ │
│  │       │ Description text here...             │ │
│  │       │ 🏆245 👥50 ⏰7d                      │ │
└──┴───────┴──────────────────────────────────────┴─→┘
```

---

## 🧪 Testing Checklist

### Basic Functionality
- [ ] Page loads without errors
- [ ] Products display in categories
- [ ] Vote scores show correctly
- [ ] Search filters products
- [ ] Category filter works
- [ ] View toggle switches modes
- [ ] Product links navigate correctly

### Edge Cases
- [ ] No products (empty state)
- [ ] API error (error message)
- [ ] Missing images (placeholder)
- [ ] Long product names (truncation)
- [ ] No votes (shows 0)
- [ ] Single category (layout okay)

### Performance
- [ ] Page loads < 3 seconds
- [ ] Images lazy load
- [ ] Smooth animations
- [ ] No console errors
- [ ] Mobile responsive

---

## 🐛 Common Issues & Fixes

### Products Not Showing
**Problem:** Empty page, no products  
**Check:** API endpoints returning data?  
**Fix:** Verify `/api/products` has products with `stage: "coming-soon"`

### Vote Counts Wrong
**Problem:** Scores don't match expected  
**Check:** Vote multipliers correct?  
**Fix:** Verify tier values in votes data (Initiate, Guild, MIGISTUS)

### Images Not Loading
**Problem:** Broken image placeholders  
**Check:** Image paths correct?  
**Fix:** Ensure images exist in `/public/images/` or add to `next.config.js`

### Search Not Working
**Problem:** Typing doesn't filter  
**Check:** searchTerm state updating?  
**Fix:** Check console for errors, verify event handler

### Layout Broken on Mobile
**Problem:** Cards overflow or misaligned  
**Check:** Responsive classes applied?  
**Fix:** Test with browser dev tools, adjust Tailwind breakpoints

---

## 🔄 Product Lifecycle Flow

```
User votes → Voting Page
     ↓
Top products graduate
     ↓
Coming Soon Page ← You are here
     ↓
Scheduled launch
     ↓
Live Drops Page
```

**Transition:** Products move from Coming Soon to Live Drops when admin schedules launch

---

## 💡 Usage Tips

### For Administrators
1. **Monitor Categories:** Check which categories have most products
2. **Review Rankings:** Verify top products make sense
3. **Launch Planning:** Use vote counts to predict demand
4. **Content Updates:** Replace placeholder images before launch

### For Users
1. **Browse by Category:** Use filters to find specific types
2. **Check Rankings:** #1-3 products are community favorites
3. **Search:** Find specific products quickly
4. **Wishlist:** Click products to view details and save

### For Developers
1. **Vote Sync:** Ensure votes API stays in sync with voting page
2. **Stage Management:** Products should auto-transition from voting
3. **Performance:** Monitor load times with many products
4. **Analytics:** Track which products get most views

---

## 📊 Stats Explained

### Hero Stats
- **Products Ready:** Total count of Coming Soon products
- **Categories:** Number of unique categories represented  
- **Top Community Picks:** Badge indicating quality curation

### Product Stats
- **🏆 Score:** Weighted vote total (points)
- **👥 Votes:** Raw number of individual votes
- **⏰ Days:** Days since entering Coming Soon stage

---

## 🎨 Customization Guide

### Change Top Products Limit
```typescript
// In productsByCategory useMemo
if (categorized[category].length < 10) {  // Change 10 to desired number
  categorized[category].push(product);
}
```

### Adjust Grid Columns
```typescript
// In products grid className
className="grid 
  sm:grid-cols-2     // 2 on small screens
  lg:grid-cols-3     // 3 on large screens  
  xl:grid-cols-4     // 4 on XL screens - Change these
  gap-6"
```

### Modify Color Scheme
```typescript
// Find and replace gradient classes
from-purple-400 to-blue-500  // Primary gradient
from-purple-500 to-blue-500  // Button gradient
text-yellow-400               // Ranking color
```

---

## 📈 Performance Optimization

### Image Sizes
```typescript
sizes="(max-width: 640px) 100vw,   // Mobile: full width
       (max-width: 1024px) 50vw,   // Tablet: half width
       (max-width: 1280px) 33vw,   // Desktop: third width
       25vw"                       // XL: quarter width
```

### Memoization
```typescript
// Prevents recalculation on every render
useMemo(() => {
  // Expensive filtering/sorting
}, [dependencies]);
```

### Lazy Loading
- Images load as they enter viewport
- Reduces initial page load
- Improves performance score

---

## 🔐 Security Notes

### Input Sanitization
- Search input automatically escaped by React
- No raw HTML rendering
- XSS prevention built-in

### API Security
- Validate API responses
- Handle errors gracefully
- Don't expose sensitive data

---

## 📝 Quick Reference

### File Locations
```
Page:          src/pages/coming-soon.tsx
Old Backup:    src/pages/coming-soon-old.tsx
Data:          public/data/coming-soon.json (if exists)
API Products:  src/pages/api/products/index.ts
API Votes:     src/pages/api/votes/index.ts
Utils:         src/utils/productLifecycle.ts
               src/utils/productUtils.ts
```

### Routes
```
Coming Soon:   /coming-soon
Voting:        /voting
Live Drops:    /live-drops
Product Page:  /products/[id]
```

### Key Functions
```typescript
getVoteCount(productId)         // Raw vote count
getWeightedVoteCount(productId) // Weighted score
getDaysInStage(date)            // Days since stage entry
getProductUrl(product)          // Generate product link
```

---

## 🎓 Learning Resources

### Related Docs
- `VOTING_PAGE_OVERHAUL.md` - Voting system details
- `COMING_SOON_OVERHAUL.md` - Complete technical docs
- `LIVE_DATA_IMPLEMENTATION_PLAN.md` - Lifecycle overview

### Key Concepts
1. **Product Lifecycle** - Voting → Coming Soon → Live Drops
2. **Vote Weighting** - Tier multipliers for fair scoring
3. **Responsive Design** - Mobile-first approach
4. **Performance** - Image optimization, memoization

---

## ✅ Pre-Launch Checklist

- [ ] Backup old version created
- [ ] New version renamed to coming-soon.tsx
- [ ] Dev server running (`npm run dev`)
- [ ] Page loads at `/coming-soon`
- [ ] Products display correctly
- [ ] Vote scores accurate
- [ ] Search works
- [ ] Filters work
- [ ] View modes toggle
- [ ] Mobile responsive
- [ ] No console errors
- [ ] Images loading
- [ ] Links navigate correctly
- [ ] Empty state works
- [ ] Error handling works

---

## 🚨 Emergency Rollback

If issues occur:

```bash
# Stop dev server
Ctrl+C

# Restore old version
cd src/pages
mv coming-soon.tsx coming-soon-broken.tsx
mv coming-soon-old.tsx coming-soon.tsx

# Restart dev server
npm run dev
```

---

## 📞 Support

**Questions?** Check:
1. `COMING_SOON_OVERHAUL.md` for detailed docs
2. Console for error messages
3. Network tab for API issues
4. React DevTools for component state

---

**Ready to Launch!** 🚀

Once deployed, monitor user engagement and gather feedback for future improvements.

**Next Steps:**
1. Deploy to production
2. Monitor analytics
3. Gather user feedback
4. Plan Live Drops page overhaul

---

**Created:** December 8, 2025  
**Version:** 1.0.0  
**Status:** ✅ Ready for Production
