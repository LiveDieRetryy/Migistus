import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { SocialPost, SocialPostsStorage } from '@/utils/socialPostsStorage';
import Image from 'next/image';
import Link from 'next/link';
import ImageModal from './ImageModal';

interface PostCardProps {
  post: SocialPost;
  onUpdate?: (updatedPost: SocialPost) => void;
  onDelete?: (postId: number) => void;
}

export default function PostCard({ post, onUpdate, onDelete }: PostCardProps) {
  const { user, isAuthenticated } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isLiked, setIsLiked] = useState(user ? post.likedBy.includes(user.id) : false);
  const [localPost, setLocalPost] = useState(post);
  const [imageModal, setImageModal] = useState<{
    isOpen: boolean;
    images: string[];
    initialIndex: number;
  }>({
    isOpen: false,
    images: [],
    initialIndex: 0
  });

  const createSlug = (username: string) => {
    return username
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const getTierColor = (tier: string = "Initiate") => {
    switch (tier) {
      case "MIGISTUS": return "from-yellow-400 to-yellow-600";
      case "Guild": return "from-purple-400 to-purple-600";
      default: return "from-gray-400 to-gray-600";
    }
  };

  const getTierIcon = (tier: string = "Initiate") => {
    switch (tier) {
      case "MIGISTUS": return "👑";
      case "Guild": return "⚔️";
      default: return "🛡️";
    }
  };

  const handleLike = () => {
    if (!isAuthenticated || !user) return;

    const success = SocialPostsStorage.likePost(localPost.id, user.id);
    if (success) {
      const newIsLiked = !isLiked;
      setIsLiked(newIsLiked);
      
      const updatedPost = {
        ...localPost,
        likes: newIsLiked ? localPost.likes + 1 : Math.max(0, localPost.likes - 1),
        likedBy: newIsLiked 
          ? [...localPost.likedBy, user.id]
          : localPost.likedBy.filter(id => id !== user.id)
      };
      
      setLocalPost(updatedPost);
      onUpdate?.(updatedPost);
    }
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !user || !commentText.trim()) return;

    const success = SocialPostsStorage.addComment(localPost.id, {
      userId: user.id,
      username: user.username,
      content: commentText.trim()
    });

    if (success) {
      const updatedPost = {
        ...localPost,
        comments: localPost.comments + 1,
        commentsList: [
          ...localPost.commentsList,
          {
            id: Date.now(),
            userId: user.id,
            username: user.username,
            content: commentText.trim(),
            timestamp: new Date().toISOString(),
            likes: 0,
            likedBy: [],
            replies: []
          }
        ]
      };
      
      setLocalPost(updatedPost);
      setCommentText('');
      onUpdate?.(updatedPost);
    }
  };

  const handleShare = () => {
    if (!isAuthenticated || !user) return;

    const success = SocialPostsStorage.sharePost(localPost.id, user.id);
    if (success) {
      const updatedPost = {
        ...localPost,
        shares: localPost.shares + 1,
        sharedBy: [...localPost.sharedBy, user.id]
      };
      
      setLocalPost(updatedPost);
      onUpdate?.(updatedPost);
    }
  };
  const handleDelete = () => {
    if (!user || user.id !== localPost.userId) return;
    
    if (confirm('Are you sure you want to delete this post?')) {
      const success = SocialPostsStorage.deletePost(localPost.id, user.id);
      if (success) {
        onDelete?.(localPost.id);
      }
    }
  };

  const handleImageClick = (index: number) => {
    if (!localPost.images || localPost.images.length === 0) return;
    
    setImageModal({
      isOpen: true,
      images: localPost.images,
      initialIndex: index
    });
  };

  const closeImageModal = () => {
    setImageModal({
      isOpen: false,
      images: [],
      initialIndex: 0
    });
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - postTime.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return postTime.toLocaleDateString();
  };

  const renderContent = (content: string) => {
    // Simple regex to highlight hashtags and mentions
    return content
      .split(/(\s+)/)
      .map((word, index) => {
        if (word.startsWith('#')) {
          return (
            <span key={index} className="text-blue-400 hover:text-blue-300 cursor-pointer">
              {word}
            </span>
          );
        }
        if (word.startsWith('@')) {
          return (
            <span key={index} className="text-yellow-400 hover:text-yellow-300 cursor-pointer">
              {word}
            </span>
          );
        }
        return word;
      });
  };

  return (
    <div className="bg-zinc-900/50 border border-yellow-500/20 rounded-2xl p-6 shadow-lg hover:border-yellow-400/30 transition-colors">
      {/* Post Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link href={`/account/profile/${createSlug(localPost.username)}`}>
            <div className="w-12 h-12 rounded-full border-2 border-yellow-400/30 hover:border-yellow-400/50 transition-colors overflow-hidden bg-zinc-700 cursor-pointer">
              <Image
                src={localPost.userAvatar || "/Icons/New Member.png"}
                alt={localPost.username}
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            </div>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Link 
                href={`/account/profile/${createSlug(localPost.username)}`}
                className="font-semibold text-white hover:text-yellow-400 transition-colors"
              >
                {localPost.username}
              </Link>
              <span className={`inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r ${getTierColor(localPost.userTier)} rounded-full text-xs font-semibold text-white`}>
                {getTierIcon(localPost.userTier)} {localPost.userTier}
              </span>
              {localPost.pinned && (
                <span className="text-yellow-400 text-sm" title="Pinned post">📌</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>{formatTimeAgo(localPost.timestamp)}</span>
              {localPost.edited && (
                <span className="text-gray-500">(edited)</span>
              )}
              <span className="text-xs">
                {localPost.visibility === 'public' && '🌍'}
                {localPost.visibility === 'followers' && '👥'}
                {localPost.visibility === 'private' && '🔒'}
              </span>
            </div>
          </div>
        </div>

        {/* Post Options */}
        {user && user.id === localPost.userId && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-900/20 transition-colors"
              title="Delete post"
            >
              🗑️
            </button>
          </div>
        )}
      </div>

      {/* Post Content */}
      <div className="mb-4">
        <p className="text-white leading-relaxed whitespace-pre-wrap">
          {renderContent(localPost.content)}
        </p>        {/* Post Images */}
        {localPost.images && localPost.images.length > 0 && (
          <div className={`mt-4 grid gap-3 ${
            localPost.images.length === 1 ? 'grid-cols-1' :
            localPost.images.length === 2 ? 'grid-cols-2' :
            'grid-cols-2 md:grid-cols-3'
          }`}>
            {localPost.images.map((image, index) => (
              <div 
                key={index} 
                className="relative group cursor-pointer overflow-hidden rounded-lg"
                onClick={() => handleImageClick(index)}
              >
                <img
                  src={image}
                  alt={`Post image ${index + 1}`}
                  className="w-full h-48 object-cover border border-zinc-600 hover:border-yellow-400/50 transition-all duration-200 group-hover:scale-105"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/50 backdrop-blur-sm rounded-full p-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </div>                {/* Image counter for multiple images */}
                {localPost.images && localPost.images.length > 1 && (
                  <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
                    {index + 1}/{localPost.images.length}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tags */}
        {localPost.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {localPost.tags.map((tag, index) => (
              <span key={index} className="px-2 py-1 bg-blue-600/20 border border-blue-500/30 rounded-full text-xs text-blue-400">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Post Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-zinc-700">
        <div className="flex items-center gap-6">
          <button
            onClick={handleLike}
            disabled={!isAuthenticated}
            className={`flex items-center gap-2 text-sm transition-colors ${
              isLiked ? 'text-red-400 hover:text-red-300' : 'text-gray-400 hover:text-red-400'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <span className="text-lg">{isLiked ? '❤️' : '🤍'}</span>
            <span>{localPost.likes}</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-blue-400 transition-colors"
          >
            <span className="text-lg">💬</span>
            <span>{localPost.comments}</span>
          </button>

          <button
            onClick={handleShare}
            disabled={!isAuthenticated}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-lg">🔄</span>
            <span>{localPost.shares}</span>
          </button>
        </div>

        <div className="text-xs text-gray-500">
          {localPost.likes + localPost.comments + localPost.shares} engagements
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-6 pt-4 border-t border-zinc-700">
          {/* Add Comment */}
          {isAuthenticated && user && (
            <form onSubmit={handleComment} className="mb-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full border border-yellow-400/30 overflow-hidden bg-zinc-700 flex-shrink-0">
                  <Image
                    src="/Icons/New Member.png"
                    alt="Your avatar"
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-gray-400 focus:border-yellow-400 focus:outline-none text-sm"
                  />
                  <button
                    type="submit"
                    disabled={!commentText.trim()}
                    className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-600 disabled:opacity-50 text-black font-semibold rounded-lg transition-colors text-sm"
                  >
                    Post
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Comments List */}
          <div className="space-y-3">
            {localPost.commentsList.slice(0, 5).map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full border border-yellow-400/30 overflow-hidden bg-zinc-700 flex-shrink-0">
                  <Image
                    src={comment.userAvatar || "/Icons/New Member.png"}
                    alt={comment.username}
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <div className="bg-zinc-800/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white text-sm">{comment.username}</span>
                      <span className="text-xs text-gray-400">{formatTimeAgo(comment.timestamp)}</span>
                    </div>
                    <p className="text-sm text-gray-300">{comment.content}</p>
                  </div>
                </div>
              </div>
            ))}
            
            {localPost.commentsList.length > 5 && (
              <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                View all {localPost.commentsList.length} comments
              </button>
            )}
          </div>        </div>
      )}

      {/* Image Modal */}
      <ImageModal
        isOpen={imageModal.isOpen}
        images={imageModal.images}
        initialIndex={imageModal.initialIndex}
        onClose={closeImageModal}
      />
    </div>
  );
}
