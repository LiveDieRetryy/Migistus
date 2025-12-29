import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { getSupplierAvatar } from "../../lib/utils";
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
    id?: string;
    name: string;
    rating: number;
    verified: boolean;
    location: string;
    avatar?: string | null;
    banner?: string | null;
  };
  pledges?: number;
  pledgeGoal?: number;
  
  // Stock Management
  stock?: number;
  stockAvailable?: number;
  lowStockThreshold?: number;
  maxPerGuildMember?: number;
  
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
  const [hasOrdered, setHasOrdered] = useState(false);
  const [userOrder, setUserOrder] = useState<any>(null);
  const [orderCheckLoading, setOrderCheckLoading] = useState(false);
  
  // Live Reviews State
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, title: '', comment: '' });
  const [canReview, setCanReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  
  // Live Chat State
  const [liveMessages, setLiveMessages] = useState<any[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatSubmitting, setChatSubmitting] = useState(false);
  const [hasPledged, setHasPledged] = useState(false);
  const [showVotePrompt, setShowVotePrompt] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingMessage, setReportingMessage] = useState<any>(null);
  const [reportReason, setReportReason] = useState('spam');
  const [reportDescription, setReportDescription] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [wishlistToast, setWishlistToast] = useState<{ show: boolean; message: string; type: 'added' | 'removed' }>({ 
    show: false, 
    message: '', 
    type: 'added' 
  });
  const [voteToast, setVoteToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ 
    show: false, 
    message: '', 
    type: 'success' 
  });
  const [votingConfig, setVotingConfig] = useState<any>(null);
  const [allVotes, setAllVotes] = useState<any[]>([]);
  const [remainingVotes, setRemainingVotes] = useState<number>(0);

  useEffect(() => {
    if (slug) {
      fetchProduct();
    }
  }, [slug]);
  
  useEffect(() => {
    // Load voting config and votes
    const loadVotingData = async () => {
      try {
        const [configRes, votesRes] = await Promise.all([
          fetch('/api/voting/config'),
          fetch('/api/votes')
        ]);
        
        if (configRes.ok) {
          const config = await configRes.json();
          setVotingConfig(config);
        }
        
        if (votesRes.ok) {
          const votesData = await votesRes.json();
          setAllVotes(votesData.votes || votesData || []);
        }
      } catch (error) {
        console.error('Error loading voting data:', error);
      }
    };
    
    loadVotingData();
  }, []);
  
  useEffect(() => {
    // Calculate remaining votes whenever votes or user changes
    if (user && votingConfig && allVotes) {
      calculateRemainingVotes();
    }
  }, [user, votingConfig, allVotes]);
  
  useEffect(() => {
    // Listen for vote updates from other pages
    const channel = new BroadcastChannel('vote-updates');
    
    channel.onmessage = async (event) => {
      if (event.data.type === 'VOTE_CAST') {
        console.log('Vote cast detected from another page, refreshing votes');
        // Refresh votes data
        const votesRes = await fetch('/api/votes');
        if (votesRes.ok) {
          const votesData = await votesRes.json();
          setAllVotes(votesData.votes || votesData || []);
        }
        // Refresh product data if it's for this product
        if (product && event.data.productId === product.id) {
          fetchProduct();
        }
      }
    };
    
    // Refresh when page gains focus
    const handleFocus = async () => {
      console.log('Page focused, refreshing vote data');
      const votesRes = await fetch('/api/votes');
      if (votesRes.ok) {
        const votesData = await votesRes.json();
        setAllVotes(votesData.votes || votesData || []);
      }
      if (product) {
        fetchProduct();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      channel.close();
      window.removeEventListener('focus', handleFocus);
    };
  }, [product]);
  
  useEffect(() => {
    if (product && activeTab === 'reviews') {
      fetchReviews();
    }
  }, [product, activeTab]);
  
  useEffect(() => {
    if (product && activeTab === 'chat') {
      fetchChatMessages();
      // Poll for new messages every 5 seconds
      const interval = setInterval(fetchChatMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [product, activeTab]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/products/by-slug/${slug}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError("Product not found");
        } else {
          throw new Error("Failed to fetch product");
        }
        return;
      }
      
      const data = await response.json();
      let productData = data.product || data;
      
      // Fetch verified suppliers and validate/set supplier
      try {
        const suppliersRes = await fetch('/api/suppliers');
        if (suppliersRes.ok) {
          const suppliers = await suppliersRes.json();
          const migistusSupplier = suppliers.find((s: any) => s.name === 'Migistus' || s.companyName === 'Migistus');
          
          // Check if current supplier exists in verified suppliers
          let supplierIsVerified = false;
          let verifiedSupplierData = null;
          if (productData.supplier?.name) {
            verifiedSupplierData = suppliers.find((s: any) => 
              s.companyName === productData.supplier.name || s.name === productData.supplier.name
            );
            supplierIsVerified = !!verifiedSupplierData;
          }
          
          // If no supplier or supplier not in verified list, use Migistus
          if (!productData.supplier || !productData.supplier.name || !supplierIsVerified) {
            if (migistusSupplier) {
              productData.supplier = {
                id: migistusSupplier.id,
                name: migistusSupplier.companyName || migistusSupplier.name,
                rating: migistusSupplier.rating || 5,
                verified: migistusSupplier.status === 'active',
                location: migistusSupplier.address || 'Iowa, USA',
                avatar: migistusSupplier.avatar || null,
                banner: migistusSupplier.banner || null
              };
            }
          } else if (verifiedSupplierData) {
            // Update supplier with full data from verified suppliers
            productData.supplier = {
              ...productData.supplier,
              id: verifiedSupplierData.id,
              avatar: verifiedSupplierData.avatar || null,
              banner: verifiedSupplierData.banner || null
            };
          }
        }
      } catch (err) {
        console.error('Error fetching suppliers:', err);
      }
      
      setProduct(productData);
      
      // Check if user has voted for this product
      if (isAuthenticated && user) {
        checkUserVote(productData.id);
        await checkUserOrder(productData.id);
        await checkWishlistStatus(productData.id);
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

  const checkWishlistStatus = async (productId: number) => {
    if (!isAuthenticated || !user) return;
    
    try {
      const response = await fetch('/api/account/wishlist', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          const isInWishlist = result.data.some((item: any) => item.productId === productId);
          setIsWishlist(isInWishlist);
        }
      }
    } catch (error) {
      console.error("Error checking wishlist:", error);
    }
  };
  
  const calculateRemainingVotes = () => {
    console.log('calculateRemainingVotes called', { 
      hasUser: !!user, 
      hasConfig: !!votingConfig,
      userId: user?.id,
      tier: (user as any)?.tier,
      allVotesCount: allVotes.length
    });
    
    if (!user || !votingConfig) {
      console.log('No user or config, setting remaining to 0');
      setRemainingVotes(0);
      return;
    }
    
    const userTier = (user as any).tier || 'Initiate';
    console.log('User tier:', userTier);
    
    // Admin has unlimited votes
    if (userTier === 'Admin') {
      setRemainingVotes(999);
      return;
    }
    
    const maxVotes = votingConfig.tierLimits?.[userTier] || 1;
    const today = new Date().toDateString();
    
    const votesToday = allVotes.filter((vote: any) => {
      const isUserVote = vote.userId === user.id;
      const isToday = new Date(vote.timestamp).toDateString() === today;
      console.log('Checking vote:', { 
        voteUserId: vote.userId, 
        currentUserId: user.id,
        isUserVote,
        voteDate: new Date(vote.timestamp).toDateString(),
        today,
        isToday
      });
      return isUserVote && isToday;
    }).length;
    
    const remaining = Math.max(0, maxVotes - votesToday);
    console.log('Vote calculation:', { maxVotes, votesToday, remaining, tierLimits: votingConfig.tierLimits });
    setRemainingVotes(remaining);
  };

  const checkUserOrder = async (productId: number) => {
    if (!isAuthenticated || !user) return;
    
    try {
      setOrderCheckLoading(true);
      const response = await fetch(`/api/product-orders?productId=${productId}&userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.order) {
          setHasOrdered(true);
          setUserOrder(data.order);
          // User can review if they've ordered and haven't reviewed yet
          setCanReview(true);
        } else {
          setHasOrdered(false);
          setUserOrder(null);
          setCanReview(false);
        }
      }
    } catch (error) {
      console.error("Error checking user order:", error);
    } finally {
      setOrderCheckLoading(false);
    }
  };

  const fetchReviews = async () => {
    if (!product) return;
    
    try {
      setReviewsLoading(true);
      const response = await fetch(`/api/products/reviews/${product.id}`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data);
        
        // Check if current user has reviewed
        if (isAuthenticated && user) {
          const userReview = data.find((r: any) => r.userId === user.id);
          setHasReviewed(!!userReview);
          setCanReview(hasOrdered && !userReview);
        }
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const submitReview = async () => {
    if (!product || !isAuthenticated || !user || !canReview) return;
    
    if (newReview.title.trim().length === 0 || newReview.comment.trim().length < 10) {
      alert('Please provide a title and at least 10 characters for your review');
      return;
    }
    
    try {
      setReviewSubmitting(true);
      const response = await fetch(`/api/products/reviews/${product.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newReview,
          userName: user.username || `User ${user.id}`
        })
      });
      
      if (response.ok) {
        setNewReview({ rating: 5, title: '', comment: '' });
        setShowReviewForm(false);
        fetchReviews(); // Refresh reviews
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const markReviewHelpful = async (reviewId: number, helpful: boolean) => {
    if (!product) return;
    
    try {
      const response = await fetch(`/api/products/reviews/helpful/${reviewId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ helpful })
      });
      
      if (response.ok) {
        fetchReviews(); // Refresh to show updated counts
      }
    } catch (error) {
      console.error('Error marking review helpful:', error);
    }
  };

  const fetchChatMessages = async () => {
    if (!product) return;
    
    try {
      setChatLoading(true);
      const response = await fetch(`/api/products/chat/${product.id}?limit=50`);
      if (response.ok) {
        const data = await response.json();
        setLiveMessages(data);
      }
    } catch (error) {
      console.error('Error fetching chat messages:', error);
    } finally {
      setChatLoading(false);
    }
  };

  const sendChatMessage = async () => {
    if (!product || !isAuthenticated || !chatMessage.trim()) return;
    
    try {
      setChatSubmitting(true);
      const response = await fetch(`/api/products/chat/${product.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: chatMessage })
      });
      
      if (response.ok) {
        setChatMessage('');
        fetchChatMessages(); // Refresh messages
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setChatSubmitting(false);
    }
  };

  const handleReportMessage = (message: any) => {
    setReportingMessage(message);
    setShowReportModal(true);
  };

  const submitReport = async () => {
    if (!reportingMessage || !product) return;
    
    try {
      setReportSubmitting(true);
      const response = await fetch('/api/products/chat/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: reportingMessage.id,
          reportedUserId: reportingMessage.userId,
          reportedUserName: reportingMessage.userName,
          productId: product.id,
          reason: reportReason,
          description: reportDescription
        })
      });
      
      if (response.ok) {
        alert('Report submitted successfully. Thank you for helping keep our community safe!');
        setShowReportModal(false);
        setReportingMessage(null);
        setReportReason('spam');
        setReportDescription('');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to submit report');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report');
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleVote = async () => {
    console.log('Vote button clicked');
    console.log('Auth status:', { isAuthenticated, user: user?.id, product: product?.id, hasVoted });
    
    if (!isAuthenticated || !user || !product || hasVoted) {
      console.log('Vote prevented - conditions not met');
      if (!isAuthenticated) {
        setVoteToast({ show: true, message: 'Please login to vote', type: 'error' });
        setTimeout(() => setVoteToast({ show: false, message: '', type: 'error' }), 3000);
      }
      return;
    }

    try {
      console.log('Submitting vote for product:', product.id);
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

      console.log('Vote response status:', response.status);
      const responseData = await response.json();
      console.log('Vote response data:', responseData);

      if (response.ok) {
        setHasVoted(true);
        setShowVotePrompt(true); // Show chat unlock prompt
        
        // Show success toast
        setVoteToast({ show: true, message: 'Vote cast! 🎉', type: 'success' });
        setTimeout(() => setVoteToast({ show: false, message: '', type: 'success' }), 3000);
        
        // Broadcast vote to other tabs/pages
        try {
          const channel = new BroadcastChannel('vote-updates');
          console.log('📡 Broadcasting vote to other pages:', { productId: product.id, userId: user.id });
          channel.postMessage({ type: 'VOTE_CAST', productId: product.id, userId: user.id });
          channel.close();
          console.log('✅ Broadcast sent successfully');
        } catch (e) {
          console.log('❌ BroadcastChannel not supported:', e);
        }
        
        // Refresh votes and product data
        const votesRes = await fetch('/api/votes');
        if (votesRes.ok) {
          const votesData = await votesRes.json();
          const newVotes = votesData.votes || votesData || [];
          setAllVotes(newVotes);
          
          // Immediately recalculate remaining votes with new data
          if (user && votingConfig) {
            const userTier = (user as any).tier || 'Initiate';
            if (userTier !== 'Admin') {
              const maxVotes = votingConfig.tierLimits?.[userTier] || 1;
              const today = new Date().toDateString();
              const votesToday = newVotes.filter((vote: any) => 
                vote.userId === user.id && 
                new Date(vote.timestamp).toDateString() === today
              ).length;
              setRemainingVotes(Math.max(0, maxVotes - votesToday));
              console.log('Updated remaining votes:', Math.max(0, maxVotes - votesToday));
            }
          }
        }
        
        fetchProduct();
        // Auto-hide prompt after 8 seconds
        setTimeout(() => setShowVotePrompt(false), 8000);
      } else {
        console.error('Vote failed:', responseData);
        setVoteToast({ show: true, message: responseData.error || 'Failed to vote', type: 'error' });
        setTimeout(() => setVoteToast({ show: false, message: '', type: 'error' }), 3000);
      }
    } catch (error) {
      console.error("Failed to vote:", error);
      setVoteToast({ show: true, message: 'Failed to vote - network error', type: 'error' });
      setTimeout(() => setVoteToast({ show: false, message: '', type: 'error' }), 3000);
    }
  };

  const toggleWishlist = async () => {
    if (!isAuthenticated || !user || !product) {
      // Show login prompt
      alert('Please login to add items to your wishlist');
      return;
    }

    try {
      if (isWishlist) {
        // Remove from wishlist
        const response = await fetch('/api/account/wishlist', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Wishlist fetch error:', response.status, errorText);
          setWishlistToast({ show: true, message: 'Failed to load wishlist', type: 'removed' });
          setTimeout(() => setWishlistToast({ show: false, message: '', type: 'removed' }), 3000);
          return;
        }
        
        const result = await response.json();
        const wishlistItem = result.data?.find((item: any) => item.productId === product.id);
        
        if (wishlistItem) {
          const deleteResponse = await fetch(`/api/account/wishlist?itemId=${wishlistItem.id}`, {
            method: 'DELETE',
            credentials: 'include'
          });
          
          if (deleteResponse.ok) {
            setIsWishlist(false);
            setWishlistToast({ show: true, message: 'Removed from wishlist', type: 'removed' });
            setTimeout(() => setWishlistToast({ show: false, message: '', type: 'removed' }), 3000);
          } else {
            const errorText = await deleteResponse.text();
            console.error('Delete error:', deleteResponse.status, errorText);
            setWishlistToast({ show: true, message: 'Failed to remove', type: 'removed' });
            setTimeout(() => setWishlistToast({ show: false, message: '', type: 'removed' }), 3000);
          }
        }
      } else {
        // Add to wishlist
        console.log('Adding to wishlist:', {
          productId: product.id,
          productName: product.name,
          isAuthenticated,
          userId: user?.id
        });
        
        const response = await fetch('/api/account/wishlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            productId: product.id,
            productName: product.name,
            productImage: product.image || product.images?.[0],
            productPrice: product.price,
            productSlug: product.slug,
            productCategory: product.category
          })
        });
        
        console.log('Response status:', response.status);
        
        if (response.ok) {
          setIsWishlist(true);
          setWishlistToast({ show: true, message: 'Added to wishlist!', type: 'added' });
          setTimeout(() => setWishlistToast({ show: false, message: '', type: 'added' }), 3000);
        } else {
          const errorText = await response.text();
          console.error('Add to wishlist error:', response.status, errorText);
          setWishlistToast({ show: true, message: 'Failed to add', type: 'added' });
          setTimeout(() => setWishlistToast({ show: false, message: '', type: 'added' }), 3000);
        }
      }
    } catch (error) {
      console.error("Failed to update wishlist:", error);
      setWishlistToast({ show: true, message: 'An error occurred', type: 'added' });
      setTimeout(() => setWishlistToast({ show: false, message: '', type: 'added' }), 3000);
    }
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

  const handleAddToCart = async () => {
    if (!isAuthenticated || !user || !product) {
      router.push('/login-new');
      return;
    }

    try {
      const response = await fetch('/api/cart/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          productId: product.id,
          productName: product.name,
          productImage: product.image || product.images?.[0],
          productPrice: product.price,
          productSlug: product.slug,
          quantity: quantity,
        })
      });

      if (response.ok) {
        // Show success toast
        setVoteToast({ show: true, message: `Added ${quantity} item(s) to cart!`, type: 'success' });
        setTimeout(() => setVoteToast({ show: false, message: '', type: 'success' }), 3000);
      } else {
        const errorData = await response.json();
        setVoteToast({ show: true, message: errorData.error || 'Failed to add to cart', type: 'error' });
        setTimeout(() => setVoteToast({ show: false, message: '', type: 'error' }), 3000);
      }
    } catch (error) {
      console.error("Failed to add to cart:", error);
      setVoteToast({ show: true, message: 'Failed to add to cart - network error', type: 'error' });
      setTimeout(() => setVoteToast({ show: false, message: '', type: 'error' }), 3000);
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated || !user || !product) {
      router.push('/login-new');
      return;
    }

    try {
      // Add to cart first
      const response = await fetch('/api/cart/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          productId: product.id,
          productName: product.name,
          productImage: product.image || product.images?.[0],
          productPrice: product.price,
          productSlug: product.slug,
          quantity: quantity,
        })
      });

      if (response.ok) {
        // Redirect to checkout immediately
        router.push('/checkout');
      } else {
        const errorData = await response.json();
        setVoteToast({ show: true, message: errorData.error || 'Failed to process order', type: 'error' });
        setTimeout(() => setVoteToast({ show: false, message: '', type: 'error' }), 3000);
      }
    } catch (error) {
      console.error("Failed to process buy now:", error);
      setVoteToast({ show: true, message: 'Failed to process order - network error', type: 'error' });
      setTimeout(() => setVoteToast({ show: false, message: '', type: 'error' }), 3000);
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

  // Helper function to render formatted text (bullets, numbers, headings)
  const renderFormattedText = (text: string | undefined, className: string = "text-zinc-300") => {
    if (!text) return null;
    
    return (
      <div className={`whitespace-pre-line leading-relaxed ${className}`}>
        {text.split('\n').map((line, index) => {
          // Check for heading (## )
          if (line.startsWith('## ')) {
            return (
              <h3 key={index} className="text-xl font-bold text-yellow-400 mt-4 mb-2">
                {line.substring(3)}
              </h3>
            );
          }
          // Check for bullet point (• )
          if (line.startsWith('• ')) {
            return (
              <div key={index} className="flex items-start mb-1">
                <span className="text-yellow-400 mr-2 mt-0.5">•</span>
                <span>{line.substring(2)}</span>
              </div>
            );
          }
          // Check for numbered list (1. 2. etc.)
          const numberMatch = line.match(/^(\d+)\.\s(.+)/);
          if (numberMatch) {
            return (
              <div key={index} className="flex items-start mb-1">
                <span className="text-yellow-400 mr-2 min-w-[1.5rem]">{numberMatch[1]}.</span>
                <span>{numberMatch[2]}</span>
              </div>
            );
          }
          // Regular line
          return line ? <p key={index} className="mb-2">{line}</p> : <br key={index} />;
        })}
      </div>
    );
  };

  // VOTING STAGE LAYOUT - Focus on getting votes
  const renderVotingStage = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      {/* LEFT: Product Media */}
      <div className="space-y-6">
        {/* Main Image */}
        <div className="relative aspect-square rounded-2xl overflow-hidden border-4 border-blue-500/30 bg-zinc-900 shadow-2xl shadow-blue-500/20">
          <Image
            src={productImages[selectedImageIndex]}
            alt={product.name}
            fill
            className="object-cover"
            priority
          />
          {/* Voting Badge Overlay */}
          <div className="absolute top-6 left-6">
            <div className="relative group/badge">
              <div className="absolute inset-0 blur-xl bg-blue-500"></div>
              <div className="relative px-6 py-3 rounded-xl font-bold flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-xl">
                <Vote className="w-6 h-6" />
                <span className="text-lg uppercase tracking-wider">🗳️ In Voting</span>
              </div>
            </div>
          </div>
        </div>

        {/* Thumbnails */}
        {productImages.length > 1 && (
          <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
            {productImages.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImageIndex(index)}
                className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                  selectedImageIndex === index 
                    ? 'border-blue-400 scale-110 shadow-lg shadow-blue-500/50' 
                    : 'border-zinc-700 hover:border-zinc-500 opacity-60 hover:opacity-100'
                }`}
              >
                <Image src={image} alt={`View ${index + 1}`} fill className="object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Community Sentiment */}
        <div className="bg-gradient-to-br from-blue-900/30 to-zinc-900/50 border border-blue-500/20 rounded-2xl p-6">
          <h3 className="text-blue-400 font-bold text-lg mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Community Interest
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-zinc-400">Vote Progress</span>
                <span className="text-blue-400 font-bold">{product.votes || 0} votes</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
                <div 
                  className="h-3 bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
                  style={{ width: `${Math.min(((product.votes || 0) / 100) * 100, 100)}%` }}
                ></div>
              </div>
              <p className="text-zinc-500 text-xs mt-2">Goal: 100 votes to move to Coming Soon</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-800/50 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-white">{daysInStage}</div>
                <div className="text-xs text-zinc-400">Days in Voting</div>
              </div>
              <div className="bg-zinc-800/50 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-blue-400">{Math.min(Math.round(((product.votes || 0) / 100) * 100), 100)}%</div>
                <div className="text-xs text-zinc-400">To Goal</div>
              </div>
            </div>
          </div>
        </div>

        {/* Supplier Information */}
        {product.supplier && (
          <Link 
            href={`/supplier/${(product.supplier.name || '').toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
            className="block bg-gradient-to-br from-purple-900/30 to-zinc-900/50 border border-purple-500/20 hover:border-purple-500/40 rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/20 cursor-pointer group"
          >
            {/* Banner */}
            {product.supplier.banner ? (
              <div className="relative w-full h-24 overflow-hidden">
                <Image 
                  src={product.supplier.banner} 
                  alt={`${product.supplier.name} banner`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent opacity-60"></div>
              </div>
            ) : (
              <div className="relative w-full h-24 overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-black">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-yellow-400/10 to-yellow-500/5"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 tracking-widest opacity-30">
                      MIGISTUS
                    </h1>
                    <p className="text-xs font-semibold text-yellow-400/20 tracking-wider">
                      SUPPLIER
                    </p>
                  </div>
                </div>
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `repeating-linear-gradient(
                      45deg,
                      transparent,
                      transparent 15px,
                      rgba(234, 179, 8, 0.1) 15px,
                      rgba(234, 179, 8, 0.1) 30px
                    )`
                  }}></div>
                </div>
              </div>
            )}
            
            <div className="relative p-6 -mt-10">
              <div className="flex items-start space-x-4 mb-4">
                {/* Avatar */}
                <div className="relative z-10 flex-shrink-0">
                  <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-zinc-900 group-hover:ring-purple-500/50 transition-all">
                    <Image 
                      src={product.supplier.avatar || '/Icons/SupplierPlaceHolder.png'} 
                      alt={product.supplier.name}
                      width={80}
                      height={80}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  {product.supplier.verified && (
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-500 rounded-full border-2 border-zinc-900 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-purple-400 font-bold text-lg flex items-center">
                      <Package className="w-5 h-5 mr-2" />
                      Supplier
                    </h3>
                    <ExternalLink className="w-4 h-4 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  
                  <h4 className="text-white font-bold text-lg group-hover:text-purple-300 transition-colors mb-1">
                    {product.supplier.name}
                  </h4>
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-white font-semibold">{product.supplier.rating}</span>
                      <span className="text-zinc-400 text-sm">/5.0</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-zinc-400 mb-3">
                    <Globe className="w-4 h-4" />
                    <span>{product.supplier.location}</span>
                  </div>
                  <div className="text-xs text-purple-400 group-hover:text-purple-300 transition-colors font-medium">
                    Click to view all products from this supplier →
                  </div>
                </div>
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* RIGHT: Vote Call-to-Action */}
      <div className="space-y-6">
        {/* Product Title */}
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full">
              <span className="text-blue-400 text-sm font-bold uppercase">{product.category || 'Product'}</span>
            </div>
          </div>
          <h1 className="text-5xl font-black text-white mb-4">{product.name}</h1>
          {renderFormattedText(product.description, "text-xl")}
        </div>

        {/* Why Vote Section */}
        <div className="bg-gradient-to-br from-yellow-900/20 to-zinc-900/50 border border-yellow-500/30 rounded-2xl p-6">
          <div className="flex items-start space-x-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h3 className="text-yellow-400 font-bold text-lg mb-2">Why Vote for This?</h3>
              <p className="text-zinc-300 text-sm leading-relaxed">
                Your vote helps this product reach our community! If it gets enough support, 
                it moves to "Coming Soon" and you'll be among the first to get exclusive deals.
              </p>
            </div>
          </div>
        </div>

        {/* Estimated Price Preview */}
        {product.price && (
          <div className="bg-gradient-to-br from-zinc-900/90 to-zinc-800/90 border border-zinc-700 rounded-2xl p-6">
            <div className="text-zinc-400 text-sm mb-2">Estimated Drop Price</div>
            <div className="flex items-end justify-between">
              <div className="text-4xl font-black text-yellow-400">${product.price.toFixed(2)}</div>
              {product.originalPrice && (
                <div className="text-zinc-500 text-lg line-through">${product.originalPrice.toFixed(2)}</div>
              )}
            </div>
            <p className="text-zinc-500 text-sm mt-2">Price may change based on community pledges</p>
          </div>
        )}

        {/* MASSIVE VOTE BUTTON */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-2xl animate-pulse"></div>
          <button
            onClick={handleVote}
            disabled={!isAuthenticated || hasVoted || remainingVotes === 0}
            className={`relative w-full py-6 px-8 rounded-2xl font-black text-xl transition-all duration-300 flex items-center justify-center space-x-3 ${
              hasVoted
                ? "bg-green-600 text-white shadow-lg shadow-green-500/50 cursor-not-allowed"
                : !isAuthenticated
                ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                : remainingVotes === 0
                ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-2xl shadow-blue-500/50 hover:scale-105 hover:shadow-blue-500/70"
            }`}
          >
            <Vote className="w-8 h-8" />
            <span>
              {hasVoted ? "✓ VOTE CAST!" : !isAuthenticated ? "LOGIN TO VOTE" : remainingVotes === 0 ? "NO VOTES LEFT" : "VOTE FOR THIS PRODUCT"}
            </span>
          </button>
          
          {/* Vote count indicator */}
          {isAuthenticated && !hasVoted && remainingVotes > 0 && (
            <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs font-bold rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
              {remainingVotes}
            </div>
          )}
          
          {/* Vote Toast Notification */}
          {voteToast.show && (
            <div className={`absolute -top-16 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg z-50 whitespace-nowrap animate-in fade-in slide-in-from-bottom-2 duration-300 ${
              voteToast.type === 'success' 
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' 
                : 'bg-gradient-to-r from-red-500 to-orange-500 text-white'
            }`}>
              <div className="flex items-center gap-2">
                <Vote className="w-4 h-4" />
                <span className="text-sm font-semibold">{voteToast.message}</span>
              </div>
              {/* Arrow pointing down */}
              <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent ${
                voteToast.type === 'success' ? 'border-t-purple-500' : 'border-t-orange-500'
              }`}></div>
            </div>
          )}
        </div>

        {/* Social Proof */}
        <div className="flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
          <div className="relative">
            <button onClick={toggleWishlist} className="flex items-center space-x-2 text-zinc-400 hover:text-red-400 transition">
              <Heart className={`w-5 h-5 ${isWishlist ? 'fill-current text-red-400' : ''}`} />
              <span className="text-sm">Save</span>
            </button>
            
            {/* Wishlist Toast Notification */}
            {wishlistToast.show && (
              <div className={`absolute -top-16 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg z-50 whitespace-nowrap animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                wishlistToast.type === 'added' 
                  ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white' 
                  : 'bg-gradient-to-r from-zinc-700 to-zinc-600 text-white'
              }`}>
                <div className="flex items-center gap-2">
                  <Heart className={`w-4 h-4 ${wishlistToast.type === 'added' ? 'fill-current' : ''}`} />
                  <span className="text-sm font-semibold">{wishlistToast.message}</span>
                </div>
                {/* Arrow pointing down */}
                <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent ${
                  wishlistToast.type === 'added' ? 'border-t-red-500' : 'border-t-zinc-600'
                }`}></div>
              </div>
            )}
          </div>
          <button onClick={handleShare} className="flex items-center space-x-2 text-zinc-400 hover:text-blue-400 transition">
            <Share2 className="w-5 h-5" />
            <span className="text-sm">Share</span>
          </button>
          <div className="flex items-center space-x-2 text-zinc-400">
            <Eye className="w-5 h-5" />
            <span className="text-sm">{Math.floor(Math.random() * 500) + 100} views</span>
          </div>
        </div>

        {/* Features Preview */}
        {product.features && product.features.length > 0 && (
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6">
            <h3 className="text-white font-bold mb-4">Key Features</h3>
            <ul className="space-y-2">
              {product.features.slice(0, 5).map((feature, index) => (
                <li key={index} className="flex items-start space-x-2 text-zinc-300 text-sm">
                  <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );

  // COMING SOON STAGE LAYOUT - Focus on showcasing product
  const renderComingSoonStage = () => (
    <div className="space-y-12">
      {/* Hero Section - Full Width Showcase */}
      <div className="relative">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Large Hero Image - Takes 3 columns */}
          <div className="lg:col-span-3">
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden border-4 border-yellow-500/30 bg-zinc-900 shadow-2xl shadow-yellow-500/20">
              <Image
                src={productImages[selectedImageIndex]}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
              {/* Coming Soon Badge */}
              <div className="absolute top-6 left-6">
                <div className="relative group/badge">
                  <div className="absolute inset-0 blur-xl bg-yellow-500"></div>
                  <div className="relative px-6 py-3 rounded-xl font-bold flex items-center space-x-2 bg-gradient-to-r from-yellow-500 to-yellow-400 text-black shadow-xl">
                    <Clock className="w-6 h-6" />
                    <span className="text-lg uppercase tracking-wider">⏰ Coming Soon</span>
                  </div>
                </div>
              </div>

              {/* Image Gallery Navigation */}
              {productImages.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImageIndex((prev) => (prev === 0 ? productImages.length - 1 : prev - 1))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 backdrop-blur-sm hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-all hover:scale-110"
                  >
                    ←
                  </button>
                  <button
                    onClick={() => setSelectedImageIndex((prev) => (prev === productImages.length - 1 ? 0 : prev + 1))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 backdrop-blur-sm hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-all hover:scale-110"
                  >
                    →
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {productImages.length > 1 && (
              <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide mt-4">
                {productImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                      selectedImageIndex === index 
                        ? 'border-yellow-400 scale-110 shadow-lg shadow-yellow-500/50' 
                        : 'border-zinc-700 hover:border-zinc-500 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <Image src={image} alt={`View ${index + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info Panel - Takes 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Title */}
            <div>
              <div className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-full w-fit mb-3">
                <span className="text-yellow-400 text-sm font-bold uppercase">{product.category || 'Product'}</span>
              </div>
              <h1 className="text-5xl font-black text-white mb-4 leading-tight">{product.name}</h1>
              {renderFormattedText(product.description, "text-xl")}
            </div>

            {/* Launch Countdown */}
            <div className="bg-gradient-to-br from-yellow-900/30 to-zinc-900/50 border border-yellow-500/20 rounded-2xl p-6">
              <h3 className="text-yellow-400 font-bold text-lg mb-4 flex items-center">
                <Timer className="w-5 h-5 mr-2" />
                Launching Soon
              </h3>
              <div className="text-center">
                <div className="text-4xl font-black text-yellow-400 mb-2">{7 - daysInStage} Days</div>
                <div className="text-zinc-400 text-sm">Until community drop begins</div>
              </div>
            </div>

            {/* Notify Me Button */}
            <button className="w-full py-4 px-6 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black rounded-2xl font-bold text-lg transition-all flex items-center justify-center space-x-2 shadow-xl shadow-yellow-500/30 hover:scale-105">
              <Bell className="w-6 h-6" />
              <span>NOTIFY ME WHEN IT DROPS</span>
            </button>

            {/* Expected Price */}
            {product.price && (
              <div className="bg-gradient-to-br from-zinc-900/90 to-zinc-800/90 border border-zinc-700 rounded-2xl p-6">
                <div className="text-zinc-400 text-sm mb-2">Expected Launch Price</div>
                <div className="flex items-baseline space-x-3 mb-2">
                  <div className="text-4xl font-black text-yellow-400">${product.price.toFixed(2)}</div>
                  {product.originalPrice && (
                    <div className="text-zinc-500 text-xl line-through">${product.originalPrice.toFixed(2)}</div>
                  )}
                </div>
                {product.originalPrice && (
                  <div className="flex items-center space-x-2">
                    <div className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
                      <span className="text-green-400 text-sm font-bold">
                        Save ${(product.originalPrice - product.price).toFixed(2)} ({Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF)
                      </span>
                    </div>
                  </div>
                )}
                <p className="text-zinc-500 text-xs mt-3">Price will drop further based on pledge count!</p>
              </div>
            )}

            {/* Social Actions */}
            <div className="flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
              <button onClick={toggleWishlist} className="flex items-center space-x-2 text-zinc-400 hover:text-red-400 transition">
                <Heart className={`w-5 h-5 ${isWishlist ? 'fill-current text-red-400' : ''}`} />
                <span className="text-sm">Wishlist</span>
              </button>
              <button onClick={handleShare} className="flex items-center space-x-2 text-zinc-400 hover:text-yellow-400 transition">
                <Share2 className="w-5 h-5" />
                <span className="text-sm">Share</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Features Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(product.features || ['Feature 1', 'Feature 2', 'Feature 3']).slice(0, 6).map((feature, index) => (
          <div key={index} className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/80 border border-zinc-700 rounded-xl p-6 hover:border-yellow-500/30 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center mb-4 group-hover:bg-yellow-500/20 transition-colors">
              <CheckCircle className="w-6 h-6 text-yellow-400" />
            </div>
            <h4 className="text-white font-bold mb-2">{feature}</h4>
            <p className="text-zinc-400 text-sm">Premium quality feature designed for best performance</p>
          </div>
        ))}
      </div>

      {/* Specifications */}
      {product.specifications && Object.keys(product.specifications).length > 0 && (
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
            <Package className="w-6 h-6 mr-3 text-yellow-400" />
            Technical Specifications
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(product.specifications).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center p-4 bg-zinc-800/50 rounded-xl">
                <span className="text-zinc-400 font-medium">{key}</span>
                <span className="text-white font-bold">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // LIVE DROPS STAGE LAYOUT - Focus on pledges and urgency
  const renderLiveDropsStage = () => {
    // ...existing code for live drops will go here
    // For now, I'll keep the current layout as the live drops default
    return null; // Placeholder - will use main return content
  };

  // AVAILABLE STAGE LAYOUT - Products ready for purchase
  const renderAvailableStage = () => (
    <div className="space-y-12">
      {/* Hero Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Product Images - Takes 3 columns */}
        <div className="lg:col-span-3 space-y-4">
          {/* Main Image */}
          <div className="relative aspect-square rounded-3xl overflow-hidden bg-zinc-900 border-2 border-zinc-800">
            <Image
              src={productImages[selectedImageIndex]}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />

            {/* Stock Status Badge */}
            {product.stock && product.stock > 0 && (
              <div className="absolute top-6 left-6">
                <div className="relative group/badge">
                  <div className="absolute inset-0 blur-xl bg-green-500"></div>
                  <div className="relative px-6 py-3 rounded-xl font-bold flex items-center space-x-2 bg-gradient-to-r from-green-500 to-green-400 text-white shadow-xl">
                    <CheckCircle className="w-6 h-6" />
                    <span className="text-lg uppercase tracking-wider">✓ In Stock</span>
                  </div>
                </div>
              </div>
            )}

            {/* Image Gallery Navigation */}
            {productImages.length > 1 && (
              <>
                <button
                  onClick={() => setSelectedImageIndex((prev) => (prev === 0 ? productImages.length - 1 : prev - 1))}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 backdrop-blur-sm hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-all hover:scale-110"
                >
                  ←
                </button>
                <button
                  onClick={() => setSelectedImageIndex((prev) => (prev === productImages.length - 1 ? 0 : prev + 1))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 backdrop-blur-sm hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-all hover:scale-110"
                >
                  →
                </button>
              </>
            )}
          </div>

          {/* Thumbnail Gallery */}
          {productImages.length > 1 && (
            <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
              {productImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                    selectedImageIndex === index 
                      ? 'border-yellow-400 scale-110 shadow-lg shadow-yellow-500/50' 
                      : 'border-zinc-700 hover:border-zinc-500 opacity-60 hover:opacity-100'
                  }`}
                >
                  <Image src={image} alt={`View ${index + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Purchase Panel - Takes 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Title */}
          <div>
            <div className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-full w-fit mb-3">
              <span className="text-yellow-400 text-sm font-bold uppercase">{product.category || 'Product'}</span>
            </div>
            <h1 className="text-5xl font-black text-white mb-4 leading-tight">{product.name}</h1>
            {renderFormattedText(product.description, "text-xl")}
          </div>

          {/* Price Display */}
          {product.price && (
            <div className="bg-gradient-to-br from-zinc-900/90 to-zinc-800/90 border border-zinc-700 rounded-2xl p-6">
              <div className="flex items-baseline space-x-3 mb-2">
                <div className="text-5xl font-black text-yellow-400">${product.price.toFixed(2)}</div>
                {product.originalPrice && (
                  <div className="text-zinc-500 text-xl line-through">${product.originalPrice.toFixed(2)}</div>
                )}
              </div>
              {product.originalPrice && (
                <div className="flex items-center space-x-2">
                  <div className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
                    <span className="text-green-400 text-sm font-bold">
                      Save ${(product.originalPrice - product.price).toFixed(2)} ({Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF)
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Stock Status */}
          {product.stock !== undefined && (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
              {product.stock > 0 ? (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-400 font-medium">
                    {product.stock > 10 ? 'In Stock' : `Only ${product.stock} left in stock!`}
                  </span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <span className="text-red-400 font-medium">Out of Stock</span>
                </div>
              )}
            </div>
          )}

          {/* Quantity Selector */}
          {product.stock && product.stock > 0 && (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
              <label className="block text-zinc-400 text-sm mb-3 font-medium">Quantity</label>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12 bg-zinc-800 hover:bg-zinc-700 rounded-xl flex items-center justify-center text-white font-bold text-xl transition-colors"
                >
                  −
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock || 1, parseInt(e.target.value) || 1)))}
                  className="flex-1 text-center text-2xl font-bold bg-zinc-800 border border-zinc-700 rounded-xl py-3 text-white focus:border-yellow-400 focus:outline-none"
                  min="1"
                  max={product.stock}
                />
                <button
                  onClick={() => setQuantity(Math.min(product.stock || 1, quantity + 1))}
                  disabled={quantity >= (product.stock || 1)}
                  className="w-12 h-12 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl flex items-center justify-center text-white font-bold text-xl transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Purchase Buttons */}
          {product.stock && product.stock > 0 && (
            <div className="space-y-3">
              {/* Buy Now Button - Primary CTA */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 blur-2xl animate-pulse"></div>
                <button
                  onClick={handleBuyNow}
                  className="relative w-full py-6 px-8 rounded-2xl font-black text-xl transition-all duration-300 flex items-center justify-center space-x-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black shadow-2xl shadow-yellow-500/50 hover:scale-105 hover:shadow-yellow-500/70"
                >
                  <ShoppingCart className="w-8 h-8" />
                  <span>BUY NOW</span>
                </button>
              </div>

              {/* Add to Cart Button - Secondary CTA */}
              <button
                onClick={handleAddToCart}
                className="w-full py-4 px-6 bg-zinc-800 hover:bg-zinc-700 border-2 border-zinc-700 hover:border-yellow-500 text-white rounded-2xl font-bold text-lg transition-all flex items-center justify-center space-x-2"
              >
                <ShoppingCart className="w-6 h-6" />
                <span>ADD TO CART</span>
              </button>
            </div>
          )}

          {/* Social Actions */}
          <div className="flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
            <button onClick={toggleWishlist} className="flex items-center space-x-2 text-zinc-400 hover:text-red-400 transition">
              <Heart className={`w-5 h-5 ${isWishlist ? 'fill-current text-red-400' : ''}`} />
              <span className="text-sm">Wishlist</span>
            </button>
            <button onClick={handleShare} className="flex items-center space-x-2 text-zinc-400 hover:text-yellow-400 transition">
              <Share2 className="w-5 h-5" />
              <span className="text-sm">Share</span>
            </button>
          </div>

          {/* Shipping Info */}
          {product.shipping && (
            <div className="bg-gradient-to-br from-blue-900/30 to-zinc-900/50 border border-blue-500/20 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <Truck className="w-5 h-5 text-blue-400 mt-0.5" />
                <div>
                  <div className="text-white font-medium mb-1">Free Shipping</div>
                  <div className="text-zinc-400 text-sm">Estimated delivery: 3-5 business days</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Features Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(product.features || ['Premium Quality', 'Fast Shipping', 'Satisfaction Guaranteed']).slice(0, 6).map((feature, index) => (
          <div key={index} className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/80 border border-zinc-700 rounded-xl p-6 hover:border-yellow-500/30 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center mb-4 group-hover:bg-yellow-500/20 transition-colors">
              <CheckCircle className="w-6 h-6 text-yellow-400" />
            </div>
            <h4 className="text-white font-bold mb-2">{feature}</h4>
            <p className="text-zinc-400 text-sm">Premium quality feature designed for best performance</p>
          </div>
        ))}
      </div>

      {/* Specifications */}
      {product.specifications && Object.keys(product.specifications).length > 0 && (
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
            <Package className="w-6 h-6 mr-3 text-yellow-400" />
            Technical Specifications
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(product.specifications).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center p-4 bg-zinc-800/50 rounded-xl">
                <span className="text-zinc-400 font-medium">{key}</span>
                <span className="text-white font-bold">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Render different layouts based on product stage
  const renderStageSpecificContent = () => {
    switch (product.stage) {
      case 'voting':
        return renderVotingStage();
      case 'coming-soon':
        return renderComingSoonStage();
      case 'community-drops':
        return renderLiveDropsStage();
      case 'available':
      case 'recently-completed':
        return renderAvailableStage();
      default:
        return renderAvailableStage(); // Default to available for purchase
    }
  };

  return (
    <>
      <Head>
        <title>{product.name} - MIGISTUS</title>
        <meta name="description" content={product.description || `Discover ${product.name} on MIGISTUS`} />
        <meta property="og:title" content={product.name} />
        <meta property="og:description" content={product.description} />
        <meta property="og:image" content={product.image} />
        <style>{`
          @keyframes slideInRight {
            from {
              transform: translateX(400px);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          .animate-slide-in-right {
            animation: slideInRight 0.4s ease-out;
          }
        `}</style>
      </Head>

      <MainNavbar />

      {/* Hero Section with Immersive Background */}
      <div className="relative min-h-screen bg-black overflow-hidden">
        {/* Vote Success Prompt */}
        {showVotePrompt && (
          <div className="fixed top-20 right-4 z-50 max-w-sm animate-slide-in-right">
            <div className="bg-gradient-to-r from-yellow-500/90 to-yellow-600/90 backdrop-blur-sm border-2 border-yellow-400 rounded-xl p-4 shadow-2xl">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-black/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-5 h-5 text-black" />
                </div>
                <div className="flex-1">
                  <h4 className="text-black font-bold mb-1">Vote Counted! 🎉</h4>
                  <p className="text-black/80 text-sm mb-2">
                    You've unlocked the community chat! Products with more engagement move to the next stage faster.
                  </p>
                  <button
                    onClick={() => {
                      setActiveTab('chat');
                      setShowVotePrompt(false);
                    }}
                    className="bg-black hover:bg-black/80 text-yellow-400 px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                  >
                    Join Discussion →
                  </button>
                </div>
                <button
                  onClick={() => setShowVotePrompt(false)}
                  className="text-black/60 hover:text-black transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/20 via-black to-blue-900/20"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(234,179,8,0.1),transparent_50%)]"></div>
        
        {/* Floating particles effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl -top-48 -left-48 animate-pulse"></div>
          <div className="absolute w-96 h-96 bg-blue-500/5 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb - Enhanced */}
          <div className="flex items-center space-x-2 text-sm mb-6 bg-zinc-900/50 backdrop-blur-sm rounded-full px-4 py-2 w-fit border border-zinc-800">
            <Link href="/" className="text-zinc-400 hover:text-yellow-400 transition-colors">Home</Link>
            <span className="text-zinc-600">/</span>
            <Link href="/voting" className="text-zinc-400 hover:text-yellow-400 transition-colors">Products</Link>
            <span className="text-zinc-600">/</span>
            <span className="text-white font-medium">{product.name}</span>
          </div>

          {/* Stage-Specific Content */}
          {renderStageSpecificContent()}

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
                      {showFullDescription ? 
                        renderFormattedText(product.fullDescription || product.description) :
                        renderFormattedText(product.description?.substring(0, 300) + (product.description && product.description.length > 300 ? '...' : ''))
                      }
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
                      <h3 className="text-xl font-bold text-white">
                        Community Reviews ({reviews.length})
                      </h3>
                      {canReview && !hasReviewed && (
                        <button
                          onClick={() => setShowReviewForm(!showReviewForm)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                        >
                          <Star className="w-4 h-4" />
                          <span>Write Review</span>
                        </button>
                      )}
                      {!canReview && isAuthenticated && !hasOrdered && (
                        <div className="text-sm text-zinc-400 bg-zinc-700/50 px-4 py-2 rounded-lg">
                          <Shield className="w-4 h-4 inline mr-1" />
                          Purchase required to review
                        </div>
                      )}
                      {hasReviewed && (
                        <div className="text-sm text-green-400 bg-green-500/10 px-4 py-2 rounded-lg">
                          <CheckCircle className="w-4 h-4 inline mr-1" />
                          You've reviewed this product
                        </div>
                      )}
                    </div>

                    {/* Average Rating */}
                    {reviews.length > 0 && (
                      <div className="flex items-center space-x-6 mb-6">
                        <div className="text-center">
                          <div className="text-4xl font-bold text-white">
                            {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)}
                          </div>
                          <div className="flex items-center justify-center space-x-1 mb-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-5 h-5 ${
                                  star <= Math.round(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length)
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-zinc-600'
                                }`}
                              />
                            ))}
                          </div>
                          <div className="text-zinc-400 text-sm">{reviews.length} reviews</div>
                        </div>
                        <div className="flex-1">
                          {[5, 4, 3, 2, 1].map((stars) => {
                            const count = reviews.filter(r => r.rating === stars).length;
                            const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                            return (
                              <div key={stars} className="flex items-center space-x-2 mb-1">
                                <span className="text-zinc-400 text-sm w-8">{stars}★</span>
                                <div className="flex-1 h-2 bg-zinc-700 rounded-full">
                                  <div 
                                    className="h-2 bg-yellow-400 rounded-full transition-all"
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                                <span className="text-zinc-400 text-sm w-8">{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Review Form */}
                    {showReviewForm && canReview && (
                      <div className="border-t border-zinc-700 pt-6">
                        <h4 className="text-lg font-bold text-white mb-4">Write Your Review</h4>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-zinc-400 text-sm mb-2">Rating *</label>
                            <div className="flex space-x-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  onClick={() => setNewReview({...newReview, rating: star})}
                                  className={`w-8 h-8 ${star <= newReview.rating ? 'text-yellow-400' : 'text-zinc-600'}`}
                                >
                                  <Star className="w-6 h-6 fill-current" />
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="block text-zinc-400 text-sm mb-2">Title *</label>
                            <input
                              type="text"
                              value={newReview.title}
                              onChange={(e) => setNewReview({...newReview, title: e.target.value})}
                              placeholder="Sum up your experience"
                              className="w-full p-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:border-yellow-400 focus:outline-none"
                              maxLength={100}
                            />
                          </div>
                          <div>
                            <label className="block text-zinc-400 text-sm mb-2">Your Review * (minimum 10 characters)</label>
                            <textarea
                              value={newReview.comment}
                              onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                              placeholder="Share your thoughts about this product..."
                              className="w-full p-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:border-yellow-400 focus:outline-none"
                              rows={4}
                              maxLength={1000}
                            />
                            <div className="text-xs text-zinc-500 mt-1">{newReview.comment.length}/1000</div>
                          </div>
                          <div className="flex space-x-3">
                            <button 
                              onClick={submitReview}
                              disabled={reviewSubmitting || newReview.title.trim().length === 0 || newReview.comment.trim().length < 10}
                              className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-zinc-600 disabled:text-zinc-400 text-black px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                            >
                              {reviewSubmitting ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                  <span>Submitting...</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4" />
                                  <span>Submit Review</span>
                                </>
                              )}
                            </button>
                            <button 
                              onClick={() => setShowReviewForm(false)}
                              disabled={reviewSubmitting}
                              className="bg-zinc-600 hover:bg-zinc-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Individual Reviews */}
                  {reviewsLoading ? (
                    <div className="text-center py-12">
                      <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <div className="text-zinc-400">Loading reviews...</div>
                    </div>
                  ) : reviews.length > 0 ? (
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <div key={review.id} className="bg-zinc-800/30 rounded-lg p-6">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center text-black font-bold">
                                {review.userName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-white font-medium">{review.userName}</span>
                                  {review.verifiedPurchase && (
                                    <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full flex items-center space-x-1">
                                      <CheckCircle className="w-3 h-3" />
                                      <span>Verified Purchase</span>
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="flex items-center space-x-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400 fill-current' : 'text-zinc-600'}`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-zinc-500 text-xs">
                                    {new Date(review.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {review.title && (
                            <h4 className="text-white font-semibold mb-2">{review.title}</h4>
                          )}
                          <p className="text-zinc-300 mb-4">{review.comment}</p>
                          
                          <div className="flex items-center space-x-4 pt-3 border-t border-zinc-700">
                            <button 
                              onClick={() => markReviewHelpful(review.id, true)}
                              className="text-zinc-400 hover:text-green-400 flex items-center space-x-1 text-sm transition-colors"
                            >
                              <ThumbsUp className="w-4 h-4" />
                              <span>Helpful ({review.helpful})</span>
                            </button>
                            <button 
                              onClick={() => markReviewHelpful(review.id, false)}
                              className="text-zinc-400 hover:text-red-400 flex items-center space-x-1 text-sm transition-colors"
                            >
                              <ThumbsDown className="w-4 h-4" />
                              <span>Not Helpful ({review.notHelpful})</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-zinc-800/30 rounded-lg p-12 text-center">
                      <Star className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                      <h4 className="text-xl font-bold text-white mb-2">No Reviews Yet</h4>
                      <p className="text-zinc-400 mb-6">Be the first to review this product!</p>
                      {canReview && !showReviewForm && (
                        <button
                          onClick={() => setShowReviewForm(true)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-3 rounded-lg font-medium transition-colors"
                        >
                          Write First Review
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'chat' && (
                <div className="bg-zinc-800/30 rounded-lg h-[600px] flex flex-col">
                  {/* Chat Header */}
                  <div className="p-4 border-b border-zinc-700">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                        <MessageCircle className="w-5 h-5 text-yellow-400" />
                        <span>Product Discussion</span>
                      </h3>
                      <div className="flex items-center space-x-2 text-green-400 text-sm">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span>Live Chat</span>
                      </div>
                    </div>
                  </div>

                  {/* Chat Messages */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3" id="chatMessages">
                    {chatLoading && liveMessages.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <div className="text-zinc-400">Loading messages...</div>
                      </div>
                    ) : liveMessages.length > 0 ? (
                      liveMessages.map((msg) => (
                        <div key={msg.id} className="group flex items-start space-x-3 animate-fade-in hover:bg-zinc-800/30 -mx-2 px-2 py-2 rounded-lg transition-colors">
                          <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center flex-shrink-0 text-black font-bold">
                            {msg.userName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center space-x-2">
                                <span className="text-white font-medium text-sm">{msg.userName}</span>
                                <span className="text-zinc-400 text-xs">
                                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {msg.moderated && (
                                  <span className="text-xs text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded" title="Message was moderated for content">
                                    Moderated
                                  </span>
                                )}
                              </div>
                              {isAuthenticated && user && msg.userId !== user.id && (
                                <button
                                  onClick={() => handleReportMessage(msg)}
                                  className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition-all p-1 rounded hover:bg-red-400/10"
                                  title="Report message"
                                >
                                  <Flag className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                            <p className="text-zinc-300 text-sm break-words">{msg.message}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <MessageCircle className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                        <h4 className="text-lg font-bold text-white mb-2">No messages yet</h4>
                        <p className="text-zinc-400">Be the first to start the conversation!</p>
                      </div>
                    )}
                  </div>

                  {/* Chat Input */}
                  <div className="p-4 border-t border-zinc-700">
                    {isAuthenticated ? (
                      // Check if user has access based on product stage
                      (() => {
                        const canAccessChat = 
                          (product.stage === 'voting' && hasVoted) || 
                          (product.stage === 'community-drops' && hasPledged) ||
                          product.stage === 'coming-soon'; // Coming soon is open to all
                        
                        if (canAccessChat) {
                          return (
                            <div className="space-y-2">
                              <div className="flex space-x-2">
                                <input
                                  type="text"
                                  value={chatMessage}
                                  onChange={(e) => setChatMessage(e.target.value)}
                                  onKeyPress={(e) => e.key === 'Enter' && !chatSubmitting && sendChatMessage()}
                                  placeholder="Type your message... (max 500 characters)"
                                  className="flex-1 p-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:border-yellow-400 focus:outline-none"
                                  maxLength={500}
                                  disabled={chatSubmitting}
                                />
                                <button 
                                  onClick={sendChatMessage}
                                  disabled={!chatMessage.trim() || chatSubmitting}
                                  className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-zinc-600 disabled:text-zinc-400 text-black px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
                                >
                                  {chatSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                  ) : (
                                    <>
                                      <span>Send</span>
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                      </svg>
                                    </>
                                  )}
                                </button>
                              </div>
                              <div className="flex justify-between items-center">
                                <p className="text-zinc-500 text-xs">
                                  Press Enter to send
                                </p>
                                <p className="text-zinc-500 text-xs">
                                  {chatMessage.length}/500
                                </p>
                              </div>
                            </div>
                          );
                        } else {
                          // User needs to vote or pledge to unlock chat
                          return (
                            <div className="bg-gradient-to-br from-zinc-800/80 to-zinc-700/80 border-2 border-yellow-500/30 rounded-lg p-6 text-center">
                              <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MessageCircle className="w-8 h-8 text-yellow-400" />
                              </div>
                              <h4 className="text-white font-bold text-lg mb-2">Chat Locked</h4>
                              <p className="text-zinc-300 mb-4">
                                {product.stage === 'voting' 
                                  ? "Vote for this product to unlock the community chat and help it move to the next stage!"
                                  : "Join this drop to unlock the community chat and connect with other supporters!"
                                }
                              </p>
                              <button
                                onClick={() => {
                                  if (product.stage === 'voting') {
                                    handleVote();
                                  } else if (product.stage === 'community-drops') {
                                    setShowPledgeModal(true);
                                  }
                                }}
                                disabled={product.stage === 'voting' && hasVoted}
                                className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-zinc-600 disabled:text-zinc-400 text-black px-6 py-3 rounded-lg font-bold transition-colors inline-flex items-center space-x-2"
                              >
                                <span>
                                  {product.stage === 'voting' 
                                    ? (hasVoted ? '✓ Already Voted' : 'Vote to Unlock Chat') 
                                    : 'Join Drop to Unlock'
                                  }
                                </span>
                              </button>
                              <p className="text-zinc-500 text-xs mt-3">
                                💡 Products with high engagement progress faster through stages
                              </p>
                            </div>
                          );
                        }
                      })()
                    ) : (
                      <div className="bg-zinc-700/50 rounded-lg p-6 text-center">
                        <MessageCircle className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
                        <p className="text-zinc-300 mb-3 font-medium">
                          Join the conversation
                        </p>
                        <p className="text-zinc-400 text-sm mb-4">
                          Login to participate in community discussions
                        </p>
                        <Link 
                          href="/login"
                          className="inline-block bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-2 rounded-lg font-medium transition-colors"
                        >
                          Login to Chat
                        </Link>
                      </div>
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

        {/* Report Message Modal */}
        {showReportModal && reportingMessage && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                    <Flag className="w-5 h-5 text-red-400" />
                    <span>Report Message</span>
                  </h3>
                  <button
                    onClick={() => {
                      setShowReportModal(false);
                      setReportingMessage(null);
                      setReportReason('spam');
                      setReportDescription('');
                    }}
                    className="text-zinc-400 hover:text-white text-2xl leading-none"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Reported Message Preview */}
                  <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center text-black font-bold text-xs">
                        {reportingMessage.userName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-white font-medium text-sm">{reportingMessage.userName}</span>
                    </div>
                    <p className="text-zinc-300 text-sm">{reportingMessage.message}</p>
                  </div>

                  {/* Report Reason */}
                  <div>
                    <label className="block text-zinc-400 text-sm mb-2 font-medium">Reason for Report *</label>
                    <select
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-full p-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:border-red-400 focus:outline-none"
                    >
                      <option value="spam">Spam or Advertising</option>
                      <option value="harassment">Harassment or Bullying</option>
                      <option value="hate_speech">Hate Speech</option>
                      <option value="inappropriate_content">Inappropriate Content</option>
                      <option value="scam">Scam or Fraud</option>
                      <option value="impersonation">Impersonation</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Additional Details */}
                  <div>
                    <label className="block text-zinc-400 text-sm mb-2 font-medium">Additional Details (Optional)</label>
                    <textarea
                      value={reportDescription}
                      onChange={(e) => setReportDescription(e.target.value)}
                      placeholder="Provide any additional context that might help us review this report..."
                      className="w-full p-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:border-red-400 focus:outline-none resize-none"
                      rows={3}
                      maxLength={500}
                    />
                    <div className="text-xs text-zinc-500 mt-1">{reportDescription.length}/500</div>
                  </div>

                  {/* Info Message */}
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                    <p className="text-blue-400 text-xs">
                      ℹ️ Reports are reviewed by our moderation team. False reports may result in account restrictions.
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setShowReportModal(false);
                        setReportingMessage(null);
                        setReportReason('spam');
                        setReportDescription('');
                      }}
                      disabled={reportSubmitting}
                      className="flex-1 py-3 bg-zinc-600 hover:bg-zinc-500 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={submitReport}
                      disabled={reportSubmitting}
                      className="flex-1 py-3 bg-red-500 hover:bg-red-600 disabled:bg-zinc-600 disabled:text-zinc-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                    >
                      {reportSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <Flag className="w-4 h-4" />
                          <span>Submit Report</span>
                        </>
                      )}
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
