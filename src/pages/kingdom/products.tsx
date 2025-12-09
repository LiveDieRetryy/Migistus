import { useState, useEffect } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/DashboardLayout';
import { useRouter } from 'next/router';
import EnhancedProductManager from '@/components/admin/EnhancedProductManager';
import { useProducts } from '@/hooks/useProducts';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image?: string;
  images?: string[];
  category: string;
  status: 'coming-soon' | 'live' | 'ended' | 'staff-pick' | 'pending-review' | 'rejected' | 'voting';
  stage?: string;
  votes?: number;
  pledges?: number;
  featured?: boolean;
  goal?: number;
  currentAmount?: number;
  endDate?: string;
  createdAt: string;
  imageUrl?: string;
  pledgeGoal?: number;
  currentPledges?: number;
  supplier?: {
    name: string;
    id: string;
  };
  supplierName?: string;
  submittedAt?: string;
  slug?: string;
  thumbnailConfig?: any;
  customFields?: Record<string, any>;
}

interface ProductStats {
  total: number;
  voting: number;
  comingSoon: number;
  communityDrops: number;
  recentlyCompleted: number;
  staffPicks: number;
  pendingReview: number;
}

export default function KingdomProducts() {
  const router = useRouter();
  const { products, loading, refetch: refreshProducts } = useProducts({ autoRefresh: true });
  const [stats, setStats] = useState<ProductStats>({
    total: 0,
    voting: 0,
    comingSoon: 0,
    communityDrops: 0,
    recentlyCompleted: 0,
    staffPicks: 0,
    pendingReview: 0
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'manage' | 'create'>('overview');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const productsPerPage = 12;

  // Calculate stats based on lifecycle stages
  useEffect(() => {
    if (products) {
      const newStats = {
        total: products.length,
        voting: products.filter(p => (p.stage || 'voting') === 'voting').length,
        comingSoon: products.filter(p => p.stage === 'coming-soon').length,
        communityDrops: products.filter(p => p.stage === 'community-drops').length,
        recentlyCompleted: products.filter(p => p.stage === 'recently-completed').length,
        staffPicks: products.filter(p => p.featured || p.status === 'staff-pick').length,
        pendingReview: products.filter(p => p.status === 'pending-review').length
      };
      setStats(newStats);
    }
  }, [products]);

  // Subscribe to real-time updates
  useEffect(() => {
    // Real-time updates would go here if needed
  }, [refreshProducts]);

  // Filtered and paginated products
  const filteredProducts = products?.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStage = stageFilter === 'all' || (product.stage || 'voting') === stageFilter;
    return matchesSearch && matchesStage;
  }) || [];

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage
  );

  const handleSaveProduct = async (updatedProduct: any) => {
    console.log('handleSaveProduct called with:', updatedProduct);
    try {
      const isNewProduct = !updatedProduct.id || updatedProduct.id === 'new';
      const method = isNewProduct ? 'POST' : 'PUT';
      const url = isNewProduct ? '/api/products' : `/api/products/${updatedProduct.id}`;
      
      // Fetch Migistus supplier if no supplier assigned
      let supplierData = updatedProduct.supplier;
      if (!supplierData || !supplierData.name) {
        try {
          const suppliersRes = await fetch('/api/suppliers');
          if (suppliersRes.ok) {
            const suppliers = await suppliersRes.json();
            const migistusSupplier = suppliers.find((s: any) => s.name === 'Migistus' || s.companyName === 'Migistus');
            if (migistusSupplier) {
              supplierData = {
                id: migistusSupplier.id,
                name: migistusSupplier.companyName || migistusSupplier.name,
                rating: migistusSupplier.rating || 5,
                verified: migistusSupplier.status === 'active',
                location: migistusSupplier.address || 'Iowa, USA'
              };
            }
          }
        } catch (err) {
          console.error('Error fetching suppliers:', err);
        }
      }
      
      const productData = {
        ...updatedProduct,
        id: isNewProduct ? Date.now().toString() : updatedProduct.id,
        createdAt: updatedProduct.createdAt || new Date().toISOString(),
        supplier: supplierData
      };

      console.log('Making API call:', { method, url, productData });
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });

      console.log('API response:', response.status, response.ok);

      if (response.ok) {
        const responseData = await response.json();
        console.log('Save successful:', responseData);
        await refreshProducts();
        setSelectedProduct(null);
        if (isNewProduct) {
          setActiveTab('manage');
        }
      } else {
        const errorData = await response.text();
        console.error('API error response:', errorData);
      }
    } catch (error) {
      console.error('Failed to save product:', error);
    }
  };

  const handleEditProduct = (product: any) => {
    // Ensure the product has all required fields for EnhancedProductManager
    const enhancedProduct: Product = {
      ...product,
      image: product.image || product.imageUrl || '',
      votes: product.votes || 0,
      pledges: product.pledges || product.currentPledges || 0,
      featured: product.featured || false,
      createdAt: product.createdAt || new Date().toISOString()
    };
    setSelectedProduct(enhancedProduct);
    setActiveTab('manage');
  };

  const handleCreateNew = () => {
    const newProduct: Product = {
      id: 'new',
      name: '',
      description: '',
      price: 0,
      category: '',
      status: 'coming-soon',
      createdAt: new Date().toISOString(),
      image: '',
      imageUrl: '',
      pledgeGoal: 100,
      currentPledges: 0,
      votes: 0,
      pledges: 0,
      featured: false
    };
    setSelectedProduct(newProduct);
    setActiveTab('create');
  };

  const getStatusColor = (stage: string | undefined) => {
    const actualStage = stage || 'voting';
    switch (actualStage) {
      case 'voting': return 'bg-purple-500';
      case 'coming-soon': return 'bg-yellow-500';
      case 'community-drops': return 'bg-green-500';
      case 'recently-completed': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  const getStageIcon = (stage: string | undefined) => {
    const actualStage = stage || 'voting';
    switch (actualStage) {
      case 'voting': return '🗳️';
      case 'coming-soon': return '⏰';
      case 'community-drops': return '🔥';
      case 'recently-completed': return '✅';
      default: return '📦';
    }
  };

  const formatStage = (stage: string | undefined) => {
    const actualStage = stage || 'voting';
    return actualStage.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-white text-xl">Loading product management...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Head>
        <title>Product Management - The King's Domain</title>
      </Head>
      
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        {/* Premium Header */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-yellow-500/30 animate-pulse">
              <span className="text-4xl">📦</span>
            </div>
            <div>
              <h1 className="text-5xl font-black bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 bg-clip-text text-transparent mb-1">
                Product Management
              </h1>
              <p className="text-zinc-400 text-lg font-medium">Complete lifecycle control for all your products</p>
            </div>
          </div>
        </div>

        {/* Modern Tab Navigation */}
        <div className="mb-8">
          <div className="bg-zinc-900/50 backdrop-blur-xl border-2 border-zinc-800 rounded-2xl p-2 inline-flex gap-2">
            {[
              { id: 'overview', name: 'Overview', icon: '📊' },
              { id: 'manage', name: 'Manage Products', icon: '⚙️' },
              { id: 'create', name: 'Create Product', icon: '➕' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  if (tab.id === 'create') {
                    handleCreateNew();
                  } else if (tab.id === 'overview') {
                    setSelectedProduct(null);
                  }
                }}
                className={`px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black shadow-lg shadow-yellow-500/30 scale-105'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Premium Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {/* Total Products - Featured Large Card */}
              <div className="lg:col-span-1 group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
                <div className="relative bg-gradient-to-br from-zinc-800/90 to-zinc-900/90 backdrop-blur-xl border-2 border-zinc-700 hover:border-blue-500/50 rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/30 mb-4 group-hover:scale-110 transition-transform">
                      <span className="text-4xl">📦</span>
                    </div>
                    <div className="text-5xl font-black text-white mb-2">{stats.total}</div>
                    <div className="text-blue-400 text-sm font-bold uppercase tracking-wide">Total Products</div>
                    <div className="text-xs text-zinc-500 mt-1">Across all stages</div>
                  </div>
                </div>
              </div>

              {/* In Voting */}
              <div className="group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
                <div className="relative bg-gradient-to-br from-zinc-800/90 to-zinc-900/90 backdrop-blur-xl border-2 border-purple-500/30 hover:border-purple-400/60 rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:rotate-6 transition-transform">
                      <span className="text-3xl">🗳️</span>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-black text-white">{stats.voting}</div>
                    </div>
                  </div>
                  <div className="text-purple-400 text-sm font-bold uppercase tracking-wide">In Voting</div>
                  <div className="text-xs text-zinc-500 mt-1">Community decision stage</div>
                </div>
              </div>

              {/* Coming Soon */}
              <div className="group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/20 to-orange-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
                <div className="relative bg-gradient-to-br from-zinc-800/90 to-zinc-900/90 backdrop-blur-xl border-2 border-yellow-500/30 hover:border-yellow-400/60 rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-yellow-500/20">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/30 group-hover:rotate-6 transition-transform">
                      <span className="text-3xl">⏰</span>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-black text-white">{stats.comingSoon}</div>
                    </div>
                  </div>
                  <div className="text-yellow-400 text-sm font-bold uppercase tracking-wide">Coming Soon</div>
                  <div className="text-xs text-zinc-500 mt-1">Preparing for launch</div>
                </div>
              </div>

              {/* Live Now */}
              <div className="group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-green-600/20 to-emerald-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
                <div className="relative bg-gradient-to-br from-zinc-800/90 to-zinc-900/90 backdrop-blur-xl border-2 border-green-500/30 hover:border-green-400/60 rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/20">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30 group-hover:rotate-6 transition-transform">
                      <span className="text-3xl">🔥</span>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-black text-white">{stats.communityDrops}</div>
                    </div>
                  </div>
                  <div className="text-green-400 text-sm font-bold uppercase tracking-wide">Live Now</div>
                  <div className="text-xs text-zinc-500 mt-1">Active community drops</div>
                </div>
              </div>

              {/* Completed */}
              <div className="group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/20 to-blue-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
                <div className="relative bg-gradient-to-br from-zinc-800/90 to-zinc-900/90 backdrop-blur-xl border-2 border-cyan-500/30 hover:border-cyan-400/60 rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/20">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30 group-hover:rotate-6 transition-transform">
                      <span className="text-3xl">✅</span>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-black text-white">{stats.recentlyCompleted}</div>
                    </div>
                  </div>
                  <div className="text-cyan-400 text-sm font-bold uppercase tracking-wide">Completed</div>
                  <div className="text-xs text-zinc-500 mt-1">Successfully finished</div>
                </div>
              </div>
            </div>

            {/* Premium Quick Actions */}
            <div className="bg-gradient-to-br from-zinc-900/80 to-black/80 backdrop-blur-2xl border-2 border-zinc-800 rounded-3xl p-6 shadow-2xl">
              <h3 className="text-xl font-black text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">⚡</span>
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button 
                  onClick={handleCreateNew}
                  className="group relative overflow-hidden p-4 bg-gradient-to-br from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 rounded-xl font-bold transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-yellow-500/30"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative flex items-center gap-3">
                    <span className="text-3xl group-hover:scale-110 transition-transform">➕</span>
                    <div className="text-left">
                      <div className="text-black font-black">Create New Product</div>
                      <div className="text-black/70 text-xs">Add to lifecycle</div>
                    </div>
                  </div>
                </button>
                <button 
                  onClick={() => setActiveTab('manage')}
                  className="group relative overflow-hidden p-4 bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl font-bold transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/30"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative flex items-center gap-3">
                    <span className="text-3xl group-hover:scale-110 transition-transform">⚙️</span>
                    <div className="text-left">
                      <div className="text-white font-black">Manage Products</div>
                      <div className="text-white/70 text-xs">Edit & organize</div>
                    </div>
                  </div>
                </button>
                <button 
                  onClick={() => router.push('/kingdom/lifecycle')}
                  className="group relative overflow-hidden p-4 bg-gradient-to-br from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-xl font-bold transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-green-500/30"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative flex items-center gap-3">
                    <span className="text-3xl group-hover:scale-110 transition-transform">🔄</span>
                    <div className="text-left">
                      <div className="text-white font-black">Lifecycle Control</div>
                      <div className="text-white/70 text-xs">Advanced management</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Premium Recent Products */}
            <div className="bg-gradient-to-br from-zinc-900/80 to-black/80 backdrop-blur-2xl border-2 border-zinc-800 rounded-3xl p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black text-white flex items-center gap-3">
                  <span className="text-3xl">🕒</span>
                  Recent Products
                </h3>
                <button 
                  onClick={() => setActiveTab('manage')}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium transition-all text-sm"
                >
                  View All →
                </button>
              </div>
              <div className="space-y-3">
                {paginatedProducts.slice(0, 5).map((product) => (
                  <div 
                    key={product.id} 
                    className="group flex items-center justify-between p-5 bg-zinc-800/50 hover:bg-zinc-800 rounded-2xl transition-all duration-300 hover:scale-[1.02] border-2 border-transparent hover:border-zinc-700 cursor-pointer"
                    onClick={() => router.push(`/products/${product.slug || product.id}`)}
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="relative flex-shrink-0">
                        {product.imageUrl ? (
                          <div className="relative">
                            <img 
                              src={product.imageUrl} 
                              alt={product.name}
                              className="w-16 h-16 rounded-xl object-cover ring-2 ring-zinc-700 group-hover:ring-yellow-500/50 transition-all"
                            />
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center text-lg shadow-lg">
                              {getStageIcon(product.stage)}
                            </div>
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-3xl ring-2 ring-zinc-700 group-hover:ring-yellow-500/50 transition-all">
                            {getStageIcon(product.stage)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-white text-lg mb-1 truncate">{product.name || 'Unnamed Product'}</h4>
                        <div className="flex items-center gap-3 text-sm">
                          <span className={`px-3 py-1 rounded-lg text-xs font-bold ${getStatusColor(product.stage)} text-white`}>
                            {formatStage(product.stage)}
                          </span>
                          <span className="text-zinc-400">{product.category || 'Uncategorized'}</span>
                          {product.votes !== undefined && product.votes > 0 && (
                            <span className="text-purple-400 font-medium">🗳️ {product.votes}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-2xl font-black text-yellow-400">${product.price || 0}</div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/products/${product.slug || product.id}`);
                        }}
                        className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white rounded-xl text-sm font-bold transition-all hover:shadow-lg hover:shadow-green-500/30"
                      >
                        View →
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditProduct(product);
                        }}
                        className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl text-sm font-bold transition-all hover:shadow-lg hover:shadow-blue-500/30"
                      >
                        Edit →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Product Manager */}
        {(activeTab === 'manage' || activeTab === 'create') && selectedProduct && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">
                {activeTab === 'create' ? 'Create New Product' : `Edit Product: ${selectedProduct.name}`}
              </h2>
              <button
                onClick={() => {
                  setSelectedProduct(null);
                  setActiveTab('overview');
                }}
                className="px-4 py-2 bg-zinc-600 text-white rounded hover:bg-zinc-700"
              >
                Back to Overview
              </button>
            </div>
            <EnhancedProductManager
              product={{
                ...selectedProduct,
                image: selectedProduct.image || selectedProduct.imageUrl || '',
                votes: selectedProduct.votes || 0,
                pledges: selectedProduct.pledges || 0,
                featured: selectedProduct.featured || false
              }}
              onSave={handleSaveProduct as any}
              onCancel={() => {
                setSelectedProduct(null);
                setActiveTab('overview');
              }}
            />
          </div>
        )}

        {/* Manage Tab - Product List */}
        {activeTab === 'manage' && !selectedProduct && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search products by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 pl-10 bg-zinc-800/80 border-2 border-zinc-700 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all"
                />
                <span className="absolute left-3 top-3 text-zinc-400 text-xl">🔍</span>
              </div>
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="px-4 py-3 bg-zinc-800/80 border-2 border-zinc-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 font-medium transition-all"
              >
                <option value="all">All Stages</option>
                <option value="voting">🗳️ Voting</option>
                <option value="coming-soon">⏰ Coming Soon</option>
                <option value="community-drops">🔥 Live Now</option>
                <option value="recently-completed">✅ Completed</option>
              </select>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  className="px-4 py-3 bg-zinc-800/80 border-2 border-zinc-700 rounded-xl text-white hover:border-zinc-600 transition-all font-medium"
                  title={`Switch to ${viewMode === 'grid' ? 'list' : 'grid'} view`}
                >
                  {viewMode === 'grid' ? '📋' : '⊞'}
                </button>
                <button
                  onClick={handleCreateNew}
                  className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black rounded-xl font-bold transition-all shadow-lg shadow-yellow-500/30"
                >
                  ➕ Create New
                </button>
              </div>
            </div>

            {/* Products List */}
            <div className="bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 backdrop-blur-xl border-2 border-zinc-700 rounded-2xl overflow-hidden shadow-xl">
              <div className="px-6 py-4 border-b border-zinc-700/50 bg-zinc-800/50">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    📦 All Products
                    <span className="text-sm font-normal text-zinc-400">({filteredProducts.length})</span>
                  </h3>
                  <div className="text-sm text-zinc-400">
                    Page {currentPage} of {totalPages || 1}
                  </div>
                </div>
              </div>
              
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-6">
                  {paginatedProducts.map((product) => (
                    <div key={product.id} className="group bg-zinc-800/50 rounded-xl overflow-hidden border-2 border-zinc-700 hover:border-yellow-500/50 transition-all hover:shadow-lg hover:shadow-yellow-500/10">
                      <div className="relative aspect-square bg-zinc-700">
                        {product.imageUrl ? (
                          <img 
                            src={product.imageUrl} 
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-6xl">
                            {getStageIcon(product.stage)}
                          </div>
                        )}
                        <div className={`absolute top-2 left-2 px-2 py-1 rounded-lg text-xs font-bold text-white ${getStatusColor(product.stage)} backdrop-blur-sm`}>
                          {formatStage(product.stage)}
                        </div>
                      </div>
                      <div className="p-4">
                        <h4 className="font-bold text-white mb-1 truncate">{product.name || 'Unnamed Product'}</h4>
                        <p className="text-sm text-zinc-400 mb-3 line-clamp-2 h-10">{product.description || 'No description'}</p>
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-lg font-bold text-yellow-400">${product.price || 0}</div>
                          {product.votes !== undefined && (
                            <div className="text-xs text-zinc-400 flex items-center gap-1">
                              🗳️ {product.votes}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => router.push(`/products/${product.slug || product.id}`)}
                            className="flex-1 px-3 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 text-sm font-medium transition-all"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 text-sm font-medium transition-all"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="divide-y divide-zinc-700/50">
                  {paginatedProducts.map((product) => (
                    <div key={product.id} className="px-6 py-4 flex items-center justify-between hover:bg-zinc-700/30 transition-colors">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="relative flex-shrink-0">
                          {product.imageUrl ? (
                            <img 
                              src={product.imageUrl} 
                              alt={product.name}
                              className="w-20 h-20 rounded-xl object-cover border-2 border-zinc-600"
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-xl bg-zinc-700 flex items-center justify-center text-3xl border-2 border-zinc-600">
                              {getStageIcon(product.stage)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-bold text-white">{product.name || 'Unnamed Product'}</h4>
                            <span className={`px-3 py-1 rounded-lg text-xs font-bold text-white ${getStatusColor(product.stage)} whitespace-nowrap`}>
                              {getStageIcon(product.stage)} {formatStage(product.stage)}
                            </span>
                          </div>
                          <p className="text-sm text-zinc-400 mb-2 line-clamp-1">{product.description || 'No description available'}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-yellow-400 font-bold">${product.price || 0}</span>
                            <span className="text-zinc-400">{product.category || 'Uncategorized'}</span>
                            {product.votes !== undefined && (
                              <span className="text-zinc-400">🗳️ {product.votes} votes</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="ml-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 text-sm font-medium transition-all whitespace-nowrap"
                      >
                        Edit
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-zinc-400">
                  Showing {((currentPage - 1) * productsPerPage) + 1} to {Math.min(currentPage * productsPerPage, filteredProducts.length)} of {filteredProducts.length} products
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 bg-zinc-700 text-white rounded hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-zinc-400">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 bg-zinc-700 text-white rounded hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}


// Disable footer for Kingdom pages
(KingdomProducts as any).showFooter = false;