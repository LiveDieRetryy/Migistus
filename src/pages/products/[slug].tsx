import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { 
  ArrowLeft, 
  Vote, 
  Heart, 
  Share2, 
  Star, 
  ShoppingCart,
  Eye,
  TrendingUp,
  Clock,
  Users,
  CheckCircle,
  Calendar,
  Tag,
  Package,
  MessageCircle,
  Target,
  Award,
  Zap,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  Shield,
  Truck,
  RotateCcw,
  CreditCard,
  Globe,
  ChevronDown,
  ChevronUp,
  Play,
  Image as ImageIcon,
  ExternalLink,
  Copy,
  Flag,
  BarChart3,
  TrendingDown,
  Activity,
  Timer,
  Bell,
  Gift,
  Crown,
  Flame,
  DollarSign
} from "lucide-react";
import MainNavbar from "@/components/nav/MainNavbar";
import { useAuth } from "@/context/AuthContext";
import { getStageInfo, getDaysInStage } from "@/utils/productLifecycle";

interface Product {
  id: number;
  name: string;
  slug: string;
  image?: string;
  images?: string[];
  description?: string;
  fullDescription?: string;
  category?: string;
  price?: number;
  originalPrice?: number;
  votes?: number;
  stage?: string;
  stageEnteredAt?: string;
  features?: string[];
  specifications?: { [key: string]: string };
  supplier?: {
    name: string;
    rating: number;
    verified: boolean;
    location: string;
  };
  pledges?: number;
  pledgeGoal?: number;
  pricingTiers?: PricingTier[];
  reviews?: ProductReview[];
  video?: string;
  gallery?: string[];
  tags?: string[];
  compatibility?: string[];
  warranty?: string;
  shipping?: {
    free: boolean;
    estimatedDays: number;
    regions: string[];
  };
  socialMetrics?: {
    likes: number;
    shares: number;
    comments: number;
  };
}

interface PricingTier {
  quantity: number;
  price: number;
  discount?: number;
  label?: string;
}

interface ProductReview {
  id: number;
  userId: string;
  userName: string;
  userTier: string;
  rating: number;
  comment: string;
  date: string;
  verified: boolean;
  helpful: number;
}

interface ChatMessage {
  id: number;
  userId: string;
  userName: string;
  userTier: string;
  message: string;
  timestamp: string;
  type: 'message' | 'system' | 'announcement';
}

