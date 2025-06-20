import { useState, useEffect } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/DashboardLayout';
import { useRouter } from 'next/router';

interface ComingSoonItem {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'coming-soon' | 'announced' | 'released';
  releaseDate?: string;
  imageUrl?: string;
  subscribers: number;
  createdAt: string;
  announcedAt?: string;
}

interface ComingSoonStats {
  totalItems: number;
  subscribedUsers: number;
  announcedToday: number;
  upcomingThisWeek: number;
}

export default function KingdomComingSoon() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ComingSoonItem[]>([]);
  const [stats, setStats] = useState<ComingSoonStats>({
    totalItems: 0,
    subscribedUsers: 0,
    announcedToday: 0,
    upcomingThisWeek: 0
  });
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    category: 'general',
    releaseDate: '',
    imageUrl: ''
  });
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isAdmin = localStorage.getItem("isAdmin") === "true";
      if (!isAdmin) {
        router.replace("/admin-login");
      } else {
        setLoading(false);
        loadComingSoonData();
      }
    }
  }, [router]);

  const loadComingSoonData = async () => {
    try {
      const response = await fetch('/api/coming-soon');
      if (response.ok) {
        const data = await response.json();
        setItems(data.items || []);
        setStats(data.stats || {
          totalItems: 0,
          subscribedUsers: 0,
          announcedToday: 0,
          upcomingThisWeek: 0
        });
      }
    } catch (error) {
      console.error('Failed to load coming soon data:', error);
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/coming-soon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newItem),
      });

      if (response.ok) {
        const createdItem = await response.json();
        setItems(prev => [createdItem, ...prev]);
        setStats(prev => ({
          ...prev,
          totalItems: prev.totalItems + 1
        }));
        setNewItem({
          title: '',
          description: '',
          category: 'general',
          releaseDate: '',
          imageUrl: ''
        });
        setShowCreateForm(false);
        loadComingSoonData(); // Refresh for accurate stats
      }
    } catch (error) {
      console.error('Failed to create coming soon item:', error);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const response = await fetch('/api/coming-soon', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (response.ok) {
        const updatedItem = await response.json();
        setItems(prev => prev.map(item => 
          item.id === id ? updatedItem : item
        ));
        loadComingSoonData(); // Refresh for accurate stats
      }
    } catch (error) {
      console.error('Failed to update item status:', error);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      const response = await fetch(`/api/coming-soon?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setItems(prev => prev.filter(item => item.id !== id));
        setStats(prev => ({
          ...prev,
          totalItems: prev.totalItems - 1
        }));
        loadComingSoonData(); // Refresh for accurate stats
      }
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      'coming-soon': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      'announced': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      'released': 'bg-green-500/20 text-green-300 border-green-500/30'
    };
    return badges[status as keyof typeof badges] || badges['coming-soon'];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black flex items-center justify-center">
        <div className="text-yellow-400 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <Head>
        <title>Coming Soon - Kingdom Admin</title>
      </Head>

      <div className="p-6 space-y-6 bg-gradient-to-br from-zinc-950 via-zinc-900 to-black min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-300 bg-clip-text text-transparent">
              Coming Soon Management
            </h1>
            <p className="text-gray-400 mt-2">Manage upcoming features and announcements</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-medium rounded-lg hover:from-yellow-400 hover:to-yellow-500 transition-all"
          >
            Add Coming Soon Item
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-zinc-900/50 border border-yellow-500/20 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
                <span className="text-black font-bold">📋</span>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Items</p>
                <p className="text-2xl font-bold text-white">{stats.totalItems}</p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-blue-500/20 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">👥</span>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Subscribers</p>
                <p className="text-2xl font-bold text-white">{stats.subscribedUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-green-500/20 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">📢</span>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Announced Today</p>
                <p className="text-2xl font-bold text-white">{stats.announcedToday}</p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-purple-500/20 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">📅</span>
              </div>
              <div>
                <p className="text-gray-400 text-sm">This Week</p>
                <p className="text-2xl font-bold text-white">{stats.upcomingThisWeek}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Create Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 border border-yellow-500/20 rounded-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-bold text-yellow-400 mb-4">Create Coming Soon Item</h3>
              <form onSubmit={handleCreateItem} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                  <input
                    type="text"
                    value={newItem.title}
                    onChange={(e) => setNewItem(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 bg-zinc-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea
                    value={newItem.description}
                    onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 bg-zinc-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 bg-zinc-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  >
                    <option value="general">General</option>
                    <option value="product">Product</option>
                    <option value="feature">Feature</option>
                    <option value="update">Update</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Release Date (Optional)</label>
                  <input
                    type="datetime-local"
                    value={newItem.releaseDate}
                    onChange={(e) => setNewItem(prev => ({ ...prev, releaseDate: e.target.value }))}
                    className="w-full px-3 py-2 bg-zinc-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-medium rounded-lg hover:from-yellow-400 hover:to-yellow-500 transition-all"
                  >
                    Create Item
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 px-4 py-2 bg-zinc-700 text-white font-medium rounded-lg hover:bg-zinc-600 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Coming Soon Items List */}
        <div className="bg-zinc-900/50 border border-yellow-500/20 rounded-lg">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-xl font-bold text-white">Coming Soon Items</h2>
          </div>
          <div className="p-6">
            {items.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">No coming soon items yet.</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="mt-4 px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-medium rounded-lg hover:from-yellow-400 hover:to-yellow-500 transition-all"
                >
                  Create First Item
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="bg-zinc-800/50 border border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-medium text-white">{item.title}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full border ${getStatusBadge(item.status)}`}>
                            {item.status.replace('-', ' ')}
                          </span>
                          <span className="px-2 py-1 text-xs bg-blue-500/20 text-blue-300 rounded-full border border-blue-500/30">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-gray-300 mb-3">{item.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span>👥 {item.subscribers} subscribers</span>
                          {item.releaseDate && (
                            <span>📅 {new Date(item.releaseDate).toLocaleDateString()}</span>
                          )}
                          <span>📝 {new Date(item.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <select
                          value={item.status}
                          onChange={(e) => handleStatusChange(item.id, e.target.value)}
                          className="px-2 py-1 bg-zinc-700 border border-gray-600 rounded text-white text-sm"
                        >
                          <option value="coming-soon">Coming Soon</option>
                          <option value="announced">Announced</option>
                          <option value="released">Released</option>
                        </select>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
