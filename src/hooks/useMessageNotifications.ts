// hooks/useMessageNotifications.ts
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/hooks/useSocket';

interface NotificationOptions {
  onNewMessage?: (message: any) => void;
  playSound?: boolean;
}

export function useMessageNotifications(options: NotificationOptions = {}) {
  const { user, isAuthenticated } = useAuth();
  const { on, off } = useSocket();
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasPermission, setHasPermission] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Request notification permission
  const requestPermission = async () => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      setHasPermission(true);
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      setHasPermission(granted);
      return granted;
    }

    return false;
  };

  // Fetch initial unread count
  const fetchUnreadCount = async () => {
    if (!isAuthenticated) return;

    try {
      const response = await fetch('/api/messages/unread-count', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Show browser notification
  const showNotification = (title: string, body: string, icon?: string) => {
    if (!hasPermission) return;

    try {
      const notification = new Notification(title, {
        body,
        icon: icon || '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'message-notification',
        requireInteraction: false
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      setTimeout(() => notification.close(), 5000);
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  };

  // Play notification sound
  const playNotificationSound = () => {
    if (!options.playSound) return;

    try {
      if (!audioRef.current) {
        audioRef.current = new Audio('/sounds/notification.mp3');
        audioRef.current.volume = 0.5;
      }
      audioRef.current.play().catch(err => {
        console.warn('Could not play notification sound:', err);
      });
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  // Listen for new messages
  useEffect(() => {
    if (!isAuthenticated || !on || !off) return;

    const handleNewMessage = (message: any) => {
      // Only show notification if message is not from current user
      if (message.senderId !== user?.id) {
        setUnreadCount(prev => prev + 1);
        showNotification(
          `New message from ${message.senderName}`,
          message.content,
          message.senderAvatar
        );
        playNotificationSound();
        
        if (options.onNewMessage) {
          options.onNewMessage(message);
        }
      }
    };

    on('chat:message', handleNewMessage);

    return () => {
      off('chat:message', handleNewMessage);
    };
  }, [isAuthenticated, user, on, off, hasPermission, options.onNewMessage]);

  // Fetch unread count on mount
  useEffect(() => {
    fetchUnreadCount();
    
    // Check notification permission
    if ('Notification' in window) {
      setHasPermission(Notification.permission === 'granted');
    }
  }, [isAuthenticated]);

  return {
    unreadCount,
    setUnreadCount,
    hasPermission,
    requestPermission,
    refreshUnreadCount: fetchUnreadCount
  };
}
