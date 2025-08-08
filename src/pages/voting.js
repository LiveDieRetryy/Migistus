import Head from "next/head";
import { useState, useEffect } from "react";
import { Vote, Trophy, Crown, Users, Star, ChevronUp, ChevronDown, Filter, Search, Sparkles, HelpCircle, X, Clock, CheckCircle, TrendingUp } from "lucide-react";
import MainNavbar from "@/components/nav/MainNavbar";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import Link from "next/link";
import { UserStorage3 as UserStorage } from "@/utils/userStorage";
import { getStageInfo, getDaysInStage, getTimeUntilNextStage } from "@/utils/productLifecycle";
import { getProductUrl } from "@/utils/productUtils";

export default function VotingPage() {
  const { user, isAuthenticated } = useAuth();  const [products, setProducts] = useState([]);
  const [votes, setVotes] = useState([]);
  const [votingConfig, setVotingConfig] = useState(null);
  const [lifecycleConfig, setLifecycleConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("votes"); // votes, name, category
  const [filterCategory, setFilterCategory] = useState("all");
  const [showStats, setShowStats] = useState(true);
  const [showVotingModal, setShowVotingModal] = useState(false);
  
  useEffect(() => {
    fetchData();
  }, []);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setShowVotingModal(false);
      }
    };

    if (showVotingModal) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showVotingModal]);
  
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch products
      const productsRes = await fetch("/api/products");
      if (!productsRes.ok) {
        throw new Error(`Products API failed: ${productsRes.status}`);
      }
      const productsData = await productsRes.json();
      setProducts(productsData.products || []);

      // Fetch votes
      const votesRes = await fetch("/api/votes");
      if (!votesRes.ok) {
        throw new Error(`Votes API failed: ${votesRes.status}`);
      }
      const votesData = await votesRes.json();
      setVotes(votesData.votes || []);

      // Fetch voting config
      const configRes = await fetch("/api/voting-config");
      if (!configRes.ok) {
        throw new Error(`Voting config API failed: ${configRes.status}`);
      }
      const configData = await configRes.json();
      setVotingConfig(configData);

      // Fetch lifecycle config
      try {
        const lifecycleRes = await fetch("/api/product-lifecycle/config");
        if (lifecycleRes.ok) {
          const lifecycleData = await lifecycleRes.json();
          setLifecycleConfig(lifecycleData);
        }
      } catch (lifecycleError) {
        console.log("Lifecycle config not available:", lifecycleError);
      }

    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get vote count for a product
  const getVoteCount = (productId) => {
    return votes.filter(vote => vote.productId === productId).length;
  };

  // Get weighted vote count (considering tier multipliers)
  const getWeightedVoteCount = (productId) => {
    return votes
      .filter(vote => vote.productId === productId)
      .reduce((total, vote) => {
        const multiplier = votingConfig?.tierMultipliers?.[vote.tier] || 1;
        return total + (vote.value * multiplier);
      }, 0);
  };  // Check if user has voted for a product today
  const hasVoted = (productId) => {
    if (!user) return false;
    const today = new Date().toDateString();
    
    // Check both API votes and local storage votes
    const apiVotedToday = votes.some(vote => 
      vote.productId === productId && 
      vote.userId === user.id &&
      new Date(vote.timestamp).toDateString() === today
    );
    
    const localVotedToday = UserStorage.hasVotedTodayForProduct(user.id, productId);
    
    return apiVotedToday || localVotedToday;
  };

  // Get user's remaining votes for today
  const getRemainingVotes = () => {
    if (!user || !votingConfig) return 0;
    const userTier = user.tier || "Initiate";
    const maxVotes = votingConfig.tierLimits?.[userTier] || 1;
    
    // Count votes from today (both API and local storage)
    const today = new Date().toDateString();
    const apiVotesToday = votes.filter(vote => 
      vote.userId === user.id && 
      new Date(vote.timestamp).toDateString() === today
    ).length;
    
    const localVotesToday = UserStorage.getTodaysVoteCount(user.id);
    
    // Use the higher count to prevent discrepancies
    const totalVotesToday = Math.max(apiVotesToday, localVotesToday);
    
    return Math.max(0, maxVotes - totalVotesToday);
  };

  // Handle voting
  const handleVote = async (productId) => {
    if (!isAuthenticated || !user || hasVoted(productId)) return;

    // Find the product name for better activity description
    const product = products.find(p => p.id === productId);
    const productName = product?.name || 'Unknown Product';

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
        // Track the vote in user storage for activity timeline
        UserStorage.addUserVote(user.id, {
          productId,
          productName,
          tier: user.tier || "Initiate",
          value: 1,
          timestamp: new Date().toISOString()
        });        await fetchData(); // Refresh data
      }
    } catch (error) {
      console.error("Failed to vote:", error);
    }
  };

  // Get time until vote reset (midnight)
  const getTimeUntilReset = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilReset = tomorrow.getTime() - now.getTime();
    const hoursUntilReset = Math.floor(msUntilReset / (1000 * 60 * 60));
    const minutesUntilReset = Math.floor((msUntilReset % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hoursUntilReset > 0) {
      return `${hoursUntilReset}h ${minutesUntilReset}m`;
    } else {
      return `${minutesUntilReset}m`;
    }
  };

  // Filter and sort products
  const filteredProducts = products
    .filter(product => product.stage === 'voting')
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === "all" || product.category === filterCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "votes":
          return getWeightedVoteCount(b.id) - getWeightedVoteCount(a.id);
        case "name":
          return a.name.localeCompare(b.name);
        case "category":
          return (a.category || "").localeCompare(b.category || "");
        default:
          return 0;
      }
    });

  // Get top products
  const topProducts = [...products]
    .sort((a, b) => getWeightedVoteCount(b.id) - getWeightedVoteCount(a.id))
    .slice(0, 3);

  // Get categories
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  const getTierColor = (tier) => {
    switch (tier) {
      case "MIGISTUS": return "text-purple-400";
      case "Guild": return "text-yellow-400";
      default: return "text-zinc-400";
    }
  };

  const getTierIcon = (tier) => {
    switch (tier) {
      case "MIGISTUS": return <Crown className="w-4 h-4" />;
      case "Guild": return <Star className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  return (
    <>
      <Head>
        <title>Product Voting - MIGISTUS | Shape the Future</title>
        <meta name="description" content="Vote for products you want to see in upcoming MIGISTUS drops. Your voice shapes our marketplace." />
      </Head>
      
      <MainNavbar />
      
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white">
        {/* Hero Section */}
        <div className="relative overflow-hidden pt-8 pb-24">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/10 via-transparent to-purple-900/10" />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <Vote className="w-16 h-16 text-yellow-400" />
                  <Sparkles className="w-6 h-6 text-yellow-300 absolute -top-2 -right-2 animate-pulse" />
                </div>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
                <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                  Shape the Future
                </span>
              </h1>              <p className="text-xl text-zinc-300 max-w-3xl mx-auto leading-relaxed mb-8">
                Vote for products you want to see in upcoming drops. Your voice matters, and higher-tier members have greater influence.
              </p>

              {/* Voting Tiers Button for Non-Authenticated Users */}
              {!isAuthenticated && (
                <div className="mb-8">
                  <button
                    onClick={() => setShowVotingModal(true)}
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-600 rounded-xl text-zinc-300 hover:text-white transition-all duration-200"
                  >
                    <HelpCircle className="w-5 h-5" />
                    <span className="font-medium">Learn About Voting Tiers</span>
                  </button>
                </div>
              )}{/* User Voting Status */}
              {isAuthenticated && user && (
                <div className="max-w-md mx-auto bg-zinc-800/50 border border-zinc-700 rounded-xl p-6">
                  <div className="flex items-center justify-center mb-4">
                    {getTierIcon(user.tier)}
                    <span className={`ml-2 font-semibold ${getTierColor(user.tier)}`}>
                      {user.tier || "Initiate"} Member
                    </span>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">{getRemainingVotes()}</div>
                    <div className="text-sm text-zinc-400">Votes Remaining Today</div>
                    {getRemainingVotes() === 0 && (
                      <div className="text-xs text-zinc-500 mt-2">
                        🔄 Votes reset in {getTimeUntilReset()}
                      </div>
                    )}
                  </div>
                  
                  {/* Voting Tiers Explained Button */}
                  <div className="mt-4 pt-4 border-t border-zinc-700">
                    <button
                      onClick={() => setShowVotingModal(true)}
                      className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-zinc-700/50 hover:bg-zinc-600/50 border border-zinc-600 rounded-lg text-zinc-300 hover:text-white transition-all duration-200"
                    >
                      <HelpCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Voting Tiers Explained</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-zinc-800/30 border border-zinc-700 rounded-2xl p-6 mb-8">
            <div className="grid md:grid-cols-3 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-zinc-700/50 border border-zinc-600 rounded-xl pl-10 pr-4 py-3 text-white placeholder-zinc-400 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20"
                  />
                </div>

                {/* Category Filter */}
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-zinc-700/50 border border-zinc-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-zinc-700/50 border border-zinc-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500"
                >
                  <option value="votes">Sort by Votes</option>
                  <option value="name">Sort by Name</option>
                  <option value="category">Sort by Category</option>
                </select>
              </div>
            </div>
          </div>

        {/* Products Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          {error && (
            <div className="bg-red-900/20 border border-red-500 rounded-xl p-4 mb-8">
              <div className="text-red-400 font-semibold">Error loading voting data:</div>
              <div className="text-red-300 text-sm">{error}</div>
            </div>
          )}
          
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div>
              <div className="text-zinc-400 mt-4">Loading products...</div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Vote className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-zinc-400 mb-2">No products found</h3>
              <p className="text-zinc-500">Try adjusting your search or filter criteria.</p>
            </div>
          ) : (            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <Link key={product.id} href={getProductUrl(product)} className="block">
                  <div className="bg-zinc-800/30 border border-zinc-700 rounded-2xl p-6 hover:bg-zinc-700/30 hover:border-yellow-500/50 transition-all duration-300 cursor-pointer">
                  {/* Product Image */}
                  <div className="relative w-full h-48 mb-4 rounded-xl overflow-hidden bg-zinc-700/50">
                    <Image
                      src={product.image || "/images/placeholder.png"}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    {product.category && (
                      <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm text-yellow-400 text-xs px-2 py-1 rounded-full">
                        {product.category}
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">{product.name}</h3>
                      {product.description && (
                        <p className="text-zinc-400 text-sm line-clamp-2">{product.description}</p>
                      )}
                    </div>

                    {/* Vote Statistics */}
                    <div className="bg-zinc-700/30 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-zinc-400">Total Votes</span>
                        <span className="font-bold text-white">{getVoteCount(product.id)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-zinc-400">Weighted Score</span>
                        <span className="font-bold text-yellow-400">{getWeightedVoteCount(product.id)}</span>
                      </div>
                    </div>                    {/* Stage Information */}
                    {product.stage && (
                      <div className="bg-zinc-700/30 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-zinc-400">Stage</span>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            product.stage === 'voting' ? 'bg-blue-500 text-white' :
                            product.stage === 'coming-soon' ? 'bg-yellow-500 text-black' :
                            product.stage === 'community-drops' ? 'bg-green-500 text-white' :
                            'bg-gray-500 text-white'
                          }`}>
                            {getStageInfo(product.stage).label}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-zinc-400">Days in Stage</span>
                          <span className="font-bold text-yellow-400">{getDaysInStage(product.stageEnteredAt)} days</span>
                        </div>
                        {lifecycleConfig && product.stage === 'voting' && (
                          <div className="mt-2">
                            <div className="flex justify-between items-center text-sm mb-1">
                              <span className="text-zinc-400">Progress to Coming Soon</span>
                              <span className="text-zinc-300">{getVoteCount(product.id)} / {lifecycleConfig.votingToComingSoonThreshold}</span>
                            </div>
                            <div className="bg-zinc-600 rounded-full h-2">
                              <div 
                                className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                                style={{
                                  width: `${Math.min(100, (getVoteCount(product.id) / lifecycleConfig.votingToComingSoonThreshold) * 100)}%`
                                }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}                    {/* Vote Button */}
                    <button
                      onClick={() => handleVote(product.id)}
                      disabled={!isAuthenticated || hasVoted(product.id) || getRemainingVotes() === 0 || (product.stage && product.stage !== 'voting')}
                      className={`w-full py-3 px-4 rounded-xl font-bold transition-all duration-200 flex items-center justify-center space-x-2 ${
                        product.stage && product.stage !== 'voting'
                          ? "bg-zinc-600 text-zinc-400 cursor-not-allowed"
                          : hasVoted(product.id)
                          ? "bg-green-600 text-white cursor-not-allowed"
                          : !isAuthenticated
                          ? "bg-zinc-600 text-zinc-400 cursor-not-allowed"
                          : getRemainingVotes() === 0
                          ? "bg-zinc-600 text-zinc-400 cursor-not-allowed"
                          : "bg-yellow-500 hover:bg-yellow-600 text-black hover:scale-105"
                      }`}
                    >
                      <Vote className="w-5 h-5" />
                      <span>
                        {product.stage && product.stage !== 'voting'
                          ? getStageInfo(product.stage).label
                          : hasVoted(product.id)
                          ? "Voted Today"
                          : !isAuthenticated
                          ? "Login to Vote"
                          : getRemainingVotes() === 0
                          ? "Daily Limit Reached"
                          : "Vote"}
                      </span>                    </button>
                  </div>
                </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Voting Tiers Modal */}
        {showVotingModal && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowVotingModal(false);
              }
            }}
          >
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-zinc-700">
                <h2 className="text-2xl font-bold text-yellow-400 flex items-center">
                  <Star className="w-6 h-6 mr-2" />
                  How Voting Works
                </h2>
                <button
                  onClick={() => setShowVotingModal(false)}
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {/* Modal Content */}
              {votingConfig && (
                <div className="p-6">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">Tier Voting Limits</h3>
                      <div className="space-y-3">
                        {Object.entries(votingConfig.tierLimits || {}).map(([tier, limit]) => (
                          <div key={tier} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                            <div className="flex items-center space-x-2">
                              {getTierIcon(tier)}
                              <span className={getTierColor(tier)}>{tier}</span>
                            </div>
                            <span className="font-bold text-white">{limit} votes</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">Vote Multipliers</h3>
                      <div className="space-y-3">
                        {Object.entries(votingConfig.tierMultipliers || {}).map(([tier, multiplier]) => (
                          <div key={tier} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                            <div className="flex items-center space-x-2">
                              {getTierIcon(tier)}
                              <span className={getTierColor(tier)}>{tier}</span>
                            </div>
                            <span className="font-bold text-yellow-400">{multiplier}x power</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <p className="text-yellow-200 text-sm">
                      <strong>Note:</strong> Products with the most weighted votes will be prioritized for upcoming drops. 
                      Higher-tier members have more voting power to reflect their commitment to the platform.
                    </p>
                  </div>

                  <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-blue-200 text-sm">
                      <strong>Daily Reset:</strong> Your voting limits reset every day at midnight. 
                      Use your votes wisely to influence which products make it to the marketplace!
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}