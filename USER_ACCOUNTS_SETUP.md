# User Accounts Setup - January 7, 2025

## ✅ Accounts Created

### 1. Admin Account
- **Username**: `Admin`
- **Email**: `admin@migistus.com`
- **Password**: `Admin`
- **Tier**: Admin
- **Wallet**: 100,000 coins
- **Purpose**: Full system administration access

### 2. Travis Account
- **Username**: `TravisHelmick`
- **Email**: `Travishelmick5@gmail.com`
- **Password**: `TravisPassword123`
- **Tier**: New Member
- **Guild Coins**: 100 (welcome bonus)
- **Purpose**: Your personal account

## 🔐 Login Options

Both accounts support **dual login**:
- Login with **username** OR **email**
- Password is case-sensitive

### Examples:
```
Admin login:
  - Username: Admin + Password: Admin
  - OR Email: admin@migistus.com + Password: Admin

Travis login:
  - Username: TravisHelmick + Password: TravisPassword123
  - OR Email: Travishelmick5@gmail.com + Password: TravisPassword123
```

## 🛠️ Technical Implementation

### Password Security
- All passwords are hashed using bcrypt (10 rounds)
- Never stored in plain text
- Admin hash: `$2a$10$qo/zWzAh6w10fY4y08a36u...`
- Travis hash: `$2a$10$2gkc7KUJRXlXjSXADttrx...`

### Login Endpoint Logic
File: `src/pages/api/auth/login.ts` (lines 71-73)
```typescript
const userIndex = users.findIndex((u: any) => 
  u.email?.toLowerCase() === email.toLowerCase() || 
  u.username?.toLowerCase() === email.toLowerCase()
);
```

This allows case-insensitive login with either username or email.

### Data Storage
- Location: `public/data/users.json`
- Structure: `{ users: [...], totalUsers: 2, lastUpdated: "..." }`
- Both accounts are now persisted to the backend

## 📝 Next Steps

1. **Test Admin Login**
   - Go to http://localhost:3000
   - Click "Sign In"
   - Try: `Admin` / `Admin`
   - Verify access to Kingdom (admin panel)

2. **Test Your Account**
   - Logout if logged in as admin
   - Try: `TravisHelmick` / `TravisPassword123`
   - OR: `Travishelmick5@gmail.com` / `TravisPassword123`
   - Both should work

3. **Test Username vs Email**
   - Try logging in with username
   - Logout
   - Try logging in with email
   - Both should authenticate successfully

## ⚠️ Important Notes

- The registration system is now working properly
- New registrations will automatically save to `users.json`
- Username login was already supported in the code, just needed users in the database
- Admin account has full privileges (tier: "Admin")
- Your account can be upgraded to any tier by editing `users.json`

## 🎯 Status: READY TO TEST

Both accounts are active and ready for authentication testing!
