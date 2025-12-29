/**
 * WebSocket Server Utilities for Real-time Notifications
 * 
 * This module provides utilities for managing WebSocket connections
 * and real-time session tracking.
 * 
 * Usage:
 * 1. Set up Socket.IO server in a custom server or API route
 * 2. Use these utilities to track connections and send notifications
 * 3. Automatically cleanup stale sessions
 */

import { notificationStorage } from '@/utils/notificationStorage';

export interface SocketUser {
  id: number;
  email: string;
  name: string;
  role?: string;
}

export interface RealtimeMessage {
  type: 'notification' | 'message' | 'update' | 'system';
  data: any;
  timestamp: Date;
}

/**
 * Track a new WebSocket connection
 * Note: Only tracks authenticated users. Anonymous connections are not tracked.
 */
export async function trackConnection(
  socketId: string,
  user: SocketUser | null,
  metadata: {
    ipAddress?: string;
    userAgent?: string;
  }
) {
  try {
    // Only track authenticated users
    if (!user || !user.id) {
      console.log(`[WebSocket] Connection from anonymous user: ${socketId}`);
      return;
    }
    
    await notificationStorage.createRealtimeSession({
      userId: user.id,
      sessionId: socketId,
      socketId,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent
    });
    
    console.log(`[WebSocket] Connection tracked: ${socketId} (User: ${user.email})`);
  } catch (error) {
    console.error('[WebSocket] Failed to track connection:', error);
  }
}

/**
 * Update session activity timestamp
 */
export async function updateSessionActivity(socketId: string) {
  try {
    await notificationStorage.updateRealtimeSession(socketId);
  } catch (error) {
    console.error('[WebSocket] Failed to update session:', error);
  }
}

/**
 * Remove WebSocket connection tracking
 */
export async function trackDisconnection(socketId: string) {
  try {
    await notificationStorage.removeRealtimeSession(socketId);
    console.log(`[WebSocket] Connection removed: ${socketId}`);
  } catch (error) {
    console.error('[WebSocket] Failed to remove session:', error);
  }
}

/**
 * Get active sessions for a user
 */
export async function getUserActiveSessions(userId: number) {
  try {
    const sessions = await notificationStorage.getActiveSessions(userId);
    return sessions;
  } catch (error) {
    console.error('[WebSocket] Failed to get user sessions:', error);
    return [];
  }
}

/**
 * Get count of active sessions for a user
 */
export async function getUserSessionCount(userId: number): Promise<number> {
  try {
    return await notificationStorage.getUserSessionCount(userId);
  } catch (error) {
    console.error('[WebSocket] Failed to get session count:', error);
    return 0;
  }
}

/**
 * Cleanup stale sessions (run periodically)
 */
export async function cleanupStaleSessions(minutesInactive: number = 30): Promise<number> {
  try {
    await notificationStorage.cleanupStaleRealtimeSessions(minutesInactive);
    console.log(`[WebSocket] Cleanup completed for sessions inactive for ${minutesInactive} minutes or more`);
    return 0; // cleanupStaleRealtimeSessions returns void
  } catch (error) {
    console.error('[WebSocket] Failed to cleanup stale sessions:', error);
    return 0;
  }
}

/**
 * Broadcast message to all connections
 */
export function broadcastMessage(
  io: any,
  message: RealtimeMessage
) {
  io.emit('message', {
    ...message,
    timestamp: new Date()
  });
}

/**
 * Send message to specific user (all their sessions)
 */
export function sendToUser(
  io: any,
  userId: number,
  message: RealtimeMessage
) {
  io.to(`user:${userId}`).emit('message', {
    ...message,
    timestamp: new Date()
  });
}

/**
 * Send notification to user in real-time
 */
export async function sendRealtimeNotification(
  io: any,
  userId: number,
  notification: {
    id: number;
    type: string;
    title: string;
    message: string;
    data?: any;
  }
) {
  // Send to all user's active sessions
  sendToUser(io, userId, {
    type: 'notification',
    data: notification,
    timestamp: new Date()
  });

  // Update unread count
  const unreadCount = await notificationStorage.getUnreadCount(userId);
  sendToUser(io, userId, {
    type: 'update',
    data: { unreadCount },
    timestamp: new Date()
  });
}

/**
 * Example Socket.IO server setup
 * 
 * Place this in a custom server file or API route:
 * 
 * ```typescript
 * import { Server } from 'socket.io';
 * import { createServer } from 'http';
 * import {
 *   trackConnection,
 *   trackDisconnection,
 *   updateSessionActivity,
 *   cleanupStaleSessions
 * } from '@/utils/websocketHelpers';
 * 
 * const httpServer = createServer();
 * const io = new Server(httpServer, {
 *   cors: {
 *     origin: process.env.NEXT_PUBLIC_APP_URL,
 *     credentials: true
 *   }
 * });
 * 
 * // Authentication middleware
 * io.use(async (socket, next) => {
 *   const token = socket.handshake.auth.token;
 *   try {
 *     const user = await verifyToken(token);
 *     socket.userId = user.id;
 *     socket.user = user;
 *     next();
 *   } catch (error) {
 *     next(new Error('Authentication failed'));
 *   }
 * });
 * 
 * // Connection handler
 * io.on('connection', async (socket) => {
 *   const user = socket.user;
 *   
 *   // Track connection
 *   await trackConnection(socket.id, user, {
 *     ipAddress: socket.handshake.address,
 *     userAgent: socket.handshake.headers['user-agent']
 *   });
 *   
 *   // Join user's room
 *   if (user) {
 *     socket.join(`user:${user.id}`);
 *   }
 *   
 *   // Send initial state
 *   const unreadCount = await notificationStorage.getUnreadCount(user.id);
 *   socket.emit('initial-state', { unreadCount });
 *   
 *   // Handle ping for keepalive
 *   socket.on('ping', async () => {
 *     await updateSessionActivity(socket.id);
 *     socket.emit('pong');
 *   });
 *   
 *   // Handle disconnection
 *   socket.on('disconnect', async () => {
 *     await trackDisconnection(socket.id);
 *   });
 * });
 * 
 * // Cleanup stale sessions every 5 minutes
 * setInterval(() => cleanupStaleSessions(30), 5 * 60 * 1000);
 * 
 * httpServer.listen(3001);
 * ```
 */

export default {
  trackConnection,
  trackDisconnection,
  updateSessionActivity,
  getUserActiveSessions,
  getUserSessionCount,
  cleanupStaleSessions,
  broadcastMessage,
  sendToUser,
  sendRealtimeNotification
};
