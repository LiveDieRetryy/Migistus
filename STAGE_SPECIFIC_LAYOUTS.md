# Stage-Specific Product Page Layouts

## 🎯 Overview

Product pages now dynamically render **completely different layouts** based on their lifecycle stage, with each design optimized for that stage's primary goal.

---

## 📊 Three Distinct Layouts

### **1. VOTING STAGE** 🗳️
**Primary Goal:** Draw in votes and build community support

#### **Layout Features:**
- **Simplified 2-column grid** - Less overwhelming, vote-focused
- **Large voting button** - Prominent blue/purple gradient, takes center stage
- **Vote progress tracker** - Shows how close to goal (100 votes)
- **Community sentiment** - Displays voting stats and engagement
- **"Why Vote?" section** - Explains benefits of voting early
- **Estimated price preview** - Teases future savings
- **Minimal features** - Just top 5 to avoid overwhelming
- **Social proof** - Views counter, save/share options

#### **Visual Style:**
- 🔵 **Blue/Purple theme** - Voting-focused colors
- **Large CTA:** "VOTE FOR THIS PRODUCT" button with pulsing glow
- **Progress indicators** - Days in voting, % to goal
- **Simplified imagery** - Focus on product, not overwhelming details

#### **User Journey:**
1. See product → 2. Learn why to vote → 3. **VOTE** → 4. Share with friends

---

### **2. COMING SOON STAGE** ⏰  
**Primary Goal:** Showcase product and build anticipation

#### **Layout Features:**
- **Hero image showcase** - Large 4:3 aspect ratio product display
- **Image gallery with navigation** - Arrows to browse, thumbnails below
- **Countdown timer** - Days until community drop
- **"Notify Me" CTA** - Big yellow button to get drop alerts
- **Expected launch price** - Shows savings, creates FOMO
- **Detailed features grid** - 6 feature cards with icons
- **Full specifications** - Technical details in clean 2-column layout
- **Premium feel** - Showcases quality and value

#### **Visual Style:**
- 🟡 **Yellow/Gold theme** - Coming soon, anticipation colors
- **3-column + 2-column grid** - Large hero image takes 3/5 width
- **Feature cards** - Hover effects, premium styling
- **Launch countdown** - Prominent timer showing urgency

#### **User Journey:**
1. See beautiful product → 2. Explore features → 3. **NOTIFY ME** → 4. Wait for drop

---

### **3. COMMUNITY DROPS (LIVE) STAGE** 🔥
**Primary Goal:** Drive pledges and conversions

#### **Layout Features:**
- **Current detailed layout** - Keeps all existing functionality
- **Stock availability** - Shows remaining units prominently
- **Max per guild member** - One-order-per-member enforcement
- **Order tracking** - "Already Ordered" status display  
- **Pledge progress** - Shows community engagement
- **Pricing tiers** - Volume discounts displayed
- **Action-focused CTAs** - "Add to Cart" / "Join Drop" buttons
- **Full information tabs** - Overview, Reviews, Chat, Specs, Shipping
- **Trust badges** - Secure payment, free shipping, returns

#### **Visual Style:**
- 🟢 **Green/Cyan theme** - Active, available, purchase-ready
- **2-column grid** - Image gallery + detailed info panel
- **Stock alerts** - Color-coded (Cyan = In Stock, Orange = Low, Red = Out)
- **Urgency indicators** - Low stock warnings, drop timers

#### **User Journey:**
1. See product details → 2. Check stock → 3. Review order limits → 4. **PURCHASE**

---

## 🎨 Design Differences at a Glance

| Element | Voting | Coming Soon | Live Drops |
|---------|--------|-------------|------------|
| **Primary Color** | Blue/Purple | Yellow/Gold | Green/Cyan |
| **Main CTA** | VOTE | NOTIFY ME | ADD TO CART |
| **Image Layout** | Square, simple | Hero showcase | Gallery grid |
| **Info Density** | Minimal | Medium | Maximum |
| **Social Proof** | Vote count | Views/shares | Reviews/orders |
| **Urgency** | Vote deadline | Launch countdown | Stock remaining |
| **Price Display** | Estimated | Expected + savings | Live + tiers |
| **Features** | Top 5 only | 6 feature cards | All features |
| **Tabs** | None | None | Full tabs system |

---

## 🔄 How It Works Technically

### **Stage Detection:**
```typescript
const renderStageSpecificContent = () => {
  switch (product.stage) {
    case 'voting':
      return renderVotingStage();
    case 'coming-soon':
      return renderComingSoonStage();
    case 'community-drops':
      return renderLiveDropsStage();
    default:
      return renderLiveDropsStage(); // Fallback
  }
};
```

