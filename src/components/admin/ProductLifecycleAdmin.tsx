import React, { useState, useEffect } from 'react';
import { RefreshCw, Settings, TrendingUp, Clock, CheckCircle } from 'lucide-react';

interface LifecycleConfig {
  votingToComingSoonThreshold: number;
  comingSoonDuration: number;
  communityDropsDuration: number;
  autoPromotionEnabled: boolean;
  lastUpdated?: string;
  updatedBy?: string;
}

interface LifecycleStats {
  config: LifecycleConfig;
  stageStats: {
    voting: number;
    "coming-soon": number;
    "community-drops": number;
    completed: number;
  };
  totalProducts: number;
  autoPromotionEnabled: boolean;
}

export default function ProductLifecycleAdmin() {
  const [config, setConfig] = useState<LifecycleConfig>({
    votingToComingSoonThreshold: 50,
    comingSoonDuration: 7,
    communityDropsDuration: 14,
    autoPromotionEnabled: true
  });

  const [stats, setStats] = useState<LifecycleStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/product-lifecycle/process');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
        setConfig(data.config);
      }
    } catch (error) {
      console.error('Error loading lifecycle stats:', error);
    }
  };

  const saveConfig = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/product-lifecycle/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...config,
          updatedBy: 'admin'
        }),
      });

      if (response.ok) {
        setMessage('Configuration saved successfully!');
        await loadStats();
      } else {
        setMessage('Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      setMessage('Error saving configuration');
    } finally {
      setLoading(false);
    }
  };

  const processLifecycle = async () => {
    setProcessing(true);
    setMessage('');

    try {
      const response = await fetch('/api/product-lifecycle/process', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setMessage(`Processed ${data.processedCount} products. ${data.promotions.length} promotions made.`);
        await loadStats();
      } else {
        setMessage('Failed to process product lifecycle');
      }
    } catch (error) {
      console.error('Error processing lifecycle:', error);
      setMessage('Error processing product lifecycle');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Product Lifecycle Management</h2>
          <p className="text-gray-600">Configure automated product stage transitions</p>
        </div>
        <button 
          onClick={loadStats} 
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Current Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">In Voting</p>
                <p className="text-2xl font-bold text-gray-900">{stats.stageStats.voting}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Coming Soon</p>
                <p className="text-2xl font-bold text-gray-900">{stats.stageStats["coming-soon"]}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Settings className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Community Drops</p>
                <p className="text-2xl font-bold text-gray-900">{stats.stageStats["community-drops"]}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.stageStats.completed}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Configuration */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Lifecycle Configuration</h3>
        </div>
        <div className="p-6 space-y-6">
          {/* Auto-promotion toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">Auto-promotion Enabled</label>
              <p className="text-sm text-gray-600">
                Automatically move products between stages based on configured rules
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.autoPromotionEnabled}
                onChange={(e) => 
                  setConfig(prev => ({ ...prev, autoPromotionEnabled: e.target.checked }))
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <hr className="border-gray-200" />

          {/* Voting to Coming Soon threshold */}
          <div className="space-y-2">
            <label htmlFor="threshold" className="block text-sm font-medium text-gray-900">
              Votes Threshold (Voting → Coming Soon)
            </label>
            <input
              id="threshold"
              type="number"
              value={config.votingToComingSoonThreshold}
              onChange={(e) => 
                setConfig(prev => ({ 
                  ...prev, 
                  votingToComingSoonThreshold: parseInt(e.target.value) || 0 
                }))
              }
              placeholder="50"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-600">
              Number of votes needed to automatically move a product from voting to coming soon
            </p>
          </div>

          {/* Coming Soon duration */}
          <div className="space-y-2">
            <label htmlFor="comingSoonDuration" className="block text-sm font-medium text-gray-900">
              Coming Soon Duration (days)
            </label>
            <input
              id="comingSoonDuration"
              type="number"
              value={config.comingSoonDuration}
              onChange={(e) => 
                setConfig(prev => ({ 
                  ...prev, 
                  comingSoonDuration: parseInt(e.target.value) || 0 
                }))
              }
              placeholder="7"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-600">
              Number of days a product stays in "coming soon" before moving to community drops
            </p>
          </div>

          {/* Community Drops duration */}
          <div className="space-y-2">
            <label htmlFor="communityDropsDuration" className="block text-sm font-medium text-gray-900">
              Community Drops Duration (days)
            </label>
            <input
              id="communityDropsDuration"
              type="number"
              value={config.communityDropsDuration}
              onChange={(e) => 
                setConfig(prev => ({ 
                  ...prev, 
                  communityDropsDuration: parseInt(e.target.value) || 0 
                }))
              }
              placeholder="14"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-600">
              Number of days a product stays in community drops before being completed
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-4">
            <button 
              onClick={saveConfig} 
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Settings className="w-4 h-4" />
              )}
              Save Configuration
            </button>

            <button 
              onClick={processLifecycle} 
              disabled={processing}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {processing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <TrendingUp className="w-4 h-4" />
              )}
              Process Now
            </button>
          </div>

          {/* Status message */}
          {message && (
            <div className={`p-3 rounded-lg ${
              message.includes('success') || message.includes('Processed')
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              {message}
            </div>
          )}

          {/* Last updated info */}
          {config.lastUpdated && (
            <div className="text-sm text-gray-600 pt-4 border-t border-gray-200">
              Last updated: {new Date(config.lastUpdated).toLocaleString()} 
              {config.updatedBy && ` by ${config.updatedBy}`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
