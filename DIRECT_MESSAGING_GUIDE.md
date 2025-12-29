# Direct Messaging System - Implementation Guide

## Overview
A complete peer-to-peer direct messaging system with real-time updates via Socket.IO, integrated with the existing WebSocket infrastructure.

---

## ✅ What's Been Implemented

### 1. **UI Components**
- ✅ `DirectMessageList` - Conversation list with search and unread badges
- ✅ `DirectMessageThread` - Chat interface with typing indicators
- ✅ `MessageButton` - Reusable button component for starting conversations
- ✅ `/messages` page - Full messaging interface with responsive design

### 2. **API Routes**
- ✅ `GET /api/messages/conversations` - Fetch all user conversations
- ✅ `GET /api/messages/[conversationId]` - Fetch messages for a conversation
- ✅ `POST /api/messages/send` - Send a new message

### 3. **Database Tables**
- ✅ `conversations` table with unique user pair constraint
- ✅ `direct_messages` table with read tracking
- ✅ Indexes for performance optimization
- ✅ Auto-update triggers for timestamps

### 4. **Real-time Features**
- ✅ Live message delivery via Socket.IO
- ✅ Typing indicators
- ✅ Conversation list auto-updates
- ✅ Unread count tracking
- ✅ Online status indicators

---

## 📋 Setup Instructions

### Step 1: Run Database Migration
```bash
# Connect to your PostgreSQL database
psql -U your_username -d your_database_name

# Run the migration script
\i database/migrations/add_direct_messaging.sql

# Or run directly with:
psql -U your_username -d your_database_name -f database/migrations/add_direct_messaging.sql
```

### Step 2: Verify Tables Created
```sql
-- Check conversations table
SELECT * FROM conversations LIMIT 1;

-- Check direct_messages table
SELECT * FROM direct_messages LIMIT 1;

-- Verify indexes
\d conversations
\d direct_messages
```

### Step 3: Restart Server
The server should auto-detect the new routes. If not:
```bash
npm run dev
```

---

## 🎯 How to Use

### For Users
1. **Access Messages**: Click "Messages" in the account dropdown menu
2. **Start a Conversation**: 
   - Visit a user's profile
   - Add `<MessageButton userId={user.id} username={user.username} />` to profile pages
3. **Send Messages**: Type in the message box and press Enter or click Send
4. **Real-time Updates**: Messages appear instantly for both parties

### For Developers

#### Add Message Button to User Profiles
```tsx
import MessageButton from '@/components/messaging/MessageButton';

// In your profile component
<MessageButton 
  userId={profileUser.id}
  username={profileUser.username}
  variant="primary" // or "secondary" or "icon-only"
/>
```

#### Navigate to Conversation Programmatically
```tsx
import { useRouter } from 'next/router';

const router = useRouter();

// Open specific conversation
router.push(`/messages?conversation=${conversationId}`);
```

#### Listen for New Messages Anywhere
```tsx
import { useSocket } from '@/hooks/useSocket';

const { on, off } = useSocket();

useEffect(() => {
  const handleMessage = (message) => {
    console.log('New message:', message);
  };

  on('chat:message', handleMessage);

  return () => {
    off('chat:message', handleMessage);
  };
}, [on, off]);
```

---

## 📊 Database Schema

### Conversations Table
```sql
CREATE TABLE conversations (
  id SERIAL PRIMARY KEY,
  user1_id INTEGER NOT NULL REFERENCES users(id),
  user2_id INTEGER NOT NULL REFERENCES users(id),
  last_message TEXT,
  last_message_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT different_users CHECK (user1_id != user2_id),
  CONSTRAINT ordered_users UNIQUE (LEAST(user1_id, user2_id), GREATEST(user1_id, user2_id))
);
```

### Direct Messages Table
```sql
CREATE TABLE direct_messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id),
  sender_id INTEGER NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔌 Socket.IO Events

### Client → Server
- `chat:join` - Join a conversation room
- `chat:leave` - Leave a conversation room
- `chat:typing` - Send typing indicator

### Server → Client
- `chat:message` - New message received
- `chat:typing` - User typing status changed

---

## 🎨 UI Features

### DirectMessageList
- Search conversations by username
- Unread message badges
- Online status indicators
- Last message preview
- Timestamps (smart formatting: "Just now", "5m", "2h", "3d")

### DirectMessageThread
- Smooth scrolling to new messages
- Auto-resizing textarea
- Typing indicators with animation
- Read receipts
- Send on Enter (Shift+Enter for new line)
- Message timestamps

### MessageButton
Three variants:
1. **Primary** - Yellow button with icon
2. **Secondary** - Dark button with icon
3. **Icon-only** - Just the message icon

---

## 🚀 Next Steps (Optional Enhancements)

### Recommended Additions
1. **File Attachments**
   - Image sharing
   - File uploads
   - Preview links

2. **Message Features**
   - Edit messages
   - Delete messages
   - Emoji picker
   - GIF support
   - Message reactions

3. **Conversation Management**
   - Archive conversations
   - Pin important chats
   - Delete conversations
   - Block users

4. **Notifications**
   - Desktop notifications
   - Sound alerts
   - Unread count in navbar badge

5. **Advanced Features**
   - Group chats
   - Voice messages
   - Video calls
   - Read receipts (show when message was read)

---

## 🐛 Troubleshooting

### Messages Not Appearing
1. Check Socket.IO connection in browser console
2. Verify database tables exist
3. Check server logs for errors
4. Ensure userId is in cookies/localStorage

### Typing Indicators Not Working
1. Verify Socket.IO events in Network tab
2. Check `chat:typing` event listeners
3. Ensure conversation room join is successful

### Conversations Not Loading
1. Check `/api/messages/conversations` response
2. Verify user authentication
3. Check database query results

---

## 📝 File Structure
```
src/
├── components/
│   └── messaging/
│       ├── DirectMessageList.tsx
│       ├── DirectMessageThread.tsx
│       └── MessageButton.tsx
├── pages/
│   ├── messages.tsx
│   └── api/
│       └── messages/
│           ├── conversations.ts
│           ├── [conversationId].ts
│           └── send.ts
├── hooks/
│   └── useSocket.ts (updated)
└── utils/
    └── socketEmitter.ts

database/
└── migrations/
    └── add_direct_messaging.sql
```

---

## 🎉 Summary

You now have a complete, production-ready direct messaging system with:
- ✅ Real-time message delivery
- ✅ Typing indicators
- ✅ Unread tracking
- ✅ Responsive UI
- ✅ Database persistence
- ✅ WebSocket integration

Navigate to `/messages` to start chatting! 💬
