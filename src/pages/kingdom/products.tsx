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
  comingSoon: number;
  live: number;
  staffPicks: number;
  ended: number;
  pendingReview: number;
  approved: number;
  rejected: number;
}

export default function KingdomProducts() {
  const router = useRouter();
  const { products, loading, refetch: refreshProducts } = useProducts({ autoRefresh: true });
  const [stats, setStats] = useState<ProductStats>({
    total: 0,
    comingSoon: 0,
    live: 0,
    staffPicks: 0,
    ended: 0,
    pendingReview: 0,
    approved: 0,
    rejected: 0
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'manage' | 'create'>('overview');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const productsPerPage = 10;

  // Calculate stats
  useEffect(() => {
    if (products) {
      const newStats = {
        total: products.length,
        comingSoon: products.filter(p => p.status === 'coming-soon').length,
        live: products.filter(p => p.status === 'live').length,
        staffPicks: products.filter(p => p.status === 'staff-pick').length,
        ended: products.filter(p => p.status === 'ended').length,
        pendingReview: products.filter(p => p.status === 'pending-review').length,
        approved: products.filter(p => ['coming-soon', 'live', 'staff-pick', 'ended'].includes(p.status)).length,
        rejected: products.filter(p => p.status === 'rejected').length
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
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    return matchesSearch && matchesStatus;
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
      
      const productData = {
        ...updatedProduct,
        id: isNewProduct ? Date.now().toString() : updatedProduct.id,
        createdAt: updatedProduct.createdAt || new Date().toISOString(),
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

  const getStatusColor = (status: string | undefined) => {
    if (!status) return 'bg-gray-500';
    switch (status) {
      case 'live': return 'bg-green-500';
      case 'coming-soon': return 'bg-yellow-500';
      case 'ended': return 'bg-gray-500';
      case 'staff-pick': return 'bg-purple-500';
      case 'pending-review': return 'bg-blue-500';
      case 'rejected': return 'bg-red-500';
      case 'voting': return 'bg-indigo-500';
      default: return 'bg-gray-500';
    }
  };

  const formatStatus = (status: string | undefined) => {
    if (!status) return 'Unknown';
    return status.split('-').map(word => 
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
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#FFD700] mb-2">Product Management</h1>
          <p className="text-zinc-400">Comprehensive product management with enhanced editing capabilities</p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-zinc-700">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', name: 'Overview' },
                { id: 'manage', name: 'Manage Products' },
                { id: 'create', name: 'Create Product' }
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
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-[#FFD700] text-[#FFD700]'
                      : 'border-transparent text-zinc-400 hover:text-zinc-300 hover:border-zinc-300'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-zinc-800 rounded-lg p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-bold text-sm">Total</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-zinc-400 truncate">
                        Total Products
                      </dt>
                      <dd className="text-lg font-medium text-white">
                        {stats.total}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-800 rounded-lg p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-bold text-sm">Live</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-zinc-400 truncate">
                        Live Products
                      </dt>
                      <dd className="text-lg font-medium text-white">
                        {stats.live}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-800 rounded-lg p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-bold text-sm">Soon</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-zinc-400 truncate">
                        Coming Soon
                      </dt>
                      <dd className="text-lg font-medium text-white">
                        {stats.comingSoon}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-800 rounded-lg p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-bold text-sm">Pick</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-zinc-400 truncate">
                        Staff Picks
                      </dt>
                      <dd className="text-lg font-medium text-white">
                        {stats.staffPicks}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-zinc-800 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button 
                  onClick={handleCreateNew}
                  className="p-4 bg-[#FFD700] text-black rounded-lg font-medium hover:bg-yellow-600 transition-colors"
                >
                  Create New Product
                </button>
                <button 
                  onClick={() => setActiveTab('manage')}
                  className="p-4 bg-zinc-700 text-white rounded-lg font-medium hover:bg-zinc-600 transition-colors"
                >
                  Manage Existing Products
                </button>
                <button className="p-4 bg-zinc-700 text-white rounded-lg font-medium hover:bg-zinc-600 transition-colors">
                  Bulk Operations
                </button>
              </div>
            </div>

            {/* Recent Products */}
            <div className="bg-zinc-800 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">Recent Products</h3>
              <div className="space-y-4">
                {paginatedProducts.slice(0, 5).map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-4 bg-zinc-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {product.imageUrl && (
                        <img 
                          src={product.imageUrl} 
                          alt={product.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <h4 className="font-medium text-white">{product.name || 'Unnamed Product'}</h4>
                        <p className="text-sm text-zinc-400">{product.category || 'Uncategorized'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(product.status)}`}>
                        {formatStatus(product.status)}
                      </span>
                      <span className="text-sm text-zinc-400">${product.price || 0}</span>
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                      >
                        Edit
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
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-md text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="coming-soon">Coming Soon</option>
                <option value="live">Live</option>
                <option value="ended">Ended</option>
                <option value="staff-pick">Staff Pick</option>
                <option value="pending-review">Pending Review</option>
                <option value="rejected">Rejected</option>
                <option value="voting">Voting</option>
              </select>
              <button
                onClick={handleCreateNew}
                className="px-4 py-2 bg-[#FFD700] text-black rounded hover:bg-yellow-600 font-medium"
              >
                Create New
              </button>
            </div>

            {/* Products List */}
            <div className="bg-zinc-800 rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-700">
                <h3 className="text-lg font-medium text-white">All Products</h3>
              </div>
              <div className="divide-y divide-zinc-700">
                {paginatedProducts.map((product) => (
                  <div key={product.id} className="px-6 py-4 flex items-center justify-between hover:bg-zinc-700 transition-colors">
                    <div className="flex items-center space-x-4">
                      {product.imageUrl && (
                        <img 
                          src={product.imageUrl} 
                          alt={product.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <h4 className="font-medium text-white">{product.name || 'Unnamed Product'}</h4>
                        <p className="text-sm text-zinc-400 max-w-md truncate">{product.description || 'No description available'}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-sm text-zinc-400">Price: ${product.price || 0}</span>
                          <span className="text-sm text-zinc-400">Category: {product.category || 'Uncategorized'}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(product.status)}`}>
                            {formatStatus(product.status)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
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