/**
 * React Hook for Socket.IO Client Connection
 * Provides real-time WebSocket connection with auto-reconnect
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseSocketOptions {
  autoConnect?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

interface SocketState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
}

export function useSocket(options: UseSocketOptions = {}) {
  const {
    autoConnect = true,
    reconnectionAttempts = 5,
    reconnectionDelay = 1000
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const [state, setState] = useState<SocketState>({
    connected: false,
    connecting: false,
    error: null
  });

  // Get user ID from localStorage
  const getUserId = useCallback(() => {
    if (typeof window === 'undefined') return null;
    try {
      // Try currentUserId first (used by login/register)
      const currentUserId = localStorage.getItem('currentUserId');
      if (currentUserId) {
        return parseInt(currentUserId);
      }
      
      // Fallback to userId
      const userId = localStorage.getItem('userId');
      if (userId) {
        return parseInt(userId);
      }
      
      // Fallback to userSession
      const userSession = localStorage.getItem('userSession');
      if (userSession) {
        const session = JSON.parse(userSession);
        return session.userId || session.id;
      }
    } catch (error) {
      console.error('[useSocket] Error getting user ID:', error);
    }
    return null;
  }, []);

  // Connect to Socket.IO server
  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      console.log('[useSocket] Already connected');
      return;
    }

    setState(prev => ({ ...prev, connecting: true, error: null }));

    const userId = getUserId();
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;

    console.log('[useSocket] Connecting to:', socketUrl);

    const socket = io(socketUrl, {
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      reconnectionAttempts,
      reconnectionDelay,
      auth: {
        userId: userId
      }
    });

    // Connection events
    socket.on('connect', () => {
      console.log('[useSocket] Connected:', socket.id);
      setState({ connected: true, connecting: false, error: null });
    });

    socket.on('disconnect', (reason) => {
      console.log('[useSocket] Disconnected:', reason);
      setState({ connected: false, connecting: false, error: `Disconnected: ${reason}` });
    });

    socket.on('connect_error', (error) => {
      console.error('[useSocket] Connection error:', error);
      setState({ connected: false, connecting: false, error: error.message });
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`[useSocket] Reconnection attempt ${attemptNumber}`);
      setState(prev => ({ ...prev, connecting: true }));
    });

    socket.on('reconnect_failed', () => {
      console.error('[useSocket] Reconnection failed');
      setState({ connected: false, connecting: false, error: 'Reconnection failed' });
    });

    // Handle initial state from server
    socket.on('initial-state', (data) => {
      console.log('[useSocket] Initial state received:', data);
    });

    // Ping/pong for keepalive
    const pingInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('ping');
      }
    }, 30000); // Every 30 seconds

    socket.on('pong', (data) => {
      // console.log('[useSocket] Pong received:', data);
    });

    socketRef.current = socket;

    return () => {
      clearInterval(pingInterval);
      socket.disconnect();
    };
  }, [getUserId, reconnectionAttempts, reconnectionDelay]);

  // Disconnect from Socket.IO server
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log('[useSocket] Disconnecting');
      socketRef.current.disconnect();
      socketRef.current = null;
      setState({ connected: false, connecting: false, error: null });
    }
  }, []);

  // Subscribe to events
  const on = useCallback((event: string, callback: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  }, []);

  // Unsubscribe from events
  const off = useCallback((event: string, callback?: (...args: any[]) => void) => {
    if (socketRef.current) {
      if (callback) {
        socketRef.current.off(event, callback);
      } else {
        socketRef.current.off(event);
      }
    }
  }, []);

  // Emit events
  const emit = useCallback((event: string, ...args: any[]) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, ...args);
    } else {
      console.warn(`[useSocket] Cannot emit '${event}': not connected`);
    }
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    socket: socketRef.current,
    connected: state.connected,
    connecting: state.connecting,
    error: state.error,
    connect,
    disconnect,
    on,
    off,
    emit
  };
}

// Helper hook for notification events
export function useNotificationSocket() {
  const { on, off, connected } = useSocket();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const handleUnreadCount = (data: { unreadCount: number }) => {
      setUnreadCount(data.unreadCount);
    };

    const handleNewNotification = (notification: any) => {
      console.log('[Notification] New notification received:', notification);
      // Increment unread count
      setUnreadCount(prev => prev + 1);
    };

    on('notification:unread-count', handleUnreadCount);
    on('notification:new', handleNewNotification);
    on('initial-state', (data: any) => {
      if (data.unreadCount !== undefined) {
        setUnreadCount(data.unreadCount);
      }
    });

    return () => {
      off('notification:unread-count', handleUnreadCount);
      off('notification:new', handleNewNotification);
      off('initial-state');
    };
  }, [on, off]);

  return {
    unreadCount,
    connected
  };
}

// Helper hook for chat events
export function useChatSocket(conversationId?: string) {
  const { socket, on, off, emit, connected } = useSocket();
  const [typingUsers, setTypingUsers] = useState<number[]>([]);

  useEffect(() => {
    if (!conversationId || !connected) return;

    // Join conversation room
    emit('chat:join', { conversationId });

    const handleNewMessage = (message: any) => {
      console.log('[Chat] New message received:', message);
    };

    const handleTyping = (data: { userId: number; isTyping: boolean }) => {
      if (data.isTyping) {
        setTypingUsers(prev => [...new Set([...prev, data.userId])]);
      } else {
        setTypingUsers(prev => prev.filter(id => id !== data.userId));
      }
    };

    on('chat:message', handleNewMessage);
    on('chat:typing', handleTyping);

    return () => {
      // Leave conversation room
      emit('chat:leave', { conversationId });
      off('chat:message', handleNewMessage);
      off('chat:typing', handleTyping);
    };
  }, [conversationId, connected, on, off, emit]);

  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (conversationId && connected) {
      emit('chat:typing', { conversationId, isTyping });
    }
  }, [conversationId, connected, emit]);

  return {
    socket,
    typingUsers,
    sendTypingIndicator,
    connected
  };
}
