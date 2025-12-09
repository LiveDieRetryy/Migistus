# 🔄 Lifecycle Control Center - Complete Guide

## Overview

The **Lifecycle Control Center** is the unified admin command center for managing the complete product lifecycle across all 4 stages:

1. **🗳️ Voting** - Community votes on products (7 days)
2. **⏰ Coming Soon** - Top voted products prepare for launch (7 days)
3. **🔴 Community Drops** - Live group buy drops (7 days)
4. **📦 Recently Completed** - Archived fulfilled drops (permanent)

This single page **replaces and consolidates** the old separate admin pages:
- ❌ `/admin/voting` (removed)
- ❌ `/admin/live-drops` (removed)
- ❌ `/kingdom/voting` (removed)
- ❌ `/kingdom/live-drops` (removed)
- ✅ `/admin/lifecycle` (NEW - all-in-one control)

---

## What Was Changed

### Navigation Updates

#### 1. Main Navbar (User Menu)
**Before:**
```
Kings Domain → /kingdom
Voting Control → /kingdom/voting
Live Drops Control → /kingdom/live-drops
Product Control → /kingdom/products
```

**After:**
```
Kings Domain → /admin
🔄 Lifecycle Control → /admin/lifecycle (NEW)
Product Control → /admin/products
```

#### 2. Admin Dashboard
**Before:**
- Voting Control card
- Live Drops Control card
- 8 separate admin modules

**After:**
- **Lifecycle Control Center** (featured with ⭐ NEW badge)
- 6 streamlined admin modules
- Removed redundant voting/drops pages

#### 3. Admin Top Nav
**Before:**
```
Dashboard | Product Pool | Moderation | Tiers | Voting | Refunds
```

**After:**
```
Dashboard | 🔄 Lifecycle Control | Product Pool | Moderation | Tiers | Refunds
```

---

## Features

### 📊 Real-Time Dashboard

**Overall Statistics:**
- Live product counts per stage
- Total votes across all products
- Total pledges and fulfillment tracking
- "Ready to transition" indicators

**Visual Flow Diagram:**
```
🗳️ Voting → ⏰ Coming Soon → 🔴 Live Drops → 📦 Completed
7 days       7 days          7 days        Archived
```

### ⚡ One-Click Controls

#### Automatic Processing
- **Run Lifecycle Process** button triggers immediate transition check
- Processes all products and moves eligible ones to next stage
- Saves changes automatically to backend
- Shows success/error messages

#### Manual Transitions
Each product card has instant action buttons:
- **← Voting** - Move back to voting stage
- **Coming Soon** - Move to coming soon stage
- **Live →** - Promote to live drops
- **Archive** - Move to completed archive
- **🗑️** - Delete product entirely

### 🎯 Stage Filtering

Click any stage button to filter products:
- **🗳️ Voting** (purple theme)
- **⏰ Coming Soon** (blue theme)
- **🔴 Live Drops** (green theme)
- **📦 Completed** (gray theme)

Each shows:
- Product count in stage
- Vote/pledge statistics
- Days in current stage
- "Ready to advance" indicators

### ⚙️ Automation Settings

**Enabled by Default:**
- ✅ Auto-transitions run on every API request
- ✅ Friday-only transitions (predictable schedule)
- ✅ 7-day cycles per stage
- ✅ Automatic data persistence

**Configuration Panel Shows:**
- Current automation status
- Stage durations (7 days each)
- Next Friday transition date
- Total products in system

---

## Product Lifecycle Status

Each product displays rich status information:

### Status Indicators

**⚡ Ready to Advance**
- Product has been in stage for 7+ days
- It's currently Friday
- Will auto-transition on next API call

**Days in Stage**
- Shows how long product has been in current stage
- Updates in real-time
- Color-coded by urgency

### Product Card Information

Each product shows:
- **Name** - Product title
- **Votes** - 🗳️ Total community votes received
- **Pledges** - 🤝 Number of pledges/backers
- **Days Until Transition** - 📅 Countdown to next Friday
- **Status Message** - 💡 Contextual guidance (e.g., "Needs 3 more days in voting")

---

## How Automatic Transitions Work

### Trigger Points

1. **API Request** - Any time products API is called
2. **Friday Check** - System verifies it's Friday
3. **Duration Check** - Verifies product has been in stage 7+ days
4. **Auto-Advance** - Eligible products move to next stage
5. **Save** - Changes persist to `products.json`

