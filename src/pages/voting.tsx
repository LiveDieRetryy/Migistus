import Head from "next/head";
import { useState, useEffect, useMemo } from "react";
import { 
  Vote, Trophy, Crown, Users, Star, ChevronUp, ChevronDown, 
  Filter, Search, Sparkles, HelpCircle, X, Clock, CheckCircle, 
  TrendingUp, Eye, Heart, Share2, Calendar, Zap, Award,
  SlidersHorizontal, Grid3X3, List, ArrowUpDown, Flame,
  Package, Target, Timer, BarChart3, AlertCircle, Shield
} from "lucide-react";
import MainNavbar from "@/components/nav/MainNavbar";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import Link from "next/link";
import { UserStorage3 as UserStorage } from "@/utils/userStorage";
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
  supplier?: {
    name: string;
  };
  featured?: boolean;
}

interface Vote {
  productId: number | string;
  userId: number;
  tier: string;
  value: number;
  timestamp: string;
}

interface VotingConfig {
  tierLimits: Record<string, number>;
  tierMultipliers: Record<string, number>;
}

interface LifecycleConfig {
  votingToComingSoonThreshold: number;
  votingDurationDays: number;
}

// Extend the User interface from AuthContext to include tier
interface UserWithTier {
  id: number;
  username: string;
  email: string;
  sessionId: string;
  tier?: string;
}

