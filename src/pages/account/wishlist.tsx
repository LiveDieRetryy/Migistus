import MainNavbar from "@/components/nav/MainNavbar";
import Head from "next/head";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";

interface WishlistItem {
  id: number;
  userId: number;
  productId: number;
  productName: string;
  productImage?: string;
  productPrice?: number;
  addedAt: string;
}

export default function WishlistPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      </Head>
      <MainNavbar />
      <div className="min-h-screen bg-black text-white flex flex-col items-center py-12 px-4">
        <div className="w-full max-w-4xl bg-zinc-900 border border-yellow-500/20 rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-yellow-400 mb-6">My Wishlist</h1>
          
          {isLoading ? (
            <div className="text-center text-gray-400 py-8">Loading wishlist...</div>
          ) : wishlist.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-4">Your wishlist is empty.</p>
              <Link
                href="/products"
                className="inline-block bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-6 py-3 rounded-lg transition-colors"
              >
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {wishlist.map((item) => (
                <div
                  key={item.id}
                  className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 hover:border-yellow-500/30 transition-colors"
                >
                  <div className="flex gap-4">
                    {item.productImage && (
                      <div className="w-24 h-24 relative flex-shrink-0 bg-zinc-700 rounded-lg overflow-hidden">
                        <Image
                          src={item.productImage}
                          alt={item.productName}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">{item.productName}</h3>
                      {item.productPrice && (
                        <p className="text-yellow-400 font-bold mb-2">
                          ${item.productPrice.toFixed(2)}
                        </p>
                      )}
                      <p className="text-sm text-gray-400 mb-3">
                        Added {new Date(item.addedAt).toLocaleDateString()}
                      </p>
                      <button
                        onClick={() => removeFromWishlist(item.id)}
                        className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                      >
                        Remove from Wishlist
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-8 text-center border-t border-zinc-700 pt-6">
            <p className="text-gray-400 mb-4">Total Items: {wishlist.length}</p>
            <Link href="/account" className="text-yellow-400 hover:text-yellow-300 underline">
              ← Back to Account Overview
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
