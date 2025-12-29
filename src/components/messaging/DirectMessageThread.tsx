import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useChatSocket } from '@/hooks/useSocket';
import { useOnlineUsers } from '@/hooks/useOnlineUsers';
import { Send, ArrowLeft, MoreVertical, Image as ImageIcon, Smile, X, Paperclip, Search } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

// Dynamically import emoji picker to avoid SSR issues
const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

interface Message {
  id: string;
  senderId: number;
  senderName: string;
  senderAvatar?: string;
  content: string;
  createdAt: string;
  read: boolean;
  reactions?: {
    emoji: string;
    users: number[];
  }[];
  replyTo?: {
    id: string;
    senderName: string;
    content: string;
  };
  attachments?: {
    id: number;
    url: string;
    name: string;
    type: string;
    size: number;
  }[];
}

interface DirectMessageThreadProps {
  conversationId: string;
  otherUserId: number;
  otherUserName: string;
  otherUserAvatar?: string;
  onConversationCreated?: () => void;
  onBack?: () => void;
}

export default function DirectMessageThread({
  conversationId,
  otherUserId,
  otherUserName,
  otherUserAvatar,
  onConversationCreated,
  onBack
}: DirectMessageThreadProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { isUserOnline } = useOnlineUsers();
  const { socket, typingUsers, sendTypingIndicator, connected } = useChatSocket(conversationId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [deletingMessage, setDeletingMessage] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Fetch messages
  const fetchMessages = async () => {
    if (!conversationId) {
      // New conversation, no messages yet
      setMessages([]);
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`/api/messages/conversation?id=${conversationId}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        scrollToBottom();
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [conversationId]);

  // Auto-scroll when messages change
  useEffect(() => {
    if (messages.length > 0) {
      // Use setTimeout to ensure DOM has updated
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [messages]);

  // Listen for real-time messages
  useEffect(() => {
    if (!socket || !connected) return;

    const handleNewMessage = (message: any) => {
      // Check if message is for this conversation
      if (message.conversationId === conversationId || message.conversationId === conversationId?.toString()) {
        setMessages(prev => {
          // Avoid duplicates - compare IDs as strings
          const messageIdStr = message.id?.toString();
          if (prev.some(m => m.id?.toString() === messageIdStr)) {
            console.log('[DirectMessageThread] Duplicate message detected, skipping:', messageIdStr);
            return prev;
          }
          return [...prev, message];
        });
      }
    };

    socket.on('chat:message', handleNewMessage);

    return () => {
      socket.off('chat:message', handleNewMessage);
    };
  }, [conversationId, socket, connected]);

  // Delete message
  const handleDeleteMessage = async (deleteType: 'for-me' | 'for-everyone') => {
    if (!deletingMessage) return;

    try {
      const response = await fetch('/api/messages/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          messageId: deletingMessage,
          deleteType
        })
      });

      if (response.ok) {
        // Remove message from local state
        setMessages(prev => prev.filter(m => m.id !== deletingMessage));
        setShowDeleteDialog(false);
        setDeletingMessage(null);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete message');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Error deleting message');
    }
  };

  // Send message
  const sendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !isAuthenticated) return;

    setSending(true);
    try {
      const payload: any = {
        recipientId: otherUserId,
        content: newMessage.trim() || '📎 Sent a file'
      };

      // Only include conversationId if it exists and is not empty
      if (conversationId && conversationId !== '') {
        payload.conversationId = conversationId;
      }

      // Include reply information if replying to a message
      if (replyingTo) {
        payload.replyToId = replyingTo.id;
      }

      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        
        // Don't add message immediately - let Socket.IO broadcast it to everyone including sender
        // This prevents duplicate messages
        setNewMessage('');
        setReplyingTo(null); // Clear reply state
        clearFileSelection();
        sendTypingIndicator(false);

        // If new conversation was created
        if ((!conversationId || conversationId === '') && data.conversationId) {
          console.log('[DirectMessageThread] New conversation created:', data.conversationId);
          // Notify parent to reload conversations
          if (onConversationCreated) {
            onConversationCreated();
          }
          // Update URL
          router.replace(`/messages?conversation=${data.conversationId}&username=${encodeURIComponent(otherUserName)}`, undefined, { shallow: true });
        }

        // Upload file if there is one
        if (selectedFile && data.message.id) {
          await uploadFile(data.message.id);
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[DirectMessageThread] Failed to send message:', response.status, errorData);
        alert(`Failed to send message: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message');
    } finally {
      setSending(false);
    }
  };

  // Upload file attachment
  const uploadFile = async (messageId: string) => {
    if (!selectedFile) return;

    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('messageId', messageId);

      const response = await fetch('/api/messages/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        // Refresh messages to show attachment
        await fetchMessages();
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploadingFile(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  // Clear file selection
  const clearFileSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle emoji selection
  const handleEmojiClick = (emojiData: any) => {
    setNewMessage(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  // Handle typing
  const handleTyping = (value: string) => {
    setNewMessage(value);
    
    // Send typing indicator
    if (value.trim()) {
      sendTypingIndicator(true);
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingIndicator(false);
      }, 2000);
    } else {
      sendTypingIndicator(false);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [newMessage]);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'nearest' });
  };

  // Format timestamp
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isTyping = typingUsers.includes(otherUserId);

  // Filter messages by search query
  const filteredMessages = searchQuery
    ? messages.filter(msg => msg.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  return (
    <div className="h-full flex flex-col bg-zinc-900/50">
      {/* Header */}
      <div className="p-4 border-b border-zinc-700/50 flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="lg:hidden p-2 hover:bg-zinc-800/50 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
        )}
        
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-black font-bold flex-shrink-0">
          {otherUserAvatar ? (
            <img
              src={otherUserAvatar}
              alt={otherUserName || 'User'}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            (otherUserName || '?').charAt(0).toUpperCase()
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white truncate">{otherUserName || 'Unknown User'}</h3>
          {isUserOnline(otherUserId) && (
            <p className="text-xs text-green-400">● Online</p>
          )}
        </div>
        
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="p-2 hover:bg-zinc-800/50 rounded-lg transition-colors"
          title="Search messages"
        >
          <Search className="w-5 h-5 text-gray-400" />
        </button>
        
        <button className="p-2 hover:bg-zinc-800/50 rounded-lg transition-colors">
          <MoreVertical className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="p-3 border-b border-zinc-700/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages..."
              className="w-full pl-10 pr-4 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                <X className="w-4 h-4 text-gray-400 hover:text-white" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="text-center text-gray-400 py-8">Loading messages...</div>
        ) : filteredMessages.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            {searchQuery ? (
              <>
                <p>No messages found</p>
                <p className="text-sm mt-2">Try a different search term</p>
              </>
            ) : (
              <>
                <p>No messages yet</p>
                <p className="text-sm mt-2">Start the conversation!</p>
              </>
            )}
          </div>
        ) : (
          filteredMessages.map((message, index) => {
            // Ensure both values are numbers for proper comparison
            const messageSenderId = typeof message.senderId === 'string' ? parseInt(message.senderId) : message.senderId;
            const currentUserId = typeof user?.id === 'string' ? parseInt(user.id) : user?.id;
            const isOwn = messageSenderId === currentUserId;
            
            const previousMessage = index > 0 ? filteredMessages[index - 1] : null;
            const showAvatar = !previousMessage || previousMessage.senderId !== message.senderId;
            
            return (
              <MessageBubble
                key={message.id}
                message={message}
                isOwnMessage={isOwn}
                showAvatar={showAvatar}
                onReply={(msgId) => {
                  const msg = messages.find(m => m.id === msgId);
                  if (msg) setReplyingTo(msg);
                  textareaRef.current?.focus();
                }}
                onReact={async (msgId, emoji) => {
                  try {
                    console.log('[DirectMessageThread] Reacting to message:', msgId, 'with emoji:', emoji);
                    const response = await fetch('/api/messages/react', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({ messageId: msgId, emoji })
                    });

                    if (response.ok) {
                      const data = await response.json();
                      console.log('[DirectMessageThread] Reaction response:', data);
                      // Update local state with new reactions
                      setMessages(prev => prev.map(m => {
                        if (m.id === msgId) {
                          console.log('[DirectMessageThread] Updating message reactions:', data.reactions);
                          return { ...m, reactions: data.reactions };
                        }
                        return m;
                      }));
                    } else {
                      console.error('[DirectMessageThread] Failed to react:', await response.text());
                    }
                  } catch (error) {
                    console.error('Failed to react:', error);
                  }
                }}
                onDelete={(msgId) => {
                  setDeletingMessage(msgId);
                  setShowDeleteDialog(true);
                }}
                onEdit={(msgId) => {
                  // TODO: Implement edit functionality
                  const msg = messages.find(m => m.id === msgId);
                  if (msg) {
                    setNewMessage(msg.content);
                    textareaRef.current?.focus();
                  }
                }}
              />
            );
          })
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicator - Fixed position above input */}
      {isTyping && (
        <div className="px-4 py-2 border-t border-zinc-700/50 bg-zinc-900/95">
          <TypingIndicator username={otherUserName} />
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-zinc-700/50">
        {/* File preview */}
        {selectedFile && (
          <div className="mb-3 p-3 bg-zinc-800/50 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-16 h-16 rounded object-cover" />
              ) : (
                <div className="w-16 h-16 bg-zinc-700 rounded flex items-center justify-center">
                  <Paperclip className="w-6 h-6 text-gray-400" />
                </div>
              )}
              <div>
                <p className="text-sm text-white font-medium truncate max-w-xs">{selectedFile.name}</p>
                <p className="text-xs text-gray-400">{(selectedFile.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <button
              onClick={clearFileSelection}
              className="p-1 hover:bg-zinc-700 rounded transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        )}

        <div className="flex items-end gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*,video/*,application/pdf,.doc,.docx"
            className="hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:bg-zinc-800/50 rounded-lg transition-colors flex-shrink-0"
            title="Attach file"
          >
            <ImageIcon className="w-5 h-5 text-gray-400" />
          </button>
          
          <div className="flex-1 bg-zinc-800/50 rounded-2xl border border-zinc-700/50 focus-within:border-yellow-400 transition-colors">
            {/* Reply bar */}
            {replyingTo && (
              <div className="px-4 py-2 bg-zinc-800/70 border-b border-zinc-700 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-yellow-400 font-semibold">
                    Replying to {replyingTo.senderName}
                  </div>
                  <div className="text-sm text-gray-400 truncate">
                    {replyingTo.content}
                  </div>
                </div>
                <button 
                  onClick={() => setReplyingTo(null)} 
                  className="ml-2 text-gray-400 hover:text-white transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Type a message..."
              rows={1}
              className="w-full px-4 py-3 bg-transparent text-white placeholder-gray-400 resize-none focus:outline-none max-h-32"
            />
          </div>
          
          <div className="relative" ref={emojiPickerRef}>
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 hover:bg-zinc-800/50 rounded-lg transition-colors flex-shrink-0"
              title="Add emoji"
            >
              <Smile className="w-5 h-5 text-gray-400" />
            </button>
            
            {showEmojiPicker && (
              <div className="absolute bottom-full right-0 mb-2 z-50">
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  theme={'dark' as any}
                  width={320}
                  height={400}
                />
              </div>
            )}
          </div>
          
          <button
            onClick={sendMessage}
            disabled={(!newMessage.trim() && !selectedFile) || sending || uploadingFile}
            className="p-3 bg-yellow-400 hover:bg-yellow-500 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-full transition-colors flex-shrink-0"
            title="Send message"
          >
            <Send className="w-5 h-5 text-black" />
          </button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && deletingMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowDeleteDialog(false)}>
          <div className="bg-zinc-800 rounded-xl p-6 max-w-sm mx-4 shadow-2xl border border-zinc-700" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-4">Delete Message?</h3>
            
            <div className="space-y-3 mb-6">
              {/* Check if user is the sender */}
              {messages.find(m => m.id === deletingMessage)?.senderId === user?.id ? (
                <>
                  <button
                    onClick={() => handleDeleteMessage('for-me')}
                    className="w-full p-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors text-left"
                  >
                    <div className="font-semibold">Delete for me</div>
                    <div className="text-sm text-gray-400">Only you won't see this message</div>
                  </button>
                  <button
                    onClick={() => handleDeleteMessage('for-everyone')}
                    className="w-full p-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors text-left"
                  >
                    <div className="font-semibold">Delete for everyone</div>
                    <div className="text-sm text-red-400/70">This message will be deleted for all participants</div>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleDeleteMessage('for-me')}
                  className="w-full p-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors text-left"
                >
                  <div className="font-semibold">Delete for me</div>
                  <div className="text-sm text-gray-400">Only you won't see this message</div>
                </button>
              )}
            </div>

            <button
              onClick={() => {
                setShowDeleteDialog(false);
                setDeletingMessage(null);
              }}
              className="w-full p-3 bg-zinc-700/50 hover:bg-zinc-700 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
