// pages/messages.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import MainNavbar from '@/components/nav/MainNavbar';
import DirectMessageList from '@/components/messaging/DirectMessageList';
import DirectMessageThread from '@/components/messaging/DirectMessageThread';
import { MessageCircle } from 'lucide-react';

export default function MessagesPage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<{
    id: string;
    otherUserId: number;
    otherUserName: string;
    otherUserAvatar?: string;
  } | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);

  // Check authentication - only redirect if not loading and not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(router.asPath)}`);
    }
  }, [isAuthenticated, loading, router]);

  // Load conversations
  const loadConversations = async () => {
    try {
      const response = await fetch('/api/messages/conversations', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  // Fetch on mount
  useEffect(() => {
    if (isAuthenticated) {
      loadConversations();
    }
  }, [isAuthenticated]);

  // Handle URL parameters
  useEffect(() => {
    const conversationId = router.query.conversation as string;
    const username = router.query.username as string;
    const userId = router.query.userId as string;

    // New conversation (no ID yet)
    if (userId && username && !conversationId) {
      setSelectedConversation({
        id: '',
        otherUserId: parseInt(userId),
        otherUserName: username,
        otherUserAvatar: undefined
      });
      return;
    }

    // Existing conversation
    if (conversationId) {
      const conv = conversations.find(c => c.id === conversationId);
      if (conv) {
        setSelectedConversation({
          id: conv.id,
          otherUserId: conv.otherUserId,
          otherUserName: username || conv.otherUserName,
          otherUserAvatar: conv.otherUserAvatar
        });
      } else if (username) {
        setSelectedConversation({
          id: conversationId,
          otherUserId: 0,
          otherUserName: username,
          otherUserAvatar: undefined
        });
      }
      return;
    }

    setSelectedConversation(null);
  }, [router.query.conversation, router.query.username, router.query.userId, conversations]);

  const handleSelectConversation = async (id: string) => {
    // First, try to find in current conversations
    let conv = conversations.find(c => c.id === id);
    
    // If not found, reload conversations and try again
    if (!conv) {
      await loadConversations();
      conv = conversations.find(c => c.id === id);
    }
    
    if (conv) {
      router.push(`/messages?conversation=${id}&username=${encodeURIComponent(conv.otherUserName)}`, undefined, { shallow: true });
    }
  };

  const handleConversationCreated = () => {
    // Reload conversations
    loadConversations();
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-black to-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="h-screen bg-gradient-to-br from-zinc-950 via-black to-zinc-900 flex flex-col overflow-hidden">
      <MainNavbar />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Conversation List - Hidden on mobile when thread is open */}
        <div
          className={`${
            selectedConversation ? 'hidden lg:block' : 'block'
          } w-full lg:w-80 xl:w-96 border-r border-zinc-700/50 flex-shrink-0`}
        >
          <DirectMessageList
            onSelectConversation={handleSelectConversation}
            selectedConversationId={selectedConversation?.id}
            onConversationUpdate={loadConversations}
          />
        </div>

        {/* Message Thread - Or empty state */}
        <div className={`flex-1 ${selectedConversation ? 'block' : 'hidden lg:block'}`}>
          {selectedConversation ? (
            <DirectMessageThread
              conversationId={selectedConversation.id}
              otherUserId={selectedConversation.otherUserId}
              otherUserName={selectedConversation.otherUserName}
              otherUserAvatar={selectedConversation.otherUserAvatar}
              onConversationCreated={handleConversationCreated}
              onBack={() => {
                setSelectedConversation(null);
                router.push('/messages', undefined, { shallow: true });
              }}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-zinc-900/30">
              <MessageCircle className="w-20 h-20 text-gray-600 mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Your Messages</h2>
              <p className="text-gray-400 max-w-md">
                Select a conversation from the list to start messaging, or visit a user's profile to start a new conversation
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Disable footer for messages page
(MessagesPage as any).showFooter = false;
