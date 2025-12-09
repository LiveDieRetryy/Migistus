import Head from "next/head";
import { useState, useEffect } from "react";
import { 
  Clock, Crown, Settings, Plus, Edit3, Trash2, Eye, Calendar, Timer, Zap, 
  Shield, Award, DollarSign, TrendingUp, Users, Package, Star, AlertCircle,
  CheckCircle, XCircle, BarChart3, Sparkles, Target, Wallet
} from "lucide-react";
import MainNavbar from "@/components/nav/MainNavbar";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import Link from "next/link";
import { getProductUrl } from "@/utils/productUtils";

type Product = {
  id: number;
  name: string;
  image: string;
  description: string;
  goal: number;
  link: string;
  timeframe: string;
  category: string;
  votes: number;
  featured: boolean;
  pledges: number;
  slug?: string;
  pricingTiers?: any[];
  supplier?: {
    id: string;
    name: string;
    verified: boolean;
  };
  staffPick?: {
    id: number;
    isStaffPick: boolean;
    pickDate: string;
    dropStartDate: string;
    dropEndDate: string;
    limitedQuantity?: number;
    staffNote?: string;
    priority: number;
    revenue?: number;
    supplierPaid?: boolean;
    supplierFee?: number;
  };
};

type AnalyticsData = {
  totalRevenue: number;
  totalSupplierFees: number;
  activeDropsCount: number;
  totalDropsCount: number;
  averageRevenue: number;
};

