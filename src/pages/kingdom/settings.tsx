import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../components/DashboardLayout';
import Head from 'next/head';

interface SystemSettings {
  site: {
    siteName: string;
    siteDescription: string;
    maintenanceMode: boolean;
    registrationEnabled: boolean;
  };
  voting: {
    enabled: boolean;
    maxVotesPerUser: number;
    votingCooldown: number;
    tierMultipliers: {
      initiate: number;
      guild: number;
      migistus: number;
    };
  };
  drops: {
    enabled: boolean;
    maxActiveDrops: number;
    defaultDuration: number;
    pledgeTimeLimit: number;
  };
  features: {
    chatEnabled: boolean;
    marketingEnabled: boolean;
    analyticsEnabled: boolean;
    notificationsEnabled: boolean;
  };
  security: {
    maxLoginAttempts: number;
    sessionTimeout: number;
    passwordMinLength: number;
    twoFactorRequired: boolean;
  };
}

export default function KingdomSettings() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<SystemSettings>({
    site: {
      siteName: 'MIGISTUS',
      siteDescription: 'The ultimate group buying platform',
      maintenanceMode: false,
      registrationEnabled: true
    },
    voting: {
      enabled: true,
      maxVotesPerUser: 10,
      votingCooldown: 24,
      tierMultipliers: {
        initiate: 1,
        guild: 2,
        migistus: 3
      }
    },
    drops: {
      enabled: true,
      maxActiveDrops: 5,
      defaultDuration: 24,
      pledgeTimeLimit: 2
    },
    features: {
      chatEnabled: true,
      marketingEnabled: true,
      analyticsEnabled: true,
      notificationsEnabled: true
    },
    security: {
      maxLoginAttempts: 5,
      sessionTimeout: 60,
      passwordMinLength: 8,
      twoFactorRequired: false
    }
  });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isAdmin = localStorage.getItem("isAdmin") === "true";
      if (!isAdmin) {
        router.replace("/admin-login");
      } else {
        setLoading(false);
        loadSettings();
      }
    }
  }, [router]);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(prev => ({
          ...prev,
          ...data,
          site: { ...prev.site, ...(data.site || {}) },
          voting: { ...prev.voting, ...(data.voting || {}) },
          drops: { ...prev.drops, ...(data.drops || {}) },
          features: { ...prev.features, ...(data.features || {}) },
          security: { ...prev.security, ...(data.security || {}) }
        }));
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleSaveSettings = async () => {
    setSaveStatus('saving');
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        localStorage.setItem('system_settings', JSON.stringify(settings));
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      localStorage.setItem('system_settings', JSON.stringify(settings));
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const updateSetting = (category: keyof SystemSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const updateNestedSetting = (category: keyof SystemSettings, parentKey: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [parentKey]: {
          ...(prev[category] as any)[parentKey],
          [key]: value
        }
      }
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-yellow-400 text-2xl">
        Loading system settings...
      </div>
    );
  }

  return (
    <DashboardLayout>
      <Head>
        <title>System Settings - The King's Domain</title>
      </Head>

      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/30">
                <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 bg-clip-text text-transparent">
                  System Settings
                </h1>
                <p className="text-zinc-400 text-sm mt-1">
                  Configure and manage all platform settings
                </p>
              </div>
            </div>
            
            <button
              onClick={handleSaveSettings}
              disabled={saveStatus === 'saving'}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-amber-500/20"
            >
              {saveStatus === 'saving' ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : saveStatus === 'saved' ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Saved!
                </>
              ) : saveStatus === 'error' ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Error
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Site Settings */}
          <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 hover:border-zinc-700/50 transition-all">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center border border-blue-500/30">
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Site Settings</h2>
                <p className="text-sm text-zinc-400">Basic site configuration</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Site Name</label>
                <input
                  type="text"
                  value={settings.site.siteName}
                  onChange={(e) => updateSetting('site', 'siteName', e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-white placeholder-zinc-500 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all"
                  placeholder="Enter site name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Site Description</label>
                <textarea
                  value={settings.site.siteDescription}
                  onChange={(e) => updateSetting('site', 'siteDescription', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-white placeholder-zinc-500 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all resize-none"
                  placeholder="Describe your platform"
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-lg border border-zinc-700/30">
                <div>
                  <p className="text-sm font-medium text-white">Maintenance Mode</p>
                  <p className="text-xs text-zinc-400 mt-0.5">Temporarily disable site access</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.site.maintenanceMode}
                    onChange={(e) => updateSetting('site', 'maintenanceMode', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-700 rounded-full peer-checked:bg-gradient-to-r peer-checked:from-amber-500 peer-checked:to-orange-500 transition-all"></div>
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                </label>
              </div>
              <div className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-lg border border-zinc-700/30">
                <div>
                  <p className="text-sm font-medium text-white">Registration Enabled</p>
                  <p className="text-xs text-zinc-400 mt-0.5">Allow new user signups</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.site.registrationEnabled}
                    onChange={(e) => updateSetting('site', 'registrationEnabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-700 rounded-full peer-checked:bg-gradient-to-r peer-checked:from-amber-500 peer-checked:to-orange-500 transition-all"></div>
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Voting Settings */}
          <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 hover:border-zinc-700/50 transition-all">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/30">
                <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Voting Settings</h2>
                <p className="text-sm text-zinc-400">Configure voting mechanics</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-lg border border-zinc-700/30">
                <div>
                  <p className="text-sm font-medium text-white">Voting Enabled</p>
                  <p className="text-xs text-zinc-400 mt-0.5">Enable product voting system</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.voting.enabled}
                    onChange={(e) => updateSetting('voting', 'enabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-700 rounded-full peer-checked:bg-gradient-to-r peer-checked:from-amber-500 peer-checked:to-orange-500 transition-all"></div>
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Max Votes Per User</label>
                <input
                  type="number"
                  value={settings.voting.maxVotesPerUser}
                  onChange={(e) => updateSetting('voting', 'maxVotesPerUser', parseInt(e.target.value))}
                  min="1"
                  className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-white focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Voting Cooldown (hours)</label>
                <input
                  type="number"
                  value={settings.voting.votingCooldown}
                  onChange={(e) => updateSetting('voting', 'votingCooldown', parseInt(e.target.value))}
                  min="0"
                  className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-white focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Live Drops Settings */}
          <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 hover:border-zinc-700/50 transition-all">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center border border-green-500/30">
                <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Live Drops Settings</h2>
                <p className="text-sm text-zinc-400">Configure group buying drops</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-lg border border-zinc-700/30">
                <div>
                  <p className="text-sm font-medium text-white">Live Drops Enabled</p>
                  <p className="text-xs text-zinc-400 mt-0.5">Enable live drop system</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.drops.enabled}
                    onChange={(e) => updateSetting('drops', 'enabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-700 rounded-full peer-checked:bg-gradient-to-r peer-checked:from-amber-500 peer-checked:to-orange-500 transition-all"></div>
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Max Active Drops</label>
                <input
                  type="number"
                  value={settings.drops.maxActiveDrops}
                  onChange={(e) => updateSetting('drops', 'maxActiveDrops', parseInt(e.target.value))}
                  min="1"
                  className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-white focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Default Duration (hours)</label>
                <input
                  type="number"
                  value={settings.drops.defaultDuration}
                  onChange={(e) => updateSetting('drops', 'defaultDuration', parseInt(e.target.value))}
                  min="1"
                  className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-white focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Pledge Time Limit (hours)</label>
                <input
                  type="number"
                  value={settings.drops.pledgeTimeLimit}
                  onChange={(e) => updateSetting('drops', 'pledgeTimeLimit', parseInt(e.target.value))}
                  min="1"
                  className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-white focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 hover:border-zinc-700/50 transition-all">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center border border-amber-500/30">
                <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Features</h2>
                <p className="text-sm text-zinc-400">Toggle platform features</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-lg border border-zinc-700/30">
                <div>
                  <p className="text-sm font-medium text-white">Chat Enabled</p>
                  <p className="text-xs text-zinc-400 mt-0.5">Enable live chat feature</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.features.chatEnabled}
                    onChange={(e) => updateSetting('features', 'chatEnabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-700 rounded-full peer-checked:bg-gradient-to-r peer-checked:from-amber-500 peer-checked:to-orange-500 transition-all"></div>
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                </label>
              </div>
              <div className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-lg border border-zinc-700/30">
                <div>
                  <p className="text-sm font-medium text-white">Marketing Enabled</p>
                  <p className="text-xs text-zinc-400 mt-0.5">Enable marketing features</p>
                </div>
                <label className="relative inline-flex items-centers cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.features.marketingEnabled}
                    onChange={(e) => updateSetting('features', 'marketingEnabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-700 rounded-full peer-checked:bg-gradient-to-r peer-checked:from-amber-500 peer-checked:to-orange-500 transition-all"></div>
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                </label>
              </div>
              <div className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-lg border border-zinc-700/30">
                <div>
                  <p className="text-sm font-medium text-white">Analytics Enabled</p>
                  <p className="text-xs text-zinc-400 mt-0.5">Enable analytics tracking</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.features.analyticsEnabled}
                    onChange={(e) => updateSetting('features', 'analyticsEnabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-700 rounded-full peer-checked:bg-gradient-to-r peer-checked:from-amber-500 peer-checked:to-orange-500 transition-all"></div>
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                </label>
              </div>
              <div className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-lg border border-zinc-700/30">
                <div>
                  <p className="text-sm font-medium text-white">Notifications Enabled</p>
                  <p className="text-xs text-zinc-400 mt-0.5">Enable user notifications</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.features.notificationsEnabled}
                    onChange={(e) => updateSetting('features', 'notificationsEnabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-700 rounded-full peer-checked:bg-gradient-to-r peer-checked:from-amber-500 peer-checked:to-orange-500 transition-all"></div>
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 hover:border-zinc-700/50 transition-all lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500/20 to-pink-500/20 flex items-center justify-center border border-red-500/30">
                <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Security Settings</h2>
                <p className="text-sm text-zinc-400">Configure security and access controls</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Max Login Attempts</label>
                <input
                  type="number"
                  value={settings.security.maxLoginAttempts}
                  onChange={(e) => updateSetting('security', 'maxLoginAttempts', parseInt(e.target.value))}
                  min="1"
                  className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-white focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Session Timeout (minutes)</label>
                <input
                  type="number"
                  value={settings.security.sessionTimeout}
                  onChange={(e) => updateSetting('security', 'sessionTimeout', parseInt(e.target.value))}
                  min="1"
                  className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-white focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Password Min Length</label>
                <input
                  type="number"
                  value={settings.security.passwordMinLength}
                  onChange={(e) => updateSetting('security', 'passwordMinLength', parseInt(e.target.value))}
                  min="6"
                  className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-white focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all"
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-lg border border-zinc-700/30">
                <div>
                  <p className="text-sm font-medium text-white">Two-Factor Authentication Required</p>
                  <p className="text-xs text-zinc-400 mt-0.5">Force 2FA for all users</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.security.twoFactorRequired}
                    onChange={(e) => updateSetting('security', 'twoFactorRequired', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-700 rounded-full peer-checked:bg-gradient-to-r peer-checked:from-amber-500 peer-checked:to-orange-500 transition-all"></div>
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Disable footer for this page
(KingdomSettings as any).showFooter = false;