export default function VotingPage() {
  const { user: authUser, isAuthenticated } = useAuth();
  const user = authUser as UserWithTier | null;
  
  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [votingConfig, setVotingConfig] = useState<VotingConfig | null>(null);
  const [lifecycleConfig, setLifecycleConfig] = useState<LifecycleConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI states
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"trending" | "votes" | "recent" | "alphabetical">("trending");
  const [filterCategory, setFilterCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [showVotingModal, setShowVotingModal] = useState(false);
  const [showStatsPanel, setShowStatsPanel] = useState(true);
  const [votingAnimation, setVotingAnimation] = useState<number | string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchData();
  }, []);

  // Update time every second for live countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowVotingModal(false);
        setShowFilters(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsRes, votesRes, configRes, lifecycleRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/votes"),
        fetch("/api/voting-config"),
        fetch("/api/product-lifecycle/config").catch(() => null)
      ]);

      if (!productsRes.ok) throw new Error(`Products API failed: ${productsRes.status}`);
      if (!votesRes.ok) throw new Error(`Votes API failed: ${votesRes.status}`);
      if (!configRes.ok) throw new Error(`Config API failed: ${configRes.status}`);

      const productsData = await productsRes.json();
      const votesData = await votesRes.json();
      const configData = await configRes.json();
      const lifecycleData = lifecycleRes ? await lifecycleRes.json() : null;

      // Process lifecycle transitions automatically
      let allProducts = productsData.products || [];
      allProducts = processLifecycleTransitions(allProducts, DEFAULT_LIFECYCLE_CONFIG);
      
      // Filter only voting stage products
      const votingProducts = allProducts.filter((p: Product) => 
        (p.stage || 'voting') === 'voting'
      );

      setProducts(votingProducts);
      setVotes(votesData.votes || []);
      setVotingConfig(configData);
      setLifecycleConfig(lifecycleData);
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
        const multiplier = votingConfig?.tierMultipliers?.[vote.tier] || 1;
        return total + (vote.value * multiplier);
      }, 0);
  };

  const hasVoted = (productId: number | string): boolean => {
    if (!user) return false;
    const today = new Date().toDateString();
    
    const apiVotedToday = votes.some(vote => 
      vote.productId === productId && 
      vote.userId === user.id &&
      new Date(vote.timestamp).toDateString() === today
    );
    
    const localVotedToday = UserStorage.hasVotedTodayForProduct(user.id, productId);
    
    return apiVotedToday || localVotedToday;
  };

  const getRemainingVotes = (): number => {
    if (!user || !votingConfig) return 0;
    const userTier = user.tier || "Initiate";
    
    // Admin users have unlimited votes
    if (userTier === "Admin") return 999;
    
    const maxVotes = votingConfig.tierLimits?.[userTier] || 1;
    
    const today = new Date().toDateString();
    const apiVotesToday = votes.filter(vote => 
      vote.userId === user.id && 
      new Date(vote.timestamp).toDateString() === today
    ).length;
    
    const localVotesToday = UserStorage.getTodaysVoteCount(user.id);
    const totalVotesToday = Math.max(apiVotesToday, localVotesToday);
    
    return Math.max(0, maxVotes - totalVotesToday);
  };

  const handleVote = async (productId: number | string) => {
    if (!isAuthenticated || !user || hasVoted(productId)) return;
    
    // Suppliers cannot vote
    if (user.tier === "Supplier") return;

    const product = products.find(p => p.id === productId);
    const productName = product?.name || 'Unknown Product';

    // Trigger animation
    setVotingAnimation(productId);
    setTimeout(() => setVotingAnimation(null), 1000);

    try {
      const response = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          userId: user.id,
          tier: user.tier || "Initiate",
          value: 1,
          timestamp: new Date().toISOString()
        }),
      });

      if (response.ok) {
        UserStorage.addUserVote(user.id, {
          productId,
          productName,
          tier: user.tier || "Initiate",
          value: 1,
          timestamp: new Date().toISOString()
        });
        
        await fetchData();
      }
    } catch (error) {
      console.error("Failed to vote:", error);
    }
  };

  const getTimeUntilReset = (): string => {
    const tomorrow = new Date(currentTime);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilReset = tomorrow.getTime() - currentTime.getTime();
    const hoursUntilReset = Math.floor(msUntilReset / (1000 * 60 * 60));
    const minutesUntilReset = Math.floor((msUntilReset % (1000 * 60 * 60)) / (1000 * 60));
    const secondsUntilReset = Math.floor((msUntilReset % (1000 * 60)) / 1000);
    
    if (hoursUntilReset > 0) {
      return `${hoursUntilReset}h ${minutesUntilReset}m ${secondsUntilReset}s`;
    } else if (minutesUntilReset > 0) {
      return `${minutesUntilReset}m ${secondsUntilReset}s`;
    } else {
      return `${secondsUntilReset}s`;
    }
  };

  const filteredProducts = useMemo(() => {
    return products
      .filter(product => product.stage === 'voting')
      .filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             product.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === "all" || product.category === filterCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "trending":
            const aVelocity = getVoteCount(a.id) / (getDaysInStage(a.stageEnteredAt) || 1);
            const bVelocity = getVoteCount(b.id) / (getDaysInStage(b.stageEnteredAt) || 1);
            return bVelocity - aVelocity;
          case "votes":
            return getWeightedVoteCount(b.id) - getWeightedVoteCount(a.id);
          case "recent":
            return new Date(b.stageEnteredAt || 0).getTime() - new Date(a.stageEnteredAt || 0).getTime();
          case "alphabetical":
            return a.name.localeCompare(b.name);
          default:
            return 0;
        }
      });
  }, [products, searchTerm, filterCategory, sortBy, votes]);

  const categories = useMemo(() => 
    Array.from(new Set(products.map(p => p.category).filter(Boolean))),
    [products]
  );

  const topProducts = useMemo(() => 
    [...products]
      .filter(p => p.stage === 'voting')
      .sort((a, b) => getWeightedVoteCount(b.id) - getWeightedVoteCount(a.id))
      .slice(0, 3),
    [products, votes]
  );

  const totalVotescast = votes.length;
  const activeProducts = products.filter(p => p.stage === 'voting').length;

  const getTierColor = (tier: string | undefined): string => {
    const effectiveTier = tier || "Initiate";
    switch (effectiveTier) {
      case "Admin": return "text-yellow-500";
      case "MIGISTUS": return "text-purple-400";
      case "Guild": return "text-yellow-400";
      case "Initiate":
      default: return "text-zinc-400";
    }
  };

  const getTierIcon = (tier: string | undefined) => {
    const effectiveTier = tier || "Initiate";
    switch (effectiveTier) {
      case "Admin": return <Shield className="w-4 h-4" />;
      case "MIGISTUS": return <Crown className="w-4 h-4" />;
      case "Guild": return <Star className="w-4 h-4" />;
      case "Initiate":
      default: return <Users className="w-4 h-4" />;
    }
  };

  const getProgressPercentage = (productId: number | string): number => {
    if (!lifecycleConfig) return 0;
    return Math.min(100, (getVoteCount(productId) / lifecycleConfig.votingToComingSoonThreshold) * 100);
  };

  return (
    <>
      <Head>
        <title>Product Voting - MIGISTUS | Shape the Future</title>
        <meta name="description" content="Vote for products you want to see in upcoming MIGISTUS drops. Your voice shapes our marketplace." />
      </Head>
      
      <MainNavbar />
      
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white">
        {/* Compact Hero Section */}
        <div className="relative overflow-hidden pt-6 pb-12">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/10 via-transparent to-purple-900/10" />
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Top Bar - Tier Left, Countdown Right */}
            <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
              {/* Left: Voter Tier Status */}
              {isAuthenticated && user && user.tier !== "Supplier" ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-3 bg-zinc-800/50 backdrop-blur-sm border border-zinc-700/50 rounded-2xl px-5 py-3">
                    {getTierIcon(user.tier)}
                    <div>
                      <div className="text-xs text-zinc-400">Your Tier</div>
                      <div className={`text-lg font-bold ${getTierColor(user.tier)}`}>
                        {user.tier || "Initiate"}
                      </div>
                    </div>
                    <div className="border-l border-zinc-700 pl-3 ml-3">
                      {user.tier === "Admin" ? (
                        <>
                          <div className="text-2xl font-black text-yellow-400">∞</div>
                          <div className="text-xs text-yellow-500">Unlimited</div>
                        </>
                      ) : (
                        <>
                          <div className="text-2xl font-black text-yellow-400">{getRemainingVotes()}</div>
                          <div className="text-xs text-zinc-400">Votes Left</div>
                        </>
                      )}
                    </div>
                    <div className="border-l border-zinc-700 pl-3">
                      <div className="text-2xl font-black text-yellow-400">
                        {votingConfig?.tierMultipliers?.[user.tier || "Initiate"] || 1}x
                      </div>
                      <div className="text-xs text-zinc-400">Power</div>
                    </div>
                  </div>
                  
                  {/* Upgrade Tier Button */}
                  {user.tier !== "Admin" && user.tier !== "MIGISTUS" && (
                    <Link
                      href="/upgrade-tier"
                      className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 rounded-2xl text-black font-bold transition-all transform hover:scale-105 shadow-lg shadow-yellow-500/30"
                    >
                      <TrendingUp className="w-5 h-5" />
                      <span>Upgrade Tier</span>
                    </Link>
                  )}
                </div>
              ) : isAuthenticated && user?.tier === "Supplier" ? (
                <div className="flex items-center gap-3 bg-purple-900/20 backdrop-blur-sm border border-purple-500/30 rounded-2xl px-5 py-3">
                  <Shield className="w-8 h-8 text-purple-400" />
                  <div>
                    <div className="text-xs text-purple-400">Your Tier</div>
                    <div className="text-lg font-bold text-purple-300">Supplier</div>
                  </div>
                  <div className="border-l border-purple-700 pl-3 ml-3">
                    <div className="text-xs text-purple-300">Cannot vote</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-zinc-800/50 backdrop-blur-sm border border-zinc-700/50 rounded-2xl px-5 py-3">
                  <Users className="w-8 h-8 text-zinc-400" />
                  <div>
                    <div className="text-xs text-zinc-400">Sign in to vote</div>
                    <button onClick={() => (window as any).openAuthModal?.()} className="text-sm font-bold text-yellow-400 hover:text-yellow-300">
                      Sign In
                    </button>
                  </div>
                </div>
              )}

              {/* Right: Voting Countdown */}
              <div className="flex items-center gap-3 bg-blue-900/30 backdrop-blur-sm border border-blue-500/30 rounded-2xl px-5 py-3">
                <Calendar className="w-8 h-8 text-blue-400" />
                <div>
                  <div className="text-xs text-blue-300">Voting Ends This Friday</div>
                  <div className="text-lg font-bold text-white">Top voted products advance to Coming Soon</div>
                </div>
                <div className="border-l border-blue-700 pl-3 ml-3 text-center">
                  {(() => {
                    const daysUntilVotingEnds = DEFAULT_LIFECYCLE_CONFIG.votingEndDay;
                    const today = new Date().getDay();
                    const daysToFriday = today <= daysUntilVotingEnds 
                      ? daysUntilVotingEnds - today 
                      : 7 - today + daysUntilVotingEnds;
                    
                    return (
                      <>
                        <div className="text-3xl font-black text-blue-400">{daysToFriday}</div>
                        <div className="text-xs text-blue-300">
                          {daysToFriday === 0 ? "Today!" : "Days Left"}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Centered Title */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-yellow-400/20 blur-2xl rounded-full animate-pulse" />
                  <Vote className="relative w-16 h-16 text-yellow-400 drop-shadow-lg" />
                  <Sparkles className="w-6 h-6 text-yellow-300 absolute -top-1 -right-1 animate-bounce" />
                </div>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-4">
                <span className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 bg-clip-text text-transparent drop-shadow-lg">
                  Shape the Future
                </span>
              </h1>
              
              <p className="text-lg sm:text-xl text-zinc-300 max-w-3xl mx-auto leading-relaxed mb-4">
                Your vote decides what comes next. Discover products from suppliers and vote for the ones you want to see in upcoming drops.
              </p>
              
              <div className="flex flex-wrap justify-center gap-4 text-sm text-zinc-400">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-yellow-400" />
                  <span>{activeProducts} Products in Voting</span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-yellow-400" />
                  <span>{totalVotescast.toLocaleString()} Total Votes Cast</span>
                </div>
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-yellow-400" />
                  <span>Votes Reset in {getTimeUntilReset()}</span>
                </div>
              </div>
            </div>

            {/* Supplier Notice (if applicable) */}
            {isAuthenticated && user?.tier === "Supplier" && (
              <div className="max-w-4xl mx-auto mb-8">
                <div className="bg-gradient-to-br from-purple-900/20 to-purple-950/20 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6 text-center">
                  <p className="text-purple-200">
                    To maintain fairness and prevent conflicts of interest, suppliers cannot vote on products. Focus on creating amazing products for our community to vote on!
                  </p>
                </div>
              </div>
            )}

            {/* How Voting Works Link (for authenticated users) */}
            {isAuthenticated && user && user.tier !== "Supplier" && (
              <div className="text-center">
                <button
                  onClick={() => setShowVotingModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700 rounded-xl text-zinc-300 hover:text-white transition-all duration-200 text-sm"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>How Voting Works</span>
                </button>
              </div>
            )}

            {/* Not Authenticated CTA */}
            {!isAuthenticated && (
              <div className="max-w-2xl mx-auto text-center">
                <div className="bg-zinc-800/30 backdrop-blur-sm border border-zinc-700 rounded-2xl p-8">
                  <h3 className="text-2xl font-bold text-white mb-4">Sign In to Vote</h3>
                  <p className="text-zinc-300 mb-6">
                    Join MIGISTUS to vote for your favorite products and help shape our marketplace.
                  </p>
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => (window as any).openAuthModal?.()}
                      className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-xl transition-all duration-200"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => (window as any).openAuthModal?.(true)}
                      className="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 text-white font-bold rounded-xl transition-all duration-200"
                    >
                      Join The Guild
                    </button>
                  </div>
                  <button
                    onClick={() => setShowVotingModal(true)}
                    className="mt-6 inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm"
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span>Learn About Voting Tiers</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Top Products Highlight */}
        {topProducts.length > 0 && showStatsPanel && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
            <div className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 border border-yellow-500/30 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
                  <Trophy className="w-6 h-6" />
                  Top Voted Products
                </h2>
                <button
                  onClick={() => setShowStatsPanel(false)}
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4">
                {topProducts.map((product, index) => (
                  <Link key={product.id} href={getProductUrl(product)}>
                    <div className="bg-zinc-800/50 backdrop-blur-sm border border-zinc-700 rounded-xl p-4 hover:bg-zinc-700/50 hover:border-yellow-500/50 transition-all duration-300 cursor-pointer group">
                      <div className="flex items-start gap-4">
                        <div className="relative">
                          <div className={`text-3xl font-black ${
                            index === 0 ? 'text-yellow-400' :
                            index === 1 ? 'text-zinc-300' :
                            'text-orange-600'
                          }`}>
                            #{index + 1}
                          </div>
                          {index === 0 && <Flame className="w-5 h-5 text-orange-500 absolute -top-1 -right-1 animate-pulse" />}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-white truncate group-hover:text-yellow-400 transition-colors">
                            {product.name}
                          </h3>
                          <div className="flex items-center gap-3 mt-2 text-sm">
                            <span className="text-zinc-400">{getVoteCount(product.id)} votes</span>
                            <span className="text-yellow-400 font-bold">{getWeightedVoteCount(product.id)} pts</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

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
                className="w-full bg-zinc-900/50 border border-zinc-600 rounded-xl pl-12 pr-4 py-4 text-white placeholder-zinc-400 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all duration-200"
              />
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap gap-3">
              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="flex-1 min-w-[200px] bg-zinc-700/50 border border-zinc-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20"
              >
                <option value="trending">🔥 Trending</option>
                <option value="votes">⬆️ Most Votes</option>
                <option value="recent">🕐 Most Recent</option>
                <option value="alphabetical">🔤 A-Z</option>
              </select>

              {/* Category Filter */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="flex-1 min-w-[200px] bg-zinc-700/50 border border-zinc-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20"
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
                      ? "bg-yellow-500 text-black" 
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Grid3X3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    viewMode === "list" 
                      ? "bg-yellow-500 text-black" 
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Active Filters Display */}
            {(searchTerm || filterCategory !== "all") && (
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-sm text-zinc-400">Active filters:</span>
                {searchTerm && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-sm text-yellow-300">
                    Search: "{searchTerm}"
                    <button onClick={() => setSearchTerm("")} className="hover:text-white">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filterCategory !== "all" && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-sm text-yellow-300">
                    Category: {filterCategory}
                    <button onClick={() => setFilterCategory("all")} className="hover:text-white">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Products Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          {/* Results Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              {filteredProducts.length} Product{filteredProducts.length !== 1 ? 's' : ''} Available
            </h2>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-900/20 border border-red-500 rounded-xl p-6 mb-8">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-red-400" />
                <div>
                  <div className="text-red-400 font-semibold">Error loading voting data</div>
                  <div className="text-red-300 text-sm">{error}</div>
                </div>
              </div>
            </div>
          )}
          
          {/* Loading State */}
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-500/20 rounded-full mb-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
              </div>
              <div className="text-zinc-400 text-lg">Loading products...</div>
            </div>
          ) : filteredProducts.length === 0 ? (
            /* Empty State */
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-zinc-800 rounded-full mb-6">
                <Vote className="w-10 h-10 text-zinc-600" />
              </div>
              <h3 className="text-2xl font-bold text-zinc-400 mb-2">No products found</h3>
              <p className="text-zinc-500 mb-6">Try adjusting your search or filter criteria.</p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterCategory("all");
                }}
                className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-xl transition-all duration-200 hover:scale-105"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            /* Products Grid/List */
            <div className={
              viewMode === "grid"
                ? "grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
            }>
              {filteredProducts.map((product) => {
                const voteCount = getVoteCount(product.id);
                const weightedScore = getWeightedVoteCount(product.id);
                const progressPercent = getProgressPercentage(product.id);
                const isVoted = hasVoted(product.id);
                const isSupplier = user?.tier === "Supplier";
                const canVote = isAuthenticated && !isVoted && getRemainingVotes() > 0 && !isSupplier;
                const isAnimating = votingAnimation === product.id;

                if (viewMode === "list") {
                  return (
                    <div
                      key={product.id}
                      className={`bg-zinc-800/30 backdrop-blur-sm border border-zinc-700 rounded-2xl p-6 hover:bg-zinc-700/30 hover:border-yellow-500/50 transition-all duration-300 ${
                        isAnimating ? 'scale-[1.02] border-yellow-500' : ''
                      }`}
                    >
                      <div className="flex gap-6">
                        {/* Image */}
                        <Link href={getProductUrl(product)} className="flex-shrink-0">
                          <div className="relative w-32 h-32 rounded-xl overflow-hidden bg-zinc-700/50">
                            <Image
                              src={product.image || "/images/placeholder.png"}
                              alt={product.name}
                              fill
                              className="object-cover"
                              sizes="128px"
                            />
                            {product.category && (
                              <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-yellow-400 text-xs px-2 py-1 rounded-full">
                                {product.category}
                              </div>
                            )}
                          </div>
                        </Link>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <Link href={getProductUrl(product)}>
                            <h3 className="text-xl font-bold text-white mb-2 hover:text-yellow-400 transition-colors">
                              {product.name}
                            </h3>
                          </Link>
                          {product.description && (
                            <p className="text-zinc-400 text-sm mb-4 line-clamp-2">
                              {product.description}
                            </p>
                          )}
                          {product.supplier?.name && (
                            <div className="text-sm text-zinc-500 mb-4">
                              by {product.supplier.name}
                            </div>
                          )}

                          {/* Stats Row */}
                          <div className="flex items-center gap-6 mb-4">
                            <div className="flex items-center gap-2">
                              <Vote className="w-4 h-4 text-zinc-400" />
                              <span className="text-sm text-zinc-300">{voteCount} votes</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Trophy className="w-4 h-4 text-yellow-400" />
                              <span className="text-sm text-yellow-400 font-bold">{weightedScore} pts</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-zinc-400" />
                              <span className="text-sm text-zinc-400">{getDaysInStage(product.stageEnteredAt)} days</span>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          {lifecycleConfig && (
                            <div className="mb-4">
                              <div className="flex justify-between text-xs text-zinc-400 mb-1">
                                <span>Progress to Coming Soon</span>
                                <span>{voteCount} / {lifecycleConfig.votingToComingSoonThreshold}</span>
                              </div>
                              <div className="bg-zinc-700 rounded-full h-2">
                                <div
                                  className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${progressPercent}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Vote Button */}
                        <div className="flex-shrink-0">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              handleVote(product.id);
                            }}
                            disabled={!canVote}
                            className={`px-6 py-4 rounded-xl font-bold transition-all duration-200 flex items-center gap-2 ${
                              isVoted
                                ? "bg-green-600 text-white cursor-not-allowed"
                                : isSupplier
                                ? "bg-zinc-600 text-zinc-400 cursor-not-allowed"
                                : !isAuthenticated
                                ? "bg-zinc-600 text-zinc-400 cursor-not-allowed"
                                : getRemainingVotes() === 0
                                ? "bg-zinc-600 text-zinc-400 cursor-not-allowed"
                                : "bg-yellow-500 hover:bg-yellow-600 text-black hover:scale-105 shadow-lg shadow-yellow-500/50"
                            }`}
                          >
                            <Vote className="w-5 h-5" />
                            <span>
                              {isVoted
                                ? "Voted"
                                : isSupplier
                                ? "Suppliers Can't Vote"
                                : !isAuthenticated
                                ? "Login"
                                : getRemainingVotes() === 0
                                ? "No Votes"
                                : "Vote"}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Grid View
                return (
                  <div
                    key={product.id}
                    className={`group bg-zinc-800/30 backdrop-blur-sm border border-zinc-700 rounded-2xl overflow-hidden hover:bg-zinc-700/30 hover:border-yellow-500/50 transition-all duration-300 ${
                      isAnimating ? 'scale-105 border-yellow-500 shadow-xl shadow-yellow-500/50' : ''
                    }`}
                  >
                    {/* Image */}
                    <Link href={getProductUrl(product)}>
                      <div className="relative w-full h-56 bg-zinc-700/50 overflow-hidden">
                        <Image
                          src={product.image || "/images/placeholder.png"}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                        
                        {/* Overlays */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        {product.category && (
                          <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm text-yellow-400 text-xs font-semibold px-3 py-1 rounded-full border border-yellow-500/30">
                            {product.category}
                          </div>
                        )}

                        {product.featured && (
                          <div className="absolute top-3 right-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            Featured
                          </div>
                        )}

                        {/* Vote Count Badge */}
                        <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm text-white text-sm font-bold px-3 py-1 rounded-full border border-zinc-600 flex items-center gap-1">
                          <Trophy className="w-4 h-4 text-yellow-400" />
                          {weightedScore}
                        </div>
                      </div>
                    </Link>

                    {/* Content */}
                    <div className="p-6 space-y-4">
                      <Link href={getProductUrl(product)}>
                        <h3 className="text-xl font-bold text-white group-hover:text-yellow-400 transition-colors line-clamp-2">
                          {product.name}
                        </h3>
                      </Link>

                      {product.description && (
                        <p className="text-zinc-400 text-sm line-clamp-3">
                          {product.description}
                        </p>
                      )}

                      {product.supplier?.name && (
                        <div className="text-xs text-zinc-500">
                          Supplier: {product.supplier.name}
                        </div>
                      )}

                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-2 pt-4 border-t border-zinc-700/50">
                        <div className="text-center">
                          <div className="text-lg font-bold text-white">{voteCount}</div>
                          <div className="text-xs text-zinc-400">Votes</div>
                        </div>
                        <div className="text-center border-x border-zinc-700/50">
                          <div className="text-lg font-bold text-yellow-400">{weightedScore}</div>
                          <div className="text-xs text-zinc-400">Score</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-white">{getDaysInStage(product.stageEnteredAt)}</div>
                          <div className="text-xs text-zinc-400">Days</div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {lifecycleConfig && (
                        <div>
                          <div className="flex justify-between text-xs text-zinc-400 mb-2">
                            <span>To Coming Soon</span>
                            <span>{Math.round(progressPercent)}%</span>
                          </div>
                          <div className="bg-zinc-700 rounded-full h-2.5 overflow-hidden">
                            <div
                              className={`h-2.5 rounded-full transition-all duration-500 ${
                                progressPercent >= 100
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                  : 'bg-gradient-to-r from-yellow-500 to-orange-500'
                              }`}
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                          {progressPercent >= 100 && (
                            <div className="text-xs text-green-400 mt-1 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Ready for next stage!
                            </div>
                          )}
                        </div>
                      )}

                      {/* Vote Button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleVote(product.id);
                        }}
                        disabled={!canVote}
                        className={`w-full py-3.5 px-4 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
                          isVoted
                            ? "bg-green-600 text-white cursor-not-allowed"
                            : isSupplier
                            ? "bg-zinc-600 text-zinc-400 cursor-not-allowed"
                            : !isAuthenticated
                            ? "bg-zinc-600 text-zinc-400 cursor-not-allowed hover:bg-zinc-500"
                            : getRemainingVotes() === 0
                            ? "bg-zinc-600 text-zinc-400 cursor-not-allowed"
                            : "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black hover:scale-105 shadow-lg shadow-yellow-500/50"
                        }`}
                      >
                        {isVoted ? (
                          <>
                            <CheckCircle className="w-5 h-5" />
                            <span>Voted Today</span>
                          </>
                        ) : isSupplier ? (
                          <>
                            <X className="w-5 h-5" />
                            <span>Suppliers Can't Vote</span>
                          </>
                        ) : !isAuthenticated ? (
                          <>
                            <Vote className="w-5 h-5" />
                            <span>Login to Vote</span>
                          </>
                        ) : getRemainingVotes() === 0 ? (
                          <>
                            <Clock className="w-5 h-5" />
                            <span>No Votes Left</span>
                          </>
                        ) : (
                          <>
                            <Vote className="w-5 h-5" />
                            <span>Vote Now</span>
                            <Zap className="w-4 h-4 animate-pulse" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Voting Info Modal */}
        {showVotingModal && (
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowVotingModal(false);
              }
            }}
          >
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-700 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              {/* Modal Header */}
              <div className="sticky top-0 z-10 bg-zinc-900/95 backdrop-blur-xl flex items-center justify-between p-6 border-b border-zinc-700">
                <h2 className="text-3xl font-bold flex items-center gap-3">
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                    <Star className="w-6 h-6 text-yellow-400" />
                  </div>
                  <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                    How Voting Works
                  </span>
                </h2>
                <button
                  onClick={() => setShowVotingModal(false)}
                  className="text-zinc-400 hover:text-white transition-colors p-2 hover:bg-zinc-800 rounded-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {/* Modal Content */}
              {votingConfig && (
                <div className="p-6">
                  {/* Overview */}
                  <div className="mb-4 p-4 bg-gradient-to-br from-yellow-900/20 to-orange-900/20 border border-yellow-500/30 rounded-xl">
                    <h3 className="text-lg font-bold text-yellow-400 mb-2 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Your Vote Shapes MIGISTUS
                    </h3>
                    <p className="text-sm text-zinc-300 leading-relaxed">
                      Every vote counts toward which products make it to our marketplace. Higher-tier members have increased voting power.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    {/* Tier Voting Limits */}
                    <div>
                      <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                        <Vote className="w-4 h-4 text-yellow-400" />
                        Daily Vote Limits
                      </h3>
                      <div className="space-y-2">
                        {Object.entries(votingConfig.tierLimits || {}).map(([tier, limit]) => {
                          const isCurrentTier = user?.tier === tier;
                          return (
                            <div key={tier} className={`bg-zinc-800/50 border rounded-lg p-2.5 transition-colors relative ${
                              isCurrentTier ? 'border-green-500 ring-1 ring-green-500/50 bg-green-900/10' : 'border-zinc-700'
                            }`}>
                              {isCurrentTier && (
                                <div className="absolute -top-1.5 -right-1.5 bg-green-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                  YOU
                                </div>
                              )}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${
                                    tier === 'MIGISTUS' ? 'from-purple-500 to-pink-500' :
                                    tier === 'Guild' ? 'from-yellow-500 to-orange-500' :
                                    'from-zinc-600 to-zinc-700'
                                  } flex items-center justify-center`}>
                                    {tier === 'MIGISTUS' ? <Crown className="w-4 h-4 text-white" /> :
                                     tier === 'Guild' ? <Star className="w-4 h-4 text-white" /> :
                                     <Users className="w-4 h-4 text-white" />}
                                  </div>
                                  <span className={`text-sm font-bold ${getTierColor(tier)}`}>{tier}</span>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-black text-white">{limit}</div>
                                  <div className="text-[10px] text-zinc-400">votes/day</div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Vote Multipliers */}
                    <div>
                      <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        Vote Power Multipliers
                      </h3>
                      <div className="space-y-2">
                        {Object.entries(votingConfig.tierMultipliers || {}).map(([tier, multiplier]) => {
                          const isCurrentTier = user?.tier === tier;
                          return (
                            <div key={tier} className={`bg-zinc-800/50 border rounded-lg p-2.5 transition-colors relative ${
                              isCurrentTier ? 'border-green-500 ring-1 ring-green-500/50 bg-green-900/10' : 'border-zinc-700'
                            }`}>
                              {isCurrentTier && (
                                <div className="absolute -top-1.5 -right-1.5 bg-green-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                  YOU
                                </div>
                              )}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${
                                    tier === 'MIGISTUS' ? 'from-purple-500 to-pink-500' :
                                    tier === 'Guild' ? 'from-yellow-500 to-orange-500' :
                                    'from-zinc-600 to-zinc-700'
                                  } flex items-center justify-center`}>
                                    {tier === 'MIGISTUS' ? <Crown className="w-4 h-4 text-white" /> :
                                     tier === 'Guild' ? <Star className="w-4 h-4 text-white" /> :
                                     <Users className="w-4 h-4 text-white" />}
                                  </div>
                                  <span className={`text-sm font-bold ${getTierColor(tier)}`}>{tier}</span>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-black bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                                    {multiplier}x
                                  </div>
                                  <div className="text-[10px] text-zinc-400">power</div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Info Cards - Compact Grid */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                        <div className="text-xs font-bold text-blue-300">Daily Reset</div>
                      </div>
                      <p className="text-[11px] text-blue-200">Votes reset at midnight</p>
                    </div>

                    <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                        <div className="text-xs font-bold text-green-300">Impact Matters</div>
                      </div>
                      <p className="text-[11px] text-green-200">High votes = priority drops</p>
                    </div>

                    <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Flame className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                        <div className="text-xs font-bold text-orange-300">No Carryover</div>
                      </div>
                      <p className="text-[11px] text-orange-200">Daily votes don't carry over to the next day</p>
                    </div>

                    <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Award className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                        <div className="text-xs font-bold text-purple-300">Tier Benefits</div>
                      </div>
                      <p className="text-[11px] text-purple-200">More votes & power</p>
                    </div>
                  </div>

                  {/* CTA */}
                  {!isAuthenticated ? (
                    <div className="text-center p-4 bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border border-yellow-500/50 rounded-xl">
                      <h4 className="text-base font-bold text-white mb-2">Ready to Make Your Voice Heard?</h4>
                      <div className="flex gap-3 justify-center">
                        <button
                          onClick={() => (window as any).openAuthModal?.(true)}
                          className="px-6 py-2.5 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black text-sm font-bold rounded-lg transition-all"
                        >
                          Join The Guild
                        </button>
                        <button
                          onClick={() => (window as any).openAuthModal?.()}
                          className="px-6 py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-bold rounded-lg transition-all"
                        >
                          Login
                        </button>
                      </div>
                    </div>
                  ) : user?.tier !== 'MIGISTUS' && user?.tier !== 'Admin' && (
                    <div className="text-center p-4 bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-500/50 rounded-xl">
                      <h4 className="text-base font-bold text-white mb-2 flex items-center justify-center gap-2">
                        <TrendingUp className="w-4 h-4 text-purple-400" />
                        Want More Voting Power?
                      </h4>
                      <Link
                        href="/upgrade-tier"
                        onClick={() => setShowVotingModal(false)}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm font-bold rounded-lg transition-all"
                      >
                        <Crown className="w-4 h-4" />
                        Upgrade Your Tier
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
