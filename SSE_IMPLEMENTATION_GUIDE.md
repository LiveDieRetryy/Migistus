# Server-Sent Events (SSE) Implementation Guide

**Date**: December 29, 2025  
**Status**: ✅ Ready to use (Vercel-compatible)

---

## 🎯 What is SSE?

Server-Sent Events provide **real-time updates** from server to client using regular HTTP:
- ✅ Works on Vercel (no WebSocket needed)
- ✅ Native browser support
- ✅ Auto-reconnection
- ✅ No extra dependencies
- ⚠️ ~2 second update delay (vs 50ms for Socket.IO)

---

## 📁 Files Created

### Backend
- `src/pages/api/realtime/stream.ts` - SSE endpoint that streams updates

### Frontend
- `src/hooks/useRealtimeSSE.ts` - React hook for SSE connection
- `src/lib/realtimeClient.ts` - Abstraction layer (switch SSE/Socket.IO)

---

## 🚀 How to Use

### Option 1: Using the Hook Directly

```typescript
// In your component
import { useRealtimeSSE } from '@/hooks/useRealtimeSSE';

function MessagesPage() {
  const { user } = useAuth();
  const { isConnected, onlineUsers, newMessages } = useRealtimeSSE(user?.id || null);

  useEffect(() => {
    if (newMessages.length > 0) {
      // Handle new messages
      console.log('New messages:', newMessages);
    }
  }, [newMessages]);

  return (
    <div>
      {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
      <p>Online users: {onlineUsers.length}</p>
    </div>
  );
}
```

### Option 2: Using the Abstraction Layer

```typescript
// In your component
import { realtimeClient } from '@/lib/realtimeClient';

function ChatComponent() {
  const { user } = useAuth();

  useEffect(() => {
    // Connect to real-time
    realtimeClient.connect(user.id);

    // Listen for messages
    realtimeClient.on('messages', (messages) => {
      console.log('New messages:', messages);
    });

    // Listen for online status
    realtimeClient.on('online', (users) => {
      console.log('Online users:', users);
    });

    // Cleanup
    return () => {
      realtimeClient.disconnect();
    };
  }, [user.id]);
}
```

---

## ⚙️ Configuration

### Use SSE (Default - Vercel compatible)
```bash
# .env.local
NEXT_PUBLIC_USE_SOCKETIO=false
```

### Switch to Socket.IO (Production)
```bash
# .env.local
NEXT_PUBLIC_USE_SOCKETIO=true
NEXT_PUBLIC_SOCKET_URL=https://your-socket-server.railway.app
```

**That's it!** Your components work with both implementations automatically.

---

## 📊 What Gets Streamed?

### Messages
- Checks every 2 seconds for new messages
- Returns messages from last 3 seconds
- Includes sender info and conversation data

### Online Users
- Checks every 5 seconds
- Returns all users with active sessions
- Based on session last_active timestamp

### Heartbeat
- Sent every 2 seconds
- Keeps connection alive
- Prevents timeouts

---

## 🔧 Testing Locally

### Start Dev Server
```powershell
npm run dev
```

### Test SSE Connection
1. Open browser to `http://localhost:3000`
2. Login as a user
3. Open Developer Tools > Network tab
4. Look for `stream?userId=X` (should show "EventStream" type)
5. Send a message from another user
6. See message appear within 2 seconds

### Check Console
```
[SSE] Connected to real-time stream
[SSE] Connection confirmed for user: 1
```

---

## 🚀 Deploy to Vercel

### No Changes Needed!
```powershell
vercel deploy --prod
```

SSE works out of the box on Vercel. No separate server required.

---

## 🔄 Switching to Socket.IO Later

### When You're Ready for Production

1. **Deploy Socket.IO server to Railway**
   ```powershell
   cd backups\socket-io-implementation
   railway up
   ```

2. **Update environment variable**
   ```powershell
   vercel env add NEXT_PUBLIC_USE_SOCKETIO production
   # Enter: true
   
   vercel env add NEXT_PUBLIC_SOCKET_URL production
   # Enter: https://migistus-socket.railway.app
   ```

3. **Redeploy**
   ```powershell
   vercel deploy --prod
   ```

**Done!** Now using instant Socket.IO instead of SSE.

---

## 📈 Performance Comparison

| Metric | SSE | Socket.IO |
|--------|-----|-----------|
| Latency | ~2 seconds | ~50ms |
| Server Cost | $0 (Vercel) | $5/month (Railway) |
| Setup Time | 0 minutes | 15 minutes |
| Vercel Compatible | ✅ Yes | ❌ No |
| Production Ready | ✅ Yes | ✅ Yes |

---

## 🐛 Troubleshooting

### SSE Not Connecting
```typescript
// Check browser console
[SSE] Connected to real-time stream ✅

// If you see errors:
[SSE] Connection error ❌
```

**Fix**: Check that `/api/realtime/stream` endpoint exists

### Messages Not Appearing
- Check database has recent messages (within 3 seconds)
- Verify userId is correct
- Look at Network tab to see if data is streaming

### Connection Drops
- SSE auto-reconnects after 5 seconds
- Vercel functions timeout after 60 seconds (hobby) or 5 minutes (pro)
- This is normal, connection will refresh

---

## ✅ Current Status

- ✅ SSE endpoint created
- ✅ React hook created  
- ✅ Abstraction layer created
- ✅ Socket.IO backup saved
- ✅ Ready to deploy to Vercel
- ⏳ Components not yet updated (next step)

---

## 🎯 Next Steps

**To use SSE in your app**:

1. Update messaging components to use `useRealtimeSSE`
2. Replace Socket.IO calls with `realtimeClient`
3. Test locally
4. Deploy to Vercel

**Or keep using Socket.IO locally** and switch to SSE only for deployment!

---

*Last Updated: December 29, 2025*
