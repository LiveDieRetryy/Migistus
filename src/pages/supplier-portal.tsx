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
  endedAt?: string;  metrics: ProductMetrics;
  pledgeGoal?: number;
  currentPledges: number;
  pledges?: number;
  votes?: number;
  views?: number;
  shares?: number;
  likes?: number;
  stage: 'submission' | 'review' | 'voting' | 'pre-launch' | 'live' | 'completed';votingStats?: {
    upvotes: number;
    downvotes: number;
    totalVotes: number;
    threshold?: number;
  };
}

export default function SupplierPortal() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [supplierName, setSupplierName] = useState('');
  const [supplierId, setSupplierId] = useState('');  const [products, setProducts] = useState<Product[]>([]);
  const [showLiveEditor, setShowLiveEditor] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'analytics'>('overview');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending-review' | 'voting' | 'live' | 'ended'>('all');
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductPreview, setShowProductPreview] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'Electronics',
    price: '',
    imageUrl: '',
    description: ''
  });
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
      // Load all products and filter by supplier
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        const allProducts = data.products || [];
        
        // Filter products by this supplier
        const supplierProducts = allProducts.filter((product: any) => 
          product.submittedBy === 'supplier' || 
          product.supplier?.name === supplierName ||
          product.supplierId === supplierId ||
          (product.status === 'pending-review' && supplierName) // Include pending products for demo
        );
          // Add simulated metrics for demonstration
        const productsWithMetrics = supplierProducts.map((product: any) => {
          const votes = Math.floor(Math.random() * 200);
          const upvotes = Math.floor(votes * 0.7);
          const downvotes = votes - upvotes;
          
          return {
            ...product,
            pledges: product.pledges || Math.floor(Math.random() * 100),
            pledgeGoal: product.pledgeGoal || Math.floor(Math.random() * 500) + 100,
            votes: product.votes || votes,
            votingStats: {
              totalVotes: votes,
              threshold: 150,
              upvotes,
              downvotes
            },
            views: product.views || Math.floor(Math.random() * 1000) + 100,
            shares: product.shares || Math.floor(Math.random() * 50),
            likes: product.likes || Math.floor(Math.random() * 200),
            // Ensure metrics object exists with proper structure
            metrics: product.metrics || {
              views: Math.floor(Math.random() * 1000) + 100,
              pledges: Math.floor(Math.random() * 100),
              votes: {
                up: upvotes,
                down: downvotes,
                total: votes
              },
              revenue: Math.floor(Math.random() * 10000),
              engagementRate: Math.random() * 20,
              conversionRate: Math.random() * 15
            },
            // Ensure required fields
            images: product.images || ['/images/placeholder.png'],
            supplierName: product.supplierName || supplierName || 'Unknown Supplier',
            supplierId: product.supplierId || supplierId || 'unknown',
            currentPledges: product.currentPledges || product.pledges || 0,
            stage: product.stage || 'submission'
          };
        });
        
        setProducts(productsWithMetrics);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
      // Add demo products if API fails
      setProducts([        {
          id: '1',
          name: 'Wireless Gaming Headset',
          description: 'High-quality wireless gaming headset with noise cancellation',
          status: 'live' as const,
          category: 'Electronics',
          price: 99.99,
          images: ['/images/headset.jpg'],
          supplierName: supplierName || 'Demo Supplier',
          supplierId: supplierId || 'demo-supplier-1',
          stage: 'live' as const,
          pledges: 45,
          pledgeGoal: 100,
          currentPledges: 45,
          votes: 120,
          votingStats: { totalVotes: 120, threshold: 150, upvotes: 95, downvotes: 25 },
          views: 450,
          shares: 12,
          likes: 67,
          submittedAt: new Date().toISOString(),          metrics: {
            views: 450,
            pledges: 45,
            votes: { up: 95, down: 25, total: 120 },
            revenue: 4495.55,
            engagementRate: 15.2,
            conversionRate: 10.0
          }
        },
        {
          id: '2', 
          name: 'Smart Fitness Tracker',
          description: 'Advanced fitness tracker with heart rate monitoring',
          status: 'pending-review' as const,
          category: 'Electronics',
          price: 79.99,
          images: ['/images/tracker.jpg'],
          supplierName: supplierName || 'Demo Supplier',
          supplierId: supplierId || 'demo-supplier-1',
          stage: 'review' as const,
          pledges: 0,
          pledgeGoal: 200,
          currentPledges: 0,
          votes: 0,
          votingStats: { totalVotes: 0, threshold: 150, upvotes: 0, downvotes: 0 },
          views: 23,
          shares: 0,
          likes: 5,
          submittedAt: new Date().toISOString(),          metrics: {
            views: 23,
            pledges: 0,
            votes: { up: 0, down: 0, total: 0 },
            revenue: 0,
            engagementRate: 2.1,
            conversionRate: 0
          }
        }
      ]);
    }
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setShowProductPreview(true);
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
      localStorage.removeItem("userSession");
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
      'approved': { 
        label: 'Approved', 
        color: 'bg-green-500/20 text-green-300 border-green-500/30',
        icon: CheckCircle,
        description: 'Approved by admin'
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
    views: acc.views + (product.metrics?.views || 0),
    pledges: acc.pledges + (product.metrics?.pledges || 0),
    votes: acc.votes + (product.metrics?.votes?.total || 0),
    revenue: acc.revenue + (product.metrics?.revenue || 0)
  }), { views: 0, pledges: 0, votes: 0, revenue: 0 });

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/products/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newProduct,
          price: parseFloat(newProduct.price),
          supplierName,
          supplierId,
          status: 'pending-review',
          submittedAt: new Date().toISOString(),
          images: newProduct.imageUrl ? [newProduct.imageUrl] : [],
          metrics: {
            views: 0,
            pledges: 0,
            votes: { up: 0, down: 0, total: 0 },
            revenue: 0,
            engagementRate: 0,
            conversionRate: 0
          },
          currentPledges: 0,
          stage: 'submission'
        })
      });

      if (response.ok) {
        setShowAddForm(false);
        setNewProduct({
          name: '',
          category: 'Electronics',
          price: '',
          imageUrl: '',
          description: ''
        });
        loadSupplierProducts();
        alert('Product submitted for review!');
      }
    } catch (error) {
      console.error('Failed to submit product:', error);
      alert('Failed to submit product');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = getStatusInfo({ status } as Product);
    return statusInfo.color;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black flex items-center justify-center">
        <div className="text-yellow-400 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Supplier Portal - MIGISTUS</title>
      </Head>

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
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Product Management</h2>
              <p className="text-gray-400">Add products to the MIGISTUS voting system and track their performance</p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-bold rounded-lg transition-all transform hover:scale-105"
            >
              Add New Product
            </button>
          </div>

          {/* Add Product Modal */}
          {showAddForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-zinc-900 border border-yellow-500/20 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <h3 className="text-2xl font-bold text-yellow-400 mb-6">Add Product to Voting</h3>
                <form onSubmit={handleAddProduct} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Product Name *</label>
                      <input
                        type="text"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 bg-zinc-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500"
                        required
                        placeholder="Enter product name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Category *</label>
                      <select
                        value={newProduct.category}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-3 py-2 bg-zinc-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500"
                        required
                      >
                        <option value="">Select category...</option>
                        <option value="Electronics">Electronics</option>
                        <option value="Home & Garden">Home & Garden</option>
                        <option value="Sports & Outdoors">Sports & Outdoors</option>
                        <option value="Beauty & Personal Care">Beauty & Personal Care</option>
                        <option value="Automotive">Automotive</option>
                        <option value="Toys & Games">Toys & Games</option>
                        <option value="Fashion">Fashion</option>
                        <option value="Health & Wellness">Health & Wellness</option>
                        <option value="Food & Beverages">Food & Beverages</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Price (USD) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
                      className="w-full px-3 py-2 bg-zinc-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500"
                      required
                      placeholder="29.99"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Product Image URL</label>
                    <input
                      type="url"
                      value={newProduct.imageUrl}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, imageUrl: e.target.value }))}
                      className="w-full px-3 py-2 bg-zinc-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500"
                      placeholder="https://example.com/product-image.jpg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Description *</label>
                    <textarea
                      value={newProduct.description}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 bg-zinc-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500"
                      rows={4}
                      required
                      placeholder="Describe your product, its features, and benefits..."
                    />
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <h4 className="text-blue-400 font-semibold mb-2">📝 Voting Process</h4>
                    <p className="text-gray-300 text-sm">
                      Your product will be reviewed by our team before being added to the community voting system. 
                      Once approved, MIGISTUS users will vote on whether they want this product available for group buying.
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-medium rounded-lg hover:from-yellow-400 hover:to-yellow-500 transition-all"
                    >
                      Submit for Voting
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="flex-1 px-4 py-2 bg-zinc-700 text-white font-medium rounded-lg hover:bg-zinc-600 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Products List */}
          <div className="bg-zinc-900/50 border border-yellow-500/20 rounded-lg">
            <div className="p-6 border-b border-gray-800">
              <h3 className="text-xl font-bold text-white">Your Products</h3>
            </div>
            <div className="p-6">
              {products.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-black font-bold text-2xl">📦</span>
                  </div>
                  <p className="text-gray-400 mb-4">No products added yet.</p>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-medium rounded-lg hover:from-yellow-400 hover:to-yellow-500 transition-all"
                  >
                    Add Your First Product
                  </button>
                </div>
              ) : (                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <div key={product.id} className="bg-zinc-800/50 border border-gray-700 rounded-lg p-4 hover:border-yellow-500/50 transition-colors">
                      {product.images && product.images[0] && (
                        <div className="aspect-video bg-zinc-700 rounded-lg mb-4 overflow-hidden">
                          <img 
                            src={product.images[0]} 
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-lg font-medium text-white">{product.name}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full border ${getStatusBadge(product.status)}`}>
                          {product.status}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mb-2">{product.category}</p>
                      <p className="text-yellow-400 font-bold mb-2">${product.price}</p>
                      <p className="text-gray-300 text-sm mb-3 line-clamp-2">{product.description}</p>
                      
                      {product.votingStats && (
                        <div className="bg-zinc-700/50 rounded-lg p-3 mb-3">
                          <h5 className="text-white font-medium mb-2">Voting Results:</h5>
                          <div className="flex justify-between text-sm">
                            <span className="text-green-400">👍 {product.votingStats.upvotes}</span>
                            <span className="text-red-400">👎 {product.votingStats.downvotes}</span>
                            <span className="text-gray-400">Total: {product.votingStats.totalVotes}</span>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mt-3">
                        <p className="text-gray-500 text-xs">
                          Submitted: {new Date(product.submittedAt).toLocaleDateString()}
                        </p>
                        <button
                          onClick={() => handleProductClick(product)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors flex items-center gap-1"
                        >
                          <Eye size={14} />
                          Preview
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-8 bg-zinc-900/50 border border-blue-500/20 rounded-lg p-6">
            <h3 className="text-xl font-bold text-blue-400 mb-4">📊 How Product Voting Works</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-black font-bold">1</span>
                </div>
                <h4 className="text-white font-semibold mb-2">Submit Product</h4>
                <p className="text-gray-400 text-sm">Add your product details and submit for review by our team.</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold">2</span>
                </div>
                <h4 className="text-white font-semibold mb-2">Community Voting</h4>
                <p className="text-gray-400 text-sm">Approved products go to community voting where users decide if they want it.</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold">3</span>
                </div>
                <h4 className="text-white font-semibold mb-2">Group Buying</h4>
                <p className="text-gray-400 text-sm">Popular products become available for group buying with volume discounts.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Preview Modal */}
      {showProductPreview && selectedProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-yellow-500/30 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-zinc-900 border-b border-gray-700 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-yellow-400">Product Page Preview</h2>
              <button
                onClick={() => setShowProductPreview(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            {/* Product Page Mockup */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Product Images */}
                <div>
                  <div className="aspect-square bg-zinc-800 rounded-lg mb-4 overflow-hidden">
                    {selectedProduct.images && selectedProduct.images[0] ? (
                      <img 
                        src={selectedProduct.images[0]} 
                        alt={selectedProduct.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No Image
                      </div>
                    )}
                  </div>
                  
                  {/* Additional Images */}
                  <div className="grid grid-cols-4 gap-2">
                    {selectedProduct.images?.slice(1, 5).map((image, index) => (
                      <div key={index} className="aspect-square bg-zinc-800 rounded overflow-hidden">
                        <img src={image} alt={`${selectedProduct.name} ${index + 2}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Product Info */}
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">{selectedProduct.name}</h1>
                  <p className="text-gray-400 mb-4">{selectedProduct.category}</p>
                  
                  <div className="flex items-center gap-4 mb-6">
                    <span className="text-3xl font-bold text-yellow-400">${selectedProduct.price}</span>
                    <span className={`px-3 py-1 rounded-full text-sm ${getStatusBadge(selectedProduct.status)}`}>
                      {selectedProduct.status}
                    </span>
                  </div>
                  
                  <div className="bg-zinc-800/50 rounded-lg p-4 mb-6">
                    <h3 className="text-white font-medium mb-3">Live Metrics</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-400 text-sm">Views</p>
                        <p className="text-white font-bold">{selectedProduct.views || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Pledges</p>
                        <p className="text-white font-bold">{selectedProduct.pledges || 0} / {selectedProduct.pledgeGoal || 100}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Likes</p>
                        <p className="text-white font-bold">{selectedProduct.likes || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Shares</p>
                        <p className="text-white font-bold">{selectedProduct.shares || 0}</p>
                      </div>
                    </div>
                  </div>
                  
                  {selectedProduct.votingStats && (
                    <div className="bg-zinc-800/50 rounded-lg p-4 mb-6">
                      <h3 className="text-white font-medium mb-3">Community Voting</h3>
                      <div className="flex justify-between mb-2">
                        <span className="text-green-400">👍 {selectedProduct.votingStats.upvotes}</span>
                        <span className="text-red-400">👎 {selectedProduct.votingStats.downvotes}</span>
                      </div>
                      <div className="w-full bg-zinc-700 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ 
                            width: `${(selectedProduct.votingStats.upvotes / (selectedProduct.votingStats.upvotes + selectedProduct.votingStats.downvotes)) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  <div className="mb-6">
                    <h3 className="text-white font-medium mb-3">Description</h3>
                    <div 
                      className="text-gray-300"
                      dangerouslySetInnerHTML={{ __html: selectedProduct.description }}
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <button className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-black font-medium py-3 px-6 rounded-lg transition-colors">
                      {selectedProduct.status === 'live' ? 'Pledge Now' : 'Vote for This Product'}
                    </button>
                    <button className="p-3 border border-gray-600 hover:border-gray-500 text-gray-300 rounded-lg transition-colors">
                      <Heart size={20} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
