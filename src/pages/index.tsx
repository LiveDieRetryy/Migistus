import { useState, useEffect } from "react";
import Head from "next/head";
import MainNavbar from "@/components/nav/MainNavbar";
import Link from "next/link";
import Image from "next/image";
import { Crown, Users, Star, Zap, Globe, Heart, Award, TrendingUp, Target, Rocket, Sparkles, CheckCircle2, ArrowRight, ShoppingCart, Vote, Package, Shield } from "lucide-react";

export default function HomePage() {
  const [isVisible, setIsVisible] = useState(false);
  const [liveStats, setLiveStats] = useState({
    totalMembers: 0,
    totalProducts: 0,
    totalVotes: 0,
    activeDrop: 0
  });

  useEffect(() => {
    setIsVisible(true);
    loadLiveStats();
    
    // Update stats every 30 seconds
    const interval = setInterval(loadLiveStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadLiveStats = async () => {
    try {
      let totalMembers = 0;
      let totalVotes = 0;
      let totalProducts = 0;
      let activeDrop = 0;

      // Get total members
      try {
        const usersResponse = await fetch('/api/users');
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          totalMembers = usersData.users?.filter((u: any) => !u.banned).length || 0;
        }
      } catch (e) {
        console.warn('Failed to load users:', e);
      }

      // Get total votes
      try {
        const statsResponse = await fetch('/api/stats');
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          totalVotes = statsData.votesCast || 0;
        }
      } catch (e) {
        console.warn('Failed to load stats:', e);
      }

      // Get total products from voting.json
      try {
        const votingResponse = await fetch('/data/voting.json');
        if (votingResponse.ok) {
          const votingData = await votingResponse.json();
          totalProducts = votingData.products?.length || 0;
        }
      } catch (e) {
        console.warn('Failed to load voting data:', e);
      }

      // Get active drops
      try {
        const dropsResponse = await fetch('/data/community-drops.json');
        if (dropsResponse.ok) {
          const dropsData = await dropsResponse.json();
          activeDrop = dropsData.products?.filter((p: any) => p.status === 'active').length || 0;
        }
      } catch (e) {
        console.warn('Failed to load drops data:', e);
      }

      setLiveStats({
        totalMembers,
        totalProducts,
        totalVotes,
        activeDrop
      });
    } catch (error) {
      console.error('Error loading live stats:', error);
    }
  };

  const stats = [
    { label: "Community Members", value: liveStats.totalMembers.toLocaleString(), icon: Users },
    { label: "Products to Vote", value: liveStats.totalProducts.toLocaleString(), icon: Vote },
    { label: "Votes Cast", value: liveStats.totalVotes.toLocaleString(), icon: TrendingUp },
    { label: "Active Drops", value: liveStats.activeDrop.toLocaleString(), icon: Sparkles }
  ];

  return (
    <>
      <Head>
        <title>MIGISTUS - Transform Shopping Through Community Power</title>
        <meta name="description" content="Join MIGISTUS - where community power meets smart shopping. Vote on products, unlock group discounts, and experience the revolution in collective buying." />
      </Head>
      
      <MainNavbar />
      
      <div className="min-h-screen bg-black text-white">
        {/* Twinkling stars background */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            {Array.from({ length: 80 }).map((_, i) => {
              const angle = (i / 80) * Math.PI * 2;
              const radius = 30 + (i % 3) * 10;
              const x = 50 + Math.cos(angle) * radius;
              const y = 50 + Math.sin(angle) * radius;
              const r = Math.random() * 1.7 + 0.2;
              const dur = (Math.random() * 2.5 + 1.2).toFixed(2);
              const moveDur = (Math.random() * 15 + 10).toFixed(2);
              const moveX = (Math.random() * 6 - 3).toFixed(2);
              const moveY = (Math.random() * 6 - 3).toFixed(2);
              return (
                <g key={i}>
                  <circle
                    cx={`${x}%`}
                    cy={`${y}%`}
                    r={r * 2.5}
                    fill="url(#gold-glow)"
                    opacity="0.22"
                  >
                    <animate
                      attributeName="cx"
                      values={`${x}%;${x + parseFloat(moveX)}%;${x}%`}
                      dur={`${moveDur}s`}
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="cy"
                      values={`${y}%;${y + parseFloat(moveY)}%;${y}%`}
                      dur={`${moveDur}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                  <circle
                    cx={`${x}%`}
                    cy={`${y}%`}
                    r={r}
                    fill="#ffe066"
                    opacity="0.85"
                  >
                    <animate
                      attributeName="cx"
                      values={`${x}%;${x + parseFloat(moveX)}%;${x}%`}
                      dur={`${moveDur}s`}
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="cy"
                      values={`${y}%;${y + parseFloat(moveY)}%;${y}%`}
                      dur={`${moveDur}s`}
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.85;0.15;0.85;0.15;0.85"
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

        {/* Hero Section with Animated Background */}
        <div className="relative overflow-hidden bg-gradient-to-b from-zinc-950/90 via-zinc-900/80 to-zinc-900/60">
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
          
          <div className={`relative max-w-7xl mx-auto px-6 py-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="text-center">
              <h1 className="text-7xl md:text-8xl lg:text-9xl font-extrabold mb-6">
                <span className="bg-gradient-to-b from-[#FFF4A3] via-[#F4D03F] to-[#C29D0B] bg-clip-text text-transparent" style={{
                  textShadow: `
                    0 1px 0 #E8C547,
                    0 2px 0 #D4AF37,
                    0 3px 0 #C29D0B,
                    0 4px 0 #A88B0D,
                    0 5px 0 #8B7209,
                    0 6px 5px rgba(0,0,0,.2),
                    0 8px 8px rgba(0,0,0,.15),
                    0 10px 10px rgba(0,0,0,.1),
                    inset 0 -1px 3px rgba(139,105,20,.3),
                    0 0 20px rgba(255,223,0,.3),
                    0 0 40px rgba(255,215,0,.15),
                    1px 1px 3px rgba(255,255,255,.3),
                    -1px -1px 2px rgba(139,105,20,.4)
                  `,
                  WebkitTextStroke: '1px rgba(194,157,11,.3)',
                  filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.25)) drop-shadow(0 0 20px rgba(255,215,0,0.4)) brightness(1.1) contrast(1.15)',
                  background: 'linear-gradient(135deg, #FFF9C4 0%, #F4D03F 20%, #DAA520 40%, #B8941D 60%, #8B6914 80%, #705B07 100%)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text'
                }}>
                  MIGISTUS
                </span>
              </h1>
              
              <div className="flex items-center justify-center gap-4 mb-8">
                <div className="h-0.5 w-24 md:w-32 bg-gradient-to-r from-transparent to-yellow-400"></div>
                <p className="text-3xl md:text-4xl font-bold tracking-wide">
                  <span className="bg-gradient-to-b from-[#FFF4A3] via-[#F4D03F] to-[#C29D0B] bg-clip-text text-transparent" style={{
                    textShadow: `
                      0 1px 0 #E8C547,
                      0 2px 0 #D4AF37,
                      0 3px 0 #C29D0B,
                      0 4px 0 #A88B0D,
                      0 5px 0 #8B7209,
                      0 6px 5px rgba(0,0,0,.2),
                      0 8px 8px rgba(0,0,0,.15),
                      0 10px 10px rgba(0,0,0,.1),
                      inset 0 -1px 3px rgba(139,105,20,.3),
                      0 0 20px rgba(255,223,0,.3),
                      0 0 40px rgba(255,215,0,.15),
                      1px 1px 3px rgba(255,255,255,.3),
                      -1px -1px 2px rgba(139,105,20,.4)
                    `,
                    WebkitTextStroke: '1px rgba(194,157,11,.3)',
                    filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.25)) drop-shadow(0 0 20px rgba(255,215,0,0.4)) brightness(1.1) contrast(1.15)',
                    background: 'linear-gradient(135deg, #FFF9C4 0%, #F4D03F 20%, #DAA520 40%, #B8941D 60%, #8B6914 80%, #705B07 100%)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text'
                  }}>
                    The Guild Marketplace
                  </span>
                </p>
                <div className="h-0.5 w-24 md:w-32 bg-gradient-to-l from-transparent to-yellow-400"></div>
              </div>

              {/* Animated Logo */}
              <div className="mb-8 flex justify-center">
                <div className="relative group cursor-pointer" style={{width: 260, height: 260}}>
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
                      width={220}
                      height={220}
                      className="object-contain bg-transparent drop-shadow-2xl"
                      priority
                    />
                  </div>
                </div>
              </div>
              
              <blockquote className="text-3xl md:text-4xl text-yellow-200 mb-6 max-w-4xl mx-auto leading-relaxed italic font-serif">
                "Alone, you're just a buyer. Together, you're a guild."
              </blockquote>
              
              <p className="text-xl text-zinc-300 max-w-4xl mx-auto leading-relaxed mb-8">
                Join the first democratic marketplace where your voice shapes what products get offered. 
                Experience the power of collective buying with thousands of guild members.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Link href="/register" className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-4 px-10 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg shadow-yellow-500/30">
                  Join the Guild
                </Link>
                <Link href="/voting" className="border-2 border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-black font-bold py-4 px-10 rounded-xl transition-all duration-300 hover:scale-105">
                  Start Voting
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
                {stats.map((stat, index) => (
                  <div 
                    key={stat.label}
                    className={`bg-zinc-900/60 backdrop-blur-sm border border-yellow-500/30 rounded-xl p-6 transition-all duration-500 hover:scale-105 hover:border-yellow-500/60 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                    style={{ transitionDelay: `${index * 100}ms` }}
                  >
                    <stat.icon className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
                    <div className="text-3xl font-bold text-yellow-400 mb-1">{stat.value}</div>
                    <div className="text-sm text-zinc-400">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>


        {/* How It Works Section */}
        <section className="py-24 bg-zinc-900/60">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full px-4 py-2 mb-6">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400 text-sm font-semibold">The Process</span>
              </div>
              
              <h2 className="text-5xl font-bold text-white mb-4">
                How <span className="text-yellow-400">MIGISTUS</span> Works
              </h2>
              
              <p className="text-xl text-zinc-300 max-w-2xl mx-auto">
                Four simple steps to unlock the power of collective buying
              </p>
            </div>

            <div className="relative max-w-4xl mx-auto">
              {/* Connection Line */}
              <div className="absolute left-8 top-16 bottom-16 w-0.5 bg-gradient-to-b from-blue-500 via-yellow-500 to-green-500 hidden md:block" />

              <div className="space-y-12">
                {/* Step 1 */}
                <div className="relative flex items-start gap-8">
                  <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg shadow-blue-500/50 z-10">
                    1
                  </div>
                  <div className="flex-1 bg-gradient-to-r from-zinc-900/90 to-zinc-800/50 border border-zinc-700 rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-300 group">
                    <div className="flex items-center gap-3 mb-3">
                      <Vote className="w-8 h-8 text-blue-400" />
                      <h3 className="text-2xl font-bold text-blue-300 group-hover:text-blue-400 transition-colors">
                        Vote on Products
                      </h3>
                    </div>
                    <p className="text-zinc-300 text-lg leading-relaxed">
                      Browse our curated catalog and vote for products you want. Your vote signals demand to suppliers 
                      and helps determine which products become live drops. Democracy in action.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="relative flex items-start gap-8">
                  <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 text-black rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg shadow-yellow-500/50 z-10">
                    2
                  </div>
                  <div className="flex-1 bg-gradient-to-r from-zinc-900/90 to-zinc-800/50 border border-zinc-700 rounded-2xl p-8 hover:border-yellow-500/50 transition-all duration-300 group">
                    <div className="flex items-center gap-3 mb-3">
                      <Users className="w-8 h-8 text-yellow-400" />
                      <h3 className="text-2xl font-bold text-yellow-300 group-hover:text-yellow-400 transition-colors">
                        Watch Prices Drop
                      </h3>
                    </div>
                    <p className="text-zinc-300 text-lg leading-relaxed">
                      When products go live, join the group buy and watch pricing tiers unlock in real-time. 
                      More buyers = better prices for everyone. Collective bargaining at its finest.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="relative flex items-start gap-8">
                  <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg shadow-purple-500/50 z-10">
                    3
                  </div>
                  <div className="flex-1 bg-gradient-to-r from-zinc-900/90 to-zinc-800/50 border border-zinc-700 rounded-2xl p-8 hover:border-purple-500/50 transition-all duration-300 group">
                    <div className="flex items-center gap-3 mb-3">
                      <Heart className="w-8 h-8 text-purple-400" />
                      <h3 className="text-2xl font-bold text-purple-300 group-hover:text-purple-400 transition-colors">
                        Join the Community
                      </h3>
                    </div>
                    <p className="text-zinc-300 text-lg leading-relaxed">
                      Connect with other buyers, discuss products, share experiences, and build relationships. 
                      Follow members and get notified about drops that match your interests.
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="relative flex items-start gap-8">
                  <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg shadow-green-500/50 z-10">
                    4
                  </div>
                  <div className="flex-1 bg-gradient-to-r from-zinc-900/90 to-zinc-800/50 border border-zinc-700 rounded-2xl p-8 hover:border-green-500/50 transition-all duration-300 group">
                    <div className="flex items-center gap-3 mb-3">
                      <Package className="w-8 h-8 text-green-400" />
                      <h3 className="text-2xl font-bold text-green-300 group-hover:text-green-400 transition-colors">
                        Receive Your Order
                      </h3>
                    </div>
                    <p className="text-zinc-300 text-lg leading-relaxed">
                      Orders ship directly to your door with full tracking. Manage everything through your 
                      personalized dashboard. Enjoy premium products at unbeatable prices.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Product Lifecycle Section */}
        <section className="py-24 bg-zinc-900/40">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-bold text-white mb-4">
                The Product <span className="text-yellow-400">Lifecycle</span>
              </h2>
              
              <p className="text-xl text-zinc-300 max-w-2xl mx-auto">
                From community voting to your doorstep
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Stage 1: Voting */}
              <div className="relative group">
                <div className="bg-gradient-to-br from-blue-900/40 to-zinc-900/60 border-2 border-blue-500/30 rounded-2xl p-8 h-full hover:border-blue-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20">
                  <div className="absolute -top-3 left-6 flex items-center gap-2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                    <span>🗳️</span>
                    <span>STAGE 1</span>
                  </div>
                  
                  <div className="mt-4">
                    <h3 className="text-2xl font-bold text-blue-400 mb-4">Voting</h3>
                    <p className="text-gray-300 mb-6 leading-relaxed">
                      Community votes on proposed products. Top voted items move to the next stage. 
                      Your voice matters here.
                    </p>
                    
                    <Link href="/voting" className="block w-full text-center bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300">
                      Start Voting →
                    </Link>
                  </div>
                </div>
              </div>

              {/* Stage 2: Coming Soon */}
              <div className="relative group">
                <div className="bg-gradient-to-br from-yellow-900/40 to-zinc-900/60 border-2 border-yellow-500/30 rounded-2xl p-8 h-full hover:border-yellow-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-yellow-500/20">
                  <div className="absolute -top-3 left-6 flex items-center gap-2 bg-yellow-500 text-black px-4 py-1 rounded-full text-sm font-bold">
                    <span>⏳</span>
                    <span>STAGE 2</span>
                  </div>
                  
                  <div className="mt-4">
                    <h3 className="text-2xl font-bold text-yellow-400 mb-4">Coming Soon</h3>
                    <p className="text-gray-300 mb-6 leading-relaxed">
                      We negotiate with suppliers and prepare for launch. Track progress and get ready 
                      for the drop.
                    </p>
                    
                    <Link href="/coming-soon" className="block w-full text-center bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-6 rounded-xl transition-all duration-300">
                      Track Progress →
                    </Link>
                  </div>
                </div>
              </div>

              {/* Stage 3: Live Drops */}
              <div className="relative group">
                <div className="bg-gradient-to-br from-green-900/40 to-zinc-900/60 border-2 border-green-500/30 rounded-2xl p-8 h-full hover:border-green-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/20">
                  <div className="absolute -top-3 left-6 flex items-center gap-2 bg-green-500 text-black px-4 py-1 rounded-full text-sm font-bold">
                    <span>⚔️</span>
                    <span>STAGE 3</span>
                  </div>
                  
                  <div className="mt-4">
                    <h3 className="text-2xl font-bold text-green-400 mb-4">Live Drops</h3>
                    <p className="text-gray-300 mb-6 leading-relaxed">
                      Products go live at guild-negotiated prices. Buy with confidence at prices that 
                      beat retail.
                    </p>
                    
                    <Link href="/community-drops" className="block w-full text-center bg-green-500 hover:bg-green-600 text-black font-bold py-3 px-6 rounded-xl transition-all duration-300">
                      Shop Now →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose MIGISTUS Section */}
        <section className="py-24 bg-zinc-900/60">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full px-4 py-2 mb-6">
                <Shield className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400 text-sm font-semibold">Why MIGISTUS</span>
              </div>
              
              <h2 className="text-5xl font-bold text-white mb-4">
                What Makes Us <span className="text-yellow-400">Different</span>
              </h2>
              
              <p className="text-xl text-zinc-300 max-w-2xl mx-auto">
                Built on principles that put the community first
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="group bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 border border-zinc-700 rounded-2xl p-8 hover:border-yellow-500/50 transition-all duration-300 hover:scale-105">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Users className="w-8 h-8 text-black" />
                </div>
                <h3 className="text-2xl font-bold text-yellow-300 mb-4">Collective Power</h3>
                <p className="text-zinc-300 leading-relaxed">
                  When thousands unite behind a product, suppliers listen and prices drop. This is the power 
                  of organized demand transforming individual buyers into a force.
                </p>
              </div>

              <div className="group bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 border border-zinc-700 rounded-2xl p-8 hover:border-purple-500/50 transition-all duration-300 hover:scale-105">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-purple-300 mb-4">Democratic Selection</h3>
                <p className="text-zinc-300 leading-relaxed">
                  You decide what products we offer. No corporate algorithms pushing unwanted items. 
                  Every product is community-voted and community-approved.
                </p>
              </div>

              <div className="group bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 border border-zinc-700 rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-300 hover:scale-105">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-blue-300 mb-4">Full Transparency</h3>
                <p className="text-zinc-300 leading-relaxed">
                  No hidden fees, no tricks, no fine print. See exactly how pricing works and track your 
                  savings in real-time. Honesty builds trust.
                </p>
              </div>

              <div className="group bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 border border-zinc-700 rounded-2xl p-8 hover:border-green-500/50 transition-all duration-300 hover:scale-105">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-green-300 mb-4">Quality Guaranteed</h3>
                <p className="text-zinc-300 leading-relaxed">
                  Every product is vetted, every supplier verified. We don't compromise on quality. 
                  Premium products at prices that beat the market.
                </p>
              </div>

              <div className="group bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 border border-zinc-700 rounded-2xl p-8 hover:border-red-500/50 transition-all duration-300 hover:scale-105">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-red-300 mb-4">Smart Technology</h3>
                <p className="text-zinc-300 leading-relaxed">
                  Real-time updates, intelligent matching, automated tier unlocks. Technology that works 
                  for you, making group buying seamless and effortless.
                </p>
              </div>

              <div className="group bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 border border-zinc-700 rounded-2xl p-8 hover:border-orange-500/50 transition-all duration-300 hover:scale-105">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-orange-300 mb-4">Community First</h3>
                <p className="text-zinc-300 leading-relaxed">
                  Your feedback shapes our roadmap. Your needs drive our features. Every decision starts 
                  with: "Is this good for our community?"
                </p>
              </div>
            </div>
            
            {/* Learn More Button */}
            <div className="flex justify-center mt-12">
              <Link
                href="/about"
                className="group inline-flex items-center gap-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-bold px-8 py-4 rounded-xl hover:from-yellow-400 hover:to-yellow-500 transition-all duration-300 shadow-lg shadow-yellow-500/25 hover:shadow-yellow-500/40 hover:scale-105"
              >
                <span className="text-lg">Learn More About MIGISTUS</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </section>

        {/* Final CTA with Membership Tiers */}
        <section className="py-24 bg-gradient-to-b from-zinc-900/40 to-black">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <div className="flex justify-center mb-8">
                <div className="p-4 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl">
                  <Crown className="w-12 h-12 text-black" />
                </div>
              </div>
              
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Join the <span className="text-yellow-400">Guild</span> Today
              </h2>
              
              <p className="text-xl text-zinc-300 mb-4 max-w-2xl mx-auto leading-relaxed">
                Be part of the marketplace revolution. Vote on products, save money, and experience 
                the power of collective buying.
              </p>
              
              <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
                Choose the level that fits your needs. All tiers get access to guild pricing and voting rights.
              </p>
            </div>

            {/* Membership Tiers Grid */}
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              {/* Guild Initiate (Free) */}
              <div className="bg-gradient-to-br from-zinc-900/90 to-zinc-800/80 border border-zinc-700 rounded-2xl p-8 hover:border-zinc-600 transition-all backdrop-blur-sm">
                <div className="text-center mb-6">
                  <div className="w-14 h-14 bg-zinc-700 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <span className="text-2xl">🛡️</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Guild Initiate</h3>
                  <div className="text-3xl font-bold text-white mb-1">Free</div>
                  <div className="text-gray-500 text-sm">Forever</div>
                </div>
                <ul className="space-y-2 mb-6 text-sm">
                  <li className="flex items-start gap-2 text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Access to guild pricing</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Voting rights on products</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Community forum access</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Basic support</span>
                  </li>
                </ul>
                <Link href="/register" className="block w-full text-center bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-3 px-6 rounded-xl transition-all">
                  Join Free
                </Link>
              </div>

              {/* Guild Member (Most Popular) */}
              <div className="bg-gradient-to-br from-yellow-900/40 to-zinc-900/80 border-2 border-yellow-500/60 rounded-2xl p-8 relative hover:border-yellow-400/80 transition-all transform hover:scale-105 backdrop-blur-sm">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-black px-4 py-1 rounded-full text-xs font-bold">
                  MOST POPULAR
                </div>
                <div className="text-center mb-6 mt-2">
                  <div className="w-14 h-14 bg-yellow-500/30 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <span className="text-2xl">⚔️</span>
                  </div>
                  <h3 className="text-xl font-bold text-yellow-400 mb-2">Guild Member</h3>
                  <div className="text-3xl font-bold text-white mb-1">$9.99</div>
                  <div className="text-gray-400 text-sm">per month</div>
                </div>
                <ul className="space-y-2 mb-6 text-sm">
                  <li className="flex items-start gap-2 text-gray-200">
                    <CheckCircle2 className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <span><strong>Everything in Initiate</strong></span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-200">
                    <CheckCircle2 className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <span>Early access to new drops</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-200">
                    <CheckCircle2 className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <span>Priority support</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-200">
                    <CheckCircle2 className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <span>Member badge & perks</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-200">
                    <CheckCircle2 className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <span>Enhanced features</span>
                  </li>
                </ul>
                <Link href="/account/subscription" className="block w-full text-center bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-yellow-500/30">
                  Upgrade Now
                </Link>
              </div>

              {/* MIGISTUS Elite */}
              <div className="bg-gradient-to-br from-purple-900/40 to-zinc-900/80 border border-purple-500/40 rounded-2xl p-8 hover:border-purple-400/60 transition-all backdrop-blur-sm">
                <div className="text-center mb-6">
                  <div className="w-14 h-14 bg-purple-500/30 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <span className="text-2xl">👑</span>
                  </div>
                  <h3 className="text-xl font-bold text-purple-400 mb-2">MIGISTUS Elite</h3>
                  <div className="text-3xl font-bold text-white mb-1">$19.99</div>
                  <div className="text-gray-400 text-sm">per month</div>
                </div>
                <ul className="space-y-2 mb-6 text-sm">
                  <li className="flex items-start gap-2 text-gray-200">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <span><strong>Everything in Guild Member</strong></span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-200">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <span>Exclusive elite-only drops</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-200">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <span>VIP customer support</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-200">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <span>Crown badge & premium perks</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-200">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <span>Premium features access</span>
                  </li>
                </ul>
                <Link href="/account/subscription" className="block w-full text-center bg-purple-500 hover:bg-purple-400 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-purple-500/30">
                  Go Elite
                </Link>
              </div>
            </div>

            <div className="text-center text-sm text-zinc-400">
              No credit card required • {liveStats.totalMembers.toLocaleString()}+ members already joined • Free tier available forever
            </div>
          </div>
        </section>
      </div>

      <style jsx>{`
        @keyframes float-particle {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
          25% { transform: translate(10px, -15px) scale(1.2); opacity: 0.6; }
          50% { transform: translate(-10px, -25px) scale(0.8); opacity: 0.4; }
          75% { transform: translate(15px, -10px) scale(1.1); opacity: 0.5; }
        }
        .animate-float-particle {
          animation: float-particle linear infinite;
        }
      `}</style>
    </>
  );
}