export default function ProductPage() {
  const router = useRouter();
  const { slug } = router.query;
  const { user, isAuthenticated } = useAuth();
    const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isWishlist, setIsWishlist] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'chat' | 'specs' | 'shipping'>('overview');
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [selectedTier, setSelectedTier] = useState<PricingTier | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [userReview, setUserReview] = useState({ rating: 5, comment: '' });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [pledgeAmount, setPledgeAmount] = useState<number>(0);
  const [notifications, setNotifications] = useState(false);
  const [showPledgeModal, setShowPledgeModal] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/products/${slug}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError("Product not found");
        } else {
          throw new Error("Failed to fetch product");
        }
        return;
      }
      
      const data = await response.json();
      setProduct(data.product);
      
      // Check if user has voted for this product
      if (isAuthenticated && user) {
        checkUserVote(data.product.id);
      }
      
    } catch (err) {
      console.error("Error fetching product:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const checkUserVote = async (productId: number) => {
    try {
      const response = await fetch(`/api/votes?productId=${productId}&userId=${user?.id}`);
      if (response.ok) {
        const data = await response.json();
        setHasVoted(data.hasVoted || false);
      }
    } catch (error) {
      console.error("Error checking vote:", error);
    }
  };

  const handleVote = async () => {
    if (!isAuthenticated || !user || !product || hasVoted) return;

    try {
      const response = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          userId: user.id,
          tier: (user as any).tier || "Initiate",
          value: 1,
          timestamp: new Date().toISOString()
        }),
      });

      if (response.ok) {
        setHasVoted(true);
        // Refresh product data to get updated vote count
        fetchProduct();
      }
    } catch (error) {
      console.error("Failed to vote:", error);
    }
  };

  const toggleWishlist = () => {
    setIsWishlist(!isWishlist);
    // TODO: Implement wishlist API
  };

  const handleShare = async () => {
    if (navigator.share && product) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log("Error sharing:", error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Loading Product - MIGISTUS</title>
        </Head>
        <MainNavbar />
        <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
            <div className="text-zinc-400">Loading product...</div>
          </div>
        </div>
      </>
    );
  }

  if (error || !product) {
    return (
      <>
        <Head>
          <title>Product Not Found - MIGISTUS</title>
        </Head>
        <MainNavbar />
        <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black flex items-center justify-center">
          <div className="text-center">
            <Package className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Product Not Found</h1>
            <p className="text-zinc-400 mb-6">{error || "The product you're looking for doesn't exist."}</p>
            <Link 
              href="/voting" 
              className="inline-flex items-center space-x-2 bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Products</span>
            </Link>
          </div>
        </div>
      </>
    );
  }
  const stageInfo = getStageInfo(product.stage as any);
  const daysInStage = getDaysInStage(product.stageEnteredAt);
  const productImages = product.images || [product.image || "/images/placeholder.png"];

  return (
    <>
      <Head>
        <title>{product.name} - MIGISTUS</title>
        <meta name="description" content={product.description || `Discover ${product.name} on MIGISTUS`} />
        <meta property="og:title" content={product.name} />
        <meta property="og:description" content={product.description} />
        <meta property="og:image" content={product.image} />
      </Head>

      <MainNavbar />

      <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 text-sm text-zinc-400 mb-6">
            <Link href="/" className="hover:text-yellow-400 transition-colors">Home</Link>
            <span>/</span>
            <Link href="/voting" className="hover:text-yellow-400 transition-colors">Products</Link>
            <span>/</span>
            <span className="text-white">{product.name}</span>
          </div>

          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="inline-flex items-center space-x-2 text-zinc-400 hover:text-yellow-400 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Product Images */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-zinc-800">
                <Image
                  src={productImages[selectedImageIndex]}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                
                {/* Stage Badge */}
                {product.stage && (
                  <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      product.stage === 'voting' ? 'bg-blue-500 text-white' :
                      product.stage === 'coming-soon' ? 'bg-yellow-500 text-black' :
                      product.stage === 'community-drops' ? 'bg-green-500 text-white' :
                      'bg-gray-500 text-white'
                    }`}>
                      {stageInfo.label}
                    </span>
                  </div>
                )}
              </div>

              {/* Thumbnail Images */}
              {productImages.length > 1 && (
                <div className="flex space-x-2 overflow-x-auto">
                  {productImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedImageIndex === index ? 'border-yellow-400' : 'border-zinc-700'
                      }`}
                    >
                      <Image
                        src={image}
                        alt={`${product.name} view ${index + 1}`}
                        width={80}
                        height={80}
                        className="object-cover w-full h-full"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="space-y-6">
              {/* Category */}
              {product.category && (
                <div className="flex items-center space-x-2">
                  <Tag className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-400 text-sm font-medium">{product.category}</span>
                </div>
              )}

              {/* Product Name */}
              <h1 className="text-4xl font-bold text-white">{product.name}</h1>

              {/* Price */}
              {product.price && (
                <div className="text-3xl font-bold text-yellow-400">
                  ${product.price.toFixed(2)}
                </div>
              )}

              {/* Description */}
              <p className="text-zinc-300 text-lg leading-relaxed">
                {product.fullDescription || product.description}
              </p>

              {/* Product Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-800/50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Vote className="w-5 h-5 text-blue-400" />
                    <span className="text-zinc-400 text-sm">Total Votes</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{product.votes || 0}</div>
                </div>

                <div className="bg-zinc-800/50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="w-5 h-5 text-yellow-400" />
                    <span className="text-zinc-400 text-sm">Days in Stage</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{daysInStage}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                {product.stage === 'voting' && (
                  <button
                    onClick={handleVote}
                    disabled={!isAuthenticated || hasVoted}
                    className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all flex items-center justify-center space-x-2 ${
                      hasVoted
                        ? "bg-green-600 text-white cursor-not-allowed"
                        : !isAuthenticated
                        ? "bg-zinc-600 text-zinc-400 cursor-not-allowed"
                        : "bg-yellow-500 hover:bg-yellow-600 text-black hover:scale-105"
                    }`}
                  >
                    <Vote className="w-5 h-5" />
                    <span>
                      {hasVoted ? "Voted" : !isAuthenticated ? "Login to Vote" : "Vote"}
                    </span>
                  </button>
                )}

                {product.stage === 'community-drops' && (
                  <button className="flex-1 py-3 px-6 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold transition-all flex items-center justify-center space-x-2">
                    <ShoppingCart className="w-5 h-5" />
                    <span>Add to Cart</span>
                  </button>
                )}

                {product.stage === 'coming-soon' && (
                  <button className="flex-1 py-3 px-6 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition-all flex items-center justify-center space-x-2">
                    <TrendingUp className="w-5 h-5" />
                    <span>Notify When Available</span>
                  </button>
                )}

                <button
                  onClick={toggleWishlist}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    isWishlist 
                      ? "border-red-500 bg-red-500 text-white" 
                      : "border-zinc-600 text-zinc-400 hover:border-red-500 hover:text-red-500"
                  }`}
                >
                  <Heart className={`w-6 h-6 ${isWishlist ? "fill-current" : ""}`} />
                </button>

                <button
                  onClick={handleShare}
                  className="p-3 rounded-xl border-2 border-zinc-600 text-zinc-400 hover:border-yellow-500 hover:text-yellow-500 transition-all"
                >
                  <Share2 className="w-6 h-6" />
                </button>
              </div>

              {/* Features */}
              {product.features && product.features.length > 0 && (
                <div className="bg-zinc-800/30 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Key Features</h3>
                  <ul className="space-y-2">
                    {product.features.map((feature, index) => (
                      <li key={index} className="flex items-start space-x-2 text-zinc-300">
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Specifications */}
              {product.specifications && Object.keys(product.specifications).length > 0 && (
                <div className="bg-zinc-800/30 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Specifications</h3>
                  <div className="space-y-2">
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center">
                        <span className="text-zinc-400">{key}</span>
                        <span className="text-white font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}              {/* Supplier Info */}
              {product.supplier && (
                <div className="bg-zinc-800/30 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Supplier Information</h3>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-zinc-700 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-yellow-400" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-white font-medium">{product.supplier.name}</span>
                          {product.supplier.verified && (
                            <Shield className="w-4 h-4 text-green-400" />
                          )}
                        </div>
                        <div className="text-zinc-400 text-sm">{product.supplier.location}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-white font-medium">{product.supplier.rating}</span>
                    </div>
                  </div>
                  <Link 
                    href={`/suppliers/${product.supplier.name.toLowerCase().replace(/\s+/g, '-')}`}
                    className="text-yellow-400 hover:text-yellow-300 text-sm flex items-center space-x-1"
                  >
                    <span>View Supplier Profile</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              )}

              {/* Pledge Progress (for community-drops stage) */}
              {product.stage === 'community-drops' && product.pledgeGoal && (
                <div className="bg-green-900/30 border border-green-700 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">Drop Progress</h3>
                    <span className="text-green-400 font-bold">
                      {Math.round(((product.pledges || 0) / product.pledgeGoal) * 100)}%
                    </span>
                  </div>
                  
                  <div className="w-full bg-zinc-700 rounded-full h-3 mb-4">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-green-400 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(((product.pledges || 0) / product.pledgeGoal) * 100, 100)}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">
                      {product.pledges || 0} pledges
                    </span>
                    <span className="text-zinc-400">
                      Goal: {product.pledgeGoal}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => setShowPledgeModal(true)}
                    className="w-full mt-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold transition-all flex items-center justify-center space-x-2"
                  >
                    <Target className="w-5 h-5" />
                    <span>Join Drop</span>
                  </button>
                </div>
              )}

              {/* Pricing Tiers */}
              {product.pricingTiers && product.pricingTiers.length > 0 && (
                <div className="bg-zinc-800/30 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Group Pricing</h3>
                  <div className="space-y-3">
                    {product.pricingTiers.map((tier, index) => (
                      <div 
                        key={index}
                        onClick={() => setSelectedTier(tier)}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedTier?.quantity === tier.quantity
                            ? 'border-yellow-400 bg-yellow-400/10'
                            : 'border-zinc-600 hover:border-zinc-500'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="text-white font-medium">
                              {tier.quantity}+ units
                            </div>
                            {tier.label && (
                              <div className="text-zinc-400 text-sm">{tier.label}</div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-white">
                              ${tier.price.toFixed(2)}
                            </div>
                            {tier.discount && (
                              <div className="text-green-400 text-sm">
                                {tier.discount}% off
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setNotifications(!notifications)}
                  className={`p-3 rounded-lg border-2 transition-all flex items-center justify-center space-x-2 ${
                    notifications 
                      ? "border-blue-500 bg-blue-500/10 text-blue-400" 
                      : "border-zinc-600 text-zinc-400 hover:border-blue-500"
                  }`}
                >
                  <Bell className="w-5 h-5" />
                  <span className="text-sm">
                    {notifications ? 'Notifications On' : 'Notify Me'}
                  </span>
                </button>

                <button
                  onClick={handleShare}
                  className="p-3 rounded-lg border-2 border-zinc-600 text-zinc-400 hover:border-yellow-500 hover:text-yellow-500 transition-all flex items-center justify-center space-x-2"
                >
                  <Share2 className="w-5 h-5" />
                  <span className="text-sm">Share</span>
                </button>
              </div>
            </div>
          </div>

          {/* Detailed Information Tabs */}
          <div className="mt-16">
            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-zinc-800/30 rounded-lg p-1 mb-8 overflow-x-auto">
              {[
                { id: 'overview', label: 'Overview', icon: Eye },
                { id: 'reviews', label: 'Reviews', icon: Star },
                { id: 'chat', label: 'Community Chat', icon: MessageCircle },
                { id: 'specs', label: 'Specifications', icon: Package },
                { id: 'shipping', label: 'Shipping', icon: Truck }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-all whitespace-nowrap ${
                    activeTab === id
                      ? 'bg-yellow-500 text-black'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-700/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  {/* Extended Description */}
                  <div className="bg-zinc-800/30 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Product Overview</h3>
                    <div className="prose prose-invert max-w-none">
                      <p className="text-zinc-300 leading-relaxed mb-4">
                        {showFullDescription ? 
                          (product.fullDescription || product.description) :
                          (product.description?.substring(0, 300) + (product.description && product.description.length > 300 ? '...' : ''))
                        }
                      </p>
                      {product.description && product.description.length > 300 && (
                        <button
                          onClick={() => setShowFullDescription(!showFullDescription)}
                          className="text-yellow-400 hover:text-yellow-300 flex items-center space-x-1"
                        >
                          <span>{showFullDescription ? 'Show Less' : 'Read More'}</span>
                          {showFullDescription ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Video Preview */}
                  {product.video && (
                    <div className="bg-zinc-800/30 rounded-lg p-6">
                      <h3 className="text-xl font-bold text-white mb-4">Product Video</h3>
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-zinc-900">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <button className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center hover:bg-yellow-600 transition-colors">
                            <Play className="w-6 h-6 text-black ml-1" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Gallery */}
                  {product.gallery && product.gallery.length > 0 && (
                    <div className="bg-zinc-800/30 rounded-lg p-6">
                      <h3 className="text-xl font-bold text-white mb-4">Product Gallery</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {product.gallery.map((image, index) => (
                          <div key={index} className="aspect-square rounded-lg overflow-hidden bg-zinc-700">
                            <Image
                              src={image}
                              alt={`${product.name} gallery ${index + 1}`}
                              width={200}
                              height={200}
                              className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Social Proof */}
                  {product.socialMetrics && (
                    <div className="bg-zinc-800/30 rounded-lg p-6">
                      <h3 className="text-xl font-bold text-white mb-4">Community Engagement</h3>
                      <div className="grid grid-cols-3 gap-6">
                        <div className="text-center">
                          <div className="flex items-center justify-center w-12 h-12 bg-red-500/20 rounded-full mx-auto mb-2">
                            <Heart className="w-6 h-6 text-red-400" />
                          </div>
                          <div className="text-2xl font-bold text-white">{product.socialMetrics.likes}</div>
                          <div className="text-zinc-400 text-sm">Likes</div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center w-12 h-12 bg-blue-500/20 rounded-full mx-auto mb-2">
                            <Share2 className="w-6 h-6 text-blue-400" />
                          </div>
                          <div className="text-2xl font-bold text-white">{product.socialMetrics.shares}</div>
                          <div className="text-zinc-400 text-sm">Shares</div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center w-12 h-12 bg-green-500/20 rounded-full mx-auto mb-2">
                            <MessageCircle className="w-6 h-6 text-green-400" />
                          </div>
                          <div className="text-2xl font-bold text-white">{product.socialMetrics.comments}</div>
                          <div className="text-zinc-400 text-sm">Comments</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {product.tags && product.tags.length > 0 && (
                    <div className="bg-zinc-800/30 rounded-lg p-6">
                      <h3 className="text-xl font-bold text-white mb-4">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {product.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-zinc-700 text-zinc-300 rounded-full text-sm hover:bg-zinc-600 transition-colors cursor-pointer"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-6">
                  {/* Review Summary */}
                  <div className="bg-zinc-800/30 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-white">Community Reviews</h3>
                      <button
                        onClick={() => setShowReviewForm(!showReviewForm)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        Write Review
                      </button>
                    </div>

                    {/* Average Rating */}
                    <div className="flex items-center space-x-6 mb-6">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-white">4.2</div>
                        <div className="flex items-center justify-center space-x-1 mb-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-5 h-5 ${star <= 4 ? 'text-yellow-400 fill-current' : 'text-zinc-600'}`}
                            />
                          ))}
                        </div>
                        <div className="text-zinc-400 text-sm">128 reviews</div>
                      </div>
                      <div className="flex-1">
                        {[5, 4, 3, 2, 1].map((stars) => (
                          <div key={stars} className="flex items-center space-x-2 mb-1">
                            <span className="text-zinc-400 text-sm w-8">{stars}★</span>
                            <div className="flex-1 h-2 bg-zinc-700 rounded-full">
                              <div 
                                className="h-2 bg-yellow-400 rounded-full"
                                style={{ width: `${Math.random() * 60 + 20}%` }}
                              ></div>
                            </div>
                            <span className="text-zinc-400 text-sm w-8">{Math.floor(Math.random() * 40 + 10)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Review Form */}
                    {showReviewForm && (
                      <div className="border-t border-zinc-700 pt-6">
                        <h4 className="text-lg font-bold text-white mb-4">Write Your Review</h4>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-zinc-400 text-sm mb-2">Rating</label>
                            <div className="flex space-x-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  onClick={() => setUserReview({...userReview, rating: star})}
                                  className={`w-8 h-8 ${star <= userReview.rating ? 'text-yellow-400' : 'text-zinc-600'}`}
                                >
                                  <Star className="w-6 h-6 fill-current" />
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="block text-zinc-400 text-sm mb-2">Your Review</label>
                            <textarea
                              value={userReview.comment}
                              onChange={(e) => setUserReview({...userReview, comment: e.target.value})}
                              placeholder="Share your thoughts about this product..."
                              className="w-full p-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:border-yellow-400 focus:outline-none"
                              rows={4}
                            />
                          </div>
                          <div className="flex space-x-3">
                            <button className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-lg font-medium transition-colors">
                              Submit Review
                            </button>
                            <button 
                              onClick={() => setShowReviewForm(false)}
                              className="bg-zinc-600 hover:bg-zinc-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Individual Reviews */}
                  <div className="space-y-4">
                    {[1, 2, 3].map((review) => (
                      <div key={review} className="bg-zinc-800/30 rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-zinc-700 rounded-full flex items-center justify-center">
                              <Users className="w-5 h-5 text-yellow-400" />
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="text-white font-medium">CommunityMember{review}</span>
                                <span className="text-xs bg-yellow-500 text-black px-2 py-1 rounded-full">Vanguard</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-4 h-4 ${star <= 5 ? 'text-yellow-400 fill-current' : 'text-zinc-600'}`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          <span className="text-zinc-400 text-sm">2 days ago</span>
                        </div>
                        <p className="text-zinc-300 mb-4">
                          Amazing product! The quality exceeded my expectations and the community drop price was fantastic. 
                          Highly recommend joining the next drop for this item.
                        </p>
                        <div className="flex items-center space-x-4">
                          <button className="flex items-center space-x-1 text-zinc-400 hover:text-green-400 transition-colors">
                            <ThumbsUp className="w-4 h-4" />
                            <span className="text-sm">12</span>
                          </button>
                          <button className="flex items-center space-x-1 text-zinc-400 hover:text-red-400 transition-colors">
                            <ThumbsDown className="w-4 h-4" />
                            <span className="text-sm">1</span>
                          </button>
                          <button className="text-zinc-400 hover:text-yellow-400 transition-colors text-sm">
                            Reply
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'chat' && (
                <div className="bg-zinc-800/30 rounded-lg h-96 flex flex-col">
                  {/* Chat Header */}
                  <div className="p-4 border-b border-zinc-700">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-white">Product Discussion</h3>
                      <div className="flex items-center space-x-2 text-green-400 text-sm">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span>47 online</span>
                      </div>
                    </div>
                  </div>

                  {/* Chat Messages */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3">
                    {[1, 2, 3, 4, 5].map((msg) => (
                      <div key={msg} className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center flex-shrink-0">
                          <Users className="w-4 h-4 text-yellow-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-white font-medium text-sm">User{msg}</span>
                            <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">Initiate</span>
                            <span className="text-zinc-400 text-xs">2m ago</span>
                          </div>
                          <p className="text-zinc-300 text-sm">
                            {msg === 1 && "Has anyone tried this product yet? Looking for real user feedback!"}
                            {msg === 2 && "I got it in the last drop - absolutely worth it! Quality is top-notch."}
                            {msg === 3 && "When is the next community drop happening? Don't want to miss out!"}
                            {msg === 4 && "The supplier has been very responsive to questions. Great communication."}
                            {msg === 5 && "Just pledged for this! Excited to see if we hit the goal."}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Chat Input */}
                  <div className="p-4 border-t border-zinc-700">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Join the conversation..."
                        className="flex-1 p-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:border-yellow-400 focus:outline-none"
                      />
                      <button 
                        className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-lg font-medium transition-colors"
                        disabled={!isAuthenticated}
                      >
                        Send
                      </button>
                    </div>
                    {!isAuthenticated && (
                      <p className="text-zinc-400 text-xs mt-2">
                        <Link href="/login" className="text-yellow-400 hover:text-yellow-300">Login</Link> to join the conversation
                      </p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'specs' && (
                <div className="space-y-6">
                  {/* Technical Specifications */}
                  {product.specifications && Object.keys(product.specifications).length > 0 && (
                    <div className="bg-zinc-800/30 rounded-lg p-6">
                      <h3 className="text-xl font-bold text-white mb-6">Technical Specifications</h3>
                      <div className="grid gap-4">
                        {Object.entries(product.specifications).map(([key, value]) => (
                          <div key={key} className="flex justify-between items-center py-2 border-b border-zinc-700 last:border-b-0">
                            <span className="text-zinc-400 font-medium">{key}</span>
                            <span className="text-white">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Compatibility */}
                  {product.compatibility && product.compatibility.length > 0 && (
                    <div className="bg-zinc-800/30 rounded-lg p-6">
                      <h3 className="text-xl font-bold text-white mb-4">Compatibility</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {product.compatibility.map((item, index) => (
                          <div key={index} className="flex items-center space-x-2 p-3 bg-zinc-700/50 rounded-lg">
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            <span className="text-zinc-300 text-sm">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Warranty Information */}
                  {product.warranty && (
                    <div className="bg-zinc-800/30 rounded-lg p-6">
                      <h3 className="text-xl font-bold text-white mb-4">Warranty & Support</h3>
                      <div className="flex items-center space-x-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <Shield className="w-6 h-6 text-blue-400" />
                        <div>
                          <div className="text-white font-medium">Protected Purchase</div>
                          <div className="text-blue-300 text-sm">{product.warranty}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'shipping' && (
                <div className="space-y-6">
                  {/* Shipping Information */}
                  <div className="bg-zinc-800/30 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-white mb-6">Shipping Information</h3>
                    
                    {product.shipping && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-zinc-700/50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Truck className="w-6 h-6 text-green-400" />
                            <div>
                              <div className="text-white font-medium">
                                {product.shipping.free ? 'Free Shipping' : 'Standard Shipping'}
                              </div>
                              <div className="text-zinc-400 text-sm">
                                Estimated delivery: {product.shipping.estimatedDays} days
                              </div>
                            </div>
                          </div>
                          {product.shipping.free && (
                            <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                              FREE
                            </span>
                          )}
                        </div>

                        <div className="p-4 bg-zinc-700/50 rounded-lg">
                          <h4 className="text-white font-medium mb-2">Available Regions</h4>
                          <div className="flex flex-wrap gap-2">
                            {product.shipping.regions.map((region, index) => (
                              <span key={index} className="px-2 py-1 bg-zinc-600 text-zinc-300 rounded text-sm">
                                {region}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Additional Policies */}
                    <div className="mt-6 space-y-4">
                      <div className="flex items-center space-x-3 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                        <RotateCcw className="w-5 h-5 text-orange-400" />
                        <div className="text-sm">
                          <div className="text-white font-medium">30-Day Return Policy</div>
                          <div className="text-orange-300">Full refund if not satisfied</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <CreditCard className="w-5 h-5 text-green-400" />
                        <div className="text-sm">
                          <div className="text-white font-medium">Secure Payment</div>
                          <div className="text-green-300">Protected by MIGISTUS guarantee</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Related Products */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-white mb-8">Related Products</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((item) => (
                <Link key={item} href={`/products/related-product-${item}`} className="block">
                  <div className="bg-zinc-800/30 border border-zinc-700 rounded-lg overflow-hidden hover:border-yellow-500/50 transition-all duration-300 group">
                    <div className="relative h-48 bg-zinc-700">
                      <Image
                        src={`https://placehold.co/300x200?text=Product+${item}`}
                        alt={`Related Product ${item}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-white font-medium mb-2">Related Product {item}</h3>
                      <div className="flex items-center justify-between">
                        <span className="text-yellow-400 font-bold">$99.99</span>
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-zinc-400 text-sm">4.{item}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Pledge Modal */}
        {showPledgeModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">Join Drop</h3>
                  <button
                    onClick={() => setShowPledgeModal(false)}
                    className="text-zinc-400 hover:text-white"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-zinc-400 text-sm mb-2">Pledge Amount</label>
                    <div className="flex items-center space-x-2">
                      <span className="text-white">$</span>
                      <input
                        type="number"
                        value={pledgeAmount}
                        onChange={(e) => setPledgeAmount(Number(e.target.value))}
                        className="flex-1 p-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="bg-zinc-800/50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-zinc-400">Current Progress</span>
                      <span className="text-white">{product.pledges || 0}/{product.pledgeGoal} pledges</span>
                    </div>
                    <div className="w-full bg-zinc-700 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${Math.min(((product.pledges || 0) / (product.pledgeGoal || 1)) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowPledgeModal(false)}
                      className="flex-1 py-3 bg-zinc-600 hover:bg-zinc-500 text-white rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={pledgeAmount <= 0}
                      className="flex-1 py-3 bg-green-500 hover:bg-green-600 disabled:bg-zinc-600 disabled:text-zinc-400 text-white rounded-lg font-medium transition-colors"
                    >
                      Confirm Pledge
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
