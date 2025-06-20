import { useState, useEffect } from 'react';
import Head from 'next/head';
import MainNavbar from '@/components/nav/MainNavbar';
import { useAuth } from '@/context/AuthContext';

interface Poll {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'active' | 'pending' | 'completed' | 'draft';
  createdAt: string;
  endDate: string;
  options: Array<{
    id: string;
    text: string;
    votes: number;
    description?: string;
  }>;
  totalVotes: number;
  submittedBy?: string;
  requiresApproval?: boolean;
}

interface Vote {
  id: string;
  pollId: string;
  optionId: string;
  userId: number;
  timestamp: string;
  userTier: string;
}

export default function AdminVotingPage() {
  const { user, isAuthenticated } = useAuth();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'manage' | 'create' | 'pending'>('overview');
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);

  // New poll form
  const [newPoll, setNewPoll] = useState({
    title: '',
    description: '',
    category: 'General',
    endDate: '',
    options: ['', ''],
    requiresApproval: false
  });

  useEffect(() => {
    if (!isAuthenticated || user?.email !== 'admin@migistus.com') return;
    loadVotingData();
  }, [isAuthenticated, user]);

  const loadVotingData = async () => {
    try {
      // Load polls
      const votingResponse = await fetch('/api/voting/polls');
      if (votingResponse.ok) {
        const votingData = await votingResponse.json();
        setPolls(votingData.polls || []);
      }

      // Load votes
      const votesResponse = await fetch('/api/voting/votes');
      if (votesResponse.ok) {
        const votesData = await votesResponse.json();
        setVotes(votesData.votes || []);
      }
    } catch (error) {
      console.error('Failed to load voting data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPoll = async () => {
    if (!newPoll.title.trim() || newPoll.options.filter(opt => opt.trim()).length < 2) {
      alert('Please provide a title and at least 2 options');
      return;
    }

    try {
      const pollData = {
        ...newPoll,
        options: newPoll.options
          .filter(opt => opt.trim())
          .map((text, index) => ({
            id: `option_${index + 1}`,
            text: text.trim(),
            votes: 0
          })),
        id: `poll_${Date.now()}`,
        status: newPoll.requiresApproval ? 'pending' : 'active',
        createdAt: new Date().toISOString(),
        totalVotes: 0,
        submittedBy: 'admin'
      };

      const response = await fetch('/api/voting/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pollData)
      });

      if (response.ok) {
        alert('Poll created successfully!');
        setNewPoll({
          title: '',
          description: '',
          category: 'General',
          endDate: '',
          options: ['', ''],
          requiresApproval: false
        });
        loadVotingData();
        setActiveTab('manage');
      } else {
        alert('Failed to create poll');
      }
    } catch (error) {
      console.error('Error creating poll:', error);
      alert('Error creating poll');
    }
  };

  const updatePollStatus = async (pollId: string, status: string) => {
    try {
      const response = await fetch('/api/voting/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pollId, status })
      });

      if (response.ok) {
        loadVotingData();
        alert(`Poll ${status} successfully!`);
      }
    } catch (error) {
      console.error('Error updating poll status:', error);
    }
  };

  const deletePoll = async (pollId: string) => {
    if (!confirm('Are you sure you want to delete this poll?')) return;

    try {
      const response = await fetch('/api/voting/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pollId })
      });

      if (response.ok) {
        loadVotingData();
        alert('Poll deleted successfully!');
      }
    } catch (error) {
      console.error('Error deleting poll:', error);
    }
  };

  const addPollOption = () => {
    setNewPoll({
      ...newPoll,
      options: [...newPoll.options, '']
    });
  };

  const removePollOption = (index: number) => {
    if (newPoll.options.length > 2) {
      setNewPoll({
        ...newPoll,
        options: newPoll.options.filter((_, i) => i !== index)
      });
    }
  };

  const updatePollOption = (index: number, value: string) => {
    const updatedOptions = [...newPoll.options];
    updatedOptions[index] = value;
    setNewPoll({
      ...newPoll,
      options: updatedOptions
    });
  };

  const categories = ['General', 'Electronics', 'Home & Garden', 'Fashion', 'Sports & Outdoors', 'Automotive', 'Beauty', 'Food & Grocery'];

  if (!isAuthenticated || user?.email !== 'admin@migistus.com') {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <MainNavbar />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 text-center">
            <h1 className="text-2xl font-bold text-red-400 mb-2">Access Denied</h1>
            <p className="text-gray-300">You need admin privileges to access voting controls.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <MainNavbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading voting data...</p>
          </div>
        </div>
      </div>
    );
  }

  const activePolls = polls.filter(p => p.status === 'active');
  const pendingPolls = polls.filter(p => p.status === 'pending');
  const completedPolls = polls.filter(p => p.status === 'completed');

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Head>
        <title>Voting Control - Kings Domain | Migistus</title>
        <meta name="description" content="Admin voting management" />
      </Head>

      <MainNavbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-purple-400 mb-2 flex items-center gap-3">
            <span>🗳️</span> Voting Control Center
          </h1>
          <p className="text-gray-400">Manage polls, control voting process, and analyze results</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', count: polls.length },
                { id: 'manage', label: 'Manage Polls', count: activePolls.length },
                { id: 'pending', label: 'Pending Approval', count: pendingPolls.length },
                { id: 'create', label: 'Create New Poll' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className="ml-2 bg-gray-700 text-gray-300 py-1 px-2 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-400 mb-2">Active Polls</h3>
                <div className="text-3xl font-bold text-white">{activePolls.length}</div>
                <p className="text-sm text-gray-400">Currently accepting votes</p>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-400 mb-2">Pending Approval</h3>
                <div className="text-3xl font-bold text-white">{pendingPolls.length}</div>
                <p className="text-sm text-gray-400">Awaiting your review</p>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-400 mb-2">Total Votes</h3>
                <div className="text-3xl font-bold text-white">{votes.length}</div>
                <p className="text-sm text-gray-400">All time</p>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-purple-400 mb-4">Recent Polls</h3>
              <div className="space-y-3">
                {polls.slice(0, 5).map(poll => (
                  <div key={poll.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                    <div>
                      <h4 className="font-medium text-white">{poll.title}</h4>
                      <p className="text-sm text-gray-400">{poll.category} • {poll.totalVotes} votes</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      poll.status === 'active' ? 'bg-green-900 text-green-300' :
                      poll.status === 'pending' ? 'bg-yellow-900 text-yellow-300' :
                      'bg-gray-600 text-gray-300'
                    }`}>
                      {poll.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Manage Polls Tab */}
        {activeTab === 'manage' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-purple-400 mb-4">All Polls</h3>
              <div className="space-y-4">
                {polls.map(poll => (
                  <div key={poll.id} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-white text-lg">{poll.title}</h4>
                        <p className="text-gray-300 mt-1">{poll.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                          <span>📊 {poll.totalVotes} votes</span>
                          <span>📁 {poll.category}</span>
                          <span>📅 {new Date(poll.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          poll.status === 'active' ? 'bg-green-900 text-green-300' :
                          poll.status === 'pending' ? 'bg-yellow-900 text-yellow-300' :
                          poll.status === 'completed' ? 'bg-blue-900 text-blue-300' :
                          'bg-gray-600 text-gray-300'
                        }`}>
                          {poll.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                      {poll.options.map(option => (
                        <div key={option.id} className="bg-gray-600 rounded p-3">
                          <div className="flex justify-between items-center">
                            <span className="text-white">{option.text}</span>
                            <span className="text-purple-400 font-medium">{option.votes} votes</span>
                          </div>
                          {poll.totalVotes > 0 && (
                            <div className="mt-2">
                              <div className="bg-gray-800 rounded-full h-2">
                                <div 
                                  className="bg-purple-500 h-2 rounded-full"
                                  style={{ width: `${(option.votes / poll.totalVotes) * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-400 mt-1">
                                {((option.votes / poll.totalVotes) * 100).toFixed(1)}%
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      {poll.status === 'active' && (
                        <button
                          onClick={() => updatePollStatus(poll.id, 'completed')}
                          className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm transition-colors"
                        >
                          End Poll
                        </button>
                      )}
                      {poll.status === 'pending' && (
                        <button
                          onClick={() => updatePollStatus(poll.id, 'active')}
                          className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm transition-colors"
                        >
                          Approve
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedPoll(poll)}
                        className="bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded text-sm transition-colors"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => deletePoll(poll.id)}
                        className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Pending Approval Tab */}
        {activeTab === 'pending' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-yellow-400 mb-4">Polls Awaiting Approval</h3>
              {pendingPolls.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No polls pending approval</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingPolls.map(poll => (
                    <div key={poll.id} className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                      <h4 className="font-semibold text-white text-lg mb-2">{poll.title}</h4>
                      <p className="text-gray-300 mb-3">{poll.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                        {poll.options.map(option => (
                          <div key={option.id} className="bg-gray-700 rounded p-2">
                            <span className="text-white">{option.text}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => updatePollStatus(poll.id, 'active')}
                          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded transition-colors"
                        >
                          ✅ Approve & Activate
                        </button>
                        <button
                          onClick={() => deletePoll(poll.id)}
                          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition-colors"
                        >
                          ❌ Reject & Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Create New Poll Tab */}
        {activeTab === 'create' && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-purple-400 mb-6">Create New Poll</h3>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Poll Title</label>
                  <input
                    type="text"
                    value={newPoll.title}
                    onChange={(e) => setNewPoll({ ...newPoll, title: e.target.value })}
                    placeholder="Enter poll title..."
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                  <select
                    value={newPoll.category}
                    onChange={(e) => setNewPoll({ ...newPoll, category: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={newPoll.description}
                  onChange={(e) => setNewPoll({ ...newPoll, description: e.target.value })}
                  placeholder="Enter poll description..."
                  rows={3}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">End Date (Optional)</label>
                <input
                  type="datetime-local"
                  value={newPoll.endDate}
                  onChange={(e) => setNewPoll({ ...newPoll, endDate: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Poll Options</label>
                <div className="space-y-3">
                  {newPoll.options.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => updatePollOption(index, e.target.value)}
                        placeholder={`Option ${index + 1}...`}
                        className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      {newPoll.options.length > 2 && (
                        <button
                          onClick={() => removePollOption(index)}
                          className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded transition-colors"
                        >
                          ❌
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addPollOption}
                    className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded transition-colors"
                  >
                    + Add Option
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="requiresApproval"
                  checked={newPoll.requiresApproval}
                  onChange={(e) => setNewPoll({ ...newPoll, requiresApproval: e.target.checked })}
                  className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                />
                <label htmlFor="requiresApproval" className="text-sm text-gray-300">
                  Require approval before going live
                </label>
              </div>

              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setNewPoll({
                    title: '',
                    description: '',
                    category: 'General',
                    endDate: '',
                    options: ['', ''],
                    requiresApproval: false
                  })}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={createPoll}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors"
                >
                  Create Poll
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
