import { useState, useEffect } from "react";
import Head from "next/head";
import { Clock, Calendar, TrendingUp } from "lucide-react";
import MainNavbar from "@/components/nav/MainNavbar";
import Image from "next/image";
import Link from "next/link";
import { getStageInfo, getDaysInStage, ProductStage } from "@/utils/productLifecycle";
import { getProductUrl } from "@/utils/productUtils";

interface Product {
  id: number;
  name: string;
  image?: string;
  description?: string;
  category?: string;
  votes?: number;
  stage?: ProductStage;
  stageEnteredAt?: string;
  status?: string;
}

export default function ComingSoonPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products");
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      const data = await response.json();
      
      // Filter only coming-soon products that are not pending-review or rejected
      const comingSoonProducts = (data.products || []).filter(
        (product: Product) => product.stage === "coming-soon" && product.status !== "pending-review" && product.status !== "rejected"
      );
      
      setProducts(comingSoonProducts);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Coming Soon - Migistus</title>
        <meta name="description" content="Products coming soon to Migistus community drops" />
      </Head>

      <MainNavbar />

      <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black">
        {/* Header */}
        <div className="relative overflow-hidden py-20">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-transparent to-yellow-500/10"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-3 bg-zinc-800/50 border border-zinc-700 rounded-full px-6 py-2 mb-6">
              <Clock className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-400 font-medium">Coming Soon</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Products Launching Soon
            </h1>
            
            <p className="text-xl text-zinc-400 max-w-3xl mx-auto leading-relaxed">
              These products have successfully passed community voting and are preparing for launch. 
              Get ready for exclusive community drops!
            </p>
          </div>
        </div>

        {/* Products Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          {error && (
            <div className="bg-red-900/20 border border-red-500 rounded-xl p-4 mb-8">
              <div className="text-red-400 font-semibold">Error loading products:</div>
              <div className="text-red-300 text-sm">{error}</div>
            </div>
          )}
          
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div>
              <div className="text-zinc-400 mt-4">Loading coming soon products...</div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-zinc-400 mb-2">No products coming soon</h3>
              <p className="text-zinc-500">Check back later for new product launches!</p>
            </div>
          ) : (            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => {
                const stageInfo = getStageInfo(product.stage);
                const daysInStage = getDaysInStage(product.stageEnteredAt);
                
                return (
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
                      
                      {/* Category and Stage badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-2">
                        {product.category && (
                          <div className="bg-black/70 backdrop-blur-sm text-yellow-400 text-xs px-2 py-1 rounded-full">
                            {product.category}
                          </div>
                        )}
                        <div className="bg-yellow-500/80 text-black text-xs px-2 py-1 rounded-full font-medium">
                          Coming Soon
                        </div>
                      </div>

                      {/* Days in stage indicator */}
                      <div className="absolute top-3 right-3">
                        <div className="bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {daysInStage}d
                        </div>
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2">{product.name}</h3>
                        {product.description && (
                          <p className="text-zinc-400 text-sm line-clamp-2">{product.description}</p>
                        )}
                      </div>

                      {/* Launch Status */}
                      <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-yellow-300">Launch Status</span>
                          <span className="text-yellow-200 font-medium">Preparing</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-yellow-300">Days in Preparation</span>
                          <span className="text-yellow-200 font-medium">{daysInStage} days</span>
                        </div>
                      </div>

                      {/* Vote Statistics */}
                      <div className="bg-zinc-700/30 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-zinc-400">Community Votes</span>
                          <span className="font-bold text-white">{product.votes || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-zinc-400">Interest Level</span>
                          <span className="font-bold text-green-400">High</span>
                        </div>
                      </div>                      {/* Notification Button */}
                      <button className="w-full py-3 px-4 bg-yellow-500 hover:bg-yellow-600 text-black rounded-xl font-bold transition-all duration-200 flex items-center justify-center space-x-2">
                        <TrendingUp className="w-5 h-5" />
                        <span>Notify When Available</span>
                      </button>
                    </div>
                  </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
