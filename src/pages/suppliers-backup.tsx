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
  status: 'active' | 'inactive' | 'pending';
  joinedDate: string;
  contactPerson: string;
  phone: string;
  address: string;
  productCategories: string[];
  totalProducts: number;
  totalSales: number;
  rating: number;
}

interface Product {
  id: number;
  name: string;
  image: string;
  price: number;
  originalPrice?: number;
  votes: number;
  category: string;
  status?: 'active' | 'draft' | 'pending-review' | 'rejected' | 'paused';
  supplierId?: string;
  supplierName?: string;
  views?: number;
  pledges?: number;
  revenue?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface ProductMetrics {
  totalViews: number;
  totalPledges: number;
  totalRevenue: number;
  conversionRate: number;
  avgRating: number;
}

export default function SuppliersPage() {
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
      try {        // Fetch suppliers
        const suppliersRes = await fetch(`/data/suppliers.json?t=${Date.now()}`);
        const suppliersData = await suppliersRes.json();
        
        // Fetch products
        const productsRes = await fetch(`/data/products.json?t=${Date.now()}`);
        const productsData = await productsRes.json();

        // Fetch voting data for additional metrics
        const votingRes = await fetch(`/data/voting.json?t=${Date.now()}`);
        const votingData = await votingRes.json();

        // Fetch user activity data
        const userActivityRes = await fetch(`/data/user-activity.json?t=${Date.now()}`);
        const userActivityData = await userActivityRes.json();// Calculate real metrics for products based on actual data
        const enhancedProducts = productsData.map((product: any, index: number) => {
          // Only use existing supplier ID if available, don't assign random suppliers
          const existingSupplierId = product.supplierId;
          
          // Find the actual supplier by ID if it exists
          const actualSupplier = existingSupplierId ? 
            suppliersData.find((s: any) => s.id === existingSupplierId) : 
            null;
            
          // Calculate real views from user activity
          const productViews = Array.isArray(userActivityData) ? 
            userActivityData.filter((activity: any) => 
              activity.productId === product.id && activity.action === 'view'
            ).length : 0;
          
          // Use actual votes from product data
          const actualVotes = product.votes || 0;
          
          // Use actual pledges from product data
          const actualPledges = product.pledges || 0;
          
          // Calculate revenue based on pledges and price
          const revenue = actualPledges * (product.price || 0);
          
          return {
            ...product,
            status: product.status || 'active',
            supplierId: existingSupplierId || null, // Only use explicit supplier IDs
            supplierName: actualSupplier?.companyName || product.supplier?.name || null,
            views: Math.max(productViews, actualVotes * 2), // Ensure views >= votes
            pledges: actualPledges,
            revenue: revenue,
            createdAt: product.createdAt || new Date(Date.now() - (index * 24 * 60 * 60 * 1000)).toISOString(),
            updatedAt: product.updatedAt || new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          };
        });        // Calculate real metrics for suppliers
        const enhancedSuppliers = suppliersData.map((supplier: any) => {
          const supplierProducts = enhancedProducts.filter((product: any) => 
            product.supplierId === supplier.id
          );
            // Debug logging for Migistus supplier
          if (supplier.id === "1750392546366") {
            console.log("Migistus Debug:", {
              supplierId: supplier.id,
              supplierProducts: supplierProducts.map((p: any) => ({ 
                id: p.id, 
                name: p.name, 
                votes: p.votes, 
                pledges: p.pledges, 
                revenue: p.revenue 
              })),
              productCount: supplierProducts.length
            });
          }
          
          const totalProducts = supplierProducts.length;
          const totalSales = supplierProducts.reduce((sum: number, product: any) => 
            sum + (product.revenue || 0), 0
          );
          
          // Calculate rating based on product votes and pledges
          const totalVotes = supplierProducts.reduce((sum: number, product: any) => 
            sum + (product.votes || 0), 0
          );
          const totalPledges = supplierProducts.reduce((sum: number, product: any) => 
            sum + (product.pledges || 0), 0
          );
          
          // Rating formula: base 3.5 + bonus from engagement
          const engagementScore = totalProducts > 0 ? 
            Math.min(1.5, (totalVotes + totalPledges) / (totalProducts * 100)) : 0;
          const rating = Math.min(5.0, 3.5 + engagementScore);
          
          return {
            ...supplier,
            totalProducts,
            totalSales,
            rating: parseFloat(rating.toFixed(1))
          };
        });

        setSuppliers(enhancedSuppliers);
        setProducts(enhancedProducts);
      } catch (error) {
        console.error('Error fetching data:', error);
        // Fallback to basic data if fetching fails
        try {
          const suppliersRes = await fetch('/data/suppliers.json');
          const suppliersData = await suppliersRes.json();
          const productsRes = await fetch('/data/products.json');
          const productsData = await productsRes.json();
          
          setSuppliers(suppliersData);
          setProducts(productsData);
        } catch (fallbackError) {
          console.error('Fallback data fetch failed:', fallbackError);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.supplierCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSupplierProducts = (supplierId: string) => {
    return products.filter(product => product.supplierId === supplierId);
  };
  const getSupplierMetrics = (supplierId: string): ProductMetrics => {
    const supplierProducts = getSupplierProducts(supplierId);
    const totalViews = supplierProducts.reduce((sum, p) => sum + (p.views || 0), 0);
    const totalPledges = supplierProducts.reduce((sum, p) => sum + (p.pledges || 0), 0);
    const totalRevenue = supplierProducts.reduce((sum, p) => sum + (p.revenue || 0), 0);
    const totalVotes = supplierProducts.reduce((sum, p) => sum + (p.votes || 0), 0);
    
    // Calculate real rating based on product performance
    const avgRating = supplierProducts.length > 0 ? 
      Math.min(5.0, 3.5 + Math.min(1.5, (totalVotes + totalPledges) / (supplierProducts.length * 100))) : 0;
    
    return {
      totalViews,
      totalPledges,
      totalRevenue,
      conversionRate: totalViews > 0 ? (totalPledges / totalViews) * 100 : 0,
      avgRating: parseFloat(avgRating.toFixed(1))
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'draft': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'pending-review': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'rejected': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'paused': return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'draft': return <Clock className="w-4 h-4" />;
      case 'pending-review': return <AlertCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'paused': return <Clock className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-zinc-300">Loading suppliers...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Suppliers - MIGISTUS</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-300 bg-clip-text text-transparent mb-4">
              MIGISTUS Suppliers
            </h1>
            <p className="text-lg text-zinc-300 mb-6">
              Our trusted network of suppliers and their product portfolios
            </p>
            
            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link 
                href="/supplier-login"
                className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-bold rounded-lg transition-all transform hover:scale-105"
              >
                Supplier Login
              </Link>
              <Link 
                href="/supplier-registration"
                className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg border border-yellow-400/20 transition-all"
              >
                Become a Supplier
              </Link>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search suppliers by name, company, or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-zinc-900/50 border border-zinc-700 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:border-yellow-400"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 bg-zinc-900/50 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-yellow-400"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>          {/* Suppliers Grid/List */}
          {selectedSupplier ? (
            // Individual Supplier Detail View
            (() => {
              const supplier = suppliers.find(s => s.id === selectedSupplier);
              const supplierProducts = getSupplierProducts(selectedSupplier);
              const metrics = getSupplierMetrics(selectedSupplier);
              
              if (!supplier) return null;

              return (
                <div>
                  {/* Back Button */}
                  <button
                    onClick={() => setSelectedSupplier(null)}
                    className="mb-6 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-all flex items-center gap-2"
                  >
                    ← Back to Suppliers
                  </button>

                  {/* Supplier Header */}
                  <div className="bg-zinc-900/50 border border-yellow-400/20 rounded-xl p-6 mb-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <h2 className="text-2xl font-bold text-yellow-400 mb-2">{supplier.companyName}</h2>
                        <p className="text-zinc-300 mb-1">Code: {supplier.supplierCode}</p>
                        <p className="text-zinc-300 mb-1">Contact: {supplier.contactPerson}</p>
                        <p className="text-zinc-400 text-sm">Joined: {new Date(supplier.joinedDate).toLocaleDateString()}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full border text-sm font-medium ${
                        supplier.status === 'active' ? 'text-green-400 bg-green-400/10 border-green-400/20' :
                        supplier.status === 'inactive' ? 'text-red-400 bg-red-400/10 border-red-400/20' :
                        'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
                      }`}>
                        {supplier.status.charAt(0).toUpperCase() + supplier.status.slice(1)}
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-400">{supplierProducts.length}</div>
                        <div className="text-zinc-400 text-sm">Products</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">{metrics.totalViews.toLocaleString()}</div>
                        <div className="text-zinc-400 text-sm">Total Views</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400">{metrics.totalPledges.toLocaleString()}</div>
                        <div className="text-zinc-400 text-sm">Total Pledges</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-400">${metrics.totalRevenue.toLocaleString()}</div>
                        <div className="text-zinc-400 text-sm">Revenue</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-400">{metrics.conversionRate.toFixed(1)}%</div>
                        <div className="text-zinc-400 text-sm">Conversion</div>
                      </div>
                    </div>
                  </div>

                  {/* Products List */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-white">Products ({supplierProducts.length})</h3>
                    {supplierProducts.length === 0 ? (
                      <div className="text-center py-12 text-zinc-400">
                        <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No products found for this supplier</p>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {supplierProducts.map((product) => (
                          <div key={product.id} className="bg-zinc-900/50 border border-zinc-700 rounded-xl p-4 hover:border-yellow-400/20 transition-all">
                            <div className="flex flex-col md:flex-row gap-4">
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-full md:w-20 h-20 object-cover rounded-lg"
                              />
                              <div className="flex-1">
                                <div className="flex flex-col md:flex-row justify-between items-start gap-2">
                                  <div>
                                    <h4 className="font-semibold text-white">{product.name}</h4>
                                    <p className="text-zinc-400 text-sm">{product.category}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className={`px-2 py-1 rounded-full border text-xs font-medium flex items-center gap-1 ${getStatusColor(product.status || 'draft')}`}>
                                        {getStatusIcon(product.status || 'draft')}
                                        {product.status || 'draft'}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-lg font-bold text-yellow-400">${product.price}</div>
                                    {product.originalPrice && product.originalPrice > product.price && (
                                      <div className="text-sm text-zinc-400 line-through">${product.originalPrice}</div>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Product Metrics */}
                                <div className="grid grid-cols-4 gap-4 mt-3 pt-3 border-t border-zinc-700">
                                  <div className="text-center">
                                    <div className="flex items-center justify-center gap-1 text-zinc-400">
                                      <Eye className="w-4 h-4" />
                                      <span className="text-sm">{product.views?.toLocaleString() || 0}</span>
                                    </div>
                                  </div>
                                  <div className="text-center">
                                    <div className="flex items-center justify-center gap-1 text-zinc-400">
                                      <Heart className="w-4 h-4" />
                                      <span className="text-sm">{product.votes?.toLocaleString() || 0}</span>
                                    </div>
                                  </div>
                                  <div className="text-center">
                                    <div className="flex items-center justify-center gap-1 text-zinc-400">
                                      <ShoppingCart className="w-4 h-4" />
                                      <span className="text-sm">{product.pledges?.toLocaleString() || 0}</span>
                                    </div>
                                  </div>
                                  <div className="text-center">
                                    <div className="flex items-center justify-center gap-1 text-zinc-400">
                                      <DollarSign className="w-4 h-4" />
                                      <span className="text-sm">${product.revenue?.toLocaleString() || 0}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()
          ) : (
            // Suppliers Overview
            <div>
              {filteredSuppliers.length === 0 ? (
                <div className="text-center py-12 text-zinc-400">
                  <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No suppliers found matching your search</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {filteredSuppliers.map((supplier) => {
                    const supplierProducts = getSupplierProducts(supplier.id);
                    const metrics = getSupplierMetrics(supplier.id);
                    
                    return (                      <div
                        key={supplier.id}
                        className="bg-zinc-900/50 border border-zinc-700 rounded-xl p-6 hover:border-yellow-400/20 transition-all"
                      >
                        <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="text-xl font-bold text-yellow-400">{supplier.companyName}</h3>
                                  <Link 
                                    href={`/supplier/${supplier.companyName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]/g, '')}`}
                                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition"
                                  >
                                    View Profile
                                  </Link>
                                </div>
                                <p className="text-zinc-300 mb-1">Contact: {supplier.contactPerson}</p>
                                <p className="text-zinc-400 text-sm">Code: {supplier.supplierCode}</p>
                                <p className="text-zinc-400 text-sm">Joined: {new Date(supplier.joinedDate).toLocaleDateString()}</p>
                              </div>
                              <div className={`px-3 py-1 rounded-full border text-sm font-medium ${
                                supplier.status === 'active' ? 'text-green-400 bg-green-400/10 border-green-400/20' :
                                supplier.status === 'inactive' ? 'text-red-400 bg-red-400/10 border-red-400/20' :
                                'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
                              }`}>
                                {supplier.status.charAt(0).toUpperCase() + supplier.status.slice(1)}
                              </div>
                            </div>

                            {/* Categories */}
                            <div className="flex flex-wrap gap-2 mb-4">
                              {supplier.productCategories.map((category, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-zinc-800 text-zinc-300 rounded-full text-xs"
                                >
                                  {category}
                                </span>
                              ))}
                            </div>

                            {/* Quick Metrics */}
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                              <div className="text-center">
                                <div className="text-lg font-bold text-yellow-400">{supplierProducts.length}</div>
                                <div className="text-zinc-400 text-xs">Products</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-bold text-green-400">{metrics.totalViews.toLocaleString()}</div>
                                <div className="text-zinc-400 text-xs">Views</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-bold text-blue-400">{metrics.totalPledges.toLocaleString()}</div>
                                <div className="text-zinc-400 text-xs">Pledges</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-bold text-purple-400">${metrics.totalRevenue.toLocaleString()}</div>
                                <div className="text-zinc-400 text-xs">Revenue</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-bold text-orange-400">★ {metrics.avgRating.toFixed(1)}</div>
                                <div className="text-zinc-400 text-xs">Rating</div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-zinc-400">
                            <TrendingUp className="w-5 h-5" />
                            <span className="text-sm">View Details</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Partnership Information Section */}
          {!selectedSupplier && (
            <div className="mt-12 bg-zinc-900/70 rounded-xl border border-yellow-400/20 shadow-lg p-8">
              <h2 className="text-yellow-400 text-3xl font-bold mb-4 text-center">Partner With MIGISTUS</h2>
              <p className="text-zinc-300 mb-6 text-lg text-center">
                Join our network of trusted suppliers and reach a community of engaged customers
              </p>
              
              {/* Benefits Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-zinc-900/50 border border-yellow-400/20 rounded-xl p-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-600 rounded-lg flex items-center justify-center mb-4">
                    <span className="text-white font-bold text-xl">🎯</span>
                  </div>
                  <h3 className="text-xl font-bold text-yellow-400 mb-2">Targeted Audience</h3>
                  <p className="text-zinc-300">
                    Reach customers who are actively looking for quality products and are willing to participate in group buying.
                  </p>
                </div>

                <div className="bg-zinc-900/50 border border-yellow-400/20 rounded-xl p-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg flex items-center justify-center mb-4">
                    <span className="text-white font-bold text-xl">�</span>
                  </div>
                  <h3 className="text-xl font-bold text-yellow-400 mb-2">Bulk Sales</h3>
                  <p className="text-zinc-300">
                    Leverage our group buying model to move larger quantities and achieve better profit margins.
                  </p>
                </div>

                <div className="bg-zinc-900/50 border border-yellow-400/20 rounded-xl p-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                    <span className="text-white font-bold text-xl">🔥</span>
                  </div>
                  <h3 className="text-xl font-bold text-yellow-400 mb-2">Live Drops</h3>
                  <p className="text-zinc-300">
                    Create excitement with time-limited product drops that generate buzz and drive quick sales.
                  </p>
                </div>
              </div>

              {/* Contact Section */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="text-left">
                  <h3 className="text-yellow-400 font-semibold mb-2">Partnership Inquiries</h3>
                  <p className="text-zinc-300 mb-2">
                    Email: <a href="mailto:suppliers@migistus.com" className="text-yellow-400 underline hover:text-yellow-300">suppliers@migistus.com</a>
                  </p>
                  <p className="text-zinc-400 text-sm">
                    Include your company name, product catalog, and business goals
                  </p>
                </div>
                
                <div className="text-left">
                  <h3 className="text-yellow-400 font-semibold mb-2">Existing Suppliers</h3>
                  <p className="text-zinc-300 mb-2">
                    Access your supplier dashboard to manage products and view analytics
                  </p>
                  <Link 
                    href="/supplier-login"
                    className="inline-block px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-medium rounded-lg transition-all text-sm"
                  >
                    Login to Dashboard
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
