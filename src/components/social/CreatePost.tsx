import { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { socialAPI, Post } from '@/lib/socialAPI';
import Image from 'next/image';

interface CreatePostProps {
  onPostCreated?: (post: Post) => void;
  placeholder?: string;
}

export default function CreatePost({ onPostCreated, placeholder = "What's on your mind?" }: CreatePostProps) {
  const { user, isAuthenticated } = useAuth();
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<'public' | 'followers' | 'private'>('public');
  const [isPosting, setIsPosting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          setImages(prev => [...prev, dataUrl]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !user || !content.trim()) return;

    setIsPosting(true);
    setError('');
    try {
      const { post: newPost } = await socialAPI.createPost({
        content: content.trim(),
        imageUrl: images[0], // Backend currently supports single image
        visibility,
        type: 'post'
      });

      // Clear form
      setContent('');
      setImages([]);
      setVisibility('public');
      
      // Notify parent component
      onPostCreated?.(newPost);
      
      // Track activity
      const { activityTracker } = await import('@/utils/activityTracker');
      activityTracker.trackSocialPost(content, 'text');

    } catch (error: any) {
      console.error('Failed to create post:', error);
      setError(error.message || 'Failed to create post');
    } finally {
      setIsPosting(false);
    }
  };

  const extractTags = (text: string): string[] => {
    const tagRegex = /#[\w]+/g;
    const matches = text.match(tagRegex);
    return matches ? matches.map(tag => tag.substring(1).toLowerCase()) : [];
  };

  const insertEmoji = (emoji: string) => {
    setContent(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-zinc-900/50 border border-yellow-500/20 rounded-2xl p-6 text-center">
        <p className="text-gray-400">Sign in to create posts and engage with the community</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/50 border border-yellow-500/20 rounded-2xl p-6 shadow-lg">
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}
      
      <div className="flex items-start gap-4">
        {/* User Avatar */}
        <div className="w-12 h-12 rounded-full border-2 border-yellow-400/30 overflow-hidden bg-zinc-700 flex-shrink-0">
          <Image
            src="/Icons/New Member.png"
            alt="Your avatar"
            width={48}
            height={48}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Post Creation Form */}
        <form onSubmit={handleSubmit} className="flex-1">
          <div className="space-y-4">
            {/* Content Input */}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={placeholder}
              className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-600 rounded-xl text-white placeholder-gray-400 focus:border-yellow-400 focus:outline-none resize-none"
              rows={3}
              maxLength={1000}
            />

            {/* Image Previews */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-zinc-600"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-400 text-white rounded-full flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Post Options */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Image Upload */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-gray-300 hover:text-white transition-colors"
                  title="Add images"
                >
                  📷
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />

                {/* Emoji Picker */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-gray-300 hover:text-white transition-colors"
                    title="Add emoji"
                  >
                    😊
                  </button>
                  {showEmojiPicker && (
                    <div className="absolute bottom-12 left-0 bg-zinc-800 border border-zinc-600 rounded-lg p-3 shadow-lg z-10">
                      <div className="grid grid-cols-6 gap-2">
                        {['😊', '😂', '❤️', '👍', '🔥', '💯', '🚀', '⭐', '🎉', '💪', '🙌', '👏'].map(emoji => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => insertEmoji(emoji)}
                            className="p-2 hover:bg-zinc-700 rounded transition-colors"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Visibility Selector */}
                <div className="relative group">
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value as any)}
                    className="px-3 py-1 bg-zinc-700 border border-zinc-600 rounded-lg text-white text-sm focus:border-yellow-400 focus:outline-none cursor-pointer"
                    title="Choose who can see this post"
                  >
                    <option value="public">🌍 Public</option>
                    <option value="followers">👥 Followers Only</option>
                    <option value="private">🔒 Private</option>
                  </select>
                  
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-10 w-64">
                    <div className="bg-zinc-800 border border-zinc-600 rounded-lg p-3 shadow-xl text-xs">
                      <div className="space-y-2">
                        <div>
                          <span className="font-semibold text-white">🌍 Public:</span>
                          <span className="text-gray-300"> Visible to everyone in Worldwide Guild</span>
                        </div>
                        <div>
                          <span className="font-semibold text-white">👥 Followers:</span>
                          <span className="text-gray-300"> Only your followers can see this</span>
                        </div>
                        <div>
                          <span className="font-semibold text-white">🔒 Private:</span>
                          <span className="text-gray-300"> Only you can see this</span>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-zinc-600 text-gray-400">
                        Current: <span className="text-yellow-400 font-semibold">
                          {visibility === 'public' ? 'Public' : visibility === 'followers' ? 'Followers Only' : 'Private'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Character Count & Submit */}
              <div className="flex items-center gap-3">
                <span className={`text-sm ${content.length > 800 ? 'text-red-400' : 'text-gray-400'}`}>
                  {content.length}/1000
                </span>
                <button
                  type="submit"
                  disabled={!content.trim() || isPosting}
                  className="px-6 py-2 bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-600 disabled:opacity-50 text-black font-semibold rounded-lg transition-colors"
                >
                  {isPosting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
