// components/messaging/DirectMessageList.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/hooks/useSocket';
import { useOnlineUsers } from '@/hooks/useOnlineUsers';
import { MessageCircle, Search, X, UserPlus, Users, Check, XCircle } from 'lucide-react';

interface Conversation {
  id: string;
  otherUserId: number;
  otherUserName: string;
  otherUserAvatar?: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  online?: boolean;
  status?: string;
  initiatedBy?: number;
}

interface Following {
  id: number;
  username: string;
  avatar?: string;
  online?: boolean;
}

interface DirectMessageListProps {
  onSelectConversation?: (conversationId: string) => void;
  selectedConversationId?: string;
  onConversationUpdate?: () => void;
}

export default function DirectMessageList({
  onSelectConversation,
  selectedConversationId,
  onConversationUpdate
}: DirectMessageListProps) {
  const { user, isAuthenticated } = useAuth();
  const { on, off } = useSocket();
  const { isUserOnline } = useOnlineUsers();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messageRequests, setMessageRequests] = useState<Conversation[]>([]);
  const [following, setFollowing] = useState<Following[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFollowing, setShowFollowing] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [startingChat, setStartingChat] = useState<number | null>(null);

  // Fetch conversations
  const fetchConversations = async () => {
    if (!isAuthenticated) return;

    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  // Fetch message requests
  const fetchMessageRequests = async () => {
    if (!isAuthenticated) return;

    try {
      const response = await fetch('/api/messages/conversations?status=pending', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        // Only show requests that were NOT initiated by current user
        const requests = (data.conversations || []).filter((conv: Conversation) => 
          conv.initiatedBy !== user?.id
        );
        setMessageRequests(requests);
      }
    } catch (error) {
      console.error('Error fetching message requests:', error);
    }
  };

  // Fetch people user is following
  const fetchFollowing = async () => {
    if (!isAuthenticated || !user) return;

    setLoadingFollowing(true);
    try {
      const response = await fetch(`/api/followers?userId=${user.id}&type=following`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setFollowing(data.following || []);
      }
    } catch (error) {
      console.error('Error fetching following:', error);
    } finally {
      setLoadingFollowing(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    fetchMessageRequests();
    fetchFollowing();
  }, [isAuthenticated]);

  // Listen for new messages to update conversation list
  useEffect(() => {
    if (!isAuthenticated || !on || !off) return;

    const handleNewMessage = (message: any) => {
      setConversations(prev => {
        const updated = [...prev];
        const convIndex = updated.findIndex(c => c.id === message.conversationId);
        
        if (convIndex !== -1) {
          // Update existing conversation
          const conv = updated[convIndex];
          updated.splice(convIndex, 1);
          updated.unshift({
            ...conv,
            lastMessage: message.content,
            lastMessageAt: message.createdAt,
            unreadCount: message.senderId !== user?.id ? conv.unreadCount + 1 : conv.unreadCount
          });
        }
        
        return updated;
      });
    };

    on('chat:message', handleNewMessage);

    return () => {
      off('chat:message', handleNewMessage);
    };
  }, [isAuthenticated, on, off, user]);

  // Filter conversations and following by search
  const filteredConversations = conversations.filter(conv =>
    conv.otherUserName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFollowing = following.filter(person =>
    person.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Start a new conversation with a user (navigate without auto-sending message)
  const startConversation = (userId: number, username: string) => {
    // Check if conversation already exists
    const existingConv = conversations.find(c => c.otherUserId === userId);
    
    if (existingConv && onSelectConversation) {
      // Select existing conversation
      onSelectConversation(existingConv.id);
      setShowFollowing(false);
    } else {
      // Navigate to new conversation page (no message sent yet)
      if (typeof window !== 'undefined') {
        window.location.href = `/messages?userId=${userId}&username=${encodeURIComponent(username)}`;
      }
    }
  };

  // Handle message request action
  const handleRequestAction = async (conversationId: string, action: 'accept' | 'ignore') => {
    try {
      const response = await fetch('/api/messages/request-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ conversationId, action })
      });

      if (response.ok) {
        if (action === 'accept') {
          // Find the request being accepted
          const acceptedRequest = messageRequests.find(r => r.id === conversationId);
          
          // Remove from requests immediately
          setMessageRequests(prev => prev.filter(r => r.id !== conversationId));
          
          // Add to main conversations list immediately with updated status
          if (acceptedRequest) {
            setConversations(prev => [{
              ...acceptedRequest,
              status: 'accepted'
            }, ...prev]);
          }
          
          // Switch back to main view
          setShowRequests(false);
          
          // Notify parent to refresh its conversation list
          if (onConversationUpdate) {
            await onConversationUpdate();
          }
          
          // Open the conversation immediately
          if (onSelectConversation) {
            // Small delay to ensure parent state is updated
            setTimeout(() => {
              onSelectConversation(conversationId);
            }, 100);
          }
          
          // Refresh in background to sync with server
          fetchMessageRequests();
          fetchConversations();
        } else {
          // For ignore, just remove from requests
          setMessageRequests(prev => prev.filter(r => r.id !== conversationId));
          
          // Refresh in background
          fetchMessageRequests();
        }
      }
    } catch (error) {
      console.error('Error handling request:', error);
    }
  };

  // Format timestamp
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <MessageCircle className="w-16 h-16 text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-300 mb-2">Sign in to message</h3>
        <p className="text-gray-400">Connect with other members privately</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-zinc-900/50">
      {/* Header */}
      <div className="p-4 border-b border-zinc-700/50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Messages</h2>
          <div className="flex gap-2">
            {/* Message Requests Badge */}
            {messageRequests.length > 0 && !showRequests && !showFollowing && (
              <button
                onClick={() => {
                  setShowRequests(true);
                  setShowFollowing(false);
                }}
                className="relative p-2 hover:bg-zinc-800/50 rounded-lg transition-colors"
                title="Message requests"
              >
                <MessageCircle className="w-5 h-5 text-gray-400 hover:text-yellow-400" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 text-black text-xs font-bold rounded-full flex items-center justify-center">
                  {messageRequests.length}
                </span>
              </button>
            )}
            
            {/* New Conversation Button */}
            <button
              onClick={() => {
                setShowFollowing(!showFollowing);
                setShowRequests(false);
              }}
              className="p-2 hover:bg-zinc-800/50 rounded-lg transition-colors"
              title={showFollowing ? "Show conversations" : "Start new conversation"}
            >
              {showFollowing ? (
                <MessageCircle className="w-5 h-5 text-yellow-400" />
              ) : (
                <UserPlus className="w-5 h-5 text-gray-400 hover:text-yellow-400" />
              )}
            </button>
          </div>
        </div>
        
        {/* Tab Navigation */}
        {showRequests && (
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setShowRequests(false)}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm">Back to Messages</span>
            </button>
          </div>
        )}
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={showRequests ? "Search requests..." : showFollowing ? "Search people you follow..." : "Search conversations..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-gray-400 hover:text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Conversations, Requests, or Following List */}
      <div className="flex-1 overflow-y-auto">
        {showRequests ? (
          // Message Requests
          messageRequests.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400">No message requests</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-700/30">
              {messageRequests.filter(req =>
                req.otherUserName?.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((request) => (
                <div
                  key={request.id}
                  className="p-4 hover:bg-zinc-800/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-black font-bold flex-shrink-0">
                      {request.otherUserAvatar ? (
                        <img
                          src={request.otherUserAvatar}
                          alt={request.otherUserName}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        request.otherUserName.charAt(0).toUpperCase()
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate mb-1">
                        {request.otherUserName}
                      </h3>
                      <p className="text-sm text-gray-400 truncate mb-3">
                        {request.lastMessage}
                      </p>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRequestAction(request.id, 'accept')}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-yellow-400 hover:bg-yellow-500 text-black rounded-lg transition-colors font-semibold text-sm"
                        >
                          <Check className="w-4 h-4" />
                          Accept
                        </button>
                        <button
                          onClick={() => handleRequestAction(request.id, 'ignore')}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors text-sm"
                        >
                          <XCircle className="w-4 h-4" />
                          Ignore
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : showFollowing ? (
          // People You Follow
          loadingFollowing ? (
            <div className="p-8 text-center text-gray-400">Loading people you follow...</div>
          ) : filteredFollowing.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400">
                {searchQuery ? 'No people found' : 'Not following anyone yet'}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Follow users to start messaging them
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-700/30">
              {filteredFollowing.map((person) => (
                <button
                  key={person.id}
                  onClick={() => startConversation(person.id, person.username)}
                  className="w-full p-4 flex items-center gap-3 hover:bg-zinc-800/50 transition-colors"
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-black font-bold">
                      {person.avatar ? (
                        <img
                          src={person.avatar}
                          alt={person.username}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        person.username.charAt(0).toUpperCase()
                      )}
                    </div>
                    {isUserOnline(person.id) && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-zinc-900 rounded-full" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 text-left">
                    <h3 className="font-semibold text-white truncate">
                      {person.username}
                    </h3>
                    <p className="text-sm text-gray-400">
                      Send a message
                    </p>
                  </div>

                  <MessageCircle className="w-5 h-5 text-gray-400" />
                </button>
              ))}
            </div>
          )
        ) : (
          // Conversations List
          loading ? (
            <div className="p-8 text-center text-gray-400">Loading conversations...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400">
                {searchQuery ? 'No conversations found' : 'No messages yet'}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Click the + button to start a conversation
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-700/30">
              {filteredConversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => onSelectConversation?.(conversation.id)}
                  className={`w-full p-4 flex items-start gap-3 hover:bg-zinc-800/50 transition-colors ${
                    selectedConversationId === conversation.id ? 'bg-zinc-800/50' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-black font-bold">
                      {conversation.otherUserAvatar ? (
                        <img
                          src={conversation.otherUserAvatar}
                          alt={conversation.otherUserName}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        conversation.otherUserName.charAt(0).toUpperCase()
                      )}
                    </div>
                    {/* Online indicator */}
                    {isUserOnline(conversation.otherUserId) && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-zinc-900 rounded-full" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-baseline justify-between mb-1">
                      <h3 className="font-semibold text-white truncate">
                        {conversation.otherUserName}
                      </h3>
                      <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                        {formatTime(conversation.lastMessageAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 truncate">
                      {conversation.lastMessage}
                    </p>
                  </div>

                  {/* Unread badge */}
                  {conversation.unreadCount > 0 && (
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-400 text-black text-xs font-bold flex items-center justify-center">
                      {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
