// components/chat/ChatMessenger.tsx
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useChatSocket } from '@/hooks/useSocket';
import { Send, Paperclip, Smile, X, Image as ImageIcon, Check, CheckCheck } from 'lucide-react';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  createdAt: string;
  read: boolean;
  attachments?: {
    id: string;
    type: 'image' | 'file';
    url: string;
    name: string;
  }[];
  reactions?: {
    emoji: string;
    userId: string;
    userName: string;
  }[];
}

interface ChatMessengerProps {
  productId: string;
  productName?: string;
  onClose?: () => void;
  className?: string;
}

export default function ChatMessenger({
  productId,
  productName,
  onClose,
  className = ''
}: ChatMessengerProps) {
  const { user, isAuthenticated } = useAuth();
  const conversationId = `product-${productId}`;
  const { typingUsers, sendTypingIndicator, connected } = useChatSocket(conversationId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch messages
  const fetchMessages = async () => {
    if (!productId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/chat/${productId}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() && selectedFiles.length === 0) return;
    if (!isAuthenticated) {
      alert('Please sign in to send messages');
      return;
    }

    setSending(true);
    try {
      const formData = new FormData();
      formData.append('content', newMessage.trim());
      formData.append('senderId', user?.id || '');
      formData.append('senderName', user?.username || 'Anonymous');
      
      // Add files if any
      selectedFiles.forEach((file, index) => {
        formData.append(`file${index}`, file);
      });

      const response = await fetch(`/api/chat/${productId}`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (response.ok) {
        const newMsg = await response.json();
        setMessages(prev => [...prev, newMsg]);
        setNewMessage('');
        setSelectedFiles([]);
        scrollToBottom();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      // Max 5MB per file
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} is too large. Max size is 5MB.`);
        return false;
      }
      return true;
    });
    
    setSelectedFiles(prev => [...prev, ...validFiles].slice(0, 5)); // Max 5 files
  };

  // Remove selected file
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch messages on mount
  useEffect(() => {
    fetchMessages();
    
    // Poll for new messages every 10 seconds
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [productId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    if (diffDays < 7) return date.toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' });
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const emojis = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥', '👏', '✨'];

  return (
    <div className={`flex flex-col h-full bg-zinc-900 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-950 border-b border-zinc-800">
        <div>
          <h3 className="text-lg font-semibold text-white">
            {productName || 'Product Chat'}
          </h3>
          <p className="text-xs text-zinc-400">
            {messages.length} message{messages.length !== 1 ? 's' : ''}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            aria-label="Close chat"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-zinc-400">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p>Loading messages...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-zinc-400">
            <div className="text-center">
              <div className="text-4xl mb-2">💬</div>
              <p className="text-sm">No messages yet</p>
              <p className="text-xs mt-1 text-zinc-500">
                Start the conversation!
              </p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwnMessage = message.senderId === user?.id;
            const showAvatar = index === 0 || messages[index - 1].senderId !== message.senderId;

            return (
              <div
                key={message.id}
                className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                {showAvatar ? (
                  <div className="flex-shrink-0">
                    {message.senderAvatar ? (
                      <img
                        src={message.senderAvatar}
                        alt={message.senderName}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-sm font-medium">
                        {message.senderName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-8" />
                )}

                {/* Message Content */}
                <div className={`flex-1 max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                  {showAvatar && (
                    <div className={`flex items-center gap-2 mb-1 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                      <span className="text-xs font-medium text-zinc-400">
                        {message.senderName}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {formatTime(message.createdAt)}
                      </span>
                    </div>
                  )}

                  <div
                    className={`rounded-lg px-4 py-2 ${
                      isOwnMessage
                        ? 'bg-yellow-400 text-black'
                        : 'bg-zinc-800 text-white'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </p>

                    {/* Attachments */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {message.attachments.map((attachment) => (
                          <div key={attachment.id}>
                            {attachment.type === 'image' ? (
                              <img
                                src={attachment.url}
                                alt={attachment.name}
                                className="max-w-full rounded-lg"
                              />
                            ) : (
                              <a
                                href={attachment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 p-2 bg-zinc-700/50 rounded hover:bg-zinc-700 transition-colors"
                              >
                                <Paperclip className="w-4 h-4" />
                                <span className="text-xs">{attachment.name}</span>
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Read Status (for own messages) */}
                  {isOwnMessage && (
                    <div className="flex items-center gap-1 mt-1">
                      {message.read ? (
                        <CheckCheck className="w-4 h-4 text-yellow-400" />
                      ) : (
                        <Check className="w-4 h-4 text-zinc-500" />
                      )}
                    </div>
                  )}

                  {/* Reactions */}
                  {message.reactions && message.reactions.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {message.reactions.map((reaction, i) => (
                        <span
                          key={i}
                          className="text-xs bg-zinc-800 px-2 py-1 rounded-full"
                          title={reaction.userName}
                        >
                          {reaction.emoji}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-4 py-3 bg-zinc-950 border-t border-zinc-800">
        {/* Selected Files Preview */}
        {selectedFiles.length > 0 && (
          <div className="flex gap-2 mb-2 overflow-x-auto pb-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="relative flex-shrink-0 w-20 h-20 bg-zinc-800 rounded-lg overflow-hidden group"
              >
                {file.type.startsWith('image/') ? (
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Paperclip className="w-6 h-6 text-zinc-400" />
                  </div>
                )}
                <button
                  onClick={() => removeFile(index)}
                  className="absolute top-1 right-1 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Row */}
        <div className="flex items-end gap-2">
          {/* File Upload */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors flex-shrink-0"
            aria-label="Attach file"
          >
            <Paperclip className="w-5 h-5 text-zinc-400" />
          </button>

          {/* Emoji Picker Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors flex-shrink-0"
              aria-label="Add emoji"
            >
              <Smile className="w-5 h-5 text-zinc-400" />
            </button>
            
            {showEmojiPicker && (
              <div className="absolute bottom-full mb-2 left-0 bg-zinc-800 rounded-lg p-2 shadow-xl grid grid-cols-5 gap-1">
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      setNewMessage(prev => prev + emoji);
                      setShowEmojiPicker(false);
                      textareaRef.current?.focus();
                    }}
                    className="text-xl hover:bg-zinc-700 rounded p-1 transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Message Input */}
          <textarea
            ref={textareaRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={!isAuthenticated || sending}
            className="flex-1 bg-zinc-800 text-white rounded-lg px-4 py-2 resize-none max-h-32 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 disabled:opacity-50"
            rows={1}
          />

          {/* Send Button */}
          <button
            onClick={sendMessage}
            disabled={(!newMessage.trim() && selectedFiles.length === 0) || sending || !isAuthenticated}
            className="p-2 bg-yellow-400 hover:bg-yellow-300 rounded-lg transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <Send className="w-5 h-5 text-black" />
          </button>
        </div>

        {!isAuthenticated && (
          <p className="text-xs text-zinc-500 mt-2 text-center">
            Please sign in to send messages
          </p>
        )}
      </div>
    </div>
  );
}
