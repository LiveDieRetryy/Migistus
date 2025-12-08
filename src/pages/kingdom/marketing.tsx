import { useState, useEffect } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/DashboardLayout';
import { useRouter } from 'next/router';

interface EmailCampaign {
  id: string;
  subject: string;
  content: string;
  recipients: string;
  status: 'draft' | 'scheduled' | 'sent';
  createdAt: string;
  sentAt?: string;
  scheduledFor?: string;
}

interface MarketingStats {
  optedInUsers: number;
  totalCampaigns: number;
  campaignsSent: number;
  avgOpenRate: number;
}

export default function KingdomMarketing() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [stats, setStats] = useState<MarketingStats>({
    optedInUsers: 0,
    totalCampaigns: 0,
    campaignsSent: 0,
    avgOpenRate: 0
  });
  const [newCampaign, setNewCampaign] = useState({
    subject: '',
    content: '',
    recipients: 'all'
  });
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isAdmin = localStorage.getItem("isAdmin") === "true";
      if (!isAdmin) {
        router.replace("/admin-login");
      } else {
        setLoading(false);
        loadMarketingData();
      }
    }
  }, [router]);

  const loadMarketingData = async () => {
    try {
      // Load user stats
      const usersResponse = await fetch('/api/admin/stats/users');
      const usersData = await usersResponse.json();

      // Load campaigns from localStorage
      const campaignsData = JSON.parse(localStorage.getItem('marketing_campaigns') || '[]');
      setCampaigns(campaignsData);

      setStats({
        optedInUsers: usersData.optedInMarketing || 0,
        totalCampaigns: campaignsData.length,
        campaignsSent: campaignsData.filter((c: EmailCampaign) => c.status === 'sent').length,
        avgOpenRate: 0.15 // Mock data
      });
    } catch (error) {
      console.error('Failed to load marketing data:', error);
    }
  };

  const handleCreateCampaign = () => {
    if (!newCampaign.subject || !newCampaign.content) return;

    const campaign: EmailCampaign = {
      id: Date.now().toString(),
      subject: newCampaign.subject,
      content: newCampaign.content,
      recipients: newCampaign.recipients,
      status: 'draft',
      createdAt: new Date().toISOString()
    };

    const updatedCampaigns = [...campaigns, campaign];
    setCampaigns(updatedCampaigns);
    localStorage.setItem('marketing_campaigns', JSON.stringify(updatedCampaigns));

    setNewCampaign({ subject: '', content: '', recipients: 'all' });
    setShowCreateForm(false);
    loadMarketingData();
  };

  const handleSendCampaign = (campaignId: string) => {
    const updatedCampaigns = campaigns.map(campaign => 
      campaign.id === campaignId 
        ? { ...campaign, status: 'sent' as const, sentAt: new Date().toISOString() }
        : campaign
    );
    setCampaigns(updatedCampaigns);
    localStorage.setItem('marketing_campaigns', JSON.stringify(updatedCampaigns));
    loadMarketingData();
  };

  const handleDeleteCampaign = (campaignId: string) => {
    const updatedCampaigns = campaigns.filter(campaign => campaign.id !== campaignId);
    setCampaigns(updatedCampaigns);
    localStorage.setItem('marketing_campaigns', JSON.stringify(updatedCampaigns));
    loadMarketingData();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-yellow-400 text-2xl">
        Loading royal marketing...
      </div>
    );
  }

  return (
    <DashboardLayout>
      <Head>
        <title>Royal Marketing - The King's Domain</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#FFD700] mb-2">📧 Royal Marketing</h1>
          <p className="text-zinc-400">Communicate with your subjects through email campaigns</p>
        </div>

        {/* Marketing Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-6">
            <h3 className="text-yellow-400 text-sm font-medium mb-2">Opted-In Users</h3>
            <p className="text-2xl font-bold text-white">{stats.optedInUsers}</p>
          </div>
          <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-6">
            <h3 className="text-yellow-400 text-sm font-medium mb-2">Total Campaigns</h3>
            <p className="text-2xl font-bold text-white">{stats.totalCampaigns}</p>
          </div>
          <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-6">
            <h3 className="text-yellow-400 text-sm font-medium mb-2">Campaigns Sent</h3>
            <p className="text-2xl font-bold text-white">{stats.campaignsSent}</p>
          </div>
          <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-6">
            <h3 className="text-yellow-400 text-sm font-medium mb-2">Avg Open Rate</h3>
            <p className="text-2xl font-bold text-white">{(stats.avgOpenRate * 100).toFixed(1)}%</p>
          </div>
        </div>

        {/* Create Campaign Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-yellow-600 hover:bg-yellow-700 text-black px-6 py-3 rounded-lg font-medium transition"
          >
            {showCreateForm ? 'Cancel' : '+ Create New Campaign'}
          </button>
        </div>

        {/* Create Campaign Form */}
        {showCreateForm && (
          <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-6 mb-8">
            <h3 className="text-xl font-semibold text-yellow-400 mb-4">Create Email Campaign</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Subject</label>
                <input
                  type="text"
                  value={newCampaign.subject}
                  onChange={(e) => setNewCampaign({...newCampaign, subject: e.target.value})}
                  className="w-full px-3 py-2 border border-zinc-600 rounded-md bg-zinc-800 text-white"
                  placeholder="Campaign subject..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Content</label>
                <textarea
                  value={newCampaign.content}
                  onChange={(e) => setNewCampaign({...newCampaign, content: e.target.value})}
                  rows={6}
                  className="w-full px-3 py-2 border border-zinc-600 rounded-md bg-zinc-800 text-white"
                  placeholder="Email content..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Recipients</label>
                <select
                  value={newCampaign.recipients}
                  onChange={(e) => setNewCampaign({...newCampaign, recipients: e.target.value})}
                  className="w-full px-3 py-2 border border-zinc-600 rounded-md bg-zinc-800 text-white"
                >
                  <option value="all">All Opted-In Users</option>
                  <option value="initiate">Initiate Members</option>
                  <option value="guild">Guild Members</option>
                  <option value="migistus">MIGISTUS Members</option>
                </select>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={handleCreateCampaign}
                  className="bg-yellow-600 hover:bg-yellow-700 text-black px-6 py-2 rounded-lg transition"
                >
                  Create Campaign
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

        {/* Campaigns List */}
        <div className="bg-zinc-900 border border-yellow-500 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-700">
            <h3 className="text-xl font-semibold text-yellow-400">Email Campaigns</h3>
          </div>
          <div className="divide-y divide-zinc-700">
            {campaigns.length === 0 ? (
              <div className="px-6 py-8 text-center text-zinc-400">
                No campaigns created yet. Create your first campaign to reach your subjects!
              </div>
            ) : (
              campaigns.map(campaign => (
                <div key={campaign.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-white font-medium">{campaign.subject}</h4>
                      <p className="text-zinc-400 text-sm mt-1">
                        Recipients: {campaign.recipients} • Created: {new Date(campaign.createdAt).toLocaleDateString()}
                      </p>
                      <div className="mt-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          campaign.status === 'sent' 
                            ? 'bg-green-100 text-green-800' 
                            : campaign.status === 'scheduled'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                        </span>
                        {campaign.sentAt && (
                          <span className="ml-2 text-xs text-zinc-400">
                            Sent: {new Date(campaign.sentAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {campaign.status === 'draft' && (
                        <button
                          onClick={() => handleSendCampaign(campaign.id)}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition"
                        >
                          Send Now
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteCampaign(campaign.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 text-zinc-300 text-sm bg-zinc-800 p-3 rounded border">
                    {campaign.content.substring(0, 200)}
                    {campaign.content.length > 200 && '...'}
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


// Disable footer for Kingdom pages
(KingdomMarketing as any).showFooter = false;