// Hook for tracking online users via Socket.IO
import { useEffect, useState } from 'react';
import { useSocket } from '@/hooks/useSocket';

export function useOnlineUsers() {
  const { on, off, emit, connected } = useSocket();
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!connected || !on || !off) return;

    // Request online users list when connected
    emit('get-online-users');

    // Listen for online users updates
    const handleOnlineUsers = (users: number[]) => {
      setOnlineUsers(new Set(users));
    };

    const handleUserOnline = (data: { userId: number }) => {
      setOnlineUsers(prev => new Set(prev).add(data.userId));
    };

    const handleUserOffline = (data: { userId: number }) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        return newSet;
      });
    };

    on('online-users', handleOnlineUsers);
    on('user-online', handleUserOnline);
    on('user-offline', handleUserOffline);

    return () => {
      off('online-users', handleOnlineUsers);
      off('user-online', handleUserOnline);
      off('user-offline', handleUserOffline);
    };
  }, [connected, on, off, emit]);

  const isUserOnline = (userId: number): boolean => {
    return onlineUsers.has(userId);
  };

  return {
    onlineUsers: Array.from(onlineUsers),
    isUserOnline
  };
}
