import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { socialAPI, Post, Comment } from '@/lib/socialAPI';
import Image from 'next/image';
import Link from 'next/link';
import ImageModal from './ImageModal';

interface PostCardProps {
  post: Post;
  onUpdate?: (updatedPost: Post) => void;
  onDelete?: (postId: number) => void;
}

export default function PostCard({ post, onUpdate, onDelete }: PostCardProps) {
  const { user, isAuthenticated } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [localPost, setLocalPost] = useState(post);
  const [isLoading, setIsLoading] = useState(false);
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

  // Load comments when toggled
  useEffect(() => {
    if (showComments && comments.length === 0) {
      loadComments();
    }
  }, [showComments]);

  const loadComments = async () => {
    try {
      const { comments: loadedComments } = await socialAPI.getComments(localPost.id);
      setComments(loadedComments);
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated || !user) return;

    setIsLoading(true);
    try {
      const isCurrentlyLiked = localPost.isLiked;
      
      if (isCurrentlyLiked) {
        const { likesCount } = await socialAPI.unlikePost(localPost.id);
        setLocalPost(prev => ({
          ...prev,
          likes_count: likesCount,
          isLiked: false
        }));
      } else {
        const { likesCount } = await socialAPI.likePost(localPost.id);
        setLocalPost(prev => ({
          ...prev,
          likes_count: likesCount,
          isLiked: true
        }));
      }
      
      onUpdate?.({ ...localPost, likes_count: localPost.likes_count });
    } catch (error) {
      console.error('Failed to like/unlike post:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !user || !commentText.trim()) return;

    setIsLoading(true);
    try {
      const { comment: newComment } = await socialAPI.createComment(
        localPost.id,
        commentText.trim()
      );

      setComments(prev => [...prev, newComment]);
      setLocalPost(prev => ({
        ...prev,
        comments_count: prev.comments_count + 1
      }));
      setCommentText('');
      
      onUpdate?.({ ...localPost, comments_count: localPost.comments_count + 1 });
    } catch (error) {
      console.error('Failed to post comment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!isAuthenticated || !user) return;

    try {
      await socialAPI.deleteComment(localPost.id, commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      setLocalPost(prev => ({
        ...prev,
        comments_count: Math.max(0, prev.comments_count - 1)
      }));
      
      onUpdate?.({ ...localPost, comments_count: Math.max(0, localPost.comments_count - 1) });
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };
  
  const handleDelete = async () => {
    if (!user || user.id !== localPost.user_id) return;
    
    if (confirm('Are you sure you want to delete this post?')) {
      try {
        await socialAPI.deletePost(localPost.id);
        onDelete?.(localPost.id);
      } catch (error) {
        console.error('Failed to delete post:', error);
      }
    }
  };

  const handleImageClick = (index: number) => {
    if (!localPost.image_url) return;
    
    setImageModal({
      isOpen: true,
      images: [localPost.image_url],
      initialIndex: 0
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
                alt={localPost.username || 'User'}
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            </div>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Link 
                href={`/account/profile/${createSlug(localPost.username || 'user')}`}
                className="font-semibold text-white hover:text-yellow-400 transition-colors"
              >
                {localPost.username || 'User'}
              </Link>
              <span className="text-yellow-400 text-xs">{getTierIcon('Initiate')}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>{formatTimeAgo(localPost.created_at)}</span>
              {localPost.updated_at && localPost.updated_at !== localPost.created_at && (
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
        {user && user.id === localPost.user_id && (
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
        {localPost.image_url && (
          <div className="mt-4">
            <div 
              className="relative group cursor-pointer overflow-hidden rounded-lg"
              onClick={() => handleImageClick(0)}
            >
              <img
                src={localPost.image_url}
                alt="Post image"
                className="w-full h-auto max-h-96 object-cover border border-zinc-600 hover:border-yellow-400/50 transition-all duration-200 group-hover:scale-105"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/50 backdrop-blur-sm rounded-full p-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Post Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-zinc-700">
        <div className="flex items-center gap-6">
          <button
            onClick={handleLike}
            disabled={!isAuthenticated || isLoading}
            className={`flex items-center gap-2 text-sm transition-colors ${
              localPost.isLiked ? 'text-red-400 hover:text-red-300' : 'text-gray-400 hover:text-red-400'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <span className="text-lg">{localPost.isLiked ? '❤️' : '🤍'}</span>
            <span>{localPost.likes_count || 0}</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-blue-400 transition-colors"
          >
            <span className="text-lg">💬</span>
            <span>{localPost.comments_count || 0}</span>
          </button>
        </div>

        <div className="text-xs text-gray-500">
          {(localPost.likes_count || 0) + (localPost.comments_count || 0)} engagements
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
                    disabled={!commentText.trim() || isLoading}
                    className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-600 disabled:opacity-50 text-black font-semibold rounded-lg transition-colors text-sm"
                  >
                    {isLoading ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Comments List */}
          <div className="space-y-3">
            {comments.slice(0, 5).map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full border border-yellow-400/30 overflow-hidden bg-zinc-700 flex-shrink-0">
                  <Image
                    src={comment.userAvatar || "/Icons/New Member.png"}
                    alt={comment.username || 'User'}
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <div className="bg-zinc-800/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-sm">{comment.username || 'User'}</span>
                        <span className="text-xs text-gray-400">{formatTimeAgo(comment.created_at)}</span>
                      </div>
                      {user && user.id === comment.user_id && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-300">{comment.content}</p>
                  </div>
                </div>
              </div>
            ))}
            
            {comments.length > 5 && (
              <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                View all {comments.length} comments
              </button>
            )}
            
            {comments.length === 0 && showComments && (
              <p className="text-center text-gray-400 text-sm py-4">
                No comments yet. Be the first to comment!
              </p>
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
