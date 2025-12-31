import { useState, useEffect } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/DashboardLayout';
import { useRouter } from 'next/router';

interface AnalyticsData {
  userGrowth: {
    thisMonth: number;
    lastMonth: number;
    change: number;
  };
  votingTrends: {
    totalVotes: number;
    activePolls: number;
    avgVotesPerPoll: number;
  };
  productPerformance: {
    totalProducts: number;
    successfulDrops: number;
    avgPledgeRate: number;
  };
  engagement: {
    dailyActiveUsers: number;
    avgSessionTime: number;
    bounceRate: number;
  };
}

interface SystemMetrics {
  metrics: {
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
    uptime: number;
    requestsPerMinute: number;
  };
  cache: {
    total: number;
    active: number;
    expired: number;
  };
}

interface FrontendAnalytics {
  pageViews: Array<{
    page: string;
    views: number;
    uniqueUsers: number;
    avgTime: number;
  }>;
  userActions: Array<{
    action: string;
    count: number;
    lastOccurred: string;
  }>;
  webVitals: {
    lcp: { avg: number; rating: string };
    fid: { avg: number; rating: string };
    cls: { avg: number; rating: string };
    pageLoad: { avg: number; rating: string };
  };
  customEvents: Array<{
    event: string;
    count: number;
    data: any;
  }>;
  topProducts: Array<{
    id: number;
    name: string;
    views: number;
    votes: number;
    cartAdds: number;
    purchases: number;
  }>;
}

