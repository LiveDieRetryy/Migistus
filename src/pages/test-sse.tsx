import { useState, useEffect, useRef } from 'react';
import { useRealtimeSSE } from '@/hooks/useRealtimeSSE';
import { useAuth } from '@/context/AuthContext';

export default function TestSSEPage() {
  const { user } = useAuth();
  const { isConnected, onlineUsers, newMessages } = useRealtimeSSE(user?.id || null);
  const [logs, setLogs] = useState<string[]>([]);
  const prevConnected = useRef(false);
  const prevMessagesCount = useRef(0);
  const prevUsersCount = useRef(0);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 50));
  };

  // Log connection changes
  useEffect(() => {
    if (isConnected && !prevConnected.current) {
      addLog('✅ SSE Connected');
    } else if (!isConnected && prevConnected.current) {
      addLog('❌ SSE Disconnected');
    }
    prevConnected.current = isConnected;
  }, [isConnected]);

  // Log new messages
  useEffect(() => {
    if (newMessages.length > 0 && newMessages.length !== prevMessagesCount.current) {
      addLog(`📨 Received ${newMessages.length} new messages`);
      prevMessagesCount.current = newMessages.length;
    }
  }, [newMessages.length]);

  // Log online users
  useEffect(() => {
    if (onlineUsers.length > 0 && onlineUsers.length !== prevUsersCount.current) {
      addLog(`👥 ${onlineUsers.length} users online`);
      prevUsersCount.current = onlineUsers.length;
    }
  }, [onlineUsers.length]);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>SSE Real-time Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Status</h2>
        <div style={{ 
          padding: '10px', 
          backgroundColor: isConnected ? '#d4edda' : '#f8d7da',
          color: isConnected ? '#155724' : '#721c24',
          borderRadius: '4px'
        }}>
          Connection: {isConnected ? '✅ Connected' : '❌ Disconnected'}
        </div>
        {user && (
          <p>Logged in as: User #{user.id}</p>
        )}
        {!user && (
          <p style={{ color: '#856404', backgroundColor: '#fff3cd', padding: '10px', borderRadius: '4px' }}>
            ⚠️ Please log in to test SSE functionality
          </p>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Online Users</h2>
        <div style={{ padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
          {onlineUsers.length > 0 ? (
            <ul>
              {onlineUsers.map(userId => (
                <li key={userId}>User #{userId}</li>
              ))}
            </ul>
          ) : (
            <p style={{ color: '#666' }}>No online users detected yet...</p>
          )}
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Recent Messages</h2>
        <div style={{ padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
          {newMessages.length > 0 ? (
            <ul>
              {newMessages.slice(0, 5).map((msg, idx) => (
                <li key={idx}>
                  <strong>{msg.sender_username || `User #${msg.sender_id}`}:</strong> {msg.content}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: '#666' }}>No new messages yet...</p>
          )}
        </div>
      </div>

      <div>
        <h2>Event Log</h2>
        <div style={{ 
          padding: '10px', 
          backgroundColor: '#000', 
          color: '#0f0', 
          borderRadius: '4px',
          height: '300px',
          overflow: 'auto',
          fontSize: '12px'
        }}>
          {logs.length > 0 ? (
            logs.map((log, idx) => (
              <div key={idx}>{log}</div>
            ))
          ) : (
            <div style={{ color: '#666' }}>Waiting for events...</div>
          )}
        </div>
      </div>

      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#d1ecf1', borderRadius: '4px' }}>
        <h3>How to Test:</h3>
        <ol>
          <li>Make sure you're logged in</li>
          <li>Open another browser/tab and send a message</li>
          <li>Watch this page for real-time updates (2-second latency)</li>
          <li>Check online users list updates (5-second interval)</li>
        </ol>
        <p>
          <strong>Environment:</strong> NEXT_PUBLIC_USE_SOCKETIO={process.env.NEXT_PUBLIC_USE_SOCKETIO || 'not set'}
        </p>
      </div>
    </div>
  );
}
