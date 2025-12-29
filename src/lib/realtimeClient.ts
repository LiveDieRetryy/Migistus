/**
 * Real-time Communication Abstraction Layer
 * 
 * Supports both Socket.IO and SSE implementations
 * Switch between them by changing one environment variable!
 */

type MessageHandler = (data: any) => void;
type EventHandler = (data: any) => void;

interface RealtimeClient {
  connect: (userId: number) => void;
  disconnect: () => void;
  on: (event: string, handler: EventHandler) => void;
  off: (event: string, handler?: EventHandler) => void;
  emit: (event: string, data: any) => void;
  isConnected: () => boolean;
}

// ============================================
// SSE Implementation (Vercel-compatible)
// ============================================
class SSEClient implements RealtimeClient {
  private eventSource: EventSource | null = null;
  private handlers: Map<string, EventHandler[]> = new Map();
  private connected: boolean = false;
  private userId: number | null = null;

  connect(userId: number) {
    this.userId = userId;
    this.eventSource = new EventSource(`/api/realtime/stream?userId=${userId}`);
    
    this.eventSource.onopen = () => {
      console.log('[SSE] Connected');
      this.connected = true;
    };

    this.eventSource.onmessage = (event) => {
      try {
        // Skip heartbeat messages
        if (event.data.startsWith(':')) return;

        const data = JSON.parse(event.data);
        const handlers = this.handlers.get(data.type) || [];
        handlers.forEach(handler => handler(data.data));
      } catch (error) {
        console.error('[SSE] Parse error:', error);
      }
    };

    this.eventSource.onerror = () => {
      console.error('[SSE] Connection error');
      this.connected = false;
    };
  }

  disconnect() {
    this.eventSource?.close();
    this.connected = false;
    this.handlers.clear();
  }

  on(event: string, handler: EventHandler) {
    const handlers = this.handlers.get(event) || [];
    handlers.push(handler);
    this.handlers.set(event, handlers);
  }

  off(event: string, handler?: EventHandler) {
    if (!handler) {
      this.handlers.delete(event);
      return;
    }
    const handlers = this.handlers.get(event) || [];
    const filtered = handlers.filter(h => h !== handler);
    this.handlers.set(event, filtered);
  }

  emit(event: string, data: any) {
    // SSE is one-way, so we use regular API calls for sending
    // This happens automatically in your API routes
    console.log('[SSE] Emit (via API):', event, data);
  }

  isConnected() {
    return this.connected;
  }
}

// ============================================
// Socket.IO Implementation (requires separate server)
// ============================================
class SocketIOClient implements RealtimeClient {
  private socket: any = null;
  private connected: boolean = false;

  connect(userId: number) {
    // Dynamically import socket.io-client
    if (typeof window === 'undefined') return;

    import('socket.io-client').then(({ io }) => {
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';
      
      this.socket = io(socketUrl, {
        path: '/socket.io/',
        transports: ['websocket', 'polling'],
        auth: { userId, token: 'session-token' }
      });

      this.socket.on('connect', () => {
        console.log('[Socket.IO] Connected');
        this.connected = true;
      });

      this.socket.on('disconnect', () => {
        console.log('[Socket.IO] Disconnected');
        this.connected = false;
      });
    });
  }

  disconnect() {
    this.socket?.disconnect();
    this.connected = false;
  }

  on(event: string, handler: EventHandler) {
    this.socket?.on(event, handler);
  }

  off(event: string, handler?: EventHandler) {
    if (handler) {
      this.socket?.off(event, handler);
    } else {
      this.socket?.off(event);
    }
  }

  emit(event: string, data: any) {
    this.socket?.emit(event, data);
  }

  isConnected() {
    return this.connected;
  }
}

// ============================================
// Export the client based on environment
// ============================================

/**
 * Switch real-time implementation here!
 * 
 * Development (free): Use SSE
 * Production (fast): Use Socket.IO
 * 
 * Change via environment variable:
 * NEXT_PUBLIC_USE_SOCKETIO=true
 */
const USE_SOCKETIO = process.env.NEXT_PUBLIC_USE_SOCKETIO === 'true';

export const realtimeClient: RealtimeClient = USE_SOCKETIO 
  ? new SocketIOClient() 
  : new SSEClient();

// Export for easier usage
export function createRealtimeClient(): RealtimeClient {
  return USE_SOCKETIO ? new SocketIOClient() : new SSEClient();
}
