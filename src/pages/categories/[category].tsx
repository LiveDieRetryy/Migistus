import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";
import { 
  TrendingUp, Vote, Clock, Zap, ArrowRight, Filter, 
  Package, Star, Flame, ChevronRight, Eye, Heart, Grid3X3
} from "lucide-react";
import MainNavbar from "@/components/nav/MainNavbar";
import { getProductUrl } from "@/utils/productUtils";

// Helper function to generate slug from product name
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
}

type Product = {
  id: number;
  name: string;
  image: string;
  description: string;
  category: string;
  price?: number;
  stage?: string;
  slug?: string;
  supplier?: {
    name: string;
  };
  votes?: number;
  totalVoteWeight?: number;
};

const DEPARTMENTS = [
  "Electronics",
  "Computers",
  "Smart Home",
  "Home, Garden & Tools",
  "Pet Supplies",
  "Food & Grocery",
  "Beauty & Health",
  "Toys, Kids & Baby",
  "Handmade",
  "Sports & Outdoors",
  "Automotive",
  "Industrial & Scientific",
  "Movies, Music & Games"
];

const departmentIcons: Record<string, string> = {
  "Electronics": "📱",
  "Computers": "💻",
  "Smart Home": "🏠",
  "Home, Garden & Tools": "🔨",
  "Pet Supplies": "🐕",
  "Food & Grocery": "🥗",
  "Beauty & Health": "💄",
  "Toys, Kids & Baby": "🧸",
  "Handmade": "🎨",
  "Sports & Outdoors": "⚽",
  "Automotive": "🚗",
  "Industrial & Scientific": "🔬",
  "Movies, Music & Games": "🎮"
};

