// components/messaging/MessageButton.tsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface MessageButtonProps {
  userId: number;
  username: string;
  variant?: 'primary' | 'secondary' | 'icon-only';
  className?: string;
}

export default function MessageButton({
  userId,
  username,
  variant = 'primary',
  className = ''
}: MessageButtonProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleMessage = async () => {
    if (!isAuthenticated) {
      console.log('Not authenticated, redirecting to login');
      router.push('/login');
      return;
    }

    if (user?.id === userId) {
      return; // Can't message yourself
    }

    setLoading(true);
    console.log('Opening conversation with userId:', userId, 'username:', username);

    try {
      // Check if conversation already exists
      const convResponse = await fetch('/api/messages/conversations', {
        credentials: 'include'
      });

      if (convResponse.ok) {
        const convData = await convResponse.json();
        const existingConv = convData.conversations?.find(
          (c: any) => c.otherUserId === userId
        );

        if (existingConv) {
          // Conversation exists, navigate to it
          console.log('Existing conversation found:', existingConv.id);
          router.push(`/messages?conversation=${existingConv.id}&username=${encodeURIComponent(username)}`);
          setLoading(false);
          return;
        }
      }

      // No existing conversation - just navigate to messages page with user info
      // The conversation will be created when the user sends their first message
      console.log('No existing conversation, navigating to messages with user info');
      router.push(`/messages?userId=${userId}&username=${encodeURIComponent(username)}`);
    } catch (error) {
      console.error('Error checking conversations:', error);
      // On error, still try to navigate
      router.push(`/messages?userId=${userId}&username=${encodeURIComponent(username)}`);
    } finally {
      setLoading(false);
    }
  };

  // Don't show button for own profile
  if (user?.id === userId) {
    return null;
  }

  if (variant === 'icon-only') {
    return (
      <button
        onClick={handleMessage}
        disabled={loading}
        className={`p-2 hover:bg-zinc-800/50 rounded-lg transition-colors ${className}`}
        title={`Message ${username}`}
      >
        <MessageCircle className="w-5 h-5 text-gray-400 hover:text-white" />
      </button>
    );
  }

  if (variant === 'secondary') {
    return (
      <button
        onClick={handleMessage}
        disabled={loading}
        className={`px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors flex items-center gap-2 ${className}`}
      >
        <MessageCircle className="w-4 h-4" />
        {loading ? 'Loading...' : 'Message'}
      </button>
    );
  }

  // Primary variant
  return (
    <button
      onClick={handleMessage}
      disabled={loading}
      className={`px-6 py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold rounded-lg transition-colors flex items-center gap-2 ${className}`}
    >
      <MessageCircle className="w-4 h-4" />
      {loading ? 'Loading...' : 'Message'}
    </button>
  );
}
