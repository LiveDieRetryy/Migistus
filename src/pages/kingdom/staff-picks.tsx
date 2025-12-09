import Head from "next/head";
import { useState, useEffect } from "react";
import { 
  DollarSign, TrendingUp, Package, Star, Eye, Calendar, 
  BarChart3, Wallet, Target, Zap, Award, Shield, Users,
  CheckCircle, XCircle, Clock, Edit3, Trash2, Plus, AlertCircle,
  Crown, Sparkles, Activity
} from "lucide-react";
import KingdomNav from "@/components/nav/KingdomNav";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import { useRouter } from "next/router";

type Product = {
  id: number;
  name: string;
  image: string;
  description: string;
  votes: number;
  pledges: number;
  supplier?: {
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
  totalPaidPlacements: number;
  revenueGrowth: number;
};

export default function KingdomStaffPicksPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [staffPicks, setStaffPicks] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalRevenue: 0,
    totalSupplierFees: 0,
    activeDropsCount: 0,
    totalDropsCount: 0,
    averageRevenue: 0,
    totalPaidPlacements: 0,
    revenueGrowth: 12.5 // Mock growth percentage
  });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showPickModal, setShowPickModal] = useState(false);
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
    // Check admin access
    if (!user || (!user.email?.includes('admin') && !user.username?.toLowerCase().includes('admin'))) {
      router.push('/staff-picks');
      return;
    }
    fetchData();
  }, [user, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [productsRes, staffPicksRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/staff-picks")
      ]);
      
      const productsData = await productsRes.json();
      const staffPicksData = await staffPicksRes.json();
      
      if (Array.isArray(productsData.products)) {
        setProducts(productsData.products);
        
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
        
        const picks = productsWithStaffPicks.filter((p: Product) => p.staffPick?.isStaffPick);
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
        const paidPlacements = staffPicksData.filter((pick: any) => pick.supplierPaid).length;
        const now = new Date();
        const activeDrops = picks.filter((p: Product) => {
          if (!p.staffPick) return false;
          const start = new Date(p.staffPick.dropStartDate);
          const end = new Date(p.staffPick.dropEndDate);
          return now >= start && now <= end;
        });

        setAnalytics({
          totalRevenue,
          totalSupplierFees,
          activeDropsCount: activeDrops.length,
          totalDropsCount: staffPicksData.length,
          averageRevenue: staffPicksData.length > 0 ? totalRevenue / staffPicksData.length : 0,
          totalPaidPlacements: paidPlacements,
          revenueGrowth: 12.5
        });
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
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
        await fetchData();
      }
    } catch (error) {
      console.error("Failed to remove staff pick:", error);
    }
  };

  const isDropActive = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    return now >= start && now <= end;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black flex items-center justify-center">
        <div className="text-yellow-400 text-xl">Loading Kingdom Staff Picks...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Staff Picks Manager - Kingdom Dashboard</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      
      <KingdomNav />
      
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center">
                <Crown className="w-8 h-8 text-black" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                  Staff Picks Manager
                </h1>
                <p className="text-zinc-400">Manage premium placements and track revenue</p>
              </div>
            </div>
          </div>

          {/* Analytics Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
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

            <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/30 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Sparkles className="w-5 h-5 text-orange-400" />
                <span className="text-xs text-zinc-400">Paid Placements</span>
              </div>
              <div className="text-2xl font-bold text-orange-400">
                {analytics.totalPaidPlacements}
              </div>
            </div>
          </div>

          {/* Management Grid */}
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Available Products */}
            <div className="bg-zinc-900/50 border border-zinc-700 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <Package className="w-5 h-5 mr-2 text-blue-400" />
                  Available Products
                </h2>
                <div className="text-sm text-zinc-400">
                  {products.filter(p => !p.staffPick?.isStaffPick).length} available
                </div>
              </div>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {products.filter(p => !p.staffPick?.isStaffPick).map(product => (
                  <div key={product.id} className="bg-zinc-800/50 border border-zinc-700 hover:border-yellow-500/50 rounded-xl p-4 transition-all">
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
                        className="ml-4 flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 rounded-lg text-black text-sm font-bold transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Feature</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Featured Products */}
            <div className="bg-zinc-900/50 border border-zinc-700 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <Star className="w-5 h-5 mr-2 text-yellow-400" />
                  Featured Products
                </h2>
                <div className="text-sm text-zinc-400">
                  {staffPicks.length} featured
                </div>
              </div>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {staffPicks.map(product => {
                  const isLive = product.staffPick && isDropActive(product.staffPick.dropStartDate, product.staffPick.dropEndDate);
                  return (
                    <div key={product.id} className="bg-zinc-800/50 border border-zinc-700 hover:border-red-500/50 rounded-xl p-4 transition-all">
                      <div className="flex items-center justify-between mb-3">
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
                            <div className="flex items-center space-x-2 mt-1 flex-wrap gap-1">
                              <span className={`px-2 py-0.5 rounded text-xs font-bold ${isLive ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                Priority {product.staffPick?.priority}
                              </span>
                              {product.staffPick?.supplierPaid && (
                                <span className="px-2 py-0.5 rounded text-xs font-bold bg-purple-500/20 text-purple-400">
                                  Paid ${product.staffPick.supplierFee}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveStaffPick(product.id)}
                          className="ml-4 flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-lg text-white text-sm font-bold transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Remove</span>
                        </button>
                      </div>
                      
                      {/* Business Metrics */}
                      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-zinc-700">
                        <div className="text-xs">
                          <span className="text-zinc-500">Revenue:</span>
                          <span className="text-green-400 font-bold ml-1">
                            ${product.staffPick?.revenue || 0}
                          </span>
                        </div>
                        <div className="text-xs">
                          <span className="text-zinc-500">Status:</span>
                          <span className={`ml-1 font-bold ${isLive ? 'text-green-400' : 'text-zinc-400'}`}>
                            {isLive ? 'Live' : 'Ended'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Create Modal */}
        {showPickModal && selectedProduct && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-zinc-700">
                <h2 className="text-2xl font-bold text-yellow-400">
                  Create Premium Feature: {selectedProduct.name}
                </h2>
                <button
                  onClick={() => setShowPickModal(false)}
                  className="text-zinc-400 hover:text-white transition-colors text-3xl"
                >
                  ×
                </button>
              </div>
              
              <div className="p-6 space-y-6">
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

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-white font-medium mb-2">Limited Quantity</label>
                    <input
                      type="number"
                      value={pickForm.limitedQuantity}
                      onChange={(e) => setPickForm({...pickForm, limitedQuantity: e.target.value})}
                      placeholder="Unlimited"
                      className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2">Priority</label>
                    <select
                      value={pickForm.priority}
                      onChange={(e) => setPickForm({...pickForm, priority: parseInt(e.target.value)})}
                      className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500"
                    >
                      <option value={1}>1 - Top</option>
                      <option value={2}>2 - High</option>
                      <option value={3}>3 - Medium</option>
                      <option value={4}>4 - Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2">Supplier Fee ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={pickForm.supplierFee}
                      onChange={(e) => setPickForm({...pickForm, supplierFee: e.target.value})}
                      placeholder="0.00"
                      className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pickForm.supplierPaid}
                      onChange={(e) => setPickForm({...pickForm, supplierPaid: e.target.checked})}
                      className="w-5 h-5 rounded border-zinc-600"
                    />
                    <span className="text-white font-medium">Supplier Paid for Placement</span>
                  </label>
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Staff Note (Public)</label>
                  <textarea
                    value={pickForm.staffNote}
                    onChange={(e) => setPickForm({...pickForm, staffNote: e.target.value})}
                    placeholder="Why we picked this product..."
                    rows={3}
                    className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>

                <div className="flex justify-end space-x-4 pt-4 border-t border-zinc-700">
                  <button
                    onClick={() => setShowPickModal(false)}
                    className="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateStaffPick}
                    disabled={!pickForm.dropStartDate || !pickForm.dropEndDate}
                    className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 disabled:from-zinc-600 disabled:to-zinc-600 text-black font-bold rounded-lg transition-all"
                  >
                    Create Feature
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
