# Phase 6 API Documentation

## Overview
Complete API documentation for the notification, email queue, and push notification systems. All endpoints require authentication unless otherwise specified.

---

## Notifications API

### GET /api/notifications
Get user's notifications with pagination.

**Authentication:** Required

**Query Parameters:**
- `limit` (optional, default: 20, max: 100) - Number of notifications per page
- `offset` (optional, default: 0) - Pagination offset
- `unreadOnly` (optional, default: false) - Return only unread notifications

**Response:**
```json
{
  "notifications": [
    {
      "id": 123,
      "user_id": 456,
      "type": "product_vote",
      "title": "New Vote!",
      "message": "Someone voted on your product",
      "metadata": { "productId": 789 },
      "read": false,
      "created_at": "2025-12-11T10:30:00Z",
      "read_at": null
    }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

### POST /api/notifications
Create a new notification (users can only create for themselves).

**Authentication:** Required

**Request Body:**
```json
{
  "userId": 456,
  "type": "system",
  "title": "Welcome!",
  "message": "Welcome to Migistus",
  "data": { "custom": "metadata" }
}
```

**Notification Types:**
- `product_launch` - New product launched
- `product_vote` - Someone voted on product
- `product_comment` - New comment on product
- `follower` - New follower
- `message` - Direct message
- `system` - System announcement
- `moderation` - Moderation action

**Response:** `201 Created`
```json
{
  "id": 123,
  "user_id": 456,
  "type": "system",
  "title": "Welcome!",
  "message": "Welcome to Migistus",
  "metadata": { "custom": "metadata" },
  "read": false,
  "created_at": "2025-12-11T10:30:00Z"
}
```

### DELETE /api/notifications
Delete all notifications for the current user.

**Authentication:** Required

**Response:** `204 No Content`

---

### GET /api/notifications/[id]
Get a specific notification.

**Authentication:** Required

**Response:**
```json
{
  "id": 123,
  "user_id": 456,
  "type": "product_vote",
  "title": "New Vote!",
  "message": "Someone voted on your product",
  "read": false,
  "created_at": "2025-12-11T10:30:00Z"
}
```

### PUT /api/notifications/[id]
Mark a specific notification as read.

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

### DELETE /api/notifications/[id]
Delete a specific notification.

**Authentication:** Required

**Response:** `204 No Content`

---

### POST /api/notifications/mark-read
Mark notifications as read (single or all).

**Authentication:** Required

**Request Body (single):**
```json
{
  "notificationId": 123
}
```

**Request Body (all):**
```json
{
  "markAll": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notification(s) marked as read"
}
```

---

### GET /api/notifications/unread-count
Get count of unread notifications for current user.

**Authentication:** Required

**Response:**
```json
{
  "count": 5
}
```

---

### GET /api/notifications/preferences
Get user's notification preferences.

**Authentication:** Required

**Response:**
```json
{
  "user_id": 456,
  "email_enabled": true,
  "push_enabled": true,
  "product_launches": true,
  "product_votes": true,
  "product_comments": true,
  "new_followers": true,
  "direct_messages": true,
  "system_announcements": true,
  "marketing_emails": false,
  "updated_at": "2025-12-11T10:00:00Z"
}
```

### PUT /api/notifications/preferences
Update notification preferences.

**Authentication:** Required

**Request Body (partial updates allowed):**
```json
{
  "email_enabled": false,
  "product_launches": true,
  "marketing_emails": false
}
```

**Response:**
```json
{
  "user_id": 456,
  "email_enabled": false,
  "push_enabled": true,
  "product_launches": true,
  "product_votes": true,
  "product_comments": true,
  "new_followers": true,
  "direct_messages": true,
  "system_announcements": true,
  "marketing_emails": false,
  "updated_at": "2025-12-11T10:30:00Z"
}
```

---

## Email Queue API

### POST /api/email/queue
Queue an email for background sending.

**Authentication:** Required

**Request Body:**
```json
{
  "toEmail": "user@example.com",
  "fromEmail": "noreply@migistus.com",
  "subject": "Welcome to Migistus",
  "body": "Plain text content",
  "htmlBody": "<h1>HTML content</h1>",
  "priority": 5,
  "scheduledFor": "2025-12-11T12:00:00Z"
}
```

**Parameters:**
- `toEmail` (required) - Recipient email address
- `fromEmail` (required) - Sender email address
- `subject` (required) - Email subject
- `body` (required) - Plain text email content
- `htmlBody` (optional) - HTML email content
- `priority` (optional, 0-10, default: 0) - Email priority
- `scheduledFor` (optional) - Schedule email for future delivery

**Response:** `201 Created`
```json
{
  "success": true,
  "emailId": 123,
  "message": "Email queued successfully"
}
```

### GET /api/email/queue
Get email queue status (admin only).

**Authentication:** Required (Admin/Master tier)

**Query Parameters:**
- `limit` (optional, default: 50, max: 100) - Number of emails
- `status` (optional, default: 'pending') - Filter by status

**Statuses:**
- `pending` - Queued for sending
- `sending` - Currently being sent
- `sent` - Successfully delivered
- `failed` - Delivery failed
- `cancelled` - Manually cancelled

**Response:**
```json
{
  "emails": [
    {
      "id": 123,
      "recipient_email": "user@example.com",
      "subject": "Welcome",
      "status": "pending",
      "priority": "5",
      "attempts": 0,
      "created_at": "2025-12-11T10:00:00Z"
    }
  ],
  "total": 1,
  "limit": 50
}
```

---

### POST /api/email/send
Send or queue an email (admin only).

**Authentication:** Required (Admin/Master tier)

**Request Body:**
```json
{
  "toEmail": "user@example.com",
  "fromEmail": "admin@migistus.com",
  "subject": "Important Notice",
  "body": "Email content",
  "htmlBody": "<p>Email content</p>",
  "sendImmediately": true
}
```

**Response:**
```json
{
  "success": true,
  "emailId": 124,
  "message": "Email queued with highest priority for immediate sending"
}
```

---

### GET /api/email/status/[id]
Get status of a specific email.

**Authentication:** Required (user must own email or be admin)

**Response:**
```json
{
  "id": 123,
  "recipient_email": "user@example.com",
  "subject": "Welcome",
  "status": "sent",
  "priority": "5",
  "attempts": 1,
  "sent_at": "2025-12-11T10:05:00Z",
  "created_at": "2025-12-11T10:00:00Z"
}
```

---

## Push Notifications API

### POST /api/push/subscribe
Subscribe to push notifications.

**Authentication:** Required

**Request Body:**
```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "keys": {
    "p256dh": "BNcRdreALRFXTk...",
    "auth": "tBHItJI5svbpez7KI4CCXg=="
  },
  "userAgent": "Mozilla/5.0..."
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "subscriptionId": 789,
  "message": "Push subscription saved successfully"
}
```

**Error Response:** `409 Conflict` (if subscription already exists)
```json
{
  "error": "Subscription already exists",
  "message": "This device is already subscribed to push notifications"
}
```

---

### POST /api/push/unsubscribe
Unsubscribe from push notifications.

**Authentication:** Required

**Request Body:**
```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Push subscription removed successfully"
}
```

---

### POST /api/push/send
Send push notification (admin only).

**Authentication:** Required (Admin/Master tier)

**Request Body (single user):**
```json
{
  "userId": 456,
  "title": "New Product Launched!",
  "body": "Check out our latest product",
  "icon": "/icons/notification.png",
  "data": {
    "url": "/products/new-product",
    "productId": 123
  }
}
```

**Request Body (broadcast):**
```json
{
  "broadcast": true,
  "title": "System Maintenance",
  "body": "Scheduled maintenance in 1 hour",
  "icon": "/icons/system.png"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Push notification queued for 3 subscription(s)",
  "subscriptionCount": 3,
  "payload": {
    "title": "New Product Launched!",
    "body": "Check out our latest product",
    "icon": "/icons/notification.png",
    "data": { "url": "/products/new-product" }
  },
  "note": "Actual push sending requires web-push library configuration with VAPID keys"
}
```

---

## Common Response Codes

### Success Codes
- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `204 No Content` - Request successful, no content to return

### Client Error Codes
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `405 Method Not Allowed` - HTTP method not supported
- `409 Conflict` - Resource conflict (e.g., duplicate subscription)

### Server Error Codes
- `500 Internal Server Error` - Server error occurred

### Error Response Format
```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

