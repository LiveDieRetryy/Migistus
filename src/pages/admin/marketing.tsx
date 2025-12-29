import { useState, useEffect } from 'react';
import Head from 'next/head';
import MainNavbar from '@/components/nav/MainNavbar';
import { useAuth } from '@/context/AuthContext';

interface User {
  id: number;
  username: string;
  email: string;
  tier: string;
  joinedDate: string;
  marketingOptIn?: boolean;
  lastActive?: string;
}

interface Campaign {
  id: string;
  subject: string;
  content: string;
  targetTier: string;
  sentDate: string;
  recipientCount: number;
  status: 'sent' | 'scheduled' | 'draft';
}

export default function AdminMarketingPage() {
  const { user, isAuthenticated } = useAuth();
  const [optedInUsers, setOptedInUsers] = useState<User[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'campaigns' | 'send'>('users');

  // Campaign form state
  const [campaignForm, setCampaignForm] = useState({
    subject: '',
    content: '',
    targetTier: 'all'
  });
  // Load opted-in users and campaigns
  useEffect(() => {
    if (!isAuthenticated || user?.tier !== 'Admin') return;
    
    loadOptedInUsers();
    loadCampaigns();
  }, [isAuthenticated, user]);

  const loadOptedInUsers = async () => {
    try {
      const response = await fetch('/api/marketing/preferences?admin=true');
      if (response.ok) {
        const data = await response.json();
        setOptedInUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to load opted-in users:', error);
    }
  };

  const loadCampaigns = async () => {
    try {
      // Load campaign history from local storage or API
      const campaignData = localStorage.getItem('marketing_campaigns');
      if (campaignData) {
        setCampaigns(JSON.parse(campaignData));
      }
    } catch (error) {
      console.error('Failed to load campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendCampaign = async () => {
    if (!campaignForm.subject.trim() || !campaignForm.content.trim()) {
      alert('Please fill in both subject and content');
      return;
    }

    setSending(true);
    try {
      const response = await fetch('/api/marketing/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: campaignForm.subject,
          content: campaignForm.content,
          targetTier: campaignForm.targetTier
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Campaign sent successfully to ${result.recipientCount} users!`);
        
        // Add to campaigns list
        const newCampaign: Campaign = {
          id: Date.now().toString(),
          subject: campaignForm.subject,
          content: campaignForm.content,
          targetTier: campaignForm.targetTier,
          sentDate: new Date().toISOString(),
          recipientCount: result.recipientCount,
          status: 'sent'
        };
        
        const updatedCampaigns = [newCampaign, ...campaigns];
        setCampaigns(updatedCampaigns);
        localStorage.setItem('marketing_campaigns', JSON.stringify(updatedCampaigns));
        
        // Reset form
        setCampaignForm({
          subject: '',
          content: '',
          targetTier: 'all'
        });
        
        // Refresh users data
        loadOptedInUsers();
      } else {
        const error = await response.json();
        alert(`Failed to send campaign: ${error.message}`);
      }
    } catch (error) {
      console.error('Campaign send error:', error);
      alert('Failed to send campaign. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Filter users by tier for display
  const getFilteredUsers = (tier: string) => {
    if (tier === 'all') return optedInUsers;
    return optedInUsers.filter(u => u.tier === tier);
  };

  const tierCounts = {
    all: optedInUsers.length,
    'New Initiate': optedInUsers.filter(u => u.tier === 'New Initiate').length,
    'New Member': optedInUsers.filter(u => u.tier === 'New Member').length,
    'Subscriber': optedInUsers.filter(u => u.tier === 'Subscriber').length,
    'Premium': optedInUsers.filter(u => u.tier === 'Premium').length,
    'Admin': optedInUsers.filter(u => u.tier === 'Admin').length,
  };

  if (!isAuthenticated || user?.tier !== 'Admin') {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <MainNavbar />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 text-center">
            <h1 className="text-2xl font-bold text-red-400 mb-2">Access Denied</h1>
            <p className="text-gray-300">You need admin privileges to access this page.</p>
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading marketing data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Head>
        <title>Marketing Admin - Migistus</title>
        <meta name="description" content="Admin marketing management" />
      </Head>

      <MainNavbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-400 mb-2">Marketing Administration</h1>
          <p className="text-gray-400">Manage marketing campaigns and view opted-in users</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'users', label: 'Opted-in Users', count: optedInUsers.length },
                { id: 'send', label: 'Send Campaign' },
                { id: 'campaigns', label: 'Campaign History', count: campaigns.length }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-400'
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

        {/* Opted-in Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-blue-400 mb-4">Marketing Opt-in Statistics</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {Object.entries(tierCounts).map(([tier, count]) => (
                  <div key={tier} className="bg-gray-700 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-400">{count}</div>
                    <div className="text-sm text-gray-300 capitalize">{tier}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-blue-400 mb-4">Opted-in Users</h2>
              {optedInUsers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No users have opted in for marketing communications yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-4 text-gray-300">Username</th>
                        <th className="text-left py-3 px-4 text-gray-300">Email</th>
                        <th className="text-left py-3 px-4 text-gray-300">Tier</th>
                        <th className="text-left py-3 px-4 text-gray-300">Joined</th>
                        <th className="text-left py-3 px-4 text-gray-300">Last Active</th>
                      </tr>
                    </thead>
                    <tbody>
                      {optedInUsers.map((user) => (
                        <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                          <td className="py-3 px-4 text-white font-medium">{user.username}</td>
                          <td className="py-3 px-4 text-gray-300">{user.email}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.tier === 'Premium' ? 'bg-purple-900 text-purple-300' :
                              user.tier === 'Subscriber' ? 'bg-blue-900 text-blue-300' :
                              user.tier === 'New Member' ? 'bg-green-900 text-green-300' :
                              user.tier === 'Admin' ? 'bg-red-900 text-red-300' :
                              'bg-gray-700 text-gray-300'
                            }`}>
                              {user.tier}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-300">
                            {new Date(user.joinedDate).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-gray-300">
                            {user.lastActive ? new Date(user.lastActive).toLocaleDateString() : 'Unknown'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Send Campaign Tab */}
        {activeTab === 'send' && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-blue-400 mb-6">Send Marketing Campaign</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Target Audience
                </label>
                <select
                  value={campaignForm.targetTier}
                  onChange={(e) => setCampaignForm({ ...campaignForm, targetTier: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Users ({tierCounts.all})</option>
                  <option value="New Initiate">New Initiate ({tierCounts['New Initiate']})</option>
                  <option value="New Member">New Member ({tierCounts['New Member']})</option>
                  <option value="Subscriber">Subscriber ({tierCounts['Subscriber']})</option>
                  <option value="Premium">Premium ({tierCounts['Premium']})</option>
                  <option value="Admin">Admin ({tierCounts['Admin']})</option>
                </select>
                <p className="text-sm text-gray-400 mt-1">
                  {getFilteredUsers(campaignForm.targetTier).length} users will receive this campaign
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Subject
                </label>
                <input
                  type="text"
                  value={campaignForm.subject}
                  onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })}
                  placeholder="Enter email subject..."
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Content
                </label>
                <textarea
                  value={campaignForm.content}
                  onChange={(e) => setCampaignForm({ ...campaignForm, content: e.target.value })}
                  placeholder="Enter email content..."
                  rows={8}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setCampaignForm({ subject: '', content: '', targetTier: 'all' })}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={handleSendCampaign}
                  disabled={sending || !campaignForm.subject.trim() || !campaignForm.content.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                >
                  {sending ? 'Sending...' : 'Send Campaign'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Campaign History Tab */}
        {activeTab === 'campaigns' && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-blue-400 mb-6">Campaign History</h2>
            
            {campaigns.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">No campaigns have been sent yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-white">{campaign.subject}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        campaign.status === 'sent' ? 'bg-green-900 text-green-300' :
                        campaign.status === 'scheduled' ? 'bg-yellow-900 text-yellow-300' :
                        'bg-gray-600 text-gray-300'
                      }`}>
                        {campaign.status}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm mb-3 line-clamp-2">{campaign.content}</p>
                    <div className="flex justify-between items-center text-sm text-gray-400">
                      <span>Target: {campaign.targetTier === 'all' ? 'All Users' : campaign.targetTier}</span>
                      <span>Recipients: {campaign.recipientCount}</span>
                      <span>Sent: {new Date(campaign.sentDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