export default function CategoryPage() {
  const router = useRouter();
  const { category } = router.query;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState<string>("all");

  // Find the display name for the category (case-insensitive)
  const displayCategory =
    typeof category === "string"
      ? DEPARTMENTS.find(
          (d) => d.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "") === category.toLowerCase()
        ) || category
      : "";

  useEffect(() => {
    if (!category) return;
    
    Promise.all([
      fetch("/api/products").then(res => res.json()),
      fetch("/api/votes").then(res => res.json())
    ])
      .then(([productsData, votesData]) => {
        if (Array.isArray(productsData.products)) {
          const categoryProducts = productsData.products.filter(
            (p: Product) =>
              p.category &&
              p.category.toString().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "") === 
              category.toString().toLowerCase()
          );

          // Calculate vote weights for each product
          const productsWithVotes = categoryProducts.map((product: Product) => {
            const productVotes = Array.isArray(votesData) 
              ? votesData.filter((v: any) => v.productId === product.id)
              : [];
            const totalVoteWeight = productVotes.reduce((sum: number, vote: any) => sum + (vote.value || 0), 0);
            
            return {
              ...product,
              votes: productVotes.length,
              totalVoteWeight
            };
          });

          setProducts(productsWithVotes);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [category]);

  const filteredProducts = selectedStage === "all" 
    ? products 
    : products.filter(p => p.stage?.toLowerCase() === selectedStage);

  // Get trending products (top 6 by vote weight)
  const trendingProducts = [...products]
    .sort((a, b) => (b.totalVoteWeight || 0) - (a.totalVoteWeight || 0))
    .slice(0, 6);

  // Group products by stage
  const votingProducts = products.filter(p => p.stage?.toLowerCase() === "voting");
  const comingSoonProducts = products.filter(p => p.stage?.toLowerCase() === "coming soon");
  const liveProducts = products.filter(p => p.stage?.toLowerCase() === "live");

  const getStageIcon = (stage?: string) => {
    switch (stage?.toLowerCase()) {
      case "voting": return <Vote className="w-4 h-4" />;
      case "coming soon": return <Clock className="w-4 h-4" />;
      case "live": return <Zap className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const getStageColor = (stage?: string) => {
    switch (stage?.toLowerCase()) {
      case "voting": return "from-blue-500 to-cyan-500";
      case "coming soon": return "from-yellow-500 to-orange-500";
      case "live": return "from-green-500 to-emerald-500";
      default: return "from-zinc-500 to-zinc-600";
    }
  };

  const getStageBadgeColor = (stage?: string) => {
    switch (stage?.toLowerCase()) {
      case "voting": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "coming soon": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "live": return "bg-green-500/20 text-green-400 border-green-500/30";
      default: return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
    }
  };

  if (loading) {
    return (
      <>
        <MainNavbar />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black via-zinc-900 to-black text-white">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-yellow-500 border-t-transparent mb-4"></div>
            <p className="text-zinc-400">Loading products...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{displayCategory} - MIGISTUS</title>
        <meta name="description" content={`Explore ${displayCategory} products on MIGISTUS. Vote, pre-order, and buy the latest ${displayCategory.toLowerCase()} through group buying.`} />
      </Head>
      
      <MainNavbar />
      
      <div className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black text-white pt-20">
        {/* Hero Section */}
        <div className="relative overflow-hidden py-12">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/5 via-transparent to-purple-900/5" />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-zinc-400 mb-6">
              <Link href="/categories" className="hover:text-yellow-400 transition-colors">Categories</Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-white">{displayCategory}</span>
            </div>

            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="text-5xl">{departmentIcons[displayCategory] || "📦"}</div>
              <div>
                <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-yellow-400 via-orange-400 to-purple-400 bg-clip-text text-transparent">
                  {displayCategory}
                </h1>
                <p className="text-zinc-400 text-lg mt-2">{products.length} products available</p>
              </div>
            </div>

            {/* Stage Filter Pills */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setSelectedStage("all")}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  selectedStage === "all"
                    ? "bg-yellow-500 text-black"
                    : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50 border border-zinc-700"
                }`}
              >
                <Grid3X3 className="w-4 h-4 inline mr-2" />
                All ({products.length})
              </button>
              <button
                onClick={() => setSelectedStage("voting")}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  selectedStage === "voting"
                    ? "bg-blue-500 text-white"
                    : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50 border border-zinc-700"
                }`}
              >
                <Vote className="w-4 h-4 inline mr-2" />
                Voting ({votingProducts.length})
              </button>
              <button
                onClick={() => setSelectedStage("coming soon")}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  selectedStage === "coming soon"
                    ? "bg-yellow-500 text-black"
                    : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50 border border-zinc-700"
                }`}
              >
                <Clock className="w-4 h-4 inline mr-2" />
                Coming Soon ({comingSoonProducts.length})
              </button>
              <button
                onClick={() => setSelectedStage("live")}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  selectedStage === "live"
                    ? "bg-green-500 text-white"
                    : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50 border border-zinc-700"
                }`}
              >
                <Zap className="w-4 h-4 inline mr-2" />
                Live Now ({liveProducts.length})
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          {products.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-zinc-800 border border-zinc-700 mb-6">
                <Package className="w-10 h-10 text-zinc-600" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">No Products Yet</h3>
              <p className="text-zinc-400 mb-8">Check back soon for new {displayCategory.toLowerCase()} products!</p>
              <Link
                href="/categories"
                className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-xl transition-all"
              >
                Browse Other Categories
              </Link>
            </div>
          ) : (
            <>
              {/* Trending Section */}
              {selectedStage === "all" && trendingProducts.length > 0 && (
                <div className="mb-16">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center">
                        <Flame className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">Trending Now</h2>
                        <p className="text-sm text-zinc-400">Most popular in {displayCategory}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {trendingProducts.slice(0, 6).map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </div>
              )}

              {/* Voting Section */}
              {(selectedStage === "all" || selectedStage === "voting") && votingProducts.length > 0 && (
                <div className="mb-16">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                        <Vote className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">Vote to Launch</h2>
                        <p className="text-sm text-zinc-400">Help decide what drops next</p>
                      </div>
                    </div>
                    {selectedStage === "all" && votingProducts.length > 6 && (
                      <button
                        onClick={() => setSelectedStage("voting")}
                        className="flex items-center gap-2 text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                      >
                        View All <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(selectedStage === "all" ? votingProducts.slice(0, 6) : votingProducts).map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </div>
              )}

              {/* Coming Soon Section */}
              {(selectedStage === "all" || selectedStage === "coming soon") && comingSoonProducts.length > 0 && (
                <div className="mb-16">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">Coming Soon</h2>
                        <p className="text-sm text-zinc-400">Launching shortly</p>
                      </div>
                    </div>
                    {selectedStage === "all" && comingSoonProducts.length > 6 && (
                      <button
                        onClick={() => setSelectedStage("coming soon")}
                        className="flex items-center gap-2 text-yellow-400 hover:text-yellow-300 font-semibold transition-colors"
                      >
                        View All <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(selectedStage === "all" ? comingSoonProducts.slice(0, 6) : comingSoonProducts).map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </div>
              )}

              {/* Live Now Section */}
              {(selectedStage === "all" || selectedStage === "live") && liveProducts.length > 0 && (
                <div className="mb-16">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">Live Now</h2>
                        <p className="text-sm text-zinc-400">Active drops available</p>
                      </div>
                    </div>
                    {selectedStage === "all" && liveProducts.length > 6 && (
                      <button
                        onClick={() => setSelectedStage("live")}
                        className="flex items-center gap-2 text-green-400 hover:text-green-300 font-semibold transition-colors"
                      >
                        View All <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(selectedStage === "all" ? liveProducts.slice(0, 6) : liveProducts).map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

// Product Card Component
function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={getProductUrl(product)} className="group">
      <div className="relative bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl overflow-hidden hover:border-yellow-500/50 transition-all duration-300 hover:transform hover:scale-105 shadow-lg hover:shadow-yellow-500/20">
        {/* Product Image */}
        <div className="relative w-full h-56 overflow-hidden bg-gradient-to-br from-zinc-800 to-zinc-900">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
          
          {/* Stage Badge */}
          {product.stage && (
            <div className={`absolute top-3 right-3 px-3 py-1.5 rounded-lg backdrop-blur-md border font-semibold text-xs flex items-center gap-1.5 ${
              product.stage.toLowerCase() === "voting" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
              product.stage.toLowerCase() === "coming soon" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
              product.stage.toLowerCase() === "live" ? "bg-green-500/20 text-green-400 border-green-500/30" :
              "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"
            }`}>
              {product.stage.toLowerCase() === "voting" ? <Vote className="w-3 h-3" /> :
               product.stage.toLowerCase() === "coming soon" ? <Clock className="w-3 h-3" /> :
               product.stage.toLowerCase() === "live" ? <Zap className="w-3 h-3" /> :
               <Package className="w-3 h-3" />}
              {product.stage}
            </div>
          )}

          {/* Vote Count Badge */}
          {product.votes && product.votes > 0 && (
            <div className="absolute top-3 left-3 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-yellow-500/30 text-yellow-400 font-bold text-xs flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3" />
              {product.totalVoteWeight || product.votes} votes
            </div>
          )}
        </div>
        
        {/* Product Info */}
        <div className="p-5 space-y-3">
          <h3 className="text-lg font-bold text-white group-hover:text-yellow-400 transition-colors line-clamp-2">
            {product.name}
          </h3>
          <p className="text-zinc-400 text-sm line-clamp-2">
            {product.description}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
            {product.price && (
              <div className="text-lg font-bold text-yellow-400">
                ${product.price.toFixed(2)}
              </div>
            )}
            <div className="flex items-center text-yellow-400 opacity-0 group-hover:opacity-100 transition-all ml-auto">
              <span className="text-xs font-semibold">View Details</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
