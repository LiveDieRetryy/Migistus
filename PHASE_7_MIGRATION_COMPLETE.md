# Phase 7: Chat & Messaging - Migration Complete

## Overview
Phase 7 implements a complete real-time chat and messaging system with support for direct and group conversations, message threading, file attachments, emoji reactions, read receipts, and typing indicators.

## Database Schema

### 1. conversations
Stores conversation metadata for both direct and group chats.

```sql
CREATE TABLE conversations (
  id SERIAL PRIMARY KEY,
  type VARCHAR(20) NOT NULL CHECK (type IN ('direct', 'group')),
  name VARCHAR(255),
  created_by INTEGER NOT NULL REFERENCES users(id),
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_conversations_created_by ON conversations(created_by);
CREATE INDEX idx_conversations_type ON conversations(type);
```

### 2. conversation_participants
Manages conversation membership and roles.

```sql
CREATE TABLE conversation_participants (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  role VARCHAR(50) DEFAULT 'member',
  is_active BOOLEAN DEFAULT TRUE,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  left_at TIMESTAMP,
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX idx_conversation_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX idx_conversation_participants_user ON conversation_participants(user_id);
```

### 3. messages
Stores all messages with support for threading and metadata.

```sql
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'text',
  reply_to_id INTEGER REFERENCES messages(id),
  metadata JSONB,
  is_edited BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  edited_at TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_reply_to ON messages(reply_to_id);
```

### 4. message_attachments
Handles file uploads attached to messages.

```sql
CREATE TABLE message_attachments (
  id SERIAL PRIMARY KEY,
  message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_message_attachments_message ON message_attachments(message_id);
```

### 5. message_reactions
Tracks emoji reactions to messages.

```sql
CREATE TABLE message_reactions (
  id SERIAL PRIMARY KEY,
  message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  emoji VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(message_id, user_id, emoji)
);

CREATE INDEX idx_message_reactions_message ON message_reactions(message_id);
CREATE INDEX idx_message_reactions_user ON message_reactions(user_id);
```

### 6. message_read_status
Tracks which messages have been read by which users.

```sql
CREATE TABLE message_read_status (
  id SERIAL PRIMARY KEY,
  message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(message_id, user_id)
);

CREATE INDEX idx_message_read_status_message ON message_read_status(message_id);
CREATE INDEX idx_message_read_status_user ON message_read_status(user_id);
```

### 7. typing_indicators
Real-time typing status (database storage optional, primarily WebSocket-based).

```sql
CREATE TABLE typing_indicators (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  is_typing BOOLEAN DEFAULT TRUE,
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX idx_typing_indicators_conversation ON typing_indicators(conversation_id);
CREATE INDEX idx_typing_indicators_last_activity ON typing_indicators(last_activity);
```

## API Endpoints

### Conversations

#### GET /api/conversations
Get user's conversations with unread counts.

