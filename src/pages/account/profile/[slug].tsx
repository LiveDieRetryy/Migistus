import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
import Head from "next/head";
import MainNavbar from "@/components/nav/MainNavbar";
import { useAuth } from "@/context/AuthContext";
import { UserStorage3 as UserStorage } from "@/utils/userStorage";
import Image from "next/image";
import Link from "next/link";
import FollowButton from '@/components/FollowButton';
import MessageButton from '@/components/messaging/MessageButton';
import FollowersModal from '@/components/FollowersModal';
import CreatePost from '@/components/social/CreatePost';
import PostCard from '@/components/social/PostCard';
import { SocialPostsStorage, SocialPost } from '@/utils/socialPostsStorage';
import OnlineStatus from '@/components/OnlineStatus';
import { useOnlineUsers } from '@/hooks/useOnlineUsers';
import { Shield, Award, Star, TrendingUp, Users as UsersIcon, Heart, MessageCircle, Share2, Zap, Eye, Target, Clock, Activity, ChevronDown, ExternalLink } from "lucide-react";

interface UserProfile {
  id: number;
  username: string;
  email: string;
  bio: string;
  avatar: string | null;
  banner: string | null;
  tier: string;
  guildTokens: number;
  joinedDate: string;
  titles: string[];
  badges: string[];
  links: { name: string; url: string }[];
  stats: {
    totalPledges: number;
    totalVotes: number;
    dropsJoined: number;
    followers: number;
    following: number;
  };
}

