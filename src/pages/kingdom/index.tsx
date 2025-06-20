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

      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-yellow-400 mb-2">
              🛡️ The King's Domain
            </h1>
            <p className="text-zinc-400 text-lg">Real-time admin control center</p>
            <div className="flex items-center space-x-6 mt-3 text-sm">
              <span className="text-zinc-400">
                <span className="text-green-400 font-medium">{stats.users.total}</span> users
              </span>
              <span className="text-zinc-400">
                <span className="text-blue-400 font-medium">{stats.products.live}</span> live products
              </span>
              <span className="text-zinc-400">
                <span className="text-purple-400 font-medium">{stats.voting.activePolls}</span> active polls
              </span>
            </div>
          </div>
          <div className="mt-4 lg:mt-0 text-right">
            <div className="flex items-center space-x-3">
              <button
                onClick={loadDashboardData}
                disabled={refreshing}
                className={`inline-flex items-center px-3 py-1 rounded-lg bg-zinc-800 border border-zinc-600 hover:border-zinc-500 transition ${refreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className={`text-zinc-400 text-sm mr-2 ${refreshing ? 'animate-spin' : ''}`}>🔄</span>
                <span className="text-zinc-300 text-sm">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
              <div className={`inline-flex items-center px-3 py-1 rounded-full border ${refreshing 
                ? 'bg-yellow-900/20 border-yellow-500/30' 
                : 'bg-green-900/20 border-green-500/30'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${refreshing 
                  ? 'bg-yellow-400 animate-bounce' 
                  : 'bg-green-400 animate-pulse'
                }`}></div>
                <span className={`text-sm font-medium ${refreshing 
                  ? 'text-yellow-400' 
                  : 'text-green-400'
                }`}>
                  {refreshing ? 'Updating...' : 'Live Data'}
                </span>
              </div>
            </div>
            <p className="text-zinc-500 text-xs mt-1">Last updated: {lastUpdate.toLocaleTimeString()}</p>
          </div>
        </div>
      </div>

      {/* Real-time Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Users */}
        <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border border-blue-500/30 rounded-xl p-6 hover:border-blue-400/50 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <span className="text-2xl">👥</span>
            </div>
            <span className="text-xs text-blue-400 font-medium">+{stats.users.newToday} today</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{stats.users.total.toLocaleString()}</div>
          <div className="text-blue-400 text-sm font-medium">Total Users</div>
        </div>

        {/* Live Products */}
        <div className="bg-gradient-to-br from-green-900/20 to-green-800/10 border border-green-500/30 rounded-xl p-6 hover:border-green-400/50 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <span className="text-2xl">🔥</span>
            </div>
            <span className="text-xs text-green-400 font-medium">{stats.liveDrops.participants} active</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{stats.products.live}</div>
          <div className="text-green-400 text-sm font-medium">Live Products</div>
        </div>

        {/* Active Polls */}
        <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border border-purple-500/30 rounded-xl p-6 hover:border-purple-400/50 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <span className="text-2xl">🗳️</span>
            </div>
            <span className="text-xs text-purple-400 font-medium">{stats.voting.totalVotes} votes</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{stats.voting.activePolls}</div>
          <div className="text-purple-400 text-sm font-medium">Active Polls</div>
        </div>

        {/* Revenue/Orders */}
        <div className="bg-gradient-to-br from-yellow-900/20 to-yellow-800/10 border border-yellow-500/30 rounded-xl p-6 hover:border-yellow-400/50 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <span className="text-2xl">💰</span>
            </div>
            <span className="text-xs text-yellow-400 font-medium">campaigns</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{stats.campaigns.sent}</div>
          <div className="text-yellow-400 text-sm font-medium">Campaigns Sent</div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Live Product Tracking */}
        <div className="lg:col-span-2">
          <div className="bg-zinc-900/50 border border-zinc-700 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">🎯 Live Product Tracking</h2>
              <Link href="/kingdom/live-drops" className="text-yellow-400 hover:text-yellow-300 text-sm font-medium">
                View All →
              </Link>
            </div>
            
            {liveProducts.length > 0 ? (
              <div className="space-y-4">
                {liveProducts.map((product) => (
                  <div key={product.id} className="bg-zinc-800/50 border border-zinc-600 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-white">{product.name}</h3>
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full font-medium">
                        {product.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-400">
                        {product.participants}/{product.goal} participants
                      </span>
                      <span className="text-orange-400 font-medium">⏱️ {product.timeLeft}</span>
                    </div>
                    <div className="mt-2 bg-zinc-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-yellow-400 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((product.participants! / product.goal!) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-zinc-400">
                <span className="text-4xl mb-4 block">📦</span>
                <p>No live products currently active</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-zinc-900/50 border border-zinc-700 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">⚡ Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/kingdom/products" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg text-center transition font-medium">
                Add Product
              </Link>
              <Link href="/kingdom/voting" className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg text-center transition font-medium">
                Create Poll
              </Link>
              <Link href="/kingdom/marketing" className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg text-center transition font-medium">
                Send Campaign
              </Link>
              <Link href="/kingdom/users" className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg text-center transition font-medium">
                Manage Users
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column - Activity Feed & Admin Modules */}
        <div>
          {/* Recent Activity */}
          <div className="bg-zinc-900/50 border border-zinc-700 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-6">📈 Recent Activity</h2>
            <div className="space-y-3">
              {stats.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-zinc-800/30 rounded-lg">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.severity === 'success' ? 'bg-green-400' :
                    activity.severity === 'warning' ? 'bg-yellow-400' :
                    activity.severity === 'error' ? 'bg-red-400' : 'bg-blue-400'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-white text-sm">{activity.message}</p>
                    <p className="text-zinc-400 text-xs">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Admin Modules */}
          <div className="bg-zinc-900/50 border border-zinc-700 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">🎛️ Admin Modules</h2>
            <div className="space-y-3">
              <Link href="/kingdom/analytics" className="flex items-center p-3 bg-zinc-800/50 hover:bg-zinc-700/50 rounded-lg transition">
                <span className="text-2xl mr-3">📊</span>
                <div>
                  <div className="text-white font-medium">Analytics</div>
                  <div className="text-zinc-400 text-xs">Performance insights</div>
                </div>
              </Link>
              <Link href="/kingdom/content" className="flex items-center p-3 bg-zinc-800/50 hover:bg-zinc-700/50 rounded-lg transition">
                <span className="text-2xl mr-3">🎨</span>
                <div>
                  <div className="text-white font-medium">Content</div>
                  <div className="text-zinc-400 text-xs">Manage site content</div>
                </div>
              </Link>
              <Link href="/kingdom/settings" className="flex items-center p-3 bg-zinc-800/50 hover:bg-zinc-700/50 rounded-lg transition">
                <span className="text-2xl mr-3">⚙️</span>
                <div>
                  <div className="text-white font-medium">Settings</div>
                  <div className="text-zinc-400 text-xs">System configuration</div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-zinc-600 mt-12 py-6 border-t border-zinc-800">
        <p className="font-medium">🏰 The King's Domain</p>
        <p className="text-xs mt-1">© 2025 MIGISTUS · Sovereign Admin Control</p>
      </footer>
    </DashboardLayout>
  );
}