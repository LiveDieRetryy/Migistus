import MainNavbar from "@/components/nav/MainNavbar";
import Head from "next/head";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { Heart, ExternalLink, ShoppingCart, Trash2, Sparkles, Grid3x3, Layout } from "lucide-react";

interface WishlistItem {
  id: number;
  userId: number;
  productId: number;
  productName: string;
  productImage?: string;
  productPrice?: number;
  productSlug?: string;
  productCategory?: string;
  addedAt: string;
}

export default function WishlistPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'masonry' | 'grid'>('masonry');

  // Account navigation items
  const getProfileSlug = () => {
    if (!user?.username) return "/account/profile";
    return `/account/profile/${user.username.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")}`;
  };

  const accountNav = [
    { label: "Account Overview", href: "/account", icon: "🏠" },
    { label: "Notifications", href: "/notifications", icon: "🔔" },
    { label: "My Current Pledges", href: "/account/pledges", icon: "🤝" },
    { label: "My Orders", href: "/account/orders", icon: "📦" },
    { label: "My Wishlist", href: "/account/wishlist", icon: "❤️" },
    { label: "My Votes", href: "/account/votes", icon: "🗳️" },
    { label: "Wallet", href: "/wallet", icon: "💰" },
    { label: "View Profile", href: getProfileSlug(), icon: "👤" },
    { label: "Account Settings", href: "/account/settings", icon: "⚙️" },
  ];

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (user && isAuthenticated) {
      loadWishlist();
    }
  }, [user, isAuthenticated]);

  const loadWishlist = async () => {
    try {
      const response = await fetch('/api/account/wishlist', {
        credentials: 'include' // Send cookies with request
      });
      
      if (response.status === 401) {
        router.push('/');
        return;
      }
      
      const result = await response.json();
      
      if (result.success && Array.isArray(result.data)) {
        setWishlist(result.data);
      }
    } catch (error) {
      console.error('Failed to load wishlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromWishlist = async (itemId: number) => {
    try {
      const response = await fetch(`/api/account/wishlist?itemId=${itemId}`, {
        method: 'DELETE',
        credentials: 'include' // Send cookies with request
      });

      const result = await response.json();
      
      if (result.success) {
        setWishlist(wishlist.filter(item => item.id !== itemId));
      } else {
        alert(result.error || 'Failed to remove item');
      }
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
      alert('An error occurred');
    }
  };

  if (loading || !isAuthenticated) {
    return null;
  }

  return (
    <>
      <Head>
        <title>My Wishlist - MIGISTUS</title>
        <meta name="description" content="Your MIGISTUS wishlist - Save products you love" />
      </Head>
      <MainNavbar />
      
      {/* Pinterest-Style Wishlist Board */}
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white">
        <div className="flex flex-col lg:flex-row max-w-7xl mx-auto px-4 py-12 gap-8">
          
          {/* Back Link - Mobile */}
          <div className="lg:hidden mb-4">
            <Link href="/account" className="text-yellow-400 hover:text-yellow-300">
              ← Back to Account
            </Link>
          </div>

          {/* Sidebar */}
          <aside className="lg:w-80">
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-yellow-500/20 rounded-2xl p-6 sticky top-8">
              <div className="hidden lg:block mb-6">
                <Link href="/account" className="text-yellow-400 hover:text-yellow-300">
                  ← Back to Account
                </Link>
              </div>
              
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center text-2xl">
                  👤
                </div>
                <div>
                  <h2 className="text-xl font-bold text-yellow-400">
                    Account Menu
                  </h2>
                  <p className="text-sm text-gray-400">{user?.username}</p>
                </div>
              </div>
              
              <ul className="space-y-2">
                {accountNav.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        router.pathname === item.href
                          ? "bg-yellow-400 text-black font-semibold"
                          : "text-yellow-300 hover:bg-yellow-400/10 hover:text-yellow-400"
                      }`}
                    >
                      <span className="text-lg">{item.icon}</span>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
          
          {/* Header Section */}
          <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-yellow-400 mb-2">
                My Wishlist
              </h1>
              <p className="text-gray-400">
                {wishlist.length} {wishlist.length === 1 ? 'product' : 'products'} saved for later
              </p>
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 bg-zinc-900/50 border border-zinc-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('masonry')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                  viewMode === 'masonry' 
                    ? 'bg-yellow-400 text-black' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Layout className="w-4 h-4" />
                <span className="hidden sm:inline">Masonry</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                  viewMode === 'grid' 
                    ? 'bg-yellow-400 text-black' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Grid3x3 className="w-4 h-4" />
                <span className="hidden sm:inline">Grid</span>
              </button>
            </div>
          </div>
          
          {/* Loading State */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full mb-4"></div>
              <p className="text-zinc-400 text-lg">Loading your wishlist...</p>
            </div>
            
          ) : wishlist.length === 0 ? (
            
            /* Empty State */
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-yellow-500/20 rounded-2xl p-12 text-center">
              <Heart className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
              <h2 className="text-2xl font-bold text-white mb-3">Your wishlist is empty</h2>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                Start adding products you love! Browse our curated collection and save items to view later.
              </p>
              <div className="flex gap-4 justify-center">
                <Link
                  href="/voting"
                  className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-6 py-3 rounded-lg transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  Discover Products
                </Link>
                <Link
                  href="/community-drops"
                  className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-bold px-6 py-3 rounded-lg transition-all"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Live Drops
                </Link>
              </div>
            </div>
            
          ) : (
            
            /* Pinterest-Style Masonry Grid */
            <div className={
              viewMode === 'masonry'
                ? 'columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4'
                : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
            }>
              {wishlist.map((item) => (
                <div
                  key={item.id}
                className={`group relative bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden hover:border-yellow-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-yellow-500/20 ${
                    viewMode === 'masonry' ? 'break-inside-avoid mb-4' : ''
                  }`}
                >
                  {/* Product Image */}
                  <div className="relative aspect-[3/4] overflow-hidden bg-zinc-800">
                    {item.productImage ? (
                      <Image
                        src={item.productImage}
                        alt={item.productName}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Sparkles className="w-16 h-16 text-zinc-700" />
                      </div>
                    )}
                    
                    {/* Overlay Actions */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                      <div className="flex gap-2">
                        <Link
                          href={`/products/${item.productSlug || item.productId}`}
                          className="flex-1 flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black font-semibold px-4 py-2 rounded-lg transition-all text-sm"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View
                        </Link>
                        <button
                          onClick={() => removeFromWishlist(item.id)}
                          className="flex items-center justify-center bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-lg transition-all"
                          title="Remove from wishlist"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Category Badge */}
                    {item.productCategory && (
                      <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-yellow-300 border border-yellow-500/30">
                        {item.productCategory}
                      </div>
                    )}
                  </div>
                  
                  {/* Product Info */}
                  <div className="p-4">
                    <h3 className="font-bold text-white mb-2 line-clamp-2 group-hover:text-yellow-400 transition-colors">
                      {item.productName}
                    </h3>
                    
                    <div className="flex items-center justify-between">
                      {item.productPrice && (
                        <p className="text-lg font-bold text-yellow-400">
                          ${item.productPrice.toFixed(2)}
                        </p>
                      )}
                      <p className="text-xs text-zinc-500">
                        {new Date(item.addedAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          </main>
        </div>
      </div>
    </>
  );
}
