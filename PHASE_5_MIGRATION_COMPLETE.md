# Phase 5: Admin Features, Analytics & Moderation - Migration Complete ✅

## Overview
Phase 5 establishes comprehensive admin tools, audit logging, moderation systems, analytics tracking, and system settings management with dual-mode storage (file-based for development, PostgreSQL for production).

## Database Schema

### New Tables Created

#### 1. admin_audit_logs
Tracks all administrative actions for security and compliance.

```sql
CREATE TABLE admin_audit_logs (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50),
  target_id INTEGER,
  details JSONB DEFAULT '{}',
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_admin ON admin_audit_logs(admin_id);
CREATE INDEX idx_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX idx_audit_logs_created ON admin_audit_logs(created_at);
```

#### 2. moderation_actions
Stores moderation decisions (bans, warnings, content removal).

```sql
CREATE TABLE moderation_actions (
  id SERIAL PRIMARY KEY,
  moderator_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  target_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL, -- 'ban', 'warn', 'mute', 'unban', etc.
  reason TEXT,
  duration INTEGER, -- Duration in seconds (NULL = permanent)
  details JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'resolved', 'appealed'
  resolved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_mod_actions_moderator ON moderation_actions(moderator_id);
CREATE INDEX idx_mod_actions_target ON moderation_actions(target_user_id);
CREATE INDEX idx_mod_actions_status ON moderation_actions(status);
```

#### 3. system_settings
Global platform configuration and feature toggles.

```sql
CREATE TABLE system_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  value_type VARCHAR(20) NOT NULL, -- 'string', 'number', 'boolean', 'object'
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_settings_key ON system_settings(key);
```

#### 4. feature_flags
A/B testing and gradual feature rollouts.

```sql
CREATE TABLE feature_flags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT FALSE,
  description TEXT,
  rollout_percentage INTEGER DEFAULT 100, -- 0-100
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_feature_flags_name ON feature_flags(name);
CREATE INDEX idx_feature_flags_enabled ON feature_flags(enabled);
```

#### 5. analytics_events
Tracks user actions and platform events for analytics.

```sql
CREATE TABLE analytics_events (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  session_id VARCHAR(100),
  event_data JSONB DEFAULT '{}',
  page_url TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analytics_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_user ON analytics_events(user_id);
CREATE INDEX idx_analytics_session ON analytics_events(session_id);
CREATE INDEX idx_analytics_created ON analytics_events(created_at);
```

## Database Functions

### Audit Logs (5 functions)

#### `logAdminAction(data)`
Records an administrative action.
```typescript
await db.logAdminAction({
  adminId: 1,
  action: 'update_system_setting',
  targetType: 'setting',
  targetId: null,
  details: { key: 'maintenance_mode', value: 'true' },
  ipAddress: '192.168.1.1'
});
```

#### `getAdminAuditLogs(limit, offset)`
Retrieves audit logs with pagination.
```typescript
const logs = await db.getAdminAuditLogs(100, 0);
```

#### `getAuditLogsByUser(userId, limit)`
Gets all actions by a specific admin.
```typescript
const adminLogs = await db.getAuditLogsByUser(1, 50);
```

#### `getAuditLogsByAction(action, limit)`
Filters logs by action type.
```typescript
const loginLogs = await db.getAuditLogsByAction('user_login', 100);
```

#### `getAuditLogsByDateRange(startDate, endDate)`
Retrieves logs within a date range.
```typescript
const logs = await db.getAuditLogsByDateRange('2025-01-01', '2025-12-31');
```

### Moderation Actions (6 functions)

#### `createModerationAction(data)`
Creates a new moderation action.
```typescript
await db.createModerationAction({
  moderatorId: 1,
  targetUserId: 42,
  actionType: 'ban',
  reason: 'Spam',
  duration: 86400 * 7, // 7 days in seconds
  details: { messages: 15 }
});
```

#### `getModerationActions(limit, offset)`
Lists all moderation actions.
```typescript
const actions = await db.getModerationActions(100, 0);
```

