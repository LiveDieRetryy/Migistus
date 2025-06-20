import { useState, useEffect } from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { Search, Users, TrendingUp, MessageCircle, Heart, Share2, MoreHorizontal, UserPlus, Sparkles, Edit3, Send, ChevronDown } from "lucide-react";
import MainNavbar from "@/components/nav/MainNavbar";
import { useAuth } from "@/context/AuthContext";
import { UserStorage3 as UserStorage } from "@/utils/userStorage";
import { activityTracker } from "@/utils/activityTracker";
import FollowButton from '@/components/FollowButton';
import { SocialPostsStorage } from "@/utils/socialPostsStorage";

interface User {
  id: number;
  username: string;
  email: string;
  tier?: string;
  avatar?: string;
  bio?: string;
  joinedDate?: string;
  country?: string;
  location?: {
    country?: string;
    city?: string;
  };
  stats?: {
    followers: number;
    following: number;
    totalVotes: number;
    totalPledges: number;
    dropsJoined?: number;
  };
}

interface AuthUser {
  id: number;
  username: string;
  email: string;
  tier?: string;
  avatar?: string;
}

interface Post {
  id: string;
  userId: number;
  username: string;
  avatar?: string;
  tier?: string;
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
  type: 'vote' | 'pledge' | 'comment' | 'general';
  productName?: string;
  isLiked?: boolean;
}

interface Activity {
  type: string;
  timestamp: string;
  productName?: string;
  [key: string]: any;
}

