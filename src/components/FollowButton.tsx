import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { followersAPI } from '@/lib/followersAPI';

interface FollowButtonProps {
  userId?: number; // Alias for targetUserId
  username?: string; // Alias for targetUsername
  targetUserId?: number;
  targetUsername?: string;
  initialFollowersCount?: number;
  onFollowChange?: (isFollowing: boolean, newCount: number) => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'minimal';
}

export default function FollowButton({ 
  userId,
  username,
  targetUserId, 
  targetUsername,
  initialFollowersCount = 0,
  onFollowChange,
  size = 'md',
  variant = 'default'
}: FollowButtonProps) {
  // Support both naming conventions
  const actualUserId = targetUserId || userId;
  const actualUsername = targetUsername || username;
  
  const { user, isAuthenticated } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(initialFollowersCount);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && user && actualUserId && user.id !== actualUserId) {
      checkFollowStatus();
    }
  }, [mounted, user, actualUserId]);

  const checkFollowStatus = async () => {
    if (!user || !actualUserId) return;
    
    try {
      const { isFollowing: following } = await followersAPI.isFollowing(actualUserId, user.id);
      setIsFollowing(following);
      
      const stats = await followersAPI.getFollowStats(actualUserId);
      setFollowersCount(stats.followers);
    } catch (error) {
      console.error('Failed to check follow status:', error);
    }
  };

  const handleFollowClick = async () => {
    if (!isAuthenticated || !user || !actualUserId || user.id === actualUserId || isLoading) return;

    setIsLoading(true);

    try {
      if (isFollowing) {
        await followersAPI.unfollow(actualUserId);
        setIsFollowing(false);
        setFollowersCount(prev => Math.max(0, prev - 1));
      } else {
        await followersAPI.follow(actualUserId);
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
      }
      
      const newFollowing = !isFollowing;
      const newCount = newFollowing ? followersCount + 1 : Math.max(0, followersCount - 1);
      
      onFollowChange?.(newFollowing, newCount);

      // Trigger activity tracking
      const { activityTracker } = await import('@/utils/activityTracker');
      if (newFollowing) {
        activityTracker.trackFollow(actualUserId, actualUsername || 'User');
      } else {
        activityTracker.trackUnfollow(actualUserId, actualUsername || 'User');
      }
    } catch (error) {
      console.error('Failed to update follow status:', error);
      // Revert state on error
      checkFollowStatus();
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted || !isAuthenticated || !user || !actualUserId || user.id === actualUserId) {
    return null;
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'px-3 py-1.5 text-sm';
      case 'lg': return 'px-6 py-3 text-lg';
      default: return 'px-4 py-2 text-base';
    }
  };

  const getVariantClasses = () => {
    if (variant === 'outline') {
      return isFollowing
        ? 'border-2 border-gray-500 text-gray-400 hover:border-red-500 hover:text-red-400 hover:bg-red-900/20'
        : 'border-2 border-blue-500 text-blue-400 hover:border-blue-400 hover:bg-blue-900/20';
    }
    
    if (variant === 'minimal') {
      return isFollowing
        ? 'text-gray-400 hover:text-red-400 underline'
        : 'text-blue-400 hover:text-blue-300 underline';
    }
    
    // Default variant
    return isFollowing
      ? 'bg-gray-600 hover:bg-red-600 text-white'
      : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white';
  };

  const buttonText = () => {
    if (isLoading) return '...';
    if (variant === 'minimal') return isFollowing ? 'Unfollow' : 'Follow';
    return isFollowing ? '👥 Following' : '👥 Follow';
  };

  return (
    <button
      onClick={handleFollowClick}
      disabled={isLoading}
      className={`
        ${getSizeClasses()}
        ${getVariantClasses()}
        font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
        ${variant !== 'minimal' ? 'shadow-lg' : ''}
      `}
      title={isFollowing ? `Unfollow ${actualUsername || 'user'}` : `Follow ${actualUsername || 'user'}`}
    >
      {buttonText()}
    </button>
  );
}
