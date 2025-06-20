import { useState, useEffect } from 'react';
import Head from 'next/head';
import MainNavbar from '@/components/nav/MainNavbar';
import { useAuth } from '@/context/AuthContext';

interface SiteSettings {
  siteName: string;
  siteDescription: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  emailVerificationRequired: boolean;
  autoApproveVotes: boolean;
  autoApproveProducts: boolean;
  defaultUserTier: string;
  maxVotesPerDay: {
    'New Initiate': number;
    'New Member': number;
    'Subscriber': number;
    'Premium': number;
    'Admin': number;
  };
  voteMultipliers: {
    'New Initiate': number;
    'New Member': number;
    'Subscriber': number;
    'Premium': number;
    'Admin': number;
  };
  featuredProductsLimit: number;
  staffPicksLimit: number;
  liveDropsEnabled: boolean;
  chatEnabled: boolean;
  moderationEnabled: boolean;
}

export default function AdminSettingsPage() {
  const { user, isAuthenticated } = useAuth();
  const [settings, setSettings] = useState<SiteSettings>({
    siteName: 'MIGISTUS',
    siteDescription: 'Community-driven group buying platform',
    maintenanceMode: false,
    registrationEnabled: true,
    emailVerificationRequired: false,
    autoApproveVotes: true,
    autoApproveProducts: false,
    defaultUserTier: 'New Initiate',
    maxVotesPerDay: {
      'New Initiate': 3,
      'New Member': 5,
      'Subscriber': 10,
      'Premium': 20,
      'Admin': 100
    },
    voteMultipliers: {
      'New Initiate': 1,
      'New Member': 1.2,
      'Subscriber': 1.5,
      'Premium': 2,
      'Admin': 5
    },
    featuredProductsLimit: 6,
    staffPicksLimit: 12,
    liveDropsEnabled: true,
    chatEnabled: true,
    moderationEnabled: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'voting' | 'products' | 'features'>('general');

  useEffect(() => {
    if (!isAuthenticated || user?.email !== 'admin@migistus.com') return;
    loadSettings();
  }, [isAuthenticated, user]);
  const loadSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };
  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      // Also save to localStorage as backup
      localStorage.setItem('admin_settings', JSON.stringify(settings));

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof SiteSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateNestedSetting = (parent: keyof SiteSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [parent]: { ...(prev[parent] as any), [key]: value }
    }));
  };

  if (!isAuthenticated || user?.email !== 'admin@migistus.com') {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <MainNavbar />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 text-center">
            <h1 className="text-2xl font-bold text-red-400 mb-2">Access Denied</h1>
            <p className="text-gray-300">You need admin privileges to access settings.</p>
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
            <p className="mt-4 text-gray-400">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Head>
        <title>Admin Settings - Kings Domain | Migistus</title>
        <meta name="description" content="Admin system settings and configuration" />
      </Head>

      <MainNavbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-purple-400 mb-2 flex items-center gap-3">
            <span>⚙️</span> System Settings
          </h1>
          <p className="text-gray-400">Configure site-wide settings and preferences</p>
        </div>

        {/* Save Status */}
        {saved && (
          <div className="mb-6 bg-green-900/20 border border-green-500 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-400">
              <span>✅</span>
              <span>Settings saved successfully!</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 border-b border-gray-700">
            {[
              { key: 'general', label: 'General', icon: '🏠' },
              { key: 'voting', label: 'Voting System', icon: '🗳️' },
              { key: 'products', label: 'Products', icon: '📦' },
              { key: 'features', label: 'Features', icon: '🔧' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'text-purple-400 border-b-2 border-purple-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Settings Content */}
        <div className="space-y-6">
          {activeTab === 'general' && (
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-purple-400 mb-6">General Settings</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Site Name
                  </label>
                  <input
                    type="text"
                    value={settings.siteName}
                    onChange={(e) => updateSetting('siteName', e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Default User Tier
                  </label>
                  <select
                    value={settings.defaultUserTier}
                    onChange={(e) => updateSetting('defaultUserTier', e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="New Initiate">New Initiate</option>
                    <option value="New Member">New Member</option>
                    <option value="Subscriber">Subscriber</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Site Description
                  </label>
                  <textarea
                    value={settings.siteDescription}
                    onChange={(e) => updateSetting('siteDescription', e.target.value)}
                    rows={3}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-200">Site Controls</h3>
                
                {[
                  { key: 'maintenanceMode', label: 'Maintenance Mode', description: 'Put the site in maintenance mode' },
                  { key: 'registrationEnabled', label: 'Registration Enabled', description: 'Allow new user registrations' },
                  { key: 'emailVerificationRequired', label: 'Email Verification Required', description: 'Require email verification for new accounts' }
                ].map(control => (
                  <div key={control.key} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                    <div>
                      <div className="font-medium text-white">{control.label}</div>
                      <div className="text-sm text-gray-400">{control.description}</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings[control.key as keyof SiteSettings] as boolean}
                        onChange={(e) => updateSetting(control.key as keyof SiteSettings, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'voting' && (
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-purple-400 mb-6">Voting System Configuration</h2>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                  <div>
                    <div className="font-medium text-white">Auto-approve Votes</div>
                    <div className="text-sm text-gray-400">Automatically approve all submitted votes</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.autoApproveVotes}
                      onChange={(e) => updateSetting('autoApproveVotes', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                  </label>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-200 mb-4">Daily Vote Limits by Tier</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(settings.maxVotesPerDay).map(([tier, limit]) => (
                      <div key={tier}>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          {tier}
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={limit}
                          onChange={(e) => updateNestedSetting('maxVotesPerDay', tier, parseInt(e.target.value) || 0)}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-200 mb-4">Vote Weight Multipliers by Tier</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(settings.voteMultipliers).map(([tier, multiplier]) => (
                      <div key={tier}>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          {tier}
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={multiplier}
                          onChange={(e) => updateNestedSetting('voteMultipliers', tier, parseFloat(e.target.value) || 0)}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-purple-400 mb-6">Product Management</h2>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                  <div>
                    <div className="font-medium text-white">Auto-approve Products</div>
                    <div className="text-sm text-gray-400">Automatically approve submitted products</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.autoApproveProducts}
                      onChange={(e) => updateSetting('autoApproveProducts', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Featured Products Limit
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={settings.featuredProductsLimit}
                      onChange={(e) => updateSetting('featuredProductsLimit', parseInt(e.target.value) || 0)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    />
                    <p className="text-xs text-gray-400 mt-1">Maximum number of featured products</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Staff Picks Limit
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={settings.staffPicksLimit}
                      onChange={(e) => updateSetting('staffPicksLimit', parseInt(e.target.value) || 0)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    />
                    <p className="text-xs text-gray-400 mt-1">Maximum number of staff picks</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'features' && (
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-purple-400 mb-6">Feature Toggles</h2>
              
              <div className="space-y-4">
                {[
                  { key: 'liveDropsEnabled', label: 'Live Drops', description: 'Enable live drop functionality' },
                  { key: 'chatEnabled', label: 'Chat System', description: 'Enable chat on product pages' },
                  { key: 'moderationEnabled', label: 'Chat Moderation', description: 'Enable automated chat moderation' }
                ].map(feature => (
                  <div key={feature.key} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                    <div>
                      <div className="font-medium text-white">{feature.label}</div>
                      <div className="text-sm text-gray-400">{feature.description}</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings[feature.key as keyof SiteSettings] as boolean}
                        onChange={(e) => updateSetting(feature.key as keyof SiteSettings, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <span>💾</span>
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