---

## Rate Limiting

**Current Status:** Not implemented

**Recommended Limits:**
- Notifications: 100 requests/minute per user
- Email Queue: 50 requests/minute per user
- Push Subscribe/Unsubscribe: 20 requests/minute per user
- Push Send (admin): 500 requests/minute

---

## Authentication

All endpoints require session-based authentication using cookies.

**Session Cookie:** `migistus_session`

**To authenticate:**
1. Log in via `/api/auth/login`
2. Session cookie is automatically set
3. Cookie is included in subsequent requests

**Session expiration:** 30 days

---

## Usage Examples

### JavaScript/TypeScript (Browser)

#### Get Notifications
```typescript
const response = await fetch('/api/notifications?limit=20&unreadOnly=true');
const { notifications } = await response.json();
console.log(notifications);
```

#### Mark Notification as Read
```typescript
await fetch(`/api/notifications/${notificationId}`, {
  method: 'PUT'
});
```

#### Mark All as Read
```typescript
await fetch('/api/notifications/mark-read', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ markAll: true })
});
```

#### Subscribe to Push Notifications
```typescript
// Get service worker registration
const registration = await navigator.serviceWorker.ready;

// Subscribe
const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
});

// Save to server
await fetch('/api/push/subscribe', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    endpoint: subscription.endpoint,
    keys: {
      p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')))),
      auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth'))))
    }
  })
});
```

