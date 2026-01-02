# Beta Access Credentials

## Current Beta Password
```
migistus2026
```

## How to Change the Password

1. Open the file: `src/pages/beta-access.tsx`
2. Find line 24: `const BETA_PASSWORD = 'migistus2026';`
3. Replace `'migistus2026'` with your new password
4. Save the file

## How to Disable Beta Mode

When ready to launch publicly:

1. Open `src/pages/_app.tsx`
2. Remove the `<BetaGuard>` wrapper (lines with `<BetaGuard>` and `</BetaGuard>`)
3. Remove the import: `import BetaGuard from "@/components/BetaGuard";`

**Before:**
```tsx
<BetaGuard>
  <AuthProvider>
    ...
  </AuthProvider>
</BetaGuard>
```

**After:**
```tsx
<AuthProvider>
  ...
</AuthProvider>
```

## Beta Access URL
https://yourdomain.com/beta-access

## Notes
- Beta authentication uses localStorage
- Users must enter password once per browser
- Clearing browser data will require re-authentication
- Password is checked client-side (suitable for beta testing, not production security)

## Testing
1. Visit any page on the site
2. You'll be redirected to `/beta-access`
3. Enter password: `migistus2026`
4. Click "Enter MIGISTUS"
5. You'll be redirected to homepage with full access

---
**⚠️ IMPORTANT: Do not commit this file to public repositories!**
Add `BETA_ACCESS_CREDENTIALS.md` to your `.gitignore` file.