// Live Profile Status Component
function LiveProfileStatus({ userId, isOwnProfile }: { userId: number; isOwnProfile: boolean }) {
  const { isUserOnline } = useOnlineUsers();
  const [isInvisible, setIsInvisible] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Check if user is online via Socket.IO
  const isOnline = isUserOnline(userId);

  useEffect(() => {
    // Check if user has invisible mode enabled
    if (isOwnProfile) {
      const localInvisible = localStorage.getItem(`invisible_${userId}`);
      if (localInvisible !== null) {
        setIsInvisible(localInvisible === 'true');
      }
    }
  }, [userId, isOwnProfile]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!showDropdown) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.visibility-dropdown')) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showDropdown]);

  const toggleVisibility = async (mode: 'online' | 'invisible') => {
    const newInvisibleState = mode === 'invisible';
    setIsInvisible(newInvisibleState);
    
    // Save preference to localStorage
    localStorage.setItem(`invisible_${userId}`, String(newInvisibleState));
    
    // Update server-side visibility
    try {
      await fetch('/api/users/visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ invisible: newInvisibleState })
      });
    } catch (error) {
      console.error('Error updating visibility:', error);
    }
    
    setShowDropdown(false);
  };

  // Show offline if user is actually offline OR if they're invisible
  const displayOnline = isOnline && !isInvisible;

  return (
    <div className="absolute top-6 left-6 z-20 visibility-dropdown">
      <div className={`relative flex items-center gap-3 backdrop-blur-sm px-4 py-2.5 rounded-xl border shadow-lg transition-all duration-300 ${
        displayOnline
          ? 'bg-gradient-to-r from-green-900/90 to-emerald-900/90 border-green-400/40'
          : 'bg-gradient-to-r from-zinc-800/90 to-zinc-700/90 border-zinc-500/40'
      } ${isOwnProfile ? 'cursor-pointer hover:scale-105' : ''}`}
      onClick={() => isOwnProfile && setShowDropdown(!showDropdown)}
      >
        {/* Status Indicator */}
        <div className="relative flex items-center justify-center">
          {displayOnline ? (
            <>
              <div className="w-3 h-3 bg-green-400 rounded-full shadow-lg shadow-green-400/50"></div>
              <div className="absolute w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
            </>
          ) : (
            <div className="w-3 h-3 bg-zinc-500 rounded-full"></div>
          )}
        </div>

        {/* Status Text */}
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${displayOnline ? 'text-green-300' : 'text-zinc-400'}`}>
            {displayOnline ? 'Online' : 'Offline'}
          </span>
          {isInvisible && isOwnProfile && (
            <span className="text-xs bg-zinc-700 px-2 py-0.5 rounded text-zinc-300">
              Invisible Mode
            </span>
          )}
        </div>

        {/* Dropdown Arrow (only for own profile) */}
        {isOwnProfile && (
          <ChevronDown className={`w-4 h-4 ${displayOnline ? 'text-green-300' : 'text-zinc-400'} transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
        )}
      </div>

      {/* Visibility Dropdown */}
      {isOwnProfile && showDropdown && (
        <div className="absolute top-full mt-2 left-0 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700 rounded-xl shadow-2xl overflow-hidden min-w-[200px] z-30">
          <button
            onClick={() => toggleVisibility('online')}
            className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-zinc-800 transition-colors ${
              !isInvisible ? 'bg-green-900/30' : ''
            }`}
          >
            <div className="relative">
              <div className="w-2.5 h-2.5 bg-green-400 rounded-full"></div>
              <div className="absolute inset-0 w-2.5 h-2.5 bg-green-400 rounded-full animate-ping"></div>
            </div>
            <div className="flex-1 text-left">
              <div className="text-sm font-semibold text-green-300">Online</div>
              <div className="text-xs text-zinc-400">Visible to everyone</div>
            </div>
          </button>
          
          <button
            onClick={() => toggleVisibility('invisible')}
            className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-zinc-800 transition-colors ${
              isInvisible ? 'bg-zinc-800/50' : ''
            }`}
          >
            <div className="w-2.5 h-2.5 bg-zinc-500 rounded-full"></div>
            <div className="flex-1 text-left">
              <div className="text-sm font-semibold text-zinc-400">Invisible</div>
              <div className="text-xs text-zinc-500">Appear offline</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

export default function UserProfilePage() {
  const router = useRouter();
  const { slug } = router.query;
  const { user: currentUser, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});
  const hasCountedView = useRef(false); // Track if we've already counted this view
  const [liveStats, setLiveStats] = useState({
    activePledges: 0,
    completedPledges: 0,
    totalPledgeAmount: 0,
    successRate: 0,
    profileViews: 0,
    interactions: 0,
    reputation: 0,
    followers: 0,
    following: 0,
    lastActive: new Date().toISOString()
  });const [followersModal, setFollowersModal] = useState<{
    isOpen: boolean;
    type: 'followers' | 'following';
  }>({
    isOpen: false,
    type: 'followers'
  });  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'posts' | 'activity' | 'wishlist'>('posts');
  const [mounted, setMounted] = useState(false);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const handlePostCreated = (newPost: SocialPost) => {
    setPosts(prevPosts => [newPost, ...prevPosts]);
  };

  const handlePostUpdated = (updatedPost: SocialPost) => {
    setPosts(prevPosts => prevPosts.map(post => 
      post.id === updatedPost.id ? updatedPost : post
    ));
  };
  const handlePostDeleted = (postId: number) => {
    setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
  };

  // Reset view counter when navigating to a different profile
  useEffect(() => {
    hasCountedView.current = false;
  }, [slug]);

  // Mounted effect
  useEffect(() => {
    setMounted(true);
  }, []);

  // Real-time update interval
  // Load wishlist for own profile
  useEffect(() => {
    if (isOwnProfile && profile) {
      loadWishlist();
    }
  }, [isOwnProfile, profile]);

  const loadWishlist = async () => {
    try {
      setWishlistLoading(true);
      const response = await fetch('/api/account/wishlist', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setWishlist(result.data);
        }
      }
    } catch (error) {
      console.error('Failed to load wishlist:', error);
    } finally {
      setWishlistLoading(false);
    }
  };

  useEffect(() => {
    if (!profile) return;
    
    const updateLiveStats = async () => {
      const stats = UserStorage.calculateUserStats(profile.id);
      const pledges = UserStorage.getUserPledges(profile.id);
      
      // Fetch follower counts from API
      let followers = 0;
      let following = 0;
      try {
        const response = await fetch(`/api/followers?userId=${profile.id}`);
        if (response.ok) {
          const data = await response.json();
          followers = data.followersCount || 0;
          following = data.followingCount || 0;
        }
      } catch (error) {
        console.error('Failed to fetch follower counts:', error);
      }
      
      setLiveStats({
        activePledges: pledges.filter((p: any) => p.status === 'active').length,
        completedPledges: pledges.filter((p: any) => p.status === 'completed').length,
        totalPledgeAmount: pledges.reduce((sum: number, p: any) => sum + (p.amount || 0), 0),
        successRate: pledges.length > 0 ? 
          (pledges.filter((p: any) => p.status === 'completed').length / pledges.length) * 100 : 0,
        profileViews: UserStorage.getUserProfileViews(profile.id),
        interactions: UserStorage.getUserInteractions(profile.id),
        reputation: UserStorage.getUserReputation(profile.id),
        followers: followers,
        following: following,
        lastActive: new Date().toISOString()
      });
    };

    // Update immediately
    updateLiveStats();
    
    // Listen for real-time follower updates
    const handleFollowerUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { followerId, followingId } = customEvent.detail;
      
      // Update stats if this profile was involved in the follow/unfollow
      if (followerId === profile.id || followingId === profile.id) {
        console.log('🔔 Profile received follower update:', customEvent.detail);
        updateLiveStats();
      }
    };
    
    window.addEventListener('followerUpdate', handleFollowerUpdate);
    
    // Update every 10 seconds
    const interval = setInterval(updateLiveStats, 10000);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('followerUpdate', handleFollowerUpdate);
    };
  }, [profile]);

  useEffect(() => {
    if (!slug) return;
    
    const loadProfile = async () => {
      setLoading(true);
      let foundProfile = null;
      
      // 1. First, search localStorage for matching slug (user-created profiles)
      const allKeys = Object.keys(localStorage).filter(
        (key) => key.startsWith("user_") && key.endsWith("_profile")
      );
      
      for (const key of allKeys) {
        try {
          const userProfile = JSON.parse(localStorage.getItem(key) || "{}");
          if (!userProfile.username) continue;
          
          const usernameSlug = userProfile.username
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "");
            
          if (usernameSlug === slug) {
            foundProfile = userProfile;
            break;
          }
        } catch (error) {
          console.error("Error parsing profile:", error);
        }
      }
      
      // 2. If not found in localStorage, check API database
      if (!foundProfile) {
        try {
          console.log(`🔍 Profile not in localStorage, checking API for slug: ${slug}`);
          const response = await fetch('/api/users');
          if (response.ok) {
            const data = await response.json();
            if (data.users && Array.isArray(data.users)) {
              const user = data.users.find((u: any) => {
                const userSlug = u.username
                  .toLowerCase()
                  .replace(/[^a-z0-9]/g, "-")
                  .replace(/-+/g, "-")
                  .replace(/^-|-$/g, "");
                return userSlug === slug;
              });
              
              if (user) {
                console.log(`✅ Found user in API database: ${user.username}`);
                // Build profile from API data
                foundProfile = {
                  id: user.id,
                  username: user.username,
                  email: user.email,
                  bio: user.bio || "",
                  avatar: user.avatar || null,
                  banner: user.banner || null,
                  tier: user.tier || "New Member",
                  guildTokens: user.guildCoins || user.guildTokens || 0,
                  joinedDate: user.joinDate || user.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
                  titles: user.titles || [],
                  badges: user.badges || [],
                  links: user.links || [],
                  stats: {
                    totalPledges: user.totalPledges || 0,
                    totalVotes: user.totalVotes || 0,
                    dropsJoined: user.dropsJoined || 0,
                    followers: user.followers || 0,
                    following: user.following || 0
                  }
                };
              }
            }
          }
        } catch (apiError) {
          console.error('❌ Error fetching from API:', apiError);
        }
      }
      
      // 3. If profile found (from either source), enhance and display it
      if (foundProfile) {
        // Enhance profile with calculated stats FROM USERSTORAGE (source of truth)
        const stats = UserStorage.calculateUserStats(foundProfile.id);
        const walletBalance = UserStorage.getUserWalletBalance(foundProfile.id);
        const guildCoins = UserStorage.getUserGuildCoins(foundProfile.id);
        
        console.log(`📊 Profile stats for ${foundProfile.username}:`, {
          followers: stats.followers,
          following: stats.following,
          source: 'UserStorage.calculateUserStats'
        });
        
        const enhancedProfile = {
          ...foundProfile,
          stats,  // This OVERWRITES any API stats with localStorage data
          walletBalance,
          guildCoins
        };
        
        setProfile(enhancedProfile);
        setIsOwnProfile(currentUser?.id === foundProfile.id);
        setEditForm(enhancedProfile);
        
        // Increment profile views (only for non-own profiles and only once per session)
        // IMPORTANT: We need to determine if this is the user's own profile
        // Check multiple sources to be absolutely sure:
        let isOwner = false;
        
        // 1. Check if currentUser is loaded and matches
        if (currentUser?.id === foundProfile.id) {
          isOwner = true;
        }
        
        // 2. Also check localStorage for the logged-in user's ID
        // This covers the case where currentUser hasn't loaded yet
        try {
          const currentUserId = localStorage.getItem('currentUserId');
          if (currentUserId && parseInt(currentUserId) === foundProfile.id) {
            isOwner = true;
          }
        } catch (error) {
          // Ignore parsing errors
        }
        
        // Only count view if this is NOT the user's own profile
        if (!isOwner) {
          // Check if we've already counted a view for this profile in this session
          const viewKey = `profile_view_${foundProfile.id}`;
          const lastViewTime = sessionStorage.getItem(viewKey);
          const now = Date.now();
          
          // Only count if:
          // 1. Never viewed before in this session (lastViewTime is null)
          // 2. Or it's been more than 30 minutes since last view (1800000 ms)
          if (!lastViewTime || (now - parseInt(lastViewTime)) > 1800000) {
            UserStorage.incrementProfileViews(foundProfile.id);
            sessionStorage.setItem(viewKey, now.toString());
            hasCountedView.current = true;
          }
        }
      }
      
      setLoading(false);
    };

    loadProfile();
  }, [slug, currentUser]);
  // Load user posts
  useEffect(() => {
    if (profile?.id) {
      const userPosts = SocialPostsStorage.getUserPosts(profile.id);
      setPosts(userPosts);
    }
  }, [profile?.id]);

  // Listen for real-time follower updates
  useEffect(() => {
    if (!profile?.id) return;

    const handleFollowerUpdate = async (event: CustomEvent) => {
      const { targetUserId, isFollowing } = event.detail;
      
      // If this profile is being followed/unfollowed
      if (targetUserId === profile.id) {
        // Fetch updated count from API
        try {
          const response = await fetch(`/api/followers?userId=${profile.id}`);
          if (response.ok) {
            const data = await response.json();
            setLiveStats(prev => ({
              ...prev,
              followers: data.followersCount || 0,
              lastActive: new Date().toISOString()
            }));
          }
        } catch (error) {
          console.error('Failed to fetch updated follower count:', error);
        }
      }
    };

    // Also listen for when this user follows/unfollows others (to update following count)
    const handleFollowingUpdate = async () => {
      if (profile?.id) {
        // Fetch updated count from API
        try {
          const response = await fetch(`/api/followers?userId=${profile.id}`);
          if (response.ok) {
            const data = await response.json();
            setLiveStats(prev => ({
              ...prev,
              following: data.followingCount || 0,
              lastActive: new Date().toISOString()
            }));
          }
        } catch (error) {
          console.error('Failed to fetch updated following count:', error);
        }
      }
    };

    window.addEventListener('followerUpdate', handleFollowerUpdate as EventListener);
    window.addEventListener('followingUpdate', handleFollowingUpdate as EventListener);
    
    return () => {
      window.removeEventListener('followerUpdate', handleFollowerUpdate as EventListener);
      window.removeEventListener('followingUpdate', handleFollowingUpdate as EventListener);
    };
  }, [profile?.id]);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "MIGISTUS": return "from-yellow-400 to-yellow-600";
      case "Guild": return "from-purple-400 to-purple-600";
      default: return "from-gray-400 to-gray-600";
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case "MIGISTUS": return "👑";
      case "Guild": return "⚔️";
      default: return "🛡️";
    }
  };

  const handleSaveProfile = () => {
    if (!profile || !isOwnProfile) return;
    
    try {
      UserStorage.setUserProfile(profile.id, editForm);
      setProfile({ ...profile, ...editForm });
      setIsEditing(false);
      
      // Trigger profile update event
      window.dispatchEvent(new CustomEvent('profileUpdated', {
        detail: { userId: profile.id }
      }));
    } catch (error) {
      console.error("Failed to save profile:", error);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isOwnProfile) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setEditForm(prev => ({ ...prev, avatar: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isOwnProfile) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setEditForm(prev => ({ ...prev, banner: dataUrl }));
    };
    reader.readAsDataURL(file);
  };
  const getAvatarSrc = () => {
    if (!mounted) return "/Icons/New Member.png";
    return (isEditing ? editForm.avatar : profile?.avatar) || "/Icons/New Member.png";
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Loading Profile - MIGISTUS</title>
        </Head>
        <MainNavbar />
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-yellow-400 text-xl">Loading profile...</div>
          </div>
        </div>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Head>
          <title>Profile Not Found - MIGISTUS</title>
        </Head>
        <MainNavbar />
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white flex items-center justify-center">
          <div className="bg-zinc-900/90 border border-red-500/20 rounded-2xl p-8 text-center max-w-md mx-4">
            <div className="text-6xl mb-4">😞</div>
            <h2 className="text-2xl font-bold text-red-400 mb-4">Profile Not Found</h2>
            <p className="text-gray-400 mb-6">The profile you're looking for doesn't exist or has been removed.</p>
            <Link href="/community/members-list" className="text-yellow-400 hover:text-yellow-300 transition-colors font-semibold">
              Browse Community Members →
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{profile.username} - MIGISTUS Profile</title>
        <meta name="description" content={`View ${profile.username}'s profile on MIGISTUS`} />
      </Head>
      <MainNavbar />

      <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black text-white">
        {/* Streamlined Banner Section */}
        <div className="relative h-64 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
          
          {/* Custom Banner */}
          <div className="absolute inset-0">
            <Image
              src={(isEditing ? editForm.banner : profile?.banner) || "/Icons/BannerPlaceholder.png"}
              alt="Profile Banner"
              fill
              className="object-cover"
              priority
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/Icons/BannerPlaceholder.png";
              }}
            />
          </div>
          
          {/* Banner Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
          
          {/* Banner Edit Button */}
          {isOwnProfile && isEditing && (
            <label className="absolute top-4 right-4 bg-zinc-900/90 hover:bg-zinc-800/90 backdrop-blur-sm px-4 py-2 rounded-lg cursor-pointer transition-all border border-yellow-400/30 hover:border-yellow-400/60 group">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400 text-sm font-semibold">Change Banner</span>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleBannerUpload}
                className="hidden"
              />
            </label>
          )}
          
          {/* Live Status Indicator */}
          {profile && (
            <LiveProfileStatus userId={profile.id} isOwnProfile={isOwnProfile} />
          )}

          {/* Compact Profile Stats Badge */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2">
            <div className="bg-zinc-900/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-blue-400/40 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-blue-300 text-xs font-medium">{liveStats.profileViews}</span>
            </div>
            <div className="bg-zinc-900/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-purple-400/40 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-purple-300 text-xs font-medium">{liveStats.reputation}</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-3 sm:px-4 -mt-20 relative z-10">
          {/* Streamlined Profile Header */}
          <div className="bg-gradient-to-br from-zinc-900/95 to-zinc-800/95 backdrop-blur-xl border-2 border-yellow-500/30 rounded-2xl p-4 sm:p-5 mb-6 shadow-2xl">
            <div className="flex flex-col lg:flex-row items-start gap-4 sm:gap-6">
              {/* Compact Avatar Section */}
              <div className="relative flex-shrink-0 group mx-auto lg:mx-0">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl border-3 border-yellow-400/40 overflow-hidden bg-zinc-700 shadow-xl ring-2 ring-yellow-400/10 group-hover:ring-yellow-400/30 transition-all">
                  <Image
                    src={(isEditing ? editForm.avatar : profile?.avatar) || "/Icons/New Member.png"}
                    alt={profile?.username || "Profile"}
                    width={128}
                    height={128}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    priority
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/Icons/New Member.png";
                    }}
                  />
                </div>
                
                {/* Avatar Edit Button */}
                {isOwnProfile && isEditing && (
                  <label className="absolute bottom-1 right-1 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 p-2 rounded-full cursor-pointer transition-all shadow-lg border-2 border-zinc-900 hover:scale-110">
                    <Shield className="w-4 h-4 text-black" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </label>
                )}
                
                {/* Compact Tier Badge */}
                <div className={`absolute -top-2 -right-2 px-2 sm:px-3 py-0.5 sm:py-1 bg-gradient-to-r ${getTierColor(profile?.tier)} rounded-lg text-white font-bold text-[10px] sm:text-xs shadow-xl border-2 border-zinc-900 flex items-center gap-1`}>
                  <span>{getTierIcon(profile?.tier)}</span>
                  <span>{profile?.tier || "New Member"}</span>
                </div>

                {/* Compact Reputation Badge */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-purple-500 px-3 py-1 rounded-full border-2 border-zinc-900 shadow-lg flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-300" />
                  <span className="text-white text-xs font-bold">{liveStats.reputation}</span>
                </div>
              </div>

              {/* Compact Profile Info */}
              <div className="flex-1 min-w-0 text-center lg:text-left">
                <div className="flex flex-col gap-3 sm:gap-4 mb-4">
                  <div className="flex-1">
                    <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent mb-3 break-words">
                      {profile.username}
                    </h1>
                      {/* Compact Stats Bar */}
                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-1.5 sm:gap-2 mb-3">
                      <div className="flex items-center gap-1 sm:gap-1.5 bg-blue-500/10 border border-blue-500/30 rounded-lg px-2 sm:px-2.5 py-1 sm:py-1.5">
                        <Target className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-400" />
                        <span className="text-blue-400 font-bold text-xs sm:text-sm">{liveStats.activePledges}</span>
                        <span className="text-gray-400 text-[10px] sm:text-xs">Active</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/30 rounded-lg px-2.5 py-1.5">
                        <Shield className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-green-400 font-bold text-sm">{liveStats.reputation}</span>
                        <span className="text-gray-400 text-xs">Rep</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/30 rounded-lg px-2.5 py-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                        <span className="text-purple-400 font-bold text-sm">{Math.round(liveStats.successRate)}%</span>
                      </div>
                      
                      {/* Followers - Clickable */}
                      <button
                        onClick={() => setFollowersModal({ isOpen: true, type: 'followers' })}
                        className="flex items-center gap-1.5 bg-pink-500/10 border border-pink-500/30 hover:border-pink-500/60 rounded-lg px-2.5 py-1.5 transition-all group"
                      >
                        <UsersIcon className="w-3.5 h-3.5 text-pink-400" />
                        <span className="text-pink-400 font-bold text-sm">{liveStats.followers}</span>
                        <span className="text-gray-400 text-xs">Followers</span>
                      </button>
                      
                      {/* Following - Clickable */}
                      <button
                        onClick={() => setFollowersModal({ isOpen: true, type: 'following' })}
                        className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/30 hover:border-orange-500/60 rounded-lg px-2.5 py-1.5 transition-all group"
                      >
                        <Heart className="w-3.5 h-3.5 text-orange-400" />
                        <span className="text-orange-400 font-bold text-sm">{liveStats.following}</span>
                        <span className="text-gray-400 text-xs">Following</span>
                      </button>
                    </div>
                    
                    {/* Member Since */}
                    <div className="flex items-center gap-2 text-gray-300 mb-4 bg-zinc-800/50 w-fit mx-auto lg:mx-0 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-zinc-700">
                      <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400" />
                      <span className="text-xs sm:text-sm">Member since {new Date(profile.joinedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full lg:w-auto">
                    {isOwnProfile ? (
                      isEditing ? (
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
                          <button
                            onClick={handleSaveProfile}
                            className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg hover:shadow-green-500/30 text-sm sm:text-base"
                          >
                            <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
                            Save Changes
                          </button>
                          <button
                            onClick={() => {
                              setIsEditing(false);
                              setEditForm(profile);
                            }}
                            className="flex items-center justify-center gap-2 bg-zinc-700 hover:bg-zinc-600 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-bold transition-all text-sm sm:text-base"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 text-black px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg hover:shadow-yellow-500/30 text-sm sm:text-base w-full"
                        >
                          <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
                          Edit Profile
                        </button>
                      )
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
                        <FollowButton
                          targetUserId={profile.id}
                          targetUsername={profile.username}
                          initialFollowersCount={liveStats.followers}
                          onFollowChange={async (isFollowing, newCount) => {
                            // Fetch actual count from API for accuracy
                            try {
                              const response = await fetch(`/api/followers?userId=${profile.id}`);
                              if (response.ok) {
                                const data = await response.json();
                                const actualCount = data.followersCount || 0;
                                
                                // Update local profile state with API count
                                setProfile(prev => prev ? {
                                  ...prev,
                                  followers: actualCount
                                } : null);
                                
                                // Update live stats with API count
                                setLiveStats(prev => ({
                                  ...prev,
                                  followers: actualCount,
                                  lastActive: new Date().toISOString()
                                }));
                              }
                            } catch (error) {
                              console.error('Failed to fetch updated count:', error);
                              // Fallback to optimistic update
                              setLiveStats(prev => ({
                                ...prev,
                                followers: newCount,
                                lastActive: new Date().toISOString()
                              }));
                            }
                          }}
                          size="lg"
                          variant="default"
                        />
                        <MessageButton
                          userId={profile.id}
                          username={profile.username}
                          variant="secondary"
                          className="flex-1 px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base"
                        />
                      </div>
                    )}
                  </div>
                </div>                {/* Bio Section */}
                <div className="mb-6">
                  {isEditing ? (
                    <div className="space-y-2">
                      <label className="text-sm text-gray-400 flex items-center gap-2">
                        <MessageCircle className="w-4 h-4" />
                        Your Bio
                      </label>
                      <textarea
                        value={editForm.bio || ""}
                        onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                        placeholder="Tell the community about yourself..."
                        className="w-full px-5 py-4 bg-zinc-800 border-2 border-zinc-600 focus:border-yellow-400 rounded-xl text-white resize-none h-28 focus:outline-none placeholder-gray-500 transition-all"
                      />
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-zinc-800/70 to-zinc-900/70 rounded-xl p-5 border border-zinc-700">
                      <div className="flex items-start gap-3">
                        <MessageCircle className="w-5 h-5 text-yellow-400 mt-1 flex-shrink-0" />
                        <p className="text-gray-300 leading-relaxed">
                          {profile.bio || "This member hasn't written a bio yet. 🤷‍♂️"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8">
            
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Profile Navigation Tabs */}
              <div className="bg-gradient-to-r from-zinc-900/95 to-zinc-800/95 backdrop-blur-xl border-2 border-yellow-500/30 rounded-2xl p-2 sm:p-2.5 shadow-xl">                <div className="flex gap-1.5 sm:gap-2">
                  <button
                    onClick={() => setActiveTab('posts')}
                    className={`flex-1 px-3 sm:px-6 py-3 sm:py-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base ${
                      activeTab === 'posts'
                        ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-lg shadow-yellow-500/30 scale-105'
                        : 'text-gray-400 hover:text-yellow-400 hover:bg-zinc-800/70'
                    }`}
                  >
                    <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    Posts ({posts.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`flex-1 px-3 sm:px-6 py-3 sm:py-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base ${
                      activeTab === 'overview'
                        ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-lg shadow-yellow-500/30 scale-105'
                        : 'text-gray-400 hover:text-yellow-400 hover:bg-zinc-800/70'
                    }`}
                  >
                    <Target className="w-4 h-4 sm:w-5 sm:h-5" />
                    Overview
                  </button>
                  {isOwnProfile && (
                    <button
                      onClick={() => setActiveTab('wishlist')}
                      className={`flex-1 px-3 sm:px-6 py-3 sm:py-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base ${
                        activeTab === 'wishlist'
                          ? 'bg-gradient-to-r from-pink-400 to-purple-500 text-white shadow-lg shadow-pink-500/30 scale-105'
                          : 'text-gray-400 hover:text-pink-400 hover:bg-zinc-800/70'
                      }`}
                    >
                      <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
                      Wishlist ({wishlist.length})
                    </button>
                  )}
                  <button
                    onClick={() => setActiveTab('activity')}
                    className={`flex-1 px-3 sm:px-6 py-3 sm:py-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base ${
                      activeTab === 'activity'
                        ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-lg shadow-yellow-500/30 scale-105'
                        : 'text-gray-400 hover:text-yellow-400 hover:bg-zinc-800/70'
                    }`}
                  >
                    <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
                    Activity
                  </button>
                </div>
              </div>              {/* Tab Content */}
              {activeTab === 'posts' && (
                <div className="space-y-6">
                  {/* Create Post (only for own profile) */}
                  {isOwnProfile && (
                    <CreatePost 
                      onPostCreated={handlePostCreated}
                      placeholder={`Share something with your ${liveStats.followers} followers...`}
                    />
                  )}

                  {/* Posts Feed */}
                  <div className="space-y-6">
                    {posts.length > 0 ? (
                      posts.map(post => (
                        <PostCard
                          key={post.id}
                          post={post}
                          onUpdate={handlePostUpdated}
                          onDelete={handlePostDeleted}
                        />
                      ))
                    ) : (
                      <div className="bg-zinc-900/50 border border-yellow-500/20 rounded-2xl p-12 text-center">
                        <div className="text-6xl mb-4">📝</div>
                        <h3 className="text-xl font-semibold text-gray-300 mb-2">
                          {isOwnProfile ? "Share your first post!" : "No posts yet"}
                        </h3>
                        <p className="text-gray-400">
                          {isOwnProfile 
                            ? "Share your thoughts, updates, or achievements with the community."
                            : `${profile?.username} hasn't posted anything yet.`
                          }                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'overview' && (
                <>
                  {/* Live Pledge Tracker */}
                  <div className="bg-zinc-900/90 backdrop-blur-sm border border-yellow-500/20 rounded-2xl p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-2xl font-bold text-yellow-400 flex items-center gap-3">
                        <span className="text-3xl">🎯</span>
                        Live Pledge Tracker
                      </h3>
                      <div className="flex items-center gap-2 bg-green-900/30 px-3 py-1 rounded-full border border-green-400/30">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-green-400 text-sm font-medium">Real-time</span>
                      </div>
                    </div>
                    
                    {/* Pledge Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-zinc-800/50 rounded-xl p-4 text-center border border-blue-500/20">
                        <div className="text-2xl font-bold text-blue-400 mb-1">{liveStats.activePledges}</div>
                        <div className="text-xs text-gray-400">Active Pledges</div>
                      </div>
                      <div className="bg-zinc-800/50 rounded-xl p-4 text-center border border-green-500/20">
                        <div className="text-2xl font-bold text-green-400 mb-1">{liveStats.completedPledges}</div>
                        <div className="text-xs text-gray-400">Complete Pledges</div>
                      </div>
                      <div className="bg-zinc-800/50 rounded-xl p-4 text-center border border-emerald-500/20">
                        <div className="text-2xl font-bold text-emerald-400 mb-1">${liveStats.totalPledgeAmount.toFixed(0)}</div>
                        <div className="text-xs text-gray-400">Money Saved</div>
                      </div>
                      <div className="bg-zinc-800/50 rounded-xl p-4 text-center border border-purple-500/20">
                        <div className="text-2xl font-bold text-purple-400 mb-1">{Math.round(liveStats.successRate)}</div>
                        <div className="text-xs text-gray-400">Votes Gone Live</div>
                      </div>
                    </div>

                    {/* Recent Pledge Activity */}
                    <div className="bg-zinc-800/30 rounded-xl p-4">
                      <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                        <span>⏰</span>
                        Recent Activity
                      </h4>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {(() => {
                          // Filter activities to only show meaningful actions
                          const allActivities = UserStorage.getUserActivity(profile.id);
                          const filteredActivities = allActivities.filter((activity: any) => {
                            // Only show: pledges, votes, and purchases (wallet transactions)
                            if (activity.type === 'pledge') return true;
                            if (activity.type === 'vote') return true;
                            if (activity.type === 'wallet' && activity.action?.includes('purchase')) return true;
                            if (activity.type === 'drop' && activity.action?.includes('joined')) return true;
                            return false;
                          });

                          const getActivityIcon = (type: string) => {
                            switch (type) {
                              case 'pledge': return '🤝';
                              case 'vote': return '🗳️';
                              case 'wallet': return '�';
                              case 'drop': return '�';
                              default: return '⚡';
                            }
                          };

                          const getActivityColor = (type: string) => {
                            switch (type) {
                              case 'pledge': return 'text-green-400';
                              case 'vote': return 'text-purple-400';
                              case 'wallet': return 'text-emerald-400';
                              case 'drop': return 'text-orange-400';
                              default: return 'text-gray-400';
                            }
                          };

                          return filteredActivities.slice(0, 4).map((activity: any, index: number) => (
                            <div key={index} className="flex items-center gap-3 p-2 bg-zinc-700/50 rounded-lg">
                              <span className="text-lg">{getActivityIcon(activity.type)}</span>
                              <div className="flex-1 min-w-0">
                                <div className={`text-sm font-medium ${getActivityColor(activity.type)}`}>
                                  {activity.description || activity.action}
                                </div>
                                {activity.details?.savedAmount && (
                                  <div className="text-xs text-green-400 font-semibold">
                                    Saved ${activity.details.savedAmount.toFixed(2)}
                                  </div>
                                )}
                                <div className="text-xs text-gray-400">
                                  {new Date(activity.timestamp).toLocaleDateString()} at {new Date(activity.timestamp).toLocaleTimeString()}
                                </div>
                              </div>
                            </div>
                          ));
                        })()}
                        
                        {(() => {
                          const allActivities = UserStorage.getUserActivity(profile.id);
                          const filteredActivities = allActivities.filter((activity: any) => {
                            if (activity.type === 'pledge') return true;
                            if (activity.type === 'vote') return true;
                            if (activity.type === 'wallet' && activity.action?.includes('purchase')) return true;
                            if (activity.type === 'drop' && activity.action?.includes('joined')) return true;
                            return false;
                          });
                          
                          return filteredActivities.length === 0 && (
                            <div className="text-gray-400 text-center py-4 text-sm">No meaningful activity recorded yet</div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'activity' && (
                <>
                  {/* Activity Timeline */}
                  <div className="bg-zinc-900/90 backdrop-blur-sm border border-yellow-500/20 rounded-2xl p-6 shadow-lg">

                    <h3 className="text-2xl font-bold text-yellow-400 mb-6 flex items-center gap-3">
                      <span className="text-3xl">📊</span>
                      Activity Timeline
                    </h3>
                    
                    <div className="space-y-4 max-h-80 overflow-y-auto">
                      {(() => {
                        // Filter activities to only show meaningful actions
                        const allActivities = UserStorage.getUserActivity(profile.id);
                        const filteredActivities = allActivities.filter((activity: any) => {
                          // Only show: pledges, votes, and purchases (wallet transactions)
                          if (activity.type === 'pledge') return true;
                          if (activity.type === 'vote') return true;
                          if (activity.type === 'wallet' && activity.action?.includes('purchase')) return true;
                          if (activity.type === 'drop' && activity.action?.includes('joined')) return true;
                          return false;
                        });

                        const getActivityIcon = (type: string, action: string) => {
                          if (type === 'pledge') return '🤝';
                          if (type === 'vote') return '�️';
                          if (type === 'wallet') return '�';
                          if (type === 'drop') return '📦';
                          return '⚡';
                        };

                        const getActivityColor = (type: string) => {
                          switch (type) {
                            case 'pledge': return 'border-green-500/50 hover:border-green-400/50 bg-green-900/10';
                            case 'vote': return 'border-purple-500/50 hover:border-purple-400/50 bg-purple-900/10';
                            case 'wallet': return 'border-emerald-500/50 hover:border-emerald-400/50 bg-emerald-900/10';
                            case 'drop': return 'border-orange-500/50 hover:border-orange-400/50 bg-orange-900/10';
                            default: return 'border-zinc-700/50 hover:border-yellow-400/30';
                          }
                        };

                        return filteredActivities.slice(0, 20).map((activity: any, index: number) => (
                          <div key={index} className={`flex items-start gap-4 p-4 rounded-lg border ${getActivityColor(activity.type)} transition-colors`}>
                            <div className="text-2xl flex-shrink-0">
                              {getActivityIcon(activity.type, activity.action)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium">
                                {activity.description || activity.action}
                              </p>
                              {activity.details?.savedAmount && (
                                <p className="text-green-400 font-semibold mt-1">
                                  💵 Saved ${activity.details.savedAmount.toFixed(2)}
                                </p>
                              )}
                              <p className="text-sm text-gray-400 mt-1">
                                {new Date(activity.timestamp).toLocaleDateString()} at {new Date(activity.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ));
                      })()}
                      
                      {(() => {
                        const allActivities = UserStorage.getUserActivity(profile.id);
                        const filteredActivities = allActivities.filter((activity: any) => {
                          if (activity.type === 'pledge') return true;
                          if (activity.type === 'vote') return true;
                          if (activity.type === 'wallet' && activity.action?.includes('purchase')) return true;
                          if (activity.type === 'drop' && activity.action?.includes('joined')) return true;
                          return false;
                        });
                        
                        return filteredActivities.length === 0 && (
                          <div className="text-center py-12">
                            <div className="text-6xl mb-4">🌟</div>
                            <p className="text-gray-400">No meaningful activity recorded yet</p>
                            <p className="text-sm text-gray-500 mt-2">Make pledges, vote on drops, or make purchases to see your activity here!</p>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </>
              )}

              {/* Wishlist Tab (Pinterest-style) - Only for Own Profile */}
              {activeTab === 'wishlist' && isOwnProfile && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-pink-900/20 via-purple-900/20 to-zinc-900/50 border-2 border-pink-500/30 rounded-2xl p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 text-transparent bg-clip-text flex items-center gap-3">
                        <Heart className="w-8 h-8 text-pink-500 fill-pink-500" />
                        My Wishlist Board
                      </h3>
                      <Link
                        href="/account/wishlist"
                        className="text-sm text-pink-400 hover:text-pink-300 flex items-center gap-2 font-medium"
                      >
                        View Full Board
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                    
                    {wishlistLoading ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-400 mx-auto mb-4"></div>
                        <p className="text-zinc-400">Loading your wishlist...</p>
                      </div>
                    ) : wishlist.length === 0 ? (
                      <div className="text-center py-12">
                        <Heart className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                        <h4 className="text-xl font-semibold text-white mb-2">Your wishlist is empty</h4>
                        <p className="text-zinc-400 mb-6">Start saving products you love!</p>
                        <Link
                          href="/voting"
                          className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold px-6 py-3 rounded-lg transition-all"
                        >
                          <Star className="w-4 h-4" />
                          Discover Products
                        </Link>
                      </div>
                    ) : (
                      <>
                        {/* Pinterest-style Masonry Grid */}
                        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
                          {wishlist.slice(0, 9).map((item) => (
                            <div
                              key={item.id}
                              className="group relative bg-zinc-800/50 border border-zinc-700 rounded-xl overflow-hidden hover:border-pink-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-pink-500/20 break-inside-avoid mb-4"
                            >
                              {/* Product Image */}
                              <Link href={`/products/${item.productSlug || item.productId}`}>
                                <div className="relative aspect-[3/4] overflow-hidden bg-zinc-900">
                                  {item.productImage ? (
                                    <Image
                                      src={item.productImage}
                                      alt={item.productName}
                                      fill
                                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Star className="w-12 h-12 text-zinc-700" />
                                    </div>
                                  )}
                                  
                                  {/* Hover Overlay */}
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                                    <div className="w-full">
                                      {item.productPrice && (
                                        <p className="text-lg font-bold text-yellow-400 mb-2">
                                          ${item.productPrice.toFixed(2)}
                                        </p>
                                      )}
                                      <div className="flex gap-2">
                                        <div className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-center py-2 rounded-lg font-semibold text-sm">
                                          View Product
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </Link>
                              
                              {/* Product Info */}
                              <div className="p-3">
                                <h4 className="font-semibold text-white text-sm line-clamp-2 mb-1">
                                  {item.productName}
                                </h4>
                                <p className="text-xs text-zinc-500">
                                  Added {new Date(item.addedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* View All Button if more than 9 items */}
                        {wishlist.length > 9 && (
                          <div className="text-center mt-6 pt-6 border-t border-zinc-800">
                            <Link
                              href="/account/wishlist"
                              className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold px-8 py-3 rounded-lg transition-all shadow-lg hover:shadow-pink-500/50"
                            >
                              <Heart className="w-5 h-5" />
                              View All {wishlist.length} Products
                            </Link>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Enhanced Sidebar */}
            <div className="space-y-6">
              
              {/* Social Stats */}
              <div className="bg-zinc-900/90 backdrop-blur-sm border border-yellow-500/20 rounded-2xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
                  <span className="text-2xl">📈</span>
                  Social Stats
                </h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-800/50 rounded-lg p-4 text-center border border-blue-500/20">
                      <div className="text-2xl font-bold text-blue-400 mb-1">{posts.length}</div>
                      <div className="text-xs text-gray-400">Posts</div>
                    </div>
                    <div className="bg-zinc-800/50 rounded-lg p-4 text-center border border-green-500/20">
                      <div className="text-2xl font-bold text-green-400 mb-1">
                        {posts.reduce((sum, post) => sum + post.likes, 0)}
                      </div>
                      <div className="text-xs text-gray-400">Total Likes</div>
                    </div>
                    <div className="bg-zinc-800/50 rounded-lg p-4 text-center border border-yellow-500/20">
                      <div className="text-2xl font-bold text-yellow-400 mb-1">
                        {posts.reduce((sum, post) => sum + post.comments, 0)}
                      </div>
                      <div className="text-xs text-gray-400">Comments</div>
                    </div>
                    <div className="bg-zinc-800/50 rounded-lg p-4 text-center border border-purple-500/20">
                      <div className="text-2xl font-bold text-purple-400 mb-1">
                        {posts.reduce((sum, post) => sum + post.shares, 0)}
                      </div>
                      <div className="text-xs text-gray-400">Shares</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ...existing sidebar content... */}
            </div>
          </div>
        </div>
      </div>

      {/* Followers/Following Modal */}
      <FollowersModal
        userId={profile?.id || 0}
        username={profile?.username || ''}
        type={followersModal.type}
        isOpen={followersModal.isOpen}
        onClose={() => setFollowersModal({ isOpen: false, type: 'followers' })}
      />
    </>
  );
}
