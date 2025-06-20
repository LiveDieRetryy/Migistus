import { useState, useEffect } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/DashboardLayout';
import { useRouter } from 'next/router';

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
    votingCooldown: number; // hours
    tierMultipliers: {
      initiate: number;
      guild: number;
      migistus: number;
    };
  };
  drops: {
    enabled: boolean;
    maxActiveDrops: number;
    defaultDuration: number; // hours
    pledgeTimeLimit: number; // hours
  };
  features: {
    chatEnabled: boolean;
    marketingEnabled: boolean;
    analyticsEnabled: boolean;
    notificationsEnabled: boolean;
  };
  security: {
    maxLoginAttempts: number;
    sessionTimeout: number; // minutes
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
        // Merge with default settings to ensure all properties exist
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
      // Load from localStorage as fallback
      const stored = localStorage.getItem('system_settings');
      if (stored) {
        try {
          const parsedData = JSON.parse(stored);
          setSettings(prev => ({
            ...prev,
            ...parsedData,
            site: { ...prev.site, ...(parsedData.site || {}) },
            voting: { ...prev.voting, ...(parsedData.voting || {}) },
            drops: { ...prev.drops, ...(parsedData.drops || {}) },
            features: { ...prev.features, ...(parsedData.features || {}) },
            security: { ...prev.security, ...(parsedData.security || {}) }
          }));
        } catch (parseError) {
          console.error('Failed to parse stored settings:', parseError);
        }
      }
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#FFD700] mb-2">⚙️ System Settings</h1>
            <p className="text-zinc-400">Configure site-wide settings, voting parameters, and features</p>
          </div>
          <button
            onClick={handleSaveSettings}
            disabled={saveStatus === 'saving'}
            className={`px-6 py-3 rounded-lg font-medium transition ${
              saveStatus === 'saved' 
                ? 'bg-green-600 text-white' 
                : saveStatus === 'error'
                ? 'bg-red-600 text-white'
                : 'bg-yellow-600 hover:bg-yellow-700 text-black'
            }`}
          >
            {saveStatus === 'saving' ? 'Saving...' : 
             saveStatus === 'saved' ? 'Saved!' :
             saveStatus === 'error' ? 'Error!' : 'Save Settings'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Site Settings */}
          <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-yellow-400 mb-4">🏠 Site Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Site Name</label>                <input
                  type="text"
                  value={settings.site?.siteName || 'MIGISTUS'}
                  onChange={(e) => updateSetting('site', 'siteName', e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-600 rounded-md bg-zinc-800 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Site Description</label>                <textarea
                  value={settings.site?.siteDescription || 'The ultimate group buying platform'}
                  onChange={(e) => updateSetting('site', 'siteDescription', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-zinc-600 rounded-md bg-zinc-800 text-white"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-300">Maintenance Mode</span>
                <label className="relative inline-flex items-center cursor-pointer">                  <input
                    type="checkbox"
                    checked={settings.site?.maintenanceMode || false}
                    onChange={(e) => updateSetting('site', 'maintenanceMode', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-300">Registration Enabled</span>
                <label className="relative inline-flex items-center cursor-pointer">                  <input
                    type="checkbox"
                    checked={settings.site?.registrationEnabled || true}
                    onChange={(e) => updateSetting('site', 'registrationEnabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Voting Settings */}
          <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-yellow-400 mb-4">🗳️ Voting Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-zinc-300">Voting Enabled</span>
                <label className="relative inline-flex items-center cursor-pointer">                  <input
                    type="checkbox"
                    checked={settings.voting?.enabled || true}
                    onChange={(e) => updateSetting('voting', 'enabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Max Votes per User</label>                <input
                  type="number"
                  value={settings.voting?.maxVotesPerUser || 10}
                  onChange={(e) => updateSetting('voting', 'maxVotesPerUser', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-zinc-600 rounded-md bg-zinc-800 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Voting Cooldown (hours)</label>                <input
                  type="number"
                  value={settings.voting?.votingCooldown || 24}
                  onChange={(e) => updateSetting('voting', 'votingCooldown', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-zinc-600 rounded-md bg-zinc-800 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Tier Multipliers</label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-zinc-400">Initiate</label>                    <input
                      type="number"
                      step="0.1"
                      value={settings.voting?.tierMultipliers?.initiate || 1}
                      onChange={(e) => updateNestedSetting('voting', 'tierMultipliers', 'initiate', parseFloat(e.target.value))}
                      className="w-full px-2 py-1 border border-zinc-600 rounded bg-zinc-800 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400">Guild</label>                    <input
                      type="number"
                      step="0.1"
                      value={settings.voting?.tierMultipliers?.guild || 2}
                      onChange={(e) => updateNestedSetting('voting', 'tierMultipliers', 'guild', parseFloat(e.target.value))}
                      className="w-full px-2 py-1 border border-zinc-600 rounded bg-zinc-800 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400">MIGISTUS</label>                    <input
                      type="number"
                      step="0.1"
                      value={settings.voting?.tierMultipliers?.migistus || 3}
                      onChange={(e) => updateNestedSetting('voting', 'tierMultipliers', 'migistus', parseFloat(e.target.value))}
                      className="w-full px-2 py-1 border border-zinc-600 rounded bg-zinc-800 text-white text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Live Drops Settings */}
          <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-yellow-400 mb-4">🔥 Live Drops Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-zinc-300">Drops Enabled</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"                    checked={settings.drops?.enabled || true}
                    onChange={(e) => updateSetting('drops', 'enabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Max Active Drops</label>
                <input
                  type="number"                  value={settings.drops?.maxActiveDrops || 5}
                  onChange={(e) => updateSetting('drops', 'maxActiveDrops', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-zinc-600 rounded-md bg-zinc-800 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Default Duration (hours)</label>
                <input
                  type="number"                  value={settings.drops?.defaultDuration || 24}
                  onChange={(e) => updateSetting('drops', 'defaultDuration', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-zinc-600 rounded-md bg-zinc-800 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Pledge Time Limit (hours)</label>
                <input
                  type="number"                  value={settings.drops?.pledgeTimeLimit || 2}
                  onChange={(e) => updateSetting('drops', 'pledgeTimeLimit', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-zinc-600 rounded-md bg-zinc-800 text-white"
                />
              </div>
            </div>
          </div>

          {/* Feature Toggles */}
          <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-yellow-400 mb-4">🎛️ Feature Toggles</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-zinc-300">Chat System</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"                    checked={settings.features?.chatEnabled || true}
                    onChange={(e) => updateSetting('features', 'chatEnabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-300">Marketing Tools</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"                    checked={settings.features?.marketingEnabled || true}
                    onChange={(e) => updateSetting('features', 'marketingEnabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-300">Analytics</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"                    checked={settings.features?.analyticsEnabled || true}
                    onChange={(e) => updateSetting('features', 'analyticsEnabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-300">Notifications</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"                    checked={settings.features?.notificationsEnabled || true}
                    onChange={(e) => updateSetting('features', 'notificationsEnabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-yellow-400 mb-4">🔒 Security Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Max Login Attempts</label>
                <input
                  type="number"                  value={settings.security?.maxLoginAttempts || 5}
                  onChange={(e) => updateSetting('security', 'maxLoginAttempts', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-zinc-600 rounded-md bg-zinc-800 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Session Timeout (minutes)</label>
                <input
                  type="number"                  value={settings.security?.sessionTimeout || 60}
                  onChange={(e) => updateSetting('security', 'sessionTimeout', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-zinc-600 rounded-md bg-zinc-800 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Password Min Length</label>
                <input
                  type="number"                  value={settings.security?.passwordMinLength || 8}
                  onChange={(e) => updateSetting('security', 'passwordMinLength', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-zinc-600 rounded-md bg-zinc-800 text-white"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-300">Two-Factor Required</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"                    checked={settings.security?.twoFactorRequired || false}
                    onChange={(e) => updateSetting('security', 'twoFactorRequired', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-yellow-400 mb-4">📊 System Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-zinc-300">Database Status</span>
                <span className="text-green-400">✓ Connected</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-300">API Status</span>
                <span className="text-green-400">✓ Online</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-300">Cache Status</span>
                <span className="text-green-400">✓ Active</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-300">Mail Service</span>
                <span className="text-green-400">✓ Operational</span>
              </div>
              <div className="mt-4 pt-4 border-t border-zinc-700">
                <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded text-sm transition">
                  Clear Cache
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
