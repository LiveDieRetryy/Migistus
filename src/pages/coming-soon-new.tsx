import Head from "next/head";
import { useState, useEffect, useMemo } from "react";
import { 
  Clock, Calendar, TrendingUp, Trophy, Zap, Eye, Heart, 
  Star, Crown, Sparkles, ArrowRight, Package, Timer, 
  BarChart3, Filter, Search, Grid3X3, List, ChevronRight,
  Flame, Target, Award, CheckCircle, Users, AlertCircle
} from "lucide-react";
import MainNavbar from "@/components/nav/MainNavbar";
import Image from "next/image";
import Link from "next/link";
import { getStageInfo, getDaysInStage } from "@/utils/productLifecycle";
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

export default function ComingSoonPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
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
      const [productsRes, votesRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/votes")
      ]);

      if (!productsRes.ok) throw new Error(`Products API failed: ${productsRes.status}`);
      if (!votesRes.ok) throw new Error(`Votes API failed: ${votesRes.status}`);

      const productsData = await productsRes.json();
      const votesData = await votesRes.json();

      setProducts(productsData.products || []);
      setVotes(votesData.votes || []);
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

  const comingSoonProducts = useMemo(() => {
    return products
      .filter(product => product.stage === 'coming-soon')
      .filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             product.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === "all" || product.category === filterCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => getWeightedVoteCount(b.id) - getWeightedVoteCount(a.id));
  }, [products, searchTerm, filterCategory, votes]);

  // Group products by category and get top 10 from each
  const productsByCategory = useMemo(() => {
    const categorized: Record<string, Product[]> = {};
    
    comingSoonProducts.forEach(product => {
      const category = product.category || "Other";
      if (!categorized[category]) {
        categorized[category] = [];
      }
      if (categorized[category].length < 10) {
        categorized[category].push(product);
      }
    });

    return categorized;
  }, [comingSoonProducts]);

  const categories = useMemo(() => 
    Array.from(new Set(products.map(p => p.category).filter(Boolean))),
    [products]
  );

  const totalComingSoon = comingSoonProducts.length;
  const totalCategories = Object.keys(productsByCategory).length;
  const topProduct = comingSoonProducts[0];

  return (
    <>
      <Head>
        <title>Coming Soon - MIGISTUS | Products Launching Soon</title>
        <meta name="description" content="Top voted products preparing for launch. These community favorites are coming to MIGISTUS drops soon!" />
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
                  <Clock className="relative w-20 h-20 text-purple-400 drop-shadow-lg" />
                  <Sparkles className="w-8 h-8 text-purple-300 absolute -top-2 -right-2 animate-bounce" />
                </div>
              </div>
              
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black mb-6">
                <span className="bg-gradient-to-r from-purple-400 via-blue-500 to-cyan-500 bg-clip-text text-transparent drop-shadow-lg">
                  Coming Soon
                </span>
              </h1>
              
              <p className="text-xl sm:text-2xl text-zinc-300 max-w-4xl mx-auto leading-relaxed mb-4">
                The community has spoken! These top-voted products are preparing for launch in upcoming MIGISTUS drops.
              </p>
              
              <div className="flex flex-wrap justify-center gap-4 text-sm text-zinc-400">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-purple-400" />
                  <span>{totalComingSoon} Products Ready</span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-400" />
                  <span>{totalCategories} Categories</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-purple-400" />
                  <span>Top Community Picks</span>
                </div>
              </div>
            </div>

            {/* Top Product Spotlight */}
            {topProduct && (
              <div className="max-w-4xl mx-auto mb-12">
                <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-2xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-3xl" />
                  
                  <div className="relative flex items-center gap-2 mb-4">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                    <span className="text-sm font-bold text-yellow-400">TOP VOTED PRODUCT</span>
                    <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
                  </div>
                  
                  <div className="relative grid md:grid-cols-2 gap-6">
                    <div className="relative h-64 rounded-xl overflow-hidden bg-zinc-800">
                      <Image
                        src={topProduct.image || "/images/placeholder.png"}
                        alt={topProduct.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                      <div className="absolute top-3 right-3 bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                        <Star className="w-4 h-4" />
                        {getWeightedVoteCount(topProduct.id)} pts
                      </div>
                    </div>
                    
                    <div className="flex flex-col justify-center">
                      <h2 className="text-3xl font-bold text-white mb-3">{topProduct.name}</h2>
                      <p className="text-zinc-300 mb-4">{topProduct.description}</p>
                      
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm text-zinc-400">
                          <Users className="w-4 h-4" />
                          <span>{getVoteCount(topProduct.id)} votes</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-zinc-400">
                          <Calendar className="w-4 h-4" />
                          <span>{getDaysInStage(topProduct.stageEnteredAt)} days waiting</span>
                        </div>
                      </div>
                      
                      <Link
                        href={getProductUrl(topProduct)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-bold rounded-xl transition-all duration-200 hover:scale-105 shadow-lg shadow-purple-500/50 w-fit"
                      >
                        <span>View Details</span>
                        <ArrowRight className="w-5 h-5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <div className="bg-zinc-800/30 backdrop-blur-sm border border-zinc-700 rounded-2xl p-6">
            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by product name, description, or supplier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-900/50 border border-zinc-600 rounded-xl pl-12 pr-4 py-4 text-white placeholder-zinc-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
              />
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap gap-3">
              {/* Category Filter */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="flex-1 min-w-[200px] bg-zinc-700/50 border border-zinc-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              {/* View Mode Toggle */}
              <div className="flex gap-2 bg-zinc-700/50 border border-zinc-600 rounded-xl p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    viewMode === "grid" 
                      ? "bg-purple-500 text-white" 
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Grid3X3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition-all duration-200 ${
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

        {/* Products by Category Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          {error && (
            <div className="bg-red-900/20 border border-red-500 rounded-xl p-6 mb-8">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-red-400" />
                <div>
                  <div className="text-red-400 font-semibold">Error loading data</div>
                  <div className="text-red-300 text-sm">{error}</div>
                </div>
              </div>
            </div>
          )}
          
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500/20 rounded-full mb-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
              </div>
              <div className="text-zinc-400 text-lg">Loading products...</div>
            </div>
          ) : totalComingSoon === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-zinc-800 rounded-full mb-6">
                <Clock className="w-10 h-10 text-zinc-600" />
              </div>
              <h3 className="text-2xl font-bold text-zinc-400 mb-2">No products coming soon yet</h3>
              <p className="text-zinc-500 mb-6">Check back soon as products graduate from voting!</p>
              <Link
                href="/voting"
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-xl transition-all duration-200 hover:scale-105"
              >
                <span>Vote for Products</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          ) : (
            <div className="space-y-12">
              {Object.entries(productsByCategory).map(([category, categoryProducts]) => (
                <div key={category}>
                  {/* Category Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                        <span className="bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
                          {category}
                        </span>
                        <span className="text-lg text-zinc-500">({categoryProducts.length})</span>
                      </h2>
                      <p className="text-zinc-400 mt-1">Top {categoryProducts.length} products in this category</p>
                    </div>
                    
                    <div className="hidden md:flex items-center gap-2 text-sm text-zinc-400">
                      <Trophy className="w-4 h-4 text-yellow-400" />
                      <span>Sorted by votes</span>
                    </div>
                  </div>

                  {/* Products Grid/List */}
                  <div className={
                    viewMode === "grid"
                      ? "grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                      : "space-y-4"
                  }>
                    {categoryProducts.map((product, index) => {
                      const voteCount = getVoteCount(product.id);
                      const weightedScore = getWeightedVoteCount(product.id);
                      const daysWaiting = getDaysInStage(product.stageEnteredAt);

                      if (viewMode === "list") {
                        return (
                          <Link key={product.id} href={getProductUrl(product)}>
                            <div className="group bg-zinc-800/30 backdrop-blur-sm border border-zinc-700 rounded-2xl p-4 hover:bg-zinc-700/30 hover:border-purple-500/50 transition-all duration-300 cursor-pointer">
                              <div className="flex gap-4">
                                {/* Rank Badge */}
                                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 flex items-center justify-center">
                                  <span className="text-xl font-black text-purple-400">#{index + 1}</span>
                                </div>

                                {/* Image */}
                                <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-zinc-700/50">
                                  <Image
                                    src={product.image || "/images/placeholder.png"}
                                    alt={product.name}
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                                    sizes="96px"
                                  />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors truncate">
                                    {product.name}
                                  </h3>
                                  {product.description && (
                                    <p className="text-zinc-400 text-sm line-clamp-2 mt-1">
                                      {product.description}
                                    </p>
                                  )}
                                  
                                  <div className="flex items-center gap-4 mt-2">
                                    <div className="flex items-center gap-1 text-sm text-zinc-400">
                                      <Trophy className="w-3 h-3 text-yellow-400" />
                                      <span className="font-bold text-yellow-400">{weightedScore}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-sm text-zinc-400">
                                      <Users className="w-3 h-3" />
                                      <span>{voteCount} votes</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-sm text-zinc-400">
                                      <Clock className="w-3 h-3" />
                                      <span>{daysWaiting}d</span>
                                    </div>
                                  </div>
                                </div>

                                <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-purple-400 transition-colors flex-shrink-0 self-center" />
                              </div>
                            </div>
                          </Link>
                        );
                      }

                      // Grid View
                      return (
                        <Link key={product.id} href={getProductUrl(product)}>
                          <div className="group bg-zinc-800/30 backdrop-blur-sm border border-zinc-700 rounded-2xl overflow-hidden hover:bg-zinc-700/30 hover:border-purple-500/50 transition-all duration-300 cursor-pointer h-full">
                            {/* Image */}
                            <div className="relative w-full h-48 bg-zinc-700/50 overflow-hidden">
                              <Image
                                src={product.image || "/images/placeholder.png"}
                                alt={product.name}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-500"
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                              />
                              
                              {/* Rank Badge */}
                              <div className="absolute top-3 left-3 w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
                                <span className="text-lg font-black text-white">#{index + 1}</span>
                              </div>

                              {/* Score Badge */}
                              <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-full font-bold flex items-center gap-1 border border-yellow-500/30">
                                <Trophy className="w-3 h-3 text-yellow-400" />
                                {weightedScore}
                              </div>
                            </div>

                            {/* Content */}
                            <div className="p-4 space-y-3">
                              <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors line-clamp-2">
                                {product.name}
                              </h3>

                              {product.description && (
                                <p className="text-zinc-400 text-sm line-clamp-2">
                                  {product.description}
                                </p>
                              )}

                              {/* Stats */}
                              <div className="flex items-center justify-between pt-3 border-t border-zinc-700/50">
                                <div className="flex items-center gap-2 text-sm text-zinc-400">
                                  <Users className="w-4 h-4" />
                                  <span>{voteCount} votes</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-zinc-400">
                                  <Clock className="w-4 h-4" />
                                  <span>{daysWaiting} days</span>
                                </div>
                              </div>

                              {/* View Button */}
                              <button className="w-full py-2 bg-gradient-to-r from-purple-500/10 to-blue-500/10 hover:from-purple-500 hover:to-blue-500 border border-purple-500/30 hover:border-purple-500 text-purple-400 hover:text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 group-hover:scale-105">
                                <span>View Product</span>
                                <ArrowRight className="w-4 h-4" />
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
