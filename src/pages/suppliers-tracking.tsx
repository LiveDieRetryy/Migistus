import Head from "next/head";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Search, Filter, Eye, Heart, ShoppingCart, DollarSign, BarChart3, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useLiveAnalytics, useLiveTracking } from '../hooks/useLiveTracking';

interface Supplier {
  id: string;
  name: string;
  email: string;
  supplierCode: string;
  companyName: string;
  description: string;
  logo?: string;
  website?: string;
  rating: number;
  verified: boolean;
  status: string;
  products: number;
  totalProducts: number;
  totalVotes: number;
  totalViews: number;
  totalPledges: number;
  followers: number;
  revenue: number;
}

interface Product {
  id: number;
  name: string;
  price: number;
  votes: number;
  pledges: number;
  supplierId?: string;
  supplier?: {
    name: string;
    rating: number;
    verified: boolean;
    location: string;
  };
  supplierName?: string;
}

export default function SuppliersTrackingPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const { getAllSuppliersMetrics } = useLiveAnalytics();
  const { trackView } = useLiveTracking();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch suppliers
        const suppliersRes = await fetch(`/data/suppliers.json?t=${Date.now()}`);
        const suppliersData = await suppliersRes.json();
        
        // Fetch products
        const productsRes = await fetch(`/data/products.json?t=${Date.now()}`);
        const productsData = await productsRes.json();
        
        // Get live tracking metrics for all suppliers
        const liveMetrics = await getAllSuppliersMetrics();
        
        // Create a metrics map for quick lookup
        const metricsMap = new Map();
        liveMetrics.forEach((metric: any) => {
          metricsMap.set(metric.supplierId, metric);
        });
        
        // Enhance suppliers with live tracking data
        const enhancedSuppliers = suppliersData.map((supplier: any) => {
          const liveData = metricsMap.get(supplier.id) || {
            totalViews: 0,
            totalVotes: 0,
            totalPledges: 0,
            totalFollows: 0,
            uniqueUsers: 0
          };
          
          // Find products for this supplier
          const supplierProducts = productsData.filter((product: any) => 
            product.supplierId === supplier.id
          );
          
          // Calculate revenue from live pledge data and product prices
          const revenue = supplierProducts.reduce((total: number, product: any) => {
            const productPledges = liveData.totalPledges > 0 ? 
              Math.floor(liveData.totalPledges / Math.max(supplierProducts.length, 1)) : 0;
            return total + (productPledges * (product.price || 0));
          }, 0);
          
          return {
            ...supplier,
            name: supplier.companyName,
            products: supplierProducts.length,
            totalProducts: supplierProducts.length,
            totalVotes: liveData.totalVotes,
            totalViews: liveData.totalViews,
            totalPledges: liveData.totalPledges,
            followers: liveData.totalFollows,
            revenue: revenue,
            rating: supplier.rating || 4.5,
            verified: supplier.verified || true,
            status: 'active'
          };
        });
        
        setSuppliers(enhancedSuppliers);
        setProducts(productsData);
        
        // Track page view
        trackView({
          metadata: { page: 'suppliers-tracking' }
        });
        
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [getAllSuppliersMetrics, trackView]);

  // Filter suppliers based on search term
  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'suspended':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleSupplierClick = (supplierId: string) => {
    // Track supplier view
    trackView({
      supplierId,
      metadata: { source: 'suppliers_tracking_page' }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black flex items-center justify-center">
        <div className="text-yellow-400 text-xl">Loading live supplier data...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Live Supplier Tracking - MIGISTUS</title>
        <meta name="description" content="Track live supplier performance, metrics, and engagement in real-time" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white">
        {/* Header */}
        <div className="bg-zinc-900/50 border-b border-yellow-500/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">              <div className="flex items-center gap-4">
                <Link href="/suppliers" className="text-yellow-400 hover:text-yellow-300">
                  ← Back to Suppliers
                </Link>
                <h1 className="text-2xl font-bold text-white">Live Supplier Tracking</h1>
              </div>
              <div className="flex items-center gap-4">
                <Link href="/admin/supplier-applications" className="text-zinc-400 hover:text-white transition-colors text-sm">
                  Admin: Applications
                </Link>
                <div className="flex items-center gap-2 text-sm text-green-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Live Data</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Search and Filters */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search suppliers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:border-yellow-500 focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-zinc-900/50 border border-yellow-500/20 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-sm">Total Suppliers</p>
                  <p className="text-2xl font-bold text-white">{suppliers.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </div>
            
            <div className="bg-zinc-900/50 border border-yellow-500/20 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-sm">Total Products</p>
                  <p className="text-2xl font-bold text-white">
                    {suppliers.reduce((sum, s) => sum + s.products, 0)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </div>
            
            <div className="bg-zinc-900/50 border border-yellow-500/20 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-sm">Total Revenue</p>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(suppliers.reduce((sum, s) => sum + s.revenue, 0))}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-yellow-400" />
                </div>
              </div>
            </div>
            
            <div className="bg-zinc-900/50 border border-yellow-500/20 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-sm">Total Followers</p>
                  <p className="text-2xl font-bold text-white">
                    {suppliers.reduce((sum, s) => sum + s.followers, 0)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Heart className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Suppliers Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredSuppliers.map((supplier) => (
              <div
                key={supplier.id}
                className="bg-zinc-900/50 border border-yellow-500/20 rounded-lg p-6 hover:border-yellow-500/40 transition-all cursor-pointer"
                onClick={() => handleSupplierClick(supplier.id)}
              >
                {/* Supplier Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden">
                      <img
                        src={supplier.logo || '/Icons/SupplierPlaceHolder.png'}
                        alt={`${supplier.name} logo`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{supplier.name}</h3>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(supplier.status)}
                        <span className="text-xs text-zinc-400 capitalize">{supplier.status}</span>
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/supplier/${supplier.name.toLowerCase().replace(/\s+/g, '-')}`}
                    className="text-yellow-400 hover:text-yellow-300 text-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View Profile →
                  </Link>
                </div>

                {/* Live Metrics */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-400">{supplier.totalViews}</p>
                    <p className="text-xs text-zinc-400">Live Views</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-400">{supplier.totalVotes}</p>
                    <p className="text-xs text-zinc-400">Live Votes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-400">{supplier.totalPledges}</p>
                    <p className="text-xs text-zinc-400">Live Pledges</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-400">{supplier.followers}</p>
                    <p className="text-xs text-zinc-400">Followers</p>
                  </div>
                </div>

                {/* Performance Summary */}
                <div className="border-t border-zinc-700 pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-zinc-400">Products</span>
                    <span className="text-white font-medium">{supplier.products}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-zinc-400">Revenue</span>
                    <span className="text-white font-medium">{formatCurrency(supplier.revenue)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-zinc-400">Rating</span>
                    <div className="flex items-center gap-1">
                      <span className="text-white font-medium">{supplier.rating.toFixed(1)}</span>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-3 h-3 ${
                              i < Math.floor(supplier.rating) ? 'text-yellow-400' : 'text-zinc-600'
                            }`}
                          >
                            ★
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredSuppliers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-zinc-400">No suppliers found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
