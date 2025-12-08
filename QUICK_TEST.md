# 🧪 Quick Testing Reference

## ✅ Server Running
- **URL**: http://localhost:3000
- **Status**: Ready for testing
- **No Errors**: Clean startup!

---

## 📝 Quick Test (5 minutes)

### 1️⃣ Register (2 min)
1. Click "Sign In" or "Register"
2. Enter:
   - Email: `test@migistus.com`
   - Username: `testuser123`
   - Password: `TestPass123!`
3. Click "Create Account"
4. ✅ Should see welcome + 100 coins

### 2️⃣ Logout (30 sec)
1. Click username in navbar
2. Click "Sign Out"
3. ✅ Should show "Sign In" button

### 3️⃣ Login with Email (1 min)
1. Click "Sign In"
2. Enter: `test@migistus.com` + password
3. ✅ Should login successfully

### 4️⃣ Login with Username (1 min)
1. Logout
2. Click "Sign In"
3. Enter: `testuser123` + password
4. ✅ Should login successfully

### 5️⃣ Page Refresh (30 sec)
1. Press F5 while logged in
2. ✅ Should stay logged in

---

## 🎯 Success = All 5 tests pass!

**Full detailed guide**: See `AUTH_TESTING_GUIDE.md`

---

## 🚨 If Something Breaks

Press F12 → Console tab → Look for red errors

**Common Issues**:
- Red errors about AuthContext → Tell me
- Login doesn't work → Check Network tab
- Page crashes → Share error message

---

## ✅ When Done

Tell me:
- "All tests passed!" ✅
- OR "Test #X failed, here's the error..." ❌

Then we either:
- ✅ Move to next feature (Wishlist/Enforcement)
- ❌ Debug and fix the issue

---

**Ready? Start testing!** 🚀
