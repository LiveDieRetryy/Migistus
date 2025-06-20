import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  images: string[];
  supplierName: string;
  supplierId: string;
  status: 'pending' | 'approved' | 'rejected' | 'voting';
  votingStats?: {
    upvotes: number;
    downvotes: number;
    totalVotes: number;
  };
  submittedAt: string;
}

export default function SupplierPortal() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [supplierName, setSupplierName] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    imageUrl: ''
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
      }
    }
  }, [router]);

  const loadSupplierProducts = async () => {
    try {
      const response = await fetch(`/api/supplier/products?supplierId=${supplierId}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.description || !newProduct.category || !newProduct.price) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('/api/supplier/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newProduct,
          price: parseFloat(newProduct.price),
          supplierId,
          supplierName
        })
      });

      if (response.ok) {
        const createdProduct = await response.json();
        setProducts(prev => [createdProduct, ...prev]);
        setNewProduct({
          name: '',
          description: '',
          category: '',
          price: '',
          imageUrl: ''
        });
        setShowAddForm(false);
        alert('Product submitted for voting review! It will appear in the community voting once approved.');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Failed to add product:', error);
      alert('Failed to add product. Please try again.');
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

  const getStatusBadge = (status: string) => {
    const badges = {
      'pending': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      'approved': 'bg-green-500/20 text-green-300 border-green-500/30',
      'rejected': 'bg-red-500/20 text-red-300 border-red-500/30',
      'voting': 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    };
    return badges[status as keyof typeof badges] || badges['pending'];
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
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <div key={product.id} className="bg-zinc-800/50 border border-gray-700 rounded-lg p-4">
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
                      
                      <p className="text-gray-500 text-xs">
                        Submitted: {new Date(product.submittedAt).toLocaleDateString()}
                      </p>
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
    </>
  );
}
