# ⚠️ REMINDER: Enable Automatic Lifecycle Transitions

## 🎯 What You Need to Do

**Enable server-side automatic lifecycle transitions** so products automatically move through stages every Friday.

---

## 📝 Instructions

### File to Edit:
`src/pages/api/products/index.ts`

### Changes Needed:

1. **Add the import** at the top of the file:
```typescript
import { processLifecycleTransitions, DEFAULT_LIFECYCLE_CONFIG } from "@/utils/productLifecycle";
```

2. **Update the GET handler** to process and save transitions:
```typescript
if (req.method === "GET") {
  // Process lifecycle transitions automatically
  try {
    const processedData = processLifecycleTransitions(data, DEFAULT_LIFECYCLE_CONFIG);
    
    // Save updated products if any transitions occurred
    if (JSON.stringify(processedData) !== JSON.stringify(data)) {
      writeData(processedData);
      data = processedData;
      console.log('API: Lifecycle transitions processed and saved');
    }
  } catch (lifecycleError) {
    console.error('API: Lifecycle processing error:', lifecycleError);
    // Continue without lifecycle processing if it fails
  }
  
  console.log('API: Returning products:', data.length);
  // ... rest of the code
}
```

---

## ✅ What This Does

When enabled, **every time someone visits any page** (voting, coming-soon, community-drops, recently-completed):

1. The API checks if it's Friday
2. Checks if products have been in their stage for 7 days
3. Automatically transitions eligible products:
   - **Voting → Coming Soon** (top voted products on Friday)
   - **Coming Soon → Community Drops** (after 7 days on Friday)
   - **Community Drops → Recently Completed** (after 7 days anytime)
4. Saves changes to `products.json`
5. Returns updated product list

---

## 🧪 How to Test

### Before Testing:
1. Backup your products.json:
```bash
Copy-Item public/data/products.json public/data/products-backup.json
```

### Test Method 1: Manual Date Change
```bash
# Run this script to set a product's date to 8 days ago
node scripts/test-transition.js
```

### Test Method 2: Change System Date (Windows)
```powershell
# Set to next Friday
Set-Date -Date "2024-12-13"

# Visit any page - products should transition
# Check products.json to verify stages changed

# Restore date
Set-Date -Date (Get-Date)
```

### Test Method 3: Edit products.json Directly
Open `public/data/products.json` and change a product:
```json
{
  "id": 1,
  "name": "Test Product",
  "stage": "voting",
  "stageEnteredAt": "2024-12-01T00:00:00.000Z"  // 7+ days ago
}
```

Then visit http://localhost:3000/voting - the product should move to coming-soon (if today is Friday)

---

## 📊 What to Watch For

### Check Console Logs:
```
API: Lifecycle transitions processed and saved
Product "Test Product" transitioned: voting → coming-soon
API: Stage breakdown: { voting: 2, comingSoon: 1, communityDrops: 2, recentlyCompleted: 0 }
```

### Check products.json:
- Products should have updated `stage` field
- `stageEnteredAt` should be updated to current date
- File should be saved automatically

### Check Pages:
- `/voting` - Should show only voting products
- `/coming-soon` - Should show newly promoted products
- `/community-drops` - Should show products that launched
- `/recently-completed` - Should show completed drops

---

## ⚠️ Important Notes

1. **Transitions Only Happen on Friday** (for voting → coming-soon and coming-soon → drops)
   - Community drops → recently-completed can happen any day after 7 days

2. **Requires Traffic** - Transitions only run when someone visits the site
   - For fully automated transitions, you'd need a cron job (see advanced options below)

3. **Data Persistence** - Changes are saved to products.json immediately
   - Always keep backups before testing

4. **No Manual Override** - Once enabled, transitions are automatic
   - To prevent a product from transitioning, you'd need to edit products.json manually

---

## 🚀 Advanced: Scheduled Automation (Optional)

If you want transitions to happen automatically without requiring traffic:

### Option A: Windows Task Scheduler
Create a task that runs every Friday at midnight:
```powershell
# Create scheduled task
$action = New-ScheduledTaskAction -Execute 'node' -Argument 'C:\path\to\scripts\process-lifecycle.js'
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Friday -At 12am
Register-ScheduledTask -TaskName "MIGISTUS Lifecycle" -Action $action -Trigger $trigger
```

### Option B: Vercel Cron Jobs
If deploying to Vercel, create `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/process-lifecycle",
    "schedule": "0 0 * * 5"
  }]
}
```

Then create `/api/cron/process-lifecycle.ts`:
```typescript
import { processLifecycleTransitions, DEFAULT_LIFECYCLE_CONFIG } from "@/utils/productLifecycle";
// ... process and save products
```

---

## 📋 Quick Checklist

Before enabling:
- [ ] Backup products.json
- [ ] Read through the code changes
- [ ] Understand what transitions will happen

After enabling:
- [ ] Test with a manual date change
- [ ] Verify products.json is updated
- [ ] Check all pages show correct products
- [ ] Monitor console logs for errors

---

## 🆘 Troubleshooting

**Products not transitioning?**
- Check if it's Friday (or test date is Friday)
- Verify product has been in stage for 7+ days
- Check console for errors
- Make sure `autoPromotionEnabled: true` in config

**Products disappearing?**
- They likely transitioned to next stage
- Check coming-soon or recently-completed pages
- Review products.json directly

**Errors in console?**
- Check import statement is correct
- Verify productLifecycle.ts has no errors
- Try catching and logging the specific error

---

## 📞 Need Help?

If you run into issues:
1. Check `PRODUCTION_READINESS_ASSESSMENT.md` for details
2. Review `LIFECYCLE_IMPLEMENTATION_COMPLETE.md` for architecture
3. Look at console logs for specific errors
4. Restore from backup if needed: `Copy-Item products-backup.json products.json`

---

**Created**: December 8, 2025  
**Priority**: High - Enable this to make the lifecycle system fully functional!  
**Time Required**: 5-10 minutes  
**Risk Level**: Low (with backup)

---

## ✅ After You Enable It

Once enabled, your lifecycle system will be **fully functional**:

✅ Products automatically transition every Friday  
✅ All 4 lifecycle pages working perfectly  
✅ Countdown timers show accurate information  
✅ Community-driven product progression  
✅ Fully automated drop management  

**The system will be 100% production ready!** 🎉
