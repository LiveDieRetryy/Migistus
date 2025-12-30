import { useState, useRef, useEffect } from 'react';
import { Check, CheckCheck, Reply, Copy, Edit2, Trash2, MoreVertical, Smile } from 'lucide-react';
import Image from 'next/image';

interface MessageBubbleProps {
  message: {
    id: string;
    senderId: number;
    senderName: string;
    senderAvatar?: string;
    content: string;
    createdAt: string;
    read: boolean;
    edited?: boolean;
    editedAt?: string;
    reactions?: { emoji: string; users: number[] }[];
    replyTo?: {
      id: string;
      senderName: string;
      content: string;
    };
  };
  isOwnMessage: boolean;
  showAvatar: boolean;
  onReply?: (messageId: string) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onDelete?: (messageId: string) => void;
  onEdit?: (messageId: string) => void;
}

const COMMON_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

export default function MessageBubble({
  message,
  isOwnMessage,
  showAvatar,
  onReply,
  onReact,
  onDelete,
  onEdit
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
        setShowReactions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const copyMessage = () => {
    navigator.clipboard.writeText(message.content);
    setShowMenu(false);
  };

  const handleReaction = (emoji: string) => {
    onReact?.(message.id, emoji);
    setShowReactions(false);
    setShowActions(false);
  };

  return (
    <div
      className={`flex gap-2 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} group mb-1`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => !showMenu && !showReactions && setShowActions(false)}
    >
      {/* Avatar */}
      {!isOwnMessage && (
        <div className={`w-8 h-8 flex-shrink-0 ${showAvatar ? 'visible' : 'invisible'}`}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
            {message.senderName ? message.senderName.charAt(0).toUpperCase() : '?'}
          </div>
        </div>
      )}

      {/* Message Content */}
      <div className={`flex flex-col max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
        {/* Reply Preview */}
        {message.replyTo && (
          <div className={`text-xs px-3 py-1 mb-1 rounded-t-lg border-l-2 ${
            isOwnMessage 
              ? 'bg-yellow-500/10 border-yellow-500' 
              : 'bg-zinc-800/50 border-gray-500'
          }`}>
            <div className="font-semibold text-yellow-400">{message.replyTo.senderName}</div>
            <div className="text-gray-400 truncate">{message.replyTo.content}</div>
          </div>
        )}

        {/* Message Bubble */}
        <div className="relative">
          <div
            className={`px-4 py-2 rounded-2xl ${
              isOwnMessage
                ? 'bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-br-sm'
                : 'bg-zinc-800 text-white rounded-bl-sm'
            } shadow-lg`}
          >
            {/* Sender Name (for received messages in groups) */}
            {!isOwnMessage && showAvatar && (
              <div className="text-xs font-semibold text-yellow-400 mb-1">
                {message.senderName}
              </div>
            )}

            {/* Message Text */}
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>

            {/* Timestamp and Read Status */}
            <div className={`flex items-center gap-1 mt-1 text-xs ${
              isOwnMessage ? 'text-yellow-100' : 'text-gray-400'
            }`}>
              <span>{formatTime(message.createdAt)}</span>
              {message.edited && (
                <span className="text-xs italic opacity-70">(edited)</span>
              )}
              {isOwnMessage && (
                message.read ? (
                  <CheckCheck className="w-3 h-3 text-blue-400" />
                ) : (
                  <Check className="w-3 h-3" />
                )
              )}
            </div>
          </div>

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="absolute -bottom-2 left-2 flex gap-1">
              {message.reactions.map((reaction, idx) => (
                <div
                  key={idx}
                  className="bg-zinc-900 border border-zinc-700 rounded-full px-2 py-0.5 text-xs flex items-center gap-1 shadow-lg cursor-pointer hover:scale-110 transition-transform"
                  onClick={() => handleReaction(reaction.emoji)}
                >
                  <span>{reaction.emoji}</span>
                  <span className="text-yellow-400 font-semibold">{reaction.users.length}</span>
                </div>
              ))}
            </div>
          )}

          {/* Quick Actions */}
          {showActions && (
            <div
              className={`absolute top-0 ${isOwnMessage ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} flex items-center gap-1 px-2`}
            >
              {/* React Button */}
              <button
                onClick={() => setShowReactions(!showReactions)}
                className="p-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-gray-400 hover:text-yellow-400 transition-colors"
                title="React"
              >
                <Smile className="w-4 h-4" />
              </button>

              {/* Reply Button */}
              <button
                onClick={() => onReply?.(message.id)}
                className="p-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-gray-400 hover:text-yellow-400 transition-colors"
                title="Reply"
              >
                <Reply className="w-4 h-4" />
              </button>

              {/* More Options */}
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-gray-400 hover:text-yellow-400 transition-colors"
                title="More"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Reaction Picker */}
          {showReactions && (
            <div
              ref={menuRef}
              className={`absolute ${isOwnMessage ? 'right-0' : 'left-0'} top-full mt-2 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl p-2 flex gap-1 z-50`}
            >
              {COMMON_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="text-2xl hover:scale-125 transition-transform p-1 rounded hover:bg-zinc-800"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Context Menu */}
          {showMenu && (
            <div
              ref={menuRef}
              className={`absolute ${isOwnMessage ? 'right-0' : 'left-0'} top-full mt-2 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl overflow-hidden z-50 min-w-[160px]`}
            >
              <button
                onClick={copyMessage}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-zinc-800 transition-colors"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
              {isOwnMessage && (
                <button
                  onClick={() => {
                    onEdit?.(message.id);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-zinc-800 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
              )}
              <button
                onClick={() => {
                  onDelete?.(message.id);
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
