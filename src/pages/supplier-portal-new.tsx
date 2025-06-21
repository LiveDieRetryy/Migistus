import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  Eye, 
  Heart, 
  ThumbsUp, 
  ThumbsDown, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  DollarSign,
  Users,
  BarChart3,
  Plus
} from 'lucide-react';
import LiveProductEditor from '@/components/admin/LiveProductEditor';

interface ProductMetrics {
  views: number;
  pledges: number;
  votes: {
    up: number;
    down: number;
    total: number;
  };
  revenue: number;
  engagementRate: number;
  conversionRate: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  images: string[];
  supplierName: string;
  supplierId: string;
  status: 'pending-review' | 'approved' | 'rejected' | 'voting' | 'coming-soon' | 'live' | 'ended' | 'staff-pick';
  submittedAt: string;
  approvedAt?: string;
  votingStartedAt?: string;
  liveStartedAt?: string;
  endedAt?: string;
  metrics: ProductMetrics;
  pledgeGoal?: number;
  currentPledges: number;
  stage: 'submission' | 'review' | 'voting' | 'pre-launch' | 'live' | 'completed';
}

export default function SupplierPortal() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [supplierName, setSupplierName] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [showLiveEditor, setShowLiveEditor] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'analytics'>('overview');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending-review' | 'voting' | 'live' | 'ended'>('all');
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isSupplier = localStorage.getItem("isSupplier") === "true";
      const name = localStorage.getItem("supplierName") || "";
      const id = localStorage.getItem("supplierId") || "";
      
      if (!isSupplier) {
        router.replace("/supplier-login");
      } else {
        setSupplierName(name);
        setSupplierId(id);
        setLoading(false);
        loadSupplierProducts();
        
        // Set up real-time updates every 30 seconds
        const interval = setInterval(loadSupplierProducts, 30000);
        setRefreshInterval(interval);
      }
    }
    
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [router]);

  const loadSupplierProducts = async () => {
    try {
      // For now, let's use mock data since the API might not have the metrics yet
      const mockProducts: Product[] = [
        {
          id: '1',
          name: 'Smart Wireless Headphones',
          description: 'High-quality wireless headphones with noise cancellation',
          category: 'Electronics',
          price: 199.99,
          images: ['/images/headphones.jpg'],
          supplierName: supplierName,
          supplierId: supplierId,
          status: 'live',
          submittedAt: '2024-12-01T10:00:00Z',
          liveStartedAt: '2024-12-15T10:00:00Z',
          metrics: {
            views: 1250,
            pledges: 87,
            votes: { up: 342, down: 23, total: 365 },
            revenue: 17399.13,
            engagementRate: 68,
            conversionRate: 7.2
          },
          pledgeGoal: 100,
          currentPledges: 87,
          stage: 'live'
        },
        {
          id: '2', 
          name: 'Eco-Friendly Water Bottle',
          description: 'Sustainable water bottle made from recycled materials',
          category: 'Home & Garden',
          price: 29.99,
          images: ['/images/bottle.jpg'],
          supplierName: supplierName,
          supplierId: supplierId,
          status: 'voting',
          submittedAt: '2024-12-10T14:30:00Z',
          votingStartedAt: '2024-12-12T10:00:00Z',
          metrics: {
            views: 856,
            pledges: 0,
            votes: { up: 124, down: 8, total: 132 },
            revenue: 0,
            engagementRate: 45,
            conversionRate: 0
          },
          pledgeGoal: 50,
          currentPledges: 0,
          stage: 'voting'
        },
        {
          id: '3',
          name: 'Gaming Chair Pro',
          description: 'Ergonomic gaming chair with RGB lighting',
          category: 'Electronics',
          price: 449.99,
          images: ['/images/chair.jpg'],
          supplierName: supplierName,
          supplierId: supplierId,
          status: 'pending-review',
          submittedAt: '2024-12-18T09:15:00Z',
          metrics: {
            views: 0,
            pledges: 0,
            votes: { up: 0, down: 0, total: 0 },
            revenue: 0,
            engagementRate: 0,
            conversionRate: 0
          },
          pledgeGoal: 75,
          currentPledges: 0,
          stage: 'submission'
        }
      ];
      
      setProducts(mockProducts);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const handleLiveEditorSave = async (productData: any) => {
    try {
      const supplierProduct = {
        ...productData,
        status: 'pending-review',
        submittedBy: 'supplier',
        submittedAt: new Date().toISOString(),
        supplierId,
        supplier: {
          name: supplierName,
          verified: true,
          rating: 4.5,
          location: 'Unknown'
        }
      };

      const response = await fetch('/api/products/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplierProduct)
      });

      if (response.ok) {
        setShowLiveEditor(false);
        loadSupplierProducts();
        alert('Product submitted for review! You can track its progress below.');
      } else {
        alert('Failed to submit product. Please try again.');
      }
    } catch (error) {
      console.error('Failed to submit product:', error);
      alert('Failed to submit product. Please try again.');
    }
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("isSupplier");
      localStorage.removeItem("isSignedIn");
      localStorage.removeItem("supplierId");
      localStorage.removeItem("supplierName");
    }
    router.push("/supplier-login");
  };

  const getStatusInfo = (product: Product) => {
    const statusConfig = {
      'pending-review': { 
        label: 'Under Review', 
        color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
        icon: AlertCircle,
        description: 'Waiting for admin approval'
      },
      'rejected': { 
        label: 'Rejected', 
        color: 'bg-red-500/20 text-red-300 border-red-500/30',
        icon: XCircle,
        description: 'Product was rejected'
      },
      'voting': { 
        label: 'In Voting', 
        color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        icon: Users,
        description: 'Community is voting'
      },
      'coming-soon': { 
        label: 'Coming Soon', 
        color: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
        icon: Clock,
        description: 'Preparing for launch'
      },
      'live': { 
        label: 'Live Drop', 
        color: 'bg-green-500/20 text-green-300 border-green-500/30',
        icon: TrendingUp,
        description: 'Currently available for pledging'
      },
      'ended': { 
        label: 'Completed', 
        color: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
        icon: CheckCircle,
        description: 'Drop has ended'
      },
      'staff-pick': { 
        label: 'Staff Pick', 
        color: 'bg-yellow-600/20 text-yellow-300 border-yellow-600/30',
        icon: CheckCircle,
        description: 'Featured by staff'
      },
      'approved': { 
        label: 'Approved', 
        color: 'bg-green-500/20 text-green-300 border-green-500/30',
        icon: CheckCircle,
        description: 'Product approved'
      }
    };
    
    return statusConfig[product.status] || statusConfig['pending-review'];
  };

  const filteredProducts = products.filter(product => 
    statusFilter === 'all' || product.status === statusFilter
  );

  const productsByStatus = {
    total: products.length,
    'pending-review': products.filter(p => p.status === 'pending-review').length,
    'voting': products.filter(p => p.status === 'voting').length,
    'live': products.filter(p => p.status === 'live').length,
    'ended': products.filter(p => p.status === 'ended').length,
  };

  const totalMetrics = products.reduce((acc, product) => ({
    views: acc.views + product.metrics.views,
    pledges: acc.pledges + product.metrics.pledges,
    votes: acc.votes + product.metrics.votes.total,
    revenue: acc.revenue + product.metrics.revenue
  }), { views: 0, pledges: 0, votes: 0, revenue: 0 });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black flex items-center justify-center">
        <div className="text-yellow-400 text-xl">Loading supplier portal...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Supplier Portal - MIGISTUS</title>
      </Head>

      {/* Live Product Editor Modal */}
      {showLiveEditor && (
        <div className="fixed inset-0 z-50 bg-black">
          <LiveProductEditor
            isEditing={false}
            onSave={handleLiveEditorSave}
            onCancel={() => setShowLiveEditor(false)}
          />
        </div>
      )}

      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black">
        {/* Header */}
        <header className="bg-zinc-900/50 border-b border-yellow-500/20 p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-300 bg-clip-text text-transparent">
                MIGISTUS Supplier Portal
              </h1>
              <span className="text-gray-400">|</span>
              <span className="text-white">{supplierName}</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/supplier-dashboard" className="text-yellow-400 hover:text-yellow-300 transition-colors">
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto p-6">
          {/* Tabs Navigation */}
          <div className="mb-8">
            <div className="border-b border-gray-700">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: 'overview', label: 'Overview', icon: BarChart3 },
                  { id: 'products', label: 'My Products', icon: Users },
                  { id: 'analytics', label: 'Analytics', icon: TrendingUp }
                ].map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                        activeTab === tab.id
                          ? 'border-yellow-500 text-yellow-400'
                          : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                      }`}
                    >
                      <Icon size={16} />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-zinc-900/50 border border-yellow-500/20 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-yellow-400 mb-2">Total Products</h3>
                      <div className="text-3xl font-bold text-white">{productsByStatus.total}</div>
                    </div>
                    <Users className="text-yellow-400" size={32} />
                  </div>
                </div>
                
                <div className="bg-zinc-900/50 border border-blue-500/20 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-blue-400 mb-2">Total Views</h3>
                      <div className="text-3xl font-bold text-white">{totalMetrics.views.toLocaleString()}</div>
                    </div>
                    <Eye className="text-blue-400" size={32} />
                  </div>
                </div>
                
                <div className="bg-zinc-900/50 border border-green-500/20 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-green-400 mb-2">Total Pledges</h3>
                      <div className="text-3xl font-bold text-white">{totalMetrics.pledges.toLocaleString()}</div>
                    </div>
                    <Heart className="text-green-400" size={32} />
                  </div>
                </div>
                
                <div className="bg-zinc-900/50 border border-purple-500/20 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-purple-400 mb-2">Revenue</h3>
                      <div className="text-3xl font-bold text-white">${totalMetrics.revenue.toLocaleString()}</div>
                    </div>
                    <DollarSign className="text-purple-400" size={32} />
                  </div>
                </div>
              </div>

              {/* Status Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-zinc-900/50 border border-yellow-500/20 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-yellow-400 mb-4">Product Status Breakdown</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Under Review</span>
                      <span className="text-yellow-400">{productsByStatus['pending-review']}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">In Voting</span>
                      <span className="text-blue-400">{productsByStatus.voting}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Live Drops</span>
                      <span className="text-green-400">{productsByStatus.live}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Completed</span>
                      <span className="text-gray-400">{productsByStatus.ended}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-900/50 border border-yellow-500/20 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-yellow-400 mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => setShowLiveEditor(true)}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-bold rounded-lg transition-all transform hover:scale-105"
                    >
                      <Plus size={20} />
                      Submit New Product
                    </button>
                    <button
                      onClick={() => setActiveTab('products')}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
                    >
                      <Eye size={20} />
                      View All Products
                    </button>
                    <button
                      onClick={() => setActiveTab('analytics')}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
                    >
                      <BarChart3 size={20} />
                      View Analytics
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              {/* Header with Filters */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">My Products</h2>
                  <p className="text-gray-400">Track the performance and status of all your submitted products</p>
                </div>
                <button
                  onClick={() => setShowLiveEditor(true)}
                  className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-bold rounded-lg transition-all transform hover:scale-105 flex items-center gap-2"
                >
                  <Plus size={20} />
                  New Product
                </button>
              </div>

              {/* Status Filter */}
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'all', label: 'All Products' },
                  { id: 'pending-review', label: 'Under Review' },
                  { id: 'voting', label: 'In Voting' },
                  { id: 'live', label: 'Live Drops' },
                  { id: 'ended', label: 'Completed' }
                ].map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => setStatusFilter(filter.id as any)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      statusFilter === filter.id
                        ? 'bg-yellow-500 text-black'
                        : 'bg-zinc-800 text-gray-300 hover:bg-zinc-700'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {/* Products List */}
              {filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <Users size={48} className="mx-auto mb-4" />
                    {statusFilter === 'all' ? 'No products submitted yet' : `No products in ${statusFilter} status`}
                  </div>
                  <button
                    onClick={() => setShowLiveEditor(true)}
                    className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-bold rounded-lg transition-all"
                  >
                    Submit Your First Product
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredProducts.map(product => {
                    const statusInfo = getStatusInfo(product);
                    const StatusIcon = statusInfo.icon;
                    
                    return (
                      <div key={product.id} className="bg-zinc-900/50 border border-zinc-700 rounded-lg p-6 hover:border-yellow-500/30 transition-colors">
                        <div className="flex items-start gap-6">
                          {/* Product Image */}
                          <div className="w-24 h-24 bg-zinc-800 rounded-lg overflow-hidden flex-shrink-0">
                            {product.images?.[0] ? (
                              <img 
                                src={product.images[0]} 
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-500">
                                <Users size={32} />
                              </div>
                            )}
                          </div>

                          {/* Product Info */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="text-xl font-semibold text-white mb-1">{product.name}</h3>
                                <p className="text-gray-400 text-sm">{product.category} • ${product.price}</p>
                              </div>
                              <div className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-2 ${statusInfo.color}`}>
                                <StatusIcon size={14} />
                                {statusInfo.label}
                              </div>
                            </div>

                            <p className="text-gray-300 text-sm mb-4 line-clamp-2">{product.description}</p>

                            {/* Live Metrics */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                              <div className="text-center">
                                <div className="text-lg font-bold text-blue-400">{product.metrics.views.toLocaleString()}</div>
                                <div className="text-xs text-gray-400">Views</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-bold text-green-400">{product.metrics.pledges.toLocaleString()}</div>
                                <div className="text-xs text-gray-400">Pledges</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-bold text-purple-400">{product.metrics.votes.total.toLocaleString()}</div>
                                <div className="text-xs text-gray-400">Votes</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-bold text-yellow-400">${product.metrics.revenue.toLocaleString()}</div>
                                <div className="text-xs text-gray-400">Revenue</div>
                              </div>
                            </div>

                            {/* Detailed Metrics for Live Products */}
                            {product.status === 'live' && (
                              <div className="bg-zinc-800/50 rounded-lg p-4">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm text-gray-300">Pledge Progress</span>
                                  <span className="text-sm text-gray-300">
                                    {product.currentPledges} / {product.pledgeGoal || 100}
                                  </span>
                                </div>
                                <div className="w-full bg-zinc-700 rounded-full h-2">
                                  <div 
                                    className="bg-gradient-to-r from-yellow-500 to-yellow-600 h-2 rounded-full transition-all"
                                    style={{ width: `${Math.min((product.currentPledges / (product.pledgeGoal || 100)) * 100, 100)}%` }}
                                  />
                                </div>
                              </div>
                            )}

                            {/* Voting Metrics */}
                            {product.status === 'voting' && (
                              <div className="bg-zinc-800/50 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1">
                                      <ThumbsUp size={16} className="text-green-400" />
                                      <span className="text-green-400 font-medium">{product.metrics.votes.up}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <ThumbsDown size={16} className="text-red-400" />
                                      <span className="text-red-400 font-medium">{product.metrics.votes.down}</span>
                                    </div>
                                  </div>
                                  <div className="text-sm text-gray-400">
                                    {product.metrics.votes.total} total votes
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="text-xs text-gray-500 mt-3">
                              Submitted: {new Date(product.submittedAt).toLocaleDateString()}
                              {statusInfo.description && (
                                <span className="ml-4">• {statusInfo.description}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h2>
                <p className="text-gray-400">Detailed performance metrics for all your products</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-zinc-900/50 border border-yellow-500/20 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-yellow-400 mb-4">Performance Overview</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-zinc-700">
                      <span className="text-gray-300">Average Views per Product</span>
                      <span className="text-white font-medium">
                        {products.length > 0 ? Math.round(totalMetrics.views / products.length).toLocaleString() : 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-zinc-700">
                      <span className="text-gray-300">Average Pledges per Product</span>
                      <span className="text-white font-medium">
                        {products.length > 0 ? Math.round(totalMetrics.pledges / products.length).toLocaleString() : 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-zinc-700">
                      <span className="text-gray-300">Average Revenue per Product</span>
                      <span className="text-white font-medium">
                        ${products.length > 0 ? Math.round(totalMetrics.revenue / products.length).toLocaleString() : 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-300">Success Rate</span>
                      <span className="text-white font-medium">
                        {products.length > 0 ? 
                          Math.round((productsByStatus.live + productsByStatus.ended) / products.length * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-900/50 border border-yellow-500/20 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-yellow-400 mb-4">Top Performing Products</h3>
                  <div className="space-y-3">
                    {products
                      .sort((a, b) => b.metrics.views - a.metrics.views)
                      .slice(0, 5)
                      .map((product, index) => (
                        <div key={product.id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-black font-bold text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <h4 className="font-medium text-white text-sm">{product.name}</h4>
                              <p className="text-xs text-gray-400">{product.metrics.views.toLocaleString()} views</p>
                            </div>
                          </div>
                          <div className="text-sm text-gray-400">
                            ${product.metrics.revenue.toLocaleString()}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
