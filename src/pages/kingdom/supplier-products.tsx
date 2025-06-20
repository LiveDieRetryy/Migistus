import { useState, useEffect } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/DashboardLayout';
import { useRouter } from 'next/router';

interface SupplierProduct {
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
  approvedAt?: string;
  votingStartedAt?: string;
}

export default function KingdomSupplierProducts() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<SupplierProduct[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'voting' | 'rejected'>('pending');

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isAdmin = localStorage.getItem("isAdmin") === "true";
      if (!isAdmin) {
        router.replace("/admin-login");
      } else {
        setLoading(false);
        loadSupplierProducts();
      }
    }
  }, [router]);

  const loadSupplierProducts = async () => {
    try {
      // Load all supplier products for admin review
      const response = await fetch('/api/admin/supplier-products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Failed to load supplier products:', error);
    }
  };
  const handleProductAction = async (productId: string, action: 'approve' | 'reject' | 'add-to-voting') => {
    try {
      let newStatus: 'pending' | 'approved' | 'rejected' | 'voting' = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'voting';
      
      const response = await fetch('/api/supplier/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          productId, 
          status: newStatus,
          votingStats: action === 'add-to-voting' ? { upvotes: 0, downvotes: 0, totalVotes: 0 } : undefined
        })
      });

      if (response.ok) {
        // Update local state
        setProducts(prev => prev.map(product => 
          product.id === productId 
            ? { 
                ...product, 
                status: newStatus,
                ...(action === 'add-to-voting' && { votingStats: { upvotes: 0, downvotes: 0, totalVotes: 0 } })
              }
            : product
        ));

        let message = '';
        if (action === 'approve') message = 'Product approved successfully!';
        else if (action === 'reject') message = 'Product rejected.';
        else if (action === 'add-to-voting') message = 'Product added to voting system!';
        
        alert(message);
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error processing product:', error);
      alert('Failed to process product. Please try again.');
    }
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

  const filteredProducts = products.filter(product => {
    if (filter === 'all') return true;
    return product.status === filter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black flex items-center justify-center">
        <div className="text-yellow-400 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <Head>
        <title>Supplier Products - Kingdom Admin</title>
      </Head>

      <div className="p-6 space-y-6 bg-gradient-to-br from-zinc-950 via-zinc-900 to-black min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-300 bg-clip-text text-transparent">
              Supplier Products Review
            </h1>
            <p className="text-gray-400 mt-2">Review and approve supplier product submissions for voting</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1 bg-zinc-900/50 p-1 rounded-lg border border-yellow-500/20">
          {[
            { key: 'pending', label: 'Pending Review', count: products.filter(p => p.status === 'pending').length },
            { key: 'approved', label: 'Approved', count: products.filter(p => p.status === 'approved').length },
            { key: 'voting', label: 'In Voting', count: products.filter(p => p.status === 'voting').length },
            { key: 'rejected', label: 'Rejected', count: products.filter(p => p.status === 'rejected').length },
            { key: 'all', label: 'All Products', count: products.length }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === tab.key
                  ? 'bg-yellow-500 text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Products List */}
        <div className="bg-zinc-900/50 border border-yellow-500/20 rounded-lg">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-xl font-bold text-white">
              {filter === 'all' ? 'All Products' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Products`}
            </h2>
          </div>
          <div className="p-6">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">No products found for this filter.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="bg-zinc-800/50 border border-gray-700 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-white mb-1">{product.name}</h3>
                        <p className="text-gray-400 text-sm">by {product.supplierName}</p>
                      </div>
                      <span className={`px-3 py-1 text-sm rounded-full border ${getStatusBadge(product.status)}`}>
                        {product.status}
                      </span>
                    </div>

                    {product.images && product.images[0] && (
                      <div className="aspect-video bg-zinc-700 rounded-lg mb-4 overflow-hidden">
                        <img 
                          src={product.images[0]} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <span className="text-gray-400 text-sm">Category:</span>
                        <p className="text-white">{product.category}</p>
                      </div>
                      <div>
                        <span className="text-gray-400 text-sm">Price:</span>
                        <p className="text-yellow-400 font-bold">${product.price}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <span className="text-gray-400 text-sm">Description:</span>
                      <p className="text-white mt-1">{product.description}</p>
                    </div>

                    {product.votingStats && (
                      <div className="bg-zinc-700/50 rounded-lg p-3 mb-4">
                        <h5 className="text-white font-medium mb-2">Voting Results:</h5>
                        <div className="flex justify-between text-sm">
                          <span className="text-green-400">👍 {product.votingStats.upvotes}</span>
                          <span className="text-red-400">👎 {product.votingStats.downvotes}</span>
                          <span className="text-gray-400">Total: {product.votingStats.totalVotes}</span>
                        </div>
                      </div>
                    )}

                    <div className="mb-4">
                      <span className="text-gray-400 text-sm">Submitted:</span>
                      <p className="text-white text-sm">{new Date(product.submittedAt).toLocaleDateString()}</p>
                    </div>

                    {/* Action Buttons */}
                    {product.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleProductAction(product.id, 'approve')}
                          className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleProductAction(product.id, 'reject')}
                          className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    {product.status === 'approved' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleProductAction(product.id, 'add-to-voting')}
                          className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                        >
                          Add to Voting
                        </button>
                        <button
                          onClick={() => handleProductAction(product.id, 'reject')}
                          className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    {product.status === 'voting' && (
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                        <p className="text-blue-400 text-sm">✅ This product is currently in the voting system</p>
                      </div>
                    )}

                    {product.status === 'rejected' && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                        <p className="text-red-400 text-sm">❌ This product was rejected</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
