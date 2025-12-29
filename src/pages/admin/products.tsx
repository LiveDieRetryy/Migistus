import { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import MainNavbar from '@/components/nav/MainNavbar';
import { useAuth } from '@/context/AuthContext';
import AdvancedWYSIWYGEditor from '@/components/admin/AdvancedWYSIWYGEditor';

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  status: 'coming-soon' | 'live' | 'completed' | 'draft' | 'pending-review' | 'rejected';
  image: string;
  pledgeCount: number;
  totalPledged: number;
  targetAmount?: number;
  endDate?: string;
  features?: string[];
  specifications?: Record<string, string>;
  createdAt: string;
  updatedAt?: string;
}

export default function AdminProductsPage() {
  const { user, isAuthenticated } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [staffPicks, setStaffPicks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);  const [activeTab, setActiveTab] = useState<'overview' | 'manage' | 'supplier-reviews' | 'create' | 'edit' | 'staff-picks' | 'lifecycle'>('overview');
  const [manageSubTab, setManageSubTab] = useState<'all' | 'approved'>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductPreview, setShowProductPreview] = useState(false);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  // New product form
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    category: 'Electronics',
    price: 0,
    originalPrice: 0,
    discount: 0,
    status: 'draft' as 'coming-soon' | 'live' | 'completed' | 'draft' | 'pending-review' | 'rejected',
    image: '',
    targetAmount: 0,
    endDate: '',
    features: [''],
    specifications: {} as Record<string, string>
  });
  useEffect(() => {
    console.log('Admin Products: Auth check', { isAuthenticated, user: user?.email });
    if (!isAuthenticated || user?.tier !== 'Admin') return;
    loadProductsData();
  }, [isAuthenticated, user]);
  const loadProductsData = async () => {
    try {
      // Load products
      const productsResponse = await fetch('/api/products');
      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        const allProducts = productsData.products || [];
        console.log('Admin: Loaded products:', allProducts);
        console.log('Admin: Pending products:', allProducts.filter((p: any) => p.status === 'pending-review'));
        setProducts(allProducts);
      }

      // Load staff picks
      const staffPicksResponse = await fetch('/api/staff-picks');
      if (staffPicksResponse.ok) {
        const staffPicksData = await staffPicksResponse.json();
        setStaffPicks(staffPicksData.staffPicks || []);
      }
    } catch (error) {
      console.error('Failed to load products data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async () => {
    if (!newProduct.name.trim() || !newProduct.description.trim()) {
      alert('Please provide name and description');
      return;
    }

    try {
      const productData = {
        ...newProduct,
        id: `product_${Date.now()}`,
        features: newProduct.features.filter(f => f.trim()),
        pledgeCount: 0,
        totalPledged: 0,
        createdAt: new Date().toISOString()
      };

      const response = await fetch('/api/products/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });

      if (response.ok) {
        alert('Product created successfully!');
        setNewProduct({
          name: '',
          description: '',
          category: 'Electronics',
          price: 0,
          originalPrice: 0,
          discount: 0,
          status: 'draft',
          image: '',
          targetAmount: 0,
          endDate: '',
          features: [''],
          specifications: {}
        });
        loadProductsData();
        setActiveTab('manage');
      } else {
        alert('Failed to create product');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      alert('Error creating product');
    }
  };

  const updateProductStatus = async (productId: string, status: string) => {
    try {
      const response = await fetch('/api/products/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, status })
      });

      if (response.ok) {
        loadProductsData();
        alert(`Product ${status} successfully!`);
      }
    } catch (error) {
      console.error('Error updating product status:', error);
    }
  };

  const toggleStaffPick = async (productId: string) => {
    try {
      const isCurrentlyStaffPick = staffPicks.some(pick => pick.productId === productId);
      
      const response = await fetch('/api/staff-picks/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, action: isCurrentlyStaffPick ? 'remove' : 'add' })
      });

      if (response.ok) {
        loadProductsData();
        alert(`Product ${isCurrentlyStaffPick ? 'removed from' : 'added to'} staff picks!`);
      }
    } catch (error) {
      console.error('Error toggling staff pick:', error);
    }
  };
  const deleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const response = await fetch('/api/products/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId })
      });

      if (response.ok) {
        loadProductsData();
        alert('Product deleted successfully!');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const editProduct = (product: Product) => {
    setSelectedProduct(product);
    setNewProduct({
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price,
      originalPrice: product.originalPrice || 0,
      discount: product.discount || 0,
      status: product.status,
      image: product.image,
      targetAmount: product.targetAmount || 0,
      endDate: product.endDate || '',
      features: product.features || [''],
      specifications: product.specifications || {}
    });
    setIsEditMode(true);
    setActiveTab('edit');
  };

  const updateProduct = async () => {
    if (!selectedProduct) return;
    
    try {
      const response = await fetch('/api/products/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedProduct.id,
          ...newProduct
        })
      });

      if (response.ok) {
        loadProductsData();
        setIsEditMode(false);
        setSelectedProduct(null);
        setActiveTab('manage');
        // Reset form
        setNewProduct({
          name: '',
          description: '',
          category: 'Electronics',
          price: 0,
          originalPrice: 0,
          discount: 0,
          status: 'draft',
          image: '',
          targetAmount: 0,
          endDate: '',
          features: [''],
          specifications: {}
        });
        alert('Product updated successfully!');
      }
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const addFeature = () => {
    setNewProduct({
      ...newProduct,
      features: [...newProduct.features, '']
    });
  };

  const updateFeature = (index: number, value: string) => {
    const updatedFeatures = [...newProduct.features];
    updatedFeatures[index] = value;
    setNewProduct({
      ...newProduct,
      features: updatedFeatures
    });
  };

  const removeFeature = (index: number) => {
    if (newProduct.features.length > 1) {
      setNewProduct({
        ...newProduct,
        features: newProduct.features.filter((_, i) => i !== index)
      });
    }
  };

  const approveProduct = async (productId: string) => {
    try {
      const response = await fetch('/api/products/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          productId, 
          status: 'coming-soon', // Approved products go to coming-soon
          reviewedBy: 'admin',
          reviewedAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        loadProductsData();
        alert('Product approved successfully!');
      }
    } catch (error) {
      console.error('Failed to approve product:', error);
    }
  };

  const rejectProduct = async (productId: string, reason?: string) => {
    if (!confirm(`Are you sure you want to reject this product? ${reason ? 'Reason: ' + reason : ''}`)) return;
    
    try {
      const response = await fetch('/api/products/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          productId, 
          status: 'rejected',
          reviewedBy: 'admin',
          reviewedAt: new Date().toISOString(),
          rejectionReason: reason
        })
      });

      if (response.ok) {
        loadProductsData();
        alert('Product rejected successfully!');
      }
    } catch (error) {
      console.error('Failed to reject product:', error);
    }
  };

  const categories = [
    'Electronics', 'Home & Garden', 'Fashion', 'Sports & Outdoors', 
    'Automotive', 'Beauty', 'Food & Grocery', 'Toys', 'Books', 'Health'
  ];

  if (!isAuthenticated || user?.tier !== 'Admin') {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <MainNavbar />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 text-center">
            <h1 className="text-2xl font-bold text-red-400 mb-2">Access Denied</h1>
            <p className="text-gray-300">You need admin privileges to access product management.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <MainNavbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading products data...</p>
          </div>
        </div>
      </div>
    );
  }

  const comingSoonProducts = products.filter(p => p.status === 'coming-soon');
  const liveProducts = products.filter(p => p.status === 'live');
  const completedProducts = products.filter(p => p.status === 'completed');
  const draftProducts = products.filter(p => p.status === 'draft');

  // Filter products by status
  const pendingProducts = products.filter(p => p.status === 'pending-review');
  const approvedProducts = products.filter(p => p.status !== 'pending-review' && p.status !== 'rejected');

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Head>
        <title>Product Management - Kings Domain | Migistus</title>
        <meta name="description" content="Admin product management" />
      </Head>

      <MainNavbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-orange-400 mb-2 flex items-center gap-3">
            <span>📦</span> Product Management Center
          </h1>
          <p className="text-gray-400">Manage products, coming soon items, live drops, and staff picks</p>
        </div>        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-700">
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-2 px-3 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-orange-500 text-orange-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                📊 Overview
                <span className="ml-2 bg-gray-700 text-gray-300 py-1 px-2 rounded-full text-xs">
                  {products.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('manage')}
                className={`py-2 px-3 border-b-2 font-medium text-sm ${
                  activeTab === 'manage'
                    ? 'border-orange-500 text-orange-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                🔧 Manage
                <span className="ml-2 bg-gray-700 text-gray-300 py-1 px-2 rounded-full text-xs">
                  {products.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('supplier-reviews')}
                className={`py-2 px-3 border-b-2 font-medium text-sm ${
                  activeTab === 'supplier-reviews'
                    ? 'border-orange-500 text-orange-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                🏪 Supplier Reviews
                <span className="ml-2 bg-gray-700 text-gray-300 py-1 px-2 rounded-full text-xs">
                  {pendingProducts.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('staff-picks')}
                className={`py-2 px-3 border-b-2 font-medium text-sm ${
                  activeTab === 'staff-picks'
                    ? 'border-orange-500 text-orange-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                ⭐ Staff Picks
                <span className="ml-2 bg-gray-700 text-gray-300 py-1 px-2 rounded-full text-xs">
                  {staffPicks.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('create')}
                className={`py-2 px-3 border-b-2 font-medium text-sm ${
                  activeTab === 'create'
                    ? 'border-orange-500 text-orange-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                ➕ Create
              </button>

              <button
                onClick={() => setActiveTab('lifecycle')}
                className={`py-2 px-3 border-b-2 font-medium text-sm ${
                  activeTab === 'lifecycle'
                    ? 'border-orange-500 text-orange-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                🔄 Lifecycle
              </button>

              {isEditMode && (
                <button
                  onClick={() => setActiveTab('edit')}
                  className={`py-2 px-3 border-b-2 font-medium text-sm ${
                    activeTab === 'edit'
                      ? 'border-orange-500 text-orange-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  📝 Edit: {selectedProduct?.name || 'Product'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-400 mb-2">Coming Soon</h3>
                <div className="text-3xl font-bold text-white">{comingSoonProducts.length}</div>
                <p className="text-sm text-gray-400">Upcoming releases</p>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-400 mb-2">Live Drops</h3>
                <div className="text-3xl font-bold text-white">{liveProducts.length}</div>
                <p className="text-sm text-gray-400">Active campaigns</p>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-purple-400 mb-2">Staff Picks</h3>
                <div className="text-3xl font-bold text-white">{staffPicks.length}</div>
                <p className="text-sm text-gray-400">Featured products</p>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-400 mb-2">Total Products</h3>
                <div className="text-3xl font-bold text-white">{products.length}</div>
                <p className="text-sm text-gray-400">All products</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-orange-400 mb-4">Product Status Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Draft</span>
                    <span className="text-gray-400">{draftProducts.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Coming Soon</span>
                    <span className="text-blue-400">{comingSoonProducts.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Live</span>
                    <span className="text-green-400">{liveProducts.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Completed</span>
                    <span className="text-purple-400">{completedProducts.length}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-orange-400 mb-4">Recent Products</h3>
                <div className="space-y-3">
                  {products.slice(0, 5).map(product => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        {product.image && (
                          <div className="w-8 h-8 bg-gray-600 rounded overflow-hidden">
                            <Image 
                              src={product.image} 
                              alt={product.name}
                              width={32}
                              height={32}
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div>
                          <h4 className="font-medium text-white text-sm">{product.name}</h4>
                          <p className="text-xs text-gray-400">{product.category}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        product.status === 'live' ? 'bg-green-900 text-green-300' :
                        product.status === 'coming-soon' ? 'bg-blue-900 text-blue-300' :
                        product.status === 'completed' ? 'bg-purple-900 text-purple-300' :
                        'bg-gray-600 text-gray-300'
                      }`}>
                        {product.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}        {/* Manage Products Tab */}
        {activeTab === 'manage' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-yellow-400 mb-4">
                Products Pending Review ({pendingProducts.length})
              </h3>
              
              {pendingProducts.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-gray-300 mb-2">No products pending review</h4>
                  <p className="text-gray-400">All supplier submissions have been reviewed!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingProducts.map(product => (
                    <div key={product.id} className="bg-gray-700 rounded-lg p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            {product.image && (
                              <div className="w-16 h-16 bg-gray-600 rounded-lg overflow-hidden">
                                <Image 
                                  src={product.image} 
                                  alt={product.name}
                                  width={64}
                                  height={64}
                                  className="object-cover w-full h-full"
                                />
                              </div>
                            )}
                            <div>
                              <h4 className="text-xl font-semibold text-white">{product.name}</h4>
                              <p className="text-sm text-gray-400">
                                Submitted by: {(product as any).supplier?.name || 'Unknown Supplier'}
                              </p>
                              <p className="text-sm text-gray-400">
                                Category: {product.category} • Price: ${product.price}
                              </p>
                            </div>
                          </div>
                          
                          <div className="mb-4">
                            <h5 className="text-sm font-medium text-gray-300 mb-2">Description:</h5>
                            <div 
                              className="text-gray-400 text-sm bg-gray-800 p-3 rounded"
                              dangerouslySetInnerHTML={{ __html: product.description }}
                            />
                          </div>

                          {(product as any).submittedAt && (
                            <p className="text-xs text-gray-500">
                              Submitted: {new Date((product as any).submittedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-2 ml-6">
                          <button
                            onClick={() => approveProduct(product.id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Reason for rejection (optional):');
                              rejectProduct(product.id, reason || undefined);
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            ✗ Reject
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProduct(product);
                              setIsEditMode(true);
                              setActiveTab('edit');
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            📝 Edit & Approve
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}        {/* Manage Products Tab */}
        {activeTab === 'manage' && (
          <div className="space-y-6">
            {/* Sub-tab Navigation */}
            <div className="border-b border-gray-700">
              <nav className="-mb-px flex space-x-6">                {[
                  { id: 'all', label: 'All Products', count: products.length },
                  { id: 'approved', label: 'Approved Products', count: approvedProducts.length }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setManageSubTab(tab.id as any)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      manageSubTab === tab.id
                        ? 'border-orange-500 text-orange-400'
                        : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                    <span className="ml-2 bg-gray-700 text-gray-300 py-1 px-2 rounded-full text-xs">
                      {tab.count}
                    </span>
                  </button>
                ))}
              </nav>
            </div>            {/* All Products Section */}
            {manageSubTab === 'all' && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-orange-400 mb-4">All Products ({products.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map(product => (
                    <div key={product.id} className="bg-gray-700 rounded-lg p-4">
                      {product.image && (
                        <div className="w-full h-32 bg-gray-600 rounded mb-3 overflow-hidden">
                          <Image 
                            src={product.image} 
                            alt={product.name}
                            width={300}
                            height={200}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                        <h4 className="font-semibold text-white mb-2">{product.name}</h4>
                      <div 
                        className="text-gray-300 text-sm mb-3 line-clamp-2" 
                        dangerouslySetInnerHTML={{ __html: product.description }}
                      />
                      
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-orange-400 font-bold">${product.price}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          product.status === 'pending-review' ? 'bg-yellow-900 text-yellow-300' :
                          product.status === 'live' ? 'bg-green-900 text-green-300' :
                          product.status === 'coming-soon' ? 'bg-blue-900 text-blue-300' :
                          product.status === 'completed' ? 'bg-purple-900 text-purple-300' :
                          'bg-gray-600 text-gray-300'
                        }`}>
                          {product.status}
                        </span>
                      </div>

                      <div className="text-sm text-gray-400 mb-4">
                        <div>Pledges: {product.pledgeCount}</div>
                        <div>Total: ${product.totalPledged}</div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {product.status === 'draft' && (
                          <button
                            onClick={() => updateProductStatus(product.id, 'coming-soon')}
                            className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs transition-colors"
                          >
                            Make Coming Soon
                          </button>
                        )}
                        {product.status === 'coming-soon' && (
                          <button
                            onClick={() => updateProductStatus(product.id, 'live')}
                            className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs transition-colors"
                          >
                            Go Live
                          </button>
                        )}
                        {product.status === 'live' && (
                          <button
                            onClick={() => updateProductStatus(product.id, 'completed')}
                            className="bg-purple-600 hover:bg-purple-700 px-2 py-1 rounded text-xs transition-colors"
                          >
                            End Drop
                          </button>
                        )}
                          <button
                          onClick={() => toggleStaffPick(product.id)}
                          className={`px-2 py-1 rounded text-xs transition-colors ${
                            staffPicks.some(pick => pick.productId === product.id)
                              ? 'bg-yellow-600 hover:bg-yellow-700'
                              : 'bg-gray-600 hover:bg-gray-500'
                          }`}
                        >
                          {staffPicks.some(pick => pick.productId === product.id) ? '⭐ Staff Pick' : 'Add to Staff Picks'}
                        </button>
                        
                        <button
                          onClick={() => editProduct(product)}
                          className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs transition-colors"
                        >
                          ✏️ Edit
                        </button>
                        
                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs transition-colors"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Approved Products Section */}
            {manageSubTab === 'approved' && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-400 mb-4">
                  Approved Products ({approvedProducts.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {approvedProducts.map(product => (
                    <div key={product.id} className="bg-gray-700 rounded-lg p-4 border-l-4 border-green-500">
                      {product.image && (
                        <div className="w-full h-32 bg-gray-600 rounded mb-3 overflow-hidden">
                          <Image 
                            src={product.image} 
                            alt={product.name}
                            width={300}
                            height={200}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                        <h4 className="font-semibold text-white mb-2">{product.name}</h4>
                      <div 
                        className="text-gray-300 text-sm mb-3 line-clamp-2" 
                        dangerouslySetInnerHTML={{ __html: product.description }}
                      />
                      
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-orange-400 font-bold">${product.price}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          product.status === 'live' ? 'bg-green-900 text-green-300' :
                          product.status === 'coming-soon' ? 'bg-blue-900 text-blue-300' :
                          product.status === 'completed' ? 'bg-purple-900 text-purple-300' :
                          'bg-gray-600 text-gray-300'
                        }`}>
                          {product.status}
                        </span>
                      </div>

                      <div className="text-sm text-gray-400 mb-4">
                        <div>Pledges: {product.pledgeCount}</div>
                        <div>Total: ${product.totalPledged}</div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {product.status === 'coming-soon' && (
                          <button
                            onClick={() => updateProductStatus(product.id, 'live')}
                            className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs transition-colors"
                          >
                            Go Live
                          </button>
                        )}
                        {product.status === 'live' && (
                          <button
                            onClick={() => updateProductStatus(product.id, 'completed')}
                            className="bg-purple-600 hover:bg-purple-700 px-2 py-1 rounded text-xs transition-colors"
                          >
                            End Drop
                          </button>
                        )}
                          <button
                          onClick={() => toggleStaffPick(product.id)}
                          className={`px-2 py-1 rounded text-xs transition-colors ${
                            staffPicks.some(pick => pick.productId === product.id)
                              ? 'bg-yellow-600 hover:bg-yellow-700'
                              : 'bg-gray-600 hover:bg-gray-500'
                          }`}
                        >
                          {staffPicks.some(pick => pick.productId === product.id) ? '⭐ Staff Pick' : 'Add to Staff Picks'}
                        </button>
                        
                        <button
                          onClick={() => editProduct(product)}
                          className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs transition-colors"
                        >
                          ✏️ Edit
                        </button>
                        
                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs transition-colors"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>        )}

        {/* Supplier Product Reviews Tab */}
        {activeTab === 'supplier-reviews' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-yellow-400 mb-4 flex items-center gap-2">
                <span>🏪</span> Supplier Product Reviews ({pendingProducts.length})
              </h3>
              <p className="text-gray-400 mb-6">Review products submitted by suppliers for approval to enter the voting stage.</p>
              
              {pendingProducts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-20 h-20 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="text-xl font-medium text-gray-300 mb-2">All caught up!</h4>
                  <p className="text-gray-400">No supplier products pending review at the moment.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {pendingProducts.map(product => (
                    <div key={product.id} className="bg-gray-700 rounded-lg p-6 border-l-4 border-yellow-500 hover:bg-gray-600 transition-colors">
                      <div className="flex items-start gap-6">
                        {/* Product Image */}
                        <div className="flex-shrink-0">
                          {product.image ? (
                            <div className="w-24 h-24 bg-gray-600 rounded-lg overflow-hidden">
                              <Image 
                                src={product.image} 
                                alt={product.name}
                                width={96}
                                height={96}
                                className="object-cover w-full h-full"
                              />
                            </div>
                          ) : (
                            <div className="w-24 h-24 bg-gray-600 rounded-lg flex items-center justify-center">
                              <span className="text-gray-400 text-sm">No Image</span>
                            </div>
                          )}
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h4 className="text-xl font-semibold text-white mb-2">{product.name}</h4>
                              <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
                                <span className="flex items-center gap-1">
                                  <span>🏪</span>
                                  Supplier: {(product as any).supplier?.name || (product as any).supplierName || 'Unknown Supplier'}
                                </span>
                                <span className="flex items-center gap-1">
                                  <span>📂</span>
                                  {product.category}
                                </span>
                                <span className="flex items-center gap-1">
                                  <span>💰</span>
                                  ${product.price}
                                </span>
                              </div>
                              {(product as any).submittedAt && (
                                <p className="text-xs text-gray-500">
                                  Submitted: {new Date((product as any).submittedAt).toLocaleDateString()} at {new Date((product as any).submittedAt).toLocaleTimeString()}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1 bg-yellow-900 text-yellow-300 rounded-full text-xs font-medium">
                                Pending Review
                              </span>
                            </div>
                          </div>
                          
                          {/* Product Description */}
                          <div className="mb-4">
                            <h5 className="text-sm font-medium text-gray-300 mb-2">Product Description:</h5>
                            <div 
                              className="text-gray-400 text-sm bg-gray-800 p-4 rounded-lg max-h-32 overflow-y-auto"
                              dangerouslySetInnerHTML={{ __html: product.description }}
                            />
                          </div>

                          {/* Product Features (if available) */}
                          {product.features && product.features.length > 0 && (
                            <div className="mb-4">
                              <h5 className="text-sm font-medium text-gray-300 mb-2">Key Features:</h5>
                              <div className="flex flex-wrap gap-2">
                                {product.features.slice(0, 3).map((feature, index) => (
                                  <span key={index} className="px-2 py-1 bg-blue-900 text-blue-300 rounded text-xs">
                                    {feature}
                                  </span>
                                ))}
                                {product.features.length > 3 && (
                                  <span className="px-2 py-1 bg-gray-600 text-gray-300 rounded text-xs">
                                    +{product.features.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-3 flex-shrink-0">
                          <button
                            onClick={() => {
                              setPreviewProduct(product);
                              setShowProductPreview(true);
                            }}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                          >
                            <span>👁️</span>
                            Preview Page
                          </button>
                          
                          <button
                            onClick={() => updateProductStatus(product.id, 'voting')}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                          >
                            <span>✅</span>
                            Approve & Send to Voting
                          </button>
                          
                          <button
                            onClick={() => {
                              const reason = prompt('Reason for rejection (optional):');
                              updateProductStatus(product.id, 'rejected');
                            }}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                          >
                            <span>❌</span>
                            Reject
                          </button>
                          
                          <button
                            onClick={() => {
                              setSelectedProduct(product);
                              setIsEditMode(true);
                              setActiveTab('edit');
                            }}
                            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                          >
                            <span>✏️</span>
                            Edit Before Approval
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Lifecycle Tab */}
        {activeTab === 'lifecycle' && (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-orange-400 mb-4">Product Lifecycle Controls</h2>
            <p className="text-gray-300 mb-6">
              Manage product stage transitions, automate lifecycle events, and review stage history here.<br/>
              (This is a placeholder. Add your lifecycle controls and logic as needed)
            </p>
            {/* TODO: Add lifecycle admin controls here */}
          </div>
        )}

        {/* Staff Picks Tab */}
        {activeTab === 'staff-picks' && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-400 mb-4">Staff Picks Management</h3>
            {staffPicks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">No staff picks selected yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {staffPicks.map(pick => {
                  const product = products.find(p => p.id === pick.productId);
                  if (!product) return null;
                  
                  return (
                    <div key={pick.id} className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                      {product.image && (
                        <div className="w-full h-32 bg-gray-600 rounded mb-3 overflow-hidden">
                          <Image 
                            src={product.image} 
                            alt={product.name}
                            width={300}
                            height={200}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                        <h4 className="font-semibold text-white mb-2">⭐ {product.name}</h4>
                      <div 
                        className="text-gray-300 text-sm mb-3" 
                        dangerouslySetInnerHTML={{ __html: product.description }}
                      />
                      
                      <button
                        onClick={() => toggleStaffPick(product.id)}
                        className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm transition-colors"
                      >
                        Remove from Staff Picks
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Create New Product Tab */}
        {activeTab === 'create' && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-orange-400 mb-6">Create New Product</h3>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Product Name</label>
                  <input
                    type="text"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder="Enter product name..."
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <AdvancedWYSIWYGEditor
                  value={newProduct.description}
                  onChange={(value: string) => setNewProduct({ ...newProduct, description: value })}
                  placeholder="Enter product description..."
                  className="w-full"
                  enableImageUpload={true}
                  onImageUpload={async (file: File) => {
                    // For now, create a local URL - in production, upload to your storage service
                    return URL.createObjectURL(file);
                  }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Price ($)</label>
                  <input
                    type="number"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Original Price ($)</label>
                  <input
                    type="number"
                    value={newProduct.originalPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, originalPrice: Number(e.target.value) })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Target Amount ($)</label>
                  <input
                    type="number"
                    value={newProduct.targetAmount}
                    onChange={(e) => setNewProduct({ ...newProduct, targetAmount: Number(e.target.value) })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Image URL</label>
                  <input
                    type="text"
                    value={newProduct.image}
                    onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                    placeholder="Enter image URL..."
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                  <select
                    value={newProduct.status}
                    onChange={(e) => setNewProduct({ ...newProduct, status: e.target.value as any })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="draft">Draft</option>
                    <option value="coming-soon">Coming Soon</option>
                    <option value="live">Live</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Features</label>
                <div className="space-y-3">
                  {newProduct.features.map((feature, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => updateFeature(index, e.target.value)}
                        placeholder={`Feature ${index + 1}...`}
                        className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                      {newProduct.features.length > 1 && (
                        <button
                          onClick={() => removeFeature(index)}
                          className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded transition-colors"
                        >
                          ❌
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addFeature}
                    className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded transition-colors"
                  >
                    + Add Feature
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setNewProduct({
                    name: '',
                    description: '',
                    category: 'Electronics',
                    price: 0,
                    originalPrice: 0,
                    discount: 0,
                    status: 'draft',
                    image: '',
                    targetAmount: 0,
                    endDate: '',
                    features: [''],
                    specifications: {}
                  })}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                >                  Clear
                </button>
                <button
                  onClick={createProduct}
                  className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-500 transition-colors"
                >
                  Create Product
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Product Tab */}
        {activeTab === 'edit' && selectedProduct && (
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-orange-400">Edit Product: {selectedProduct.name}</h3>
              <button
                onClick={() => {
                  setIsEditMode(false);
                  setSelectedProduct(null);
                  setActiveTab('manage');
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Product Name</label>
                  <input
                    type="text"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Home & Garden">Home & Garden</option>
                    <option value="Clothing">Clothing</option>
                    <option value="Sports">Sports</option>
                    <option value="Books">Books</option>
                    <option value="Food">Food</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <AdvancedWYSIWYGEditor
                  value={newProduct.description}
                  onChange={(value: string) => setNewProduct({ ...newProduct, description: value })}
                  placeholder="Enter product description..."
                  className="w-full"
                  enableImageUpload={true}
                  onImageUpload={async (file: File) => {
                    // For now, create a local URL - in production, upload to your storage service
                    return URL.createObjectURL(file);
                  }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Price ($)</label>
                  <input
                    type="number"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Original Price ($)</label>
                  <input
                    type="number"
                    value={newProduct.originalPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, originalPrice: Number(e.target.value) })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                  <select
                    value={newProduct.status}
                    onChange={(e) => setNewProduct({ ...newProduct, status: e.target.value as any })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="draft">Draft</option>
                    <option value="coming-soon">Coming Soon</option>
                    <option value="live">Live</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Product Image URL</label>
                <input
                  type="url"
                  value={newProduct.image}
                  onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  onClick={() => {
                    setIsEditMode(false);
                    setSelectedProduct(null);
                    setActiveTab('manage');
                  }}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={updateProduct}
                  className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-500 transition-colors"
                >
                  Update Product
                </button>
              </div>
            </div>          </div>
        )}
      </div>

      {/* Product Preview Modal */}
      {showProductPreview && previewProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <span>👁️</span>
                  Product Page Preview
                </h2>
                <button
                  onClick={() => {
                    setShowProductPreview(false);
                    setPreviewProduct(null);
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Product Page Mockup */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Product Images */}
                  <div className="space-y-4">
                    <div className="aspect-square bg-gray-700 rounded-lg overflow-hidden">
                      {previewProduct.image ? (
                        <Image
                          src={previewProduct.image}
                          alt={previewProduct.name}
                          width={400}
                          height={400}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <span>No Image Available</span>
                        </div>
                      )}
                    </div>
                    {/* Thumbnail images placeholder */}
                    <div className="flex gap-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="w-16 h-16 bg-gray-700 rounded border border-gray-600"></div>
                      ))}
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="space-y-6">
                    <div>
                      <h1 className="text-3xl font-bold text-white mb-2">{previewProduct.name}</h1>
                      <p className="text-gray-400 mb-4">
                        by {(previewProduct as any).supplier?.name || (previewProduct as any).supplierName || 'Unknown Supplier'}
                      </p>
                      <div className="flex items-center gap-4 mb-4">
                        <span className="text-3xl font-bold text-orange-400">${previewProduct.price}</span>
                        <span className="px-3 py-1 bg-yellow-900 text-yellow-300 rounded-full text-sm">
                          Pending Review
                        </span>
                      </div>
                    </div>

                    {/* Product Description */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Description</h3>
                      <div 
                        className="text-gray-300 prose prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: previewProduct.description }}
                      />
                    </div>

                    {/* Features */}
                    {previewProduct.features && previewProduct.features.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3">Key Features</h3>
                        <ul className="space-y-2">
                          {previewProduct.features.map((feature, index) => (
                            <li key={index} className="flex items-center gap-2 text-gray-300">
                              <span className="text-green-400">✓</span>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Specifications */}
                    {previewProduct.specifications && Object.keys(previewProduct.specifications).length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3">Specifications</h3>
                        <div className="bg-gray-700 rounded-lg p-4">
                          {Object.entries(previewProduct.specifications).map(([key, value]) => (
                            <div key={key} className="flex justify-between py-2 border-b border-gray-600 last:border-b-0">
                              <span className="text-gray-400">{key}</span>
                              <span className="text-white">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons Preview */}
                    <div className="space-y-3 pt-4 border-t border-gray-600">
                      <div className="flex gap-3">
                        <button className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors">
                          Vote for this Product
                        </button>
                        <button className="px-4 py-3 border border-orange-600 text-orange-400 rounded-lg hover:bg-orange-600 hover:text-white transition-colors">
                          ❤️
                        </button>
                      </div>
                      <button className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold transition-colors">
                        Follow Product Updates
                      </button>
                    </div>
                  </div>
                </div>

                {/* Additional sections that would appear on the real product page */}
                <div className="mt-8 pt-8 border-t border-gray-600">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gray-700 rounded-lg p-4">
                      <h4 className="font-semibold text-white mb-2">Voting Progress</h4>
                      <div className="text-2xl font-bold text-orange-400">0 votes</div>
                      <p className="text-sm text-gray-400">Needs approval first</p>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-4">
                      <h4 className="font-semibold text-white mb-2">Interest Level</h4>
                      <div className="text-2xl font-bold text-blue-400">0 followers</div>
                      <p className="text-sm text-gray-400">Will show after approval</p>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-4">
                      <h4 className="font-semibold text-white mb-2">Category</h4>
                      <div className="text-lg font-semibold text-white">{previewProduct.category}</div>
                      <p className="text-sm text-gray-400">Product category</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-700">
                <div className="text-sm text-gray-400">
                  This is a preview of how the product page will look once approved and live.
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowProductPreview(false);
                      setPreviewProduct(null);
                    }}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    Close Preview
                  </button>
                  <button
                    onClick={() => {
                      updateProductStatus(previewProduct.id, 'voting');
                      setShowProductPreview(false);
                      setPreviewProduct(null);
                    }}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    Approve & Send to Voting
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
