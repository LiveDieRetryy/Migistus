import { useState, useEffect } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/DashboardLayout';
import { useRouter } from 'next/router';

interface LiveDrop {
  id: string;
  productId: string;
  productName: string;
  status: 'scheduled' | 'active' | 'ended';
  startTime: string;
  endTime?: string;
  participants: number;
  pledgeGoal: number;
  currentPledges: number;
  createdAt: string;
}

interface LiveDropStats {
  active: number;
  scheduled: number;
  totalParticipants: number;
  completedToday: number;
}

export default function KingdomLiveDrops() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [liveDrops, setLiveDrops] = useState<LiveDrop[]>([]);
  const [stats, setStats] = useState<LiveDropStats>({
    active: 0,
    scheduled: 0,
    totalParticipants: 0,
    completedToday: 0
  });
  const [newDrop, setNewDrop] = useState({
    productId: '',
    productName: '',
    pledgeGoal: '',
    startTime: '',
    duration: '24'
  });
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isAdmin = localStorage.getItem("isAdmin") === "true";
      if (!isAdmin) {
        router.replace("/admin-login");
      } else {
        setLoading(false);
        loadLiveDropData();
      }
    }
  }, [router]);

  const loadLiveDropData = async () => {
    try {
      const response = await fetch('/api/live-drops');
      if (response.ok) {
        const data = await response.json();
        setLiveDrops(data.liveDrops || []);
        setStats(data.stats || {
          active: 0,
          scheduled: 0,
          totalParticipants: 0,
          completedToday: 0
        });
      }
    } catch (error) {
      console.error('Failed to load live drop data:', error);
    }
  };

  const handleCreateDrop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDrop.productName || !newDrop.pledgeGoal || !newDrop.startTime) return;

    try {
      const response = await fetch('/api/live-drops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newDrop,
          pledgeGoal: parseInt(newDrop.pledgeGoal),
          duration: parseInt(newDrop.duration)
        })
      });

      if (response.ok) {
        const createdDrop = await response.json();
        setLiveDrops(prev => [createdDrop, ...prev]);
        setNewDrop({
          productId: '',
          productName: '',
          pledgeGoal: '',
          startTime: '',
          duration: '24'
        });
        setShowCreateForm(false);
        loadLiveDropData();
      }
    } catch (error) {
      console.error('Failed to create live drop:', error);
    }
  };

  const handleUpdateDropStatus = async (dropId: string, status: string) => {
    try {
      const response = await fetch('/api/live-drops', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: dropId, status })
      });

      if (response.ok) {
        loadLiveDropData();
      }
    } catch (error) {
      console.error('Failed to update drop status:', error);
    }
  };

  const handleDeleteDrop = async (dropId: string) => {
    if (!confirm('Are you sure you want to delete this live drop?')) return;

    try {
      const response = await fetch(`/api/live-drops?id=${dropId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setLiveDrops(prev => prev.filter(drop => drop.id !== dropId));
        loadLiveDropData();
      }
    } catch (error) {
      console.error('Failed to delete live drop:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      'scheduled': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      'active': 'bg-green-500/20 text-green-300 border-green-500/30',
      'ended': 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    };
    return badges[status as keyof typeof badges] || badges['scheduled'];
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
        <title>Live Drops - Kingdom Admin</title>
      </Head>

      <div className="p-6 space-y-6 bg-gradient-to-br from-zinc-950 via-zinc-900 to-black min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-300 bg-clip-text text-transparent">
              Live Drops Management
            </h1>
            <p className="text-gray-400 mt-2">Manage real-time product drops and campaigns</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-medium rounded-lg hover:from-yellow-400 hover:to-yellow-500 transition-all"
          >
            Create Live Drop
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-zinc-900/50 border border-green-500/20 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">🔥</span>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Active Drops</p>
                <p className="text-2xl font-bold text-white">{stats.active}</p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-yellow-500/20 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
                <span className="text-black font-bold">📅</span>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Scheduled</p>
                <p className="text-2xl font-bold text-white">{stats.scheduled}</p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-blue-500/20 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">👥</span>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Participants</p>
                <p className="text-2xl font-bold text-white">{stats.totalParticipants}</p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-purple-500/20 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">✅</span>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Completed Today</p>
                <p className="text-2xl font-bold text-white">{stats.completedToday}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Create Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 border border-yellow-500/20 rounded-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-bold text-yellow-400 mb-4">Create Live Drop</h3>
              <form onSubmit={handleCreateDrop} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Product Name</label>
                  <input
                    type="text"
                    value={newDrop.productName}
                    onChange={(e) => setNewDrop(prev => ({ ...prev, productName: e.target.value }))}
                    className="w-full px-3 py-2 bg-zinc-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Pledge Goal</label>
                  <input
                    type="number"
                    value={newDrop.pledgeGoal}
                    onChange={(e) => setNewDrop(prev => ({ ...prev, pledgeGoal: e.target.value }))}
                    className="w-full px-3 py-2 bg-zinc-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Start Time</label>
                  <input
                    type="datetime-local"
                    value={newDrop.startTime}
                    onChange={(e) => setNewDrop(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full px-3 py-2 bg-zinc-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Duration (hours)</label>
                  <input
                    type="number"
                    value={newDrop.duration}
                    onChange={(e) => setNewDrop(prev => ({ ...prev, duration: e.target.value }))}
                    className="w-full px-3 py-2 bg-zinc-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    min="1"
                    max="168"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-medium rounded-lg hover:from-yellow-400 hover:to-yellow-500 transition-all"
                  >
                    Create Drop
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

        {/* Live Drops List */}
        <div className="bg-zinc-900/50 border border-yellow-500/20 rounded-lg">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-xl font-bold text-white">Live Drops</h2>
          </div>
          <div className="p-6">
            {liveDrops.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">No live drops yet.</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="mt-4 px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-medium rounded-lg hover:from-yellow-400 hover:to-yellow-500 transition-all"
                >
                  Create First Drop
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {liveDrops.map((drop) => (
                  <div key={drop.id} className="bg-zinc-800/50 border border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-medium text-white">{drop.productName}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full border ${getStatusBadge(drop.status)}`}>
                            {drop.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-300 mb-3">
                          <div>
                            <span className="text-gray-400">Participants:</span>
                            <span className="ml-1 font-medium">{drop.participants}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Pledges:</span>
                            <span className="ml-1 font-medium">{drop.currentPledges}/{drop.pledgeGoal}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Start:</span>
                            <span className="ml-1 font-medium">{new Date(drop.startTime).toLocaleDateString()}</span>
                          </div>
                          {drop.endTime && (
                            <div>
                              <span className="text-gray-400">End:</span>
                              <span className="ml-1 font-medium">{new Date(drop.endTime).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <select
                          value={drop.status}
                          onChange={(e) => handleUpdateDropStatus(drop.id, e.target.value)}
                          className="px-2 py-1 bg-zinc-700 border border-gray-600 rounded text-white text-sm"
                        >
                          <option value="scheduled">Scheduled</option>
                          <option value="active">Active</option>
                          <option value="ended">Ended</option>
                        </select>
                        <button
                          onClick={() => handleDeleteDrop(drop.id)}
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


// Disable footer for Kingdom pages
(KingdomLiveDrops as any).showFooter = false;