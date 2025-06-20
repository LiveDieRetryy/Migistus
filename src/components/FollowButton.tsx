import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { UserStorage3 as UserStorage } from '@/utils/userStorage';

interface FollowButtonProps {
  targetUserId: number;
  targetUsername: string;
  initialFollowersCount?: number;
  onFollowChange?: (isFollowing: boolean, newCount: number) => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'minimal';
}

export default function FollowButton({ 
  targetUserId, 
  targetUsername,
  initialFollowersCount = 0,
  onFollowChange,
  size = 'md',
  variant = 'default'
}: FollowButtonProps) {
  const { user, isAuthenticated } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(initialFollowersCount);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && user && user.id !== targetUserId) {
      // Check if current user is following target user
      const following = UserStorage.isFollowing(user.id, targetUserId);
      setIsFollowing(following);
      
      // Get current followers count
      const count = UserStorage.getUserFollowers(targetUserId);
      setFollowersCount(count);
    }
  }, [mounted, user, targetUserId]);

  // Listen for live follower updates
  useEffect(() => {
    if (!mounted) return;

    const handleFollowerUpdate = (event: CustomEvent) => {
      const { followingId, action } = event.detail;
      
      if (followingId === targetUserId) {
        // Update followers count for this user
        const newCount = UserStorage.getUserFollowers(targetUserId);
        setFollowersCount(newCount);
        
        // If current user was involved, update following status
        if (user && event.detail.followerId === user.id) {
          setIsFollowing(action === 'follow');
          onFollowChange?.(action === 'follow', newCount);
        }
      }
    };

    window.addEventListener('followerUpdate', handleFollowerUpdate as EventListener);
    
    return () => {
      window.removeEventListener('followerUpdate', handleFollowerUpdate as EventListener);
    };
  }, [mounted, user, targetUserId, onFollowChange]);

  const handleFollowClick = async () => {
    if (!isAuthenticated || !user || user.id === targetUserId || isLoading) return;

    setIsLoading(true);

    try {
      let success = false;
      
      if (isFollowing) {
        success = UserStorage.unfollowUser(user.id, targetUserId);
      } else {
        success = UserStorage.followUser(user.id, targetUserId);
      }      if (success) {
        const newIsFollowing = !isFollowing;
        const newCount = UserStorage.getUserFollowers(targetUserId);
        
        setIsFollowing(newIsFollowing);
        setFollowersCount(newCount);
        onFollowChange?.(newIsFollowing, newCount);        // Dispatch follower update events for real-time UI updates
        window.dispatchEvent(new CustomEvent('followerUpdate', {
          detail: { 
            followerId: user.id,
            followingId: targetUserId,
            action: newIsFollowing ? 'follow' : 'unfollow',
            targetUserId, // Keep for backward compatibility
            isFollowing: newIsFollowing,
            newCount 
          }
        }));

        // Also dispatch for following count updates
        window.dispatchEvent(new CustomEvent('followingUpdate', {
          detail: { 
            userId: user.id,
            targetUserId 
          }
        }));

        // Trigger activity tracking with usernames
        const { activityTracker } = await import('@/utils/activityTracker');
        if (newIsFollowing) {
          activityTracker.trackFollow(targetUserId, targetUsername);
        } else {
          activityTracker.trackUnfollow(targetUserId, targetUsername);
        }
      }
    } catch (error) {
      console.error('Failed to update follow status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted || !isAuthenticated || !user || user.id === targetUserId) {
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
      title={isFollowing ? `Unfollow ${targetUsername}` : `Follow ${targetUsername}`}
    >
      {buttonText()}
    </button>
  );
}