**Query Parameters:**
- `limit` (optional): Number of conversations to return (1-100, default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "conversations": [
    {
      "id": 1,
      "type": "direct",
      "name": null,
      "created_by": 1,
      "is_archived": false,
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z",
      "message_count": 42,
      "last_message_at": "2024-01-15T14:30:00Z",
      "unread_count": 5
    }
  ]
}
```

#### POST /api/conversations
Create a new conversation.

**Request Body:**
```json
{
  "type": "group",
  "name": "Project Discussion",
  "participantIds": [1, 2, 3, 4]
}
```

**Response:**
```json
{
  "conversation": {
    "id": 1,
    "type": "group",
    "name": "Project Discussion",
    "created_by": 1,
    "is_archived": false,
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:00:00Z"
  }
}
```

#### GET /api/conversations/[id]
Get conversation details with participants and unread count.

**Response:**
```json
{
  "conversation": {
    "id": 1,
    "type": "group",
    "name": "Project Discussion",
    "created_by": 1,
    "is_archived": false,
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:00:00Z",
    "participants": [
      {
        "id": 1,
        "conversation_id": 1,
        "user_id": 1,
        "role": "admin",
        "is_active": true,
        "joined_at": "2024-01-15T10:00:00Z"
      }
    ],
    "unread_count": 5
  }
}
```

#### PUT /api/conversations/[id]
Update conversation (name or archive status).

**Request Body:**
```json
{
  "name": "Updated Name",
  "isArchived": false
}
```

#### DELETE /api/conversations/[id]
Delete conversation (admin only).

#### POST /api/conversations/[id]/read
Mark all messages in conversation as read.

**Response:**
```json
{
  "message": "Conversation marked as read",
  "messagesMarked": 5
}
```

#### GET /api/conversations/unread
Get total unread message count.

**Response:**
```json
{
  "unreadCount": 12
}
```

### Participants

#### GET /api/conversations/[id]/participants
Get conversation participants.

#### POST /api/conversations/[id]/participants
Add participant (admin only).

**Request Body:**
```json
{
  "userId": 5,
  "role": "member"
}
```

#### DELETE /api/conversations/[id]/participants
Remove participant.

**Request Body:**
```json
{
  "userId": 5
}
```

#### PATCH /api/conversations/[id]/participants
Update participant role (admin only).

**Request Body:**
```json
{
  "userId": 5,
  "role": "admin"
}
```

### Messages

#### GET /api/conversations/[id]/messages
Get messages in conversation.

**Query Parameters:**
- `limit` (optional): Number of messages (1-100, default: 50)
- `offset` (optional): Pagination offset
- `beforeMessageId` (optional): Load messages before specific message ID
- `search` (optional): Search term for message content

**Response:**
```json
{
  "messages": [
    {
      "id": 1,
      "conversation_id": 1,
      "sender_id": 1,
      "content": "Hello everyone!",
      "message_type": "text",
      "reply_to_id": null,
      "metadata": null,
      "is_edited": false,
      "is_deleted": false,
      "created_at": "2024-01-15T10:00:00Z",
      "edited_at": null,
      "deleted_at": null,
      "attachments": [],
      "reactions": [
        {
          "emoji": "👍",
          "count": 3,
          "users": [{ "userId": 2 }, { "userId": 3 }, { "userId": 4 }]
        }
      ],
      "read_by": 4
    }
  ]
}
```

#### POST /api/conversations/[id]/messages
Send a message.

**Request Body:**
```json
{
  "content": "Hello everyone!",
  "messageType": "text",
  "replyToId": null,
  "metadata": null
}
```

#### GET /api/messages/[id]
Get message details.

#### PUT /api/messages/[id]
Edit message (sender only).

**Request Body:**
```json
{
  "content": "Updated message content"
}
```

#### DELETE /api/messages/[id]
Delete message (sender only).

**Query Parameters:**
- `hard` (optional): Permanently delete if "true", otherwise soft delete (default)

### Reactions

#### GET /api/messages/[id]/reactions
Get message reactions with counts.

#### POST /api/messages/[id]/reactions
Add reaction to message.

**Request Body:**
```json
{
  "emoji": "👍"
}
```

#### DELETE /api/messages/[id]/reactions
Remove reaction from message.

**Request Body:**
```json
{
  "emoji": "👍"
}
```

### Attachments

#### GET /api/messages/[id]/attachments
Get message attachments.

#### POST /api/messages/[id]/attachments
Add attachment (sender only).

**Request Body:**
```json
{
  "fileUrl": "https://example.com/file.pdf",
  "fileName": "document.pdf",
  "fileType": "application/pdf",
  "fileSize": 1024000
}
```

#### DELETE /api/messages/[id]/attachments
Delete attachment (sender only).

**Request Body:**
```json
{
  "attachmentId": 1
}
```

### Read Status

#### POST /api/messages/[id]/read
Mark message as read.

#### GET /api/messages/[id]/read
Get message read status.

**Response:**
```json
{
  "readStatus": [
    {
      "id": 1,
      "message_id": 1,
      "user_id": 2,
      "read_at": "2024-01-15T10:05:00Z"
    }
  ]
}
```

## Database Functions

### Conversations (5 functions)
- `createConversation({ type, name, createdBy })`
- `getConversation(conversationId)`
- `getUserConversations(userId, limit, offset)`
- `updateConversation(conversationId, { name, isArchived })`
- `deleteConversation(conversationId)`

### Participants (5 functions)
- `addParticipant({ conversationId, userId, role })`
- `getConversationParticipants(conversationId)`
- `removeParticipant(conversationId, userId)`
- `isParticipant(conversationId, userId)`
- `updateParticipantRole(conversationId, userId, role)`

### Messages (6 functions)
- `createMessage({ conversationId, senderId, content, messageType, replyToId, metadata })`
- `getMessage(messageId)`
- `getConversationMessages(conversationId, limit, offset, beforeMessageId)`
- `updateMessage(messageId, { content })`
- `deleteMessage(messageId, hardDelete)`
- `searchMessages(conversationId, searchTerm, limit)`

### Attachments (3 functions)
- `createAttachment({ messageId, fileUrl, fileName, fileType, fileSize })`
- `getMessageAttachments(messageId)`
- `deleteAttachment(attachmentId)`

### Reactions (4 functions)
- `addReaction({ messageId, userId, emoji })`
- `removeReaction({ messageId, userId, emoji })`
- `getMessageReactions(messageId)`
- `getReactionCounts(messageId)`

### Read Status (4 functions)
- `markMessageAsRead({ messageId, userId })`
- `markConversationAsRead(conversationId, userId)`
- `getUnreadMessageCount(userId, conversationId?)`
- `getMessageReadStatus(messageId)`

### Typing Indicators (3 functions)
- `setTypingStatus({ conversationId, userId, isTyping })`
- `getTypingUsers(conversationId)`
- `cleanupExpiredTypingIndicators()`

**Total: 30 database functions**

## WebSocket Integration

Phase 7 integrates with Phase 6's real-time system for live chat features:

### Real-time Events

```typescript
// Send message via WebSocket
socket.emit('chat:send-message', {
  conversationId: 1,
  content: 'Hello!',
  messageType: 'text'
});

