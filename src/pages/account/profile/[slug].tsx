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
import { Shield, Award, Star, TrendingUp, Users as UsersIcon, Heart, MessageCircle, Share2, Zap, Eye, Target, Clock, Activity } from "lucide-react";

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
        
        // Increment profile views (only for non-own profiles)
        if (currentUser?.id !== foundProfile.id) {
          UserStorage.incrementProfileViews(foundProfile.id);
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

      <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black text-white">
        {/* Enhanced Banner Section with Gradient Overlay */}
        <div className="relative h-80 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
          </div>
          
          {/* Custom Banner or Placeholder */}
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
          
          {/* Enhanced Banner Overlay with Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30"></div>
          
          {/* Banner Edit Button */}
          {isOwnProfile && isEditing && (
            <label className="absolute top-6 right-6 bg-zinc-900/90 hover:bg-zinc-800/90 backdrop-blur-sm px-5 py-3 rounded-xl cursor-pointer transition-all border-2 border-yellow-400/30 hover:border-yellow-400/60 shadow-lg hover:shadow-yellow-400/20 group">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-yellow-400 group-hover:scale-110 transition-transform" />
                <span className="text-yellow-400 font-semibold">Change Banner</span>
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
          <div className="absolute top-6 left-6 flex items-center gap-3 bg-gradient-to-r from-green-900/90 to-emerald-900/90 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-green-400/40 shadow-lg">
            <div className="relative">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
            </div>
            <span className="text-green-300 text-sm font-semibold">Live Profile</span>
          </div>

          {/* Profile Stats Badge */}
          <div className="absolute bottom-6 left-6 flex items-center gap-3">
            <div className="bg-zinc-900/90 backdrop-blur-sm px-4 py-2 rounded-xl border border-blue-400/40 flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-400" />
              <span className="text-blue-300 text-sm font-medium">{liveStats.profileViews} views</span>
            </div>
            <div className="bg-zinc-900/90 backdrop-blur-sm px-4 py-2 rounded-xl border border-purple-400/40 flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-400" />
              <span className="text-purple-300 text-sm font-medium">{liveStats.reputation} reputation</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 -mt-32 relative z-10">
          {/* Enhanced Profile Header */}
          <div className="bg-gradient-to-br from-zinc-900/95 to-zinc-800/95 backdrop-blur-xl border-2 border-yellow-500/30 rounded-3xl p-8 mb-8 shadow-2xl">
            <div className="flex flex-col lg:flex-row items-start gap-8">
              {/* Avatar Section */}
              <div className="relative flex-shrink-0 group">
                <div className="w-44 h-44 rounded-3xl border-4 border-yellow-400/40 overflow-hidden bg-zinc-700 shadow-2xl ring-4 ring-yellow-400/10 group-hover:ring-yellow-400/30 transition-all duration-300">
                  <Image
                    src={(isEditing ? editForm.avatar : profile?.avatar) || "/Icons/New Member.png"}
                    alt={profile?.username || "Profile"}
                    width={176}
                    height={176}
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
                  <label className="absolute bottom-2 right-2 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 p-3 rounded-full cursor-pointer transition-all shadow-lg border-2 border-zinc-900 hover:scale-110 group">
                    <Shield className="w-5 h-5 text-black" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </label>
                )}
                
                {/* Enhanced Tier Badge */}
                <div className={`absolute -top-3 -right-3 px-4 py-2 bg-gradient-to-r ${getTierColor(profile?.tier)} rounded-xl text-white font-bold text-sm shadow-xl border-2 border-zinc-900 flex items-center gap-2`}>
                  <Award className="w-4 h-4" />
                  <span>{getTierIcon(profile?.tier)}</span>
                  <span>{profile?.tier || "New Member"}</span>
                </div>

                {/* Reputation Score Badge */}
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-purple-500 px-4 py-1.5 rounded-full border-2 border-zinc-900 shadow-lg flex items-center gap-2">
                  <Star className="w-3 h-3 text-yellow-300" />
                  <span className="text-white text-sm font-bold">{liveStats.reputation}</span>
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                  <div className="flex-1">
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent mb-4 break-words">
                      {profile.username}
                    </h1>
                      {/* Enhanced Live Stats Bar */}
                    <div className="flex flex-wrap items-center gap-3 mb-5">
                      <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-lg px-3 py-2">
                        <Target className="w-4 h-4 text-blue-400" />
                        <span className="text-blue-400 font-bold text-lg">{liveStats.activePledges}</span>
                        <span className="text-gray-400 text-sm">Active</span>
                      </div>
                      <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2">
                        <Shield className="w-4 h-4 text-green-400" />
                        <span className="text-green-400 font-bold text-lg">{liveStats.reputation}</span>
                        <span className="text-gray-400 text-sm">Reputation</span>
                      </div>
                      <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 rounded-lg px-3 py-2">
                        <TrendingUp className="w-4 h-4 text-purple-400" />
                        <span className="text-purple-400 font-bold text-lg">{Math.round(liveStats.successRate)}%</span>
                        <span className="text-gray-400 text-sm">Success</span>
                      </div>
                      
                      {/* Followers Count - Clickable */}
                      <button
                        onClick={() => setFollowersModal({ isOpen: true, type: 'followers' })}
                        className="flex items-center gap-2 bg-pink-500/10 border border-pink-500/30 hover:border-pink-500/60 rounded-lg px-3 py-2 transition-all group"
                      >
                        <UsersIcon className="w-4 h-4 text-pink-400" />
                        <span className="text-pink-400 font-bold text-lg group-hover:text-pink-300">{liveStats.followers}</span>
                        <span className="text-gray-400 text-sm group-hover:text-gray-300">Followers</span>
                      </button>
                      
                      {/* Following Count - Clickable */}
                      <button
                        onClick={() => setFollowersModal({ isOpen: true, type: 'following' })}
                        className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 hover:border-orange-500/60 rounded-lg px-3 py-2 transition-all group"
                      >
                        <Heart className="w-4 h-4 text-orange-400" />
                        <span className="text-orange-400 font-bold text-lg group-hover:text-orange-300">{liveStats.following}</span>
                        <span className="text-gray-400 text-sm group-hover:text-gray-300">Following</span>
                      </button>
                    </div>
                    
                    {/* Member Since */}
                    <div className="flex items-center gap-2 text-gray-300 mb-4 bg-zinc-800/50 w-fit px-4 py-2 rounded-lg border border-zinc-700">
                      <Clock className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm">Member since {new Date(profile.joinedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    {isOwnProfile ? (
                      isEditing ? (
                        <div className="flex gap-3">
                          <button
                            onClick={handleSaveProfile}
                            className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white px-8 py-3 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg hover:shadow-green-500/30"
                          >
                            <Shield className="w-5 h-5" />
                            Save Changes
                          </button>
                          <button
                            onClick={() => {
                              setIsEditing(false);
                              setEditForm(profile);
                            }}
                            className="flex items-center gap-2 bg-zinc-700 hover:bg-zinc-600 text-white px-8 py-3 rounded-xl font-bold transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="flex items-center gap-2 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 text-black px-8 py-3 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg hover:shadow-yellow-500/30"
                        >
                          <Activity className="w-5 h-5" />
                          Edit Profile
                        </button>
                      )
                    ) : (
                      <div className="flex gap-3">
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
                        <button className="flex items-center gap-2 bg-gradient-to-r from-zinc-700 to-zinc-600 hover:from-zinc-600 hover:to-zinc-500 text-white px-8 py-3 rounded-xl font-bold transition-all hover:scale-105">
                          <MessageCircle className="w-5 h-5" />
                          Message
                        </button>
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

                {/* Enhanced Social Stats Section */}
                <div className="mb-6">
                  <div className="bg-gradient-to-r from-zinc-800/70 to-zinc-900/70 rounded-2xl p-6 border-2 border-zinc-700 hover:border-yellow-500/30 transition-all">
                    <div className="flex items-center justify-around gap-4">
                      {/* Followers */}
                      <button
                        onClick={() => setFollowersModal({ isOpen: true, type: 'followers' })}
                        className="flex flex-col items-center gap-3 hover:bg-zinc-700/40 rounded-xl px-6 py-4 transition-all group flex-1"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-pink-400 rounded-full group-hover:scale-125 transition-transform"></div>
                          <span className="text-3xl font-bold text-pink-400 group-hover:text-pink-300 transition-colors">
                            {liveStats.followers}
                          </span>
                        </div>
                        <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors font-medium">
                          Followers
                        </span>
                      </button>

                      {/* Divider */}
                      <div className="w-px h-16 bg-zinc-600"></div>

                      {/* Following */}
                      <button
                        onClick={() => setFollowersModal({ isOpen: true, type: 'following' })}
                        className="flex flex-col items-center gap-3 hover:bg-zinc-700/40 rounded-xl px-6 py-4 transition-all group flex-1"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-orange-400 rounded-full group-hover:scale-125 transition-transform"></div>
                          <span className="text-3xl font-bold text-orange-400 group-hover:text-orange-300 transition-colors">
                            {liveStats.following}
                          </span>
                        </div>
                        <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors font-medium">
                          Following
                        </span>
                      </button>

                      {/* Divider */}
                      <div className="w-px h-16 bg-zinc-600"></div>

                      {/* Posts Count */}
                      <div className="flex flex-col items-center gap-3 px-6 py-4 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                          <span className="text-3xl font-bold text-blue-400">
                            {posts.length}
                          </span>
                        </div>
                        <span className="text-sm text-gray-400 font-medium">
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
              <div className="bg-gradient-to-r from-zinc-900/95 to-zinc-800/95 backdrop-blur-xl border-2 border-yellow-500/30 rounded-2xl p-2.5 shadow-xl">                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab('posts')}
                    className={`flex-1 px-6 py-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                      activeTab === 'posts'
                        ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-lg shadow-yellow-500/30 scale-105'
                        : 'text-gray-400 hover:text-yellow-400 hover:bg-zinc-800/70'
                    }`}
                  >
                    <MessageCircle className="w-5 h-5" />
                    Posts ({posts.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`flex-1 px-6 py-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                      activeTab === 'overview'
                        ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-lg shadow-yellow-500/30 scale-105'
                        : 'text-gray-400 hover:text-yellow-400 hover:bg-zinc-800/70'
                    }`}
                  >
                    <Target className="w-5 h-5" />
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('activity')}
                    className={`flex-1 px-6 py-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                      activeTab === 'activity'
                        ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-lg shadow-yellow-500/30 scale-105'
                        : 'text-gray-400 hover:text-yellow-400 hover:bg-zinc-800/70'
                    }`}
                  >
                    <Activity className="w-5 h-5" />
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
