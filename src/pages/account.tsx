import { useEffect, useState } from "react";
import Head from "next/head";
import MainNavbar from "@/components/nav/MainNavbar";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext"; // Updated import
import { UserStorage3 as UserStorage } from "@/utils/userStorage";
import { activityTracker } from "@/utils/activityTracker";

const accountNav = [
  { label: "Account Overview", href: "/account", icon: "🏠" },
  { label: "My Current Pledges", href: "/account/pledges", icon: "🤝" },
  { label: "Pledge History", href: "/account/pledge-history", icon: "📋" },
  { label: "My Wishlist", href: "/account/wishlist", icon: "❤️" },
  { label: "My Votes", href: "/account/votes", icon: "🗳️" },
  { label: "Wallet", href: "/wallet", icon: "💰" },
  { label: "View Profile", href: "/account/profile", icon: "👤" },
  { label: "Account Settings", href: "/account/settings", icon: "⚙️" },
];

export default function AccountPage() {
  const { user, isAuthenticated, loading } = useAuth(); // Updated to use correct hook
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    pledges: 0,
    votes: 0,
    guildCoins: 0,
    walletBalance: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
      return;
    }

    if (user) {
      loadUserData();
    }
  }, [user, isAuthenticated, loading, router]);
  const loadUserData = async () => {
    if (!user) return;

    // Track account page access
    activityTracker.trackPageView('/account');
    activityTracker.trackAccountMenuAction('account_page_loaded', {
      userId: user.id,
      username: user.username
    });

    try {
      // Load profile data
      const profileData = UserStorage.getUserProfile(user.id);
      setProfile(profileData);

      // Load wallet and coins
      const walletBalance = UserStorage.getUserWalletBalance(user.id);
      const guildCoins = UserStorage.getUserGuildCoins(user.id);

      // Load pledges
      const pledgesRes = await fetch(`/api/account/pledges?userId=${user.id}`);
      const pledges = await pledgesRes.json();

      // Load votes
      const votesRes = await fetch(`/api/votes`);
      const allVotes = await votesRes.json();
      const userVotes = allVotes.filter((vote: any) => vote.userId === user.id);

      setStats({
        pledges: pledges.length,
        votes: userVotes.length,
        guildCoins,
        walletBalance,
      });      // Load recent activity - filter to only show votes, pledges, follows, likes, and comments
      const activity = UserStorage.getUserActivity(user.id);
      const allowedActivityTypes = ['vote', 'pledge', 'social', 'like', 'comment'];
      const filteredActivity = activity.filter((a: any) => allowedActivityTypes.includes(a.type));
      setRecentActivity(filteredActivity.slice(0, 5));
    } catch (error) {
      console.error("Failed to load user data:", error);
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
                      onClick={() => {
                        // Track account page navigation
                        activityTracker.trackAccountMenuAction('account_page_navigate', {
                          destination: item.href,
                          label: item.label,
                          icon: item.icon
                        });
                      }}
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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-zinc-900/50 backdrop-blur-sm border border-yellow-500/20 rounded-xl p-6 text-center">
                <div className="text-3xl mb-2">🤝</div>
                <div className="text-2xl font-bold text-yellow-400">
                  {stats.pledges}
                </div>
                <div className="text-sm text-gray-400">Active Pledges</div>
              </div>              <div className="bg-zinc-900/50 backdrop-blur-sm border border-yellow-500/20 rounded-xl p-6 text-center">
                <div className="text-3xl mb-2">🗳️</div>
                <div className="text-2xl font-bold text-blue-400">
                  {UserStorage.getTodaysVoteCount(user.id)}
                </div>
                <div className="text-sm text-gray-400">Votes Today</div>
              </div>

              <div className="bg-zinc-900/50 backdrop-blur-sm border border-yellow-500/20 rounded-xl p-6 text-center">
                <div className="text-3xl mb-2">🪙</div>
                <div className="text-2xl font-bold text-yellow-400">
                  {stats.guildCoins}
                </div>
                <div className="text-sm text-gray-400">Guild Coins</div>
              </div>

              <div className="bg-zinc-900/50 backdrop-blur-sm border border-yellow-500/20 rounded-xl p-6 text-center">
                <div className="text-3xl mb-2">💰</div>
                <div className="text-2xl font-bold text-green-400">
                  ${stats.walletBalance.toFixed(2)}
                </div>
                <div className="text-sm text-gray-400">Wallet Balance</div>
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
              <h2 className="text-2xl font-bold text-yellow-400 mb-6">
                Recent Activity
              </h2>
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (                    <div
                      key={index}
                      className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-lg"
                    >
                      <div className="text-2xl">
                        {activity.type === 'vote' && '🗳️'}
                        {activity.type === 'pledge' && '🤝'}
                        {activity.type === 'social' && '👥'}
                        {activity.type === 'like' && '❤️'}
                        {activity.type === 'comment' && '💬'}
                        {!['vote', 'pledge', 'social', 'like', 'comment'].includes(activity.type) && (activity.icon || "📝")}
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-medium">{activity.action}</div>
                        <div className="text-sm text-gray-400">
                          {new Date(activity.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (                <div className="text-center py-8">
                  <div className="text-6xl mb-4 opacity-50">📊</div>
                  <p className="text-gray-400">No recent activity</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Start voting, pledging, following users, liking, or commenting to see activity here
                  </p>
                </div>
              )}
            </div>

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