// Receive new message
socket.on('chat:new-message', (message) => {
  console.log('New message:', message);
});

// Send typing indicator
socket.emit('chat:typing', {
  conversationId: 1,
  isTyping: true
});

// Receive typing indicator
socket.on('chat:user-typing', ({ userId, isTyping }) => {
  console.log(`User ${userId} is typing:`, isTyping);
});

// Mark message as read
socket.emit('chat:mark-read', {
  messageId: 123
});

// Receive read receipt
socket.on('chat:message-read', ({ messageId, userId }) => {
  console.log(`Message ${messageId} read by user ${userId}`);
});

// Add reaction
socket.emit('chat:add-reaction', {
  messageId: 123,
  emoji: '👍'
});

// Receive reaction update
socket.on('chat:reaction-added', ({ messageId, emoji, userId }) => {
  console.log('Reaction added:', emoji);
});
```

### WebSocket Helper Integration

```typescript
import { 
  sendToUser, 
  sendRealtimeNotification 
} from '@/utils/websocketHelpers';

// Send message to specific user
await sendToUser(recipientUserId, 'chat:new-message', message);

// Send notification
await sendRealtimeNotification(userId, {
  type: 'new_message',
  title: 'New Message',
  message: `${senderName}: ${messagePreview}`,
  data: { conversationId, messageId }
});
```

## React Hooks Examples

### useConversations Hook

```typescript
import { useState, useEffect } from 'react';

export function useConversations() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadConversations() {
      const response = await fetch('/api/conversations');
      const data = await response.json();
      setConversations(data.conversations);
      setLoading(false);
    }
    loadConversations();
  }, []);

  return { conversations, loading };
}
```

### useMessages Hook

```typescript
import { useState, useEffect } from 'react';

export function useMessages(conversationId: number) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMessages() {
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      const data = await response.json();
      setMessages(data.messages);
      setLoading(false);
    }
    loadMessages();
  }, [conversationId]);

  const sendMessage = async (content: string) => {
    const response = await fetch(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
    const data = await response.json();
    setMessages([...messages, data.message]);
    return data.message;
  };

  return { messages, loading, sendMessage };
}
```

### useTypingIndicator Hook

```typescript
import { useState, useEffect, useCallback } from 'react';
import { socket } from '@/lib/socket';