### Transition Rules

**Voting → Coming Soon:**
- ✅ Must be Friday
- ✅ Must have been voting for 7+ days
- ❌ No vote threshold required
- 📊 Top voted products advance

**Coming Soon → Community Drops:**
- ✅ Must be Friday
- ✅ Must have been coming-soon for 7+ days
- 🚀 Products launch as live drops

**Community Drops → Recently Completed:**
- ✅ Must be Friday
- ✅ Must have been live for 7+ days
- 📦 Products archive with full stats

### Console Logging

When transitions occur, you'll see:
```
✅ API: Lifecycle transitions processed and saved
  → Product "Gaming Headset" transitioned: voting → coming-soon
  → Product "LED Headlamp" transitioned: voting → coming-soon
```

---

## Admin Workflows

### Workflow 1: Launching a New Drop

1. Add product to system (starts in "voting" by default)
2. Product stays in voting for 7 days
3. On Friday, top products auto-advance to "coming-soon"
4. After 7 more days (next Friday), product goes live
5. After 7 final days (third Friday), drop completes and archives

**Total Time:** 21 days (3 weeks)

### Workflow 2: Emergency Product Control

**Scenario:** Need to immediately launch a product

1. Go to Lifecycle Control Center
2. Find product in any stage
3. Click **Live →** button
4. Product instantly moves to community-drops
5. Starts 7-day countdown from now

**Scenario:** Need to pause a drop

1. Find product in community-drops
2. Click **← Voting** to move back
3. Product returns to voting with reset timer
4. Will go through full cycle again

### Workflow 3: Bulk Management

**Run Lifecycle Process:**
1. Click **⚡ Run Lifecycle Process** button
2. System checks ALL products
3. Moves ALL eligible products to next stages
4. Shows count: "Processed 5 products, 3 transitions made"

**Review Before Friday:**
1. Check each stage's "ready to transition" count
2. Manually adjust products if needed
3. Let automation handle Friday transitions

### Workflow 4: Monitoring Live Drops

1. Click **🔴 Live Drops** stage filter
2. See all active drops with pledge counts
3. Check days remaining (countdown to Friday)
4. Monitor which will complete this Friday

---

## Comparison: Old vs New

### Old System (3 Separate Pages)

**Voting Control (`/admin/voting`):**
- Only saw voting stage products
- Separate controls
- No lifecycle visibility
- Manual advancement needed

**Live Drops Control (`/admin/live-drops`):**
- Only saw live drops
- No coming-soon preview
- Separate pledge management
- Disconnected from voting

**Coming Soon:**
- No admin page existed
- Products moved manually
- No automation

### New System (Unified Lifecycle Control)

**Single Page (`/admin/lifecycle`):**
- ✅ See ALL 4 stages in one place
- ✅ Visual flow diagram shows progression
- ✅ One-click transitions between any stages
- ✅ Automatic Friday processing
- ✅ Complete lifecycle visibility
- ✅ Real-time stats across all stages
- ✅ Unified manual override controls

---

## UI Components Breakdown

### Header Section
- **Title:** Gradient "Lifecycle Control Center"
- **Subtitle:** Full lifecycle flow description
- **Primary Action:** "Run Lifecycle Process" button with loading state
- **Message Bar:** Success/error notifications

### Statistics Grid (4 Cards)

**🗳️ Voting Card (Purple)**
- Product count
- Total votes
- "Ready to transition" count

**⏰ Coming Soon Card (Blue)**
- Product count
- Total votes
- Ready count

**🔴 Live Drops Card (Green)**
- Product count
- Total pledges
- Ready count

**📦 Completed Card (Gray)**
- Product count
- Total fulfilled pledges

### Stage Selector
- 4 large buttons (one per stage)
- Shows count in each stage
- Active button highlighted with ring
- Filters product list below

### Automation Panel
- Checkbox to enable/disable auto-transitions
- 3 cards showing stage durations
- System status indicators

### Products List
- Filtered by selected stage
- Each product = 1 card
- Status badges (ready/days in stage)
- Vote and pledge counts
- Manual transition buttons
- Delete button

### Lifecycle Flow Diagram
- 4 boxes showing stages
- Arrows between stages
- Product counts in each
- Duration labels

### System Information
- Auto-transitions status
- Next Friday date
- Stage durations
- Total product count

