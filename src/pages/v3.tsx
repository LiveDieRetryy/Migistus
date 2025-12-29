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

          <div className="relative z-10 max-w-6xl mx-auto">
            {/* Professional Guild Header */}
            <div className="text-center mb-20 animate-fade-in-up">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 rounded-full px-4 py-2 mb-8">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                <span className="text-yellow-400 text-sm font-semibold tracking-wide">MEMBER-OWNED MARKETPLACE</span>
              </div>
              
              <div className="mb-8">
                <h1 className="text-7xl sm:text-8xl lg:text-9xl font-black mb-4 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text text-transparent tracking-tight">
                  MIGISTUS
                </h1>
                <div className="text-xl sm:text-2xl text-yellow-400/80 font-medium tracking-wider mb-8">
                  THE GUILD MARKETPLACE
                </div>
              </div>
              
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight max-w-4xl mx-auto">
                The first marketplace where
                <span className="block text-yellow-400">buyers set the prices.</span>
              </h2>
              
              <p className="text-xl sm:text-2xl text-zinc-400 mb-12 max-w-3xl mx-auto leading-relaxed">
                Vote on products. Unite with thousands. Negotiate as one.
                <br/>
                <span className="text-white font-medium">That's the power of the guild.</span>
              </p>
              
              {/* Professional Stats Bar */}
              <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto mb-12 p-6 bg-zinc-900/60 border border-yellow-400/10 rounded-2xl backdrop-blur-sm">
                <div className="text-center border-r border-zinc-700">
                  <div className="text-3xl sm:text-4xl font-bold text-yellow-400 mb-1">{totalUsers > 0 ? totalUsers.toLocaleString() + '+' : '10K+'}</div>
                  <div className="text-xs sm:text-sm text-zinc-500 uppercase tracking-wider">Guild Members</div>
                </div>
                <div className="text-center border-r border-zinc-700">
                  <div className="text-3xl sm:text-4xl font-bold text-green-400 mb-1">30-50%</div>
                  <div className="text-xs sm:text-sm text-zinc-500 uppercase tracking-wider">Avg. Savings</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-blue-400 mb-1">{votingProducts.length > 0 ? votingProducts.length : '12'}+</div>
                  <div className="text-xs sm:text-sm text-zinc-500 uppercase tracking-wider">Live Votes</div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
                <Link href="/register" legacyBehavior>
                  <a className="group inline-flex items-center gap-2 font-bold px-10 py-4 rounded-xl bg-yellow-400 text-black hover:bg-yellow-300 transition-all text-lg shadow-xl shadow-yellow-400/20 hover:shadow-yellow-400/40 hover:scale-105">
                    <span>Join the Guild</span>
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </a>
                </Link>
                <Link href="/voting" legacyBehavior>
                  <a className="inline-flex items-center gap-2 font-semibold px-10 py-4 rounded-xl border-2 border-zinc-700 text-zinc-300 hover:border-yellow-400/50 hover:text-white transition-all text-lg">
                    <span>Explore Voting</span>
                  </a>
                </Link>
              </div>
              
              <div className="flex items-center justify-center gap-6 text-zinc-600 text-sm">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Free forever</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>No credit card</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Leave anytime</span>
                </div>
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

        {/* How the Guild Works */}
        <section className="relative py-20 px-4 sm:px-6 border-t border-yellow-400/10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 text-center">
              How the Guild Works
            </h2>
            <p className="text-center text-zinc-400 mb-12 max-w-2xl mx-auto">
              Every guild member has a voice. Every vote shapes the marketplace.
            </p>
            
            <div className="space-y-8">
              <div className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 font-bold text-xl">
                  🗳️
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Guild members vote</h3>
                  <p className="text-zinc-400">See something you want? Cast your vote. The guild decides what products we pursue together.</p>
                </div>
              </div>
              
              <div className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-yellow-500/20 border border-yellow-400/30 flex items-center justify-center text-yellow-400 font-bold text-xl">
                  ⚔️
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">The guild unites to buy</h3>
                  <p className="text-zinc-400">When enough members want it, we leverage our collective buying power to negotiate wholesale prices.</p>
                </div>
              </div>
              
              <div className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-500/20 border border-green-400/30 flex items-center justify-center text-green-400 font-bold text-xl">
                  💰
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Everyone saves together</h3>
                  <p className="text-zinc-400">The whole guild benefits. Usually 30-50% off retail. The bigger the guild, the better the price.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Premium Guild Invitation */}
        <section className="relative py-24 px-4 sm:px-6 border-t border-yellow-400/10">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-yellow-900/20 via-zinc-900/40 to-zinc-800/20 border border-yellow-400/20 rounded-3xl p-10 md:p-16 text-center relative overflow-hidden">
              {/* Decorative element */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-400/5 rounded-full -ml-32 -mb-32 blur-3xl"></div>
              
              <div className="relative z-10">
                <div className="inline-block bg-yellow-400/10 border border-yellow-400/30 rounded-full px-4 py-2 mb-6">
                  <span className="text-yellow-400 text-sm font-semibold tracking-wide">JOIN THE REVOLUTION</span>
                </div>
                
                <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                  Ready to stop paying retail?
                </h2>
                
                <p className="text-xl text-zinc-300 mb-8 max-w-2xl mx-auto">
                  Join {totalUsers > 0 ? totalUsers.toLocaleString() + '+' : '10,000+'} members who've discovered the power of collective buying.
                  <br/>
                  <span className="text-yellow-400 font-semibold">Your vote. Your price. Your marketplace.</span>
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                  <Link href="/register" legacyBehavior>
                    <a className="group inline-flex items-center gap-2 font-bold px-12 py-5 rounded-xl bg-yellow-400 text-black hover:bg-yellow-300 transition-all text-lg shadow-2xl shadow-yellow-400/30 hover:shadow-yellow-400/50 hover:scale-105">
                      <span>Join the Guild</span>
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </a>
                  </Link>
                </div>
                
                <div className="flex flex-wrap items-center justify-center gap-6 text-zinc-500 text-sm">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Always free</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Cancel anytime</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Start saving today</span>
                  </div>
                </div>
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
