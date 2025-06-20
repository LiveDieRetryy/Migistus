import { useState, useEffect } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/DashboardLayout';
import { useRouter } from 'next/router';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  status: 'coming-soon' | 'live' | 'ended' | 'staff-pick';
  createdAt: string;
  imageUrl?: string;
  pledgeGoal?: number;
  currentPledges?: number;
}

interface ProductStats {
  total: number;
  comingSoon: number;
  live: number;
  staffPicks: number;
  ended: number;
}

export default function KingdomProducts() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<ProductStats>({
    total: 0,
    comingSoon: 0,
    live: 0,
    staffPicks: 0,
    ended: 0
  });
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    category: 'electronics',
    status: 'coming-soon' as const,
    pledgeGoal: ''
  });
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isAdmin = localStorage.getItem("isAdmin") === "true";
      if (!isAdmin) {
        router.replace("/admin-login");
      } else {
        setLoading(false);
        loadProductData();
      }
    }
  }, [router]);
  const loadProductData = async () => {
    try {
      // Load product stats
      const statsResponse = await fetch('/api/admin/stats/products');
      const statsData = await statsResponse.json();

      // Load products
      const productsResponse = await fetch('/api/products');
      const productsResponseData = await productsResponse.json();
      const productsData = productsResponseData.products || [];

      setStats(statsData);
      setProducts(productsData);
    } catch (error) {
      console.error('Failed to load product data:', error);
    }
  };

  const handleCreateProduct = async () => {
    if (!newProduct.name || !newProduct.description || !newProduct.price) return;

    try {
      const response = await fetch('/api/products/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newProduct,
          price: parseFloat(newProduct.price),
          pledgeGoal: newProduct.pledgeGoal ? parseInt(newProduct.pledgeGoal) : undefined
        })
      });

      if (response.ok) {
        setNewProduct({
          name: '',
          description: '',
          price: '',
          category: 'electronics',
          status: 'coming-soon',
          pledgeGoal: ''
        });
        setShowCreateForm(false);
        loadProductData();
      }
    } catch (error) {
      console.error('Failed to create product:', error);
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
      });

      if (response.ok) {
        loadProductData();
      }
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'live': return 'bg-green-100 text-green-800';
      case 'coming-soon': return 'bg-blue-100 text-blue-800';
      case 'staff-pick': return 'bg-yellow-100 text-yellow-800';
      case 'ended': return 'bg-gray-100 text-gray-800';
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

        {/* Product Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
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
        </div>

        {/* Create Product Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-yellow-600 hover:bg-yellow-700 text-black px-6 py-3 rounded-lg font-medium transition"
          >
            {showCreateForm ? 'Cancel' : '+ Add New Product'}
          </button>
        </div>

        {/* Create Product Form */}
        {showCreateForm && (
          <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-6 mb-8">
            <h3 className="text-xl font-semibold text-yellow-400 mb-4">Add New Product</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Product Name</label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  className="w-full px-3 py-2 border border-zinc-600 rounded-md bg-zinc-800 text-white"
                  placeholder="Product name..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Price ($)</label>
                <input
                  type="number"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                  className="w-full px-3 py-2 border border-zinc-600 rounded-md bg-zinc-800 text-white"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-zinc-300 mb-2">Description</label>
                <textarea
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-zinc-600 rounded-md bg-zinc-800 text-white"
                  placeholder="Product description..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Category</label>
                <select
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                  className="w-full px-3 py-2 border border-zinc-600 rounded-md bg-zinc-800 text-white"
                >
                  <option value="electronics">Electronics</option>
                  <option value="home">Home & Garden</option>
                  <option value="automotive">Automotive</option>
                  <option value="sports">Sports & Outdoors</option>
                  <option value="beauty">Beauty & Personal Care</option>
                  <option value="toys">Toys & Games</option>
                  <option value="food">Food & Grocery</option>
                  <option value="handmade">Handmade</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Status</label>
                <select
                  value={newProduct.status}
                  onChange={(e) => setNewProduct({...newProduct, status: e.target.value as any})}
                  className="w-full px-3 py-2 border border-zinc-600 rounded-md bg-zinc-800 text-white"
                >
                  <option value="coming-soon">Coming Soon</option>
                  <option value="live">Live</option>
                  <option value="staff-pick">Staff Pick</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Pledge Goal (optional)</label>
                <input
                  type="number"
                  value={newProduct.pledgeGoal}
                  onChange={(e) => setNewProduct({...newProduct, pledgeGoal: e.target.value})}
                  className="w-full px-3 py-2 border border-zinc-600 rounded-md bg-zinc-800 text-white"
                  placeholder="Number of pledges needed"
                />
              </div>
              <div className="md:col-span-2 flex space-x-4">
                <button
                  onClick={handleCreateProduct}
                  className="bg-yellow-600 hover:bg-yellow-700 text-black px-6 py-2 rounded-lg transition"
                >
                  Add Product
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="bg-zinc-700 hover:bg-zinc-600 text-white px-6 py-2 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Products List */}
        <div className="bg-zinc-900 border border-yellow-500 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-700">
            <h3 className="text-xl font-semibold text-yellow-400">All Products</h3>
          </div>
          <div className="divide-y divide-zinc-700">
            {products.length === 0 ? (
              <div className="px-6 py-8 text-center text-zinc-400">
                No products found. Add your first product to get started!
              </div>
            ) : (
              products.map(product => (
                <div key={product.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">                    <div className="flex-1">
                      <h4 className="text-white font-medium">{product.name || 'Unnamed Product'}</h4>
                      <p className="text-zinc-400 text-sm mt-1">{product.description || 'No description available'}</p>
                      <div className="mt-2 flex items-center space-x-4">                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(product.status || 'draft')}`}>
                          {String(product.status || 'draft').replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                        <span className="text-xs text-zinc-400">
                          ${(product.price || 0).toFixed(2)}
                        </span>
                        <span className="text-xs text-zinc-400">
                          Category: {product.category || 'Unknown'}
                        </span>
                        {product.pledgeGoal && (                          <span className="text-xs text-zinc-400">
                            Goal: {product.currentPledges || 0}/{product.pledgeGoal} pledges
                          </span>
                        )}
                        <span className="text-xs text-zinc-400">
                          Created: {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : 'Unknown'}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {product.status === 'coming-soon' && (
                        <button
                          onClick={() => handleUpdateProductStatus(product.id, 'live')}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition"
                        >
                          Make Live
                        </button>
                      )}
                      {product.status === 'live' && (
                        <>
                          <button
                            onClick={() => handleUpdateProductStatus(product.id, 'staff-pick')}
                            className="bg-yellow-600 hover:bg-yellow-700 text-black px-4 py-2 rounded-lg text-sm transition"
                          >
                            Staff Pick
                          </button>
                          <button
                            onClick={() => handleUpdateProductStatus(product.id, 'ended')}
                            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm transition"
                          >
                            End
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