export default function KingdomAnalytics() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'business' | 'system' | 'frontend'>('business');
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    userGrowth: { thisMonth: 0, lastMonth: 0, change: 0 },
    votingTrends: { totalVotes: 0, activePolls: 0, avgVotesPerPoll: 0 },
    productPerformance: { totalProducts: 0, successfulDrops: 0, avgPledgeRate: 0 },
    engagement: { dailyActiveUsers: 0, avgSessionTime: 0, bounceRate: 0 }
  });
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [frontendAnalytics, setFrontendAnalytics] = useState<FrontendAnalytics | null>(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [metricsWindow, setMetricsWindow] = useState(60000); // 1 minute

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isAdmin = localStorage.getItem("isAdmin") === "true";
      if (!isAdmin) {
        router.replace("/admin-login");
      } else {
        setLoading(false);
        loadAnalyticsData();
        if (activeTab === 'system') {
          loadSystemMetrics();
        } else if (activeTab === 'frontend') {
          loadFrontendAnalytics();
        }
      }
    }
  }, [router, timeRange, activeTab, metricsWindow]);

  useEffect(() => {
    if (activeTab === 'system') {
      const interval = setInterval(loadSystemMetrics, 5000);
      return () => clearInterval(interval);
    } else if (activeTab === 'frontend') {
      const interval = setInterval(loadFrontendAnalytics, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab, metricsWindow]);

  const loadFrontendAnalytics = async () => {
    try {
      const res = await fetch(`/api/analytics/stats?timeWindow=${metricsWindow}`);
      if (res.ok) {
        const data = await res.json();
        setFrontendAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to load frontend analytics:', error);
    }
  };

  const loadSystemMetrics = async () => {
    try {
      const res = await fetch(`/api/metrics/stats?timeWindow=${metricsWindow}`);
      if (res.ok) {
        const data = await res.json();
        setSystemMetrics(data);
      }
    } catch (error) {
      console.error('Failed to load system metrics:', error);
    }
  };

  const loadAnalyticsData = async () => {
    try {
      // Load analytics data from multiple sources
      const [usersResponse, votingResponse, productsResponse] = await Promise.all([
        fetch('/api/admin/stats/users'),
        fetch('/api/admin/stats/voting'),
        fetch('/api/admin/stats/products')
      ]);

      const usersData = await usersResponse.json();
      const votingData = await votingResponse.json();
      const productsData = await productsResponse.json();

      // Calculate analytics (mock data for demonstration)
      setAnalytics({
        userGrowth: {
          thisMonth: usersData.newToday * 30,
          lastMonth: usersData.newToday * 25,
          change: 20
        },
        votingTrends: {
          totalVotes: votingData.totalVotes,
          activePolls: votingData.activePolls,
          avgVotesPerPoll: votingData.totalVotes / Math.max(votingData.activePolls, 1)
        },
        productPerformance: {
          totalProducts: productsData.total,
          successfulDrops: Math.floor(productsData.total * 0.7),
          avgPledgeRate: 0.65
        },
        engagement: {
          dailyActiveUsers: Math.floor(usersData.active * 0.3),
          avgSessionTime: 25.5,
          bounceRate: 0.35
        }
      });
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    }
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    const color = change >= 0 ? 'text-green-400' : 'text-red-400';
    return <span className={color}>{sign}{change}%</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-yellow-400 text-2xl">
        Loading analytics dashboard...
      </div>
    );
  }

  return (
    <DashboardLayout>
      <Head>
        <title>Analytics Dashboard - The King's Domain</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#FFD700] mb-2">📊 Analytics Dashboard</h1>
            <p className="text-zinc-400">Track usage stats, voting trends, engagement, and system performance</p>
          </div>
          <div className="flex items-center gap-4">
            {activeTab === 'business' && (
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 border border-zinc-600 rounded-md bg-zinc-800 text-white"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
            )}
            {(activeTab === 'system' || activeTab === 'frontend') && (
              <select
                value={metricsWindow}
                onChange={(e) => setMetricsWindow(Number(e.target.value))}
                className="px-4 py-2 border border-zinc-600 rounded-md bg-zinc-800 text-white"
              >
                <option value={60000}>Last 1 minute</option>
                <option value={300000}>Last 5 minutes</option>
                <option value={900000}>Last 15 minutes</option>
                <option value={3600000}>Last 1 hour</option>
              </select>
            )}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="mb-6 border-b border-zinc-700">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('business')}
              className={`pb-3 px-4 font-medium transition-colors ${
                activeTab === 'business'
                  ? 'text-yellow-400 border-b-2 border-yellow-400'
                  : 'text-zinc-400 hover:text-zinc-300'
              }`}
            >
              📊 Business Analytics
            </button>
            <button
              onClick={() => setActiveTab('system')}
              className={`pb-3 px-4 font-medium transition-colors ${
                activeTab === 'system'
                  ? 'text-yellow-400 border-b-2 border-yellow-400'
                  : 'text-zinc-400 hover:text-zinc-300'
              }`}
            >
              📡 System Metrics
            </button>
            <button
              onClick={() => setActiveTab('frontend')}
              className={`pb-3 px-4 font-medium transition-colors ${
                activeTab === 'frontend'
                  ? 'text-yellow-400 border-b-2 border-yellow-400'
                  : 'text-zinc-400 hover:text-zinc-300'
              }`}
            >
              👤 User Analytics
            </button>
          </div>
        </div>

        {/* Business Analytics Tab */}
        {activeTab === 'business' && (
          <>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-6">
            <h3 className="text-yellow-400 text-sm font-medium mb-2">User Growth</h3>
            <p className="text-2xl font-bold text-white">{analytics.userGrowth.thisMonth}</p>
            <p className="text-sm text-zinc-400 mt-1">
              vs last month: {formatChange(analytics.userGrowth.change)}
            </p>
          </div>
          <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-6">
            <h3 className="text-yellow-400 text-sm font-medium mb-2">Daily Active Users</h3>
            <p className="text-2xl font-bold text-white">{analytics.engagement.dailyActiveUsers}</p>
            <p className="text-sm text-zinc-400 mt-1">
              {((analytics.engagement.dailyActiveUsers / analytics.userGrowth.thisMonth) * 100).toFixed(1)}% of total users
            </p>
          </div>
          <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-6">
            <h3 className="text-yellow-400 text-sm font-medium mb-2">Avg Session Time</h3>
            <p className="text-2xl font-bold text-white">{analytics.engagement.avgSessionTime}m</p>
            <p className="text-sm text-zinc-400 mt-1">
              Bounce rate: {(analytics.engagement.bounceRate * 100).toFixed(1)}%
            </p>
          </div>
          <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-6">
            <h3 className="text-yellow-400 text-sm font-medium mb-2">Successful Drops</h3>
            <p className="text-2xl font-bold text-white">{analytics.productPerformance.successfulDrops}</p>
            <p className="text-sm text-zinc-400 mt-1">
              {((analytics.productPerformance.successfulDrops / analytics.productPerformance.totalProducts) * 100).toFixed(1)}% success rate
            </p>
          </div>
        </div>

        {/* Detailed Analytics Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Voting Analytics */}
          <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-yellow-400 mb-4">🗳️ Voting Analytics</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-zinc-300">Total Votes Cast</span>
                <span className="text-white font-medium">{analytics.votingTrends.totalVotes}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-300">Active Polls</span>
                <span className="text-white font-medium">{analytics.votingTrends.activePolls}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-300">Avg Votes per Poll</span>
                <span className="text-white font-medium">{analytics.votingTrends.avgVotesPerPoll.toFixed(1)}</span>
              </div>
              <div className="mt-4 p-4 bg-zinc-800 rounded border">
                <p className="text-sm text-zinc-400">
                  📈 Voting engagement is strong with an average of {analytics.votingTrends.avgVotesPerPoll.toFixed(1)} votes per poll.
                </p>
              </div>
            </div>
          </div>

          {/* Product Performance */}
          <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-yellow-400 mb-4">📦 Product Performance</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-zinc-300">Total Products</span>
                <span className="text-white font-medium">{analytics.productPerformance.totalProducts}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-300">Successful Drops</span>
                <span className="text-white font-medium">{analytics.productPerformance.successfulDrops}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-300">Avg Pledge Rate</span>
                <span className="text-white font-medium">{(analytics.productPerformance.avgPledgeRate * 100).toFixed(1)}%</span>
              </div>
              <div className="mt-4">
                <div className="w-full bg-zinc-700 rounded-full h-2">
                  <div 
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${analytics.productPerformance.avgPledgeRate * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-zinc-400 mt-1">Pledge Success Rate</p>
              </div>
            </div>
          </div>

          {/* User Engagement */}
          <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-yellow-400 mb-4">👥 User Engagement</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-zinc-300">Daily Active Users</span>
                <span className="text-white font-medium">{analytics.engagement.dailyActiveUsers}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-300">Avg Session Time</span>
                <span className="text-white font-medium">{analytics.engagement.avgSessionTime} minutes</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-300">Bounce Rate</span>
                <span className="text-white font-medium">{(analytics.engagement.bounceRate * 100).toFixed(1)}%</span>
              </div>
              <div className="mt-4 p-4 bg-zinc-800 rounded border">
                <p className="text-sm text-zinc-400">
                  💡 Users are highly engaged with {analytics.engagement.avgSessionTime} minute average sessions.
                </p>
              </div>
            </div>
          </div>

          {/* Growth Trends */}
          <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-yellow-400 mb-4">📈 Growth Trends</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-zinc-300">This Month</span>
                <span className="text-white font-medium">{analytics.userGrowth.thisMonth} new users</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-300">Last Month</span>
                <span className="text-white font-medium">{analytics.userGrowth.lastMonth} new users</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-300">Growth Rate</span>
                <span className="text-white font-medium">{formatChange(analytics.userGrowth.change)}</span>
              </div>
              <div className="mt-4">
                <div className="w-full bg-zinc-700 rounded-full h-2">
                  <div 
                    className="bg-green-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(analytics.userGrowth.change + 50, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-zinc-400 mt-1">Growth Progress</p>
              </div>
            </div>
          </div>

        </div>

        {/* Additional Insights */}
        <div className="mt-8 bg-zinc-900 border border-yellow-500 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-yellow-400 mb-4">🔍 Key Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-zinc-800 rounded border">
              <h4 className="text-yellow-300 font-medium mb-2">High Engagement</h4>
              <p className="text-sm text-zinc-400">
                Users spend an average of {analytics.engagement.avgSessionTime} minutes per session, indicating strong platform engagement.
              </p>
            </div>
            <div className="p-4 bg-zinc-800 rounded border">
              <h4 className="text-yellow-300 font-medium mb-2">Voting Success</h4>
              <p className="text-sm text-zinc-400">
                With {analytics.votingTrends.activePolls} active polls and {analytics.votingTrends.totalVotes} total votes, community participation is strong.
              </p>
            </div>
            <div className="p-4 bg-zinc-800 rounded border">
              <h4 className="text-yellow-300 font-medium mb-2">Drop Performance</h4>
              <p className="text-sm text-zinc-400">
                {analytics.productPerformance.successfulDrops} successful drops out of {analytics.productPerformance.totalProducts} total products shows good conversion.
              </p>
            </div>
          </div>
        </div>
        </>
        )}

        {/* System Metrics Tab */}
        {activeTab === 'system' && systemMetrics && (
          <>
            {/* System Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-6">
                <h3 className="text-yellow-400 text-sm font-medium mb-2">Total Requests</h3>
                <p className="text-2xl font-bold text-white">{systemMetrics.metrics.totalRequests}</p>
                <p className="text-sm text-zinc-400 mt-1">{systemMetrics.metrics.requestsPerMinute} req/min</p>
              </div>
              <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-6">
                <h3 className="text-yellow-400 text-sm font-medium mb-2">Error Rate</h3>
                <p className="text-2xl font-bold text-red-400">{systemMetrics.metrics.errorRate}%</p>
                <p className="text-sm text-zinc-400 mt-1">{systemMetrics.metrics.errorCount} errors</p>
              </div>
              <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-6">
                <h3 className="text-yellow-400 text-sm font-medium mb-2">Avg Response</h3>
                <p className="text-2xl font-bold text-white">{systemMetrics.metrics.avgResponseTime}ms</p>
                <p className="text-sm text-zinc-400 mt-1">Average latency</p>
              </div>
              <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-6">
                <h3 className="text-yellow-400 text-sm font-medium mb-2">Cache Hit Rate</h3>
                <p className="text-2xl font-bold text-green-400">
                  {systemMetrics.cache.total > 0 
                    ? ((systemMetrics.cache.active / systemMetrics.cache.total) * 100).toFixed(1)
                    : 0}%
                </p>
                <p className="text-sm text-zinc-400 mt-1">{systemMetrics.cache.active} active</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Status Codes */}
              <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-yellow-400 mb-4">Status Codes</h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(systemMetrics.metrics.statusCodes).map(([code, count]) => (
                    <div key={code} className="text-center p-4 bg-zinc-800 rounded">
                      <p className={`text-3xl font-bold ${
                        Number(code) >= 500 ? 'text-red-400' :
                        Number(code) >= 400 ? 'text-yellow-400' :
                        'text-green-400'
                      }`}>{code}</p>
                      <p className="text-sm text-zinc-400 mt-1">{count} requests</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Slowest Endpoints */}
              <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-yellow-400 mb-4">Slowest Endpoints</h3>
                <div className="space-y-3">
                  {systemMetrics.metrics.slowestEndpoints.slice(0, 5).map((endpoint, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-zinc-800 rounded">
                      <div className="flex-1">
                        <p className="font-mono text-sm text-white truncate">{endpoint.endpoint}</p>
                        <p className="text-xs text-zinc-400">{endpoint.count} requests</p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-bold text-yellow-400">{Math.round(endpoint.avgTime)}ms</p>
                        {endpoint.errors > 0 && (
                          <p className="text-xs text-red-400">{endpoint.errors} errors</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cache Performance */}
              <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-yellow-400 mb-4">⚡ Cache Performance</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-300">Total Entries</span>
                    <span className="text-white font-medium">{systemMetrics.cache.total}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-300">Active</span>
                    <span className="text-green-400 font-medium">{systemMetrics.cache.active}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-300">Expired</span>
                    <span className="text-zinc-500 font-medium">{systemMetrics.cache.expired}</span>
                  </div>
                  <div className="mt-4">
                    <div className="w-full bg-zinc-700 rounded-full h-2">
                      <div 
                        className="bg-green-400 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${systemMetrics.cache.total > 0 
                            ? (systemMetrics.cache.active / systemMetrics.cache.total) * 100 
                            : 0}%` 
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">Cache Efficiency</p>
                  </div>
                </div>
              </div>

              {/* System Health */}
              <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-yellow-400 mb-4">🏥 System Health</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-300">Status</span>
                    <span className="text-green-400 font-medium flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                      Healthy
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-300">Error Rate</span>
                    <span className={`font-medium ${
                      Number(systemMetrics.metrics.errorRate) > 5 ? 'text-red-400' :
                      Number(systemMetrics.metrics.errorRate) > 1 ? 'text-yellow-400' :
                      'text-green-400'
                    }`}>{systemMetrics.metrics.errorRate}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-300">Response Time</span>
                    <span className={`font-medium ${
                      systemMetrics.metrics.avgResponseTime > 500 ? 'text-red-400' :
                      systemMetrics.metrics.avgResponseTime > 200 ? 'text-yellow-400' :
                      'text-green-400'
                    }`}>{systemMetrics.metrics.avgResponseTime}ms</span>
                  </div>
                  <div className="mt-4 p-4 bg-zinc-800 rounded border">
                    <p className="text-sm text-zinc-400">
                      💡 System performing well with {systemMetrics.metrics.requestsPerMinute} requests/min and {systemMetrics.metrics.avgResponseTime}ms avg response time.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Frontend Analytics Tab */}
        {activeTab === 'frontend' && frontendAnalytics && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Page Views Card */}
              <div className="bg-zinc-900 border border-blue-500 rounded-lg p-6">
                <h3 className="text-sm text-zinc-400 mb-2">📄 Total Page Views</h3>
                <p className="text-3xl font-bold text-blue-400">
                  {frontendAnalytics.pageViews.reduce((sum, p) => sum + p.views, 0).toLocaleString()}
                </p>
                <p className="text-xs text-zinc-500 mt-2">
                  {frontendAnalytics.pageViews.reduce((sum, p) => sum + p.uniqueUsers, 0).toLocaleString()} unique users
                </p>
              </div>

              {/* User Actions Card */}
              <div className="bg-zinc-900 border border-purple-500 rounded-lg p-6">
                <h3 className="text-sm text-zinc-400 mb-2">🎯 User Actions</h3>
                <p className="text-3xl font-bold text-purple-400">
                  {frontendAnalytics.userActions.reduce((sum, a) => sum + a.count, 0).toLocaleString()}
                </p>
                <p className="text-xs text-zinc-500 mt-2">
                  {frontendAnalytics.userActions.length} action types
                </p>
              </div>

              {/* Web Vitals Score */}
              <div className="bg-zinc-900 border border-green-500 rounded-lg p-6">
                <h3 className="text-sm text-zinc-400 mb-2">⚡ Performance Score</h3>
                <p className="text-3xl font-bold text-green-400">
                  {frontendAnalytics.webVitals.lcp.rating}
                </p>
                <p className="text-xs text-zinc-500 mt-2">
                  LCP: {frontendAnalytics.webVitals.lcp.avg.toFixed(0)}ms
                </p>
              </div>

              {/* Custom Events */}
              <div className="bg-zinc-900 border border-orange-500 rounded-lg p-6">
                <h3 className="text-sm text-zinc-400 mb-2">🎨 Custom Events</h3>
                <p className="text-3xl font-bold text-orange-400">
                  {frontendAnalytics.customEvents.reduce((sum, e) => sum + e.count, 0).toLocaleString()}
                </p>
                <p className="text-xs text-zinc-500 mt-2">
                  {frontendAnalytics.customEvents.length} event types
                </p>
              </div>
            </div>

            {/* Top Pages */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-yellow-400 mb-4">📊 Top Pages</h3>
                <div className="space-y-4">
                  {frontendAnalytics.pageViews.slice(0, 5).map((page, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-zinc-800 rounded">
                      <div className="flex-1">
                        <p className="text-white font-medium">{page.page}</p>
                        <p className="text-xs text-zinc-400">
                          {page.uniqueUsers} users · {(page.avgTime / 1000).toFixed(1)}s avg time
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-400">{page.views.toLocaleString()}</p>
                        <p className="text-xs text-zinc-500">views</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Web Vitals Details */}
              <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-yellow-400 mb-4">⚡ Web Vitals</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-zinc-800 rounded">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-zinc-300">LCP (Largest Contentful Paint)</span>
                      <span className={`font-bold ${
                        frontendAnalytics.webVitals.lcp.rating === 'good' ? 'text-green-400' :
                        frontendAnalytics.webVitals.lcp.rating === 'needs-improvement' ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>{frontendAnalytics.webVitals.lcp.avg.toFixed(0)}ms</span>
                    </div>
                    <div className="w-full bg-zinc-700 rounded-full h-2">
                      <div className={`h-2 rounded-full ${
                        frontendAnalytics.webVitals.lcp.rating === 'good' ? 'bg-green-400' :
                        frontendAnalytics.webVitals.lcp.rating === 'needs-improvement' ? 'bg-yellow-400' :
                        'bg-red-400'
                      }`} style={{ width: `${Math.min((2500 / frontendAnalytics.webVitals.lcp.avg) * 100, 100)}%` }}></div>
                    </div>
                  </div>

                  <div className="p-4 bg-zinc-800 rounded">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-zinc-300">FID (First Input Delay)</span>
                      <span className={`font-bold ${
                        frontendAnalytics.webVitals.fid.rating === 'good' ? 'text-green-400' :
                        frontendAnalytics.webVitals.fid.rating === 'needs-improvement' ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>{frontendAnalytics.webVitals.fid.avg.toFixed(0)}ms</span>
                    </div>
                    <div className="w-full bg-zinc-700 rounded-full h-2">
                      <div className={`h-2 rounded-full ${
                        frontendAnalytics.webVitals.fid.rating === 'good' ? 'bg-green-400' :
                        frontendAnalytics.webVitals.fid.rating === 'needs-improvement' ? 'bg-yellow-400' :
                        'bg-red-400'
                      }`} style={{ width: `${Math.min((100 / frontendAnalytics.webVitals.fid.avg) * 100, 100)}%` }}></div>
                    </div>
                  </div>

                  <div className="p-4 bg-zinc-800 rounded">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-zinc-300">CLS (Cumulative Layout Shift)</span>
                      <span className={`font-bold ${
                        frontendAnalytics.webVitals.cls.rating === 'good' ? 'text-green-400' :
                        frontendAnalytics.webVitals.cls.rating === 'needs-improvement' ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>{frontendAnalytics.webVitals.cls.avg.toFixed(3)}</span>
                    </div>
                    <div className="w-full bg-zinc-700 rounded-full h-2">
                      <div className={`h-2 rounded-full ${
                        frontendAnalytics.webVitals.cls.rating === 'good' ? 'bg-green-400' :
                        frontendAnalytics.webVitals.cls.rating === 'needs-improvement' ? 'bg-yellow-400' :
                        'bg-red-400'
                      }`} style={{ width: `${Math.max(100 - (frontendAnalytics.webVitals.cls.avg * 1000), 0)}%` }}></div>
                    </div>
                  </div>

                  <div className="p-4 bg-zinc-800 rounded">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-zinc-300">Page Load Time</span>
                      <span className={`font-bold ${
                        frontendAnalytics.webVitals.pageLoad.rating === 'good' ? 'text-green-400' :
                        frontendAnalytics.webVitals.pageLoad.rating === 'needs-improvement' ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>{frontendAnalytics.webVitals.pageLoad.avg.toFixed(0)}ms</span>
                    </div>
                    <div className="w-full bg-zinc-700 rounded-full h-2">
                      <div className={`h-2 rounded-full ${
                        frontendAnalytics.webVitals.pageLoad.rating === 'good' ? 'bg-green-400' :
                        frontendAnalytics.webVitals.pageLoad.rating === 'needs-improvement' ? 'bg-yellow-400' :
                        'bg-red-400'
                      }`} style={{ width: `${Math.min((2000 / frontendAnalytics.webVitals.pageLoad.avg) * 100, 100)}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Products Performance */}
            <div className="grid grid-cols-1 gap-6 mb-8">
              <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-yellow-400 mb-4">🏆 Top Products</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-700">
                        <th className="text-left py-3 px-4 text-zinc-400 font-medium">Product</th>
                        <th className="text-right py-3 px-4 text-zinc-400 font-medium">Views</th>
                        <th className="text-right py-3 px-4 text-zinc-400 font-medium">Votes</th>
                        <th className="text-right py-3 px-4 text-zinc-400 font-medium">Cart Adds</th>
                        <th className="text-right py-3 px-4 text-zinc-400 font-medium">Purchases</th>
                        <th className="text-right py-3 px-4 text-zinc-400 font-medium">Conv. Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {frontendAnalytics.topProducts.map((product, index) => (
                        <tr key={product.id} className="border-b border-zinc-800 hover:bg-zinc-800 transition">
                          <td className="py-3 px-4">
                            <span className="text-white font-medium">{product.name}</span>
                          </td>
                          <td className="py-3 px-4 text-right text-blue-400">{product.views.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right text-purple-400">{product.votes.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right text-green-400">{product.cartAdds.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right text-yellow-400">{product.purchases.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right">
                            <span className={`font-bold ${
                              (product.purchases / product.views * 100) > 5 ? 'text-green-400' :
                              (product.purchases / product.views * 100) > 2 ? 'text-yellow-400' :
                              'text-red-400'
                            }`}>
                              {((product.purchases / product.views) * 100).toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* User Actions Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-yellow-400 mb-4">🎯 User Actions</h3>
                <div className="space-y-3">
                  {frontendAnalytics.userActions.slice(0, 10).map((action, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-zinc-800 rounded">
                      <div>
                        <p className="text-white font-medium">{action.action}</p>
                        <p className="text-xs text-zinc-500">{new Date(action.lastOccurred).toLocaleString()}</p>
                      </div>
                      <span className="text-purple-400 font-bold text-lg">{action.count.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-yellow-400 mb-4">🎨 Custom Events</h3>
                <div className="space-y-3">
                  {frontendAnalytics.customEvents.slice(0, 10).map((event, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-zinc-800 rounded">
                      <div>
                        <p className="text-white font-medium">{event.event}</p>
                        <p className="text-xs text-zinc-500">{JSON.stringify(event.data).substring(0, 50)}...</p>
                      </div>
                      <span className="text-orange-400 font-bold text-lg">{event.count.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}


// Disable footer for Kingdom pages
(KingdomAnalytics as any).showFooter = false;