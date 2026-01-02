import Head from "next/head";
import { useState, useEffect, useMemo } from "react";
import { 
  CheckCircle, Calendar, TrendingUp, Trophy, Eye, Heart, 
  Star, Crown, Sparkles, ArrowRight, Package, Timer, 
  BarChart3, Filter, Search, Grid3X3, List, ChevronRight,
  Flame, Target, Award, Users, AlertCircle, ShoppingCart,
  Clock, History, Archive, TrendingDown
} from "lucide-react";
import MainNavbar from "@/components/nav/MainNavbar";
import Image from "next/image";
import Link from "next/link";
import { 
  getStageInfo, 
  getDaysInStage, 
  processLifecycleTransitions,
  getProductLifecycleStatus,
  DEFAULT_LIFECYCLE_CONFIG
} from "@/utils/productLifecycle";
import { getProductUrl } from "@/utils/productUtils";

interface Product {
  id: number | string;
  name: string;
  image?: string;
  description?: string;
  category?: string;
  price?: number;
  stage?: string;
  stageEnteredAt?: string;
  votes?: number;
  pledges?: number;
  completedAt?: string;
  supplier?: {
    name: string;
  };
}

interface Vote {
  productId: number | string;
  userId: number;
  tier: string;
  value: number;
  timestamp: string;
}

interface Pledge {
  productId: number | string;
  userId: number;
  quantity: number;
  timestamp: string;
}