#### Update Notification Preferences
```typescript
await fetch('/api/notifications/preferences', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email_enabled: false,
    product_launches: true,
    marketing_emails: false
  })
});
```

### React Hook Example
```typescript
import { useState, useEffect } from 'react';

function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
  }, []);

  async function loadNotifications() {
    const response = await fetch('/api/notifications?limit=20');
    const { notifications: data } = await response.json();
    setNotifications(data);
    setLoading(false);
  }

  async function loadUnreadCount() {
    const response = await fetch('/api/notifications/unread-count');
    const { count } = await response.json();
    setUnreadCount(count);
  }

  async function markAsRead(id: number) {
    await fetch(`/api/notifications/${id}`, { method: 'PUT' });
    await loadNotifications();
    await loadUnreadCount();
  }

  async function markAllAsRead() {
    await fetch('/api/notifications/mark-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAll: true })
    });
    await loadNotifications();
    setUnreadCount(0);
  }

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refresh: loadNotifications
  };
}
```

---

## WebSocket Integration

For real-time notification delivery, see `src/utils/websocketHelpers.ts` for WebSocket server setup and usage examples.

**Features:**
- Real-time notification delivery
- Live unread count updates
- Session tracking
- Automatic cleanup of stale connections

---

## Security Considerations

### Input Validation
- All email addresses are validated with regex
- Notification types must match allowed values
- Priority values are bounded (0-10)
- Request size limits enforced

### Authorization
- Users can only read/modify their own notifications
- Admin-only endpoints require Master tier
- Email status can only be viewed by sender or admin
- Push subscriptions verified for ownership before deletion

### Data Protection
- Session cookies are HTTP-only
- HTTPS enforced in production
- SQL injection prevention via parameterized queries
- XSS prevention via HTML sanitization (recommended)

### Rate Limiting
- Recommended to implement per-user rate limits
- Protect against notification spam
- Prevent email queue abuse

---

## Production Deployment

### Required Environment Variables
```bash
# Database
DATABASE_URL=postgresql://...

# Email (optional - for actual sending)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASS=password

# Push Notifications (optional - for web-push)
VAPID_PUBLIC_KEY=BN...
VAPID_PRIVATE_KEY=abc...

# App URL
NEXT_PUBLIC_APP_URL=https://migistus.com
```

### Database Migrations
All Phase 6 tables are created automatically when using the database in production mode.

### Email Worker Setup
Create a background worker to process the email queue:

```bash
# Run every minute
* * * * * node scripts/process-email-queue.js
```

### Push Notification Setup
1. Generate VAPID keys
2. Configure service worker
3. Set environment variables
4. Install `web-push` library

---

## Monitoring

### Health Checks
Monitor these metrics:
- Email queue length
- Failed email count
- Average notification delivery time
- Active WebSocket connections
- Push subscription count

### Logging
All API endpoints log:
- Request method and path
- User ID
- Response status
- Error messages (if any)

---

## Support

For questions or issues:
1. Check Phase 6 documentation: `PHASE_6_MIGRATION_COMPLETE.md`
2. Review database schema and function signatures
3. Test endpoints in development mode first
4. Check server logs for errors

---

**Last Updated:** December 11, 2025  
**API Version:** Phase 6 (v1.0)