#### `updateModerationStatus(actionId, status, resolvedBy)`
Updates action status.
```typescript
await db.updateModerationStatus(5, 'resolved', 1);
```

#### `banUser(userId, moderatorId, reason, duration?)`
Bans a user (creates moderation action + updates user).
```typescript
await db.banUser(42, 1, 'Repeated violations', 86400 * 30);
```

#### `unbanUser(userId, moderatorId)`
Removes a ban.
```typescript
await db.unbanUser(42, 1);
```

#### `getUserModerationHistory(userId)`
Gets all moderation actions for a user.
```typescript
const history = await db.getUserModerationHistory(42);
```

### System Settings (4 functions)

#### `getSystemSettings()`
Retrieves all system settings.
```typescript
const settings = await db.getSystemSettings();
// Returns: { maintenance_mode: { value: 'false', type: 'boolean', ... }, ... }
```

#### `getSystemSetting(key)`
Gets a specific setting.
```typescript
const setting = await db.getSystemSetting('maintenance_mode');
```

#### `updateSystemSetting(key, value, adminId, description?)`
Updates or creates a setting.
```typescript
await db.updateSystemSetting('max_votes_per_day', 3, 1, 'Daily vote limit');
```

#### `deleteSystemSetting(key, adminId)`
Removes a setting.
```typescript
await db.deleteSystemSetting('old_feature', 1);
```

### Feature Flags (5 functions)

#### `getFeatureFlags()`
Gets all feature flags.
```typescript
const flags = await db.getFeatureFlags();
```

#### `getFeatureFlag(name)`
Gets a specific flag.
```typescript
const flag = await db.getFeatureFlag('new_chat_system');
```

#### `updateFeatureFlag(name, enabled, adminId, rolloutPercentage?)`
Toggles a feature flag.
```typescript
await db.updateFeatureFlag('new_chat_system', true, 1, 50); // 50% rollout
```

#### `createFeatureFlag(name, enabled, description, adminId)`
Creates a new feature flag.
```typescript
await db.createFeatureFlag('ai_recommendations', false, 'AI-powered product recommendations', 1);
```

#### `toggleMaintenanceMode(enabled, adminId, message?)`
Special helper for maintenance mode.
```typescript
await db.toggleMaintenanceMode(true, 1, 'System upgrade in progress');
```

### Analytics Events (6 functions)

#### `logAnalyticsEvent(data)`
Logs a user event.
```typescript
await db.logAnalyticsEvent({
  eventType: 'product_view',
  userId: 42,
  sessionId: 'sess_abc123',
  eventData: { productId: 5, duration: 30 },
  pageUrl: '/products/5',
  referrer: '/home',
  userAgent: 'Mozilla/5.0...',
  ipAddress: '192.168.1.100'
});
```

#### `getAnalyticsEvents(limit, offset)`
Retrieves recent events.
```typescript
const events = await db.getAnalyticsEvents(1000, 0);
```

#### `getEventsByType(eventType, limit)`
Filters events by type.
```typescript
const votes = await db.getEventsByType('vote_cast', 500);
```

#### `getEventsByDateRange(startDate, endDate, eventType?)`
Gets events in a time period.
```typescript
const events = await db.getEventsByDateRange('2025-12-01', '2025-12-31', 'purchase');
```

#### `getAnalyticsSummary(startDate, endDate)`
Aggregated statistics.
```typescript
const summary = await db.getAnalyticsSummary('2025-12-01', '2025-12-31');
// Returns: [{ event_type: 'product_view', event_count: 1523, unique_users: 342, ... }]
```

#### `getUserAnalytics(userId, startDate?, endDate?)`
Gets all events for a specific user.
```typescript
const userActivity = await db.getUserAnalytics(42, '2025-12-01', '2025-12-31');
```

## Dual-Mode Storage Service

### adminStorage.ts

Automatically switches between file-based (dev) and database (production) storage:

```typescript
import { adminStorage } from '@/utils/adminStorage';

// Works in both modes!
await adminStorage.logAdminAction({
  adminId: 1,
  action: 'create_product',
  targetType: 'product',
  targetId: 123
});

const logs = await adminStorage.getAdminAuditLogs(50);
```

