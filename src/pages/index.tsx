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
            <blockquote className="text-2xl sm:text-3xl text-yellow-200 mb-6 max-w-3xl mx-auto leading-relaxed italic animate-fade-in" style={{ animationDelay: '0.4s' }}>
              "Alone, you're just a buyer. Together, you're a guild."
            </blockquote>
            <p className="text-lg sm:text-xl text-gray-300 mb-10 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.5s' }}>
              Join the first democratic marketplace where your voice shapes what products get offered. Experience the power of collective buying with thousands of guild members.
            </p>

            {/* Primary CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 animate-fade-in" style={{ animationDelay: '0.6s' }}>
              <Link href="/register" legacyBehavior>
                <a className="group relative overflow-hidden font-bold px-10 py-4 rounded-xl transition-all duration-300 text-lg bg-gradient-to-r from-yellow-400 to-yellow-500 text-black hover:from-yellow-300 hover:to-yellow-400 shadow-xl shadow-yellow-400/30 hover:shadow-yellow-400/50 hover:scale-105 transform">
                  <span className="relative z-10 flex items-center gap-2">
                    ⚔️ Join the Guild
                    <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
                  </span>
                </a>
              </Link>
              <Link href="/voting" legacyBehavior>
                <a className="group font-bold px-10 py-4 rounded-xl transition-all duration-300 text-lg border-2 border-yellow-400 text-yellow-400 hover:bg-yellow-400/10 hover:scale-105">
                  <span className="flex items-center gap-2">
                    🗳️ Start Voting
                    <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
                  </span>
                </a>
              </Link>
            </div>

            {/* Live Stats with Animation */}
            <div className="flex flex-wrap justify-center gap-8 lg:gap-12 text-center animate-fade-in" style={{ animationDelay: '0.7s' }}>
              <div className="group">
                <div className="text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-yellow-200 to-yellow-500 bg-clip-text text-transparent mb-1 group-hover:scale-110 transition-transform">
                  {totalUsers.toLocaleString()}+
                </div>
                <div className="text-gray-400 text-xs uppercase tracking-wider">Guild Members</div>
              </div>
              <div className="hidden sm:block w-px h-12 bg-yellow-400/20 self-center"></div>
              <div className="group">
                <div className="text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-yellow-200 to-yellow-500 bg-clip-text text-transparent mb-1 group-hover:scale-110 transition-transform">
                  {totalVotes.toLocaleString()}
                </div>
                <div className="text-gray-400 text-xs uppercase tracking-wider">Democratic Votes</div>
              </div>
              <div className="hidden sm:block w-px h-12 bg-yellow-400/20 self-center"></div>
              <div className="group">
                <div className="text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-yellow-200 to-yellow-500 bg-clip-text text-transparent mb-1 group-hover:scale-110 transition-transform">
                  {liveProducts.length}
                </div>
                <div className="text-gray-400 text-xs uppercase tracking-wider">Community Drops</div>
              </div>
            </div>
          </div>
          
          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce cursor-pointer" onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}>
            <div className="w-6 h-10 border-2 border-yellow-400/50 rounded-full flex justify-center pt-2">
              <div className="w-1.5 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
            </div>
          </div>
        </section>

        {/* Product Lifecycle Section */}
        <section className="relative py-20 px-4 sm:px-6 border-t border-yellow-400/10">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold mb-6 bg-gradient-to-r from-yellow-200 to-yellow-500 bg-clip-text text-transparent playfair-heading">
                The Guild's Product Lifecycle
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-8">
                Every product moves through the guild's democratic process - from voting to final delivery.
              </p>
              
              {/* Info box */}
              <div className="max-w-4xl mx-auto bg-gradient-to-br from-zinc-900/80 to-zinc-800/60 border border-yellow-400/20 rounded-xl p-6 mb-12">
                <div className="flex flex-col md:flex-row justify-around gap-6 text-center">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Voting Duration</div>
                    <div className="text-2xl font-bold text-yellow-400">7 Days</div>
                  </div>
                  <div className="hidden md:block w-px bg-yellow-400/20"></div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Stage Advance</div>
                    <div className="text-2xl font-bold text-yellow-400">Every Friday</div>
                  </div>
                  <div className="hidden md:block w-px bg-yellow-400/20"></div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Your Power</div>
                    <div className="text-2xl font-bold text-yellow-400">Set The Price</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Progress Line */}
            <div className="relative mb-12 hidden lg:block">
              <div className="absolute top-10 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-yellow-500 to-green-500 rounded-full opacity-30"></div>
            </div>

            {/* Three Stages Grid */}
            <div className="grid md:grid-cols-3 gap-8 relative">
              {/* Stage 1: Vote & Discover */}
              <div className="relative group">
                <div className="bg-gradient-to-br from-blue-900/40 to-zinc-900/60 border-2 border-blue-500/30 rounded-2xl p-8 h-full hover:border-blue-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20">
                  {/* Stage Badge */}
                  <div className="absolute -top-3 left-6 flex items-center gap-2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                    <span>🗳️</span>
                    <span>STAGE 1</span>
                  </div>
                  
                  <div className="mt-4">
                    <h3 className="text-2xl font-bold text-blue-400 mb-4">Vote & Discover</h3>
                    <p className="text-gray-300 mb-6 leading-relaxed">
                      Browse products proposed by the community. Vote for what you want to see offered. The guild decides what moves forward together.
                    </p>
                    
                    {/* Status Box */}
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
                      <div className="text-sm text-blue-300 mb-1">Currently Voting</div>
                      <div className="text-3xl font-bold text-blue-400">{votingProducts.length} products</div>
                    </div>
                    
                    <Link href="/voting" legacyBehavior>
                      <a className="block w-full text-center bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/30">
                        Explore Voting →
                      </a>
                    </Link>
                  </div>
                </div>
                
                {/* Arrow to next stage (desktop only) */}
                <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 text-4xl text-yellow-400 z-10">
                  →
                </div>
              </div>

              {/* Stage 2: Coming Soon */}
              <div className="relative group">
                <div className="bg-gradient-to-br from-yellow-900/40 to-zinc-900/60 border-2 border-yellow-500/30 rounded-2xl p-8 h-full hover:border-yellow-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-yellow-500/20">
                  {/* Stage Badge */}
                  <div className="absolute -top-3 left-6 flex items-center gap-2 bg-yellow-500 text-black px-4 py-1 rounded-full text-sm font-bold">
                    <span>⏳</span>
                    <span>STAGE 2</span>
                  </div>
                  
                  <div className="mt-4">
                    <h3 className="text-2xl font-bold text-yellow-400 mb-4">Coming Soon</h3>
                    <p className="text-gray-300 mb-6 leading-relaxed">
                      Top voted products enter the pipeline. We negotiate with suppliers and prepare for the big drop. Track the progress in real-time.
                    </p>
                    
                    {/* Status Box */}
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
                      <div className="text-sm text-yellow-300 mb-1">In Pipeline</div>
                      <div className="text-3xl font-bold text-yellow-400">{comingSoonProducts.length} products</div>
                    </div>
                    
                    <Link href="/coming-soon" legacyBehavior>
                      <a className="block w-full text-center bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-6 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/30">
                        See Progress →
                      </a>
                    </Link>
                  </div>
                </div>
                
                {/* Arrow to next stage (desktop only) */}
                <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 text-4xl text-green-400 z-10">
                  →
                </div>
              </div>

              {/* Stage 3: Live Guild Drops */}
              <div className="relative group">
                <div className="bg-gradient-to-br from-green-900/40 to-zinc-900/60 border-2 border-green-500/30 rounded-2xl p-8 h-full hover:border-green-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/20">
                  {/* Stage Badge */}
                  <div className="absolute -top-3 left-6 flex items-center gap-2 bg-green-500 text-black px-4 py-1 rounded-full text-sm font-bold">
                    <span>⚔️</span>
                    <span>STAGE 3</span>
                  </div>
                  
                  <div className="mt-4">
                    <h3 className="text-2xl font-bold text-green-400 mb-4">Live Guild Drops</h3>
                    <p className="text-gray-300 mb-6 leading-relaxed">
                      Products go live at guild-negotiated prices. Buy with confidence knowing you're getting the best deal available anywhere.
                    </p>
                    
                    {/* Status Box */}
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
                      <div className="text-sm text-green-300 mb-1">Active Drops</div>
                      <div className="text-3xl font-bold text-green-400">{liveProducts.length} live now</div>
                    </div>
                    
                    <Link href="/community-drops" legacyBehavior>
                      <a className="block w-full text-center bg-green-500 hover:bg-green-600 text-black font-bold py-3 px-6 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-green-500/30">
                        Join Drops →
                      </a>
                    </Link>
                  </div>
                </div>
                
                {/* Checkmark (desktop only) */}
                <div className="hidden lg:block absolute top-1/2 -right-8 transform -translate-y-1/2 text-4xl text-green-400 z-10">
                  ✓
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Power of Guild Unity Section */}
        <section className="relative py-20 px-4 sm:px-6 border-t border-yellow-400/10 bg-gradient-to-b from-transparent to-zinc-950/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <blockquote className="text-3xl sm:text-4xl text-yellow-200 mb-6 italic playfair-heading-light">
                "Alone, you're just a buyer. Together, you're a guild."
              </blockquote>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Transform from an isolated shopper into a powerful collective with shared goals and unstoppable purchasing power.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Shopping Alone */}
              <div className="bg-gradient-to-br from-red-900/20 to-zinc-900/40 border border-red-500/20 rounded-2xl p-8">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-6 mx-auto">
                  <span className="text-3xl">👤</span>
                </div>
                <h3 className="text-2xl font-bold text-red-400 mb-4 text-center">Shopping Alone</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-gray-300">
                    <span className="text-red-400 mt-1">✗</span>
                    <span>Pay full retail prices</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-300">
                    <span className="text-red-400 mt-1">✗</span>
                    <span>Limited product selection</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-300">
                    <span className="text-red-400 mt-1">✗</span>
                    <span>No voice in what's offered</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-300">
                    <span className="text-red-400 mt-1">✗</span>
                    <span>No collective power</span>
                  </li>
                </ul>
              </div>

              {/* Guild Transformation */}
              <div className="bg-gradient-to-br from-yellow-900/30 to-zinc-900/40 border-2 border-yellow-500/40 rounded-2xl p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 to-transparent"></div>
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-yellow-500/30 rounded-full flex items-center justify-center mb-6 mx-auto animate-pulse-slow">
                    <span className="text-3xl">⚡</span>
                  </div>
                  <h3 className="text-2xl font-bold text-yellow-400 mb-4 text-center">Guild Transformation</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3 text-gray-200">
                      <span className="text-yellow-400 mt-1">→</span>
                      <span>Democratic marketplace</span>
                    </li>
                    <li className="flex items-start gap-3 text-gray-200">
                      <span className="text-yellow-400 mt-1">→</span>
                      <span>Collective negotiation</span>
                    </li>
                    <li className="flex items-start gap-3 text-gray-200">
                      <span className="text-yellow-400 mt-1">→</span>
                      <span>Community-driven selection</span>
                    </li>
                    <li className="flex items-start gap-3 text-gray-200">
                      <span className="text-yellow-400 mt-1">→</span>
                      <span>Shared prosperity</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Guild Benefits */}
              <div className="bg-gradient-to-br from-green-900/20 to-zinc-900/40 border border-green-500/20 rounded-2xl p-8">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-6 mx-auto">
                  <span className="text-3xl">🏰</span>
                </div>
                <h3 className="text-2xl font-bold text-green-400 mb-4 text-center">Guild Benefits</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-gray-300">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>Save up to 50% on products</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-300">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>Products curated by community</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-300">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>Exclusive member perks</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-300">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>Unlock tier rewards</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Guild Membership CTA */}
        <section className="relative py-20 px-4 sm:px-6 border-t border-yellow-400/10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-white playfair-heading">
              Ready to Join the Guild?
            </h2>
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
              Be part of the marketplace revolution. Vote on products, save money, and experience the power of collective buying.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" legacyBehavior>
                <a className="inline-block font-bold px-12 py-4 rounded-xl bg-yellow-400 text-black hover:bg-yellow-300 transition-all text-lg shadow-xl shadow-yellow-400/30 hover:scale-105">
                  Join the Guild
                </a>
              </Link>
              <Link href="/voting" legacyBehavior>
                <a className="inline-block font-bold px-12 py-4 rounded-xl border-2 border-yellow-400 text-yellow-400 hover:bg-yellow-400/10 transition-all text-lg">
                  Start Voting
                </a>
              </Link>
            </div>
          </div>
        </section>

        {/* Membership Tiers Section */}
        <section className="relative py-20 px-4 sm:px-6 border-t border-yellow-400/10 bg-gradient-to-b from-zinc-950/50 to-transparent">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold mb-6 bg-gradient-to-r from-yellow-200 to-yellow-500 bg-clip-text text-transparent playfair-heading">
                Membership Tiers
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Choose the level that fits your needs. All tiers get access to guild pricing and voting rights.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Guild Initiate (Free) */}
              <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/60 border border-zinc-700 rounded-2xl p-8 hover:border-zinc-600 transition-all">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-zinc-700 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <span className="text-3xl">🛡️</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Guild Initiate</h3>
                  <div className="text-4xl font-bold text-white mb-1">Free</div>
                  <div className="text-gray-500 text-sm">Forever</div>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3 text-gray-300">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>Access to guild pricing</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-300">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>Voting rights on products</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-300">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>Community forum access</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-300">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>Basic support</span>
                  </li>
                </ul>
                <Link href="/register" legacyBehavior>
                  <a className="block w-full text-center bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-3 px-6 rounded-xl transition-all">
                    Join Free
                  </a>
                </Link>
              </div>

              {/* Guild Member (Most Popular) */}
              <div className="bg-gradient-to-br from-yellow-900/40 to-zinc-900/60 border-2 border-yellow-500/60 rounded-2xl p-8 relative hover:border-yellow-400/80 transition-all transform hover:scale-105">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-black px-4 py-1 rounded-full text-sm font-bold">
                  MOST POPULAR
                </div>
                <div className="text-center mb-6 mt-2">
                  <div className="w-16 h-16 bg-yellow-500/30 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <span className="text-3xl">⚔️</span>
                  </div>
                  <h3 className="text-2xl font-bold text-yellow-400 mb-2">Guild Member</h3>
                  <div className="text-4xl font-bold text-white mb-1">$9.99</div>
                  <div className="text-gray-400 text-sm">per month</div>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3 text-gray-200">
                    <span className="text-yellow-400 mt-1">✓</span>
                    <span><strong>Everything in Initiate</strong></span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-200">
                    <span className="text-yellow-400 mt-1">✓</span>
                    <span>Extra 5-10% discount on all drops</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-200">
                    <span className="text-yellow-400 mt-1">✓</span>
                    <span>Early access to new drops</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-200">
                    <span className="text-yellow-400 mt-1">✓</span>
                    <span>Priority support</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-200">
                    <span className="text-yellow-400 mt-1">✓</span>
                    <span>Member badge & perks</span>
                  </li>
                </ul>
                <Link href="/register" legacyBehavior>
                  <a className="block w-full text-center bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-yellow-500/30">
                    Upgrade Now
                  </a>
                </Link>
              </div>

              {/* MIGISTUS Elite */}
              <div className="bg-gradient-to-br from-purple-900/40 to-zinc-900/60 border border-purple-500/40 rounded-2xl p-8 hover:border-purple-400/60 transition-all">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-purple-500/30 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <span className="text-3xl">👑</span>
                  </div>
                  <h3 className="text-2xl font-bold text-purple-400 mb-2">MIGISTUS Elite</h3>
                  <div className="text-4xl font-bold text-white mb-1">$19.99</div>
                  <div className="text-gray-400 text-sm">per month</div>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3 text-gray-200">
                    <span className="text-purple-400 mt-1">✓</span>
                    <span><strong>Everything in Guild Member</strong></span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-200">
                    <span className="text-purple-400 mt-1">✓</span>
                    <span>Maximum discounts (up to 50%)</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-200">
                    <span className="text-purple-400 mt-1">✓</span>
                    <span>Exclusive elite-only drops</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-200">
                    <span className="text-purple-400 mt-1">✓</span>
                    <span>VIP customer support</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-200">
                    <span className="text-purple-400 mt-1">✓</span>
                    <span>Crown badge & premium perks</span>
                  </li>
                </ul>
                <Link href="/register" legacyBehavior>
                  <a className="block w-full text-center bg-purple-500 hover:bg-purple-400 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-purple-500/30">
                    Go Elite
                  </a>
                </Link>
              </div>
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
