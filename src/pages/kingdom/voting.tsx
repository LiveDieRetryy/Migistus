import { useState, useEffect } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/DashboardLayout';
import { useRouter } from 'next/router';

interface Poll {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'ended';
  createdAt: string;
  endDate?: string;
  voteCount: number;
  category: string;
}

interface VotingStats {
  activePolls: number;
  totalVotes: number;
  pendingApproval: number;
  endedPolls: number;
}

export default function KingdomVoting() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [stats, setStats] = useState<VotingStats>({
    activePolls: 0,
    totalVotes: 0,
    pendingApproval: 0,
    endedPolls: 0
  });
  const [newPoll, setNewPoll] = useState({
    title: '',
    description: '',
    category: 'general'
  });
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isAdmin = localStorage.getItem("isAdmin") === "true";
      if (!isAdmin) {
        router.replace("/admin-login");
      } else {
        setLoading(false);
        loadVotingData();
      }
    }
  }, [router]);
  const loadVotingData = async () => {
    try {
      // Load voting data with stats
      const response = await fetch('/api/voting/polls');
      if (response.ok) {
        const data = await response.json();
        setPolls(data.polls || []);
        setStats(data.stats || {
          activePolls: 0,
          totalVotes: 0,
          pendingApproval: 0,
          endedPolls: 0
        });
      }
    } catch (error) {
      console.error('Failed to load voting data:', error);
    }
  };
  const handleCreatePoll = async () => {
    if (!newPoll.title || !newPoll.description) return;

    try {
      const response = await fetch('/api/voting/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPoll)
      });

      if (response.ok) {
        const createdPoll = await response.json();
        setPolls(prev => [createdPoll, ...prev]);
        setStats(prev => ({
          ...prev,
          pendingApproval: prev.pendingApproval + 1
        }));
        setNewPoll({ title: '', description: '', category: 'general' });
        setShowCreateForm(false);
        loadVotingData(); // Refresh for accurate stats
      }
    } catch (error) {
      console.error('Failed to create poll:', error);
    }
  };  const handleUpdatePollStatus = async (pollId: string, status: string) => {
    try {
      const response = await fetch('/api/voting/polls', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: pollId, status })
      });

      if (response.ok) {
        const updatedPoll = await response.json();
        setPolls(prev => prev.map(poll => 
          poll.id === pollId ? updatedPoll : poll
        ));
        loadVotingData(); // Refresh for accurate stats
      }
    } catch (error) {
      console.error('Failed to update poll status:', error);
    }
  };

  const handleDeletePoll = async (pollId: string) => {
    if (!confirm('Are you sure you want to delete this poll?')) return;

    try {
      const response = await fetch(`/api/voting/polls?id=${pollId}`, {
        method: 'DELETE',
      });      if (response.ok) {
        setPolls(prev => prev.filter(poll => poll.id !== pollId));
        loadVotingData(); // Refresh for accurate stats
      }
    } catch (error) {
      console.error('Failed to delete poll:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-yellow-400 text-2xl">
        Loading voting control...
      </div>
    );
  }

  return (
    <DashboardLayout>
      <Head>
        <title>Voting Control - The King's Domain</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#FFD700] mb-2">🗳️ Voting Control</h1>
          <p className="text-zinc-400">Manage polls, approve submissions, and control the voting process</p>
        </div>

        {/* Voting Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-6">
            <h3 className="text-yellow-400 text-sm font-medium mb-2">Active Polls</h3>
            <p className="text-2xl font-bold text-white">{stats.activePolls}</p>
          </div>
          <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-6">
            <h3 className="text-yellow-400 text-sm font-medium mb-2">Total Votes</h3>
            <p className="text-2xl font-bold text-white">{stats.totalVotes}</p>
          </div>
          <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-6">
            <h3 className="text-yellow-400 text-sm font-medium mb-2">Pending Approval</h3>
            <p className="text-2xl font-bold text-white">{stats.pendingApproval}</p>
          </div>
          <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-6">
            <h3 className="text-yellow-400 text-sm font-medium mb-2">Ended Polls</h3>
            <p className="text-2xl font-bold text-white">{stats.endedPolls}</p>
          </div>
        </div>

        {/* Create Poll Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-yellow-600 hover:bg-yellow-700 text-black px-6 py-3 rounded-lg font-medium transition"
          >
            {showCreateForm ? 'Cancel' : '+ Create New Poll'}
          </button>
        </div>

        {/* Create Poll Form */}
        {showCreateForm && (
          <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-6 mb-8">
            <h3 className="text-xl font-semibold text-yellow-400 mb-4">Create New Poll</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Title</label>
                <input
                  type="text"
                  value={newPoll.title}
                  onChange={(e) => setNewPoll({...newPoll, title: e.target.value})}
                  className="w-full px-3 py-2 border border-zinc-600 rounded-md bg-zinc-800 text-white"
                  placeholder="Poll title..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Description</label>
                <textarea
                  value={newPoll.description}
                  onChange={(e) => setNewPoll({...newPoll, description: e.target.value})}
                  rows={4}
                  className="w-full px-3 py-2 border border-zinc-600 rounded-md bg-zinc-800 text-white"
                  placeholder="Poll description..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Category</label>
                <select
                  value={newPoll.category}
                  onChange={(e) => setNewPoll({...newPoll, category: e.target.value})}
                  className="w-full px-3 py-2 border border-zinc-600 rounded-md bg-zinc-800 text-white"
                >
                  <option value="general">General</option>
                  <option value="products">Products</option>
                  <option value="features">Features</option>
                  <option value="community">Community</option>
                </select>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={handleCreatePoll}
                  className="bg-yellow-600 hover:bg-yellow-700 text-black px-6 py-2 rounded-lg transition"
                >
                  Create Poll
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="bg-zinc-700 hover:bg-zinc-600 text-white px-6 py-2 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Polls List */}
        <div className="bg-zinc-900 border border-yellow-500 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-700">
            <h3 className="text-xl font-semibold text-yellow-400">All Polls</h3>
          </div>
          <div className="divide-y divide-zinc-700">
            {polls.length === 0 ? (
              <div className="px-6 py-8 text-center text-zinc-400">
                No polls found. Create your first poll to engage the community!
              </div>
            ) : (
              polls.map(poll => (
                <div key={poll.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-white font-medium">{poll.title}</h4>
                      <p className="text-zinc-400 text-sm mt-1">{poll.description}</p>
                      <div className="mt-2 flex items-center space-x-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          poll.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : poll.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'                        }`}>
                          {(poll.status || 'pending').charAt(0).toUpperCase() + (poll.status || 'pending').slice(1)}
                        </span>
                        <span className="text-xs text-zinc-400">
                          Category: {poll.category || 'Unknown'}
                        </span>
                        <span className="text-xs text-zinc-400">
                          Votes: {poll.voteCount || 0}
                        </span>
                        <span className="text-xs text-zinc-400">
                          Created: {poll.createdAt ? new Date(poll.createdAt).toLocaleDateString() : 'Unknown'}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {poll.status === 'pending' && (
                        <button
                          onClick={() => handleUpdatePollStatus(poll.id, 'active')}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition"
                        >
                          Approve
                        </button>
                      )}
                      {poll.status === 'active' && (
                        <button
                          onClick={() => handleUpdatePollStatus(poll.id, 'ended')}
                          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm transition"
                        >
                          End Poll
                        </button>
                      )}
                      <button
                        onClick={() => handleDeletePoll(poll.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
