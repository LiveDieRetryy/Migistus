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
          <section className="relative flex flex-col items-center justify-center min-h-[70vh] px-4 sm:px-6 pt-32 pb-20 text-center bg-gradient-to-b from-zinc-950/90 to-zinc-900/60">
            <div className="relative z-10 max-w-3xl mx-auto">
              <h1 className="text-4xl sm:text-6xl font-extrabold mb-2 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 bg-clip-text text-transparent leading-tight drop-shadow-lg playfair-heading">
                Welcome to MIGISTUS
              </h1>
              <h2 className="text-xl sm:text-3xl font-semibold mb-10 text-yellow-300 tracking-wide drop-shadow playfair-heading-light">
                The Guilded Marketplace
              </h2>
              <div className="mb-10 flex justify-center">
                <div className="relative animate-float flex items-center justify-center" style={{width: 200, height: 200}}>
                  <div className="absolute inset-0 z-0 animate-pulse" style={{
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, #FFD70088 0%, #FFD70022 60%, transparent 100%)',
                    filter: 'blur(32px)',
                    opacity: 0.9,
                  }} />
                  <Image
                    src="/Icons/groupbuying.png"
                    alt="Guild Icon"
                    width={180}
                    height={180}
                    className="object-contain bg-transparent relative z-10 drop-shadow-xl"
                    priority
                  />
                </div>
              </div>
              <p className="text-lg sm:text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
                Migistus is not just a store. It’s a movement. A marketplace forged by the people, for the people — where unity drives down prices, and your voice helps shape what comes next.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-10">
                <Link href="/voting" legacyBehavior>
                  <a className="group font-bold px-8 py-4 rounded-2xl transition-all duration-300 text-lg border-2 bg-zinc-900 text-blue-300 border-blue-700 hover:bg-blue-900 hover:text-white shadow-md">
                    🗳️ Vote
                  </a>
                </Link>
                <Link href="/coming-soon" legacyBehavior>
                  <a className="group font-bold px-8 py-4 rounded-2xl transition-all duration-300 text-lg border-2 bg-zinc-900 text-yellow-300 border-yellow-700 hover:bg-yellow-900 hover:text-white shadow-md">
                    ⏳ Coming Soon
                  </a>
                </Link>
                <Link href="/community-drops" legacyBehavior>
                  <a className="group font-bold px-8 py-4 rounded-2xl transition-all duration-300 text-lg border-2 bg-zinc-900 text-green-300 border-green-700 hover:bg-green-900 hover:text-white shadow-md">
                    ⚔️ Live Drops
                  </a>
                </Link>
              </div>
              <div className="flex flex-wrap justify-center gap-8 mt-8">
                <div className="text-center">
                  <div className="text-4xl font-extrabold text-yellow-400 mb-2">{totalUsers.toLocaleString()}+</div>
                  <div className="text-gray-400 text-sm uppercase tracking-wider">Elite Members</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-extrabold text-yellow-400 mb-2">{totalVotes.toLocaleString()}+</div>
                  <div className="text-gray-400 text-sm uppercase tracking-wider">Votes Cast</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-extrabold text-yellow-400 mb-2">50+</div>
                  <div className="text-gray-400 text-sm uppercase tracking-wider">Premium Drops</div>
                </div>
              </div>
            </div>
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
              <div className="w-6 h-10 border-2 border-yellow-400/50 rounded-full flex justify-center">
                <div className="w-1 h-3 bg-yellow-400 rounded-full mt-2 animate-pulse"></div>
              </div>
            </div>
          </section>

          {/* How It Works Section */}
          <section className="relative py-20 px-4 sm:px-6 bg-gradient-to-b from-transparent to-zinc-900/50 border-t border-yellow-400/10">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-14">
                <h2 className="text-3xl sm:text-4xl font-bold text-yellow-400 mb-3">How Migistus Works</h2>
                <p className="text-lg text-zinc-300 max-w-2xl mx-auto">A simple, transparent process for the community to decide what comes next.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <div className="bg-zinc-900/80 border border-yellow-400/10 rounded-2xl p-8 shadow-lg flex flex-col items-center">
                  <div className="flex-shrink-0 w-14 h-14 bg-yellow-500 text-black rounded-full flex items-center justify-center text-2xl font-bold mb-4">1</div>
                  <h3 className="text-xl font-bold text-yellow-300 mb-2">Vote for Products</h3>
                  <p className="text-zinc-300 text-base leading-relaxed">Vote on what you want to see next. The most popular products move forward.</p>
                </div>
                <div className="bg-zinc-900/80 border border-yellow-400/10 rounded-2xl p-8 shadow-lg flex flex-col items-center">
                  <div className="flex-shrink-0 w-14 h-14 bg-yellow-500 text-black rounded-full flex items-center justify-center text-2xl font-bold mb-4">2</div>
                  <h3 className="text-xl font-bold text-yellow-300 mb-2">Join Group Buys</h3>
                  <p className="text-zinc-300 text-base leading-relaxed">When a product is unlocked, join the drop and buy together for the best price.</p>
                </div>
                <div className="bg-zinc-900/80 border border-yellow-400/10 rounded-2xl p-8 shadow-lg flex flex-col items-center">
                  <div className="flex-shrink-0 w-14 h-14 bg-yellow-500 text-black rounded-full flex items-center justify-center text-2xl font-bold mb-4">3</div>
                  <h3 className="text-xl font-bold text-yellow-300 mb-2">Unlock Rewards</h3>
                  <p className="text-zinc-300 text-base leading-relaxed">Bigger groups unlock better deals, exclusive perks, and early access for all.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Why Choose MIGISTUS Section */}
          <section className="relative py-16 px-4 sm:px-6 bg-gradient-to-b from-zinc-900/60 to-transparent border-t border-yellow-400/10">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-yellow-400 mb-4">Why Choose MIGISTUS?</h2>
              <blockquote className="italic text-xl text-yellow-200 mb-6">“Alone, you're just a buyer. Together, you're a guild.”</blockquote>
              <p className="text-lg text-zinc-300 leading-relaxed">
                Migistus challenges the standard retail model. It’s a platform where demand shapes supply, community unlocks savings, and every purchase is a shared conquest.
              </p>
            </div>
          </section>

          {/* Staff Picks Section */}
          <section className="relative py-20 px-4 sm:px-6 bg-gradient-to-b from-zinc-900/50 to-transparent border-t border-yellow-400/10">
            <div className="max-w-7xl mx-auto text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-yellow-400 mb-3">Staff Picks</h2>
              <p className="text-lg text-zinc-300 max-w-2xl mx-auto">Handpicked by our team for quality, value, and community excitement.</p>
            </div>
            {featuredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 max-w-5xl mx-auto">
                {featuredProducts.map(product => (
                  <div key={product.id} className="bg-zinc-900 border border-yellow-500/20 rounded-2xl p-8 flex flex-col items-center shadow-lg hover:scale-105 transition-transform">
                    <Image src={product.image} alt={product.name} width={180} height={180} className="mb-4 rounded-lg object-contain shadow" />
                    <h3 className="text-lg font-bold text-yellow-300 mb-2">{product.name}</h3>
                    <p className="text-zinc-300 text-base mb-4 line-clamp-2">{product.description}</p>
                    <Link href={`/drops/${product.slug || slugify(product.name)}`} legacyBehavior>
                      <a className="mt-auto inline-block px-6 py-2 rounded-lg bg-yellow-400 text-black font-semibold hover:bg-yellow-300 transition">View Drop</a>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-zinc-400 text-lg">No staff picks available yet. Check back soon!</div>
            )}
          </section>

          {/* Final Call to Action */}
          <section className="relative py-20 px-4 sm:px-6 border-t border-yellow-400/10">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-yellow-400 mb-3">Ready to Join the Guild?</h2>
              <p className="text-lg text-zinc-300 mb-8">Sign up today and help shape the future of group buying. Your vote, your perks, your community.</p>
              <Link href="/register" legacyBehavior>
                <a className="inline-block px-10 py-4 rounded-2xl bg-yellow-400 text-black font-extrabold text-xl shadow-lg hover:bg-yellow-300 transition">Join Now</a>
              </Link>
            </div>
          </section>

          {/* Membership Tiers Section (moved to bottom) */}
          <section className="relative py-20 px-4 sm:px-6 border-t border-yellow-400/10">
            <div className="max-w-5xl mx-auto text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-yellow-400 mb-3">Membership Tiers</h2>
              <p className="text-lg text-zinc-300 max-w-2xl mx-auto">Level up for more influence, perks, and rewards.</p>
            </div>
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
              {/* Initiate Tier */}
              <div className="bg-zinc-900 border border-yellow-400/20 rounded-2xl p-10 flex flex-col items-center shadow-lg hover:scale-105 transition-transform">
                <div className="mb-4"><Image src="/Icons/securecheckout.png" alt="Initiate" width={56} height={56} /></div>
                <h3 className="text-xl font-bold text-white mb-1">Initiate</h3>
                <div className="text-2xl font-bold text-yellow-400 mb-2">Free</div>
                <ul className="text-zinc-200 text-base mb-6 space-y-2 text-left">
                  <li>✓ Access to drops</li>
                  <li>✓ 1x voting power</li>
                  <li>✓ Community chat</li>
                  <li>✓ Basic support</li>
                </ul>
                <button className="w-full border border-yellow-400 text-yellow-400 font-semibold py-3 rounded-lg hover:bg-yellow-400 hover:text-black transition">Start Free</button>
              </div>
              {/* Guild Tier */}
              <div className="bg-zinc-900 border-2 border-purple-400 rounded-2xl p-10 flex flex-col items-center shadow-2xl relative hover:scale-105 transition-transform">
                <div className="mb-4"><Image src="/Icons/groupbuying.png" alt="Guild" width={56} height={56} /></div>
                <h3 className="text-xl font-bold text-white mb-1">Guild</h3>
                <div className="text-2xl font-bold text-yellow-400 mb-2">$9.99/mo</div>
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-yellow-400 text-black text-xs font-bold px-4 py-1 rounded-full shadow">Most Popular</div>
                <ul className="text-zinc-200 text-base mb-6 space-y-2 text-left">
                  <li>✓ All Initiate perks</li>
                  <li>✓ 2x voting power</li>
                  <li>✓ Priority support</li>
                  <li>✓ 5% additional discount</li>
                  <li>✓ Early access</li>
                </ul>
                <button className="w-full bg-yellow-400 text-black font-semibold py-3 rounded-lg hover:bg-yellow-300 transition">Upgrade Now</button>
              </div>
              {/* MIGISTUS Elite Tier */}
              <div className="bg-zinc-900 border-2 border-yellow-400 rounded-xl p-8 flex flex-col items-center shadow-2xl relative">
                <div className="mb-4"><Image src="/Icons/staffpicks.png" alt="MIGISTUS Elite" width={56} height={56} /></div>
                <h3 className="text-xl font-bold text-yellow-400 mb-1">MIGISTUS Elite</h3>
                <div className="text-2xl font-bold text-yellow-400 mb-2">$19.99/mo</div>
                <ul className="text-yellow-200 text-base mb-6 space-y-2 text-left">
                  <li>✓ All Guild perks</li>
                  <li>✓ 4x voting power</li>
                  <li>✓ VIP support</li>
                  <li>✓ 10% additional discount</li>
                  <li>✓ Exclusive drops</li>
                  <li>✓ Personal concierge</li>
                </ul>
                <button className="w-full border border-yellow-400 text-yellow-400 font-semibold py-3 rounded-lg hover:bg-yellow-400 hover:text-black transition">Upgrade Now</button>
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
          .playfair-heading {
            font-family: 'Playfair Display', serif !important;
            font-weight: 900;
            letter-spacing: 0.04em;
            text-transform: none;
            text-shadow: 0 2px 10px #00000011, 0 0 4px #b0b0b044, 0 0 6px #e0e0e015;
          }
          .playfair-heading-light {
            font-family: 'Playfair Display', serif !important;
            font-weight: 700;
            letter-spacing: 0.04em;
            text-transform: none;
            opacity: 0.92;
            text-shadow: 0 1px 8px #00000011, 0 0 4px #b0b0b066, 0 0 8px #e0e0e022;
          }
    `}</style>
    </>
  );
}
