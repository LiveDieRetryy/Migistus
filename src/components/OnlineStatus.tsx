import { useEffect, useState } from 'react';

interface OnlineStatusProps {
  userId: number;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function OnlineStatus({ userId, showText = false, size = 'md' }: OnlineStatusProps) {
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkOnlineStatus = async () => {
      try {
        const response = await fetch(`/api/users/online?userId=${userId}`);
        const data = await response.json();
        setIsOnline(data.online);
      } catch (error) {
        console.error('Error checking online status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkOnlineStatus();
    
    // Poll every 30 seconds to update status
    const interval = setInterval(checkOnlineStatus, 30000);
    
    return () => clearInterval(interval);
  }, [userId]);

  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  if (loading) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className="relative">
        <div
          className={`${sizeClasses[size]} rounded-full border-2 border-zinc-800 ${
            isOnline
              ? 'bg-green-500 shadow-lg shadow-green-500/50'
              : 'bg-zinc-600'
          }`}
        />
        {isOnline && (
          <div
            className={`absolute inset-0 ${sizeClasses[size]} rounded-full bg-green-400 animate-ping opacity-75`}
          />
        )}
      </div>
      {showText && (
        <span className={`${textSizes[size]} ${isOnline ? 'text-green-400' : 'text-zinc-500'}`}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      )}
    </div>
  );
}
