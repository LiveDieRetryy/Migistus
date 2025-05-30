import React, { useState, useEffect } from 'react';
import { Clock, Users, TrendingDown, Star, Share2, Heart, MessageCircle, Crown, Zap, Shield, ArrowLeft, Eye } from 'lucide-react';
import { containsProfanity, filterProfanity } from "@/components/chat/ProfanityFilter";
import MainNavbar from "@/components/nav/MainNavbar";
import { useRouter } from "next/router";

function isInappropriateContent(text) {
  if (!text) return false;
  if (containsProfanity(text)) return true;
  if (text.length > 200) return true;
  if (/([A-Z]{6,})/.test(text)) return true;
  if (/(\w)\1{4,}/.test(text)) return true;
  if (/http(s)?:\/\//.test(text)) return true;
  if (/buy now|free|discount|deal/i.test(text)) return true;
  return false;
}

const ProductPage = ({ productId }) => {
  const [pledgeCount, setPledgeCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(43200); // seconds
  const [hasPledged, setHasPledged] = useState(false);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [showPledgeModal, setShowPledgeModal] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [chatMessage, setChatMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hoveredProfile, setHoveredProfile] = useState(null);
  const [hoverTimeout, setHoverTimeout] = useState(null);
  const [showProfanityWarning, setShowProfanityWarning] = useState(false);
  const [product, setProduct] = useState(null);
  const [communityMessages, setCommunityMessages] = useState([]);
  const router = useRouter();

  // Default pricing tiers
  const defaultPricingTiers = [
    { min: 1, max: 9, price: 29.99, label: "1-9 units", tier: "Initiate" },
    { min: 10, max: 49, price: 24.99, label: "10-49 units", tier: "Gathering" },
    { min: 50, max: 99, price: 19.99, label: "50-99 units", tier: "Coalition" },
    { min: 100, max: 199, price: 16.99, label: "100-199 units", tier: "Legion" },
    { min: 200, max: 999, price: 12.99, label: "200+ units", tier: "Empire" }
  ];

  // Community messages
  const currentUser = {
    user: "You",
    tier: "Guild",
    avatar: "😎",
    verified: false,
    profile: {
      banner: "linear-gradient(135deg, #ffd89b 0%, #19547b 100%)",
      title: "Tech Enthusiast",
      joinDate: "December 2024",
      totalPledges: 15,
      totalSaved: "$567"
    }
  };

  // Handle profile hover
  const handleProfileHover = (user, enter = true) => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }

    if (enter) {
      const timeout = setTimeout(() => {
        setHoveredProfile(user);
      }, 500); // 500ms delay before showing
      setHoverTimeout(timeout);
    } else {
      const timeout = setTimeout(() => {
        setHoveredProfile(null);
      }, 300); // 300ms delay before hiding
      setHoverTimeout(timeout);
    }
  };

  // Handle profile card hover (keep it open when hovering over the card)
  const handleProfileCardHover = (enter = true) => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }

    if (!enter) {
      const timeout = setTimeout(() => {
        setHoveredProfile(null);
      }, 300);
      setHoverTimeout(timeout);
    }
  };

  // Fetch product data from backend
  useEffect(() => {
    if (!productId) return;
    fetch("/api/products")
      .then(res => res.json())
      .then(data => {
        const match = (data.products || data).find(
          (p) =>
            (p.slug && p.slug === productId) ||
            p.name.toLowerCase().replace(/\s+/g, "-") === productId
        );
        if (match) {
          setProduct(match);
          setPledgeCount(match.pledges || 0);
          setCurrentPrice(getCurrentTierPrice(match.pricingTiers || defaultPricingTiers, match.pledges || 0));
        }
      })
      .catch(err => {
        console.error("Error fetching product:", err);
        // Set default product if fetch fails
        setProduct({
          name: "Product",
          description: "Product description",
          category: "Category",
          image: "/api/placeholder/600/600",
          originalPrice: 39.99,
          pricingTiers: defaultPricingTiers,
          pledges: 0,
          goal: 100,
          rating: 0,
          reviews: 0
        });
      });
  }, [productId]);

  // Fetch chat messages from backend (with polling)
  useEffect(() => {
    if (!productId) return;
    let isMounted = true;
    const fetchMessages = () => {
      fetch(`/api/chat/${productId}`)
        .then(res => res.json())
        .then(msgs => { 
          if (isMounted && Array.isArray(msgs)) {
            // Ensure each message has an id
            const messagesWithIds = msgs.map((msg, index) => ({
              ...msg,
              id: msg.id || `msg-${Date.now()}-${index}`
            }));
            setCommunityMessages(messagesWithIds);
          }
        })
        .catch(() => { 
          if (isMounted) setCommunityMessages([]); 
        });
    };
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Poll every 5s
    return () => { 
      isMounted = false; 
      clearInterval(interval); 
    };
  }, [productId]);

  // Get effective pricing tiers
  const effectivePricingTiers = product?.pricingTiers && product.pricingTiers.length > 0
    ? product.pricingTiers
    : defaultPricingTiers;

  // Calculate current price based on pledge count
  const getCurrentTier = () => {
    return effectivePricingTiers.find(tier => pledgeCount >= tier.min && pledgeCount <= tier.max) || effectivePricingTiers[0];
  };

  const getNextTier = () => {
    const currentTier = getCurrentTier();
    const currentIndex = effectivePricingTiers.indexOf(currentTier);
    return currentIndex < effectivePricingTiers.length - 1 ? effectivePricingTiers[currentIndex + 1] : null;
  };

  // Format time remaining
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Update price based on pledge count
  useEffect(() => {
    const currentTier = getCurrentTier();
    setCurrentPrice(currentTier.price);
  }, [pledgeCount, product]);

  // Helper to get current price from pricingTiers
  const getCurrentTierPrice = (tiers, pledges) => {
    if (!tiers || !Array.isArray(tiers) || tiers.length === 0) return 29.99; // Default price
    const tier = tiers.find(t => pledges >= t.min && pledges <= t.max);
    return tier ? tier.price : tiers[0].price;
  };

  // Handle pledge (update backend)
  const handlePledge = async () => {
    if (!product || hasPledged) return;
    try {
      const res = await fetch("/api/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...product, pledges: pledgeCount + 1 }),
      });
      if (res.ok) {
        setPledgeCount(pledgeCount + 1);
        setCurrentPrice(getCurrentTierPrice(effectivePricingTiers, pledgeCount + 1));
        setHasPledged(true);
        setShowPledgeModal(false);
      }
    } catch (err) {
      console.error("Error updating pledge:", err);
      // Still update local state even if backend fails
      setPledgeCount(pledgeCount + 1);
      setHasPledged(true);
      setShowPledgeModal(false);
    }
  };

  // Post chat message to backend
  const handleSendMessage = async () => {
    if (chatMessage.trim() && hasPledged) {
      const trimmedMessage = chatMessage.trim();
      // Only do local inappropriate content check (spam, caps, promo)
      if (isInappropriateContent(trimmedMessage)) {
        setShowProfanityWarning(true);
        setTimeout(() => setShowProfanityWarning(false), 4000);
        return;
      }
      const newMessage = {
        id: `msg-${Date.now()}`,
        user: currentUser.user,
        tier: currentUser.tier,
        avatar: currentUser.avatar,
        message: trimmedMessage,
        time: "now",
        verified: currentUser.verified,
        likes: 0,
        profile: currentUser.profile
      };
      
      // Optimistically add the message
      setCommunityMessages(prev => [newMessage, ...prev]);
      setChatMessage('');
      setIsTyping(false);
      
      try {
        await fetch(`/api/chat/${productId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newMessage)
        });
      } catch (err) {
        console.error("Error sending message:", err);
      }
    }
  };

  // Handle emoji reactions
  const handleEmojiReaction = (emoji) => {
    if (hasPledged) {
      const reactionMessage = {
        id: `reaction-${Date.now()}`,
        user: currentUser.user,
        tier: currentUser.tier,
        avatar: currentUser.avatar,
        message: emoji,
        time: "now",
        verified: currentUser.verified,
        likes: 0,
        isReaction: true,
        profile: currentUser.profile
      };
      
      setCommunityMessages(prev => [reactionMessage, ...prev]);
    }
  };

  // Handle liking messages
  const handleLikeMessage = (messageId) => {
    setCommunityMessages(prev => 
      prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, likes: (msg.likes || 0) + 1 }
          : msg
      )
    );
  };

  // Handle typing indicator
  const handleTyping = (value) => {
    setChatMessage(value);
    setIsTyping(value.length > 0);
  };

  const progressPercentage = product && product.goal ? Math.min((pledgeCount / product.goal) * 100, 100) : 0;
  const currentTier = getCurrentTier();
  const nextTier = getNextTier();

  const getTierColor = (tierName) => {
    switch(tierName) {
      case 'MIGISTUS': return 'text-yellow-400 border-yellow-500/50';
      case 'Guild': return 'text-blue-400 border-blue-500/50';
      default: return 'text-gray-400 border-gray-500/50';
    }
  };

  // Defensive fallback for productImages
  const productImages = product?.image ? [product.image] : ["/api/placeholder/600/600"];
  const safeActiveImageIndex = Math.min(activeImageIndex, productImages.length - 1);

  // Add early return for loading state
  if (!product) {
    return (
      <>
        <MainNavbar />
        <div className="min-h-screen flex items-center justify-center bg-black text-white px-4">
          <span className="text-lg">Loading product...</span>
        </div>
      </>
    );
  }

  // Safe values with fallbacks
  const safeProduct = {
    name: product.name || "Product",
    description: product.description || "No description available.",
    category: product.category || "Category",
    originalPrice: product.originalPrice || 39.99,
    rating: product.rating || 0,
    reviews: product.reviews || 0,
    goal: product.goal || 100,
    ...product
  };

  return (
    <>
      <MainNavbar />
      <div className="min-h-screen bg-gradient-to-b from-black to-black text-white font-sans">
        {/* Navigation */}
        <nav className="bg-black/80 backdrop-blur-sm border-b border-yellow-500/20">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center space-x-4">
                <button
                  className="flex items-center space-x-2 text-gray-400 hover:text-yellow-400 transition-colors"
                  onClick={() => router.push("/drops")}
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="hidden sm:inline">Back to Drops</span>
                </button>
                <div className="hidden sm:block w-px h-6 bg-gray-700"></div>
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-yellow-300 to-yellow-500 bg-clip-text text-transparent">
                  MIGISTUS
                </h1>
              </div>
              <div className="flex items-center space-x-4 mt-2 sm:mt-0">
                <div className="flex items-center space-x-2 bg-gray-800/50 px-3 py-2 rounded-lg border border-gray-700">
                  <Crown className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs sm:text-sm text-yellow-300 font-medium">Guild Member</span>
                </div>
                <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full"></div>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-2 sm:px-6 py-4 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
            {/* Product Images */}
            <div className="space-y-4">
              <div className="relative aspect-square bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl overflow-hidden border border-gray-700">
                <img 
                  src={productImages[safeActiveImageIndex]} 
                  alt={safeProduct.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4">
                  <div className="bg-black/70 backdrop-blur-sm px-3 py-1 rounded-full border border-yellow-500/30">
                    <span className="text-yellow-300 text-xs sm:text-sm font-medium flex items-center">
                      <Eye className="w-4 h-4 mr-1" />
                      Live Drop
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2 sm:space-x-3 overflow-x-auto">
                {productImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImageIndex(index)}
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      activeImageIndex === index 
                        ? 'border-yellow-500 shadow-lg shadow-yellow-500/25' 
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <img src={image} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-6 sm:space-y-8">
              {/* Title and Rating */}
              <div>
                <div className="inline-block bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-xs sm:text-sm font-medium mb-4 border border-blue-500/30">
                  {safeProduct.category}
                </div>
                <h1 className="text-2xl sm:text-4xl font-bold text-white mb-4 leading-tight">{safeProduct.name}</h1>
                <div className="flex flex-wrap items-center space-x-2 sm:space-x-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-4 h-4 sm:w-5 sm:h-5 ${i < Math.floor(safeProduct.rating) ? 'text-yellow-400 fill-current' : 'text-gray-600'}`}
                      />
                    ))}
                    <span className="ml-2 text-gray-300 text-xs sm:text-base">
                      {safeProduct.rating > 0 ? `${safeProduct.rating} (${safeProduct.reviews} reviews)` : "No reviews yet"}
                    </span>
                  </div>
                  <div className="hidden sm:block h-4 w-px bg-gray-600"></div>
                  <div className="flex items-center space-x-1 text-yellow-400">
                    <Zap className="w-4 h-4" />
                    <span className="text-xs sm:text-sm font-medium">Verified Quality</span>
                  </div>
                </div>
              </div>

              {/* Drop Status */}
              <div className="relative bg-gradient-to-r from-gray-800/80 to-gray-800/80 rounded-2xl p-4 sm:p-8 border border-gray-700 backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-yellow-500/5 rounded-2xl"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-yellow-500/20 rounded-xl">
                        <Clock className="w-6 h-6 text-yellow-400" />
                      </div>
                      <div>
                        <span className="font-bold text-yellow-300 block text-lg">Drop Ends In</span>
                        <span className="text-sm text-gray-400">Limited time offer</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-bold text-yellow-400 font-mono">
                        {formatTime(timeLeft)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-blue-500/20 rounded-xl">
                        <Users className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <span className="font-bold text-blue-300 text-lg">{pledgeCount} Pledged</span>
                        <div className="text-sm text-gray-400">Current tier: {currentTier.tier}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-300">Target</span>
                      <div className="text-2xl font-bold text-white">{safeProduct.goal}</div>
                    </div>
                  </div>
                  
                  <div className="relative w-full bg-gray-700 rounded-full h-4 mb-4 overflow-hidden">
                    <div 
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-400 rounded-full transition-all duration-500 shadow-lg shadow-yellow-500/50"
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                  
                  <div className="text-center">
                    {safeProduct.goal - pledgeCount > 0 ? (
                      <p className="text-yellow-300 font-medium">
                        {safeProduct.goal - pledgeCount} more pledges needed to reach minimum order quantity
                      </p>
                    ) : (
                      <p className="text-green-400 font-bold">
                        ✓ Minimum order quantity reached!
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Current Price */}
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-700 p-4 sm:p-8 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-yellow-500/10 to-transparent rounded-full"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-5xl font-bold text-yellow-400">${currentPrice}</span>
                        <div className="p-2 bg-green-500/20 rounded-lg">
                          <TrendingDown className="w-6 h-6 text-green-400" />
                        </div>
                      </div>
                      <p className="text-gray-300 font-medium">Current price ({currentTier.label})</p>
                      <p className="text-sm text-gray-500">Tier: <span className="text-yellow-400 font-medium">{currentTier.tier}</span></p>
                      <p className="text-sm text-gray-500 line-through">MSRP: ${safeProduct.originalPrice.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-green-400 mb-1">
                        {Math.round(((safeProduct.originalPrice - currentPrice) / safeProduct.originalPrice) * 100)}% OFF
                      </div>
                      <p className="text-sm text-gray-400">You save</p>
                      <p className="text-xl font-bold text-green-400">${(safeProduct.originalPrice - currentPrice).toFixed(2)}</p>
                    </div>
                  </div>

                  {nextTier && (
                    <div className="bg-gradient-to-r from-yellow-900/30 to-yellow-800/30 border border-yellow-500/40 rounded-xl p-4 mb-6">
                      <div className="flex items-center space-x-2 mb-2">
                        <Crown className="w-5 h-5 text-yellow-400" />
                        <span className="text-yellow-300 font-semibold">Next Price Drop</span>
                      </div>
                      <p className="text-yellow-200 text-sm">
                        Reach <strong>{nextTier.tier}</strong> tier at ${nextTier.price} when {nextTier.min} pledges unite
                      </p>
                      <p className="text-xs text-yellow-400 mt-1">
                        {nextTier.min - pledgeCount} more pledges needed
                      </p>
                    </div>
                  )}

                  {/* Pledge Button */}
                  <button 
                    onClick={() => setShowPledgeModal(true)}
                    disabled={hasPledged}
                    className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 transform ${
                      hasPledged 
                        ? 'bg-gradient-to-r from-green-800 to-green-700 text-green-200 border border-green-600/50 shadow-lg shadow-green-500/25'
                        : 'bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 text-black hover:shadow-2xl hover:shadow-yellow-500/50 hover:-translate-y-1 border border-yellow-400/50'
                    }`}
                  >
                    {hasPledged ? (
                      <span className="flex items-center justify-center space-x-2">
                        <Shield className="w-5 h-5" />
                        <span>Pledge Complete</span>
                      </span>
                    ) : (
                      <span className="flex items-center justify-center space-x-2">
                        <Zap className="w-5 h-5" />
                        <span>Join Drop - ${currentPrice}</span>
                      </span>
                    )}
                  </button>

                  <div className="flex items-center justify-center space-x-6 mt-4">
                    <button className="flex items-center space-x-2 text-gray-400 hover:text-yellow-400 transition-colors">
                      <Heart className="w-5 h-5" />
                      <span className="text-sm font-medium">Wishlist</span>
                    </button>
                    <button className="flex items-center space-x-2 text-gray-400 hover:text-yellow-400 transition-colors">
                      <Share2 className="w-5 h-5" />
                      <span className="text-sm font-medium">Share</span>
                    </button>
                    <button className="flex items-center space-x-2 text-gray-400 hover:text-yellow-400 transition-colors">
                      <MessageCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">Discuss</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Pricing Tiers */}
              <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-700 p-4 sm:p-6">
                <h3 className="font-bold text-xl text-yellow-300 mb-4 flex items-center space-x-2">
                  <Crown className="w-6 h-6" />
                  <span>Volume Pricing Tiers</span>
                </h3>
                <div className="space-y-3">
                  {effectivePricingTiers.map((tier, index) => (
                    <div 
                      key={index}
                      className={`flex justify-between items-center p-4 rounded-xl transition-all ${
                        tier === currentTier 
                          ? 'bg-gradient-to-r from-yellow-900/40 to-yellow-800/40 border border-yellow-500/50 shadow-lg shadow-yellow-500/25' 
                          : 'bg-gray-800/50 border border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <div>
                        <span className={`font-bold ${tier === currentTier ? 'text-yellow-300' : 'text-gray-300'}`}>
                          {tier.tier || `Tier ${index + 1}`}
                        </span>
                        <p className="text-sm text-gray-500">{tier.label || `${tier.min}-${tier.max} units`}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xl font-bold ${tier === currentTier ? 'text-yellow-400' : 'text-gray-400'}`}>
                          ${tier.price}
                        </span>
                        {tier === currentTier && (
                          <div className="text-xs text-yellow-300 flex items-center justify-end space-x-1">
                            <span>Current</span>
                            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Product Description & Community */}
          <div className="mt-10 sm:mt-16 grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Product Details */}
            <div className="lg:col-span-2 bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-700 p-4 sm:p-8">
              <h2 className="text-3xl font-bold text-yellow-300 mb-6 flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
                  <span className="text-black font-bold">⚡</span>
                </div>
                <span>Product Details</span>
              </h2>
              <p className="text-gray-300 leading-relaxed text-lg mb-8">{safeProduct.description}</p>
              
              {/* Features */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  "Active Noise Cancellation",
                  "30-Hour Battery Life", 
                  "Premium Sound Quality",
                  "Wireless Charging Case",
                  "IPX4 Water Resistance",
                  "Touch Controls"
                ].map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3 bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                    <div className="w-3 h-3 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex-shrink-0"></div>
                    <span className="text-gray-300 font-medium">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Advanced Community Chat System */}
            <div className="relative bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-700 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-yellow-300 flex items-center space-x-2">
                  <MessageCircle className="w-5 h-5" />
                  <span>Community Discussion</span>
                </h3>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-400">247 online</span>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="space-y-4 max-h-80 overflow-y-auto mb-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                {communityMessages.map((msg) => (
                  <div key={msg.id} className="group hover:bg-gray-800/30 rounded-xl p-3 transition-all">
                    <div className="flex items-start space-x-3">
                      <div className="relative">
                        <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center text-lg border-2 border-gray-600">
                          {msg.avatar}
                        </div>
                        {msg.tier === 'MIGISTUS' && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                            <Crown className="w-3 h-3 text-black" />
                          </div>
                        )}
                        {msg.tier === 'Guild' && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <Shield className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span 
                            className="font-medium text-white hover:text-yellow-400 cursor-pointer transition-colors"
                            onMouseEnter={() => handleProfileHover(msg, true)}
                            onMouseLeave={() => handleProfileHover(msg, false)}
                          >
                            {msg.user}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full border ${getTierColor(msg.tier)}`}>
                            {msg.tier}
                          </span>
                          {msg.verified && (
                            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center" title="Verified Purchaser">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          )}
                          <span className="text-xs text-gray-500">{msg.time}</span>
                        </div>
                        <p className={`text-gray-300 text-sm leading-relaxed ${msg.isReaction ? 'text-2xl' : ''} ${msg.filtered ? 'opacity-75' : ''}`}>
                          {msg.message}
                          {msg.filtered && (
                            <span className="ml-2 text-xs text-yellow-400 opacity-60">[filtered]</span>
                          )}
                        </p>
                        
                        {/* Message Actions */}
                        <div className="flex items-center space-x-4 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleLikeMessage(msg.id)}
                            className="flex items-center space-x-1 text-xs text-gray-500 hover:text-yellow-400 transition-colors"
                          >
                            <Heart className="w-3 h-3" />
                            <span>{msg.likes || 0}</span>
                          </button>
                          <button className="text-xs text-gray-500 hover:text-yellow-400 transition-colors">
                            Reply
                          </button>
                          <button className="text-xs text-gray-500 hover:text-red-400 transition-colors">
                            Report
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Live Typing Indicator */}
                {isTyping && (
                  <div className="flex items-center space-x-3 opacity-70">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
                      <span className="text-black text-sm font-bold">😎</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-sm text-gray-400">You are typing</span>
                      <div className="flex space-x-1">
                        <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Hover Card */}
              {hoveredProfile && hoveredProfile.profile && (
                <div 
                  className="absolute z-50 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-600 shadow-2xl p-4 w-72 transform -translate-x-1/2 left-1/2 bottom-full mb-2"
                  onMouseEnter={() => handleProfileCardHover(true)}
                  onMouseLeave={() => handleProfileCardHover(false)}
                >
                  {/* Profile Banner */}
                  <div 
                    className="h-20 rounded-lg mb-3 relative overflow-hidden"
                    style={{ background: hoveredProfile.profile.banner }}
                  >
                    <div className="absolute inset-0 bg-black/20"></div>
                  </div>

                  {/* Avatar and Basic Info */}
                  <div className="flex items-start space-x-3 mb-4">
                    <div className="relative -mt-8">
                      <div className="w-16 h-16 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center text-2xl border-4 border-gray-800 shadow-lg">
                        {hoveredProfile.avatar}
                      </div>
                      {hoveredProfile.tier === 'MIGISTUS' && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                          <Crown className="w-4 h-4 text-black" />
                        </div>
                      )}
                      {hoveredProfile.tier === 'Guild' && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <Shield className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-bold text-white text-lg">{hoveredProfile.user}</h4>
                        {hoveredProfile.verified && (
                          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                      </div>
                      <p className="text-yellow-400 font-medium text-sm">{hoveredProfile.profile.title}</p>
                      <span className={`text-xs px-2 py-1 rounded-full border ${getTierColor(hoveredProfile.tier)} inline-block mt-1`}>
                        {hoveredProfile.tier} Member
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                      <div className="text-yellow-400 font-bold text-lg">{hoveredProfile.profile.totalPledges}</div>
                      <div className="text-gray-400 text-xs">Total Pledges</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                      <div className="text-green-400 font-bold text-lg">{hoveredProfile.profile.totalSaved}</div>
                      <div className="text-gray-400 text-xs">Total Saved</div>
                    </div>
                  </div>

                  {/* Member Since */}
                  <div className="text-center text-xs text-gray-500 border-t border-gray-700 pt-3">
                    Member since {hoveredProfile.profile.joinDate}
                  </div>

                  {/* Arrow pointer */}
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                    <div className="w-3 h-3 bg-gray-800 rotate-45 border-r border-b border-gray-600"></div>
                  </div>
                </div>
              )}

              {/* Profanity Warning */}
              {showProfanityWarning && (
                <div className="mb-4 bg-gradient-to-r from-red-900/40 to-orange-900/40 border border-red-500/50 rounded-xl p-3">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-red-400" />
                    <span className="text-red-300 text-sm font-medium">Content filtered for community standards</span>
                  </div>
                  <p className="text-red-200 text-xs mt-1">
                    Please keep discussions respectful and on-topic. Continued violations may result in chat restrictions.
                  </p>
                </div>
              )}

              {/* Chat Input */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
                    <span className="text-black text-sm font-bold">😎</span>
                  </div>
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={chatMessage}
                      onChange={(e) => handleTyping(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleSendMessage();
                        }
                      }}
                      placeholder="Share your thoughts about this drop..."
                      className="w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none pr-12"
                    />
                    <button 
                      onClick={handleSendMessage}
                      disabled={!chatMessage.trim()}
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors ${
                        chatMessage.trim() 
                          ? 'text-yellow-400 hover:text-yellow-300' 
                          : 'text-gray-600 cursor-not-allowed'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                {/* Emote Bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">Quick reactions:</span>
                    {['🔥', '💯', '👍', '❤️', '😍', '🤯'].map((emote, index) => (
                      <button
                        key={index}
                        onClick={() => handleEmojiReaction(emote)}
                        className="w-8 h-8 bg-gray-800/50 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors border border-gray-600 hover:border-gray-500 hover:scale-110 transform"
                      >
                        {emote}
                      </button>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500">
                    Guild member • 2x chat weight
                  </div>
                </div>
                
                {/* Character Counter with Content Warning */}
                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-500">
                    {containsProfanity(chatMessage) && (
                      <span className="text-yellow-400 flex items-center space-x-1">
                        <Shield className="w-3 h-3" />
                        <span>Content will be filtered</span>
                      </span>
                    )}
                    {isInappropriateContent(chatMessage) && (
                      <span className="text-red-400 flex items-center space-x-1">
                        <Shield className="w-3 h-3" />
                        <span>Message blocked - inappropriate content</span>
                      </span>
                    )}
                  </div>
                  <span className={`text-xs ${chatMessage.length > 200 ? 'text-red-400' : 'text-gray-500'}`}>
                    {chatMessage.length}/250
                  </span>
                </div>
              </div>

              {/* Chat Rules */}
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                  <span className="flex items-center space-x-1">
                    <Shield className="w-3 h-3" />
                    <span>Community Guidelines</span>
                  </span>
                  <div className="flex items-center space-x-3">
                    <span>No spam</span>
                    <span>Be respectful</span>
                    <span>Stay on topic</span>
                  </div>
                </div>
                <div className="text-xs text-gray-600">
                  Automated content filtering • Report inappropriate messages • Verified purchasers have higher trust
                </div>
              </div>

              {/* Moderation Panel (for admins) */}
              <div className="mt-4 bg-red-900/20 border border-red-700/50 rounded-xl p-3 hidden">
                <div className="flex items-center justify-between">
                  <span className="text-red-300 text-sm font-medium">Moderation Panel</span>
                  <div className="flex space-x-2">
                    <button className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 transition-colors">
                      Clear Chat
                    </button>
                    <button className="bg-yellow-600 text-black px-3 py-1 rounded text-xs hover:bg-yellow-700 transition-colors">
                      Slow Mode
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pledge Modal */}
        {showPledgeModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl w-full max-w-md p-4 sm:p-8 border border-gray-700 shadow-2xl">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-black" />
                </div>
                <h3 className="text-2xl font-bold text-yellow-300 mb-2">Confirm Your Pledge</h3>
                <p className="text-gray-400">Join the collective buying power</p>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-400">Product:</span>
                    <span className="font-semibold text-white">{safeProduct.name}</span>
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-400">Current Price:</span>
                    <span className="font-bold text-yellow-400">${currentPrice}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">You'll Pay:</span>
                    <span className="font-bold text-white">${currentPrice}</span>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-blue-900/30 to-blue-800/30 border border-blue-500/40 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <Shield className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-blue-300 font-semibold text-sm mb-1">Price Protection</p>
                      <p className="text-blue-200 text-sm">
                        If more people join and the price drops further, you'll automatically receive a refund for the difference.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4 pt-4">
                  <button 
                    onClick={() => setShowPledgeModal(false)}
                    className="flex-1 py-3 px-4 border border-gray-600 rounded-xl text-gray-300 hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handlePledge}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-yellow-600 to-yellow-500 text-black rounded-xl hover:shadow-lg hover:shadow-yellow-500/50 transition-all font-bold"
                  >
                    Confirm Pledge
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ProductPage;