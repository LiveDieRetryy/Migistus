import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/router';
import Head from 'next/head';

interface MetricsData {
  metrics: {
    timeWindow: number;
    totalRequests: number;
    errorCount: number;
    errorRate: string;
    avgResponseTime: number;
    slowestEndpoints: Array<{
      endpoint: string;
      count: number;
      avgTime: number;
      errors: number;
    }>;
    statusCodes: Record<number, number>;
    recentErrors: Array<{
      endpoint: string;
      method: string;
      error: string;
      timestamp: number;
    }>;
    uptime: number;
    requestsPerMinute: number;
  };
  lifetime: {
    totalRequests: number;
    totalErrors: number;
    uptime: number;
  };
  cache: {
    total: number;
    active: number;
    expired: number;
    keys: string[];
  };
}

export default function MonitoringPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeWindow, setTimeWindow] = useState(60000); // 1 minute
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (user && user.tier !== 'Admin') {
      router.push('/');
    }
  }, [user, router]);

  const fetchMetrics = async () => {
    try {
      const res = await fetch(`/api/metrics/stats?timeWindow=${timeWindow}`);
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [timeWindow]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchMetrics, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, timeWindow]);

  const formatUptime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getStatusColor = (code: number) => {
    if (code >= 500) return 'text-red-600';
    if (code >= 400) return 'text-yellow-600';
    if (code >= 300) return 'text-blue-600';
    return 'text-green-600';
  };

  if (!user || user.tier !== 'Admin') {
    return null;
  }

  return (
    <DashboardLayout>
      <Head>
        <title>System Monitoring - MIGISTUS Kingdom</title>
      </Head>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">System Monitoring</h1>
            <p className="text-gray-600">Real-time performance metrics and error tracking</p>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Auto-refresh (5s)</span>
            </label>
            <select
              value={timeWindow}
              onChange={(e) => setTimeWindow(Number(e.target.value))}
              className="px-3 py-2 border rounded-lg"
            >
              <option value={60000}>Last 1 minute</option>
              <option value={300000}>Last 5 minutes</option>
              <option value={900000}>Last 15 minutes</option>
              <option value={3600000}>Last 1 hour</option>
            </select>
            <button
              onClick={fetchMetrics}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : metrics ? (
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Total Requests</h3>
                <p className="text-3xl font-bold">{metrics.metrics.totalRequests}</p>
                <p className="text-sm text-gray-500 mt-1">{metrics.metrics.requestsPerMinute} req/min</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Error Rate</h3>
                <p className="text-3xl font-bold text-red-600">{metrics.metrics.errorRate}%</p>
                <p className="text-sm text-gray-500 mt-1">{metrics.metrics.errorCount} errors</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Avg Response Time</h3>
                <p className="text-3xl font-bold">{metrics.metrics.avgResponseTime}ms</p>
                <p className="text-sm text-gray-500 mt-1">Average latency</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">System Uptime</h3>
                <p className="text-3xl font-bold">{formatUptime(metrics.lifetime.uptime)}</p>
                <p className="text-sm text-gray-500 mt-1">Since last restart</p>
              </div>
            </div>

            {/* Cache Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Cache Performance</h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Entries</p>
                  <p className="text-2xl font-bold">{metrics.cache.total}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-green-600">{metrics.cache.active}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Expired</p>
                  <p className="text-2xl font-bold text-gray-400">{metrics.cache.expired}</p>
                </div>
              </div>
            </div>

            {/* Status Codes */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Status Code Distribution</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(metrics.metrics.statusCodes).map(([code, count]) => (
                  <div key={code} className="text-center">
                    <p className={`text-3xl font-bold ${getStatusColor(Number(code))}`}>{code}</p>
                    <p className="text-sm text-gray-600">{count} requests</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Slowest Endpoints */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Slowest Endpoints</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Endpoint</th>
                      <th className="text-right py-3 px-4">Requests</th>
                      <th className="text-right py-3 px-4">Avg Time</th>
                      <th className="text-right py-3 px-4">Errors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.metrics.slowestEndpoints.map((endpoint, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-mono text-sm">{endpoint.endpoint}</td>
                        <td className="text-right py-3 px-4">{endpoint.count}</td>
                        <td className="text-right py-3 px-4 font-bold">
                          {Math.round(endpoint.avgTime)}ms
                        </td>
                        <td className="text-right py-3 px-4">
                          {endpoint.errors > 0 ? (
                            <span className="text-red-600 font-bold">{endpoint.errors}</span>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Errors */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Recent Errors</h2>
              {metrics.metrics.recentErrors.length === 0 ? (
                <p className="text-center py-8 text-gray-500">No errors in the selected time window</p>
              ) : (
                <div className="space-y-3">
                  {metrics.metrics.recentErrors.map((error, idx) => (
                    <div key={idx} className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="font-bold text-red-800">{error.method}</span>
                          <span className="ml-2 font-mono text-sm">{error.endpoint}</span>
                        </div>
                        <span className="text-sm text-gray-600">{formatTimestamp(error.timestamp)}</span>
                      </div>
                      <p className="text-red-600 text-sm">{error.error}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Lifetime Stats */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Lifetime Statistics</h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Requests</p>
                  <p className="text-2xl font-bold">{metrics.lifetime.totalRequests.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Errors</p>
                  <p className="text-2xl font-bold text-red-600">{metrics.lifetime.totalErrors}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Uptime</p>
                  <p className="text-2xl font-bold">{formatUptime(metrics.lifetime.uptime)}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">Failed to load metrics</div>
        )}
      </div>
    </DashboardLayout>
  );
}
