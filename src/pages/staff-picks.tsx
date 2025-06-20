import Head from "next/head";
import { useState, useEffect } from "react";
import { Clock, Crown, Settings, Plus, Edit3, Trash2, Eye, Calendar, Timer, Zap, Shield, Award } from "lucide-react";
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
  staffPick?: {
    isStaffPick: boolean;
    pickDate: string;
    dropStartDate: string;
    dropEndDate: string;
    limitedQuantity?: number;
    staffNote?: string;
    priority: number; // 1 = highest priority
  };
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

  // Form state for creating staff picks
  const [pickForm, setPickForm] = useState({
    dropStartDate: '',
    dropEndDate: '',
    limitedQuantity: '',
    staffNote: '',
    priority: 1
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
              isStaffPick: true,
              pickDate: staffPick.pickDate,
              dropStartDate: staffPick.dropStartDate,
              dropEndDate: staffPick.dropEndDate,
              limitedQuantity: staffPick.limitedQuantity,
              staffNote: staffPick.staffNote,
              priority: staffPick.priority
            }
          } : product;
        });
        
        // Filter staff picks - products with staffPick data or featured products
        const picks = productsWithStaffPicks.filter((p: Product) => 
          p.staffPick?.isStaffPick || p.featured
        );
        setStaffPicks(picks.sort((a: Product, b: Product) => 
          (a.staffPick?.priority || 999) - (b.staffPick?.priority || 999)
        ));
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
      createdBy: user.username || user.email
    };

    try {
      const response = await fetch("/api/staff-picks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(staffPickData),
      });

      if (response.ok) {
        // Refresh data to show the new staff pick
        await fetchData();

        // Reset form and close modal
        setPickForm({
          dropStartDate: '',
          dropEndDate: '',
          limitedQuantity: '',
          staffNote: '',
          priority: 1
        });
        setSelectedProduct(null);
        setShowPickModal(false);

        console.log("Staff pick created successfully");
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
        <div className="relative overflow-hidden pt-8 pb-16">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/10 via-transparent to-purple-900/10" />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">            <div className="text-center mb-12">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <Image
                    src="/Icons/subsribers.png"
                    alt="Staff Picks"
                    width={96}
                    height={96}
                    className="text-yellow-400"
                  />
                  <Crown className="w-8 h-8 text-yellow-300 absolute -top-3 -right-3" />
                </div>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
                <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                  Staff Picks
                </span>
              </h1>
              <p className="text-xl text-zinc-300 max-w-3xl mx-auto leading-relaxed mb-8">
                Carefully curated products selected by our team. Limited time drops with exclusive group buying power.
              </p>

              {/* Admin Controls */}
              {isAdmin && (
                <div className="max-w-md mx-auto">
                  <button
                    onClick={() => setShowAdminPanel(!showAdminPanel)}
                    className="flex items-center space-x-2 mx-auto px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl text-white font-medium transition-colors"
                  >
                    <Settings className="w-5 h-5" />
                    <span>Admin Panel</span>
                  </button>
                </div>
              )}
            </div>

            {/* Admin Panel */}
            {isAdmin && showAdminPanel && (
              <div className="max-w-4xl mx-auto mb-12 bg-zinc-800/50 border border-zinc-700 rounded-xl p-6">
                <h3 className="text-xl font-bold text-yellow-400 mb-4 flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Admin: Manage Staff Picks
                </h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-white mb-3">Available Products</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {products.filter(p => !p.staffPick?.isStaffPick).map(product => (
                        <div key={product.id} className="flex items-center justify-between p-3 bg-zinc-700/50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 relative rounded-lg overflow-hidden bg-zinc-600">
                              <Image
                                src={product.image}
                                alt={product.name}
                                fill
                                className="object-cover"
                                sizes="40px"
                              />
                            </div>
                            <div>
                              <p className="text-white font-medium">{product.name}</p>
                              <p className="text-zinc-400 text-sm">{product.votes} votes</p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedProduct(product);
                              setShowPickModal(true);
                            }}
                            className="flex items-center space-x-1 px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-black text-sm font-medium transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Pick</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-white mb-3">Current Staff Picks</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {staffPicks.map(product => (
                        <div key={product.id} className="flex items-center justify-between p-3 bg-zinc-700/50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 relative rounded-lg overflow-hidden bg-zinc-600">
                              <Image
                                src={product.image}
                                alt={product.name}
                                fill
                                className="object-cover"
                                sizes="40px"
                              />
                            </div>
                            <div>
                              <p className="text-white font-medium">{product.name}</p>
                              <p className="text-yellow-400 text-sm">Priority: {product.staffPick?.priority || 'N/A'}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveStaffPick(product.id)}
                            className="flex items-center space-x-1 px-3 py-1 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm font-medium transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Remove</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Staff Picks Grid */}
            {staffPicks.length > 0 ? (              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {staffPicks.map((product) => (
                  <Link key={product.id} href={getProductUrl(product)} className="block">
                    <div className="bg-zinc-800/30 border border-zinc-700 rounded-xl overflow-hidden hover:border-yellow-500/50 transition-all duration-300 group cursor-pointer">
                    {/* Product Image */}
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />                      {/* Staff Pick Badge */}
                      <div className="absolute top-4 left-4">
                        <div className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 text-black rounded-full text-sm font-bold">
                          <Image
                            src="/Icons/subsribers.png"
                            alt="Staff Pick"
                            width={20}
                            height={20}
                          />
                          <span>Staff Pick</span>
                        </div>
                      </div>

                      {/* Drop Status */}
                      {product.staffPick && (
                        <div className="absolute top-4 right-4">
                          {isDropActive(product.staffPick.dropStartDate, product.staffPick.dropEndDate) ? (
                            <div className="flex items-center space-x-1 px-3 py-1 bg-green-500 text-white rounded-full text-sm font-bold">
                              <Zap className="w-4 h-4" />
                              <span>Live Drop</span>
                            </div>
                          ) : new Date() < new Date(product.staffPick.dropStartDate) ? (
                            <div className="flex items-center space-x-1 px-3 py-1 bg-blue-500 text-white rounded-full text-sm font-bold">
                              <Calendar className="w-4 h-4" />
                              <span>Upcoming</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1 px-3 py-1 bg-zinc-500 text-white rounded-full text-sm font-bold">
                              <Clock className="w-4 h-4" />
                              <span>Ended</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-white mb-2">{product.name}</h3>
                      <p className="text-zinc-400 mb-4 line-clamp-2">{product.description}</p>

                      {/* Staff Note */}
                      {product.staffPick?.staffNote && (
                        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                          <p className="text-yellow-200 text-sm italic">
                            "{product.staffPick.staffNote}"
                          </p>
                        </div>
                      )}

                      {/* Drop Info */}
                      {product.staffPick && (
                        <div className="mb-4 space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-zinc-400">Drop Period:</span>
                            <span className="text-white">
                              {new Date(product.staffPick.dropStartDate).toLocaleDateString()} - {new Date(product.staffPick.dropEndDate).toLocaleDateString()}
                            </span>
                          </div>
                          
                          {isDropActive(product.staffPick.dropStartDate, product.staffPick.dropEndDate) && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-zinc-400">Time Remaining:</span>
                              <span className="text-yellow-400 font-medium">
                                {getTimeRemaining(product.staffPick.dropEndDate)}
                              </span>
                            </div>
                          )}

                          {product.staffPick.limitedQuantity && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-zinc-400">Limited Quantity:</span>
                              <span className="text-red-400 font-medium">
                                Only {product.staffPick.limitedQuantity} available
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Stats */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4 text-sm text-zinc-400">
                          <span>{product.votes} votes</span>
                          <span>{product.pledges} pledges</span>
                        </div>
                        <div className="text-yellow-400 font-bold">
                          Goal: {product.goal}
                        </div>
                      </div>                      {/* Action Button */}
                      <button className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold py-3 rounded-lg transition-all duration-200 transform hover:scale-105">
                        {isDropActive(product.staffPick?.dropStartDate || '', product.staffPick?.dropEndDate || '') 
                          ? "Join Drop Now" 
                          : "View Details"}
                      </button>
                    </div>
                  </div>
                  </Link>
                ))}
              </div>            ) : (
              <div className="text-center py-16">
                <Image
                  src="/Icons/subsribers.png"
                  alt="No Staff Picks"
                  width={96}
                  height={96}
                  className="mx-auto mb-4 opacity-60"
                />
                <h3 className="text-2xl font-bold text-zinc-400 mb-2">No Staff Picks Yet</h3>
                <p className="text-zinc-500">Our team is carefully selecting products for upcoming drops.</p>
              </div>
            )}
          </div>
        </div>

        {/* Staff Pick Creation Modal */}
        {showPickModal && selectedProduct && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-zinc-700">
                <h2 className="text-2xl font-bold text-yellow-400">
                  Create Staff Pick: {selectedProduct.name}
                </h2>
                <button
                  onClick={() => setShowPickModal(false)}
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  ×
                </button>
              </div>
              
              {/* Modal Content */}
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

                <div className="grid md:grid-cols-2 gap-4">
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
                    <label className="block text-white font-medium mb-2">Priority (1 = highest)</label>
                    <select
                      value={pickForm.priority}
                      onChange={(e) => setPickForm({...pickForm, priority: parseInt(e.target.value)})}
                      className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500"
                    >
                      <option value={1}>1 - Highest Priority</option>
                      <option value={2}>2 - High Priority</option>
                      <option value={3}>3 - Medium Priority</option>
                      <option value={4}>4 - Low Priority</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Staff Note</label>
                  <textarea
                    value={pickForm.staffNote}
                    onChange={(e) => setPickForm({...pickForm, staffNote: e.target.value})}
                    placeholder="Why did you pick this product? What makes it special?"
                    rows={3}
                    className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setShowPickModal(false)}
                    className="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateStaffPick}
                    disabled={!pickForm.dropStartDate || !pickForm.dropEndDate}
                    className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 disabled:bg-zinc-600 disabled:cursor-not-allowed text-black font-medium rounded-lg transition-colors"
                  >
                    Create Staff Pick
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