export default function CommunityPage() {  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'feed' | 'discover' | 'members'>('feed');
  const [feedFilter, setFeedFilter] = useState<'personal' | 'local' | 'worldwide'>('personal');
  const [posts, setPosts] = useState<Post[]>([]);
  const [newUsers, setNewUsers] = useState<User[]>([]);
  const [allMembers, setAllMembers] = useState<User[]>([]);  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'active' | 'name'>('newest');
  const [loading, setLoading] = useState(true);  const [following, setFollowing] = useState<number[]>([]);  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [isGuildModalOpen, setIsGuildModalOpen] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);  useEffect(() => {
    loadCommunityData();
  }, [user]);  // Listen for real-time post updates from profile pages
  useEffect(() => {
    const handleNewPost = async () => {
      if (user && !loading) {
        const refreshedPosts = await generateLiveFeedPosts();
        setPosts(refreshedPosts);
      }
    };

    // Listen for custom event when a new post is created
    window.addEventListener('newSocialPost', handleNewPost);
    
    return () => {
      window.removeEventListener('newSocialPost', handleNewPost);
    };
  }, [user, loading, feedFilter, following]);

  // Listen for follower updates to refresh following list and feed
  useEffect(() => {    const handleFollowerUpdate = async (event: Event) => {
      if (!user) return;
      
      const customEvent = event as CustomEvent;
      const { followerId, followingId, action } = customEvent.detail;
      
      // If current user followed/unfollowed someone, update following list
      if (followerId === user.id) {
        const updatedFollowingList = UserStorage.getFollowingList(user.id) || [];
        const updatedFollowingIds = updatedFollowingList.map((item: any) => {
          if (typeof item === 'object' && item.userId) {
            return item.userId;
          } else if (typeof item === 'object' && item.id) {
            return item.id;
          } else if (typeof item === 'number') {
            return item;
          } else {
            return parseInt(item);
          }
        }).filter((id: number) => !isNaN(id));
        
        setFollowing(updatedFollowingIds);
        
        // Refresh feed to show/hide posts based on new following status
        if (!loading) {
          const refreshedPosts = await generateLiveFeedPosts();
          setPosts(refreshedPosts);
        }
      }
    };    // Listen for follower update events
    window.addEventListener('followerUpdate', handleFollowerUpdate);
    
    return () => {
      window.removeEventListener('followerUpdate', handleFollowerUpdate);
    };
  }, [user, loading, feedFilter]);

  // Periodic refresh to catch any missed updates
  useEffect(() => {
    if (!user || loading) return;

    const refreshInterval = setInterval(async () => {
      const refreshedPosts = await generateLiveFeedPosts();
      setPosts(refreshedPosts);
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(refreshInterval);
  }, [user, loading, feedFilter, following]);

  // Keyboard and click-outside handling for modals
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsGuildModalOpen(false);
        setIsPostModalOpen(false);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      // Close guild modal if clicking outside
      if (isGuildModalOpen && !target.closest('.guild-modal-content')) {
        setIsGuildModalOpen(false);
      }
      
      // Close post modal if clicking outside
      if (isPostModalOpen && !target.closest('.post-modal-content')) {
        setIsPostModalOpen(false);
      }
    };

    if (isGuildModalOpen || isPostModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };  }, [isGuildModalOpen, isPostModalOpen]);

  const loadCommunityData = async () => {
    try {
      // Load real following list
      if (user) {// Ensure user profile exists
        let userProfile = UserStorage.getUserProfile(user.id);
        if (!userProfile) {
          const authUser = user as AuthUser;
          userProfile = {
            id: user.id,
            username: user.username,
            email: user.email,
            tier: authUser.tier || 'Initiate',
            avatar: authUser.avatar,
            joinedDate: new Date().toISOString(),
            stats: {
              followers: 0,
              following: 0,
              totalVotes: 0,
              totalPledges: 0,
              dropsJoined: 0
            }          };
          UserStorage.setUserProfile(user.id, userProfile);
        }        // Get following list using the correct UserStorage method
        const followingList = UserStorage.getFollowingList(user.id) || [];
        
        // Extract IDs - the method returns objects with userId property
        const followingIds = followingList.map((item: any) => {
          if (typeof item === 'object' && item.userId) {
            return item.userId;
          } else if (typeof item === 'object' && item.id) {
            return item.id;
          } else if (typeof item === 'number') {
            return item;
          } else {
            return parseInt(item);
          }
        }).filter((id: number) => !isNaN(id));

        setFollowing(followingIds);
      }

      // Load posts based on current filter
      const feedPosts = await generateLiveFeedPosts();
      setPosts(feedPosts);

      // Load new users
      const recentUsers = getNewUsers();
      setNewUsers(recentUsers);

      // Load all community members
      const members = getAllCommunityMembers();
      setAllMembers(members);

    } catch (error) {
      console.error('Error loading community data:', error);
    } finally {
      setLoading(false);
    }
  };
  const generateLiveFeedPosts = async (): Promise<Post[]> => {
    if (!user) return [];

    const livePosts: Post[] = [];
    let targetUsers: number[] = [];
    
    // Determine which users to include based on filter
    switch (feedFilter) {      case 'personal':
        // Include user's own posts, plus posts from people they follow
        const followingUsers = [...following];
        // Ensure no duplicates and current user is always included
        targetUsers = [user.id, ...followingUsers.filter(id => id !== user.id)];
        break;
          case 'local':
        // Include users from the same country
        const userProfile = UserStorage.getUserProfile(user.id);
        const userCountry = userProfile?.country || userProfile?.location?.country;
        if (userCountry) {
          const allUsers = getAllCommunityMembers();
          targetUsers = allUsers
            .filter(member => {
              const memberProfile = UserStorage.getUserProfile(member.id);
              const memberCountry = memberProfile?.country || memberProfile?.location?.country;
              return memberCountry === userCountry;
            })
            .map(member => member.id);
          // Ensure current user is included
          if (!targetUsers.includes(user.id)) {
            targetUsers.push(user.id);
          }
        } else {
          // Fallback to personal if no country info
          targetUsers = [user.id, ...following];
        }
        break;
          case 'worldwide':
        // Include all users
        const allUsers = getAllCommunityMembers();
        targetUsers = allUsers.map(member => member.id);
        // Ensure current user is included
        if (!targetUsers.includes(user.id)) {
          targetUsers.push(user.id);
        }
        break;
    }    // Generate posts from user activities AND social posts
    targetUsers.forEach(userId => {
      try {
        const userProfile = UserStorage.getUserProfile(userId);
        if (!userProfile) {
          return;
        }

        // Filter out test accounts from posts
        if (isTestAccount(userProfile)) {
          return;
        }

        // 1. Get posts from UserStorage (legacy post activities)
        const userActivity = UserStorage.getUserActivity(userId) || [];
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentActivities = userActivity
          .filter((activity: any) => {
            const activityDate = new Date(activity.timestamp);
            const isRecent = activityDate >= thirtyDaysAgo;
            const isPostType = activity.type === 'post';
            
            return isRecent && isPostType;
          })
          .slice(0, 10);

        // Convert legacy activities to posts
        recentActivities.forEach((activity: any, index: number) => {
          const post: Post = {
            id: `legacy_${userId}_${activity.timestamp}_${index}`,
            userId: userId,
            username: userProfile.username,
            avatar: userProfile.avatar,
            tier: userProfile.tier || 'Initiate',
            content: activity.content || `${userProfile.username} shared something with the community`,
            timestamp: activity.timestamp,
            likes: Math.floor(Math.random() * 20),
            comments: Math.floor(Math.random() * 10),
            shares: Math.floor(Math.random() * 5),
            type: 'general',
            isLiked: false
          };
          
          livePosts.push(post);
        });

        // 2. Get posts from SocialPostsStorage (new social posts from profile)
        const socialPosts = SocialPostsStorage.getUserPosts(userId);
        const recentSocialPosts = socialPosts.filter(socialPost => {
          const postDate = new Date(socialPost.timestamp);
          return postDate >= thirtyDaysAgo;
        });        // Convert social posts to community feed format
        recentSocialPosts.forEach((socialPost: any) => {
          // Double-check that the social post is not from a test account
          const socialPostProfile = {
            id: socialPost.userId,
            username: socialPost.username,
            email: socialPost.userEmail || ''
          };
          
          if (isTestAccount(socialPostProfile)) {
            return;
          }

          const post: Post = {
            id: `social_${socialPost.id}`,
            userId: socialPost.userId,
            username: socialPost.username,
            avatar: socialPost.userAvatar,
            tier: socialPost.userTier || 'Initiate',
            content: socialPost.content,
            timestamp: socialPost.timestamp,
            likes: socialPost.likes,
            comments: socialPost.comments,
            shares: socialPost.shares,
            type: 'general',
            isLiked: socialPost.likedBy?.includes(user.id) || false
          };
          
          livePosts.push(post);
        });

        // 3. If no recent activities/posts and it's the current user, create a welcome post
        if (recentActivities.length === 0 && recentSocialPosts.length === 0 && userId === user.id) {
          const welcomePost: Post = {
            id: `${userId}_welcome_${Date.now()}`,
            userId: userId,
            username: userProfile.username,
            avatar: userProfile.avatar,
            tier: userProfile.tier || 'Initiate',
            content: `Welcome to the community! Start voting, pledging, and engaging to see your activity here. 🌟`,
            timestamp: new Date().toISOString(),
            likes: 0,
            comments: 0,
            shares: 0,
            type: 'general',
            isLiked: false
          };
          livePosts.push(welcomePost);
        }

      } catch (error) {
        console.error(`❌ Error loading activity for user ${userId}:`, error);
      }
    });// Sort by timestamp (newest first)
    const sortedPosts = livePosts.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ).slice(0, 50); // Limit to 50 most recent posts
    
    return sortedPosts;
  };
  const handleCreatePost = async () => {
    if (!user || !newPostContent.trim() || isPosting) return;

    setIsPosting(true);
    
    try {
      const userProfile = UserStorage.getUserProfile(user.id);
      
      // Create post using SocialPostsStorage for consistency with profile posts
      const newPost = SocialPostsStorage.createPost({
        userId: user.id,
        username: user.username,
        userAvatar: userProfile?.avatar || null,
        userTier: userProfile?.tier || 'Initiate',
        content: newPostContent.trim(),
        visibility: 'public',
        tags: [],
        mentions: []
      });

      // Also create legacy activity entry for backward compatibility
      const postActivity = {
        type: 'post',
        timestamp: new Date().toISOString(),
        content: newPostContent.trim(),
        postId: `post_${user.id}_${Date.now()}`
      };

      UserStorage.addUserActivity(user.id, postActivity);

      // Track the activity
      activityTracker.trackActivity({
        type: 'community',
        action: 'community_post',
        details: {
          userId: user.id,
          username: user.username,
          content: newPostContent.trim(),
          feedFilter: feedFilter,
          contentLength: newPostContent.trim().length
        }
      });

      // Refresh the feed from stored activities
      const refreshedPosts = await generateLiveFeedPosts();
      setPosts(refreshedPosts);

      setNewPostContent('');
      setIsPostModalOpen(false);
    } catch (error) {
      console.error('❌ Error creating post:', error);
    } finally {
      setIsPosting(false);
    }
  };
  const generatePostContentFromActivity = (activity: any, username: string): string => {
    switch (activity.type) {
      case 'post':
        return activity.content || `${username} shared a post in the community! 📝`;
      case 'vote':
        return `Voted for ${activity.productName}! Looking forward to this drop. 🗳️`;
      case 'pledge':
        return `Just pledged for ${activity.productName}. Can't wait for the group buy! 💎`;
      case 'comment':
        return `Shared thoughts on ${activity.productName}. Community discussion is so valuable! 💬`;
      case 'like':
        return `Liked a post about ${activity.productName || 'community activity'}. Great content! ❤️`;
      case 'follow':
        return `Started following ${activity.targetUsername}. Building connections in the community! 👥`;
      default:
        return `Active in the community! 🌟`;
    }
  };
  // Update posts when filter changes or following list updates
  useEffect(() => {
    if (user && !loading) {
      const updateFeed = async () => {
        const newPosts = await generateLiveFeedPosts();
        setPosts(newPosts);
      };
      updateFeed();
    }
  }, [feedFilter, following, user, loading]);

  // Helper function to identify bot/test accounts
  const isTestAccount = (profile: any): boolean => {
    if (!profile) return true;
    
    const username = (profile.username || '').toLowerCase();
    const email = (profile.email || '').toLowerCase();
    
    // Filter out accounts with test-related names
    const testPatterns = [
      'test', 'bot', 'demo', 'sample', 'mock', 'fake', 'admin',
      'placeholder', 'example', 'dummy', 'temp'
    ];
    
    // Check username patterns
    if (testPatterns.some(pattern => username.includes(pattern))) {
      return true;
    }
    
    // Check for generic usernames like "user_123"
    if (/^user_\d+$/.test(username)) {
      return true;
    }
    
    // Check email patterns
    if (testPatterns.some(pattern => email.includes(pattern))) {
      return true;
    }
    
    // Filter out test email domains
    const testDomains = ['example.com', 'test.com', 'demo.com', 'localhost'];
    if (testDomains.some(domain => email.includes(domain))) {
      return true;
    }
    
    // Filter out specific test user IDs (if any known test IDs exist)
    const testUserIds = [1001, 1002, 1003, 1004, 101, 102, 103, 999];
    if (testUserIds.includes(profile.id)) {
      return true;
    }
    
    return false;
  };
  const getAllCommunityMembers = (): User[] => {
    const allMembers: User[] = [];
    const userIds = new Set<number>();

    if (typeof window === 'undefined') return allMembers;

    try {
      // Get users from registry system
      const userRegistry = JSON.parse(localStorage.getItem('migistus_user_registry') || '{}');
        Object.entries(userRegistry).forEach(([email, userData]: [string, any]) => {
        if (userData.id && !userIds.has(userData.id)) {
          let profile = getUserProfile(userData.id);
          
          if (!profile) {
            profile = {
              id: userData.id,
              username: userData.username || `user_${userData.id}`,
              email: userData.email || email,
              bio: '',
              tier: 'New Member',
              joinedDate: new Date().toISOString().split('T')[0],
              stats: { totalPledges: 0, totalVotes: 0, dropsJoined: 0, followers: 0, following: 0 }
            };
          }
          
          // Only add if not a test account and has valid username
          if (profile.username && !isTestAccount(profile)) {
            const member = createMemberFromProfile(profile);
            allMembers.push(member);
            userIds.add(userData.id);
          }
        }
      });      // Get users from current session
      const currentSession = localStorage.getItem('userSession');
      if (currentSession) {
        try {
          const session = JSON.parse(currentSession);
          if (session.user && session.user.id && !userIds.has(session.user.id)) {
            let profile = getUserProfile(session.user.id);
            
            if (!profile) {
              profile = {
                id: session.user.id,
                username: session.user.username || `user_${session.user.id}`,
                email: session.user.email,
                bio: '',
                tier: 'New Member',
                joinedDate: new Date().toISOString().split('T')[0],
                stats: { totalPledges: 0, totalVotes: 0, dropsJoined: 0, followers: 0, following: 0 }
              };
            }
            
            // Only add if not a test account and has valid username
            if (profile.username && !isTestAccount(profile)) {
              const member = createMemberFromProfile(profile);
              allMembers.push(member);
              userIds.add(session.user.id);
            }
          }
        } catch (error) {
          console.warn('Error processing session user:', error);
        }
      }      // Get users from new user_ storage system
      const newProfileKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('user_') && key.endsWith('_profile')
      );
      
      newProfileKeys.forEach(key => {
        try {
          const profile = JSON.parse(localStorage.getItem(key) || '{}');
          
          // Only add if not a test account and has valid username
          if (profile.id && profile.username && !userIds.has(profile.id) && !isTestAccount(profile)) {
            const member = createMemberFromProfile(profile);
            allMembers.push(member);
            userIds.add(profile.id);
          }
        } catch (error) {
          console.error('Error parsing new profile:', key, error);
        }
      });      // Get users from old userProfile_ system
      const oldProfileKeys = Object.keys(localStorage).filter(key => key.startsWith('userProfile_'));
      
      oldProfileKeys.forEach(key => {
        try {
          const profile = JSON.parse(localStorage.getItem(key) || '{}');
          
          // Only add if not a test account and has valid username
          if (profile.id && profile.username && !userIds.has(profile.id) && !isTestAccount(profile)) {
            const member = createMemberFromProfile(profile);
            allMembers.push(member);
            userIds.add(profile.id);
          }
        } catch (error) {
          console.error('Error parsing old profile:', key, error);
        }
      });

    } catch (error) {
      console.error('Error getting community members:', error);
    }

    return allMembers;
  };

  const getUserProfile = (userId: number): any => {
    // Try new storage first
    try {
      const manualKey = `user_${userId}_profile`;
      const manualProfile = localStorage.getItem(manualKey);
      if (manualProfile) {
        return JSON.parse(manualProfile);
      }
    } catch (error) {
      // Continue to old storage
    }

    // Try old storage
    try {
      const oldKey = `userProfile_${userId}`;
      const oldProfile = localStorage.getItem(oldKey);
      if (oldProfile) {
        return JSON.parse(oldProfile);
      }
    } catch (error) {
      // No profile found
    }

    return null;
  };

  const createMemberFromProfile = (profile: any): User => {
    return {
      id: profile.id,
      username: profile.username,
      email: profile.email || '',
      tier: profile.tier || 'New Member',
      joinedDate: profile.joinedDate || new Date().toISOString().split('T')[0],
      stats: profile.stats || {
        totalPledges: 0,
        totalVotes: 0,
        dropsJoined: 0,
        followers: 0,
        following: 0
      },
      avatar: profile.avatar || null,
      bio: profile.bio || ''
    };
  };
  const getNewUsers = (): User[] => {
    const allMembers = getAllCommunityMembers();
    
    // Sort by join date (newest first) and take recent users
    const sortedByJoinDate = allMembers
      .filter(member => member.joinedDate)
      .sort((a, b) => new Date(b.joinedDate!).getTime() - new Date(a.joinedDate!).getTime())
      .slice(0, 10); // Get 10 most recent users
    
    return sortedByJoinDate;
  };
  const getCurrentFilterInfo = () => {
    switch (feedFilter) {
      case 'personal':
        return { 
          icon: '👥', 
          name: 'Personal Guild', 
          description: `Posts from you and ${following.length} people you follow` 
        };
      case 'local':
        return { icon: '🌍', name: 'Local Guild', description: 'Posts from members in your country' };
      case 'worldwide':
        return { icon: '🌐', name: 'Worldwide Guild', description: 'Posts from all community members' };
    }
  };

  const handleLike = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, likes: post.isLiked ? post.likes - 1 : post.likes + 1, isLiked: !post.isLiked }
        : post
    ));
  };

  const getTierColor = (tier: string = 'Initiate') => {
    switch (tier) {
      case 'MIGISTUS':
        return 'text-yellow-400';
      case 'Guild':
        return 'text-purple-400';
      case 'Initiate':
        return 'text-blue-400';
      default:
        return 'text-zinc-400';
    }
  };

  const getTierEmoji = (tier: string = 'Initiate') => {
    switch (tier) {
      case 'MIGISTUS':
        return '👑';
      case 'Guild':
        return '⚔️';
      case 'Initiate':
        return '🛡️';
      default:
        return '👤';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  // Helper for filter display
  const getGuildFilterDisplay = () => {
    switch (feedFilter) {
      case 'personal':
        return { label: 'Personal Guild', icon: '👥', color: 'text-blue-400' };
      case 'local':
        return { label: 'Local Guild', icon: '🌍', color: 'text-green-400' };
      case 'worldwide':
        return { label: 'Worldwide Guild', icon: '🌐', color: 'text-purple-400' };
      default:
        return { label: 'Personal Guild', icon: '👥', color: 'text-blue-400' };
    }
  };

  return (
    <>
      <Head>
        <title>Community - Migistus</title>
        <meta name="description" content="Connect with the Migistus community" />
      </Head>

      <MainNavbar />

      <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black">
        {/* Header */}
        <div className="relative overflow-hidden py-16">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-purple-500/10"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-3 bg-zinc-800/50 border border-zinc-700 rounded-full px-6 py-2 mb-6">
              <Users className="w-5 h-5 text-blue-400" />
              <span className="text-blue-400 font-medium">Community</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Connect & Discover
            </h1>
            
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
              Join the conversation, discover new members, and stay updated with community activity
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <div className="flex space-x-1 bg-zinc-800/30 border border-zinc-700 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('feed')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                activeTab === 'feed'
                  ? 'bg-blue-600 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-700/50'
              }`}
            >
              <MessageCircle className="w-4 h-4 inline mr-2" />
              Feed
            </button>
            <button
              onClick={() => setActiveTab('discover')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                activeTab === 'discover'
                  ? 'bg-purple-600 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-700/50'
              }`}
            >
              <Sparkles className="w-4 h-4 inline mr-2" />
              Discover
            </button>            <button
              onClick={() => setActiveTab('members')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                activeTab === 'members'
                  ? 'bg-green-600 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-700/50'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Members
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">          {/* Feed Tab */}
          {activeTab === 'feed' && (
            <div className="space-y-6">
              {!isAuthenticated ? (
                <div className="bg-zinc-800/30 border border-zinc-700 rounded-2xl p-8 text-center">
                  <Users className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Join the Community</h3>
                  <p className="text-zinc-400 mb-4">Sign in to see posts from people you follow and share your own activity.</p>
                  <Link href="/login" className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                    Sign In to Continue
                  </Link>
                </div>
              ) : (
                <>                  {/* Guild Filter and Refresh Controls */}
                  <div className="flex justify-between items-center mb-2">
                    <button
                      onClick={async () => {
                        setLoading(true);
                        const refreshedPosts = await generateLiveFeedPosts();
                        setPosts(refreshedPosts);
                        setLoading(false);
                      }}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg font-medium bg-zinc-800/50 border border-zinc-700 hover:bg-zinc-700/70 transition-all text-zinc-300 hover:text-white text-sm"
                      title="Refresh feed"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh
                    </button>
                    <button
                      onClick={() => setIsGuildModalOpen(true)}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-zinc-800/50 border border-zinc-700 hover:bg-zinc-700/70 transition-all ${getGuildFilterDisplay().color}`}
                    >
                      <TrendingUp className="w-4 h-4" />
                      <span>{getGuildFilterDisplay().icon} {getGuildFilterDisplay().label}</span>
                      <ChevronDown className="w-4 h-4 ml-1" />
                    </button>
                  </div>

                  {/* Guild Filter Modal */}
                  {isGuildModalOpen && (
                    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40" onClick={() => setIsGuildModalOpen(false)}>                      <div
                        className="guild-modal-content bg-zinc-900 border border-zinc-700 rounded-2xl shadow-xl p-6 w-full max-w-xs relative z-50"
                        onClick={e => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-2 mb-4">
                          <TrendingUp className="w-5 h-5 text-blue-400" />
                          <h3 className="text-lg font-semibold text-white">Select Guild Feed</h3>
                        </div>
                        <div className="flex flex-col gap-3">                          <button
                            onClick={() => { setFeedFilter('personal'); setIsGuildModalOpen(false); }}
                            className={`flex items-center justify-between w-full px-4 py-2 rounded-lg font-medium transition-all ${feedFilter === 'personal' ? 'bg-blue-600 text-white' : 'bg-zinc-800/50 text-zinc-400 hover:text-white hover:bg-zinc-700/50'}`}
                          >
                            <span className="flex items-center gap-2">
                              👥 Personal Guild
                            </span>
                            <span className="text-xs bg-white/10 px-2 py-1 rounded-full">
                              {following.length + 1} {/* +1 for current user */}
                            </span>
                          </button>
                          <button
                            onClick={() => { setFeedFilter('local'); setIsGuildModalOpen(false); }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${feedFilter === 'local' ? 'bg-green-600 text-white' : 'bg-zinc-800/50 text-zinc-400 hover:text-white hover:bg-zinc-700/50'}`}
                          >
                            🌍 Local Guild
                          </button>
                          <button
                            onClick={() => { setFeedFilter('worldwide'); setIsGuildModalOpen(false); }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${feedFilter === 'worldwide' ? 'bg-purple-600 text-white' : 'bg-zinc-800/50 text-zinc-400 hover:text-white hover:bg-zinc-700/50'}`}
                          >
                            🌐 Worldwide Guild
                          </button>
                        </div>
                        <button
                          onClick={() => setIsGuildModalOpen(false)}
                          className="absolute top-2 right-3 text-zinc-500 hover:text-white text-xl font-bold"
                          aria-label="Close"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )}                  {/* Share with Community Button */}
                  <button
                    onClick={() => setIsPostModalOpen(true)}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-4 rounded-2xl font-medium transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl border border-blue-500/20"
                  >
                    <Edit3 className="w-5 h-5" />
                    <span>Share with the Community</span>
                    <Sparkles className="w-4 h-4" />
                  </button>

                  {loading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
                      <div className="text-zinc-400 mt-4">Loading your feed...</div>
                    </div>                  ) : posts.length === 0 ? (
                    <div className="bg-zinc-800/30 border border-zinc-700 rounded-2xl p-8 text-center">
                      <MessageCircle className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">No Posts Yet</h3>
                      <p className="text-zinc-400 mb-4">
                        {feedFilter === 'personal' && "Follow other users or start participating to see activity in your personal feed."}
                        {feedFilter === 'local' && "No recent activity from members in your country. Try expanding to Worldwide Guild."}
                        {feedFilter === 'worldwide' && "No recent community activity found. Be the first to start engaging!"}
                      </p>
                      <div className="flex gap-3 justify-center">
                        <button 
                          onClick={() => setActiveTab('discover')}
                          className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                        >
                          Discover Users
                        </button>
                        {feedFilter !== 'worldwide' && (
                          <button 
                            onClick={() => setFeedFilter('worldwide')}
                            className="inline-flex items-center px-6 py-3 bg-zinc-600 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors"
                          >
                            Try Worldwide
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {posts.map((post) => (
                        <div key={post.id} className="bg-zinc-800/30 border border-zinc-700 rounded-2xl p-6 hover:bg-zinc-700/30 transition-all duration-300">
                          {/* Post Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="relative">
                                <div className="w-12 h-12 bg-zinc-700 rounded-full flex items-center justify-center overflow-hidden">
                                  {post.avatar ? (
                                    <Image src={post.avatar} alt={post.username} width={48} height={48} className="object-cover" />
                                  ) : (
                                    <span className="text-zinc-400">{getTierEmoji(post.tier)}</span>
                                  )}
                                </div>
                                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-zinc-800 ${
                                  post.tier === 'MIGISTUS' ? 'bg-yellow-500' :
                                  post.tier === 'Guild' ? 'bg-purple-500' : 'bg-blue-500'
                                }`}></div>
                              </div>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <h4 className="font-semibold text-white">{post.username}</h4>
                                  <span className={`text-sm ${getTierColor(post.tier)}`}>
                                    {getTierEmoji(post.tier)} {post.tier}
                                  </span>
                                </div>
                                <p className="text-sm text-zinc-400">{formatTimeAgo(post.timestamp)}</p>
                              </div>
                            </div>
                            <button className="text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-zinc-700/50 transition-colors">
                              <MoreHorizontal className="w-5 h-5" />
                            </button>
                          </div>

                          {/* Post Content */}
                          <div className="mb-4">
                            <p className="text-white leading-relaxed">{post.content}</p>
                            {post.productName && (
                              <div className="mt-3 p-3 bg-zinc-700/30 rounded-lg border border-zinc-600">
                                <p className="text-sm text-zinc-300">
                                  <span className="capitalize text-blue-400">{post.type}</span> • {post.productName}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Post Actions */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-6">
                              <button 
                                onClick={() => handleLike(post.id)}
                                className={`flex items-center space-x-2 text-sm transition-colors ${
                                  post.isLiked ? 'text-red-400' : 'text-zinc-400 hover:text-red-400'
                                }`}
                              >
                                <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                                <span>{post.likes}</span>
                              </button>
                              <button className="flex items-center space-x-2 text-sm text-zinc-400 hover:text-blue-400 transition-colors">
                                <MessageCircle className="w-5 h-5" />
                                <span>{post.comments}</span>
                              </button>
                              <button className="flex items-center space-x-2 text-sm text-zinc-400 hover:text-green-400 transition-colors">
                                <Share2 className="w-5 h-5" />
                                <span>{post.shares}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}          {/* Discover Tab */}
          {activeTab === 'discover' && (
            <div className="space-y-6">
              <div className="bg-zinc-800/30 border border-zinc-700 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <Sparkles className="w-6 h-6 text-purple-400" />
                    <h2 className="text-xl font-bold text-white">New Community Members</h2>
                  </div>
                  <Link 
                    href="/community/members-list"
                    className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <Users className="w-4 h-4" />
                    <span>Browse All Members</span>
                  </Link>
                </div>
                
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto"></div>
                    <div className="text-zinc-400 mt-2">Loading new members...</div>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {newUsers.map((newUser) => (
                      <div key={newUser.id} className="bg-zinc-700/30 border border-zinc-600 rounded-xl p-4 hover:bg-zinc-600/30 transition-all duration-300">
                        <div className="text-center mb-4">
                          <div className="w-16 h-16 bg-zinc-700 rounded-full mx-auto mb-3 flex items-center justify-center overflow-hidden">
                            {newUser.avatar ? (
                              <Image src={newUser.avatar} alt={newUser.username} width={64} height={64} className="object-cover" />
                            ) : (
                              <span className="text-2xl">{getTierEmoji(newUser.tier)}</span>
                            )}
                          </div>
                          <h3 className="font-semibold text-white">{newUser.username}</h3>
                          <p className={`text-sm ${getTierColor(newUser.tier)}`}>
                            {getTierEmoji(newUser.tier)} {newUser.tier}
                          </p>
                          {newUser.bio && (
                            <p className="text-sm text-zinc-400 mt-2 line-clamp-2">{newUser.bio}</p>
                          )}
                        </div>
                        
                        <div className="flex justify-between text-xs text-zinc-400 mb-4">
                          <span>{newUser.stats?.followers || 0} followers</span>
                          <span>{newUser.stats?.totalVotes || 0} votes</span>
                        </div>
                          <div className="flex space-x-2">
                          <FollowButton 
                            targetUserId={newUser.id} 
                            targetUsername={newUser.username}
                            size="sm"
                          />
                          <Link 
                            href={`/community/profile/${newUser.username.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                            className="flex-1 px-3 py-2 bg-zinc-600 hover:bg-zinc-500 text-white text-sm rounded-lg font-medium text-center transition-colors"
                          >
                            View Profile
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}          {/* Members Tab */}
          {activeTab === 'members' && (
            <div className="space-y-6">
              <div className="bg-zinc-800/30 border border-zinc-700 rounded-2xl p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <Users className="w-6 h-6 text-green-400" />
                  <h2 className="text-xl font-bold text-white">Community Members</h2>
                  <span className="text-sm text-zinc-400">({allMembers.length} members)</span>
                </div>
                
                {/* Search and Filter Controls */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Search members by username or bio..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-zinc-700/50 border border-zinc-600 rounded-xl pl-10 pr-4 py-3 text-white placeholder-zinc-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                      />
                    </div>
                  </div>
                  <div>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'newest' | 'active' | 'name')}
                      className="px-4 py-3 bg-zinc-700/50 border border-zinc-600 rounded-xl text-white focus:border-green-500 focus:outline-none"
                    >
                      <option value="newest">Newest Members</option>
                      <option value="active">Most Active</option>
                      <option value="name">Alphabetical</option>
                    </select>
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto"></div>
                    <div className="text-zinc-400 mt-2">Loading members...</div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {allMembers
                      .filter(member => 
                        member.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (member.bio && member.bio.toLowerCase().includes(searchTerm.toLowerCase()))
                      )
                      .sort((a, b) => {
                        switch (sortBy) {
                          case 'newest':
                            return new Date(b.joinedDate || '').getTime() - new Date(a.joinedDate || '').getTime();
                          case 'active':
                            const aActivity = (a.stats?.totalPledges || 0) + (a.stats?.totalVotes || 0) + (a.stats?.dropsJoined || 0);
                            const bActivity = (b.stats?.totalPledges || 0) + (b.stats?.totalVotes || 0) + (b.stats?.dropsJoined || 0);
                            return bActivity - aActivity;
                          case 'name':
                            return a.username.localeCompare(b.username);
                          default:
                            return 0;
                        }
                      })
                      .slice(0, 20) // Show first 20 results
                      .map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-4 bg-zinc-700/30 border border-zinc-600 rounded-xl hover:bg-zinc-600/30 transition-all duration-300">                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-zinc-700 rounded-full flex items-center justify-center overflow-hidden">
                              <Image 
                                src={member.avatar || "/Icons/New Member.png"} 
                                alt={member.username} 
                                width={48} 
                                height={48} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "/Icons/New Member.png";
                                }}
                              />
                            </div>
                            <div>
                              <h3 className="font-semibold text-white">{member.username}</h3>
                              <p className={`text-sm ${getTierColor(member.tier)}`}>
                                {getTierEmoji(member.tier)} {member.tier}
                              </p>
                              {member.bio && (
                                <p className="text-sm text-zinc-400 mt-1 max-w-md truncate">{member.bio}</p>
                              )}
                              <div className="flex space-x-4 text-xs text-zinc-400 mt-1">
                                <span>{member.stats?.followers || 0} followers</span>
                                <span>{member.stats?.totalVotes || 0} votes</span>
                                <span>{member.stats?.totalPledges || 0} pledges</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <FollowButton 
                              targetUserId={member.id}
                              targetUsername={member.username}
                              size="sm"
                            />                            <Link 
                              href={`/account/profile/${member.username.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                              className="px-4 py-2 bg-zinc-600 hover:bg-zinc-500 text-white text-sm rounded-lg font-medium transition-colors"
                            >
                              View Profile
                            </Link>
                          </div>
                        </div>
                      ))}
                      
                    {allMembers.length === 0 && (
                      <div className="text-center py-8">
                        <Users className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                        <p className="text-zinc-400">No community members found</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>          )}
        </div>
      </div>

      {/* Post Creation Modal */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setIsPostModalOpen(false)}>
          <div
            className="post-modal-content bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-6 w-full max-w-2xl mx-4 relative z-50"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Edit3 className="w-6 h-6 text-blue-400" />
                <h3 className="text-xl font-semibold text-white">Share with the Community</h3>
              </div>
              <button
                onClick={() => setIsPostModalOpen(false)}
                className="text-zinc-500 hover:text-white text-2xl font-bold transition-colors"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-14 h-14 bg-zinc-700 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                <Image 
                  src={(user as AuthUser)?.avatar || "/Icons/New Member.png"} 
                  alt={user?.username || 'User'} 
                  width={56} 
                  height={56} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/Icons/New Member.png";
                  }}
                />
              </div>
              <div className="flex-1">
                <div className="mb-3">
                  <span className="text-sm font-medium text-white">{user?.username}</span>
                  <span className="text-sm text-zinc-400 ml-2">
                    posting to <span className="text-blue-400">
                      {feedFilter === 'personal' && '👥 Personal Guild'}
                      {feedFilter === 'local' && '🌍 Local Guild'}
                      {feedFilter === 'worldwide' && '🌐 Worldwide Guild'}
                    </span>
                  </span>
                </div>
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Share something with the community..."
                  className="w-full bg-zinc-800/50 border border-zinc-600 rounded-xl p-4 text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none min-h-[120px]"
                  rows={4}
                  maxLength={500}
                  autoFocus
                />
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-zinc-400">
                    <span className={newPostContent.length > 450 ? 'text-orange-400' : newPostContent.length > 480 ? 'text-red-400' : ''}>
                      {newPostContent.length}/500 characters
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setIsPostModalOpen(false)}
                      className="px-6 py-2 bg-zinc-600 hover:bg-zinc-500 text-white rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreatePost}
                      disabled={!newPostContent.trim() || isPosting || newPostContent.length > 500}
                      className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                    >
                      <Send className="w-4 h-4" />
                      <span>{isPosting ? 'Posting...' : 'Post'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