### **Render Functions:**
- `renderVotingStage()` - Returns complete JSX for voting layout
- `renderComingSoonStage()` - Returns complete JSX for hype layout  
- `renderLiveDropsStage()` - Returns `null`, uses existing detailed layout

### **Fallback System:**
```typescript
{renderStageSpecificContent() || (
  // Existing layout for live drops
  <div className="grid lg:grid-cols-2 gap-12">
    ...existing content...
  </div>
)}
```

---

## 🧪 Testing Each Stage

### **Test Voting Layout:**
1. Edit a product in `/public/data/products.json`
2. Set `"stage": "voting"`
3. Visit product page
4. **Expected:**
   - Blue theme
   - Large "VOTE" button
   - Simple 2-column layout
   - Vote progress tracker
   - Minimal features

### **Test Coming Soon Layout:**
1. Set `"stage": "coming-soon"`
2. Visit product page
3. **Expected:**
   - Yellow theme
   - Large hero image (3/5 width)
   - "NOTIFY ME" button
   - Launch countdown
   - 6 feature cards grid
   - Full specs section

### **Test Live Drops Layout:**
1. Set `"stage": "community-drops"`
2. Visit product page
3. **Expected:**
   - Green/cyan theme
   - Stock availability section
   - "Add to Cart" button
   - Full tabs (Overview/Reviews/Chat/Specs/Shipping)
   - Order tracking
   - Pricing tiers

---

## 📝 Stage-Specific Content Optimization

### **Voting Stage Content:**
```json
{
  "stage": "voting",
  "description": "Short, compelling pitch",
  "features": ["Top 5 most impressive features"],
  "price": 99.99,  // Estimated
  "votes": 42
}
```

### **Coming Soon Content:**
```json
{
  "stage": "coming-soon",
  "images": ["hero.jpg", "view2.jpg", "view3.jpg"],  // Multiple views
  "features": ["6 key features for cards"],
  "specifications": { "Full": "tech specs" },
  "price": 89.99,  // Expected launch price
  "originalPrice": 129.99  // Shows savings
}
```

### **Live Drops Content:**
```json
{
  "stage": "community-drops",
  "stock": 100,
  "stockAvailable": 58,
  "maxPerGuildMember": 50,
  "pricingTiers": [...],
  "features": ["All features"],
  "specifications": { "Complete": "specs" },
  "reviews": [...]  // User reviews
}
```

---

## ✨ Key Benefits

### **For Users:**
✅ **Voting stage** - Clear, simple interface focused on one action
✅ **Coming soon** - Beautiful showcase builds excitement
✅ **Live drops** - All info needed to make purchase decision

### **For Conversions:**
✅ **Voting** - Maximizes votes with prominent CTA
✅ **Coming soon** - Builds waitlist, reduces drop-off
✅ **Live drops** - Optimized for purchases with full details

### **For User Experience:**
✅ **Progressive disclosure** - Info complexity matches stage
✅ **Stage-appropriate CTAs** - Right action at right time
✅ **Visual consistency** - Color-coded stages are recognizable
✅ **Mobile responsive** - All layouts adapt to small screens

---

## 🚀 Future Enhancements

### **Potential Additions:**

**Voting Stage:**
- Live vote count updates (WebSocket)
- "Invite friends to vote" sharing
- Voter leaderboard
- Vote multipliers for premium tiers

**Coming Soon:**
- Email capture for notifications
- Pre-order reservations
- Countdown timer with hours/minutes
- Teaser videos

**Live Drops:**
- Live stock updates
- Real-time pledge counter
- Flash sale timers
- Quantity selector in modal

---

## 📊 Analytics Opportunities

Track stage-specific metrics:

**Voting:**
- Vote conversion rate
- Time to vote
- Sharing after voting

**Coming Soon:**
- Notification signups
- Time spent viewing
- Gallery interactions

**Live Drops:**
- Add to cart rate
- Stock awareness impact
- Order completion rate

---

## 🎯 Summary

Each product page now **dynamically adapts** to its lifecycle stage:

1. **Voting** → Simple, vote-focused, blue theme
2. **Coming Soon** → Showcase, build hype, yellow theme
3. **Live Drops** → Detailed, purchase-ready, green theme

This creates a **progressive user journey** that matches where the product is in its lifecycle, optimizing for the right action at each stage! 🎉