### Environment Detection

```typescript
const USE_DATABASE = 
  process.env.NEXT_PUBLIC_USE_DATABASE === 'true' ||
  process.env.VERCEL_ENV === 'production' ||
  process.env.NODE_ENV === 'production';
```

### File Storage Structure

Development mode uses these JSON files:
- `public/data/audit-logs.json` - Admin action logs
- `public/data/moderation-actions.json` - Moderation history
- `public/data/reports.json` - User reports
- `public/data/settings.json` - System settings
- `public/data/feature-flags.json` - Feature toggles
- `public/data/analytics-events.json` - User events (last 10,000)

## Migration Endpoint

### POST /api/migrate/admin-data

Migrates all admin data from JSON files to PostgreSQL.

#### Request
```bash
curl -X POST http://localhost:3000/api/migrate/admin-data \
  -H "Content-Type: application/json" \
  -d '{ "adminPassword": "YOUR_ADMIN_PASSWORD" }'
```

#### Environment Variable Required
```bash
ADMIN_MIGRATION_PASSWORD=your_secure_password_here
```

#### Response
```json
{
  "success": true,
  "message": "Admin data migration completed",
  "results": {
    "auditLogs": { "migrated": 245, "errors": 0 },
    "moderationActions": { "migrated": 18, "errors": 0 },
    "reports": { "migrated": 7, "errors": 0 },
    "systemSettings": { "migrated": 12, "errors": 0 },
    "featureFlags": { "migrated": 5, "errors": 0 },
    "analyticsEvents": { "migrated": 1000, "errors": 0 }
  }
}
```

## API Endpoints (Updated)

### Audit Logs
- `GET /api/admin/audit-logs` - List all audit logs
- `GET /api/admin/audit-logs?userId=1` - Filter by admin
- `GET /api/admin/audit-logs?action=user_ban` - Filter by action
- `GET /api/admin/audit-logs?startDate=...&endDate=...` - Date range

### Moderation
- `GET /api/moderation/actions` - List moderation actions
- `POST /api/moderation/ban` - Ban a user
- `POST /api/moderation/unban` - Unban a user
- `GET /api/moderation/history/:userId` - User's mod history
- `PUT /api/moderation/action/:id` - Update action status

### System Settings
- `GET /api/admin/settings` - Get all settings
- `GET /api/admin/settings/:key` - Get specific setting
- `PUT /api/admin/settings/:key` - Update setting
- `DELETE /api/admin/settings/:key` - Delete setting

### Feature Flags
- `GET /api/admin/feature-flags` - Get all flags
- `GET /api/admin/feature-flags/:name` - Get specific flag
- `PUT /api/admin/feature-flags/:name` - Toggle flag
- `POST /api/admin/feature-flags` - Create new flag

### Analytics
- `GET /api/admin/analytics/events` - Recent events
- `GET /api/admin/analytics/summary?start=...&end=...` - Aggregated stats
- `GET /api/admin/analytics/user/:userId` - User activity
- `POST /api/admin/analytics/event` - Log new event

### Maintenance Mode
- `POST /api/admin/maintenance` - Toggle maintenance mode

## Example Usage

### Logging Admin Actions
```typescript
import { adminStorage } from '@/utils/adminStorage';

// In your API route or server action
await adminStorage.logAdminAction({
  adminId: req.user.id,
  action: 'delete_product',
  targetType: 'product',
  targetId: productId,
  details: { productName: 'Example Product' },
  ipAddress: req.socket.remoteAddress
});
```

### Banning a User
```typescript
await adminStorage.banUser(
  userId,
  moderatorId,
  'Repeated spam violations',
  86400 * 7 // 7 days
);
```

### Feature Flag Check
```typescript
const newChatFlag = await adminStorage.getFeatureFlag('new_chat_system');
if (newChatFlag?.enabled) {
  // Show new chat interface
} else {
  // Show old chat interface
}
```

