# Email Verification Database Migration

## Database Table Required for Production

The email verification system now supports both file-based (development) and database (production) storage. When deploying to production with a PostgreSQL database, you need to create the `verification_tokens` table.

## SQL Migration

Run this SQL in your Vercel Postgres database:

```sql
-- Create verification_tokens table
CREATE TABLE IF NOT EXISTS verification_tokens (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_verification_tokens_code ON verification_tokens(code);
CREATE INDEX idx_verification_tokens_email ON verification_tokens(email);
CREATE INDEX idx_verification_tokens_expires_at ON verification_tokens(expires_at);

-- Update users table to include email verification status if not already present
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;
```

## Automatic Cleanup

The system includes a cleanup function `db.cleanupExpiredTokens()` that can be called periodically to remove expired and used tokens. Consider running this:

1. Via a cron job in Vercel
2. At application startup
3. Before creating new tokens

## Database Functions Added

The following functions were added to `src/lib/db.ts`:

### Verification Token Management
- `createVerificationToken(email, code, expiresAt)` - Store new 6-digit verification code
- `getVerificationToken(code)` - Retrieve token details by code
- `markTokenAsUsed(code)` - Mark code as used after successful verification
- `cleanupExpiredTokens()` - Remove expired/used tokens

### User Verification
- `markUserAsVerified(email)` - Set user's email_verified and verified flags to true

## Environment Detection

The system automatically detects the environment:

- **Production** (`VERCEL_ENV=production` or `NODE_ENV=production`):
  - Uses PostgreSQL database for all operations
  - Falls back to file-based storage if database fails
  
- **Development**:
  - Uses file-based storage (`public/data/verification-tokens.json`)
  - No database connection required

## Testing in Production

1. Deploy the updated code to Vercel
2. Run the SQL migration in Vercel Postgres dashboard
3. Register a new user
4. Check database: `SELECT * FROM verification_tokens ORDER BY created_at DESC LIMIT 5;`
5. Verify the 6-digit code via email
6. Check user status: `SELECT email, email_verified, verified FROM users WHERE email = 'test@example.com';`

## Code Changes Summary

### Updated Files
1. **src/lib/db.ts** - Added verification token and user verification functions
2. **src/pages/api/auth/register.ts** - Uses database in production for token storage
3. **src/pages/api/auth/verify-email.ts** - Uses database in production for verification

### Key Features
- ✅ 6-digit verification codes
- ✅ 1-hour expiration
- ✅ Single-use tokens
- ✅ Production/development environment detection
- ✅ Automatic fallback to file storage on database errors
- ✅ Professional email templates
- ✅ Inline verification flow

## Monitoring

Check production logs for:
- `🔐 Production mode: Storing verification token in database`
- `✅ Verification token stored in database`
- `✅ User verified in database`

If you see fallback messages:
- `❌ Database error, falling back to file storage`

This indicates a database connection issue that needs investigation.
