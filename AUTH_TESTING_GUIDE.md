# Authentication Testing Guide - December 6, 2025

## 🎯 Goal
Verify the consolidated authentication system works correctly after removing 3 duplicate auth files.

---

## ✅ Server Status

**Dev Server**: ✅ Running at http://localhost:3000  
**Compilation**: ✅ No errors  
**Duplicate Routes**: ✅ FIXED - No warnings!  
**TypeScript**: ✅ No errors  

---

## 📋 AUTHENTICATION TEST CHECKLIST

### Test 1: Registration Flow (NEW USER)

**Steps**:
1. ✅ Open http://localhost:3000
2. ✅ Click "Sign In" or "Register" button in navbar
3. ✅ Click "Don't have an account? Register" link
4. ✅ Fill in registration form:
   - **Email**: `test@migistus.com`
   - **Username**: `testuser123`
   - **Password**: `TestPass123!`
5. ✅ Click "Create Account"

**Expected Results**:
- [ ] Registration successful message appears
- [ ] Automatically logged in
- [ ] Redirected to homepage or account page
- [ ] Username appears in navbar
- [ ] Welcome bonus: 100 guild coins visible
- [ ] New user appears in users.json (check `public/data/users.json`)

**If it fails**: Check browser console for errors, note the error message

---

### Test 2: Logout Flow

**Steps**:
1. ✅ Click on your username/avatar in navbar
2. ✅ Click "Sign Out" button

**Expected Results**:
- [ ] Logged out successfully
- [ ] Navbar shows "Sign In" button again
- [ ] No user data visible
- [ ] Session cleared from localStorage

**Check localStorage** (F12 → Application → Local Storage):
- [ ] `userSession` should be removed
- [ ] `currentUserId` should be removed
- [ ] `migistus_user_registry` should still exist (preserved)

---

### Test 3: Login with Email

**Steps**:
1. ✅ Click "Sign In" button
2. ✅ Enter credentials:
   - **Email or Username**: `test@migistus.com` (email)
   - **Password**: `TestPass123!`
3. ✅ Click "Sign In"

**Expected Results**:
- [ ] Login successful
- [ ] Username appears in navbar
- [ ] Wallet balance shows (should be $0.00)
- [ ] Guild coins show (should be 100)
- [ ] Can navigate to account page

---

### Test 4: Login with Username

**Steps**:
1. ✅ Logout (if logged in)
2. ✅ Click "Sign In" button
3. ✅ Enter credentials:
   - **Email or Username**: `testuser123` (username)
   - **Password**: `TestPass123!`
4. ✅ Click "Sign In"

**Expected Results**:
- [ ] Login successful
- [ ] Same account as before
- [ ] All user data intact (wallet, coins, profile)

---

### Test 5: Session Persistence

**Steps**:
1. ✅ Login (if not logged in)
2. ✅ Refresh the page (F5)
3. ✅ Wait for page to reload

**Expected Results**:
- [ ] Still logged in after refresh
- [ ] Username still in navbar
- [ ] No need to login again
- [ ] User data still available

---

### Test 6: Invalid Login Attempts

**Test 6A: Wrong Password**
1. ✅ Logout
2. ✅ Try login with:
   - Email: `test@migistus.com`
   - Password: `WrongPassword123`
3. ✅ Click "Sign In"

**Expected**: 
- [ ] Error message: "Invalid credentials"
- [ ] Not logged in

**Test 6B: Non-existent Email**
1. ✅ Try login with:
   - Email: `nonexistent@email.com`
   - Password: `anything`
2. ✅ Click "Sign In"

**Expected**:
- [ ] Error message appears
- [ ] Not logged in

---

### Test 7: Duplicate Account Prevention

**Steps**:
1. ✅ Logout
2. ✅ Try to register with same email: `test@migistus.com`
3. ✅ Use different username: `differentuser`
4. ✅ Click "Create Account"

**Expected**:
- [ ] Error: "Email already taken" or similar
- [ ] Registration blocked

**Then try duplicate username**:
1. ✅ Try different email: `new@email.com`
2. ✅ Use same username: `testuser123`
3. ✅ Click "Create Account"

**Expected**:
- [ ] Error: "Username already taken"
- [ ] Registration blocked

---

### Test 8: User Profile & Account Page

**Steps**:
1. ✅ Login (if not logged in)
2. ✅ Click on username in navbar
3. ✅ Click "Account" or "Profile"
4. ✅ Navigate to account page

**Expected Results**:
- [ ] Account page loads
- [ ] Username displays correctly
- [ ] Email displays correctly
- [ ] Wallet balance shows
- [ ] Guild coins show
- [ ] Tier shows (should be "New Member")
- [ ] Join date shows

---

### Test 9: Multi-Tab Sync (Advanced)