export default function RecentlyCompletedPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [pledges, setPledges] = useState<Pledge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsRes, votesRes, pledgesRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/votes"),
        fetch("/api/pledges").catch(() => ({ ok: true, json: async () => ({ pledges: [] }) }))
      ]);

      if (!productsRes.ok) throw new Error(`Products API failed: ${productsRes.status}`);
      if (!votesRes.ok) throw new Error(`Votes API failed: ${votesRes.status}`);

      const productsData = await productsRes.json();
      const votesData = await votesRes.json();
      const pledgesData = await pledgesRes.json();

      // Process lifecycle transitions automatically
      let allProducts = productsData.products || [];
      allProducts = processLifecycleTransitions(allProducts, DEFAULT_LIFECYCLE_CONFIG);
      
      // Filter only recently-completed stage products
      const completedProducts = allProducts.filter((p: Product) => 
        (p.stage || 'voting') === 'recently-completed'
      );

      setProducts(completedProducts);
      setVotes(votesData.votes || []);
      setPledges(pledgesData.pledges || []);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getVoteCount = (productId: number | string): number => {
    return votes.filter(vote => vote.productId === productId).length;
  };

  const getWeightedVoteCount = (productId: number | string): number => {
    return votes
      .filter(vote => vote.productId === productId)
      .reduce((total, vote) => {
        const multiplier = vote.tier === "MIGISTUS" ? 4 : vote.tier === "Guild" ? 2 : 1;
        return total + (vote.value * multiplier);
      }, 0);
  };

  const getPledgeCount = (productId: number | string): number => {
    return pledges
      .filter(pledge => pledge.productId === productId)
      .reduce((total, pledge) => total + pledge.quantity, 0);
  };

  const getPledgeUsers = (productId: number | string): number => {
    return new Set(pledges.filter(p => p.productId === productId).map(p => p.userId)).size;
  };

  const getDaysCompleted = (product: Product): number => {
    if (!product.completedAt && !product.stageEnteredAt) return 0;
    const completedDate = new Date(product.completedAt || product.stageEnteredAt || '');
    const now = new Date();
    return Math.floor((now.getTime() - completedDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  const completedProducts = useMemo(() => {
    return products
      .filter(product => product.stage === 'recently-completed')
      .filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             product.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === "all" || product.category === filterCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => getDaysCompleted(a) - getDaysCompleted(b)); // Most recent first
  }, [products, searchTerm, filterCategory, pledges]);

  // Group products by category
  const productsByCategory = useMemo(() => {
    const categorized: Record<string, Product[]> = {};
    
    completedProducts.forEach(product => {
      const category = product.category || "Other";
      if (!categorized[category]) {
        categorized[category] = [];
      }
      categorized[category].push(product);
    });

    return categorized;
  }, [completedProducts]);

  const categories = useMemo(() => 
    Array.from(new Set(products.map(p => p.category).filter(Boolean))),
    [products]
  );

  const totalCompleted = completedProducts.length;
  const totalCategories = Object.keys(productsByCategory).length;
  const totalPledgesFulfilled = completedProducts.reduce((sum, p) => sum + getPledgeCount(p.id), 0);
  const totalBackers = new Set(pledges.map(p => p.userId)).size;

  return (
    <>
      <Head>
        <title>Recently Completed - MIGISTUS | Past Community Drops</title>
        <meta name="description" content="Browse completed community drops. See what the community loved and supported!" />
      </Head>
      
      <MainNavbar />
      
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white">
        {/* Enhanced Hero Section */}
        <div className="relative overflow-hidden pt-8 pb-16">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-blue-900/20" />
            <div className="absolute top-0 left-0 w-full h-full">
              <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Title Section */}
            <div className="text-center mb-12">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-purple-400/20 blur-2xl rounded-full animate-pulse" />
                  <Image
                    src="/Icons/recently-completed-icon.png"
                    alt="Recently Completed"
                    width={64}
                    height={64}
                    className="relative drop-shadow-lg"
                  />
                </div>
              </div>
              
              <h1 className="text-4xl sm:text-5xl font-black mb-4">
                <span className="bg-gradient-to-r from-purple-400 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
                  Recently Completed
                </span>
              </h1>
              
              <p className="text-lg text-zinc-300 max-w-3xl mx-auto mb-4">
                Explore our archive of successful community drops. These products were chosen by the community, backed by members, and successfully delivered!
              </p>
              
              <div className="flex flex-wrap justify-center gap-4 text-sm text-zinc-400">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-400" />
                  <span>{totalCompleted} Completed Drops</span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-400" />
                  <span>{totalCategories} Categories</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span>{totalPledgesFulfilled} Total Pledges Fulfilled</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-purple-400" />
                  <span>{totalBackers} Community Backers</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-2xl p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search completed drops..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-600 rounded-xl pl-12 pr-4 py-3 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Category Filter */}
              <div className="relative">
                <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-zinc-900/50 border border-zinc-600 rounded-xl pl-12 pr-10 py-3 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent cursor-pointer min-w-[200px]"
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex gap-2 bg-zinc-900/50 border border-zinc-600 rounded-xl p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === "grid" 
                      ? "bg-purple-500 text-white" 
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Grid3X3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === "list" 
                      ? "bg-purple-500 text-white" 
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Products Display */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-purple-400 mb-4"></div>
              <p className="text-zinc-400 text-lg">Loading completed drops...</p>
            </div>
          ) : error ? (
            <div className="bg-red-900/20 border border-red-500/50 rounded-2xl p-8 text-center">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-red-400 mb-2">Error Loading Completed Drops</h3>
              <p className="text-red-300">{error}</p>
            </div>
          ) : completedProducts.length === 0 ? (
            <div className="text-center py-20">
              <Archive className="w-20 h-20 text-zinc-600 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-zinc-400 mb-3">No Completed Drops Yet</h3>
              <p className="text-zinc-500 mb-6">Check back soon! Completed drops will appear here after they finish.</p>
              <Link 
                href="/community-drops"
                className="inline-flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-xl transition-all"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>View Active Drops</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-12">
              {Object.entries(productsByCategory).map(([category, categoryProducts]) => (
                <div key={category}>
                  {/* Category Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-8 bg-gradient-to-b from-purple-400 to-blue-500 rounded-full"></div>
                      <h2 className="text-2xl font-black text-white">{category}</h2>
                      <span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm font-semibold">
                        {categoryProducts.length} {categoryProducts.length === 1 ? 'Drop' : 'Drops'}
                      </span>
                    </div>
                  </div>

                  {/* Products Grid/List */}
                  <div className={
                    viewMode === "grid" 
                      ? "grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
                      : "space-y-4"
                  }>
                    {categoryProducts.map((product, index) => {
                      const voteCount = getVoteCount(product.id);
                      const weightedVotes = getWeightedVoteCount(product.id);
                      const pledgeCount = getPledgeCount(product.id);
                      const pledgeUsers = getPledgeUsers(product.id);
                      const daysAgo = getDaysCompleted(product);
                      
                      return (
                        <Link 
                          key={product.id} 
                          href={getProductUrl(product)}
                          className="block group"
                        >
                          <div className={`
                            bg-zinc-800/50 border border-zinc-700 rounded-2xl p-6 
                            hover:bg-zinc-800/80 hover:border-purple-500/50 
                            transition-all duration-300 cursor-pointer
                            hover:shadow-lg hover:shadow-purple-500/10
                            ${viewMode === "list" ? "flex gap-6" : ""}
                          `}>
                            {/* Product Image */}
                            <div className={`
                              relative rounded-xl overflow-hidden bg-zinc-900
                              ${viewMode === "list" ? "w-48 h-48 flex-shrink-0" : "w-full h-48 mb-4"}
                            `}>
                              <Image
                                src={product.image || "/images/placeholder.png"}
                                alt={product.name}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                                sizes={viewMode === "grid" ? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" : "200px"}
                              />
                              
                              {/* Completed Badge */}
                              <div className="absolute top-3 left-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Completed
                              </div>

                              {/* Days Ago */}
                              <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                                <History className="w-3 h-3" />
                                {daysAgo}d ago
                              </div>

                              {/* Success Badge */}
                              {pledgeCount >= 50 && (
                                <div className="absolute bottom-3 left-3 bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                  <Trophy className="w-3 h-3" />
                                  SUCCESS
                                </div>
                              )}
                            </div>

                            {/* Product Info */}
                            <div className="flex-1 space-y-4">
                              <div>
                                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
                                  {product.name}
                                </h3>
                                {product.description && (
                                  <p className="text-zinc-400 text-sm line-clamp-2">
                                    {product.description}
                                  </p>
                                )}
                              </div>

                              {/* Stats Grid */}
                              <div className="grid grid-cols-2 gap-3">
                                {/* Final Pledges */}
                                <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-3">
                                  <div className="flex items-center gap-2 mb-1">
                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                    <span className="text-xs text-green-300">Fulfilled</span>
                                  </div>
                                  <div className="text-xl font-black text-green-400">{pledgeCount}</div>
                                </div>

                                {/* Total Backers */}
                                <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-3">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Users className="w-4 h-4 text-blue-400" />
                                    <span className="text-xs text-blue-300">Backers</span>
                                  </div>
                                  <div className="text-xl font-black text-blue-400">{pledgeUsers}</div>
                                </div>

                                {/* Community Votes */}
                                <div className="bg-purple-900/30 border border-purple-700/50 rounded-lg p-3">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Trophy className="w-4 h-4 text-purple-400" />
                                    <span className="text-xs text-purple-300">Votes</span>
                                  </div>
                                  <div className="text-xl font-black text-purple-400">{weightedVotes}</div>
                                </div>

                                {/* Days in Archive */}
                                <div className="bg-zinc-700/50 border border-zinc-600/50 rounded-lg p-3">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Archive className="w-4 h-4 text-zinc-400" />
                                    <span className="text-xs text-zinc-300">Archived</span>
                                  </div>
                                  <div className="text-xl font-black text-zinc-300">{daysAgo}d</div>
                                </div>
                              </div>

                              {/* Success Rate */}
                              <div className="bg-zinc-700/50 rounded-full h-2 overflow-hidden">
                                <div 
                                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-full transition-all duration-500"
                                  style={{ width: `${Math.min(100, (pledgeCount / 50) * 100)}%` }}
                                />
                              </div>
                              <div className="flex justify-between text-xs text-zinc-400">
                                <span>{pledgeCount} pledges fulfilled</span>
                                <span>{Math.round((pledgeCount / 50) * 100)}% of goal</span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
