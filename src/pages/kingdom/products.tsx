import { useState, useEffect } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/DashboardLayout';
import { useRouter } from 'next/router';
import LiveProductEditor from '@/components/admin/LiveProductEditor';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  status: 'coming-soon' | 'live' | 'ended' | 'staff-pick' | 'pending-review' | 'rejected' | 'voting';
  createdAt: string;
  imageUrl?: string;
  image?: string;
  pledgeGoal?: number;
  currentPledges?: number;
  supplier?: {
    name: string;
    id: string;
  };
  supplierName?: string;
  submittedAt?: string;
  slug?: string;
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
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);  const [stats, setStats] = useState<ProductStats>({
    total: 0,
    comingSoon: 0,
    live: 0,
    staffPicks: 0,
    ended: 0,
    pendingReview: 0,
    approved: 0,
    rejected: 0
  });  const [activeTab, setActiveTab] = useState<'overview' | 'manage' | 'supplier-reviews' | 'create' | 'lifecycle'>('overview');
  const [supplierReviewsSubTab, setSupplierReviewsSubTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [showLiveEditor, setShowLiveEditor] = useState(false);
  const [liveEditorMode, setLiveEditorMode] = useState<'create' | 'edit'>('create');
  const [liveEditorProduct, setLiveEditorProduct] = useState<Product | null>(null);
  const [showProductPreview, setShowProductPreview] = useState(false);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  // Calculate products for supplier reviews
  const pendingProducts = products.filter(p => p.status === 'pending-review');
  const approvedProducts = products.filter(p => p.status === 'voting' || p.status === 'live');
  const rejectedProducts = products.filter(p => p.status === 'rejected');
  
  // Get current subtab products
  const getCurrentSubTabProducts = () => {
    switch (supplierReviewsSubTab) {
      case 'pending':
        return pendingProducts;
      case 'approved':
        return approvedProducts;
      case 'rejected':
        return rejectedProducts;
      default:
        return pendingProducts;
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isAdmin = localStorage.getItem("isAdmin") === "true";
      if (!isAdmin) {
        router.push("/kingdom");
        return;
      }
    }
    loadProductData();
  }, [router]);

  const loadProductData = async () => {
    try {
      setLoading(true);
      
      // Load products
      const productsResponse = await fetch('/api/products');
      const productsData = await productsResponse.json();
      const productsList = productsData.products || productsData || [];
      setProducts(productsList);      // Calculate stats
      const stats = {
        total: productsList.length,
        comingSoon: productsList.filter((p: Product) => p.status === 'coming-soon').length,
        live: productsList.filter((p: Product) => p.status === 'live').length,
        staffPicks: productsList.filter((p: Product) => p.status === 'staff-pick').length,
        ended: productsList.filter((p: Product) => p.status === 'ended').length,
        pendingReview: productsList.filter((p: Product) => p.status === 'pending-review').length,
        approved: productsList.filter((p: Product) => p.status === 'voting' || p.status === 'live').length,
        rejected: productsList.filter((p: Product) => p.status === 'rejected').length
      };
      setStats(stats);
        } catch (error) {
      console.error('Failed to load product data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProductStatus = async (productId: string, status: string) => {
    try {
      const response = await fetch('/api/products/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, status })
      });

      if (response.ok) {
        loadProductData();
      }
    } catch (error) {
      console.error('Failed to update product status:', error);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const response = await fetch('/api/products/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId })
      });      if (response.ok) {
        loadProductData();
      }
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };
  
  const handleEditProduct = (product: Product) => {
    setLiveEditorMode('edit');
    setLiveEditorProduct(product);
    setShowLiveEditor(true);
    setActiveTab('create'); // Switch to create tab to show the editor
  };

  const handleLiveEditorSave = async (productData: any) => {
    try {
      const url = liveEditorMode === 'create' ? '/api/products/create' : '/api/products/update';
      const body = liveEditorMode === 'edit' && liveEditorProduct 
        ? { ...productData, id: liveEditorProduct.id }
        : productData;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        setShowLiveEditor(false);
        setActiveTab('overview');
        loadProductData();
        alert(`Product ${liveEditorMode === 'create' ? 'created' : 'updated'} successfully!`);
      } else {
        alert(`Failed to ${liveEditorMode} product. Please try again.`);
      }
    } catch (error) {
      console.error(`Failed to ${liveEditorMode} product:`, error);
      alert(`Failed to ${liveEditorMode} product. Please try again.`);
    }
  };

  const handleLiveEditorCancel = () => {
    setShowLiveEditor(false);
    setActiveTab('overview');
  };

  const handleApproveProduct = async (productId: string) => {
    try {
      const response = await fetch('/api/products/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, status: 'voting' })
      });

      if (response.ok) {
        loadProductData();
        alert('Product approved and moved to voting stage!');
      }
    } catch (error) {
      console.error('Failed to approve product:', error);
      alert('Failed to approve product. Please try again.');
    }
  };

  const handleRejectProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to reject this product?')) return;
    
    try {
      const response = await fetch('/api/products/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, status: 'rejected' })
      });

      if (response.ok) {
        loadProductData();
        alert('Product rejected.');
      }
    } catch (error) {
      console.error('Failed to reject product:', error);
      alert('Failed to reject product. Please try again.');
    }
  };

  const handleReconsiderProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to move this product back to pending review?')) return;
    
    try {
      const response = await fetch('/api/products/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, status: 'pending-review' })
      });

      if (response.ok) {
        loadProductData();
        alert('Product moved back to pending review.');
      }
    } catch (error) {
      console.error('Failed to reconsider product:', error);
      alert('Failed to reconsider product. Please try again.');
    }
  };

  const handleRevertProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to revert this product back to pending review?')) return;
    
    try {
      const response = await fetch('/api/products/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, status: 'pending-review' })
      });

      if (response.ok) {
        loadProductData();
        alert('Product reverted to pending review.');
      }
    } catch (error) {
      console.error('Failed to revert product:', error);
      alert('Failed to revert product. Please try again.');
    }
  };

  const handlePreviewProduct = (product: Product) => {
    setPreviewProduct(product);
    setShowProductPreview(true);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'live': return 'bg-green-100 text-green-800';
      case 'coming-soon': return 'bg-blue-100 text-blue-800';
      case 'staff-pick': return 'bg-yellow-100 text-yellow-800';
      case 'ended': return 'bg-gray-100 text-gray-800';
      case 'pending-review': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-yellow-400 text-2xl">
        Loading product management...
      </div>
    );
  }

  return (
    <DashboardLayout>
      <Head>
        <title>Product Management - The King's Domain</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#FFD700] mb-2">📦 Product Management</h1>
          <p className="text-zinc-400">Manage products, coming soon items, live drops, and staff picks</p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-zinc-700">
            <nav className="-mb-px flex space-x-8">              {[
                { id: 'overview', name: 'Overview', icon: '📊' },
                { id: 'manage', name: 'Manage Products', icon: '📦' },
                { id: 'supplier-reviews', name: 'Supplier Reviews', icon: '🏪' },
                { id: 'create', name: 'Create Product', icon: '➕' },
                { id: 'lifecycle', name: 'Lifecycle', icon: '🔄' }
              ].map((tab) => (
                <button
                  key={tab.id}                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setShowLiveEditor(false);
                    
                    // Open live editor for create tab
                    if (tab.id === 'create') {
                      setLiveEditorMode('create');
                      setLiveEditorProduct(null);
                      setShowLiveEditor(true);
                    }
                  }}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-yellow-400 text-yellow-400'
                      : 'border-transparent text-zinc-400 hover:text-zinc-300 hover:border-zinc-300'
                  }`}
                >
                  {tab.icon} {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-6">
              <h3 className="text-yellow-400 text-sm font-medium mb-2">Total Products</h3>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-6">
              <h3 className="text-yellow-400 text-sm font-medium mb-2">Coming Soon</h3>
              <p className="text-2xl font-bold text-white">{stats.comingSoon}</p>
            </div>
            <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-6">
              <h3 className="text-yellow-400 text-sm font-medium mb-2">Live Products</h3>
              <p className="text-2xl font-bold text-white">{stats.live}</p>
            </div>
            <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-6">
              <h3 className="text-yellow-400 text-sm font-medium mb-2">Staff Picks</h3>
              <p className="text-2xl font-bold text-white">{stats.staffPicks}</p>
            </div>
            <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-6">
              <h3 className="text-yellow-400 text-sm font-medium mb-2">Ended</h3>
              <p className="text-2xl font-bold text-white">{stats.ended}</p>
            </div>
            <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-6">
              <h3 className="text-yellow-400 text-sm font-medium mb-2">Pending Review</h3>
              <p className="text-2xl font-bold text-white">{stats.pendingReview}</p>
            </div>
          </div>
        )}        {/* Create Tab - Live Editor */}
        {activeTab === 'create' && showLiveEditor && (
          <LiveProductEditor
            isEditing={liveEditorMode === 'edit'}
            initialProduct={liveEditorProduct ? {
              ...liveEditorProduct,
              images: liveEditorProduct.image ? [liveEditorProduct.image] : [],
              fullDescription: liveEditorProduct.description,
              originalPrice: liveEditorProduct.price,
              votes: 0,
              stage: 'draft',
              features: [],
              specifications: {},
              supplier: liveEditorProduct.supplier ? {
                name: liveEditorProduct.supplier.name,
                rating: 4.5,
                verified: true,
                location: 'Unknown'
              } : {
                name: liveEditorProduct.supplierName || 'Unknown',
                rating: 4.5,
                verified: true,
                location: 'Unknown'
              }
            } : undefined}
            onSave={handleLiveEditorSave}
            onCancel={handleLiveEditorCancel}
          />
        )}

        {/* Create Tab - Default message when not in live editor */}
        {activeTab === 'create' && !showLiveEditor && (
          <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-6 text-center">
            <h3 className="text-xl font-semibold text-yellow-400 mb-4">Live Product Editor</h3>
            <p className="text-zinc-400 mb-6">
              Click "Create Product" above to open the comprehensive live product editor.
            </p>            <button
              onClick={() => {
                setLiveEditorMode('create');
                setLiveEditorProduct(null);
                setShowLiveEditor(true);
              }}
              className="bg-yellow-600 hover:bg-yellow-700 text-black px-6 py-3 rounded-lg transition font-medium"
            >
              ➕ Create New Product
            </button>
          </div>
        )}{/* Manage Tab */}
        {activeTab === 'manage' && (
          <div className="bg-zinc-900 border border-yellow-500 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-700">
              <h3 className="text-xl font-semibold text-yellow-400">All Products</h3>
            </div>
            <div className="divide-y divide-zinc-700">
              {products.length === 0 ? (
                <div className="px-6 py-8 text-center text-zinc-400">
                  No products found. Create your first product to get started!
                </div>
              ) : (
                products.map(product => (
                  <div key={product.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="text-white font-medium">{product.name || 'Unnamed Product'}</h4>
                        <div 
                          className="text-zinc-400 text-sm mt-1" 
                          dangerouslySetInnerHTML={{ 
                            __html: product.description || 'No description available' 
                          }}
                        />
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-zinc-400 text-sm">Price: ${product.price}</span>
                          <span className="text-zinc-400 text-sm">Category: {product.category}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(product.status)}`}>
                            {product.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {product.status === 'coming-soon' && (
                          <button
                            onClick={() => handleUpdateProductStatus(product.id, 'live')}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition"
                          >
                            Go Live
                          </button>
                        )}
                        {product.status === 'live' && (
                          <button
                            onClick={() => handleUpdateProductStatus(product.id, 'ended')}
                            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm transition"
                          >
                            End
                          </button>
                        )}
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition"
                        >
                          Delete
                        </button>
                        <a
                          href={`/products/${product.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-zinc-800 hover:bg-yellow-500 text-yellow-400 hover:text-black px-4 py-2 rounded-lg text-sm transition font-medium border border-yellow-400"
                          title="View full product page"
                        >
                          View Page
                        </a>
                      </div>
                    </div>                  </div>
                ))
              )}
            </div>
          </div>
        )}        {/* Supplier Reviews Tab */}
        {activeTab === 'supplier-reviews' && (
          <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-yellow-400 mb-4">Supplier Reviews</h3>
            
            {/* Subtab Navigation */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setSupplierReviewsSubTab('pending')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  supplierReviewsSubTab === 'pending' 
                    ? 'bg-yellow-600 text-white' 
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                Pending ({pendingProducts.length})
              </button>
              <button
                onClick={() => setSupplierReviewsSubTab('approved')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  supplierReviewsSubTab === 'approved' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                Approved ({approvedProducts.length})
              </button>
              <button
                onClick={() => setSupplierReviewsSubTab('rejected')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  supplierReviewsSubTab === 'rejected' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                Rejected ({rejectedProducts.length})
              </button>
            </div>

            {/* Subtab Content */}
            {getCurrentSubTabProducts().length === 0 ? (
              <p className="text-zinc-400 text-sm text-center py-8">
                {supplierReviewsSubTab === 'pending' && 'No products pending review. All set!'}
                {supplierReviewsSubTab === 'approved' && 'No approved products yet.'}
                {supplierReviewsSubTab === 'rejected' && 'No rejected products.'}
              </p>
            ) : (
              <div className="space-y-4">
                {getCurrentSubTabProducts().map(product => (
                  <div key={product.id} className="p-4 bg-zinc-800 rounded-lg border border-zinc-700">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-white font-medium">{product.name || 'Unnamed Product'}</h4>
                        <div className="text-zinc-400 text-sm mt-1">
                          <span className="block">Price: ${product.price}</span>
                          <span className="block">Category: {product.category}</span>
                          {product.supplier?.name && (
                            <span className="block">Supplier: {product.supplier.name}</span>
                          )}
                          {product.submittedAt && (
                            <span className="block">Submitted: {new Date(product.submittedAt).toLocaleDateString()}</span>
                          )}
                        </div>
                        <div className="mt-2">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                            product.status === 'pending-review' ? 'bg-yellow-900 text-yellow-300' :
                            product.status === 'voting' || product.status === 'live' ? 'bg-green-900 text-green-300' :
                            product.status === 'rejected' ? 'bg-red-900 text-red-300' :
                            'bg-zinc-700 text-zinc-300'
                          }`}>
                            {product.status === 'pending-review' ? 'Pending Review' :
                             product.status === 'voting' ? 'Approved (Voting)' :
                             product.status === 'live' ? 'Approved (Live)' :
                             product.status === 'rejected' ? 'Rejected' :
                             product.status}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handlePreviewProduct(product)}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm transition"
                        >
                          👁️ Preview
                        </button>
                        
                        {supplierReviewsSubTab === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApproveProduct(product.id)}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm transition"
                            >
                              ✓ Approve
                            </button>
                            <button
                              onClick={() => handleRejectProduct(product.id)}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm transition"
                            >
                              ✗ Reject
                            </button>
                          </>
                        )}
                        
                        {supplierReviewsSubTab === 'rejected' && (
                          <button
                            onClick={() => handleReconsiderProduct(product.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm transition"
                          >
                            🔄 Reconsider
                          </button>
                        )}
                        
                        {supplierReviewsSubTab === 'approved' && (
                          <button
                            onClick={() => handleRevertProduct(product.id)}
                            className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-lg text-sm transition"
                          >
                            ↩️ Revert
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
          {/* Full Product Page Preview Modal */}
        {showProductPreview && previewProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-95 z-50 overflow-y-auto">
            <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black">
              {/* Modal Header */}
              <div className="sticky top-0 bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-800 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="px-3 py-1 bg-yellow-500 text-black text-sm font-bold rounded-full">
                        PREVIEW MODE
                      </div>
                      <h2 className="text-xl font-bold text-white">Product Review</h2>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => {
                          handleApproveProduct(previewProduct.id);
                          setShowProductPreview(false);
                          setPreviewProduct(null);
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                      >
                        <span>✓</span>
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => {
                          handleRejectProduct(previewProduct.id);
                          setShowProductPreview(false);
                          setPreviewProduct(null);
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                      >
                        <span>✗</span>
                        <span>Reject</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowProductPreview(false);
                          setPreviewProduct(null);
                        }}
                        className="text-zinc-400 hover:text-white text-2xl px-2"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Page Content */}
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Breadcrumb */}
                <div className="flex items-center space-x-2 text-sm text-zinc-400 mb-6">
                  <span>Home</span>
                  <span>/</span>
                  <span>Products</span>
                  <span>/</span>
                  <span className="text-white">{previewProduct.name}</span>
                </div>

                <div className="grid lg:grid-cols-2 gap-12">
                  {/* Product Images */}
                  <div className="space-y-4">
                    {/* Main Image */}
                    <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-zinc-800">
                      {previewProduct.image || previewProduct.imageUrl ? (
                        <img 
                          src={previewProduct.image || previewProduct.imageUrl} 
                          alt={previewProduct.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-center">
                            <div className="w-24 h-24 bg-zinc-700 rounded-full flex items-center justify-center mx-auto mb-4">
                              <span className="text-zinc-400 text-2xl">📷</span>
                            </div>
                            <span className="text-zinc-400">No image available</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Stage Badge */}
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-500 text-black">
                          PENDING REVIEW
                        </span>
                      </div>
                    </div>                    {/* Gallery placeholder */}
                    {(previewProduct as any).gallery && (previewProduct as any).gallery.length > 0 && (
                      <div className="flex space-x-2 overflow-x-auto">
                        {(previewProduct as any).gallery.slice(0, 5).map((image: string, index: number) => (
                          <div key={index} className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 border-zinc-700">
                            <img
                              src={image}
                              alt={`${previewProduct.name} view ${index + 1}`}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="space-y-6">
                    {/* Category */}
                    <div className="flex items-center space-x-2">
                      <span className="w-4 h-4 text-yellow-400">🏷️</span>
                      <span className="text-yellow-400 text-sm font-medium">{previewProduct.category}</span>
                    </div>

                    {/* Product Name */}
                    <h1 className="text-4xl font-bold text-white">{previewProduct.name}</h1>

                    {/* Supplier */}
                    <div className="text-zinc-400">
                      by {(previewProduct as any).supplier?.name || (previewProduct as any).supplierName || 'Unknown Supplier'}
                    </div>

                    {/* Price */}
                    <div className="text-3xl font-bold text-yellow-400">
                      ${previewProduct.price}
                    </div>

                    {/* Description */}
                    <div className="text-zinc-300 text-lg leading-relaxed">
                      <div 
                        dangerouslySetInnerHTML={{ 
                          __html: previewProduct.description || 'No description provided' 
                        }}
                      />
                    </div>

                    {/* Product Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-zinc-800/50 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-blue-400">🗳️</span>
                          <span className="text-zinc-400 text-sm">Expected Votes</span>
                        </div>
                        <div className="text-2xl font-bold text-white">-</div>
                      </div>

                      <div className="bg-zinc-800/50 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-yellow-400">📅</span>
                          <span className="text-zinc-400 text-sm">Submitted</span>
                        </div>
                        <div className="text-2xl font-bold text-white">Today</div>
                      </div>
                    </div>                    {/* Features */}
                    {(previewProduct as any).features && (previewProduct as any).features.length > 0 && (
                      <div className="bg-zinc-800/30 rounded-lg p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Key Features</h3>
                        <ul className="space-y-2">
                          {(previewProduct as any).features.map((feature: string, index: number) => (
                            <li key={index} className="flex items-start space-x-2 text-zinc-300">
                              <span className="text-green-400 flex-shrink-0 mt-1">✓</span>
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Specifications */}
                    {(previewProduct as any).specifications && Object.keys((previewProduct as any).specifications).length > 0 && (
                      <div className="bg-zinc-800/30 rounded-lg p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Specifications</h3>
                        <div className="space-y-2">
                          {Object.entries((previewProduct as any).specifications).map(([key, value]) => (
                            <div key={key} className="flex justify-between items-center">
                              <span className="text-zinc-400">{key}</span>
                              <span className="text-white font-medium">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Supplier Info */}
                    <div className="bg-zinc-800/30 rounded-lg p-6">
                      <h3 className="text-lg font-bold text-white mb-4">Supplier Information</h3>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-zinc-700 rounded-full flex items-center justify-center">
                            <span className="text-yellow-400">👤</span>
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-white font-medium">
                                {(previewProduct as any).supplier?.name || (previewProduct as any).supplierName || 'Unknown Supplier'}
                              </span>
                              <span className="text-green-400">🛡️</span>
                            </div>
                            <div className="text-zinc-400 text-sm">
                              {(previewProduct as any).supplier?.location || 'Location not specified'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="text-yellow-400">⭐</span>
                          <span className="text-white font-medium">
                            {(previewProduct as any).supplier?.rating || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Review Status */}
                    <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-6">
                      <h3 className="text-lg font-bold text-white mb-4">Review Status</h3>
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                        <span className="text-yellow-400 font-medium">Pending Admin Review</span>
                      </div>
                      <p className="text-zinc-300 text-sm mb-4">
                        This product is awaiting approval from the admin team. Once approved, it will be available for community voting.
                      </p>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => {
                            handleApproveProduct(previewProduct.id);
                            setShowProductPreview(false);
                            setPreviewProduct(null);
                          }}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                        >
                          ✓ Approve for Voting
                        </button>
                        <button
                          onClick={() => {
                            handleRejectProduct(previewProduct.id);
                            setShowProductPreview(false);
                            setPreviewProduct(null);
                          }}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                        >
                          ✗ Reject Product
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Information Sections */}
                <div className="mt-12 space-y-8">
                  {/* Product Timeline */}
                  <div className="bg-zinc-900/50 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-white mb-6">Product Journey</h3>
                    <div className="flex items-center space-x-8">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm">✓</span>
                        </div>
                        <span className="text-green-400 text-sm mt-2">Submitted</span>
                      </div>
                      <div className="flex-1 h-px bg-zinc-700"></div>
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center animate-pulse">
                          <span className="text-black text-sm">⏳</span>
                        </div>
                        <span className="text-yellow-400 text-sm mt-2">Review</span>
                      </div>
                      <div className="flex-1 h-px bg-zinc-700"></div>
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center">
                          <span className="text-zinc-400 text-sm">🗳️</span>
                        </div>
                        <span className="text-zinc-400 text-sm mt-2">Voting</span>
                      </div>
                      <div className="flex-1 h-px bg-zinc-700"></div>
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center">
                          <span className="text-zinc-400 text-sm">🛒</span>
                        </div>
                        <span className="text-zinc-400 text-sm mt-2">Drop</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lifecycle Tab - Placeholder */}
        {activeTab === 'lifecycle' && (
          <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-8 text-center mt-8">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">Product Lifecycle Controls</h2>
            <LifecycleConfigForm />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

// --- LifecycleConfigForm component ---
function LifecycleConfigForm() {
  const [config, setConfig] = useState({
    votingToComingSoonThreshold: 50,
    comingSoonDuration: 7,
    communityDropsDuration: 14,
    autoPromotionEnabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/product-lifecycle-config')
      .then(res => res.json())
      .then(data => {
        setConfig(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : Number(value)
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError('');
    try {
      const res = await fetch('/api/product-lifecycle-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        setSuccess(true);
      } else {
        setError('Failed to save config');
      }
    } catch {
      setError('Failed to save config');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-zinc-400">Loading config...</div>;

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto text-left">
      <div className="mb-6">
        <label className="block text-yellow-300 font-medium mb-2">Votes required to move to Coming Soon</label>
        <input
          type="number"
          name="votingToComingSoonThreshold"
          value={config.votingToComingSoonThreshold}
          onChange={handleChange}
          min={1}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:border-yellow-500 focus:outline-none"
        />
      </div>
      <div className="mb-6">
        <label className="block text-yellow-300 font-medium mb-2">Days in Coming Soon before Live Drop</label>
        <input
          type="number"
          name="comingSoonDuration"
          value={config.comingSoonDuration}
          onChange={handleChange}
          min={1}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:border-yellow-500 focus:outline-none"
        />
      </div>
      <div className="mb-6">
        <label className="block text-yellow-300 font-medium mb-2">Days as Live Drop before Ending</label>
        <input
          type="number"
          name="communityDropsDuration"
          value={config.communityDropsDuration}
          onChange={handleChange}
          min={1}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:border-yellow-500 focus:outline-none"
        />
      </div>
      <div className="mb-6 flex items-center gap-2">
        <input
          type="checkbox"
          name="autoPromotionEnabled"
          checked={config.autoPromotionEnabled}
          onChange={handleChange}
          className="h-5 w-5 text-yellow-500 focus:ring-yellow-400 border-zinc-700 rounded"
        />
        <label className="text-yellow-300 font-medium">Enable Auto-Promotion</label>
      </div>
      <button
        type="submit"
        className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-6 py-3 rounded-lg transition"
        disabled={saving}
      >
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
      {success && <div className="text-green-400 mt-4">Settings saved!</div>}
      {error && <div className="text-red-400 mt-4">{error}</div>}
    </form>
  );
}
