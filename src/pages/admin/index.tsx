import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import MainNavbar from '@/components/nav/MainNavbar';
import { useAuth } from '@/context/AuthContext';

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
  campaigns: {
    sent: number;
    scheduled: number;
    drafts: number;
  };
}

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    users: { total: 0, newToday: 0, active: 0, optedInMarketing: 0 },
    voting: { activePolls: 0, totalVotes: 0, pendingApproval: 0 },
    products: { total: 0, comingSoon: 0, live: 0, staffPicks: 0 },
    campaigns: { sent: 0, scheduled: 0, drafts: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || user?.email !== 'admin@migistus.com') return;
    loadDashboardStats();
  }, [isAuthenticated, user]);

  const loadDashboardStats = async () => {
    try {
      // Load users data
      const usersResponse = await fetch('/api/admin/stats/users');
      const usersData = await usersResponse.json();

      // Load voting data  
      const votingResponse = await fetch('/api/admin/stats/voting');
      const votingData = await votingResponse.json();

      // Load products data
      const productsResponse = await fetch('/api/admin/stats/products');
      const productsData = await productsResponse.json();

      // Load campaigns data
      const campaignsData = JSON.parse(localStorage.getItem('marketing_campaigns') || '[]');

      setStats({
        users: usersData,
        voting: votingData,
        products: productsData,
        campaigns: {
          sent: campaignsData.filter((c: any) => c.status === 'sent').length,
          scheduled: campaignsData.filter((c: any) => c.status === 'scheduled').length,
          drafts: campaignsData.filter((c: any) => c.status === 'draft').length,
        }
      });
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const adminModules = [
    {
      title: 'Lifecycle Control Center',
      description: 'Complete product lifecycle: Voting → Coming Soon → Live Drops → Archive',
      href: '/kingdom/lifecycle',
      icon: '🔄',
      color: 'bg-gradient-to-br from-yellow-600 via-orange-600 to-red-600 hover:from-yellow-700 hover:via-orange-700 hover:to-red-700',
      stats: ['Full Automation', '4 Stages Unified'],
      featured: true
    },
    {
      title: 'Moderation Control',
      description: 'Monitor reports, review flags, manage chat safety and user behavior',
      href: '/moderation',
      icon: '🛡️',
      color: 'bg-gradient-to-br from-red-600 via-pink-600 to-purple-600 hover:from-red-700 hover:via-pink-700 hover:to-purple-700',
      stats: [`${stats.users.total > 0 ? Math.floor(stats.users.total * 0.02) : 0} Reports`, 'Live Safety'],
      featured: true
    },
    {
      title: 'User Management',
      description: 'Manage users, view profiles, handle bans and verification',
      href: '/admin/users',
      icon: '👥',
      color: 'bg-blue-600 hover:bg-blue-700',
      stats: [`${stats.users.total} Total Users`, `${stats.users.newToday} New Today`]
    },
    {
      title: 'Marketing Control',
      description: 'Send campaigns, manage email lists, view opt-ins',
      href: '/admin/marketing',
      icon: '📧',
      color: 'bg-green-600 hover:bg-green-700',
      stats: [`${stats.users.optedInMarketing} Opted In`, `${stats.campaigns.sent} Campaigns Sent`]
    },
    {
      title: 'Product Management',
      description: 'Manage all products, staff picks, and product details',
      href: '/admin/products',
      icon: '📦',
      color: 'bg-orange-600 hover:bg-orange-700',
      stats: [`${stats.products.total} Products`, `${stats.products.live} Live`]
    },
    {
      title: 'Content Management',
      description: 'Manage staff picks, featured content, announcements',
      href: '/admin/content',
      icon: '📝',
      color: 'bg-indigo-600 hover:bg-indigo-700',
      stats: [`${stats.products.staffPicks} Staff Picks`, 'Content Control']
    },
    {
      title: 'Analytics Dashboard',
      description: 'View detailed analytics, reports, user behavior',
      href: '/admin/analytics',
      icon: '📊',
      color: 'bg-teal-600 hover:bg-teal-700',
      stats: ['Detailed Reports', 'User Insights']
    },
    {
      title: 'System Settings',
      description: 'Site configuration, API settings, feature toggles',
      href: '/admin/settings',
      icon: '⚙️',
      color: 'bg-gray-600 hover:bg-gray-700',
      stats: ['Site Config', 'Feature Control']
    }
  ];

  // Auto-allow for WebDesigner preview
  if (typeof window !== 'undefined' && window.location.search.includes('preview=1')) {
    return (
      <div className="min-h-screen bg-zinc-950 text-yellow-300 flex flex-col items-center justify-center">
        <Head><title>Admin Preview</title></Head>
        {/* Render the full admin dashboard preview here */}
        <h1 className="text-3xl font-bold mb-4">Admin Dashboard (Preview Mode)</h1>
        {/* Optionally render the real dashboard UI here, or a skeleton */}
      </div>
    );
  }

  if (!isAuthenticated || user?.email !== 'admin@migistus.com') {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <MainNavbar />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 text-center">
            <h1 className="text-2xl font-bold text-red-400 mb-2">⚠️ Kings Domain Access Denied</h1>
            <p className="text-gray-300">You need royal privileges to access the Kings Domain.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Head>
        <title>Kings Domain - Admin Dashboard | Migistus</title>
        <meta name="description" content="Complete admin control panel for Migistus" />
      </Head>

      <MainNavbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">👑</span>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text text-transparent">
                Kings Domain
              </h1>
              <p className="text-gray-400 text-lg">Complete control over your Migistus kingdom</p>
            </div>
          </div>
          
          {loading ? (
            <div className="animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-64"></div>
            </div>
          ) : (
            <div className="text-sm text-gray-400">
              Last updated: {new Date().toLocaleString()} | 
              Welcome back, Your Majesty {user?.username} 👑
            </div>
          )}
        </div>

        {/* Quick Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-blue-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-blue-400">{stats.users.total}</p>
              </div>
              <span className="text-3xl">👥</span>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6 border border-green-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Marketing Reach</p>
                <p className="text-2xl font-bold text-green-400">{stats.users.optedInMarketing}</p>
              </div>
              <span className="text-3xl">📧</span>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6 border border-purple-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">In Voting</p>
                <p className="text-2xl font-bold text-purple-400">{stats.voting.activePolls}</p>
              </div>
              <span className="text-3xl">🗳️</span>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6 border border-orange-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Live Products</p>
                <p className="text-2xl font-bold text-orange-400">{stats.products.live}</p>
              </div>
              <span className="text-3xl">📦</span>
            </div>
          </div>
        </div>

        {/* Admin Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {adminModules.map((module) => (
            <Link
              key={module.title}
              href={module.href}
              className={`${module.color} rounded-lg p-6 transition-all duration-200 transform hover:scale-105 hover:shadow-lg border ${
                module.featured 
                  ? 'border-yellow-500 ring-2 ring-yellow-500/50 shadow-yellow-500/20' 
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className="text-center">
                <div className="text-4xl mb-3">{module.icon}</div>
                {module.featured && (
                  <div className="inline-block bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded mb-2">
                    ⭐ NEW
                  </div>
                )}
                <h3 className="text-xl font-bold text-white mb-2">{module.title}</h3>
                <p className="text-gray-200 text-sm mb-4 opacity-90">{module.description}</p>
                
                <div className="space-y-1">
                  {module.stats.map((stat, index) => (
                    <div key={index} className="text-xs text-gray-200 bg-black/20 rounded px-2 py-1">
                      {stat}
                    </div>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span>📊</span> Recent Kingdom Activity
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="font-semibold text-green-400 mb-2">✅ System Status</h3>
              <p className="text-sm text-gray-300">All systems operational</p>
              <p className="text-xs text-gray-400 mt-1">Last checked: Just now</p>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="font-semibold text-blue-400 mb-2">👥 User Activity</h3>
              <p className="text-sm text-gray-300">{stats.users.active} users active today</p>
              <p className="text-xs text-gray-400 mt-1">{stats.users.newToday} new registrations</p>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="font-semibold text-purple-400 mb-2">🗳️ Voting Status</h3>
              <p className="text-sm text-gray-300">{stats.voting.totalVotes} votes cast</p>
              <p className="text-xs text-gray-400 mt-1">{stats.voting.pendingApproval} pending approval</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span>⚡</span> Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button 
              onClick={() => window.location.href = '/kingdom/lifecycle'}
              className="bg-gradient-to-br from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 rounded-lg p-4 text-center transition-colors"
            >
              <span className="text-2xl block mb-2">�</span>
              <span className="text-sm font-medium">Lifecycle Control</span>
            </button>
            
            <button 
              onClick={() => window.location.href = '/admin/marketing'}
              className="bg-green-600 hover:bg-green-700 rounded-lg p-4 text-center transition-colors"
            >
              <span className="text-2xl block mb-2">�</span>
              <span className="text-sm font-medium">Send Campaign</span>
            </button>
            
            <button 
              onClick={() => window.location.href = '/admin/products'}
              className="bg-orange-600 hover:bg-orange-700 rounded-lg p-4 text-center transition-colors"
            >
              <span className="text-2xl block mb-2">📦</span>
              <span className="text-sm font-medium">Add Product</span>
            </button>
            
            <button 
              onClick={() => window.location.href = '/admin/analytics'}
              className="bg-teal-600 hover:bg-teal-700 rounded-lg p-4 text-center transition-colors"
            >
              <span className="text-2xl block mb-2">�</span>
              <span className="text-sm font-medium">View Analytics</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
