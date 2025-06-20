import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Head from "next/head";
import MainNavbar from "@/components/nav/MainNavbar";
import { useAuth } from "@/context/AuthContext";
import { UserStorage3 as UserStorage } from "@/utils/userStorage";
import Image from "next/image";
import Link from "next/link";
import FollowButton from '@/components/FollowButton';
import FollowersModal from '@/components/FollowersModal';
import CreatePost from '@/components/social/CreatePost';
import PostCard from '@/components/social/PostCard';
import { SocialPostsStorage, SocialPost } from '@/utils/socialPostsStorage';

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

export default function UserProfilePage() {
  const router = useRouter();
  const { slug } = router.query;
  const { user: currentUser, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});  const [liveStats, setLiveStats] = useState({
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
  const [activeTab, setActiveTab] = useState<'overview' | 'posts' | 'activity'>('posts');
  const [mounted, setMounted] = useState(false);

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

  // Mounted effect
  useEffect(() => {
    setMounted(true);
  }, []);

  // Real-time update interval
  useEffect(() => {
    if (!profile) return;
    
    const updateLiveStats = () => {
      const stats = UserStorage.calculateUserStats(profile.id);
      const pledges = UserStorage.getUserPledges(profile.id);      setLiveStats({
        activePledges: pledges.filter((p: any) => p.status === 'active').length,
        completedPledges: pledges.filter((p: any) => p.status === 'completed').length,
        totalPledgeAmount: pledges.reduce((sum: number, p: any) => sum + (p.amount || 0), 0),
        successRate: pledges.length > 0 ? 
          (pledges.filter((p: any) => p.status === 'completed').length / pledges.length) * 100 : 0,
        profileViews: UserStorage.getUserProfileViews(profile.id),
        interactions: UserStorage.getUserInteractions(profile.id),
        reputation: UserStorage.getUserReputation(profile.id),
        followers: UserStorage.getUserFollowers(profile.id) || 0,
        following: UserStorage.getUserFollowing(profile.id) || 0,
        lastActive: new Date().toISOString()
      });
    };

    // Update immediately
    updateLiveStats();
    
    // Update every 10 seconds
    const interval = setInterval(updateLiveStats, 10000);
    return () => clearInterval(interval);
  }, [profile]);

  useEffect(() => {
    if (!slug) return;
    
    const loadProfile = () => {
      setLoading(true);
      
      // Search all user profiles for matching slug
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
            // Enhance profile with calculated stats
            const stats = UserStorage.calculateUserStats(userProfile.id);
            const walletBalance = UserStorage.getUserWalletBalance(userProfile.id);
            const guildCoins = UserStorage.getUserGuildCoins(userProfile.id);
            
            const enhancedProfile = {
              ...userProfile,
              stats,
              walletBalance,
              guildCoins
            };
            
            setProfile(enhancedProfile);
            setIsOwnProfile(currentUser?.id === userProfile.id);
            setEditForm(enhancedProfile);
            
            // Increment profile views (only for non-own profiles)
            if (currentUser?.id !== userProfile.id) {
              UserStorage.incrementProfileViews(userProfile.id);
            }
            break;
          }
        } catch (error) {
          console.error("Error parsing profile:", error);
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

    const handleFollowerUpdate = (event: CustomEvent) => {
      const { targetUserId, isFollowing } = event.detail;
      
      // If this profile is being followed/unfollowed
      if (targetUserId === profile.id) {
        setLiveStats(prev => ({
          ...prev,
          followers: UserStorage.getUserFollowers(profile.id) || 0,
          lastActive: new Date().toISOString()
        }));
      }
    };

    // Also listen for when this user follows/unfollows others (to update following count)
    const handleFollowingUpdate = () => {
      if (profile?.id) {
        setLiveStats(prev => ({
          ...prev,
          following: UserStorage.getUserFollowing(profile.id) || 0,
          lastActive: new Date().toISOString()
        }));
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

      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white">
        {/* Enhanced Banner Section */}
        <div className="relative h-72 bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-yellow-400/20 to-purple-400/20"></div>
            <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-400/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-400/10 rounded-full blur-3xl"></div>
          </div>
          
          {/* Custom Banner or Placeholder */}
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
          
          {/* Banner Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
          
          {/* Banner Edit Button */}
          {isOwnProfile && isEditing && (
            <label className="absolute top-6 right-6 bg-zinc-900/90 hover:bg-zinc-800/90 backdrop-blur-sm px-4 py-2 rounded-lg cursor-pointer transition-all border border-yellow-400/30 hover:border-yellow-400/60">
              <span className="text-yellow-400 font-semibold">📷 Change Banner</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleBannerUpload}
                className="hidden"
              />
            </label>
          )}
          
          {/* Live Status Indicator */}
          <div className="absolute top-6 left-6 flex items-center gap-2 bg-zinc-900/90 backdrop-blur-sm px-3 py-2 rounded-lg border border-green-400/30">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-400 text-sm font-medium">Live Tracking</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 -mt-24 relative z-10">
          {/* Enhanced Profile Header */}
          <div className="bg-zinc-900/95 backdrop-blur-sm border border-yellow-500/20 rounded-2xl p-8 mb-8 shadow-2xl">
            <div className="flex flex-col lg:flex-row items-start gap-8">
              {/* Avatar Section */}
              <div className="relative flex-shrink-0">
                <div className="w-40 h-40 rounded-2xl border-4 border-yellow-400/30 overflow-hidden bg-zinc-700 shadow-2xl">
                  <Image
                    src={(isEditing ? editForm.avatar : profile?.avatar) || "/Icons/New Member.png"}
                    alt={profile?.username || "Profile"}
                    width={160}
                    height={160}
                    className="w-full h-full object-cover"
                    priority
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/Icons/New Member.png";
                    }}
                  />
                </div>
                
                {/* Avatar Edit Button */}
                {isOwnProfile && isEditing && (
                  <label className="absolute bottom-0 right-0 bg-yellow-400 hover:bg-yellow-300 p-3 rounded-full cursor-pointer transition-colors shadow-lg border-2 border-zinc-900">
                    <span className="text-black text-lg">📷</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </label>
                )}
                
                {/* Tier Badge */}
                <div className={`absolute -top-2 -right-2 px-3 py-1 bg-gradient-to-r ${getTierColor(profile?.tier)} rounded-full text-white font-bold text-sm shadow-lg border-2 border-zinc-900`}>
                  <span className="mr-1">{getTierIcon(profile?.tier)}</span>
                  {profile?.tier || "New Member"}
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                  <div className="flex-1">
                    <h1 className="text-4xl font-bold text-yellow-400 mb-3 break-words">
                      {profile.username}
                    </h1>
                      {/* Live Stats Bar */}
                    <div className="flex flex-wrap items-center gap-4 mb-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span className="text-blue-400 font-semibold">{liveStats.activePledges}</span>
                        <span className="text-gray-400">Active Pledges</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-green-400 font-semibold">{liveStats.reputation}</span>
                        <span className="text-gray-400">Reputation</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                        <span className="text-purple-400 font-semibold">{Math.round(liveStats.successRate)}%</span>
                        <span className="text-gray-400">Success Rate</span>
                      </div>
                      
                      {/* Followers Count - Clickable */}
                      <button
                        onClick={() => setFollowersModal({ isOpen: true, type: 'followers' })}
                        className="flex items-center gap-2 hover:bg-zinc-800/50 rounded-lg px-2 py-1 transition-colors group"
                      >
                        <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                        <span className="text-pink-400 font-semibold group-hover:text-pink-300">{liveStats.followers}</span>
                        <span className="text-gray-400 group-hover:text-gray-300">Followers</span>
                      </button>
                      
                      {/* Following Count - Clickable */}
                      <button
                        onClick={() => setFollowersModal({ isOpen: true, type: 'following' })}
                        className="flex items-center gap-2 hover:bg-zinc-800/50 rounded-lg px-2 py-1 transition-colors group"
                      >
                        <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                        <span className="text-orange-400 font-semibold group-hover:text-orange-300">{liveStats.following}</span>
                        <span className="text-gray-400 group-hover:text-gray-300">Following</span>
                      </button>
                    </div>
                    
                    {/* Member Since */}
                    <p className="text-gray-400 mb-4">
                      <span className="text-yellow-400">🗓️</span> Member since {new Date(profile.joinedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    {isOwnProfile ? (
                      isEditing ? (
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveProfile}
                            className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg"
                          >
                            ✅ Save Changes
                          </button>
                          <button
                            onClick={() => {
                              setIsEditing(false);
                              setEditForm(profile);
                            }}
                            className="bg-gray-600 hover:bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="bg-yellow-600 hover:bg-yellow-500 text-black px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg"
                        >
                          ✏️ Edit Profile
                        </button>
                      )
                    ) : (
                      <div className="flex gap-2">
                        <FollowButton
                          targetUserId={profile.id}
                          targetUsername={profile.username}
                          initialFollowersCount={UserStorage.getUserFollowers(profile.id)}
                          onFollowChange={(isFollowing, newCount) => {
                            // Update local profile state when follow status changes
                            setProfile(prev => prev ? {
                              ...prev,
                              followers: newCount
                            } : null);                            // Update live stats
                            setLiveStats(prev => ({
                              ...prev,
                              followers: newCount,
                              lastActive: new Date().toISOString()
                            }));
                          }}
                          size="lg"
                          variant="default"
                        />
                        <button className="bg-zinc-700 hover:bg-zinc-600 text-white px-6 py-3 rounded-lg font-semibold transition-all">
                          💬 Message
                        </button>
                      </div>
                    )}
                  </div>
                </div>                {/* Bio Section */}
                <div className="mb-6">
                  {isEditing ? (
                    <textarea
                      value={editForm.bio || ""}
                      onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Tell the community about yourself..."
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-white resize-none h-24 focus:border-yellow-400 focus:outline-none placeholder-gray-500"
                    />
                  ) : (
                    <div className="bg-zinc-800/50 rounded-lg p-4">
                      <p className="text-gray-300 leading-relaxed">
                        {profile.bio || "This member hasn't written a bio yet. 🤷‍♂️"}
                      </p>
                    </div>
                  )}
                </div>

                {/* Social Stats Section */}
                <div className="mb-6">
                  <div className="bg-gradient-to-r from-zinc-800/50 to-zinc-900/50 rounded-xl p-4 border border-zinc-700/50">
                    <div className="flex items-center justify-center gap-8">
                      {/* Followers */}
                      <button
                        onClick={() => setFollowersModal({ isOpen: true, type: 'followers' })}
                        className="flex flex-col items-center gap-2 hover:bg-zinc-700/30 rounded-lg px-4 py-3 transition-all group"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-pink-400 rounded-full"></div>
                          <span className="text-2xl font-bold text-pink-400 group-hover:text-pink-300 transition-colors">
                            {liveStats.followers}
                          </span>
                        </div>
                        <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                          Followers
                        </span>
                      </button>

                      {/* Divider */}
                      <div className="w-px h-12 bg-zinc-600"></div>

                      {/* Following */}
                      <button
                        onClick={() => setFollowersModal({ isOpen: true, type: 'following' })}
                        className="flex flex-col items-center gap-2 hover:bg-zinc-700/30 rounded-lg px-4 py-3 transition-all group"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
                          <span className="text-2xl font-bold text-orange-400 group-hover:text-orange-300 transition-colors">
                            {liveStats.following}
                          </span>
                        </div>
                        <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                          Following
                        </span>
                      </button>

                      {/* Divider */}
                      <div className="w-px h-12 bg-zinc-600"></div>

                      {/* Posts Count */}
                      <div className="flex flex-col items-center gap-2 px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                          <span className="text-2xl font-bold text-blue-400">
                            {posts.length}
                          </span>
                        </div>
                        <span className="text-sm text-gray-400">
                          Posts
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Profile Navigation Tabs */}
              <div className="bg-zinc-900/90 backdrop-blur-sm border border-yellow-500/20 rounded-2xl p-2 shadow-lg">                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab('posts')}
                    className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
                      activeTab === 'posts'
                        ? 'bg-yellow-400 text-black'
                        : 'text-gray-400 hover:text-yellow-400 hover:bg-zinc-800/50'
                    }`}
                  >
                    � Posts ({posts.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
                      activeTab === 'overview'
                        ? 'bg-yellow-400 text-black'
                        : 'text-gray-400 hover:text-yellow-400 hover:bg-zinc-800/50'
                    }`}
                  >
                    � Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('activity')}
                    className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
                      activeTab === 'activity'
                        ? 'bg-yellow-400 text-black'
                        : 'text-gray-400 hover:text-yellow-400 hover:bg-zinc-800/50'
                    }`}
                  >
                    ⚡ Activity
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
                        <div className="text-xs text-gray-400">Active</div>
                      </div>
                      <div className="bg-zinc-800/50 rounded-xl p-4 text-center border border-green-500/20">
                        <div className="text-2xl font-bold text-green-400 mb-1">{liveStats.completedPledges}</div>
                        <div className="text-xs text-gray-400">Completed</div>
                      </div>
                      <div className="bg-zinc-800/50 rounded-xl p-4 text-center border border-yellow-500/20">
                        <div className="text-2xl font-bold text-yellow-400 mb-1">${liveStats.totalPledgeAmount.toFixed(0)}</div>
                        <div className="text-xs text-gray-400">Total Value</div>
                      </div>
                      <div className="bg-zinc-800/50 rounded-xl p-4 text-center border border-purple-500/20">
                        <div className="text-2xl font-bold text-purple-400 mb-1">{Math.round(liveStats.successRate)}%</div>
                        <div className="text-xs text-gray-400">Success</div>
                      </div>
                    </div>

                    {/* Recent Pledge Activity */}
                    <div className="bg-zinc-800/30 rounded-xl p-4">
                      <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                        <span>⏰</span>
                        Recent Activity
                      </h4>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {UserStorage.getUserActivity(profile.id).slice(0, 4).map((activity: any, index: number) => {
                          // Enhanced activity display with better formatting
                          const getActivityIcon = (type: string) => {
                            switch (type) {
                              case 'social': return '👥';
                              case 'pledge': return '🤝';
                              case 'vote': return '🗳️';
                              case 'profile': return '👤';
                              default: return '⚡';
                            }
                          };

                          const getActivityColor = (type: string) => {
                            switch (type) {
                              case 'social': return 'text-blue-400';
                              case 'pledge': return 'text-green-400';
                              case 'vote': return 'text-purple-400';
                              case 'profile': return 'text-yellow-400';
                              default: return 'text-gray-400';
                            }
                          };

                          return (
                            <div key={index} className="flex items-center gap-3 p-2 bg-zinc-700/50 rounded-lg">
                              <span className="text-lg">{getActivityIcon(activity.type)}</span>
                              <div className="flex-1 min-w-0">
                                <div className={`text-sm font-medium ${getActivityColor(activity.type)}`}>
                                  {activity.description || activity.action}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {new Date(activity.timestamp).toLocaleDateString()} at {new Date(activity.timestamp).toLocaleTimeString()}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        
                        {UserStorage.getUserActivity(profile.id).length === 0 && (
                          <div className="text-gray-400 text-center py-4 text-sm">No activity recorded yet</div>
                        )}
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
                      {UserStorage.getUserActivity(profile.id).slice(0, 8).map((activity: any, index: number) => {
                        const getActivityIcon = (type: string) => {
                          switch (type) {
                            case 'social': return '👥';
                            case 'pledge': return '🤝';
                            case 'vote': return '🗳️';
                            case 'profile': return '👤';
                            case 'wallet': return '💰';
                            case 'drop': return '📦';
                            default: return '⚡';
                          }
                        };

                        const getActivityColor = (type: string) => {
                          switch (type) {
                            case 'social': return 'border-blue-500/50 hover:border-blue-400/50';
                            case 'pledge': return 'border-green-500/50 hover:border-green-400/50';
                            case 'vote': return 'border-purple-500/50 hover:border-purple-400/50';
                            case 'profile': return 'border-yellow-500/50 hover:border-yellow-400/50';
                            case 'wallet': return 'border-emerald-500/50 hover:border-emerald-400/50';
                            case 'drop': return 'border-orange-500/50 hover:border-orange-400/50';
                            default: return 'border-zinc-700/50 hover:border-yellow-400/30';
                          }
                        };

                        return (
                          <div key={index} className={`flex items-start gap-4 p-4 bg-zinc-800/50 rounded-lg border ${getActivityColor(activity.type)} transition-colors`}>
                            <div className="text-2xl flex-shrink-0">
                              {getActivityIcon(activity.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium">
                                {activity.description || activity.action}
                              </p>
                              <p className="text-sm text-gray-400 mt-1">
                                {new Date(activity.timestamp).toLocaleDateString()} at {new Date(activity.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      
                      {UserStorage.getUserActivity(profile.id).length === 0 && (
                        <div className="text-center py-12">
                          <div className="text-6xl mb-4">🌟</div>
                          <p className="text-gray-400">No activity recorded yet</p>
                          <p className="text-sm text-gray-500 mt-2">Start engaging to see your activity here!</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
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
