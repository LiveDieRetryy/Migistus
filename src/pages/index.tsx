import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import MainNavbar from "@/components/nav/MainNavbar";
import Link from "next/link";
import Image from "next/image";

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
  goal: number;
  votes: number;
  featured: boolean;
  pledges: number;
  slug?: string;
  category: string;
  // Add stage for filtering
  stage?: string;
};

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // New: Tabs for product stages
  const [votingProducts, setVotingProducts] = useState<Product[]>([]);
  const [comingSoonProducts, setComingSoonProducts] = useState<Product[]>([]);
  const [liveProducts, setLiveProducts] = useState<Product[]>([]);

  const [showNavbar, setShowNavbar] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    // Fetch featured products
    fetch("/api/products")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.products)) {
          setVotingProducts(data.products.filter((p: Product) => p.stage === 'voting'));
          setComingSoonProducts(data.products.filter((p: Product) => p.stage === 'coming-soon'));
          setLiveProducts(data.products.filter((p: Product) => p.stage === 'community-drops' || p.stage === 'live'));
          // ...existing featured logic...
          const featured = data.products.filter((p: Product) => p.featured).slice(0, 3);
          setFeaturedProducts(featured);
        }
      })
      .catch(console.error);

    // Fetch stats
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

    // Trigger loading animation
    setTimeout(() => setIsLoaded(true), 100);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 80) {
        setShowNavbar(false); // scrolling down, hide
      } else {
        setShowNavbar(true); // scrolling up, show
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

    return (
      <>
        <Head>
          <title>MIGISTUS - Premium Group Buying Platform</title>
          <meta name="description" content="Join the exclusive MIGISTUS community. Unlock premium products through collective buying power and tier-based rewards." />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>

        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white overflow-hidden relative">
          {/* Twinkling Stars Background */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <svg width="100%" height="100%" className="w-full h-full" style={{ position: 'absolute', top: 0, left: 0 }}>
              {/* Generate more sporadic stars with golden glow */}
              {Array.from({ length: 60 }).map((_, i) => {
                // Use a seeded pseudo-random for consistent but more sporadic placement
                const angle = Math.random() * 2 * Math.PI;
                const radius = Math.pow(Math.random(), 1.7) * 55 + 20; // cluster some, push some out
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
  
          {/* Navbar with fade in/out on scroll */}
          <div className={`transition-opacity duration-500 fixed w-full z-30 top-0 left-0 ${showNavbar ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
            <MainNavbar />
          </div>
  
          {/* Hero Section */}
          <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6">
            <div className={`relative z-10 text-center max-w-6xl mx-auto transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              {/* Guild Icon (move glowing icon and background above header) */}
              <div className="mb-8 flex justify-center">
                <div className="relative animate-float flex items-center justify-center" style={{width: 240, height: 240}}>
                  {/* Glowing animated background directly behind the icon */}
                  <div className="absolute inset-0 z-0 animate-pulse" style={{
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, #FFD70055 0%, #FFD70022 60%, transparent 100%)',
                    filter: 'blur(24px)',
                    opacity: 0.8,
                  }} />
                  <Image
                    src="/Icons/groupbuying.png"
                    alt="Guild Icon"
                    width={220}
                    height={220}
                    className="object-contain bg-transparent relative z-10"
                    priority
                    style={{ background: 'none', border: 'none', borderRadius: 0, boxShadow: 'none' }}
                  />
                </div>
              </div>
              {/* Header Text */}
              <h1 className="text-4xl sm:text-6xl lg:text-8xl font-bold mb-2 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 bg-clip-text text-transparent leading-tight">
                Welcome to MIGISTUS
              </h1>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold mb-6 text-yellow-300 tracking-wide">
                The Guilded Marketplace
              </h2>
              <p className="text-lg sm:text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
                Migistus is not just a store. It’s a movement. A marketplace forged by the people, for the people — where unity drives down prices, and your voice helps shape what comes next.
              </p>
  
              {/* Guild Lifecycle Buttons (now as links) */}
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
                <Link href="/voting" legacyBehavior>
                  <a className={`group relative font-bold px-8 py-4 rounded-2xl transition-all duration-300 text-lg border-2 ${'voting' === 'voting' ? 'bg-blue-500 text-white border-blue-400 shadow-lg' : 'bg-zinc-900 text-blue-300 border-blue-700 hover:bg-blue-900'}`}>
                    🗳️ Vote
                  </a>
                </Link>
                <Link href="/coming-soon" legacyBehavior>
                  <a className={`group relative font-bold px-8 py-4 rounded-2xl transition-all duration-300 text-lg border-2 ${'coming-soon' === 'coming-soon' ? 'bg-yellow-400 text-black border-yellow-300 shadow-lg' : 'bg-zinc-900 text-yellow-300 border-yellow-700 hover:bg-yellow-900'}`}>
                    ⏳ Coming Soon
                  </a>
                </Link>
                <Link href="/community-drops" legacyBehavior>
                  <a className={`group relative font-bold px-8 py-4 rounded-2xl transition-all duration-300 text-lg border-2 ${'live' === 'live' ? 'bg-green-500 text-white border-green-400 shadow-lg' : 'bg-zinc-900 text-green-300 border-green-700 hover:bg-green-900'}`}>
                    ⚔️ Live Drops
                  </a>
                </Link>
              </div>
  
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-yellow-400 mb-2">{totalUsers.toLocaleString()}+</div>
                  <div className="text-gray-400 text-sm uppercase tracking-wider">Elite Members</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-yellow-400 mb-2">{totalVotes.toLocaleString()}+</div>
                  <div className="text-gray-400 text-sm uppercase tracking-wider">Votes Cast</div>
                </div>
                <div className="text-center col-span-2 md:col-span-1">
                  <div className="text-3xl sm:text-4xl font-bold text-yellow-400 mb-2">50+</div>
                  <div className="text-gray-400 text-sm uppercase tracking-wider">Premium Drops</div>
                </div>
              </div>
            </div>
  
            {/* Scroll Indicator */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
              <div className="w-6 h-10 border-2 border-yellow-400/50 rounded-full flex justify-center">
                <div className="w-1 h-3 bg-yellow-400 rounded-full mt-2 animate-pulse"></div>
              </div>
            </div>
          </section>

          {/* How It Works Section */}
          <section className="relative py-24 px-4 sm:px-6 bg-gradient-to-b from-transparent to-zinc-900/50">
            {/* ...rest of the How It Works section... */}
          </section>

          {/* Tier Showcase */}
          <section className="relative py-24 px-4 sm:px-6">
            {/* ...rest of the Tier Showcase section... */}
          </section>

          {/* Featured Drops */}
          {featuredProducts.length > 0 && (
            <section className="relative py-24 px-4 sm:px-6 bg-gradient-to-b from-zinc-900/50 to-transparent">
              {/* ...rest of the Featured Drops section... */}
            </section>
          )}

          {/* Call to Action */}
          <section className="relative py-24 px-4 sm:px-6">
            {/* ...rest of the Call to Action section... */}
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
          
          .animate-float {
            animation: float 6s ease-in-out infinite;
          }
          
          .animate-spin-slow {
            animation: spin-slow 20s linear infinite;
          }
          
          .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
    `}</style>
    </>
  );
}
