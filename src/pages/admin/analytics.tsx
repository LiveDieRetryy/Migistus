import { useState, useEffect } from 'react';
import Head from 'next/head';
import MainNavbar from '@/components/nav/MainNavbar';
import { useAuth } from '@/context/AuthContext';

export default function AdminAnalyticsPage() {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || user?.email !== 'admin@migistus.com') return;
    setLoading(false);
  }, [isAuthenticated, user]);

  if (!isAuthenticated || user?.email !== 'admin@migistus.com') {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <MainNavbar />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 text-center">
            <h1 className="text-2xl font-bold text-red-400 mb-2">Access Denied</h1>
            <p className="text-gray-300">You need admin privileges to access analytics.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Head>
        <title>Analytics Dashboard - Kings Domain | Migistus</title>
        <meta name="description" content="Admin analytics and reporting" />
      </Head>

      <MainNavbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-teal-400 mb-2 flex items-center gap-3">
            <span>📊</span> Analytics Dashboard
          </h1>
          <p className="text-gray-400">Deep insights into your kingdom's performance</p>
        </div>

        <div className="bg-teal-900/20 border border-teal-500/30 rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">📈</div>
          <h2 className="text-2xl font-bold text-teal-400 mb-4">Advanced Analytics Coming Soon</h2>
          <p className="text-gray-300 mb-6">
            Comprehensive analytics and reporting dashboard will include:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-2xl mb-2">👥</div>
              <h3 className="font-semibold text-white mb-2">User Analytics</h3>
              <p className="text-sm text-gray-400">Registration trends, activity patterns, engagement metrics</p>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-2xl mb-2">💰</div>
              <h3 className="font-semibold text-white mb-2">Revenue Analytics</h3>
              <p className="text-sm text-gray-400">Pledge trends, conversion rates, revenue forecasting</p>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-2xl mb-2">📦</div>
              <h3 className="font-semibold text-white mb-2">Product Performance</h3>
              <p className="text-sm text-gray-400">Product success rates, category analysis, drop performance</p>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-2xl mb-2">🗳️</div>
              <h3 className="font-semibold text-white mb-2">Voting Analytics</h3>
              <p className="text-sm text-gray-400">Vote patterns, user participation, poll effectiveness</p>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-2xl mb-2">📧</div>
              <h3 className="font-semibold text-white mb-2">Marketing Metrics</h3>
              <p className="text-sm text-gray-400">Email campaign performance, opt-in rates, engagement</p>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-2xl mb-2">🔥</div>
              <h3 className="font-semibold text-white mb-2">Real-time Monitoring</h3>
              <p className="text-sm text-gray-400">Live user activity, drop monitoring, system health</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
