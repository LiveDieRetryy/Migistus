# Session & Online Status System

## Overview
The MIGISTUS platform now uses **database-backed session management** for both development and production. This ensures proper tracking of user sessions, online status, and activity across the platform.

## Database Schema

### Sessions Table
```sql
CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) UNIQUE NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  current_page VARCHAR(500),
  is_invisible BOOLEAN DEFAULT false
);
```

**Key Fields:**
- `session_id`: Unique session token stored in HTTP-only cookie
- `last_active`: Updated every 30 seconds via heartbeat
- `is_active`: Marks if session is currently active
- `is_invisible`: User's invisibility mode preference
- `current_page`: Tracks which page the user is currently viewing

## Architecture

### 1. Session Management (`src/lib/session.ts`)
- **Development**: File-based storage (`public/data/sessions.json`)
- **Production**: PostgreSQL database via Vercel Postgres
- Automatic environment detection
- 30-day session duration
- HTTP-only secure cookies

### 2. Online Status Tracking
Users are considered **online** if:
- They have an active session (`is_active = true`)
- Session hasn't expired (`expires_at > now`)
- Activity within last 5 minutes (`last_active > now - 5 minutes`)
- Not in invisible mode (unless `ignoreInvisible = true`)

### 3. Heartbeat System

**Client-Side Hook** (`src/hooks/useSessionHeartbeat.ts`):
```typescript
useSessionHeartbeat(isAuthenticated)
```
- Sends heartbeat every 30 seconds
- Updates on page navigation
- Tracks current page
- Non-blocking (silent failures)

**Server-Side Endpoint** (`/api/sessions/heartbeat`):
- Updates `last_active` timestamp
- Updates `current_page` field
- Returns online status confirmation

### 4. API Endpoints

#### `/api/sessions/heartbeat` (POST)
Updates session activity for the authenticated user.
```typescript
POST /api/sessions/heartbeat
Body: { currentPage: string }
Response: { success: boolean, userId: number, lastActive: string }
```

#### `/api/users/online` (GET)
Check user online status or get all online users.
```typescript
// Check specific user
GET /api/users/online?userId=123&ignoreInvisible=false

// Get all online users
GET /api/users/online
Response: { count: number, users: Array }
```

## Component Integration

### OnlineStatus Component
```tsx
<OnlineStatus 
  userId={user.id} 
  showText={true} 
  size="md" 
/>
```
- Real-time online/offline indicator
- Automatic polling every 30 seconds
- Green pulsing dot for online users
- Respects invisibility mode

### Usage in AuthContext
```tsx
export function AuthProvider({ children }) {
  const [user, setUser] = useState<User | null>(null);
  
  // Automatically sends heartbeats when user is authenticated
  useSessionHeartbeat(!!user);
  
  // ... rest of auth logic
}
```

## Database Functions

### Session Functions (`src/lib/db.ts`)
```typescript
// Update session activity (called by heartbeat)
await db.updateSessionActivity(userId, currentPage);

// Check if user is online
const isOnline = await db.isUserOnline(userId, ignoreInvisible);

// Get all online users (excludes invisible)
const onlineUsers = await db.getOnlineUsers();

// Toggle invisibility mode
await db.updateSessionVisibility(userId, isInvisible);
```

## Migration Notes

### What Changed
1. ❌ **Removed**: `public/data/user-sessions.json` file storage
2. ✅ **Added**: Database-backed session storage
3. ✅ **Added**: Automatic heartbeat system
4. ✅ **Added**: Real-time online status tracking
5. ✅ **Added**: Per-session invisibility mode

### Development vs Production
- **Development**: Uses file-based storage for simplicity
- **Production**: Uses PostgreSQL via Vercel Postgres
- Same API interface for both environments
- Automatic environment detection

## Setup Instructions

### 1. Update Database Schema
Run the following in your Vercel Postgres dashboard:
```sql
-- Add new columns to sessions table
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS current_page VARCHAR(500),
ADD COLUMN IF NOT EXISTS is_invisible BOOLEAN DEFAULT false;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_last_active ON sessions(last_active);
CREATE INDEX IF NOT EXISTS idx_sessions_is_active ON sessions(is_active);
```

### 2. Update Environment Variables
Ensure you have Vercel Postgres configured:
```env
POSTGRES_URL="..."
POSTGRES_PRISMA_URL="..."
POSTGRES_URL_NON_POOLING="..."
```

### 3. Deploy Updates
```bash
# Build and test locally
npm run build

# Deploy to Vercel
git push origin main
```

## Monitoring & Debugging

### Check Online Users
```typescript
// In development
const sessions = require('./public/data/sessions.json');
console.log(Object.values(sessions).filter(s => s.expiresAt > Date.now()));

// In production (via database)
SELECT u.username, s.last_active, s.current_page
FROM sessions s
JOIN users u ON s.user_id = u.id
WHERE s.is_active = true 
  AND s.expires_at > NOW()
  AND s.last_active > NOW() - INTERVAL '5 minutes';
```

### Session Cleanup
Expired sessions are automatically cleaned up:
- On session check operations
- Can manually trigger: `await db.cleanupExpiredSessions()`

## Security Considerations

1. **HTTP-Only Cookies**: Session tokens never accessible via JavaScript
2. **Secure Flag**: Cookies only sent over HTTPS in production
3. **SameSite**: Prevents CSRF attacks
4. **Token Rotation**: Sessions expire after 30 days
5. **Activity Tracking**: Detects inactive sessions

## Performance Optimization

1. **Indexes**: Added on `last_active`, `is_active`, `user_id`
2. **Heartbeat Batching**: Only sends every 30 seconds
3. **Silent Failures**: Heartbeat failures don't block UI
4. **Polling Optimization**: OnlineStatus polls every 30 seconds
5. **Database Queries**: Optimized joins and WHERE clauses

## Future Enhancements

- [ ] Session analytics dashboard
- [ ] Multi-device session management
- [ ] Activity heatmaps
- [ ] Session revocation/logout all devices
- [ ] Geo-location tracking
- [ ] Browser/device fingerprinting