export default function StaffPicksPage() {
  const { user, isAuthenticated } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [staffPicks, setStaffPicks] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showPickModal, setShowPickModal] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalRevenue: 0,
    totalSupplierFees: 0,
    activeDropsCount: 0,
    totalDropsCount: 0,
    averageRevenue: 0
  });
  const [activeTab, setActiveTab] = useState<'live' | 'upcoming' | 'all'>('live');

  // Form state for creating staff picks
  const [pickForm, setPickForm] = useState({
    dropStartDate: '',
    dropEndDate: '',
    limitedQuantity: '',
    staffNote: '',
    priority: 1,
    supplierPaid: false,
    supplierFee: ''
  });

  useEffect(() => {
    fetchData();
    checkAdminStatus();
  }, [user]);
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch products
      const productsResponse = await fetch("/api/products");
      const productsData = await productsResponse.json();
      
      // Fetch staff picks
      const staffPicksResponse = await fetch("/api/staff-picks");
      const staffPicksData = await staffPicksResponse.json();
      
      if (Array.isArray(productsData.products)) {
        setProducts(productsData.products);
        
        // Merge products with staff pick data
        const productsWithStaffPicks = productsData.products.map((product: Product) => {
          const staffPick = staffPicksData.find((pick: any) => pick.productId === product.id && pick.isActive);
          return staffPick ? {
            ...product,
            staffPick: {
              id: staffPick.id,
              isStaffPick: true,
              pickDate: staffPick.pickDate,
              dropStartDate: staffPick.dropStartDate,
              dropEndDate: staffPick.dropEndDate,
              limitedQuantity: staffPick.limitedQuantity,
              staffNote: staffPick.staffNote,
              priority: staffPick.priority,
              revenue: staffPick.revenue || 0,
              supplierPaid: staffPick.supplierPaid || false,
              supplierFee: staffPick.supplierFee || 0
            }
          } : product;
        });
        
        // Filter staff picks
        const picks = productsWithStaffPicks.filter((p: Product) => 
          p.staffPick?.isStaffPick
        );
        setStaffPicks(picks.sort((a: Product, b: Product) => 
          (a.staffPick?.priority || 999) - (b.staffPick?.priority || 999)
        ));

        // Calculate analytics
        const totalRevenue = staffPicksData.reduce((sum: number, pick: any) => 
          sum + (pick.revenue || 0), 0
        );
        const totalSupplierFees = staffPicksData.reduce((sum: number, pick: any) => 
          sum + (pick.supplierFee || 0), 0
        );
        const activeDrops = picks.filter((p: Product) => 
          p.staffPick && isDropActive(p.staffPick.dropStartDate, p.staffPick.dropEndDate)
        );

        setAnalytics({
          totalRevenue,
          totalSupplierFees,
          activeDropsCount: activeDrops.length,
          totalDropsCount: staffPicksData.length,
          averageRevenue: staffPicksData.length > 0 ? totalRevenue / staffPicksData.length : 0
        });
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };
  const checkAdminStatus = () => {
    // Check if user is admin (simplified check - you can modify this logic based on your auth system)
    if (user && (user.email?.includes('admin') || user.username?.toLowerCase().includes('admin'))) {
      setIsAdmin(true);
    }
  };
  const handleCreateStaffPick = async () => {
    if (!selectedProduct || !user) return;

    const staffPickData = {
      productId: selectedProduct.id,
      dropStartDate: pickForm.dropStartDate,
      dropEndDate: pickForm.dropEndDate,
      limitedQuantity: pickForm.limitedQuantity ? parseInt(pickForm.limitedQuantity) : undefined,
      staffNote: pickForm.staffNote,
      priority: pickForm.priority,
      createdBy: user.username || user.email,
      supplierPaid: pickForm.supplierPaid,
      supplierFee: pickForm.supplierFee ? parseFloat(pickForm.supplierFee) : 0
    };

    try {
      const response = await fetch("/api/staff-picks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(staffPickData),
      });

      if (response.ok) {
        await fetchData();
        setPickForm({
          dropStartDate: '',
          dropEndDate: '',
          limitedQuantity: '',
          staffNote: '',
          priority: 1,
          supplierPaid: false,
          supplierFee: ''
        });
        setSelectedProduct(null);
        setShowPickModal(false);
      } else {
        console.error("Failed to create staff pick");
      }
    } catch (error) {
      console.error("Failed to create staff pick:", error);
    }
  };
  const handleRemoveStaffPick = async (productId: number) => {
    try {
      const response = await fetch(`/api/staff-picks?productId=${productId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Refresh data to show the updated staff picks
        await fetchData();
        console.log("Staff pick removed for product:", productId);
      } else {
        console.error("Failed to remove staff pick");
      }
    } catch (error) {
      console.error("Failed to remove staff pick:", error);
    }
  };

  const getTimeRemaining = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return "Ended";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  };

  const isDropActive = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    return now >= start && now <= end;
  };

  const getFilteredPicks = () => {
    const now = new Date();
    
    switch (activeTab) {
      case 'live':
        return staffPicks.filter(p => 
          p.staffPick && isDropActive(p.staffPick.dropStartDate, p.staffPick.dropEndDate)
        );
      case 'upcoming':
        return staffPicks.filter(p => 
          p.staffPick && new Date(p.staffPick.dropStartDate) > now
        );
      case 'all':
      default:
        return staffPicks;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black flex items-center justify-center">
        <div className="text-yellow-400 text-xl">Loading Staff Picks...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Staff Picks - MIGISTUS | Curated Limited Drops</title>
        <meta name="description" content="Discover hand-picked products by our team. Limited time drops with exclusive pricing." />
      </Head>
      
      <MainNavbar />
      
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white">
        {/* Hero Section */}
        <div className="relative overflow-hidden pt-8 pb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/10 via-transparent to-purple-900/10" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(234,179,8,0.1),transparent_50%)]" />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-yellow-500/50">
                    <Sparkles className="w-12 h-12 text-black" />
                  </div>
                  <Crown className="w-10 h-10 text-yellow-300 absolute -top-4 -right-4 drop-shadow-lg" />
                </div>
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-4">
                <span className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text text-transparent">
                  Staff Picks
                </span>
              </h1>
              <p className="text-xl text-zinc-300 max-w-3xl mx-auto leading-relaxed mb-6">
                Hand-selected products personally curated by our team. Discover items we believe in and think you'll love.
              </p>

              {/* Stats Bar for Public */}
              {!isAdmin && (
                <div className="flex flex-wrap justify-center gap-6 mb-8">
                  <div className="flex items-center space-x-2 px-6 py-3 bg-zinc-800/50 border border-yellow-500/30 rounded-xl">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    <div>
                      <div className="text-2xl font-bold text-yellow-400">{analytics.activeDropsCount}</div>
                      <div className="text-xs text-zinc-400">Live Now</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 px-6 py-3 bg-zinc-800/50 border border-purple-500/30 rounded-xl">
                    <Star className="w-5 h-5 text-purple-400" />
                    <div>
                      <div className="text-2xl font-bold text-purple-400">{staffPicks.length}</div>
                      <div className="text-xs text-zinc-400">Featured Products</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Admin Analytics Dashboard */}
              {isAdmin && (
                <div className="max-w-6xl mx-auto mb-8">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <DollarSign className="w-5 h-5 text-green-400" />
                        <span className="text-xs text-zinc-400">Total Revenue</span>
                      </div>
                      <div className="text-2xl font-bold text-green-400">
                        ${analytics.totalRevenue.toLocaleString()}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border border-yellow-500/30 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Wallet className="w-5 h-5 text-yellow-400" />
                        <span className="text-xs text-zinc-400">Supplier Fees</span>
                      </div>
                      <div className="text-2xl font-bold text-yellow-400">
                        ${analytics.totalSupplierFees.toLocaleString()}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Zap className="w-5 h-5 text-blue-400" />
                        <span className="text-xs text-zinc-400">Live Drops</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-400">
                        {analytics.activeDropsCount}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <BarChart3 className="w-5 h-5 text-purple-400" />
                        <span className="text-xs text-zinc-400">Total Drops</span>
                      </div>
                      <div className="text-2xl font-bold text-purple-400">
                        {analytics.totalDropsCount}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-pink-500/20 to-pink-600/10 border border-pink-500/30 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <TrendingUp className="w-5 h-5 text-pink-400" />
                        <span className="text-xs text-zinc-400">Avg Revenue</span>
                      </div>
                      <div className="text-2xl font-bold text-pink-400">
                        ${analytics.averageRevenue.toFixed(0)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Admin Controls */}
              {isAdmin && (
                <div className="max-w-md mx-auto">
                  <button
                    onClick={() => setShowAdminPanel(!showAdminPanel)}
                    className="flex items-center space-x-2 mx-auto px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 rounded-xl text-white font-bold transition-all transform hover:scale-105 shadow-xl shadow-purple-500/30"
                  >
                    <Settings className="w-5 h-5" />
                    <span>{showAdminPanel ? 'Hide' : 'Show'} Control Panel</span>
                  </button>
                </div>
              )}
            </div>

            {/* Admin Panel */}
            {isAdmin && showAdminPanel && (
              <div className="max-w-6xl mx-auto mb-12 bg-zinc-900/80 backdrop-blur-sm border border-yellow-500/30 rounded-2xl p-8 shadow-2xl">
                <h3 className="text-2xl font-bold text-yellow-400 mb-6 flex items-center">
                  <Target className="w-6 h-6 mr-3" />
                  Premium Showcase Control Panel
                </h3>
                
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Available Products */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-white text-lg flex items-center">
                        <Package className="w-5 h-5 mr-2 text-blue-400" />
                        Available Products
                      </h4>
                      <div className="text-sm text-zinc-400">
                        {products.filter(p => !p.staffPick?.isStaffPick).length} available
                      </div>
                    </div>
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                      {products.filter(p => !p.staffPick?.isStaffPick).map(product => (
                        <div key={product.id} className="group bg-zinc-800/50 border border-zinc-700 hover:border-yellow-500/50 rounded-xl p-4 transition-all">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 flex-1">
                              <div className="w-16 h-16 relative rounded-lg overflow-hidden bg-zinc-700 flex-shrink-0">
                                <Image
                                  src={product.image}
                                  alt={product.name}
                                  fill
                                  className="object-cover"
                                  sizes="64px"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white font-semibold truncate">{product.name}</p>
                                <div className="flex items-center space-x-3 mt-1">
                                  <span className="text-zinc-400 text-sm flex items-center">
                                    <Users className="w-3 h-3 mr-1" />
                                    {product.votes} votes
                                  </span>
                                  {product.supplier && (
                                    <span className="text-zinc-400 text-sm truncate">
                                      {product.supplier.name}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedProduct(product);
                                setShowPickModal(true);
                              }}
                              className="ml-4 flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 rounded-lg text-black text-sm font-bold transition-all transform hover:scale-105 shadow-lg"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Feature</span>
                            </button>
                          </div>
                        </div>
                      ))}
                      {products.filter(p => !p.staffPick?.isStaffPick).length === 0 && (
                        <div className="text-center py-8 text-zinc-500">
                          <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>All products are featured</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Current Featured Products */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-white text-lg flex items-center">
                        <Star className="w-5 h-5 mr-2 text-yellow-400" />
                        Featured Products
                      </h4>
                      <div className="text-sm text-zinc-400">
                        {staffPicks.length} featured
                      </div>
                    </div>
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                      {staffPicks.map(product => {
                        const isLive = product.staffPick && isDropActive(product.staffPick.dropStartDate, product.staffPick.dropEndDate);
                        return (
                          <div key={product.id} className="group bg-zinc-800/50 border border-zinc-700 hover:border-red-500/50 rounded-xl p-4 transition-all">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4 flex-1">
                                <div className="w-16 h-16 relative rounded-lg overflow-hidden bg-zinc-700 flex-shrink-0">
                                  <Image
                                    src={product.image}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                    sizes="64px"
                                  />
                                  {isLive && (
                                    <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                                      <Zap className="w-6 h-6 text-green-400" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-white font-semibold truncate">{product.name}</p>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${isLive ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                      Priority {product.staffPick?.priority || 'N/A'}
                                    </span>
                                    {product.staffPick?.supplierPaid && (
                                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-purple-500/20 text-purple-400 flex items-center" title="Supplier paid for featured placement">
                                        <DollarSign className="w-3 h-3 mr-0.5" />
                                        ${product.staffPick.supplierFee}
                                      </span>
                                    )}
                                    {product.staffPick?.revenue && product.staffPick.revenue > 0 && (
                                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-500/20 text-green-400 flex items-center" title="Revenue generated">
                                        <TrendingUp className="w-3 h-3 mr-0.5" />
                                        ${product.staffPick.revenue}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => handleRemoveStaffPick(product.id)}
                                className="ml-4 flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-lg text-white text-sm font-bold transition-all transform hover:scale-105"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>Remove</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      {staffPicks.length === 0 && (
                        <div className="text-center py-8 text-zinc-500">
                          <Star className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>No featured products yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Filter Tabs */}
            <div className="max-w-md mx-auto mb-8">
              <div className="flex bg-zinc-800/50 border border-zinc-700 rounded-xl p-1">
                <button
                  onClick={() => setActiveTab('live')}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                    activeTab === 'live'
                      ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Zap className="w-4 h-4" />
                    <span>Live</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('upcoming')}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                    activeTab === 'upcoming'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Upcoming</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('all')}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                    activeTab === 'all'
                      ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Package className="w-4 h-4" />
                    <span>All</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Staff Picks Grid */}
            {getFilteredPicks().length > 0 ? (              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {getFilteredPicks().map((product) => {
                  const isLive = product.staffPick && isDropActive(product.staffPick.dropStartDate, product.staffPick.dropEndDate);
                  const isUpcoming = product.staffPick && new Date() < new Date(product.staffPick.dropStartDate);
                  
                  return (
                  <Link key={product.id} href={getProductUrl(product)} className="block">
                    <div className="bg-zinc-800/40 border border-zinc-700 hover:border-yellow-500/70 rounded-2xl overflow-hidden transition-all duration-300 group cursor-pointer hover:shadow-2xl hover:shadow-yellow-500/20 transform hover:scale-[1.02]">
                    {/* Product Image */}
                    <div className="relative h-56 overflow-hidden">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                      {/* Priority Badge */}
                      <div className="absolute top-4 left-4">
                        <div className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-bold shadow-xl ${
                          product.staffPick?.priority === 1
                            ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black'
                            : 'bg-gradient-to-r from-purple-500 to-purple-700 text-white'
                        }`}>
                          <Crown className="w-4 h-4" />
                          <span>Priority {product.staffPick?.priority || 1}</span>
                        </div>
                      </div>

                      {/* Drop Status */}
                      <div className="absolute top-4 right-4">
                        {isLive ? (
                          <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full text-sm font-bold shadow-xl animate-pulse">
                            <Zap className="w-4 h-4" />
                            <span>LIVE NOW</span>
                          </div>
                        ) : isUpcoming ? (
                          <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-sm font-bold shadow-xl">
                            <Calendar className="w-4 h-4" />
                            <span>Upcoming</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-zinc-600 to-zinc-700 text-white rounded-full text-sm font-bold shadow-xl">
                            <Clock className="w-4 h-4" />
                            <span>Ended</span>
                          </div>
                        )}
                      </div>


                    </div>

                    {/* Product Info */}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-yellow-400 transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-zinc-400 mb-4 line-clamp-2 text-sm">{product.description}</p>

                      {/* Staff Note */}
                      {product.staffPick?.staffNote && (
                        <div className="mb-4 p-3 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl">
                          <div className="flex items-start space-x-2">
                            <Award className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                            <p className="text-yellow-200 text-sm italic leading-relaxed">
                              "{product.staffPick.staffNote}"
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Supplier Info */}
                      {product.supplier && (
                        <div className="mb-4 flex items-center space-x-2 text-sm">
                          <div className="flex items-center space-x-1 px-3 py-1 bg-zinc-700/50 rounded-lg">
                            <Shield className="w-3 h-3 text-green-400" />
                            <span className="text-zinc-300">{product.supplier.name}</span>
                            {product.supplier.verified && (
                              <CheckCircle className="w-3 h-3 text-green-400" />
                            )}
                          </div>
                        </div>
                      )}

                      {/* Drop Info */}
                      {product.staffPick && (
                        <div className="mb-4 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-zinc-500">Drop Period:</span>
                            <span className="text-zinc-300 font-medium">
                              {new Date(product.staffPick.dropStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(product.staffPick.dropEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          
                          {isLive && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-zinc-500">Time Remaining:</span>
                              <span className="text-green-400 font-bold">
                                {getTimeRemaining(product.staffPick.dropEndDate)}
                              </span>
                            </div>
                          )}

                          {product.staffPick.limitedQuantity && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-zinc-500">Limited Supply:</span>
                              <span className="text-red-400 font-bold flex items-center">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Only {product.staffPick.limitedQuantity} available
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Stats */}
                      <div className="flex items-center justify-between mb-4 pb-4 border-b border-zinc-700">
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="text-zinc-400 flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            {product.votes}
                          </span>
                          <span className="text-zinc-400 flex items-center">
                            <Target className="w-4 h-4 mr-1" />
                            {product.pledges}
                          </span>
                        </div>
                        <div className="text-yellow-400 font-bold text-lg">
                          {product.goal}
                        </div>
                      </div>

                      {/* Action Button */}
                      <button className="w-full bg-gradient-to-r from-yellow-500 via-yellow-600 to-yellow-700 hover:from-yellow-600 hover:via-yellow-700 hover:to-yellow-800 text-black font-bold py-3.5 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-yellow-500/50 flex items-center justify-center space-x-2">
                        {isLive ? (
                          <>
                            <Zap className="w-5 h-5" />
                            <span>Join Live Drop</span>
                          </>
                        ) : isUpcoming ? (
                          <>
                            <Calendar className="w-5 h-5" />
                            <span>Notify Me</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-5 h-5" />
                            <span>View Details</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  </Link>
                );
                })}
              </div>            ) : (
              <div className="text-center py-24">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 rounded-full flex items-center justify-center">
                  <Star className="w-12 h-12 text-yellow-400/60" />
                </div>
                <h3 className="text-3xl font-bold text-zinc-400 mb-3">
                  {activeTab === 'live' && 'No Live Drops'}
                  {activeTab === 'upcoming' && 'No Upcoming Drops'}
                  {activeTab === 'all' && 'No Featured Products'}
                </h3>
                <p className="text-zinc-500 max-w-md mx-auto">
                  {activeTab === 'live' && 'Check back soon for premium product showcases and exclusive drops.'}
                  {activeTab === 'upcoming' && 'No scheduled drops at the moment. Check the All tab to see past features.'}
                  {activeTab === 'all' && 'The premium showcase is currently empty. Products will appear here when featured.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Staff Pick Creation Modal */}
        {showPickModal && selectedProduct && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-zinc-700">
                <h2 className="text-2xl font-bold text-yellow-400">
                  Create Premium Feature: {selectedProduct.name}
                </h2>
                <button
                  onClick={() => setShowPickModal(false)}
                  className="text-zinc-400 hover:text-white transition-colors text-3xl leading-none"
                >
                  ×
                </button>
              </div>
              
              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Public Display Settings */}
                <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                    <Eye className="w-5 h-5 mr-2 text-blue-400" />
                    Public Display Settings
                  </h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white font-medium mb-2">Drop Start Date</label>
                      <input
                        type="datetime-local"
                        value={pickForm.dropStartDate}
                        onChange={(e) => setPickForm({...pickForm, dropStartDate: e.target.value})}
                        className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500"
                      />
                    </div>
                    <div>
                      <label className="block text-white font-medium mb-2">Drop End Date</label>
                      <input
                        type="datetime-local"
                        value={pickForm.dropEndDate}
                        onChange={(e) => setPickForm({...pickForm, dropEndDate: e.target.value})}
                        className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-white font-medium mb-2">Limited Quantity (Optional)</label>
                      <input
                        type="number"
                        value={pickForm.limitedQuantity}
                        onChange={(e) => setPickForm({...pickForm, limitedQuantity: e.target.value})}
                        placeholder="Leave empty for unlimited"
                        className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500"
                      />
                    </div>
                    <div>
                      <label className="block text-white font-medium mb-2">Display Priority (1 = highest)</label>
                      <select
                        value={pickForm.priority}
                        onChange={(e) => setPickForm({...pickForm, priority: parseInt(e.target.value)})}
                        className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500"
                      >
                        <option value={1}>1 - Top Position</option>
                        <option value={2}>2 - High Position</option>
                        <option value={3}>3 - Medium Position</option>
                        <option value={4}>4 - Lower Position</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-white font-medium mb-2">Staff Endorsement Note (Public)</label>
                    <textarea
                      value={pickForm.staffNote}
                      onChange={(e) => setPickForm({...pickForm, staffNote: e.target.value})}
                      placeholder="Why did you pick this product? What makes it special? This will be visible to users."
                      rows={3}
                      className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                </div>

                {/* Business Settings - Internal Only */}
                <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-4">
                  <h3 className="text-lg font-bold text-purple-300 mb-4 flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Business Settings (Internal Only)
                  </h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white font-medium mb-2 flex items-center">
                        <DollarSign className="w-4 h-4 mr-1 text-green-400" />
                        Supplier Fee ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={pickForm.supplierFee}
                        onChange={(e) => setPickForm({...pickForm, supplierFee: e.target.value})}
                        placeholder="0.00"
                        className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div className="flex items-center">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pickForm.supplierPaid}
                          onChange={(e) => setPickForm({...pickForm, supplierPaid: e.target.checked})}
                          className="w-5 h-5 rounded border-zinc-600 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-white font-medium">Supplier Paid for Placement</span>
                      </label>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-purple-800/20 border border-purple-500/20 rounded-lg">
                    <p className="text-sm text-purple-200 flex items-start">
                      <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                      <span>These business metrics are for internal tracking only and will never be shown to the public.</span>
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-4 border-t border-zinc-700">
                  <button
                    onClick={() => setShowPickModal(false)}
                    className="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateStaffPick}
                    disabled={!pickForm.dropStartDate || !pickForm.dropEndDate}
                    className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 disabled:from-zinc-600 disabled:to-zinc-600 disabled:cursor-not-allowed text-black font-bold rounded-lg transition-all transform hover:scale-105 shadow-lg"
                  >
                    Create Featured Product
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
