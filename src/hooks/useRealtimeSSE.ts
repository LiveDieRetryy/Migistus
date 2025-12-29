import { useEffect, useRef, useState } from 'react';

interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  created_at: string;
  sender_username?: string;
}

interface SSEData {
  type: 'connected' | 'messages' | 'online' | 'typing';
  data?: any;
  userId?: number;
}

/**
 * Hook for Server-Sent Events (SSE) real-time updates
 * Works on Vercel without Socket.IO!
 */
export function useRealtimeSSE(userId: number | null) {
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<number[]>([]);
  const [newMessages, setNewMessages] = useState<Message[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!userId) {
      return;
    }

    // Create SSE connection
    const eventSource = new EventSource(`/api/realtime/stream?userId=${userId}`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('[SSE] Connected to real-time stream');
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        // Skip heartbeat messages
        if (event.data.startsWith(':')) return;

        const data: SSEData = JSON.parse(event.data);
        
        switch (data.type) {
          case 'connected':
            console.log('[SSE] Connection confirmed for user:', data.userId);
            break;

          case 'messages':
            if (data.data && Array.isArray(data.data)) {
              setNewMessages(data.data);
            }
            break;

          case 'online':
            if (data.data && Array.isArray(data.data)) {
              setOnlineUsers(data.data);
            }
            break;

          case 'typing':
            // Handle typing indicators if needed
            break;
        }
      } catch (error) {
        console.error('[SSE] Error parsing message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('[SSE] Connection error:', error);
      setIsConnected(false);
      eventSource.close();
      
      // Auto-reconnect after 5 seconds
      setTimeout(() => {
        console.log('[SSE] Attempting to reconnect...');
        if (eventSourceRef.current) {
          eventSourceRef.current = new EventSource(`/api/realtime/stream?userId=${userId}`);
        }
      }, 5000);
    };

    // Cleanup on unmount
    return () => {
      console.log('[SSE] Disconnecting');
      eventSource.close();
      setIsConnected(false);
    };
  }, [userId]);

  return {
    isConnected,
    onlineUsers,
    newMessages,
    disconnect: () => eventSourceRef.current?.close()
  };
}
