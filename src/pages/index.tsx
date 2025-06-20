import { useState, useEffect } from "react";
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
};

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Fetch featured products
    fetch("/api/products")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.products)) {
          const featured = data.products
            .filter((p: Product) => p.featured)
            .slice(0, 3);
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

  return (
    <>
      <Head>
        <title>MIGISTUS - Premium Group Buying Platform</title>
        <meta name="description" content="Join the exclusive MIGISTUS community. Unlock premium products through collective buying power and tier-based rewards." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white overflow-hidden">
        <MainNavbar />

        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-400/5 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-400/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-yellow-400/3 to-purple-400/3 rounded-full blur-3xl animate-spin-slow"></div>
          </div>

          <div className={`relative z-10 text-center max-w-6xl mx-auto transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* Crown Icon */}
            <div className="mb-8 flex justify-center">
              <div className="relative">
                <div className="text-8xl sm:text-9xl animate-float">👑</div>
                <div className="absolute inset-0 text-8xl sm:text-9xl animate-float delay-500 opacity-30">✨</div>
              </div>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-6xl lg:text-8xl font-bold mb-6 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 bg-clip-text text-transparent leading-tight">
              MIGISTUS
            </h1>
            
            <p className="text-xl sm:text-2xl lg:text-3xl text-gray-300 mb-4 font-light">
              The <span className="text-yellow-400 font-semibold">Elite</span> Group Buying Experience
            </p>
            
            <p className="text-lg sm:text-xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
              Join an exclusive community where collective power unlocks premium products at unbeatable prices. 
              Earn your tier, multiply your influence, and experience luxury redefined.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <Link
                href="/drops"
                className="group relative bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black font-bold px-8 py-4 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-yellow-400/25 text-lg"
              >
                <span className="relative z-10">Explore Drops</span>
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-yellow-400 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
              
              <Link
                href="/register"
                className="group border-2 border-yellow-400/50 hover:border-yellow-400 text-yellow-400 hover:text-black hover:bg-yellow-400 font-semibold px-8 py-4 rounded-2xl transition-all duration-300 transform hover:scale-105 text-lg"
              >
                Join the Elite
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
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold text-yellow-400 mb-6">How MIGISTUS Works</h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Experience the power of collective buying through our sophisticated tier system
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: "🗳️",
                  title: "Vote & Pledge",
                  description: "Discover premium products and cast your vote. Your tier multiplies your voting power, giving elite members greater influence.",
                  color: "from-blue-400 to-blue-600"
                },
                {
                  icon: "⚔️",
                  title: "Unlock Tiers",
                  description: "Progress from Initiate to Guild to MIGISTUS Elite. Each tier unlocks exclusive perks, better prices, and enhanced privileges.",
                  color: "from-purple-400 to-purple-600"
                },
                {
                  icon: "💎",
                  title: "Enjoy Rewards",
                  description: "Access premium products at group-negotiated prices. Higher tiers receive better discounts and exclusive early access.",
                  color: "from-yellow-400 to-yellow-600"
                }
              ].map((step, index) => (
                <div key={index} className="relative group">
                  <div className="bg-zinc-900/50 backdrop-blur-sm border border-yellow-400/20 rounded-2xl p-8 hover:border-yellow-400/40 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl">
                    <div className={`w-16 h-16 bg-gradient-to-r ${step.color} rounded-2xl flex items-center justify-center text-2xl mb-6 mx-auto`}>
                      {step.icon}
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4 text-center">{step.title}</h3>
                    <p className="text-gray-300 leading-relaxed text-center">{step.description}</p>
                  </div>
                  
                  {/* Connection Line */}
                  {index < 2 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-yellow-400/50 to-transparent transform -translate-y-1/2"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tier Showcase */}
        <section className="relative py-24 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold text-yellow-400 mb-6">Membership Tiers</h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Ascend through the ranks and unlock exclusive privileges
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  name: "Initiate",
                  icon: "🛡️",
                  color: "from-gray-400 to-gray-600",
                  price: "Free",
                  features: ["Access to drops", "1x voting power", "Community chat", "Basic support"],
                  popular: false
                },
                {
                  name: "Guild",
                  icon: "⚔️",
                  color: "from-purple-400 to-purple-600",
                  price: "$9.99/mo",
                  features: ["All Initiate perks", "2x voting power", "Priority support", "5% additional discount", "Early access"],
                  popular: true
                },
                {
                  name: "MIGISTUS Elite",
                  icon: "👑",
                  color: "from-yellow-400 to-yellow-600",
                  price: "$19.99/mo",
                  features: ["All Guild perks", "4x voting power", "VIP support", "10% additional discount", "Exclusive drops", "Personal concierge"],
                  popular: false
                }
              ].map((tier, index) => (
                <div key={index} className={`relative ${tier.popular ? 'scale-105 z-10' : ''}`}>
                  {tier.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-black px-4 py-1 rounded-full text-sm font-bold">
                      Most Popular
                    </div>
                  )}
                  
                  <div className={`bg-zinc-900/70 backdrop-blur-sm border-2 ${tier.popular ? 'border-yellow-400' : 'border-yellow-400/20'} rounded-2xl p-8 h-full hover:border-yellow-400/60 transition-all duration-300`}>
                    <div className="text-center mb-8">
                      <div className={`w-20 h-20 bg-gradient-to-r ${tier.color} rounded-2xl flex items-center justify-center text-3xl mb-4 mx-auto`}>
                        {tier.icon}
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">{tier.name}</h3>
                      <div className="text-3xl font-bold text-yellow-400">{tier.price}</div>
                    </div>
                    
                    <ul className="space-y-3 mb-8">
                      {tier.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center text-gray-300">
                          <span className="text-yellow-400 mr-3">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                    
                    <Link
                      href="/register"
                      className={`block w-full text-center py-3 rounded-xl font-semibold transition-all duration-300 ${
                        tier.popular 
                          ? 'bg-yellow-400 text-black hover:bg-yellow-300' 
                          : 'border border-yellow-400/50 text-yellow-400 hover:bg-yellow-400 hover:text-black'
                      }`}
                    >
                      {tier.price === "Free" ? "Start Free" : "Upgrade Now"}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Drops */}
        {featuredProducts.length > 0 && (
          <section className="relative py-24 px-4 sm:px-6 bg-gradient-to-b from-zinc-900/50 to-transparent">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl sm:text-5xl font-bold text-yellow-400 mb-6">Featured Drops</h2>
                <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                  Exclusive products curated for the MIGISTUS community
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {featuredProducts.map((product) => (                  <Link
                    key={product.id}
                    href={`/products/${product.slug || slugify(product.name)}`}
                    className="group block"
                  >
                    <div className="bg-zinc-900/50 backdrop-blur-sm border border-yellow-400/20 rounded-2xl overflow-hidden hover:border-yellow-400/40 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl">
                      <div className="relative h-64 overflow-hidden">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                        <div className="absolute top-4 right-4 bg-yellow-400 text-black px-3 py-1 rounded-full text-sm font-bold">
                          ⭐ Staff Pick
                        </div>
                      </div>
                      
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-yellow-400 transition-colors">
                          {product.name}
                        </h3>
                        <p className="text-gray-400 mb-4 line-clamp-2">{product.description}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-300">
                            <span className="text-yellow-400 font-semibold">{product.votes}</span> votes
                          </div>
                          <div className="text-sm text-gray-300">
                            Goal: <span className="text-yellow-400 font-semibold">{product.goal}</span>
                          </div>
                        </div>
                        
                        <div className="mt-4 bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-yellow-400 to-yellow-300 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min((product.pledges / product.goal) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="text-center mt-12">
                <Link
                  href="/drops"
                  className="inline-block bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black font-bold px-8 py-4 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
                >
                  View All Drops
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Call to Action */}
        <section className="relative py-24 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-r from-zinc-900/80 to-zinc-800/80 backdrop-blur-sm border border-yellow-400/30 rounded-3xl p-12">
              <h2 className="text-4xl sm:text-5xl font-bold text-yellow-400 mb-6">
                Ready to Join the Elite?
              </h2>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Experience luxury group buying like never before. Start your journey from Initiate to MIGISTUS Elite.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/register"
                  className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black font-bold px-8 py-4 rounded-2xl transition-all duration-300 transform hover:scale-105 text-lg"
                >
                  Start Your Journey
                </Link>
                <Link
                  href="/about"
                  className="border-2 border-yellow-400/50 hover:border-yellow-400 text-yellow-400 hover:text-black hover:bg-yellow-400 font-semibold px-8 py-4 rounded-2xl transition-all duration-300 text-lg"
                >
                  Learn More
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
