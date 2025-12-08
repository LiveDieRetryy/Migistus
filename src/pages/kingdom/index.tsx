import Head from "next/head";
import DashboardLayout from "@/components/DashboardLayout";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

interface DashboardStats {
  users: {
    total: number;
    newToday: number;
    active: number;
    optedInMarketing: number;
  };
  voting: {
    activePolls: number;
    totalVotes: number;
    pendingApproval: number;
  };
  products: {
    total: number;
    comingSoon: number;
    live: number;
    staffPicks: number;
  };
  liveDrops: {
    active: number;
    scheduled: number;
    participants: number;
  };
  campaigns: {
    sent: number;
    scheduled: number;
    drafts: number;
  };
  recentActivity: Array<{
    type: string;
    message: string;
    timestamp: string;
    severity: 'info' | 'warning' | 'success' | 'error';
  }>;

}

interface LiveProduct {
  id: string;
  name: string;
  status: string;
  participants?: number;
  goal?: number;
  timeLeft?: string;
}

export default function KingsDomainPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [liveProducts, setLiveProducts] = useState<LiveProduct[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    users: { total: 0, newToday: 0, active: 0, optedInMarketing: 0 },
    voting: { activePolls: 0, totalVotes: 0, pendingApproval: 0 },
    products: { total: 0, comingSoon: 0, live: 0, staffPicks: 0 },
    liveDrops: { active: 0, scheduled: 0, participants: 0 },
    campaigns: { sent: 0, scheduled: 0, drafts: 0 },
    recentActivity: []
  });
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isAdmin = localStorage.getItem("isAdmin") === "true";
      if (!isAdmin) {
        router.replace("/admin-login");
      } else {
        setLoading(false);
        loadDashboardData();
        
        // Set up auto-refresh every 30 seconds
        const interval = setInterval(loadDashboardData, 30000);
        return () => clearInterval(interval);
      }
    }
  }, [router]);

  const loadDashboardData = async () => {
    try {
      setRefreshing(true);
      // Load all stats in parallel
      const [usersResponse, votingResponse, productsResponse, liveDropsResponse] = await Promise.all([
        fetch('/api/admin/stats/users'),
        fetch('/api/admin/stats/voting'),
        fetch('/api/admin/stats/products'),
        fetch('/api/live-drops').catch(() => ({ json: () => ({ liveDrops: [] }) }))
      ]);

      const [usersData, votingData, productsData, liveDropsResponseData] = await Promise.all([
        usersResponse.json(),
        votingResponse.json(),
        productsResponse.json(),
        liveDropsResponse.json()
      ]);

      const liveDropsData = liveDropsResponseData.liveDrops || [];
      const campaignsData = JSON.parse(localStorage.getItem('marketing_campaigns') || '[]');

      // Generate recent activity
      const recentActivity = [
        { type: 'user', message: `${usersData.newToday || 0} new users registered today`, timestamp: '5 min ago', severity: 'success' as const },
        { type: 'vote', message: `${votingData.activePolls || 0} active polls running`, timestamp: '12 min ago', severity: 'info' as const },
        { type: 'product', message: `${productsData.live || 0} products currently live`, timestamp: '18 min ago', severity: 'info' as const },
        { type: 'drop', message: `${liveDropsData.filter((d: any) => d.status === 'active').length} live drops active`, timestamp: '25 min ago', severity: 'warning' as const }
      ];

      // Parse live products for tracking
      const activeLiveProducts: LiveProduct[] = liveDropsData
        .filter((drop: any) => drop.status === 'active')
        .slice(0, 3)
        .map((drop: any) => ({
          id: drop.id,
          name: drop.name || 'Unnamed Drop',
          status: drop.status,
          participants: drop.participants || 0,
          goal: drop.pledgeGoal || 100,
          timeLeft: '2h 45m' // Mock time calculation
        }));

      setStats({
        users: usersData,
        voting: votingData,
        products: productsData,
        liveDrops: {
          active: liveDropsData.filter((drop: any) => drop.status === 'active').length,
          scheduled: liveDropsData.filter((drop: any) => drop.status === 'scheduled').length,
          participants: liveDropsData.reduce((sum: number, drop: any) => sum + (drop.participants || 0), 0)
        },
        campaigns: {
          sent: campaignsData.filter((c: any) => c.status === 'sent').length,
          scheduled: campaignsData.filter((c: any) => c.status === 'scheduled').length,
          drafts: campaignsData.filter((c: any) => c.status === 'draft').length,
        },
        recentActivity
      });

      setLiveProducts(activeLiveProducts);
      setLastUpdate(new Date());

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-yellow-400 text-xl">Loading The King's Domain...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <Head>
        <title>The King's Domain - MIGISTUS Admin</title>
      </Head>

      {/* Enhanced Glassmorphic Header */}
      <div className="mb-8 bg-gradient-to-r from-zinc-900/80 via-zinc-800/80 to-zinc-900/80 backdrop-blur-xl rounded-3xl p-8 border-2 border-yellow-500/30 shadow-2xl shadow-black/50 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-transparent to-yellow-500/5 animate-pulse"></div>
        
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-4 mb-3">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/30 animate-pulse">
                  <span className="text-3xl">👑</span>
                </div>
                <div>
                  <h1 className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 bg-clip-text text-transparent">
                    The King's Domain
                  </h1>
                  <p className="text-gray-300 text-lg font-semibold">Real-time Command Center</p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 mt-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500/20 to-green-600/20 border border-green-500/40 rounded-xl">
                  <span className="text-green-400 text-2xl">👥</span>
                  <div>
                    <div className="text-2xl font-black text-white">{stats.users.total.toLocaleString()}</div>
                    <div className="text-green-400 text-xs font-bold">Total Users</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-500/40 rounded-xl">
                  <span className="text-blue-400 text-2xl">🔥</span>
                  <div>
                    <div className="text-2xl font-black text-white">{stats.products.live}</div>
                    <div className="text-blue-400 text-xs font-bold">Live Products</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-purple-600/20 border border-purple-500/40 rounded-xl">
                  <span className="text-purple-400 text-2xl">🗳️</span>
                  <div>
                    <div className="text-2xl font-black text-white">{stats.voting.activePolls}</div>
                    <div className="text-purple-400 text-xs font-bold">Active Polls</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 lg:mt-0">
              <div className="flex flex-col items-end gap-3">
                <button
                  onClick={loadDashboardData}
                  disabled={refreshing}
                  className={`flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-black rounded-xl shadow-lg shadow-yellow-500/30 transition-all duration-300 ${refreshing ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                >
                  <span className={`text-xl ${refreshing ? 'animate-spin' : ''}`}>🔄</span>
                  <span>{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
                </button>
                
                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 ${refreshing 
                  ? 'bg-yellow-500/10 border-yellow-500/40' 
                  : 'bg-green-500/10 border-green-500/40'
                }`}>
                  <div className={`w-3 h-3 rounded-full ${refreshing 
                    ? 'bg-yellow-400 animate-bounce' 
                    : 'bg-green-400 animate-pulse'
                  } shadow-lg ${refreshing ? 'shadow-yellow-400/50' : 'shadow-green-400/50'}`}></div>
                  <span className={`text-sm font-black ${refreshing 
                    ? 'text-yellow-400' 
                    : 'text-green-400'
                  }`}>
                    {refreshing ? 'Syncing...' : 'Live Data'}
                  </span>
                </div>
                
                <p className="text-gray-400 text-xs font-semibold">
                  Last updated: <span className="text-yellow-400">{lastUpdate.toLocaleTimeString()}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Users Card */}
        <div className="group bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 backdrop-blur-xl border-2 border-blue-500/30 rounded-2xl p-6 hover:border-blue-400/60 transition-all duration-300 shadow-xl hover:shadow-blue-500/20 hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
              <span className="text-3xl">👥</span>
            </div>
            <div className="px-3 py-1 bg-blue-500/20 border border-blue-500/40 rounded-lg">
              <span className="text-blue-400 font-black text-sm">+{stats.users.newToday} today</span>
            </div>
          </div>
          <div className="text-4xl font-black text-white mb-2">{stats.users.total.toLocaleString()}</div>
          <div className="text-blue-400 text-sm font-bold mb-3">Total Users</div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400 font-semibold">{stats.users.active} active</span>
            <span className="text-green-400 font-bold">+{Math.round((stats.users.newToday / stats.users.total) * 100)}%</span>
          </div>
        </div>

        {/* Live Products Card */}
        <div className="group bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 backdrop-blur-xl border-2 border-green-500/30 rounded-2xl p-6 hover:border-green-400/60 transition-all duration-300 shadow-xl hover:shadow-green-500/20 hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30 group-hover:scale-110 transition-transform">
              <span className="text-3xl">🔥</span>
            </div>
            <div className="px-3 py-1 bg-green-500/20 border border-green-500/40 rounded-lg">
              <span className="text-green-400 font-black text-sm">{stats.liveDrops.participants} users</span>
            </div>
          </div>
          <div className="text-4xl font-black text-white mb-2">{stats.products.live}</div>
          <div className="text-green-400 text-sm font-bold mb-3">Live Products</div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400 font-semibold">{stats.products.comingSoon} coming soon</span>
            <span className="text-yellow-400 font-bold">{stats.products.staffPicks} picked</span>
          </div>
        </div>

        {/* Active Polls Card */}
        <div className="group bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 backdrop-blur-xl border-2 border-purple-500/30 rounded-2xl p-6 hover:border-purple-400/60 transition-all duration-300 shadow-xl hover:shadow-purple-500/20 hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
              <span className="text-3xl">🗳️</span>
            </div>
            <div className="px-3 py-1 bg-purple-500/20 border border-purple-500/40 rounded-lg">
              <span className="text-purple-400 font-black text-sm">{stats.voting.totalVotes} votes</span>
            </div>
          </div>
          <div className="text-4xl font-black text-white mb-2">{stats.voting.activePolls}</div>
          <div className="text-purple-400 text-sm font-bold mb-3">Active Polls</div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400 font-semibold">{stats.voting.pendingApproval} pending</span>
            <span className="text-green-400 font-bold">Live</span>
          </div>
        </div>

        {/* Campaigns Card */}
        <div className="group bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 backdrop-blur-xl border-2 border-yellow-500/30 rounded-2xl p-6 hover:border-yellow-400/60 transition-all duration-300 shadow-xl hover:shadow-yellow-500/20 hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/30 group-hover:scale-110 transition-transform">
              <span className="text-3xl">💰</span>
            </div>
            <div className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/40 rounded-lg">
              <span className="text-yellow-400 font-black text-sm">{stats.campaigns.scheduled} queued</span>
            </div>
          </div>
          <div className="text-4xl font-black text-white mb-2">{stats.campaigns.sent}</div>
          <div className="text-yellow-400 text-sm font-bold mb-3">Campaigns Sent</div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400 font-semibold">{stats.campaigns.drafts} drafts</span>
            <span className="text-blue-400 font-bold">{stats.users.optedInMarketing} opted-in</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Live Product Tracking */}
        <div className="lg:col-span-2 space-y-6">
          {/* Live Product Tracking */}
          <div className="bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 backdrop-blur-xl border-2 border-yellow-500/30 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-xl">🎯</span>
                </div>
                <h2 className="text-2xl font-black text-yellow-400">Live Product Tracking</h2>
              </div>
              <Link href="/kingdom/live-drops" className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/40 hover:border-yellow-500/60 rounded-xl text-yellow-400 font-bold text-sm transition-all hover:scale-105">
                View All →
              </Link>
            </div>
            
            {liveProducts.length > 0 ? (
              <div className="space-y-4">
                {liveProducts.map((product) => (
                  <div key={product.id} className="bg-zinc-700/50 hover:bg-zinc-700/70 border-2 border-zinc-600 hover:border-yellow-500/40 rounded-xl p-5 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-black text-white text-lg">{product.name}</h3>
                      <span className="px-4 py-1.5 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs rounded-lg font-black shadow-lg shadow-green-500/30">
                        ● {product.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">👥</span>
                        <span className="text-white font-bold text-lg">
                          {product.participants}
                          <span className="text-gray-400">/{product.goal}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1 bg-orange-500/20 border border-orange-500/40 rounded-lg">
                        <span className="text-lg">⏱️</span>
                        <span className="text-orange-400 font-black text-sm">{product.timeLeft}</span>
                      </div>
                    </div>
                    <div className="relative bg-zinc-800 rounded-full h-3 overflow-hidden">
                      <div 
                        className="absolute inset-0 bg-gradient-to-r from-green-500 via-yellow-400 to-green-500 h-3 rounded-full transition-all duration-500 shadow-lg"
                        style={{ width: `${Math.min((product.participants! / product.goal!) * 100, 100)}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                      </div>
                    </div>
                    <div className="mt-2 text-right">
                      <span className="text-xs font-bold text-gray-400">
                        {Math.round((product.participants! / product.goal!) * 100)}% Complete
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-zinc-800/30 rounded-xl border-2 border-dashed border-zinc-600">
                <span className="text-6xl mb-4 block animate-bounce">📦</span>
                <p className="text-gray-400 font-semibold text-lg">No live products currently active</p>
                <p className="text-gray-500 text-sm mt-2">Products will appear here when they go live</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 backdrop-blur-xl border-2 border-yellow-500/30 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-xl">⚡</span>
              </div>
              <h2 className="text-2xl font-black text-yellow-400">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/kingdom/products" className="group flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white px-4 py-6 rounded-xl text-center transition-all duration-300 font-black shadow-lg hover:shadow-blue-500/30 hover:scale-105">
                <span className="text-3xl group-hover:scale-110 transition-transform">📦</span>
                <span className="text-sm">Add Product</span>
              </Link>
              <Link href="/kingdom/voting" className="group flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white px-4 py-6 rounded-xl text-center transition-all duration-300 font-black shadow-lg hover:shadow-purple-500/30 hover:scale-105">
                <span className="text-3xl group-hover:scale-110 transition-transform">🗳️</span>
                <span className="text-sm">Create Poll</span>
              </Link>
              <Link href="/kingdom/marketing" className="group flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white px-4 py-6 rounded-xl text-center transition-all duration-300 font-black shadow-lg hover:shadow-green-500/30 hover:scale-105">
                <span className="text-3xl group-hover:scale-110 transition-transform">📧</span>
                <span className="text-sm">Send Campaign</span>
              </Link>
              <Link href="/kingdom/users" className="group flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 text-white px-4 py-6 rounded-xl text-center transition-all duration-300 font-black shadow-lg hover:shadow-orange-500/30 hover:scale-105">
                <span className="text-3xl group-hover:scale-110 transition-transform">👥</span>
                <span className="text-sm">Manage Users</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column - Activity Feed & Admin Modules */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <div className="bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 backdrop-blur-xl border-2 border-yellow-500/30 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-xl">📈</span>
              </div>
              <h2 className="text-2xl font-black text-yellow-400">Recent Activity</h2>
            </div>
            <div className="space-y-3">
              {stats.recentActivity.map((activity, index) => (
                <div key={index} className="group flex items-start gap-3 p-4 bg-zinc-700/30 hover:bg-zinc-700/50 rounded-xl border border-zinc-600 hover:border-yellow-500/40 transition-all duration-300">
                  <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 shadow-lg ${
                    activity.severity === 'success' ? 'bg-green-400 shadow-green-400/50' :
                    activity.severity === 'warning' ? 'bg-yellow-400 shadow-yellow-400/50' :
                    activity.severity === 'error' ? 'bg-red-400 shadow-red-400/50' : 'bg-blue-400 shadow-blue-400/50'
                  } ${activity.severity === 'success' ? 'animate-pulse' : ''}`}></div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-semibold">{activity.message}</p>
                    <p className="text-gray-400 text-xs mt-1 font-medium">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Admin Modules */}
          <div className="bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 backdrop-blur-xl border-2 border-yellow-500/30 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-xl">🎛️</span>
              </div>
              <h2 className="text-2xl font-black text-yellow-400">Admin Modules</h2>
            </div>
            <div className="space-y-3">
              <Link href="/kingdom/analytics" className="group flex items-center gap-4 p-4 bg-zinc-700/30 hover:bg-zinc-700/50 rounded-xl border-2 border-zinc-600 hover:border-blue-500/40 transition-all duration-300 hover:scale-105">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <span className="text-2xl">📊</span>
                </div>
                <div className="flex-1">
                  <div className="text-white font-black">Analytics</div>
                  <div className="text-gray-400 text-xs font-semibold">Performance insights</div>
                </div>
                <span className="text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </Link>
              
              <Link href="/kingdom/content" className="group flex items-center gap-4 p-4 bg-zinc-700/30 hover:bg-zinc-700/50 rounded-xl border-2 border-zinc-600 hover:border-purple-500/40 transition-all duration-300 hover:scale-105">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <span className="text-2xl">🎨</span>
                </div>
                <div className="flex-1">
                  <div className="text-white font-black">Content</div>
                  <div className="text-gray-400 text-xs font-semibold">Manage site content</div>
                </div>
                <span className="text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </Link>
              
              <Link href="/kingdom/settings" className="group flex items-center gap-4 p-4 bg-zinc-700/30 hover:bg-zinc-700/50 rounded-xl border-2 border-zinc-600 hover:border-green-500/40 transition-all duration-300 hover:scale-105">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <span className="text-2xl">⚙️</span>
                </div>
                <div className="flex-1">
                  <div className="text-white font-black">Settings</div>
                  <div className="text-gray-400 text-xs font-semibold">System configuration</div>
                </div>
                <span className="text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Disable footer for all Kingdom pages
(KingsDomainPage as any).showFooter = false;