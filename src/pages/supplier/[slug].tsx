import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { getSupplierAvatar } from '../../lib/utils';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Package,
  Users,
  TrendingUp,
  Heart,
  Share2,
  Star,
  Award,
  ShoppingBag,
  Eye,
  MessageCircle,
  ExternalLink,
  Instagram,
  Twitter,
  Facebook,
  Linkedin,
  Youtube,
  Globe,
  Phone,
  Shield
} from 'lucide-react';

interface Product {
  id: number;
  name: string;
  category: string;
  votes?: number;
  pledges?: number;
  supplier?: {
    name: string;
  };
  socialMetrics?: {
    likes?: number;
    shares?: number;
    comments?: number;
  };
}

interface Activity {
  likes?: number;
  shares?: number;
  type?: string;
  date?: string;
}

interface SupplierProfile {
  id: string;
  slug: string;
  name: string;
  companyName: string;
  logo: string;
  bannerImage?: string;
  description: string;
  shortBio: string;
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
    displayLocation: string;
  };
  contactInfo: {
    email: string;
    phone: string;
    website: string;
  };
  socialMedia: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
  };
  businessInfo: {
    yearEstablished: number;
    businessType: string;
    specialties: string[];
    certifications: string[];
  };
  stats: {
    followers: number;
    totalProducts: number;
    totalSales: number;
    avgRating: number;
    reviewCount: number;
    responseTime: string;
  };
  socialMetrics: {
    posts: number;
    likes: number;
    shares: number;
    engagement: number;
  };
  recentActivity: Array<{
    id: string;
    type: 'product' | 'announcement' | 'milestone' | 'promotion';
    title: string;
    description: string;
    timestamp: string;
    image?: string;
    likes: number;
    comments: number;
    shares: number;
  }>;
  featuredProducts: Array<{
    id: string;
    name: string;
    image: string;
    price: number;
    originalPrice?: number;
    votes: number;
    pledges: number;
    stage: string;
  }>;
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    dateEarned: string;
  }>;
  verified: boolean;
  memberSince: string;
  lastActive: string;
}

