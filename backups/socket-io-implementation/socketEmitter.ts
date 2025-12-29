/**
 * Socket.IO Event Emitter Utilities
 * Helper functions to emit Socket.IO events from API routes
 */

import { sendRealtimeNotification } from './websocketHelpers';

/**
 * Get the Socket.IO instance from global
 * The server.js file sets global.io
 */
function getIO(): any {
  if (typeof global !== 'undefined' && (global as any).io) {
    return (global as any).io;
  }
  return null;
}

/**
 * Emit a new notification to a specific user
 */
export async function emitNotification(
  userId: number,
  notification: {
    id: number;
    type: string;
    title: string;
    message: string;
    data?: any;
  }
) {
  const io = getIO();
  if (!io) {
    console.warn('[SocketEmitter] Socket.IO not available');
    return;
  }

  try {
    // Send to user's room
    io.to(`user:${userId}`).emit('notification:new', notification);
    
    // Send updated unread count
    const { notificationStorage } = require('./notificationStorage');
    const unreadCount = await notificationStorage.getUnreadCount(userId);
    io.to(`user:${userId}`).emit('notification:unread-count', { unreadCount });
    
    console.log(`[SocketEmitter] Notification sent to user ${userId}`);
  } catch (error) {
    console.error('[SocketEmitter] Error emitting notification:', error);
  }
}

/**
 * Emit a new chat message to conversation participants
 */
export function emitChatMessage(
  message: {
    id: string;
    conversationId: string;
    senderId: number;
    senderName: string;
    senderAvatar?: string | null;
    content: string;
    createdAt: string;
    read: boolean;
    replyTo?: any;
  }
) {
  const io = getIO();
  if (!io) {
    console.warn('[SocketEmitter] Socket.IO not available');
    return;
  }

  try {
    io.to(`conversation:${message.conversationId}`).emit('chat:message', message);
    console.log(`[SocketEmitter] Message sent to conversation ${message.conversationId}`);
  } catch (error) {
    console.error('[SocketEmitter] Error emitting chat message:', error);
  }
}

/**
 * Emit a new activity/post to followers
 */
export function emitActivity(
  actorId: number,
  activity: {
    id: string;
    type: 'post' | 'like' | 'comment' | 'follow';
    content?: string;
    targetId?: string;
    timestamp: string;
  }
) {
  const io = getIO();
  if (!io) {
    console.warn('[SocketEmitter] Socket.IO not available');
    return;
  }

  try {
    // Broadcast to all connected clients (they can filter by followers)
    io.emit('activity:new', {
      actorId,
      activity
    });
    console.log(`[SocketEmitter] Activity broadcast from user ${actorId}`);
  } catch (error) {
    console.error('[SocketEmitter] Error emitting activity:', error);
  }
}

/**
 * Emit a product update (voting, status change, etc.)
 */
export function emitProductUpdate(
  productId: string,
  update: {
    type: 'vote' | 'status_change' | 'update';
    data?: any;
  }
) {
  const io = getIO();
  if (!io) {
    console.warn('[SocketEmitter] Socket.IO not available');
    return;
  }

  try {
    io.emit('product:update', {
      productId,
      ...update,
      timestamp: Date.now()
    });
    console.log(`[SocketEmitter] Product update broadcast for ${productId}`);
  } catch (error) {
    console.error('[SocketEmitter] Error emitting product update:', error);
  }
}

/**
 * Emit user online/offline status change
 */
export function emitUserStatus(
  userId: number,
  status: 'online' | 'offline' | 'invisible'
) {
  const io = getIO();
  if (!io) {
    console.warn('[SocketEmitter] Socket.IO not available');
    return;
  }

  try {
    io.emit('user:status', {
      userId,
      status,
      timestamp: Date.now()
    });
    console.log(`[SocketEmitter] User ${userId} status: ${status}`);
  } catch (error) {
    console.error('[SocketEmitter] Error emitting user status:', error);
  }
}