### Analytics Tracking
```typescript
await adminStorage.logAnalyticsEvent({
  eventType: 'vote_cast',
  userId: user.id,
  sessionId: session.id,
  eventData: { productId, tier: user.tier },
  pageUrl: req.url,
  userAgent: req.headers['user-agent']
});
```

### Maintenance Mode
```typescript
// Enable maintenance
await adminStorage.toggleMaintenanceMode(
  true,
  adminId,
  'Database upgrade in progress. We\'ll be back in 30 minutes.'
);

// Disable maintenance
await adminStorage.toggleMaintenanceMode(false, adminId);
```

## Testing

### Development Mode (File Storage)
1. Start dev server: `npm run dev`
2. Admin actions write to `public/data/*.json`
3. View files to verify data storage
4. Test all admin features

### Production Mode (Database)
1. Set `NEXT_PUBLIC_USE_DATABASE=true`
2. Ensure database tables are created
3. Run migration: `POST /api/migrate/admin-data`
4. Test all admin features against database
5. Verify audit logs are being created

### Key Test Cases
- ✅ Admin action logging (create, update, delete operations)
- ✅ User banning/unbanning with history tracking
- ✅ System settings CRUD operations
- ✅ Feature flag toggling and rollout percentages
- ✅ Analytics event logging and aggregation
- ✅ Maintenance mode toggle
- ✅ Audit log filtering and date ranges
- ✅ Moderation action status updates

## Security Considerations

### Audit Logging
- All admin actions are logged automatically
- Includes IP address, timestamp, target details
- Logs are immutable (append-only)
- Retention: Keep logs for compliance (e.g., 1 year+)

### Access Control
- All admin endpoints should verify user role
- Use `isAdmin` or `role === 'admin'` checks
- Log failed authorization attempts
- Rate limit sensitive endpoints

### Data Privacy
- Analytics events may contain PII - handle carefully
- Implement data retention policies
- Allow users to request data deletion (GDPR)
- Anonymize data for aggregated reports

### Migration Security
- Password-protect migration endpoint
- Use strong `ADMIN_MIGRATION_PASSWORD`
- Only run migration once
- Back up data before migrating

## Performance Optimization

### Database Indexes
All critical queries have indexes:
- Audit logs: admin_id, action, created_at
- Moderation: moderator_id, target_user_id, status
- Analytics: event_type, user_id, session_id, created_at

### Analytics Event Limits
- File storage: Keep last 10,000 events
- Database: Use partitioning for large tables
- Archive old events to cold storage
- Aggregate frequently queried data

### Caching
Consider caching for:
- System settings (rarely change)
- Feature flags (check on every request)
- Analytics summaries (daily/hourly aggregates)

## Integration with Existing Features

### User Bans
When a user is banned:
1. Moderation action created
2. User record updated (`is_banned = true`)
3. Audit log entry added
4. Sessions invalidated (optional)
5. Notifications sent (optional)

### Feature Flags in Code
```typescript
// Middleware or component
const flags = await adminStorage.getFeatureFlags();

if (flags.new_chat_system?.enabled) {
  // Rollout percentage check
  const userHash = hashUserId(user.id);
  if (userHash % 100 < flags.new_chat_system.rollout_percentage) {
    return <NewChatComponent />;
  }
}
return <OldChatComponent />;
```

### Analytics Dashboard
Create admin dashboard showing:
- Real-time event stream
- Top events by type
- User activity heatmap
- Conversion funnels
- Retention metrics

## Next Steps

### Phase 6: Notifications & Real-time
- Push notifications
- Real-time event streaming
- WebSocket connections
- Email notification system

### Phase 7: Advanced Features
- Full-text search (products, users, content)
- AI-powered recommendations
- Advanced reporting & dashboards
- Data export & import

## Summary

✅ **Phase 5 Complete**
- 5 new database tables (audit logs, moderation, settings, flags, analytics)
- 26 new database functions
- Dual-mode storage service (file + database)
- Migration endpoint
- Security & audit logging
- Analytics tracking
- Feature flag system
- Maintenance mode support

**Total Database Functions: 101+ across all phases**
**Total Database Tables: 20 across all phases**

Ready for comprehensive admin control and platform analytics! 🎉