---

## Technical Implementation

### Data Sources

**Products API** (`/api/products`)
- Returns all products with stage info
- Runs lifecycle processing on GET
- Saves transitions automatically

**Votes API** (`/api/votes`)
- Vote counts per product
- Used for sorting top products

**Pledges API** (`/api/pledges`)
- Pledge counts per product
- Tracks backer statistics

### State Management

```typescript
const [products, setProducts] = useState<Product[]>([]);
const [votes, setVotes] = useState<any[]>([]);
const [pledges, setPledges] = useState<any[]>([]);
const [selectedStage, setSelectedStage] = useState<LifecycleStage>('voting');
const [stats, setStats] = useState<Record<LifecycleStage, StageStats>>(...);
```

### Key Functions

**loadData()** - Fetches products, votes, pledges from APIs

**calculateStats()** - Aggregates stats per stage

**runLifecycleProcessing()** - Triggers lifecycle transitions manually

**manualTransition()** - Moves product to specific stage

**deleteProduct()** - Removes product entirely

---

## Access Control

**Who Can Access:**
- ✅ Admin users only (`admin@migistus.com`)
- ❌ Regular users see access denied page

**How to Access:**
1. Login as admin
2. Click account menu in navbar
3. Select "👑 Kings Domain" or "🔄 Lifecycle Control"
4. OR navigate to `/admin/lifecycle` directly

---

## Benefits of Consolidation

### Before: Fragmented Control
- 3 separate pages to manage
- No visibility into full lifecycle
- Manual coordination needed
- Prone to errors and missed transitions
- Confusing navigation structure

### After: Unified Control Center
- ✅ **Single source of truth** for entire lifecycle
- ✅ **Visual workflow** makes it clear how products progress
- ✅ **Automatic transitions** reduce manual work
- ✅ **One-click overrides** for emergency control
- ✅ **Real-time stats** show system health at a glance
- ✅ **Simplified navigation** - one featured admin module

---

## Future Enhancements

### Planned Features
- 📅 **Transition History** - Log of all stage changes
- 🔔 **Notifications** - Alert when products transition
- 📈 **Analytics Charts** - Visual graphs of lifecycle metrics
- ⏰ **Scheduled Actions** - Pre-schedule manual transitions
- 🎯 **Batch Operations** - Select multiple products, transition all at once
- 🔍 **Advanced Filters** - Filter by votes, pledges, date ranges
- 📊 **Export Reports** - Download lifecycle data as CSV/JSON

### Advanced Automation
- **Cron Jobs** - Server-side scheduled transitions (no traffic needed)
- **Webhooks** - Notify external systems on stage changes
- **Custom Rules** - Set vote thresholds, custom durations per product
- **A/B Testing** - Different lifecycle configs for different products

---

## Troubleshooting

### Products Not Transitioning

**Check:**
1. Is it Friday? (Transitions only happen on Fridays)
2. Has product been in stage for 7+ days?
3. Is auto-transitions enabled?
4. Check browser console for error logs

**Solution:**
- Use **Run Lifecycle Process** button to force check
- Manually transition using stage buttons
- Check `products.json` to verify `stageEnteredAt` dates

### Manual Transition Not Saving

**Check:**
1. Are you logged in as admin?
2. Is `/api/products` endpoint working?
3. Check network tab for failed PUT request

**Solution:**
- Refresh page and try again
- Check browser console for errors
- Verify `public/data/products.json` file permissions

### Stats Not Updating

**Solution:**
- Click "Run Lifecycle Process" to recalculate
- Refresh the page
- Check that votes.json and pledges.json exist

---

## Summary

The **Lifecycle Control Center** is now the **single admin page** for managing the entire product lifecycle from voting to archive. It consolidates 3 old pages into one powerful interface with:

- ✅ Full 4-stage visibility
- ✅ Automatic Friday transitions
- ✅ Manual override controls
- ✅ Real-time statistics
- ✅ Visual workflow diagram
- ✅ One-click product management

**Old Navigation Removed:**
- `/admin/voting` ❌
- `/admin/live-drops` ❌
- `/kingdom/voting` ❌
- `/kingdom/live-drops` ❌

**New Navigation Added:**
- `/admin/lifecycle` ✅ (Featured with ⭐ NEW badge)

**Result:** Simpler, faster, more powerful product lifecycle management! 🎉