export default function SupplierProfilePage() {
  const router = useRouter();
  const { slug } = router.query;
  const [supplier, setSupplier] = useState<SupplierProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'activity' | 'about'>('overview');  const [isFollowing, setIsFollowing] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  const loadSupplierProfile = useCallback(async (supplierSlug: string) => {
    try {
      setLoading(true);
      
      // Load supplier profile from localStorage first
      let supplierData: SupplierProfile | null = null;
      
      // Check all stored supplier profiles
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('supplierProfile_')) {
          const profile = JSON.parse(localStorage.getItem(key) || '{}');
          const profileSlug = (profile.name || '').toLowerCase().replace(/\s+/g, '-');
          
          if (profileSlug === supplierSlug || profile.id === supplierSlug) {
            // Load real products data for this supplier
            const productsRes = await fetch('/data/products.json');
            const allProducts = await productsRes.json();
            const supplierProducts = allProducts.filter((p: any) => 
              p.supplier?.name === profile.name || 
              p.supplierName === profile.name ||
              (p.supplier?.name || '').toLowerCase().replace(/\s+/g, '-') === supplierSlug
            );
            
            // Calculate live stats from real product data
            const stats = supplierProducts.reduce((acc: any, product: any) => {
              acc.totalViews += product.views || 0;
              acc.totalVotes += product.votes || 0;
              acc.totalPledges += product.pledges || 0;
              acc.totalRevenue += (product.pledges || 0) * (product.price || 0);
              acc.totalReviews += product.reviews?.length || 0;
              
              if (product.reviews && product.reviews.length > 0) {
                const avgProductRating = product.reviews.reduce((sum: number, review: any) => sum + (review.rating || 0), 0) / product.reviews.length;
                acc.ratingSum += avgProductRating;
                acc.ratedProducts += 1;
              }
              
              return acc;
            }, {
              totalViews: 0,
              totalVotes: 0,
              totalPledges: 0,
              totalRevenue: 0,
              totalReviews: 0,
              ratingSum: 0,
              ratedProducts: 0
            });
            
            // Calculate conversion rate and average rating
            const conversionRate = stats.totalViews > 0 ? (stats.totalPledges / stats.totalViews) * 100 : 0;
            const avgRating = stats.ratedProducts > 0 ? stats.ratingSum / stats.ratedProducts : 0;
            
            // Load followers data from localStorage
            const followersData = JSON.parse(localStorage.getItem(`supplier_followers_${profile.id}`) || '[]');
            
            // Generate recent activity from real product data
            const recentActivity = supplierProducts
              .filter((p: any) => p.createdAt || p.updatedAt || p.status)
              .sort((a: any, b: any) => new Date(b.createdAt || b.updatedAt || Date.now()).getTime() - new Date(a.createdAt || a.updatedAt || Date.now()).getTime())
              .slice(0, 5)
              .map((product: any) => ({
                id: product.id.toString(),
                type: product.status === 'pending-review' ? 'announcement' : 'product',
                title: `${product.status === 'pending-review' ? 'Submitted for review' : 'Product'}: ${product.name}`,
                description: product.description?.slice(0, 100) + "..." || 'New product available',
                timestamp: formatTimeAgo(product.createdAt || product.updatedAt || new Date().toISOString()),
                image: product.images?.[0] || product.image || '/images/product-placeholder.jpg',
                likes: Math.floor(Math.random() * 50) + 10,
                comments: Math.floor(Math.random() * 20) + 2,
                shares: Math.floor(Math.random() * 10) + 1
              }));
            
            // Create featured products from top-performing real products
            const featuredProducts = supplierProducts
              .sort((a: any, b: any) => (b.votes || 0) - (a.votes || 0))
              .slice(0, 6)
              .map((product: any) => ({
                id: product.id.toString(),
                name: product.name,
                image: product.images?.[0] || product.image || '/images/product-placeholder.jpg',
                price: product.price || 0,
                originalPrice: product.originalPrice || product.price,
                votes: product.votes || 0,
                pledges: product.pledges || 0,
                stage: product.stage || 'active'
              }));
            
            supplierData = {
              id: profile.id || key.replace('supplierProfile_', ''),
              slug: profileSlug,
              name: profile.name || profile.businessInfo?.businessName || "Unknown Supplier",
              companyName: profile.businessInfo?.businessName || profile.name || "Unknown Company",
              logo: profile.logo || '/Icons/SupplierPlaceHolder.png',
              bannerImage: profile.bannerImage || '/images/supplier-banner-placeholder.jpg',
              description: profile.description || "No description available",
              shortBio: profile.description?.slice(0, 120) + "..." || "Supplier profile",
              location: {
                address: profile.location?.address || '',
                city: profile.location?.city || 'Unknown',
                state: profile.location?.state || 'Unknown',
                country: profile.location?.country || 'Unknown',
                displayLocation: profile.location ? `${profile.location.city}, ${profile.location.state}` : 'Location not specified'
              },
              contactInfo: {
                email: profile.contactInfo?.primaryEmail || profile.email || '',
                phone: profile.contactInfo?.primaryPhone || profile.phone || '',
                website: profile.website || ''
              },
              socialMedia: {
                twitter: profile.socialMedia?.twitter || '',
                linkedin: profile.socialMedia?.linkedin || '',
                instagram: profile.socialMedia?.instagram || '',
                facebook: profile.socialMedia?.facebook || '',
                youtube: profile.socialMedia?.youtube || ''
              },
              businessInfo: {
                yearEstablished: profile.businessInfo?.yearEstablished || new Date().getFullYear(),
                businessType: profile.businessInfo?.businessType || 'Supplier',
                specialties: profile.specialties || [],
                certifications: profile.certifications || []
              },
              stats: {
                followers: followersData.length,
                totalProducts: supplierProducts.length,
                totalSales: stats.totalPledges,
                avgRating: avgRating,
                reviewCount: stats.totalReviews,
                responseTime: '< 24 hours'
              },              socialMetrics: {
                posts: recentActivity.length,
                likes: recentActivity.reduce((sum: number, activity: any) => sum + (activity.likes || 0), 0),
                shares: recentActivity.reduce((sum: number, activity: any) => sum + (activity.shares || 0), 0),
                engagement: Math.round(conversionRate)
              },
              recentActivity: recentActivity,
              featuredProducts: featuredProducts,
              achievements: [
                {
                  id: '1',
                  title: 'Active Supplier',
                  description: `${supplierProducts.length} products submitted to MIGISTUS`,
                  icon: '📦',
                  dateEarned: 'Current'
                },
                ...(stats.totalPledges > 100 ? [{
                  id: '2',
                  title: 'Popular Supplier',
                  description: `${stats.totalPledges} total pledges received`,
                  icon: '⭐',
                  dateEarned: 'Current'
                }] : []),
                ...(avgRating >= 4.0 ? [{
                  id: '3',
                  title: 'Highly Rated',
                  description: `${avgRating.toFixed(1)} average rating`,
                  icon: '🏆',
                  dateEarned: 'Current'
                }] : [])
              ],
              verified: true,
              memberSince: profile.joinedDate || '2024-01-01',
              lastActive: 'Recently'
            };
            break;
          }
        }
      }
      
      // If no supplier found in localStorage, try to match with product data
      if (!supplierData) {
        const productsRes = await fetch('/data/products.json');
        const allProducts = await productsRes.json();
        const supplierProducts = allProducts.filter((p: any) => 
          (p.supplier?.name || '').toLowerCase().replace(/\s+/g, '-') === supplierSlug
        );
        
        if (supplierProducts.length > 0) {
          const supplierName = supplierProducts[0].supplier?.name || supplierSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          
          // Calculate stats for found products
          const stats = supplierProducts.reduce((acc: any, product: any) => {
            acc.totalViews += product.views || 0;
            acc.totalVotes += product.votes || 0;
            acc.totalPledges += product.pledges || 0;
            acc.totalReviews += product.reviews?.length || 0;
            
            if (product.reviews && product.reviews.length > 0) {
              const avgProductRating = product.reviews.reduce((sum: number, review: any) => sum + (review.rating || 0), 0) / product.reviews.length;
              acc.ratingSum += avgProductRating;
              acc.ratedProducts += 1;
            }
            
            return acc;
          }, {
            totalViews: 0,
            totalVotes: 0,
            totalPledges: 0,
            totalReviews: 0,
            ratingSum: 0,
            ratedProducts: 0
          });
          
          const avgRating = stats.ratedProducts > 0 ? stats.ratingSum / stats.ratedProducts : 0;
          
          supplierData = {
            id: supplierSlug,
            slug: supplierSlug,
            name: supplierName,
            companyName: supplierName,
            logo: '/Icons/SupplierPlaceHolder.png',
            description: `Supplier of high-quality products including ${supplierProducts.map((p: any) => p.name).slice(0, 3).join(', ')}.`,
            shortBio: 'Product supplier on MIGISTUS platform.',
            location: {
              address: '',
              city: supplierProducts[0]?.supplier?.location?.split(',')[0] || 'Unknown',
              state: supplierProducts[0]?.supplier?.location?.split(',')[1]?.trim() || 'Unknown',
              country: 'USA',
              displayLocation: supplierProducts[0]?.supplier?.location || 'Location not specified'
            },
            contactInfo: {
              email: '',
              phone: '',
              website: ''
            },
            socialMedia: {},
            businessInfo: {
              yearEstablished: 2020,
              businessType: 'Product Supplier',
              specialties: Array.from(new Set(supplierProducts.map((p: any) => p.category))),
              certifications: []
            },
            stats: {
              followers: 0,
              totalProducts: supplierProducts.length,
              totalSales: stats.totalPledges,
              avgRating: avgRating,
              reviewCount: stats.totalReviews,
              responseTime: 'Unknown'
            },
            socialMetrics: {
              posts: supplierProducts.length,
              likes: stats.totalVotes,
              shares: Math.floor(stats.totalVotes * 0.3),
              engagement: stats.totalViews > 0 ? Math.round((stats.totalPledges / stats.totalViews) * 100) : 0
            },
            recentActivity: supplierProducts.slice(0, 3).map((product: any, index: number) => ({
              id: product.id.toString(),
              type: 'product' as const,
              title: `Product: ${product.name}`,
              description: product.description?.slice(0, 100) + "..." || 'Product available on MIGISTUS',
              timestamp: formatTimeAgo(new Date(Date.now() - (index * 24 * 60 * 60 * 1000)).toISOString()),
              image: product.images?.[0] || product.image || '/images/product-placeholder.jpg',
              likes: product.votes || 0,
              comments: Math.floor((product.votes || 0) * 0.2),
              shares: Math.floor((product.votes || 0) * 0.1)
            })),
            featuredProducts: supplierProducts.slice(0, 6).map((product: any) => ({
              id: product.id.toString(),
              name: product.name,
              image: product.images?.[0] || product.image || '/images/product-placeholder.jpg',
              price: product.price || 0,
              originalPrice: product.originalPrice || product.price,
              votes: product.votes || 0,
              pledges: product.pledges || 0,
              stage: product.stage || 'active'
            })),
            achievements: [
              {
                id: '1',
                title: 'MIGISTUS Supplier',
                description: `${supplierProducts.length} products on platform`,
                icon: '📦',
                dateEarned: 'Current'
              }
            ],
            verified: false,
            memberSince: '2024-01-01',
            lastActive: 'Unknown'
          };
        } else {
          // Create placeholder supplier
          supplierData = {
            id: supplierSlug,
            slug: supplierSlug,
            name: supplierSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            companyName: supplierSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            logo: '/Icons/SupplierPlaceHolder.png', 
            description: 'Supplier profile not found in our records.',
            shortBio: 'Supplier profile placeholder.',
            location: {
              address: '',
              city: 'Unknown',
              state: 'Unknown',
              country: 'Unknown',
              displayLocation: 'Location not specified'
            },
            contactInfo: {
              email: '',
              phone: '',
              website: ''
            },
            socialMedia: {},
            businessInfo: {
              yearEstablished: 2024,
              businessType: 'Supplier',
              specialties: [],
              certifications: []
            },
            stats: {
              followers: 0,
              totalProducts: 0,
              totalSales: 0,
              avgRating: 0,
              reviewCount: 0,
              responseTime: 'Unknown'
            },
            socialMetrics: {
              posts: 0,
              likes: 0,
              shares: 0,
              engagement: 0
            },
            recentActivity: [],
            featuredProducts: [],
            achievements: [],
            verified: false,
            memberSince: '2024-01-01',
            lastActive: 'Unknown'
          };
        }
      }
      
      setSupplier(supplierData);
    } catch (error) {
      console.error('Error loading supplier profile:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (slug) {
      loadSupplierProfile(slug as string);
      checkFollowStatus();
      loadUserProfile();
      checkIfOwnProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const checkIfOwnProfile = () => {
    if (typeof window !== 'undefined') {
      const isSupplier = localStorage.getItem('isSupplier') === 'true';
      const supplierName = localStorage.getItem('supplierName');
      
      if (isSupplier && supplierName) {
        const supplierSlug = supplierName.toLowerCase().replace(/\s+/g, '-');
        setIsOwnProfile(supplierSlug === slug);
      }
    }
  };

  // Helper function to format time ago
  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return time.toLocaleDateString();
  };

  const checkFollowStatus = () => {
    // Check if user is following this supplier
    if (typeof window !== 'undefined') {
      const userId = localStorage.getItem('userId');
      const followedSuppliers = JSON.parse(localStorage.getItem(`followedSuppliers_${userId}`) || '[]');
      setIsFollowing(followedSuppliers.includes(slug));
    }
  };

  const loadUserProfile = () => {
    if (typeof window !== 'undefined') {
      const profile = {
        id: localStorage.getItem('userId') || 'guest',
        name: localStorage.getItem('userName') || 'Guest User',
        isLoggedIn: localStorage.getItem('isLoggedIn') === 'true'
      };
      setUserProfile(profile);
    }
  };

  const handleFollow = async () => {
    if (!userProfile?.isLoggedIn) {
      router.push('/login');
      return;
    }

    try {
      const userId = userProfile.id;
      const followedSuppliers = JSON.parse(localStorage.getItem(`followedSuppliers_${userId}`) || '[]');
      
      if (isFollowing) {
        // Unfollow
        const updated = followedSuppliers.filter((id: string) => id !== slug);
        localStorage.setItem(`followedSuppliers_${userId}`, JSON.stringify(updated));
        setIsFollowing(false);
        if (supplier) {
          setSupplier({
            ...supplier,
            stats: {
              ...supplier.stats,
              followers: supplier.stats.followers - 1
            }
          });
        }
      } else {
        // Follow
        followedSuppliers.push(slug);
        localStorage.setItem(`followedSuppliers_${userId}`, JSON.stringify(followedSuppliers));
        setIsFollowing(true);
        if (supplier) {
          setSupplier({
            ...supplier,
            stats: {
              ...supplier.stats,
              followers: supplier.stats.followers + 1
            }
          });
        }
      }
    } catch (error) {
      console.error('Error updating follow status:', error);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${supplier?.name} - MIGISTUS Supplier`,
        text: supplier?.shortBio,
        url: window.location.href,
      });
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Profile link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black flex items-center justify-center">
        <div className="text-yellow-400 text-xl">Loading supplier profile...</div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl text-white mb-4">Supplier Not Found</h1>
          <Link href="/suppliers" className="text-yellow-400 hover:text-yellow-300">
            ← Back to Suppliers
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'products', name: 'Products', icon: '📦' },
    { id: 'activity', name: 'Activity', icon: '🔔' },
    { id: 'about', name: 'About', icon: 'ℹ️' },
  ];

  return (
    <>
      <Head>
        <title>{supplier.name} - Supplier Profile | MIGISTUS</title>
        <meta name="description" content={supplier.description} />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black">
        {/* Profile Header */}
        <div className="relative">
          {/* Banner Image - Taller */}
          <div className="h-80 relative overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-black">
            {supplier.bannerImage ? (
              <>
                <img
                  src={supplier.bannerImage}
                  alt={`${supplier.name} banner`}
                  className="object-cover w-full h-full"
                />
                <div className="absolute inset-0 bg-black/30" />
              </>
            ) : (
              // Default placeholder gradient banner with MIGISTUS theme
              <>
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-black"></div>
                
                {/* Gold accent gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-yellow-400/10 to-yellow-500/5"></div>
                
                {/* Banner Text */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 tracking-widest opacity-30">
                      MIGISTUS
                    </h1>
                    <p className="text-2xl md:text-3xl font-semibold text-yellow-400/20 tracking-wider mt-2">
                      SUPPLIER
                    </p>
                  </div>
                </div>
                
                {/* Diagonal stripe pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `repeating-linear-gradient(
                      45deg,
                      transparent,
                      transparent 35px,
                      rgba(234, 179, 8, 0.1) 35px,
                      rgba(234, 179, 8, 0.1) 70px
                    )`
                  }}></div>
                </div>
              </>
            )}
            
            {/* Back Button - Top Left */}
            <div className="absolute top-6 left-6 z-10">
              {isOwnProfile ? (
                <Link href="/supplier-dashboard" className="flex items-center gap-2 px-4 py-2 bg-black/50 backdrop-blur-sm border border-yellow-500/30 rounded-full text-yellow-400 hover:text-yellow-300 transition">
                  <ArrowLeft className="w-4 h-4" />
                  <span className="font-semibold">Dashboard</span>
                </Link>
              ) : (
                <Link href="/community?tab=suppliers" className="flex items-center gap-2 px-4 py-2 bg-black/50 backdrop-blur-sm border border-yellow-500/30 rounded-full text-yellow-400 hover:text-yellow-300 transition">
                  <ArrowLeft className="w-4 h-4" />
                  <span className="font-semibold">Back</span>
                </Link>
              )}
            </div>
            
            {/* Verified badge - Top Right */}
            <div className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 bg-black/50 backdrop-blur-sm border border-yellow-500/30 rounded-full z-10">
              <Shield className="w-5 h-5 text-yellow-400" />
              <span className="text-white font-semibold">VERIFIED SUPPLIER</span>
            </div>
          </div>

          {/* Profile Info Overlay - Positioned Below Banner */}
          <div className="relative px-4 sm:px-6 lg:px-8 -mt-16">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 relative z-10">
                {/* Avatar with glow effect */}
                <div className="flex-shrink-0">
                  <div className="w-36 h-36 rounded-2xl overflow-hidden border-4 border-zinc-900 bg-zinc-800 shadow-2xl ring-4 ring-yellow-500/20">
                    <img
                      src={getSupplierAvatar(supplier.logo)}
                      alt={`${supplier.name} logo`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Basic Info - Modern Layout */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div className="bg-zinc-900/60 backdrop-blur-md rounded-xl p-6 flex-1 border border-zinc-800">
                      <div className="flex items-center gap-3 mb-3">
                        <h1 className="text-4xl font-bold text-white">{supplier.name}</h1>
                        {supplier.verified && (
                          <div className="flex items-center gap-1 px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-full">
                            <Award className="w-4 h-4 text-yellow-400" />
                            <span className="text-xs font-semibold text-yellow-400">VERIFIED</span>
                          </div>
                        )}
                      </div>
                      <p className="text-zinc-300 text-lg mb-4">{supplier.shortBio}</p>
                      <div className="flex flex-wrap items-center gap-6 text-sm text-zinc-400">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-yellow-400" />
                          <span>{supplier.location.displayLocation}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-yellow-400" />
                          <span>Joined {supplier.memberSince}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-green-400">{supplier.lastActive}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons - Modern Style */}
                    <div className="flex items-center gap-3">
                      {!isOwnProfile && (
                        <>
                          <button
                            onClick={handleFollow}
                            className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg ${
                              isFollowing
                                ? 'bg-zinc-800 hover:bg-zinc-700 text-white border-2 border-zinc-700'
                                : 'bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black shadow-yellow-500/50'
                            }`}
                          >
                            <Users className="w-5 h-5" />
                            {isFollowing ? 'Following' : 'Follow'}
                          </button>
                          <button className="px-4 py-3 bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 text-white rounded-xl transition-all duration-300 shadow-lg">
                            <MessageCircle className="w-5 h-5" />
                          </button>
                        </>
                      )}
                      {isOwnProfile && (
                        <div className="px-6 py-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                          <span className="text-yellow-400 font-medium">Your Profile</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Row - Modern Cards with Hover Effects */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-8 mb-8">
                <div className="group bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-xl p-6 text-center hover:border-yellow-500/50 transition-all duration-300 cursor-pointer hover:scale-105">
                  <div className="flex items-center justify-center mb-2">
                    <Users className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div className="text-3xl font-bold text-yellow-400 mb-1">{supplier.stats.followers.toLocaleString()}</div>
                  <div className="text-xs text-zinc-400 font-medium">Followers</div>
                </div>
                <div className="group bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-xl p-6 text-center hover:border-yellow-500/50 transition-all duration-300 cursor-pointer hover:scale-105">
                  <div className="flex items-center justify-center mb-2">
                    <Package className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div className="text-3xl font-bold text-yellow-400 mb-1">{supplier.stats.totalProducts}</div>
                  <div className="text-xs text-zinc-400 font-medium">Products</div>
                </div>
                <div className="group bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-xl p-6 text-center hover:border-yellow-500/50 transition-all duration-300 cursor-pointer hover:scale-105">
                  <div className="flex items-center justify-center mb-2">
                    <Star className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div className="text-3xl font-bold text-yellow-400 mb-1">{supplier.stats.avgRating.toFixed(1)}</div>
                  <div className="text-xs text-zinc-400 font-medium">Rating</div>
                </div>
                <div className="group bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-xl p-6 text-center hover:border-yellow-500/50 transition-all duration-300 cursor-pointer hover:scale-105">
                  <div className="flex items-center justify-center mb-2">
                    <ShoppingBag className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div className="text-3xl font-bold text-yellow-400 mb-1">{supplier.stats.totalSales.toLocaleString()}</div>
                  <div className="text-xs text-zinc-400 font-medium">Sales</div>
                </div>
                <div className="group bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-xl p-6 text-center hover:border-yellow-500/50 transition-all duration-300 cursor-pointer hover:scale-105">
                  <div className="flex items-center justify-center mb-2">
                    <Heart className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div className="text-3xl font-bold text-yellow-400 mb-1">{supplier.socialMetrics.posts}</div>
                  <div className="text-xs text-zinc-400 font-medium">Posts</div>
                </div>
                <div className="group bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-xl p-6 text-center hover:border-yellow-500/50 transition-all duration-300 cursor-pointer hover:scale-105">
                  <div className="flex items-center justify-center mb-2">
                    <TrendingUp className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div className="text-3xl font-bold text-yellow-400 mb-1">{supplier.socialMetrics.engagement}%</div>
                  <div className="text-xs text-zinc-400 font-medium">Engagement</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation - Modern Style */}
        <div className="sticky top-0 z-30 bg-zinc-950/95 backdrop-blur-lg border-b border-zinc-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-6 font-semibold text-sm transition-all duration-300 relative ${
                    activeTab === tab.id
                      ? 'text-yellow-400'
                      : 'text-zinc-400 hover:text-zinc-300'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{tab.icon}</span>
                    <span>{tab.name}</span>
                  </span>
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-yellow-400 to-yellow-500"></div>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Recent Activity */}
                <div className="bg-zinc-800/30 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-white mb-6">Recent Activity</h3>
                  <div className="space-y-6">
                    {supplier.recentActivity.map((activity) => (
                      <div key={activity.id} className="border-b border-zinc-700 last:border-b-0 pb-6 last:pb-0">
                        <div className="flex gap-4">
                          {activity.image && (
                            <div className="w-16 h-16 bg-zinc-700 rounded-lg overflow-hidden flex-shrink-0">
                              <img src={activity.image} alt="" className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="flex-1">
                            <h4 className="font-medium text-white mb-2">{activity.title}</h4>
                            <p className="text-zinc-400 mb-3">{activity.description}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-zinc-500">{activity.timestamp}</span>
                              <div className="flex items-center gap-4 text-sm text-zinc-400">
                                <div className="flex items-center gap-1">
                                  <Heart className="w-4 h-4" />
                                  {activity.likes}
                                </div>
                                <div className="flex items-center gap-1">
                                  <MessageCircle className="w-4 h-4" />
                                  {activity.comments}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Share2 className="w-4 h-4" />
                                  {activity.shares}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Featured Products */}
                <div className="bg-zinc-800/30 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-white mb-6">Featured Products</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {supplier.featuredProducts.map((product) => (
                      <div key={product.id} className="bg-zinc-800 rounded-lg p-4">
                        <div className="aspect-square bg-zinc-700 rounded-lg mb-4 overflow-hidden">
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                        <h4 className="font-medium text-white mb-2">{product.name}</h4>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-yellow-400">${product.price}</span>
                            {product.originalPrice && (
                              <span className="text-sm text-zinc-400 line-through">${product.originalPrice}</span>
                            )}
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            product.stage === 'active' ? 'bg-green-900 text-green-300' : 'bg-blue-900 text-blue-300'
                          }`}>
                            {product.stage}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-zinc-400">
                          <span>{product.votes} votes</span>
                          <span>{product.pledges} pledges</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Contact Info */}
                <div className="bg-zinc-800/30 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Contact Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-zinc-300">
                      <Globe className="w-4 h-4 text-zinc-400" />
                      <a href={`mailto:${supplier.contactInfo.email}`} className="hover:text-yellow-400 transition">
                        {supplier.contactInfo.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-3 text-zinc-300">
                      <Phone className="w-4 h-4 text-zinc-400" />
                      <span>{supplier.contactInfo.phone}</span>
                    </div>
                    <div className="flex items-center gap-3 text-zinc-300">
                      <Globe className="w-4 h-4 text-zinc-400" />
                      <a href={supplier.contactInfo.website} target="_blank" rel="noopener noreferrer" className="hover:text-yellow-400 transition">
                        {supplier.contactInfo.website}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Social Media */}
                <div className="bg-zinc-800/30 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Social Media</h3>
                  <div className="space-y-3">
                    {supplier.socialMedia.twitter && (
                      <div className="flex items-center gap-3 text-zinc-300">
                        <span className="text-blue-400">𝕏</span>
                        <a href={`https://twitter.com/${supplier.socialMedia.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-yellow-400 transition">
                          {supplier.socialMedia.twitter}
                        </a>
                      </div>
                    )}
                    {supplier.socialMedia.linkedin && (
                      <div className="flex items-center gap-3 text-zinc-300">
                        <span className="text-blue-600">in</span>
                        <a href={`https://linkedin.com/${supplier.socialMedia.linkedin}`} target="_blank" rel="noopener noreferrer" className="hover:text-yellow-400 transition">
                          LinkedIn
                        </a>
                      </div>
                    )}
                    {supplier.socialMedia.instagram && (
                      <div className="flex items-center gap-3 text-zinc-300">
                        <span className="text-pink-500">📷</span>
                        <a href={`https://instagram.com/${supplier.socialMedia.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-yellow-400 transition">
                          {supplier.socialMedia.instagram}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Achievements */}
                <div className="bg-zinc-800/30 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Achievements</h3>
                  <div className="space-y-4">
                    {supplier.achievements.map((achievement) => (
                      <div key={achievement.id} className="flex items-start gap-3">
                        <span className="text-2xl">{achievement.icon}</span>
                        <div>
                          <h4 className="font-medium text-white">{achievement.title}</h4>
                          <p className="text-sm text-zinc-400 mb-1">{achievement.description}</p>
                          <span className="text-xs text-zinc-500">{achievement.dateEarned}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <div className="bg-zinc-800/30 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-6">All Products</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {supplier.featuredProducts.map((product) => (
                  <div key={product.id} className="bg-zinc-800 rounded-lg p-4">
                    <div className="aspect-square bg-zinc-700 rounded-lg mb-4 overflow-hidden">
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                    <h4 className="font-medium text-white mb-2">{product.name}</h4>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-yellow-400">${product.price}</span>
                        {product.originalPrice && (
                          <span className="text-sm text-zinc-400 line-through">${product.originalPrice}</span>
                        )}
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        product.stage === 'active' ? 'bg-green-900 text-green-300' : 'bg-blue-900 text-blue-300'
                      }`}>
                        {product.stage}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-zinc-400">
                      <span>{product.votes} votes</span>
                      <span>{product.pledges} pledges</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="bg-zinc-800/30 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-6">Activity Feed</h3>
              <div className="space-y-6">
                {supplier.recentActivity.map((activity) => (
                  <div key={activity.id} className="border-b border-zinc-700 last:border-b-0 pb-6 last:pb-0">
                    <div className="flex gap-4">
                      {activity.image && (
                        <div className="w-20 h-20 bg-zinc-700 rounded-lg overflow-hidden flex-shrink-0">
                          <img src={activity.image} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            activity.type === 'product' ? 'bg-blue-900 text-blue-300' :
                            activity.type === 'milestone' ? 'bg-green-900 text-green-300' :
                            activity.type === 'announcement' ? 'bg-yellow-900 text-yellow-300' :
                            'bg-purple-900 text-purple-300'
                          }`}>
                            {activity.type}
                          </span>
                          <span className="text-sm text-zinc-500">{activity.timestamp}</span>
                        </div>
                        <h4 className="font-medium text-white mb-2">{activity.title}</h4>
                        <p className="text-zinc-400 mb-4">{activity.description}</p>
                        <div className="flex items-center gap-6 text-sm text-zinc-400">
                          <button className="flex items-center gap-1 hover:text-red-400 transition">
                            <Heart className="w-4 h-4" />
                            {activity.likes}
                          </button>
                          <button className="flex items-center gap-1 hover:text-blue-400 transition">
                            <MessageCircle className="w-4 h-4" />
                            {activity.comments}
                          </button>
                          <button className="flex items-center gap-1 hover:text-green-400 transition">
                            <Share2 className="w-4 h-4" />
                            {activity.shares}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                {/* Company Description */}
                <div className="bg-zinc-800/30 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">About Us</h3>
                  <p className="text-zinc-300 leading-relaxed">{supplier.description}</p>
                </div>

                {/* Business Information */}
                <div className="bg-zinc-800/30 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Business Information</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Company Name:</span>
                      <span className="text-white">{supplier.companyName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Business Type:</span>
                      <span className="text-white">{supplier.businessInfo.businessType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Established:</span>
                      <span className="text-white">{supplier.businessInfo.yearEstablished}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Location:</span>
                      <span className="text-white">{supplier.location.displayLocation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Response Time:</span>
                      <span className="text-white">{supplier.stats.responseTime}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {/* Specialties */}
                <div className="bg-zinc-800/30 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Specialties</h3>
                  <div className="flex flex-wrap gap-2">
                    {supplier.businessInfo.specialties.map((specialty, index) => (
                      <span key={index} className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm">
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Certifications */}
                <div className="bg-zinc-800/30 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Certifications</h3>
                  <div className="space-y-3">
                    {supplier.businessInfo.certifications.map((cert, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <Shield className="w-4 h-4 text-green-400" />
                        <span className="text-white">{cert}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Performance Stats */}
                <div className="bg-zinc-800/30 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Performance</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Average Rating:</span>
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-4 h-4 ${i < Math.floor(supplier.stats.avgRating) ? 'text-yellow-400 fill-current' : 'text-zinc-600'}`} 
                            />
                          ))}
                        </div>
                        <span className="text-white">{supplier.stats.avgRating.toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Total Reviews:</span>
                      <span className="text-white">{supplier.stats.reviewCount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Total Sales:</span>
                      <span className="text-white">{supplier.stats.totalSales.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Active Products:</span>
                      <span className="text-white">{supplier.stats.totalProducts}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
