import { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import MainNavbar from '@/components/nav/MainNavbar';
import { useAuth } from '@/context/AuthContext';

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  status: 'coming-soon' | 'live' | 'completed' | 'draft';
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
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'manage' | 'create' | 'staff-picks'>('overview');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // New product form
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    category: 'Electronics',
    price: 0,
    originalPrice: 0,
    discount: 0,
    status: 'draft' as const,
    image: '',
    targetAmount: 0,
    endDate: '',
    features: [''],
    specifications: {} as Record<string, string>
  });

  useEffect(() => {
    if (!isAuthenticated || user?.email !== 'admin@migistus.com') return;
    loadProductsData();
  }, [isAuthenticated, user]);

  const loadProductsData = async () => {
    try {
      // Load products
      const productsResponse = await fetch('/api/products');
      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        setProducts(productsData.products || []);
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

  const categories = [
    'Electronics', 'Home & Garden', 'Fashion', 'Sports & Outdoors', 
    'Automotive', 'Beauty', 'Food & Grocery', 'Toys', 'Books', 'Health'
  ];

  if (!isAuthenticated || user?.email !== 'admin@migistus.com') {
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
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', count: products.length },
                { id: 'manage', label: 'Manage Products', count: products.length },
                { id: 'staff-picks', label: 'Staff Picks', count: staffPicks.length },
                { id: 'create', label: 'Create New Product' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-orange-500 text-orange-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className="ml-2 bg-gray-700 text-gray-300 py-1 px-2 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
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
        )}

        {/* Manage Products Tab */}
        {activeTab === 'manage' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-orange-400 mb-4">All Products</h3>
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
                    <p className="text-gray-300 text-sm mb-3 line-clamp-2">{product.description}</p>
                    
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
                        onClick={() => deleteProduct(product.id)}
                        className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
                      <p className="text-gray-300 text-sm mb-3">{product.description}</p>
                      
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  placeholder="Enter product description..."
                  rows={4}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                >
                  Clear
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
      </div>
    </div>
  );
}
