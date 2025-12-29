/**
 * Custom Next.js Server with Socket.IO
 * Run this with: node server.js
 */

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Initialize Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  // Initialize Socket.IO
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      credentials: true,
      methods: ['GET', 'POST']
    },
    path: '/socket.io/',
    transports: ['websocket', 'polling']
  });

  // Store io instance globally for API routes to access
  global.io = io;

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const userId = socket.handshake.auth.userId;
      
      // For now, accept connection if userId is provided
      // In production, verify the token/session
      if (userId) {
        socket.userId = parseInt(userId);
        socket.user = { id: socket.userId };
        next();
      } else {
        // Allow anonymous connections
        socket.userId = null;
        socket.user = null;
        next();
      }
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  // Connection handler
  io.on('connection', async (socket) => {
    const user = socket.user;
    console.log(`[Socket.IO] Client connected: ${socket.id}${user ? ` (User: ${user.id})` : ' (Anonymous)'}`);
    
    // Track connection in database (disabled - TypeScript import issue)
    if (user) {
      // Broadcast that this user is online (only if not invisible)
      const visibilityMap = global.visibilityMap || new Map();
      const isInvisible = visibilityMap.get(user.id);
      if (!isInvisible) {
        socket.broadcast.emit('user-online', { userId: user.id });
      }
      
      // Join user's room for targeted messages
      socket.join(`user:${user.id}`);
      
      // Send initial state and online users list
      // Get list of online users (excluding invisible users)
      const onlineUsers = [];
      for (const [socketId, socket] of io.sockets.sockets) {
        if (socket.user && socket.user.id) {
          const isInvisible = visibilityMap.get(socket.user.id);
          if (!isInvisible) {
            onlineUsers.push(socket.user.id);
          }
        }
      }
      
      socket.emit('initial-state', { 
        unreadCount: 0,
        userId: user.id,
        connected: true
      });
      
      socket.emit('online-users', Array.from(new Set(onlineUsers)));
    }
    
    // Handle ping for keepalive
    socket.on('ping', async () => {
      // Session activity tracking disabled (TypeScript import issue)
      socket.emit('pong', { timestamp: Date.now() });
    });

    // Handle notification mark as read
    socket.on('notification:read', async (data) => {
      if (!user) return;
      // Notification storage disabled (TypeScript import issue)
      // Send updated unread count to all user's sessions
      io.to(`user:${user.id}`).emit('notification:unread-count', { unreadCount: 0 });
    });

    // Handle typing indicators for chat
    socket.on('chat:typing', (data) => {
      if (!user) return;
      
      // Broadcast typing status to conversation participants
      socket.to(`conversation:${data.conversationId}`).emit('chat:typing', {
        userId: user.id,
        conversationId: data.conversationId,
        isTyping: data.isTyping
      });
    });

    // Handle joining conversation rooms
    socket.on('chat:join', (data) => {
      if (!user) return;
      socket.join(`conversation:${data.conversationId}`);
      console.log(`[Socket.IO] User ${user.id} joined conversation ${data.conversationId}`);
    });

    // Handle leaving conversation rooms
    socket.on('chat:leave', (data) => {
      if (!user) return;
      socket.leave(`conversation:${data.conversationId}`);
      console.log(`[Socket.IO] User ${user.id} left conversation ${data.conversationId}`);
    });

    // Handle get online users request
    socket.on('get-online-users', () => {
      const visibilityMap = global.visibilityMap || new Map();
      const onlineUsers = [];
      for (const [socketId, socket] of io.sockets.sockets) {
        if (socket.user && socket.user.id) {
          const isInvisible = visibilityMap.get(socket.user.id);
          if (!isInvisible) {
            onlineUsers.push(socket.user.id);
          }
        }
      }
      socket.emit('online-users', Array.from(new Set(onlineUsers)));
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
      if (user) {
        // Broadcast that this user is offline (only if they were visible)
        const visibilityMap = global.visibilityMap || new Map();
        const isInvisible = visibilityMap.get(user.id);
        if (!isInvisible) {
          socket.broadcast.emit('user-offline', { userId: user.id });
        }
      }
    });
  });

  // Cleanup stale sessions disabled (TypeScript import issue)
  // Can be re-enabled by implementing in JavaScript or using API routes
  
  // Start server
  httpServer.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Socket.IO server running on path: /socket.io/`);
  });
});
