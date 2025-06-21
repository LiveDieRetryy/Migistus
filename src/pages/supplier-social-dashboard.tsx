import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  Users, 
  Heart, 
  MessageCircle, 
  Share2, 
  TrendingUp, 
  Eye, 
  Star,
  Calendar,
  BarChart3,
  Activity,
  Target,
  Award,
  Bell,
  Settings,
  ArrowLeft
} from 'lucide-react';
import { useLiveAnalytics, useLiveTracking } from '../hooks/useLiveTracking';

interface SocialMetrics {
  followers: number;
  following: number;
  posts: number;
  likes: number;
  shares: number;
  comments: number;
  engagement: number;
  reach: number;
}

interface RecentActivity {
  id: string;
  type: 'like' | 'comment' | 'share' | 'follow' | 'product_view' | 'pledge';
  user: string;
  timestamp: Date;
  content?: string;
  productName?: string;
}

interface SupplierStats {
  totalProducts: number;
  totalPledges: number;
  totalViews: number;
  totalVotes: number;
  conversionRate: number;
  avgRating: number;
}

export default function SupplierSocialDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [socialMetrics, setSocialMetrics] = useState<SocialMetrics>({
    followers: 0,
    following: 0,
    posts: 0,
    likes: 0,
    shares: 0,
    comments: 0,
    engagement: 0,
    reach: 0
  });
  const { getSupplierMetrics } = useLiveAnalytics();
  const { trackView } = useLiveTracking();
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [supplierStats, setSupplierStats] = useState<SupplierStats>({
    totalProducts: 0,
    totalPledges: 0,
    totalViews: 0,
    totalVotes: 0,
    conversionRate: 0,
    avgRating: 0
  });
  const [supplierName, setSupplierName] = useState('');
  const [supplierId, setSupplierId] = useState('');

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isSupplier = localStorage.getItem("isSupplier") === "true";
      const storedSupplierName = localStorage.getItem("supplierName") || "";
      const storedSupplierId = localStorage.getItem("supplierId") || "";
      
      if (!isSupplier) {
        router.replace("/supplier-login");
      } else {
        setSupplierName(storedSupplierName);
        setSupplierId(storedSupplierId);
        loadDashboardData(storedSupplierId, storedSupplierName);
      }
    }
  }, [router]);

  const loadDashboardData = async (supplierId: string, supplierName: string) => {
    try {
      // Load real data from the system
      const [productsRes, pledgesRes, votingRes, usersRes] = await Promise.all([
        fetch('/data/products.json'),
        fetch('/data/pledges.json'),
        fetch('/data/voting.json'),
        fetch('/data/users.json')
      ]);

      const [productsData, pledgesData, votingData, usersData] = await Promise.all([
        productsRes.json(),
        pledgesRes.json(),
        votingRes.json(),
        usersRes.json()
      ]);

      // Filter products by this supplier
      const supplierProducts = productsData.filter((product: any) => 
        product.supplier?.name === supplierName || product.supplierName === supplierName
      );

      // Calculate supplier statistics
      const totalProducts = supplierProducts.length;
      const totalPledges = supplierProducts.reduce((sum: number, product: any) => sum + (product.pledges || 0), 0);
      // Calculate real views without random data
      const totalViews = supplierProducts.reduce((sum: number, product: any) => {
        // Use actual views if available, otherwise calculate based on pledges and votes
        let views = product.views || 0;
        if (views === 0) {
          // Estimate views based on pledges and votes (realistic multiplier)
          views = (product.pledges || 0) * 3 + (product.votes || 0) * 2;
        }
        return sum + views;
      }, 0);
      const totalVotes = supplierProducts.reduce((sum: number, product: any) => sum + (product.votes || 0), 0);
      const conversionRate = totalViews > 0 ? (totalPledges / totalViews) * 100 : 0;
      const avgRating = supplierProducts.length > 0 ? 
        supplierProducts.reduce((sum: number, product: any) => sum + (product.supplier?.rating || 4.5), 0) / supplierProducts.length : 4.5;

      // Generate recent activity based on real data
      const recentActivity: RecentActivity[] = [];      // Add pledge activities
      if (Array.isArray(pledgesData)) {
        pledgesData.forEach((pledge: any) => {
          const relatedProduct = supplierProducts.find((p: any) => p.id === pledge.productId);
          if (relatedProduct) {
            recentActivity.push({
              id: `pledge-${pledge.id}`,
              type: 'pledge',
              user: pledge.userName || pledge.user || 'Anonymous',
              timestamp: new Date(pledge.timestamp || pledge.createdAt || Date.now() - 86400000), // Default to 1 day ago if no timestamp
              productName: relatedProduct.name
            });
          }
        });
      }

      // Add voting activities
      if (votingData && votingData.polls && Array.isArray(votingData.polls)) {
        votingData.polls.forEach((poll: any) => {
          const relatedProduct = supplierProducts.find((p: any) => p.name === poll.productName);
          if (relatedProduct && poll.votes && Array.isArray(poll.votes)) {
            poll.votes.forEach((vote: any) => {
              recentActivity.push({
                id: `vote-${poll.id}-${vote.id}`,
                type: 'like',
                user: vote.userName || 'Anonymous',
                timestamp: new Date(vote.timestamp || vote.createdAt || Date.now() - 3600000), // Default to 1 hour ago if no timestamp
                productName: poll.productName
              });
            });
          }
        });
      }

      // Sort by timestamp (most recent first)
      recentActivity.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Calculate social metrics
      const followers = Math.floor(totalViews * 0.1); // 10% of views become followers
      const likes = recentActivity.filter(a => a.type === 'like').length;
      const comments = recentActivity.filter(a => a.type === 'comment').length;
      const shares = recentActivity.filter(a => a.type === 'share').length;
      const posts = supplierProducts.length; // Each product is a post
      const engagement = followers > 0 ? ((likes + comments + shares) / followers) * 100 : 0;

      // Update state
      setSupplierStats({
        totalProducts,
        totalPledges,
        totalViews,
        totalVotes,
        conversionRate,
        avgRating
      });      setSocialMetrics({
        followers,
        following: Math.floor(totalViews * 0.05), // Following is 5% of total views (more realistic)
        posts,
        likes,
        shares,
        comments,
        engagement,
        reach: totalViews
      });

      setRecentActivity(recentActivity.slice(0, 20)); // Show last 20 activities

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart className="w-4 h-4 text-red-400" />;
      case 'comment': return <MessageCircle className="w-4 h-4 text-blue-400" />;
      case 'share': return <Share2 className="w-4 h-4 text-green-400" />;
      case 'follow': return <Users className="w-4 h-4 text-purple-400" />;
      case 'product_view': return <Eye className="w-4 h-4 text-yellow-400" />;
      case 'pledge': return <Target className="w-4 h-4 text-orange-400" />;
      default: return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const getActivityMessage = (activity: RecentActivity): string => {
    switch (activity.type) {
      case 'like': return `liked your product "${activity.productName}"`;
      case 'comment': return `commented on "${activity.productName}": "${activity.content}"`;
      case 'share': return `shared your product "${activity.productName}"`;
      case 'follow': return 'started following you';
      case 'product_view': return `viewed your product "${activity.productName}"`;
      case 'pledge': return `pledged for "${activity.productName}"`;
      default: return 'interacted with your content';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black flex items-center justify-center">
        <div className="text-yellow-400 text-xl">Loading social dashboard...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Social Dashboard - {supplierName} - MIGISTUS</title>
        <meta name="description" content="Manage your social presence and engage with followers" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black">
        {/* Header */}
        <div className="bg-zinc-900/50 border-b border-yellow-500/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <Link href="/supplier-dashboard" className="text-yellow-400 hover:text-yellow-300 flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Dashboard
                </Link>
                <h1 className="text-2xl font-bold text-white">Social Dashboard</h1>
              </div>
              <div className="flex items-center gap-4">
                <button className="text-zinc-400 hover:text-white">
                  <Bell className="w-5 h-5" />
                </button>
                <button className="text-zinc-400 hover:text-white">
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Social Metrics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-zinc-900/50 border border-yellow-500/20 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-sm">Followers</p>
                  <p className="text-2xl font-bold text-white">{formatNumber(socialMetrics.followers)}</p>
                </div>
                <Users className="w-8 h-8 text-yellow-400" />
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-yellow-500/20 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-sm">Total Reach</p>
                  <p className="text-2xl font-bold text-white">{formatNumber(socialMetrics.reach)}</p>
                </div>
                <Eye className="w-8 h-8 text-blue-400" />
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-yellow-500/20 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-sm">Engagement Rate</p>
                  <p className="text-2xl font-bold text-white">{socialMetrics.engagement.toFixed(1)}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-400" />
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-yellow-500/20 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-sm">Total Pledges</p>
                  <p className="text-2xl font-bold text-white">{formatNumber(supplierStats.totalPledges)}</p>
                </div>
                <Target className="w-8 h-8 text-orange-400" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Activity Feed */}
            <div className="lg:col-span-2">
              <div className="bg-zinc-900/50 border border-yellow-500/20 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-yellow-400" />
                  Recent Activity
                </h3>
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {recentActivity.length > 0 ? (
                    recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 p-3 bg-zinc-800/30 rounded-lg">
                        <div className="flex-shrink-0">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white">
                            <span className="font-medium text-yellow-400">{activity.user}</span>
                            {' '}{getActivityMessage(activity)}
                          </p>
                          <p className="text-xs text-zinc-400 mt-1">
                            {activity.timestamp.toLocaleDateString()} at {activity.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-zinc-400 text-center py-8">No recent activity</p>
                  )}
                </div>
              </div>
            </div>

            {/* Statistics Sidebar */}
            <div className="space-y-6">
              {/* Product Performance */}
              <div className="bg-zinc-900/50 border border-yellow-500/20 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-yellow-400" />
                  Product Performance
                </h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Total Products</span>
                    <span className="text-white font-medium">{supplierStats.totalProducts}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Total Views</span>
                    <span className="text-white font-medium">{formatNumber(supplierStats.totalViews)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Total Votes</span>
                    <span className="text-white font-medium">{supplierStats.totalVotes}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Conversion Rate</span>
                    <span className="text-white font-medium">{supplierStats.conversionRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Average Rating</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-white font-medium">{supplierStats.avgRating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Engagement */}
              <div className="bg-zinc-900/50 border border-yellow-500/20 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-400" />
                  Social Engagement
                </h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Total Likes</span>
                    <span className="text-white font-medium">{socialMetrics.likes}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Comments</span>
                    <span className="text-white font-medium">{socialMetrics.comments}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Shares</span>
                    <span className="text-white font-medium">{socialMetrics.shares}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Following</span>
                    <span className="text-white font-medium">{socialMetrics.following}</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-zinc-900/50 border border-yellow-500/20 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                
                <div className="space-y-3">
                  <Link
                    href={`/supplier/${supplierName.toLowerCase().replace(/\s+/g, '-')}`}
                    className="block w-full bg-yellow-600 hover:bg-yellow-700 text-black px-4 py-2 rounded-lg text-center font-medium transition"
                  >
                    View Public Profile
                  </Link>
                  <Link
                    href="/supplier-portal"
                    className="block w-full bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded-lg text-center font-medium transition"
                  >
                    Manage Products
                  </Link>
                  <Link
                    href="/supplier-settings"
                    className="block w-full bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded-lg text-center font-medium transition"
                  >
                    Profile Settings
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
