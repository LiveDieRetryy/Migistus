import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface SupplierStats {
  totalProducts: number;
  activeDrops: number;
  totalSales: number;
  pendingOrders: number;
  rating: number;
  monthlyRevenue: number;
}

export default function SupplierDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [supplierName, setSupplierName] = useState('');
  const [stats, setStats] = useState<SupplierStats>({
    totalProducts: 0,
    activeDrops: 0,
    totalSales: 0,
    pendingOrders: 0,
    rating: 0,
    monthlyRevenue: 0
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isSupplier = localStorage.getItem("isSupplier") === "true";
      const name = localStorage.getItem("supplierName") || "";
      
      if (!isSupplier) {
        router.replace("/supplier-login");
      } else {
        setSupplierName(name);
        setLoading(false);
        loadSupplierStats();
      }
    }
  }, [router]);

  const loadSupplierStats = async () => {
    try {
      // In a real app, this would fetch actual supplier stats
      setStats({
        totalProducts: 45,
        activeDrops: 3,
        totalSales: 125000,
        pendingOrders: 12,
        rating: 4.8,
        monthlyRevenue: 15000
      });
    } catch (error) {
      console.error('Failed to load supplier stats:', error);
    }
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("isSupplier");
      localStorage.removeItem("isSignedIn");
      localStorage.removeItem("supplierId");
      localStorage.removeItem("supplierName");
    }
    router.push("/supplier-login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black flex items-center justify-center">
        <div className="text-yellow-400 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Supplier Dashboard - MIGISTUS</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black">
        {/* Header */}
        <header className="bg-zinc-900/50 border-b border-yellow-500/20 p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-300 bg-clip-text text-transparent">
                MIGISTUS Supplier Portal
              </h1>
              <span className="text-gray-400">|</span>
              <span className="text-white">Welcome, {supplierName}</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/suppliers" className="text-yellow-400 hover:text-yellow-300 transition-colors">
                Supplier Info
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto p-6">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Dashboard Overview</h2>
            <p className="text-gray-400">Manage your products, track sales, and monitor performance</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-zinc-900/50 border border-green-500/20 rounded-lg p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">📦</span>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Total Products</p>
                  <p className="text-2xl font-bold text-white">{stats.totalProducts}</p>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-yellow-500/20 rounded-lg p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
                  <span className="text-black font-bold text-xl">🔥</span>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Active Drops</p>
                  <p className="text-2xl font-bold text-white">{stats.activeDrops}</p>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-blue-500/20 rounded-lg p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">💰</span>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Total Sales</p>
                  <p className="text-2xl font-bold text-white">${stats.totalSales.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-purple-500/20 rounded-lg p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">📋</span>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Pending Orders</p>
                  <p className="text-2xl font-bold text-white">{stats.pendingOrders}</p>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-orange-500/20 rounded-lg p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">⭐</span>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Rating</p>
                  <p className="text-2xl font-bold text-white">{stats.rating}/5.0</p>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-teal-500/20 rounded-lg p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-teal-400 to-teal-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">📈</span>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-white">${stats.monthlyRevenue.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>          {/* Quick Actions */}
          <div className="bg-zinc-900/50 border border-yellow-500/20 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/supplier-portal">
                <button className="w-full p-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-lg transition-all transform hover:scale-105">
                  <div className="text-2xl mb-2">🗳️</div>
                  <div className="font-medium">Add to Voting</div>
                </button>
              </Link>
              <button className="p-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white rounded-lg transition-all transform hover:scale-105">
                <div className="text-2xl mb-2">🔥</div>
                <div className="font-medium">Create Drop</div>
              </button>
              <button className="p-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-lg transition-all transform hover:scale-105">
                <div className="text-2xl mb-2">📊</div>
                <div className="font-medium">View Analytics</div>
              </button>
              <button className="p-4 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 text-white rounded-lg transition-all transform hover:scale-105">
                <div className="text-2xl mb-2">⚙️</div>
                <div className="font-medium">Settings</div>
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mt-8 bg-zinc-900/50 border border-yellow-500/20 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-white">New order received for Wireless Headphones</span>
                </div>
                <span className="text-gray-400 text-sm">2 hours ago</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-white">Product "Smart Watch Pro" updated</span>
                </div>
                <span className="text-gray-400 text-sm">1 day ago</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-white">Live drop "Gaming Setup" completed</span>
                </div>
                <span className="text-gray-400 text-sm">3 days ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
