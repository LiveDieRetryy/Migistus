// components/activity/ActivityFeed.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/hooks/useSocket';
import Link from 'next/link';
import { Heart, MessageCircle, UserPlus, Package, TrendingUp, Users } from 'lucide-react';

interface Activity {
  id: string;
  type: 'post' | 'like' | 'comment' | 'follow' | 'product' | 'vote';
  actorId: string;
  actorName: string;
  actorAvatar?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  targetName?: string;
  targetLink?: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

interface ActivityFeedProps {
  userId?: string; // If provided, show only this user's activities
  limit?: number;
  showFilters?: boolean;
  className?: string;
}

export default function ActivityFeed({
  userId,
  limit = 20,
  showFilters = true,
  className = ''
}: ActivityFeedProps) {
  const { user, isAuthenticated } = useAuth();
  const { on, off, connected } = useSocket();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [hasMore, setHasMore] = useState(true);

  // Listen for real-time activity updates
  useEffect(() => {
    if (!connected) return;

    const handleNewActivity = (data: any) => {
      console.log('[ActivityFeed] New activity received:', data);
      
      // Add new activity to the feed
      const newActivity: Activity = {
        id: data.activity.id || `activity-${Date.now()}`,
        type: data.activity.type,
        actorId: data.actorId.toString(),
        actorName: data.activity.actorName || 'User',
        actorAvatar: data.activity.actorAvatar,
        action: getActionText(data.activity.type),
        targetType: data.activity.targetType,
        targetId: data.activity.targetId,
        targetName: data.activity.targetName,
        targetLink: data.activity.targetLink,
        createdAt: data.activity.timestamp || new Date().toISOString(),
        metadata: data.activity.metadata
      };

      setActivities(prev => [newActivity, ...prev].slice(0, limit));
    };

    on('activity:new', handleNewActivity);

    return () => {
      off('activity:new', handleNewActivity);
    };
  }, [connected, on, off, limit]);

  // Helper to get action text
  const getActionText = (type: string): string => {
    switch (type) {
      case 'post': return 'created a post';
      case 'like': return 'liked a post';
      case 'comment': return 'commented on a post';
      case 'follow': return 'started following';
      case 'product': return 'created a product';
      case 'vote': return 'voted on a product';
      default: return 'performed an action';
    }
  };

  // Fetch activities (using posts/followers APIs as data source)
  const fetchActivities = async (offset = 0) => {
    setLoading(true);
    try {
      // Combine data from multiple sources to build activity feed
      const [postsRes, followersRes] = await Promise.all([
        fetch('/api/posts?limit=10', { credentials: 'include' }),
        fetch('/api/followers?limit=10', { credentials: 'include' })
      ]);

      const activities: Activity[] = [];

      // Process posts
      if (postsRes.ok) {
        const postsData = await postsRes.json();
        const posts = postsData.posts || [];
        
        posts.forEach((post: any) => {
          // Post creation activity
          activities.push({
            id: `post-${post.id}`,
            type: 'post',
            actorId: post.userId,
            actorName: post.username,
            actorAvatar: post.userAvatar,
            action: 'created a post',
            targetType: 'post',
            targetId: post.id,
            targetName: post.content.slice(0, 50) + '...',
            targetLink: `/community/social?post=${post.id}`,
            createdAt: post.createdAt,
            metadata: {
              likes: post.likes || 0,
              comments: post.commentCount || 0
            }
          });

          // Like activities
          if (post.likes > 0) {
            // Simplified - in real app, would fetch actual like records
            activities.push({
              id: `like-${post.id}`,
              type: 'like',
              actorId: post.userId,
              actorName: 'Someone',
              action: 'liked a post',
              targetType: 'post',
              targetId: post.id,
              targetName: post.content.slice(0, 50) + '...',
              targetLink: `/community/social?post=${post.id}`,
              createdAt: post.createdAt,
              metadata: { likes: post.likes }
            });
          }
        });
      }

      // Process followers
      if (followersRes.ok) {
        const followersData = await followersRes.json();
        const followers = followersData.followers || [];
        
        followers.slice(0, 5).forEach((follower: any) => {
          activities.push({
            id: `follow-${follower.id}`,
            type: 'follow',
            actorId: follower.followerId,
            actorName: follower.followerName,
            actorAvatar: follower.followerAvatar,
            action: 'started following',
            targetType: 'user',
            targetId: follower.followingId,
            targetName: follower.followingName,
            targetLink: `/profile/${follower.followingId}`,
            createdAt: follower.createdAt
          });
        });
      }

      // Sort by date
      activities.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // Apply filter
      const filtered = filter === 'all' 
        ? activities 
        : activities.filter(a => a.type === filter);

      if (offset === 0) {
        setActivities(filtered.slice(0, limit));
      } else {
        setActivities(prev => [...prev, ...filtered.slice(offset, offset + limit)]);
      }

      setHasMore(filtered.length > offset + limit);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount and when filter changes
  useEffect(() => {
    fetchActivities();

    // Poll for new activities every 30 seconds
    const interval = setInterval(() => fetchActivities(), 30000);
    return () => clearInterval(interval);
  }, [filter, userId]);

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
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Get activity icon
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'post':
        return <MessageCircle className="w-5 h-5" />;
      case 'like':
        return <Heart className="w-5 h-5" />;
      case 'comment':
        return <MessageCircle className="w-5 h-5" />;
      case 'follow':
        return <UserPlus className="w-5 h-5" />;
      case 'product':
        return <Package className="w-5 h-5" />;
      case 'vote':
        return <TrendingUp className="w-5 h-5" />;
      default:
        return <Users className="w-5 h-5" />;
    }
  };

  // Get activity color
  const getActivityColor = (type: string) => {
    switch (type) {
      case 'post':
        return 'bg-blue-500/10 text-blue-400';
      case 'like':
        return 'bg-red-500/10 text-red-400';
      case 'comment':
        return 'bg-green-500/10 text-green-400';
      case 'follow':
        return 'bg-purple-500/10 text-purple-400';
      case 'product':
        return 'bg-yellow-500/10 text-yellow-400';
      case 'vote':
        return 'bg-orange-500/10 text-orange-400';
      default:
        return 'bg-zinc-500/10 text-zinc-400';
    }
  };

  const filterOptions = [
    { value: 'all', label: 'All Activity', icon: '📊' },
    { value: 'post', label: 'Posts', icon: '📝' },
    { value: 'like', label: 'Likes', icon: '❤️' },
    { value: 'comment', label: 'Comments', icon: '💬' },
    { value: 'follow', label: 'Follows', icon: '👥' },
    { value: 'product', label: 'Products', icon: '🎁' },
    { value: 'vote', label: 'Votes', icon: '📈' }
  ];

  return (
    <div className={`bg-zinc-900 rounded-lg border border-zinc-800 ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800">
        <h3 className="text-lg font-semibold text-white">Activity Feed</h3>
        <p className="text-xs text-zinc-400 mt-0.5">
          Recent community activity
        </p>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="px-4 py-3 border-b border-zinc-800 overflow-x-auto">
          <div className="flex gap-2">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  filter === option.value
                    ? 'bg-yellow-400 text-black'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                <span>{option.icon}</span>
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Activities List */}
      <div className="divide-y divide-zinc-800">
        {loading && activities.length === 0 ? (
          <div className="p-8 text-center text-zinc-400">
            <div className="animate-spin w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p>Loading activities...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="p-8 text-center text-zinc-400">
            <div className="text-4xl mb-2">📊</div>
            <p className="text-sm">No activity yet</p>
            <p className="text-xs mt-1 text-zinc-500">
              Start interacting with the community!
            </p>
          </div>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="px-4 py-3 hover:bg-zinc-800/30 transition-colors"
            >
              <div className="flex gap-3">
                {/* Icon */}
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${getActivityColor(
                    activity.type
                  )}`}
                >
                  {getActivityIcon(activity.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-white">
                      <Link
                        href={`/profile/${activity.actorId}`}
                        className="font-semibold hover:text-yellow-400 transition-colors"
                      >
                        {activity.actorName}
                      </Link>
                      <span className="text-zinc-400 mx-1">{activity.action}</span>
                      {activity.targetName && activity.targetLink && (
                        <Link
                          href={activity.targetLink}
                          className="text-yellow-400 hover:text-yellow-300 font-medium transition-colors"
                        >
                          {activity.targetName}
                        </Link>
                      )}
                    </p>
                    <span className="text-xs text-zinc-500 whitespace-nowrap">
                      {formatTime(activity.createdAt)}
                    </span>
                  </div>

                  {/* Metadata */}
                  {activity.metadata && (
                    <div className="flex gap-3 mt-1 text-xs text-zinc-500">
                      {activity.metadata.likes !== undefined && (
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {activity.metadata.likes}
                        </span>
                      )}
                      {activity.metadata.comments !== undefined && (
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" />
                          {activity.metadata.comments}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Avatar */}
                {activity.actorAvatar && (
                  <div className="flex-shrink-0">
                    <img
                      src={activity.actorAvatar}
                      alt={activity.actorName}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Load More */}
        {hasMore && activities.length > 0 && (
          <div className="px-4 py-3">
            <button
              onClick={() => fetchActivities(activities.length)}
              disabled={loading}
              className="w-full px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-zinc-300 transition-colors disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load more'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
