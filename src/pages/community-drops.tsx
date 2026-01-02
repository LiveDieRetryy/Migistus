import Head from "next/head";
import { useState, useEffect, useMemo } from "react";
import { 
  Zap, Calendar, TrendingUp, Trophy, Eye, Heart, 
  Star, Crown, Sparkles, ArrowRight, Package, Timer, 
  BarChart3, Filter, Search, Grid3X3, List, ChevronRight,
  Flame, Target, Award, CheckCircle, Users, AlertCircle,
  ShoppingCart, Clock, DollarSign, Percent, Tag, Gift
} from "lucide-react";
import MainNavbar from "@/components/nav/MainNavbar";
import Image from "next/image";
import Link from "next/link";
import { 
  getStageInfo, 
  getDaysInStage, 
  processLifecycleTransitions,
  getProductLifecycleStatus,
  DEFAULT_LIFECYCLE_CONFIG,
  getDaysUntilNextFriday
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

export default function CommunityDropsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [pledges, setPledges] = useState<Pledge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchData();
  }, []);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
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
      
      // Filter only community-drops and live-drops stage products
      const communityDropProducts = allProducts.filter((p: Product) => {
        const stage = p.stage || 'voting';
        return stage === 'community-drops' || stage === 'live-drops';
      });

      setProducts(communityDropProducts);
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

  const getDaysRemaining = (product: Product): number => {
    const daysInStage = getDaysInStage(product.stageEnteredAt);
    const stageDuration = DEFAULT_LIFECYCLE_CONFIG.communityDropsDuration || 7;
    return Math.max(0, stageDuration - daysInStage);
  };

  const communityDropProducts = useMemo(() => {
    return products
      .filter(product => product.stage === 'community-drops')
      .filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             product.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === "all" || product.category === filterCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => getPledgeCount(b.id) - getPledgeCount(a.id));
  }, [products, searchTerm, filterCategory, pledges]);

  // Group products by category and get top 10 from each
  const productsByCategory = useMemo(() => {
    const categorized: Record<string, Product[]> = {};
    
    communityDropProducts.forEach(product => {
      const category = product.category || "Other";
      if (!categorized[category]) {
        categorized[category] = [];
      }
      if (categorized[category].length < 10) {
        categorized[category].push(product);
      }
    });

    return categorized;
  }, [communityDropProducts]);

  const categories = useMemo(() => 
    Array.from(new Set(products.map(p => p.category).filter(Boolean))),
    [products]
  );

  const totalDrops = communityDropProducts.length;
  const totalCategories = Object.keys(productsByCategory).length;
  const totalPledges = communityDropProducts.reduce((sum, p) => sum + getPledgeCount(p.id), 0);
  const topDrop = communityDropProducts[0];

  return (
    <>
      <Head>
        <title>Community Drops - MIGISTUS | Active Group Buys</title>
        <meta name="description" content="Join active community drops! Limited time group buying with exclusive pricing and community-selected products." />
      </Head>
      
      <MainNavbar />
      
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white">
        {/* Enhanced Hero Section */}
        <div className="relative overflow-hidden pt-8 pb-16">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 via-transparent to-emerald-900/20" />
            <div className="absolute top-0 left-0 w-full h-full">
              <div className="absolute top-20 left-10 w-72 h-72 bg-green-500/10 rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Compact Top Bar with Countdown */}
            <div className="flex items-start justify-end mb-8">
              {/* Right: Drop End Countdown */}
              <div className="flex items-center gap-3 bg-orange-900/30 border border-orange-500/30 rounded-xl px-4 py-3 backdrop-blur-sm">
                <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-orange-300">Drops End This Friday</div>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const daysToFriday = getDaysUntilNextFriday();
                      const dropsEnding = communityDropProducts.filter(p => getDaysRemaining(p) <= 7);
                      
                      return (
                        <>
                          <span className="text-2xl font-black text-orange-400">
                            {daysToFriday}
                          </span>
                          <span className="text-sm text-orange-300">
                            {daysToFriday === 0 
                              ? "Today!" 
                              : daysToFriday === 1
                              ? "day"
                              : "days"
                            }
                          </span>
                          {dropsEnding.length > 0 && (
                            <span className="ml-2 text-xs text-orange-400">
                              ({dropsEnding.length} ending)
                            </span>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Title Section */}
            <div className="text-center mb-12">
              <h1 className="text-4xl sm:text-5xl font-black mb-4">
                <span className="bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 bg-clip-text text-transparent">
                  Community Drops
                </span>
              </h1>
              
              <p className="text-lg text-zinc-300 max-w-3xl mx-auto mb-4">
                Active group buys selected by our community. Join the collective and unlock exclusive pricing through the power of group buying!
              </p>
              
              <div className="flex flex-wrap justify-center gap-4 text-sm text-zinc-400">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-green-400" />
                  <span>{totalDrops} Active Drops</span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-green-400" />
                  <span>{totalCategories} Categories</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-green-400" />
                  <span>{totalPledges} Total Pledges</span>
                </div>
              </div>
            </div>

            {/* Top Drop Spotlight */}
            {topDrop && (
              <div className="max-w-4xl mx-auto mb-12">
                <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-500/30 rounded-2xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-green-500/10 to-transparent rounded-full blur-3xl" />
                  
                  <div className="relative flex items-center gap-2 mb-4">
                    <Flame className="w-5 h-5 text-orange-400 animate-pulse" />
                    <span className="text-sm font-bold text-orange-400">HOTTEST DROP</span>
                    <Trophy className="w-4 h-4 text-yellow-400" />
                  </div>
                  
                  <div className="relative grid md:grid-cols-2 gap-6">
                    <div className="relative h-64 rounded-xl overflow-hidden bg-zinc-800">
                      <Image
                        src={topDrop.image || "/images/placeholder.png"}
                        alt={topDrop.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                      <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                        <Zap className="w-4 h-4" />
                        {getPledgeCount(topDrop.id)} Pledges
                      </div>
                      <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {getDaysRemaining(topDrop)} days left
                      </div>
                    </div>
                    
                    <div className="flex flex-col justify-between">
                      <div>
                        <h3 className="text-2xl font-black text-white mb-3">{topDrop.name}</h3>
                        <p className="text-zinc-300 mb-4 line-clamp-3">{topDrop.description}</p>
                        
                        <div className="flex flex-wrap gap-2 mb-4">
                          {topDrop.category && (
                            <span className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm">
                              {topDrop.category}
                            </span>
                          )}
                          <span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {getPledgeUsers(topDrop.id)} Backers
                          </span>
                        </div>
                      </div>
                      
                      <Link 
                        href={getProductUrl(topDrop)}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 group"
                      >
                        <span>Join This Drop</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
                  placeholder="Search active drops..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-600 rounded-xl pl-12 pr-4 py-3 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Category Filter */}
              <div className="relative">
                <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-zinc-900/50 border border-zinc-600 rounded-xl pl-12 pr-10 py-3 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent cursor-pointer min-w-[200px]"
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
                      ? "bg-green-500 text-white" 
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Grid3X3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === "list" 
                      ? "bg-green-500 text-white" 
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
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-green-400 mb-4"></div>
              <p className="text-zinc-400 text-lg">Loading active drops...</p>
            </div>
          ) : error ? (
            <div className="bg-red-900/20 border border-red-500/50 rounded-2xl p-8 text-center">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-red-400 mb-2">Error Loading Drops</h3>
              <p className="text-red-300">{error}</p>
            </div>
          ) : communityDropProducts.length === 0 ? (
            <div className="text-center py-20">
              <Zap className="w-20 h-20 text-zinc-600 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-zinc-400 mb-3">No Active Drops</h3>
              <p className="text-zinc-500 mb-6">Check back soon! New drops launch every Friday.</p>
              <Link 
                href="/voting"
                className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl transition-all"
              >
                <Trophy className="w-5 h-5" />
                <span>Vote for Next Drop</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-12">
              {Object.entries(productsByCategory).map(([category, categoryProducts]) => (
                <div key={category}>
                  {/* Category Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-8 bg-gradient-to-b from-green-400 to-emerald-500 rounded-full"></div>
                      <h2 className="text-2xl font-black text-white">{category}</h2>
                      <span className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm font-semibold">
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
                      const daysLeft = getDaysRemaining(product);
                      
                      return (
                        <Link 
                          key={product.id} 
                          href={getProductUrl(product)}
                          className="block group"
                        >
                          <div className={`
                            bg-zinc-800/50 border border-zinc-700 rounded-2xl p-6 
                            hover:bg-zinc-800/80 hover:border-green-500/50 
                            transition-all duration-300 cursor-pointer
                            hover:shadow-lg hover:shadow-green-500/10
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
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                sizes={viewMode === "grid" ? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" : "200px"}
                              />
                              
                              {/* Ranking Badge */}
                              <div className="absolute top-3 left-3 bg-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                                #{index + 1}
                              </div>

                              {/* Days Left Badge */}
                              <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {daysLeft}d left
                              </div>

                              {/* Hot Badge */}
                              {pledgeCount > 20 && (
                                <div className="absolute bottom-3 left-3 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 animate-pulse">
                                  <Flame className="w-3 h-3" />
                                  HOT
                                </div>
                              )}

                              {/* Pledge Count */}
                              <div className="absolute bottom-3 right-3 bg-green-500/90 text-white px-2 py-1 rounded-full text-xs font-bold">
                                {pledgeCount} pledged
                              </div>
                            </div>

                            {/* Product Info */}
                            <div className="flex-1 space-y-4">
                              <div>
                                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-green-400 transition-colors">
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
                                {/* Pledges */}
                                <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-3">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Users className="w-4 h-4 text-green-400" />
                                    <span className="text-xs text-green-300">Backers</span>
                                  </div>
                                  <div className="text-xl font-black text-green-400">{pledgeUsers}</div>
                                </div>

                                {/* Community Votes */}
                                <div className="bg-purple-900/30 border border-purple-700/50 rounded-lg p-3">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Trophy className="w-4 h-4 text-purple-400" />
                                    <span className="text-xs text-purple-300">Votes</span>
                                  </div>
                                  <div className="text-xl font-black text-purple-400">{weightedVotes}</div>
                                </div>
                              </div>

                              {/* Progress Bar */}
                              <div className="bg-zinc-700/50 rounded-full h-2 overflow-hidden">
                                <div 
                                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-full transition-all duration-500"
                                  style={{ width: `${Math.min(100, (pledgeCount / 50) * 100)}%` }}
                                />
                              </div>
                              <div className="flex justify-between text-xs text-zinc-400">
                                <span>{pledgeCount} pledges</span>
                                <span>Goal: 50</span>
                              </div>

                              {/* Action Button */}
                              <button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-green-500/20">
                                <ShoppingCart className="w-4 h-4" />
                                <span>Join Drop</span>
                              </button>
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
