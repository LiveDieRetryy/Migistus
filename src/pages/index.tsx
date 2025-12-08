import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import MainNavbar from "@/components/nav/MainNavbar";
import Link from "next/link";
import Image from "next/image";
import { useProducts } from "@/hooks/useProducts";
import { productUpdateManager } from "@/lib/productUpdateManager";
import ProductThumbnail, { ProductGrid } from "@/components/ProductThumbnail";

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
  id: number | string;
  name: string;
  image: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  status: string;
  stage?: string;
  votes: number;
  pledges: number;
  featured: boolean;
  goal?: number;
  currentAmount?: number;
  endDate?: string;
  slug?: string;
  thumbnailConfig?: any;
  updatedAt?: string;
};

export default function HomePage() {
  const { products, loading: productsLoading } = useProducts({ autoRefresh: true });
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Product stages for different lifecycle phases
  const [votingProducts, setVotingProducts] = useState<Product[]>([]);
  const [comingSoonProducts, setComingSoonProducts] = useState<Product[]>([]);
  const [liveProducts, setLiveProducts] = useState<Product[]>([]);

  const [showNavbar, setShowNavbar] = useState(true);
  const lastScrollY = useRef(0);

  // Subscribe to real-time product updates
  useEffect(() => {
    const unsubscribe = productUpdateManager.onProductUpdate((event) => {
      // Refresh product lists when any product is updated
      if (event.type === 'update' || event.type === 'create' || event.type === 'status_change') {
        // The useProducts hook will handle the actual data refresh
        // This just ensures we react to the notification
        console.log('Product update received on homepage:', event);
      }
    });

    return unsubscribe;
  }, []);

  // Process products from the hook with real-time updates
  useEffect(() => {
    if (products.length > 0) {
      setVotingProducts(products.filter((p: any) => p.stage === 'voting') as unknown as Product[]);
      setComingSoonProducts(products.filter((p: any) => p.stage === 'coming-soon') as unknown as Product[]);
      setLiveProducts(products.filter((p: any) => p.stage === 'community-drops' || p.stage === 'live') as unknown as Product[]);
      const featured = products.filter((p: any) => p.featured).slice(0, 3) as unknown as Product[];
      setFeaturedProducts(featured);
    }
  }, [products]);

  useEffect(() => {
    // Fetch additional stats that aren't part of products
    fetch("/api/stats")
      .then(res => res.json())
      .then(data => {
        setTotalVotes(data.votesCast || 0);
      })
      .catch(console.error);

    fetch("/api/users")
      .then(res => res.json())
      .then(data => {
        setTotalUsers(data.totalUsers || 0);
      })
      .catch(console.error);

    setTimeout(() => setIsLoaded(true), 100);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 80) {
        setShowNavbar(false);
      } else {
        setShowNavbar(true);
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <Head>
        <title>MIGISTUS - The Guild Marketplace Revolution</title>
        <meta name="description" content="Join the guild where your voice shapes the marketplace. Experience democratic commerce with collective buying power and community-driven product development." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white overflow-hidden relative">
        {/* Twinkling Stars Background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <svg width="100%" height="100%" className="w-full h-full" style={{ position: 'absolute', top: 0, left: 0 }}>
            {Array.from({ length: 60 }).map((_, i) => {
              const angle = Math.random() * 2 * Math.PI;
              const radius = Math.pow(Math.random(), 1.7) * 55 + 20;
              const x = 50 + Math.cos(angle) * radius;
              const y = 50 + Math.sin(angle) * radius;
              const r = Math.random() * 1.7 + 0.2;
              const dur = (Math.random() * 2.5 + 1.2).toFixed(2);
              return (
                <g key={i}>
                  <circle
                    cx={`${x}%`}
                    cy={`${y}%`}
                    r={r * 2.5}
                    fill="url(#gold-glow)"
                    opacity="0.22"
                  />
                  <circle
                    cx={`${x}%`}
                    cy={`${y}%`}
                    r={r}
                    fill="#ffe066"
                    opacity="0.85"
                  >
                    <animate
                      attributeName="opacity"
                      values="0.85;0.15;0.85"
                      dur={`${dur}s`}
                      repeatCount="indefinite"
                      begin={`${Math.random().toFixed(2)}s`}
                    />
                  </circle>
                </g>
              );
            })}
            <defs>
              <radialGradient id="gold-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffe066" stopOpacity="1" />
                <stop offset="100%" stopColor="#ffd700" stopOpacity="0" />
              </radialGradient>
            </defs>
          </svg>
        </div>

        {/* Navbar */}
        <div className={`transition-opacity duration-500 fixed w-full z-30 top-0 left-0 ${showNavbar ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
          <MainNavbar />
        </div>

        {/* Hero Section */}
        <section className="relative flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 pt-24 pb-20 text-center bg-gradient-to-b from-zinc-950/90 via-zinc-900/80 to-zinc-900/60">
          {/* Floating particles effect */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-yellow-400/30 rounded-full animate-float-particle"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${10 + Math.random() * 10}s`,
                }}
              />
            ))}
          </div>

          <div className="relative z-10 max-w-5xl mx-auto">
            {/* Main Title */}
            <div className="mb-6 animate-fade-in-up">
              <h1 className="text-5xl sm:text-7xl lg:text-8xl font-extrabold mb-4 bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 bg-clip-text text-transparent leading-tight playfair-heading">
                MIGISTUS
              </h1>
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="h-px w-12 sm:w-20 bg-gradient-to-r from-transparent to-yellow-400"></div>
                <h2 className="text-2xl sm:text-4xl font-semibold text-yellow-300 tracking-wide playfair-heading-light">
                  The Guild Marketplace
                </h2>
                <div className="h-px w-12 sm:w-20 bg-gradient-to-l from-transparent to-yellow-400"></div>
              </div>
            </div>
            
            {/* Animated Logo */}
            <div className="mb-8 flex justify-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="relative group cursor-pointer" style={{width: 240, height: 240}}>
                {/* Rotating ring */}
                <div className="absolute inset-0 z-0">
                  <div className="absolute inset-4 rounded-full border-2 border-yellow-400/20 animate-spin-slow"></div>
                  <div className="absolute inset-8 rounded-full border border-yellow-400/30 animate-spin-reverse"></div>
                </div>
                {/* Pulsing glow */}
                <div className="absolute inset-0 z-0 animate-pulse-slow" style={{
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, #FFD70099 0%, #FFD70044 40%, transparent 70%)',
                  filter: 'blur(40px)',
                }} />
                {/* Icon */}
                <div className="relative z-10 flex items-center justify-center h-full group-hover:scale-110 transition-transform duration-500">
                  <Image
                    src="/Icons/groupbuying.png"
                    alt="Guild Icon"
                    width={200}
                    height={200}
                    className="object-contain bg-transparent drop-shadow-2xl"
                    priority
                  />
                </div>
              </div>
            </div>

            {/* Value Proposition */}
            <p className="text-xl sm:text-2xl text-gray-200 mb-8 max-w-3xl mx-auto leading-relaxed font-light animate-fade-in" style={{ animationDelay: '0.4s' }}>
              Where <span className="text-yellow-400 font-semibold">your voice shapes the marketplace</span>, 
              <span className="text-yellow-400 font-semibold"> collective action</span> drives down prices, and every purchase 
              <span className="text-yellow-400 font-semibold"> strengthens the community</span>.
            </p>

            {/* Unique Selling Points */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto animate-fade-in" style={{ animationDelay: '0.6s' }}>
              <div className="bg-zinc-900/60 backdrop-blur-sm border border-yellow-400/20 rounded-xl p-6 hover:border-yellow-400/40 transition-all hover:scale-105 hover:shadow-xl hover:shadow-yellow-400/10">
                <div className="text-4xl mb-3">🗳️</div>
                <h3 className="text-lg font-bold text-yellow-400 mb-2">Democratic Catalog</h3>
                <p className="text-zinc-300 text-sm">You vote, we source. Every product is chosen by the community.</p>
              </div>
              <div className="bg-zinc-900/60 backdrop-blur-sm border border-yellow-400/20 rounded-xl p-6 hover:border-yellow-400/40 transition-all hover:scale-105 hover:shadow-xl hover:shadow-yellow-400/10">
                <div className="text-4xl mb-3">💰</div>
                <h3 className="text-lg font-bold text-yellow-400 mb-2">Bulk Power Pricing</h3>
                <p className="text-zinc-300 text-sm">Unite for massive discounts. More members = lower prices.</p>
              </div>
              <div className="bg-zinc-900/60 backdrop-blur-sm border border-yellow-400/20 rounded-xl p-6 hover:border-yellow-400/40 transition-all hover:scale-105 hover:shadow-xl hover:shadow-yellow-400/10">
                <div className="text-4xl mb-3">🏆</div>
                <h3 className="text-lg font-bold text-yellow-400 mb-2">Member Rewards</h3>
                <p className="text-zinc-300 text-sm">Earn tiers, unlock perks, amplify your voting power.</p>
              </div>
            </div>

            {/* Primary CTAs */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16 animate-fade-in" style={{ animationDelay: '0.8s' }}>
              <Link href="/register" legacyBehavior>
                <a className="group relative overflow-hidden font-bold px-10 py-5 rounded-2xl transition-all duration-300 text-xl bg-gradient-to-r from-yellow-400 to-yellow-500 text-black hover:from-yellow-300 hover:to-yellow-400 shadow-2xl shadow-yellow-400/30 hover:shadow-yellow-400/50 hover:scale-105 transform">
                  <span className="relative z-10 flex items-center gap-2">
                    ⚔️ Join the Guild
                    <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
                  </span>
                </a>
              </Link>
              <Link href="/voting" legacyBehavior>
                <a className="group font-bold px-10 py-5 rounded-2xl transition-all duration-300 text-xl border-2 border-yellow-400 text-yellow-400 hover:bg-yellow-400/10 hover:scale-105 shadow-lg hover:shadow-yellow-400/20">
                  <span className="flex items-center gap-2">
                    🗳️ Start Voting
                    <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
                  </span>
                </a>
              </Link>
            </div>

            {/* Live Stats with Animation */}
            <div className="flex flex-wrap justify-center gap-8 lg:gap-16 animate-fade-in" style={{ animationDelay: '1s' }}>
              <div className="text-center group">
                <div className="text-5xl lg:text-6xl font-extrabold bg-gradient-to-r from-yellow-200 to-yellow-500 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform">
                  {totalUsers.toLocaleString()}+
                </div>
                <div className="text-gray-300 text-sm uppercase tracking-wider font-semibold">Guild Members</div>
              </div>
              <div className="hidden sm:block w-px h-16 bg-gradient-to-b from-transparent via-yellow-400/30 to-transparent self-center"></div>
              <div className="text-center group">
                <div className="text-5xl lg:text-6xl font-extrabold bg-gradient-to-r from-yellow-200 to-yellow-500 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform">
                  {totalVotes.toLocaleString()}+
                </div>
                <div className="text-gray-300 text-sm uppercase tracking-wider font-semibold">Democratic Votes</div>
              </div>
              <div className="hidden sm:block w-px h-16 bg-gradient-to-b from-transparent via-yellow-400/30 to-transparent self-center"></div>
              <div className="text-center group">
                <div className="text-5xl lg:text-6xl font-extrabold bg-gradient-to-r from-yellow-200 to-yellow-500 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform">
                  50+
                </div>
                <div className="text-gray-300 text-sm uppercase tracking-wider font-semibold">Community Drops</div>
              </div>
            </div>
          </div>
          
          {/* Scroll Indicator - positioned at section border */}
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 animate-bounce cursor-pointer z-10" onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}>
            <div className="flex flex-col items-center gap-2">
              <div className="text-yellow-400/70 text-sm font-semibold">Explore</div>
              <div className="w-6 h-10 border-2 border-yellow-400/50 rounded-full flex justify-center items-start">
                <div className="w-1 h-3 bg-yellow-400 rounded-full mt-2 animate-pulse"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Guild Product Journey Section */}
        <section className="relative py-20 px-4 sm:px-6 bg-gradient-to-b from-transparent to-zinc-900/50 border-t border-yellow-400/10">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-yellow-400 mb-4">The Guild's Product Journey</h2>
              <p className="text-lg text-zinc-300 max-w-3xl mx-auto mb-8">
                Every product in our guild follows a democratic path from idea to your doorstep. 
                Your voice shapes what we offer, and collective action unlocks the best prices.
              </p>
            </div>
            
            {/* Product Lifecycle Flow */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-16">
              {/* Stage 1: Voting */}
              <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 border border-blue-400/30 rounded-2xl p-6 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-blue-400/10 rounded-full -mr-10 -mt-10"></div>
                <div className="relative z-10">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center text-xl font-bold mr-4">🗳️</div>
                    <div>
                      <h3 className="text-lg font-bold text-blue-300">Vote & Discover</h3>
                      <div className="text-sm text-blue-200/70">Stage 1</div>
                    </div>
                  </div>
                  <p className="text-zinc-300 text-sm leading-relaxed mb-4">
                    Guild members vote on potential products. Most popular ideas advance to development.
                  </p>
                  <div className="text-blue-200/80 text-xs mb-3">
                    Active votes: {votingProducts.length} products
                  </div>
                  <Link href="/voting" legacyBehavior>
                    <a className="inline-block text-blue-300 hover:text-blue-200 text-sm font-semibold border-b border-blue-300/50 hover:border-blue-200">
                      Explore Voting →
                    </a>
                  </Link>
                </div>
              </div>

              {/* Stage 2: Coming Soon */}
              <div className="bg-gradient-to-br from-yellow-900/40 to-yellow-800/20 border border-yellow-400/30 rounded-2xl p-6 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-400/10 rounded-full -mr-10 -mt-10"></div>
                <div className="relative z-10">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-yellow-500 text-black rounded-full flex items-center justify-center text-xl font-bold mr-4">⏳</div>
                    <div>
                      <h3 className="text-lg font-bold text-yellow-300">In Development</h3>
                      <div className="text-sm text-yellow-200/70">Stage 2</div>
                    </div>
                  </div>
                  <p className="text-zinc-300 text-sm leading-relaxed mb-4">
                    Winning products enter development. Get early access and track progress.
                  </p>
                  <div className="text-yellow-200/80 text-xs mb-3">
                    In pipeline: {comingSoonProducts.length} products
                  </div>
                  <Link href="/coming-soon" legacyBehavior>
                    <a className="inline-block text-yellow-300 hover:text-yellow-200 text-sm font-semibold border-b border-yellow-300/50 hover:border-yellow-200">
                      See Progress →
                    </a>
                  </Link>
                </div>
              </div>

              {/* Stage 3: Live Drops */}
              <div className="bg-gradient-to-br from-green-900/40 to-green-800/20 border border-green-400/30 rounded-2xl p-6 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-green-400/10 rounded-full -mr-10 -mt-10"></div>
                <div className="relative z-10">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-green-500 text-black rounded-full flex items-center justify-center text-xl font-bold mr-4">⚔️</div>
                    <div>
                      <h3 className="text-lg font-bold text-green-300">Guild Drops</h3>
                      <div className="text-sm text-green-200/70">Stage 3</div>
                    </div>
                  </div>
                  <p className="text-zinc-300 text-sm leading-relaxed mb-4">
                    Ready products launch as group buys. More members = bigger discounts for all.
                  </p>
                  <div className="text-green-200/80 text-xs mb-3">
                    Live now: {liveProducts.length} active drops
                  </div>
                  <Link href="/community-drops" legacyBehavior>
                    <a className="inline-block text-green-300 hover:text-green-200 text-sm font-semibold border-b border-green-300/50 hover:border-green-200">
                      Join Drops →
                    </a>
                  </Link>
                </div>
              </div>

              {/* Stage 4: Guild Favorites */}
              <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 border border-purple-400/30 rounded-2xl p-6 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-purple-400/10 rounded-full -mr-10 -mt-10"></div>
                <div className="relative z-10">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-purple-500 text-white rounded-full flex items-center justify-center text-xl font-bold mr-4">⭐</div>
                    <div>
                      <h3 className="text-lg font-bold text-purple-300">Guild Favorites</h3>
                      <div className="text-sm text-purple-200/70">Hall of Fame</div>
                    </div>
                  </div>
                  <p className="text-zinc-300 text-sm leading-relaxed mb-4">
                    Proven successes become permanent guild offerings with ongoing member benefits.
                  </p>
                  <div className="text-purple-200/80 text-xs mb-3">
                    Proven winners: {featuredProducts.length} favorites
                  </div>
                  <Link href="/staff-picks" legacyBehavior>
                    <a className="inline-block text-purple-300 hover:text-purple-200 text-sm font-semibold border-b border-purple-300/50 hover:border-purple-200">
                      Browse Favorites →
                    </a>
                  </Link>
                </div>
              </div>
            </div>

            {/* Guild Power Visualization */}
            <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/60 border border-yellow-400/20 rounded-2xl p-8 text-center">
              <h3 className="text-2xl font-bold text-yellow-400 mb-6">The Power of Guild Unity</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="flex flex-col items-center">
                  <div className="text-4xl mb-3">👤</div>
                  <div className="text-lg font-semibold text-red-300 mb-2">Shopping Alone</div>
                  <div className="text-zinc-400 text-sm text-center">
                    Pay full retail price<br/>
                    Limited selection<br/>
                    No community input<br/>
                    No collective power
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-4xl mb-3">⚡</div>
                  <div className="text-lg font-semibold text-yellow-300 mb-2">Guild Transformation</div>
                  <div className="text-zinc-300 text-sm text-center">
                    Democratic marketplace<br/>
                    Collective negotiation<br/>
                    Community-driven selection<br/>
                    Shared prosperity
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-4xl mb-3">🏰</div>
                  <div className="text-lg font-semibold text-green-300 mb-2">Guild Benefits</div>
                  <div className="text-zinc-400 text-sm text-center">
                    Up to 50% savings<br/>
                    Curated by community<br/>
                    Exclusive member perks<br/>
                    Tier-based rewards
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose MIGISTUS Section */}
        <section className="relative py-16 px-4 sm:px-6 bg-gradient-to-b from-zinc-900/60 to-transparent border-t border-yellow-400/10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-yellow-400 mb-4">Why Choose MIGISTUS?</h2>
            <blockquote className="italic text-xl text-yellow-200 mb-6">"Alone, you're just a buyer. Together, you're a guild."</blockquote>
            <p className="text-lg text-zinc-300 leading-relaxed">
              Migistus challenges the standard retail model. It's a platform where demand shapes supply, community unlocks savings, and every purchase is a shared conquest.
            </p>
          </div>
        </section>

        {/* Guild Favorites Section */}
        <section className="relative py-20 px-4 sm:px-6 bg-gradient-to-b from-zinc-900/50 to-transparent border-t border-yellow-400/10">
          <div className="max-w-7xl mx-auto text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-yellow-400 mb-3">Guild Favorites</h2>
            <p className="text-lg text-zinc-300 max-w-2xl mx-auto">Community-proven products that have earned their place in our guild's hall of fame.</p>
          </div>
          {featuredProducts.length > 0 ? (
            <ProductGrid
              products={featuredProducts as any[]}
              columns={3}
              gap="lg"
              layout="card"
              className="max-w-5xl mx-auto"
              onProductClick={(product) => {
                // Optional: Add click tracking or custom behavior
                window.location.href = `/drops/${product.slug || slugify(product.name)}`;
              }}
            />
          ) : (
            <div className="text-zinc-400 text-lg">No guild favorites available yet. Help us build our first success stories!</div>
          )}
        </section>

        {/* Guild Membership Call to Action */}
        <section className="relative py-20 px-4 sm:px-6 border-t border-yellow-400/10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-yellow-400 mb-3">Ready to Join the Guild?</h2>
            <p className="text-lg text-zinc-300 mb-8">
              Become part of the marketplace revolution. Your voice matters, your votes count, and your membership strengthens the entire guild.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" legacyBehavior>
                <a className="inline-block px-10 py-4 rounded-2xl bg-yellow-400 text-black font-extrabold text-xl shadow-lg hover:bg-yellow-300 transition">
                  Join the Guild
                </a>
              </Link>
              <Link href="/voting" legacyBehavior>
                <a className="inline-block px-10 py-4 rounded-2xl border-2 border-yellow-400 text-yellow-400 font-bold text-xl hover:bg-yellow-400 hover:text-black transition">
                  Start Voting
                </a>
              </Link>
            </div>
          </div>
        </section>

        {/* Testimonials & Social Proof Section */}
        <section className="relative py-20 px-4 sm:px-6 bg-gradient-to-b from-transparent via-zinc-900/30 to-transparent border-y border-yellow-400/10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-yellow-400 mb-4">What Our Guild Members Say</h2>
              <p className="text-lg text-zinc-300 max-w-2xl mx-auto">Real experiences from members who've discovered the power of collective commerce.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Testimonial 1 */}
              <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/40 border border-yellow-400/20 rounded-2xl p-8 hover:border-yellow-400/40 transition-all hover:scale-105">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-black font-bold text-xl">
                    J
                  </div>
                  <div className="ml-4">
                    <h4 className="text-white font-bold">Jessica M.</h4>
                    <div className="text-yellow-400 text-sm">Guild Member</div>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="text-yellow-400 text-2xl">"</div>
                  <p className="text-zinc-300 leading-relaxed italic">
                    I saved over $200 on my first guild drop! It's amazing to finally have a say in what products are offered instead of just accepting whatever stores decide to sell.
                  </p>
                  <div className="text-yellow-400 text-2xl text-right">"</div>
                </div>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400">⭐</span>
                  ))}
                </div>
              </div>

              {/* Testimonial 2 */}
              <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/40 border border-yellow-400/20 rounded-2xl p-8 hover:border-yellow-400/40 transition-all hover:scale-105">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    M
                  </div>
                  <div className="ml-4">
                    <h4 className="text-white font-bold">Marcus T.</h4>
                    <div className="text-yellow-400 text-sm">Guild Elite</div>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="text-yellow-400 text-2xl">"</div>
                  <p className="text-zinc-300 leading-relaxed italic">
                    This is the future of shopping. Voting on products before they're sourced means I actually want everything in the catalog. No more browsing through junk I'll never buy.
                  </p>
                  <div className="text-yellow-400 text-2xl text-right">"</div>
                </div>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400">⭐</span>
                  ))}
                </div>
              </div>

              {/* Testimonial 3 */}
              <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/40 border border-yellow-400/20 rounded-2xl p-8 hover:border-yellow-400/40 transition-all hover:scale-105">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    S
                  </div>
                  <div className="ml-4">
                    <h4 className="text-white font-bold">Sarah K.</h4>
                    <div className="text-yellow-400 text-sm">Guild Member</div>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="text-yellow-400 text-2xl">"</div>
                  <p className="text-zinc-300 leading-relaxed italic">
                    The tier system is genius. The more I participate, the more voting power I get. It makes me feel like I'm actually building something with the community.
                  </p>
                  <div className="text-yellow-400 text-2xl text-right">"</div>
                </div>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400">⭐</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl mb-2">✅</div>
                <div className="text-yellow-400 font-bold text-2xl mb-1">100%</div>
                <div className="text-zinc-400 text-sm">Secure Checkout</div>
              </div>
              <div>
                <div className="text-4xl mb-2">🚚</div>
                <div className="text-yellow-400 font-bold text-2xl mb-1">Free</div>
                <div className="text-zinc-400 text-sm">Guild Shipping</div>
              </div>
              <div>
                <div className="text-4xl mb-2">💬</div>
                <div className="text-yellow-400 font-bold text-2xl mb-1">24/7</div>
                <div className="text-zinc-400 text-sm">Member Support</div>
              </div>
              <div>
                <div className="text-4xl mb-2">🛡️</div>
                <div className="text-yellow-400 font-bold text-2xl mb-1">30 Day</div>
                <div className="text-zinc-400 text-sm">Guild Guarantee</div>
              </div>
            </div>
          </div>
        </section>

        {/* Membership Tiers Section */}
        <section className="relative py-20 px-4 sm:px-6 border-t border-yellow-400/10">
          <div className="max-w-5xl mx-auto text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-yellow-400 mb-3">Guild Membership Tiers</h2>
            <p className="text-lg text-zinc-300 max-w-2xl mx-auto">Level up your influence and unlock greater benefits as you contribute to the guild.</p>
          </div>
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Initiate Tier */}
            <div className="bg-zinc-900 border border-yellow-400/20 rounded-2xl p-10 flex flex-col items-center shadow-lg hover:scale-105 transition-transform">
              <div className="mb-4"><Image src="/Icons/Initiate.png" alt="Initiate" width={56} height={56} /></div>
              <h3 className="text-xl font-bold text-white mb-1">Guild Initiate</h3>
              <div className="text-2xl font-bold text-yellow-400 mb-2">Free</div>
              <ul className="text-zinc-200 text-base mb-6 space-y-2 text-left">
                <li>✓ Access to guild drops</li>
                <li>✓ 1x voting power</li>
                <li>✓ Community forums</li>
                <li>✓ Basic guild support</li>
              </ul>
              <button className="w-full border border-yellow-400 text-yellow-400 font-semibold py-3 rounded-lg hover:bg-yellow-400 hover:text-black transition">Join Free</button>
            </div>
            
            {/* Guild Member */}
            <div className="bg-zinc-900 border-2 border-purple-400 rounded-2xl p-10 flex flex-col items-center shadow-2xl relative hover:scale-105 transition-transform">
              <div className="mb-4"><Image src="/Icons/guild.png" alt="Guild Member" width={56} height={56} /></div>
              <h3 className="text-xl font-bold text-white mb-1">Guild Member</h3>
              <div className="text-2xl font-bold text-yellow-400 mb-2">$9.99/mo</div>
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-yellow-400 text-black text-xs font-bold px-4 py-1 rounded-full shadow">Most Popular</div>
              <ul className="text-zinc-200 text-base mb-6 space-y-2 text-left">
                <li>✓ All Initiate benefits</li>
                <li>✓ 2x voting power</li>
                <li>✓ Priority guild support</li>
                <li>✓ 5% additional discount</li>
                <li>✓ Early drop access</li>
              </ul>
              <button className="w-full bg-yellow-400 text-black font-semibold py-3 rounded-lg hover:bg-yellow-300 transition">Upgrade Guild Status</button>
            </div>
            
            {/* Elite Member */}
            <div className="bg-zinc-900 border-2 border-yellow-400 rounded-xl p-8 flex flex-col items-center shadow-2xl relative">
              <div className="mb-4"><Image src="/Icons/staffpicks.png" alt="MIGISTUS Elite" width={56} height={56} /></div>
              <h3 className="text-xl font-bold text-yellow-400 mb-1">MIGISTUS Elite</h3>
              <div className="text-2xl font-bold text-yellow-400 mb-2">$19.99/mo</div>
              <ul className="text-yellow-200 text-base mb-6 space-y-2 text-left">
                <li>✓ All Member benefits</li>
                <li>✓ 4x voting power</li>
                <li>✓ VIP guild support</li>
                <li>✓ 10% additional discount</li>
                <li>✓ Exclusive elite drops</li>
                <li>✓ Personal guild concierge</li>
              </ul>
              <button className="w-full border border-yellow-400 text-yellow-400 font-semibold py-3 rounded-lg hover:bg-yellow-400 hover:text-black transition">Achieve Elite Status</button>
            </div>
          </div>
        </section>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes float-particle {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
          25% { transform: translate(10px, -15px) scale(1.2); opacity: 0.6; }
          50% { transform: translate(-10px, -25px) scale(0.8); opacity: 0.4; }
          75% { transform: translate(15px, -10px) scale(1.1); opacity: 0.5; }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.05); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        .animate-spin-reverse {
          animation: spin-reverse 15s linear infinite;
        }
        .animate-float-particle {
          animation: float-particle linear infinite;
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out forwards;
          opacity: 0;
        }
        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out forwards;
          opacity: 0;
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .playfair-heading {
          font-family: 'Playfair Display', serif !important;
          font-weight: 900;
          letter-spacing: 0.04em;
          text-transform: none;
          text-shadow: 0 4px 20px rgba(0,0,0,0.5), 0 0 40px rgba(255,215,0,0.3);
        }
        .playfair-heading-light {
          font-family: 'Playfair Display', serif !important;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: none;
          opacity: 0.92;
          text-shadow: 0 2px 15px rgba(0,0,0,0.4), 0 0 30px rgba(255,215,0,0.2);
        }
      `}</style>
    </>
  );
}
