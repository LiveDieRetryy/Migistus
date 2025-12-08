# Authentication Consolidation Plan

## Current State Analysis

### ✅ Files Using CORRECT Auth (`@/context/AuthContext`)
**Total: 27 files** - These are already correct!

**Pages (19 files)**:
- src/pages/_app.tsx (AuthProvider)
- src/pages/wallet.tsx
- src/pages/staff-picks.tsx
- src/pages/products/[slug].tsx
- src/pages/community/social.tsx
- src/pages/community/index.tsx
- src/pages/account.tsx
- src/pages/account/settings.tsx
- src/pages/account/pledges.tsx
- src/pages/account/profile/index.tsx
- src/pages/account/profile/[slug].tsx
- src/pages/admin/* (10 admin pages)

**Components (8 files)**:
- src/components/nav/MainNavbar.tsx
- src/components/social/CreatePost.tsx
- src/components/social/PostCard.tsx
- src/components/FollowButton.tsx
- src/components/FollowersModal.tsx

### ❌ Files Using WRONG Auth (`@/lib/auth`)
**Total: 1 file** - Needs to be updated!

- src/components/voting/VotingBoard.tsx

### 📦 Auth Provider Files

1. **✅ KEEP**: `src/context/AuthContext.tsx`
   - 500+ lines
   - Full implementation with UserStorage integration
   - Real-time sync support
   - Session management
   - User registry
   - THIS IS THE SOURCE OF TRUTH

2. **❌ REMOVE**: `src/components/context/AuthContext.tsx`
   - Only 30 lines
   - Basic stub implementation
   - Not used by any files

3. **❌ REMOVE**: `src/lib/auth.tsx`
   - Used by 1 file only (VotingBoard)
   - Incomplete implementation
   - Conflicts with main auth

4. **⚠️ REVIEW**: `src/providers/AuthProvider.tsx`
   - Imports from main AuthContext
   - May be wrapper for specific use case
   - Check if actually used

---

## Execution Plan

### Phase 1: Fix VotingBoard Import (5 minutes)
✅ Update `src/components/voting/VotingBoard.tsx` to use `@/context/AuthContext`

### Phase 2: Check AuthProvider Usage (5 minutes)
✅ Search for imports of `@/providers/AuthProvider`
✅ Determine if it's actually used or safe to delete

### Phase 3: Delete Duplicate Auth Files (5 minutes)
✅ Delete `src/components/context/AuthContext.tsx`
✅ Delete `src/lib/auth.tsx`
✅ Delete `src/providers/AuthProvider.tsx` (if not used)

### Phase 4: Fix Duplicate Route (2 minutes)
✅ Verify no files import from `account/profile.tsx`
✅ Delete `src/pages/account/profile.tsx` (keep index.tsx)

### Phase 5: Verification (10 minutes)
✅ Check for TypeScript errors
✅ Test dev server starts clean
✅ Test login flow
✅ Test registration flow
✅ Verify no duplicate route warning

---

## Risk Assessment

**Risk Level**: 🟢 LOW

**Why Safe**:
- 27/28 files already use correct auth
- Only 1 file needs update
- Duplicate files not actively used
- Can easily rollback if issues

**Backup Plan**:
- Git commit before changes
- Can restore deleted files if needed

---

## Expected Outcome

### Before:
- ❌ 4 different auth implementations
- ❌ Duplicate route warning
- ❌ 1 file using wrong auth
- ❌ Confusing for developers

### After:
- ✅ 1 single auth source of truth
- ✅ No duplicate routes
- ✅ All files using same auth
- ✅ Clean, maintainable codebase

---

## Time Estimate
**Total: 20-30 minutes**

---

**Ready to execute?**
