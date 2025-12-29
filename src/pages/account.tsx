import { useEffect, useState } from "react";
import Head from "next/head";
import MainNavbar from "@/components/nav/MainNavbar";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import { userAPI } from "@/lib/userAPI";
import { useSession } from "@/hooks/useSession";
import { Upload, Edit, TrendingUp, Users, Heart, Vote, Clock, Award, Loader2, AlertCircle } from "lucide-react";

export default function AccountPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  
  // Use session for display info only, don't redirect
  const sessionInfo = useSession({ 
    autoRefresh: false, // Disable auto-refresh for now
  });
  
  // Generate profile slug from username
  const getProfileSlug = () => {
    if (!user?.username) return "/account/profile";
    return `/account/profile/${user.username.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")}`;
  };

  const accountNav = [
    { label: "Account Overview", href: "/account", icon: "🏠" },
    { label: "Notifications", href: "/notifications", icon: "🔔" },
    { label: "My Current Pledges", href: "/account/pledges", icon: "🤝" },
    { label: "My Orders", href: "/account/orders", icon: "📦" },
    { label: "My Wishlist", href: "/account/wishlist", icon: "❤️" },
    { label: "My Votes", href: "/account/votes", icon: "🗳️" },
    { label: "Wallet", href: "/wallet", icon: "💰" },
    { label: "View Profile", href: getProfileSlug(), icon: "👤" },
    { label: "Account Settings", href: "/account/settings", icon: "⚙️" },
  ];
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }

    if (user) {
      loadUserData();
    }
  }, [user, isAuthenticated, authLoading, router]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Load user stats via API with fallback
      try {
        const userStats = await userAPI.getStats(user.id);
        setStats(userStats);
      } catch (statsError) {
        console.warn("Failed to load stats from API, using defaults:", statsError);
        // Fallback to default stats
        setStats({
          followers_count: 0,
          following_count: 0,
          total_votes: 0,
          total_pledges: 0,
          products_created: 0,
          drops_participated: 0
        });
      }

      // Load user profile with fallback
      try {
        const userProfile = await userAPI.getProfile(user.id);
        setProfile(userProfile);
      } catch (profileError) {
        console.warn("Failed to load profile from API, using user data:", profileError);
        setProfile({
          id: user.id,
          username: user.username,
          email: user.email,
          tier: user.tier || 'FREE',
          created_at: new Date().toISOString()
        });
      }

      // Load recent activity with fallback
      try {
        const activity = await userAPI.getActivity(user.id, 10);
        setRecentActivity(activity);
      } catch (activityError) {
        console.warn("Failed to load activity from API:", activityError);
        setRecentActivity([]);
      }
    } catch (error) {
      console.error("Failed to load user data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>My Account - MIGISTUS</title>
        </Head>
        <MainNavbar />
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-yellow-400 text-xl">Loading your account...</div>
        </div>
      </>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <>
        <Head>
          <title>My Account - MIGISTUS</title>
        </Head>
        <MainNavbar />
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="bg-zinc-900 border border-yellow-500/20 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">
              Access Required
            </h2>
            <p className="text-gray-400 mb-6">
              Please sign in to view your account
            </p>
            <Link
              href="/login"
              className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-6 py-3 rounded-lg transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>My Account - MIGISTUS</title>
      </Head>
      <MainNavbar />

      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white">
        <div className="flex flex-col lg:flex-row items-start py-12 px-4 sm:px-8 max-w-7xl mx-auto gap-8">
          {/* Sidebar */}
          <aside className="w-full lg:w-80 mb-8 lg:mb-0">
            <nav className="bg-zinc-900/50 backdrop-blur-sm border border-yellow-500/20 rounded-2xl shadow-lg p-6 sticky top-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center text-2xl">
                  👤
                </div>
                <div>
                  <h2 className="text-xl font-bold text-yellow-400">
                    Account Menu
                  </h2>
                  <p className="text-sm text-gray-400">{user.username}</p>
                </div>
              </div>              <ul className="space-y-2">
                {accountNav.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        router.pathname === item.href
                          ? "bg-yellow-400 text-black font-semibold"
                          : "text-yellow-300 hover:bg-yellow-400/10 hover:text-yellow-400"
                      }`}
                    >
                      <span className="text-lg">{item.icon}</span>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 w-full space-y-8">
            {/* Welcome Section */}
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-yellow-500/20 rounded-2xl p-8">
              <h1 className="text-3xl font-bold text-yellow-400 mb-4">
                Welcome back, {user.username}!
              </h1>
              <p className="text-gray-300 text-lg">
                Here's an overview of your MIGISTUS account activity.
              </p>
            </div>

            {/* Stats Grid */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-zinc-900/50 backdrop-blur-sm border border-yellow-500/20 rounded-xl p-6 text-center hover:border-yellow-400/40 transition-colors">
                  <div className="flex justify-center mb-3">
                    <Users className="w-8 h-8 text-blue-400" />
                  </div>
                  <div className="text-3xl font-bold text-blue-400 mb-1">
                    {stats?.followers_count || 0}
                  </div>
                  <div className="text-sm text-gray-400">Followers</div>
                </div>

                <div className="bg-zinc-900/50 backdrop-blur-sm border border-yellow-500/20 rounded-xl p-6 text-center hover:border-yellow-400/40 transition-colors">
                  <div className="flex justify-center mb-3">
                    <Vote className="w-8 h-8 text-purple-400" />
                  </div>
                  <div className="text-3xl font-bold text-purple-400 mb-1">
                    {stats?.total_votes || 0}
                  </div>
                  <div className="text-sm text-gray-400">Total Votes</div>
                </div>

                <div className="bg-zinc-900/50 backdrop-blur-sm border border-yellow-500/20 rounded-xl p-6 text-center hover:border-yellow-400/40 transition-colors">
                  <div className="flex justify-center mb-3">
                    <Heart className="w-8 h-8 text-red-400" />
                  </div>
                  <div className="text-3xl font-bold text-red-400 mb-1">
                    {stats?.total_pledges || 0}
                  </div>
                  <div className="text-sm text-gray-400">Total Pledges</div>
                </div>

                <div className="bg-zinc-900/50 backdrop-blur-sm border border-yellow-500/20 rounded-xl p-6 text-center hover:border-yellow-400/40 transition-colors">
                  <div className="flex justify-center mb-3">
                    <TrendingUp className="w-8 h-8 text-green-400" />
                  </div>
                  <div className="text-3xl font-bold text-green-400 mb-1">
                    {profile?.tier || 'FREE'}
                  </div>
                  <div className="text-sm text-gray-400">Member Tier</div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-yellow-500/20 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-yellow-400 mb-4 flex items-center">
                <Award className="w-6 h-6 mr-2" />
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  href="/account/settings"
                  className="flex items-center p-4 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 rounded-lg transition-colors group"
                >
                  <Upload className="w-5 h-5 text-yellow-400 mr-3 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-semibold text-white">Upload Avatar</div>
                    <div className="text-xs text-gray-400">Update your profile picture</div>
                  </div>
                </Link>

                <Link
                  href={`/account/profile/${user?.username}`}
                  className="flex items-center p-4 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 rounded-lg transition-colors group"
                >
                  <Edit className="w-5 h-5 text-blue-400 mr-3 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-semibold text-white">Edit Profile</div>
                    <div className="text-xs text-gray-400">Update your bio and info</div>
                  </div>
                </Link>

                <Link
                  href="/account/settings"
                  className="flex items-center p-4 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 rounded-lg transition-colors group"
                >
                  <Clock className="w-5 h-5 text-purple-400 mr-3 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-semibold text-white">Activity Log</div>
                    <div className="text-xs text-gray-400">View your recent actions</div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Account Info */}
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-yellow-500/20 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-yellow-400 mb-6">
                Account Information
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Username
                  </label>
                  <div className="text-lg font-semibold text-white">
                    {user.username}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Email</label>
                  <div className="text-lg font-semibold text-white">
                    {user.email}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Member Tier
                  </label>
                  <div className="text-lg font-semibold text-purple-400">
                    {profile?.tier || "New Member"}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Join Date
                  </label>
                  <div className="text-lg font-semibold text-white">
                    {profile?.joinedDate || "Recently"}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-yellow-500/20 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-yellow-400 mb-6 flex items-center">
                <Clock className="w-6 h-6 mr-2" />
                Recent Activity
              </h2>
              {recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-4 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg transition-colors border border-zinc-700/50"
                    >
                      <div className="w-10 h-10 rounded-full bg-yellow-400/10 flex items-center justify-center flex-shrink-0">
                        {activity.type === 'vote' && <Vote className="w-5 h-5 text-purple-400" />}
                        {activity.type === 'pledge' && <Heart className="w-5 h-5 text-red-400" />}
                        {activity.type === 'follow' && <Users className="w-5 h-5 text-blue-400" />}
                        {activity.type === 'comment' && '💬'}
                        {!['vote', 'pledge', 'follow', 'comment'].includes(activity.type) && '📝'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium mb-1">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(activity.created_at).toLocaleDateString()} at{' '}
                          {new Date(activity.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No recent activity yet</p>
                  <p className="text-sm mt-1">Start exploring to see your activity here</p>
                </div>
              )}
            </div>

            {/* Session Info */}
            {sessionInfo.isExpiring && sessionInfo.timeUntilExpiration && (
              <div className="bg-orange-500/10 border border-orange-500 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-orange-400 mb-2 flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Session Expiring Soon
                </h3>
                <p className="text-sm text-orange-300">
                  Your session will expire in {Math.floor(sessionInfo.timeUntilExpiration / 60)} minutes.
                  Please save your work or refresh to extend your session.
                </p>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-yellow-500/20 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-yellow-400 mb-6">
                Quick Actions
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link
                  href="/drops"
                  className="flex flex-col items-center gap-2 p-4 bg-zinc-800/50 hover:bg-zinc-700/50 rounded-lg transition-colors text-center"
                >
                  <span className="text-2xl">🎯</span>
                  <span className="font-medium text-white">Browse Drops</span>
                </Link>

                <Link
                  href="/voting"
                  className="flex flex-col items-center gap-2 p-4 bg-zinc-800/50 hover:bg-zinc-700/50 rounded-lg transition-colors text-center"
                >
                  <span className="text-2xl">🗳️</span>
                  <span className="font-medium text-white">Vote</span>
                </Link>

                <Link
                  href="/wallet"
                  className="flex flex-col items-center gap-2 p-4 bg-zinc-800/50 hover:bg-zinc-700/50 rounded-lg transition-colors text-center"
                >
                  <span className="text-2xl">💰</span>
                  <span className="font-medium text-white">Manage Wallet</span>
                </Link>

                <Link
                  href="/account/settings"
                  className="flex flex-col items-center gap-2 p-4 bg-zinc-800/50 hover:bg-zinc-700/50 rounded-lg transition-colors text-center"
                >
                  <span className="text-2xl">⚙️</span>
                  <span className="font-medium text-white">Settings</span>
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