export function useTypingIndicator(conversationId: number) {
  const [typingUsers, setTypingUsers] = useState<number[]>([]);

  useEffect(() => {
    socket.on('chat:user-typing', ({ userId, isTyping }) => {
      setTypingUsers(prev => 
        isTyping 
          ? [...prev.filter(id => id !== userId), userId]
          : prev.filter(id => id !== userId)
      );
    });

    return () => {
      socket.off('chat:user-typing');
    };
  }, []);

  const setTyping = useCallback((isTyping: boolean) => {
    socket.emit('chat:typing', { conversationId, isTyping });
  }, [conversationId]);

  return { typingUsers, setTyping };
}
```

## Migration

### Migrate Chat Data
```bash
POST /api/migrate/chat-data
Authorization: Required (Master tier only)
```

This endpoint migrates all chat data from JSON files to the database:
- Conversations
- Participants
- Messages
- Attachments
- Reactions
- Read status

**Response:**
```json
{
  "message": "Chat data migration completed",
  "stats": {
    "conversations": 150,
    "participants": 450,
    "messages": 5000,
    "attachments": 200,
    "reactions": 1500,
    "readStatus": 8000,
    "totalErrors": 0
  },
  "errors": [],
  "hasMoreErrors": false
}
```

## Security Considerations

### Authentication
- All endpoints require valid session authentication
- Session obtained via `getSessionFromRequest(req, res)`

### Authorization
- **Conversation access**: Users must be active participants
- **Message editing/deletion**: Only message sender
- **Participant management**: Admin role required
- **Conversation deletion**: Admin role required
- **Data migration**: Master tier only

### Validation
- Message content: 1-10,000 characters
- File uploads: 10MB maximum
- Participant IDs: Must be valid integers
- Conversation type: Must be 'direct' or 'group'
- Group conversations: Must have a name
- Direct conversations: Exactly 2 participants

### Data Protection
- Soft delete for messages (preserves conversation history)
- Hard delete option available for compliance
- Participant removal via left_at timestamp
- Deleted messages show "[Deleted]" placeholder

## Performance Optimization

### Database Indexes
- Conversation lookups by user
- Message ordering by created_at (DESC)
- Participant filtering by active status
- Read status queries

### Pagination
- Messages: 50 per page (max 100)
- Conversations: 50 per page (max 100)
- Search results: 20 per query

### Caching Strategies
- Unread counts cached per user
- Conversation lists cached with TTL
- Typing indicators expire after 5 seconds
- Read receipts batch-updated

## Production Deployment

### Environment Variables
```bash
NEXT_PUBLIC_USE_DATABASE=true
POSTGRES_URL=your_postgres_connection_string
WEBSOCKET_SERVER_URL=your_websocket_server_url
```

### Database Migrations
1. Run schema creation scripts in order
2. Create all indexes for performance
3. Set up foreign key constraints
4. Run migration endpoint for existing data

### WebSocket Server
- Deploy Socket.IO server separately or with Next.js
- Configure CORS for production domains
- Set up Redis adapter for horizontal scaling
- Enable connection authentication

### File Storage
- Configure CDN for attachments
- Set up pre-signed URLs for uploads
- Implement virus scanning for uploads
- Set storage quotas per user

## Future Enhancements

### Potential Features
- Voice messages
- Video calls
- Message forwarding
- Message pinning
- User mentions (@username)
- Channel-based conversations
- Message encryption (E2E)
- Rich text formatting
- Link previews
- Message search across all conversations
- Export conversation history
- Message scheduling
- Auto-delete messages

### Scalability
- Implement message sharding by date
- Archive old conversations
- Compress message content
- CDN for static assets
- Database read replicas
- Message queue for notifications

## Testing

### Unit Tests
```typescript
describe('Chat API', () => {
  it('creates a conversation', async () => {
    const response = await fetch('/api/conversations', {
      method: 'POST',
      body: JSON.stringify({
        type: 'group',
        name: 'Test Group',
        participantIds: [1, 2, 3]
      })
    });
    expect(response.status).toBe(201);
  });

  it('sends a message', async () => {
    const response = await fetch('/api/conversations/1/messages', {
      method: 'POST',
      body: JSON.stringify({ content: 'Hello' })
    });
    expect(response.status).toBe(201);
  });

  it('adds a reaction', async () => {
    const response = await fetch('/api/messages/1/reactions', {
      method: 'POST',
      body: JSON.stringify({ emoji: '👍' })
    });
    expect(response.status).toBe(201);
  });
});
```

## Summary

Phase 7 provides a comprehensive chat and messaging system with:
- ✅ 7 database tables
- ✅ 30 database functions
- ✅ Dual-mode storage (file & database)
- ✅ 10+ API endpoints
- ✅ WebSocket integration
- ✅ Migration endpoint
- ✅ Complete documentation
- ✅ Production-ready validation
- ✅ Security & authorization
- ✅ Real-time features

The chat system is fully integrated with Phase 6's notification system and supports both direct and group conversations with advanced features like threading, reactions, read receipts, and typing indicators.