**Steps**:
1. ✅ Login in current tab
2. ✅ Open http://localhost:3000 in NEW tab
3. ✅ Check if logged in automatically in new tab
4. ✅ Logout in original tab
5. ✅ Check if logged out in new tab too

**Expected Results**:
- [ ] Login status syncs across tabs
- [ ] Logout syncs across tabs
- [ ] Real-time sync works

---

### Test 10: Admin Access (If Applicable)

**Steps**:
1. ✅ Logout
2. ✅ Try to access http://localhost:3000/kingdom
3. ✅ Should redirect to login or show access denied

**Expected**:
- [ ] Cannot access admin panel without admin account
- [ ] Proper access control working

---

## 🔍 WHAT TO CHECK IN BROWSER

### Console (F12 → Console tab)
**Look for**:
- ❌ Red errors related to AuthContext
- ❌ Warnings about duplicate contexts
- ❌ Import errors
- ✅ Should see: "User logged in successfully" (or similar)
- ✅ Should see: Sync service messages (optional)

### Network Tab (F12 → Network)
**Check these API calls**:
- `POST /api/auth/register` → Should return 201 (success)
- `POST /api/auth/login` → Should return 200 (success)
- `GET /api/users` → Should return user list
- All should complete without 500 errors

### Application Tab (F12 → Application → Local Storage)
**Check these keys**:
- `userSession` - Should contain user data when logged in
- `currentUserId` - Should contain user ID
- `migistus_user_registry` - Should contain all registered users
- `user_{ID}_profile` - Should contain user profile

---

## 📊 TEST RESULTS TEMPLATE

Fill this out as you test:

```
✅ Test 1 - Registration: PASS / FAIL
   Notes: ___________

✅ Test 2 - Logout: PASS / FAIL
   Notes: ___________

✅ Test 3 - Login (Email): PASS / FAIL
   Notes: ___________

✅ Test 4 - Login (Username): PASS / FAIL
   Notes: ___________

✅ Test 5 - Session Persistence: PASS / FAIL
   Notes: ___________

✅ Test 6 - Invalid Logins: PASS / FAIL
   Notes: ___________

✅ Test 7 - Duplicate Prevention: PASS / FAIL
   Notes: ___________

✅ Test 8 - Profile Page: PASS / FAIL
   Notes: ___________

✅ Test 9 - Multi-Tab Sync: PASS / FAIL
   Notes: ___________

✅ Test 10 - Admin Access: PASS / FAIL
   Notes: ___________
```

---

## 🚨 COMMON ISSUES & FIXES

### Issue: "Cannot read property of undefined"
**Likely Cause**: AuthContext not properly imported
**Fix**: Check import is `@/context/AuthContext`

### Issue: Login doesn't work
**Check**: 
1. Console for errors
2. Network tab for API response
3. users.json file exists and is readable

### Issue: Session doesn't persist
**Check**:
1. localStorage is enabled in browser
2. No "Clear storage on reload" enabled
3. Private browsing disabled

### Issue: Duplicate username/email not blocked
**Check**:
1. Console for validation errors
2. Backend API response
3. users.json for duplicate entries

---

## ✅ SUCCESS CRITERIA

**Authentication system is WORKING if**:
- ✅ ALL 10 tests pass
- ✅ No console errors
- ✅ No auth-related warnings
- ✅ Session persists correctly
- ✅ Logout clears session
- ✅ Duplicate prevention works

**If ANY test fails**:
- 📝 Note which test failed
- 📝 Note the error message
- 📝 Screenshot the console
- 🔧 We'll debug and fix it

---

## 🎯 NEXT STEPS AFTER TESTING

### If All Tests Pass ✅
**Congratulations!** Authentication consolidation is successful!

**You can now**:
1. Commit the auth consolidation changes
2. Move to next feature (Wishlist, Enforcement, etc.)
3. Deploy with confidence

### If Tests Fail ❌
**Don't worry!** We'll debug together:

1. Share which test failed
2. Share error messages
3. I'll help fix the issue
4. Re-test

---

## 🔧 DEBUGGING COMMANDS

If you need to check data:

```powershell
# Check users.json
Get-Content public\data\users.json | ConvertFrom-Json

# Check if user was created
(Get-Content public\data\users.json | ConvertFrom-Json).users | Select-Object username, email

# Clear all users (reset)
Set-Content public\data\users.json -Value '{"users":[]}'
```

---

## 📝 READY TO TEST!

**Server is running at**: http://localhost:3000

**Start with Test 1 (Registration)** and work your way through!

**Take your time** - Each test only takes 1-2 minutes.

**Let me know** when you're done testing or if you hit any issues! 🚀

---

**Testing Time Estimate**: 20-30 minutes for all tests
**Priority**: Tests 1-5 are critical, Tests 6-10 are thorough but optional
