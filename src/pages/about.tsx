import Head from "next/head";
import MainNavbar from "@/components/nav/MainNavbar";
import { Crown, Users, Shield, Star, Zap, Globe, Heart, Award, TrendingUp, Target, Rocket, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function AboutPage() {
  const [isVisible, setIsVisible] = useState(false);
  const [liveStats, setLiveStats] = useState({
    totalMembers: 0,
    totalProducts: 0,
    totalPledges: 0,
    totalSavings: 0
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
      // Get total members from API
      const usersResponse = await fetch('/api/users');
      const usersData = await usersResponse.json();
      const totalMembers = usersData.users?.filter((u: any) => !u.banned).length || 0;

      // Get total products from voting.json
      const votingResponse = await fetch('/data/voting.json');
      const votingData = await votingResponse.json();
      const totalProducts = votingData.products?.length || 0;

      // Get total pledges from pledges.json
      const pledgesResponse = await fetch('/data/pledges.json');
      const pledgesData = await pledgesResponse.json();
      const totalPledges = pledgesData.pledges?.length || 0;

      // Calculate total savings (sum of all pledge amounts)
      const totalSavings = pledgesData.pledges?.reduce((sum: number, pledge: any) => {
        return sum + (pledge.amount || 0);
      }, 0) || 0;

      setLiveStats({
        totalMembers,
        totalProducts,
        totalPledges,
        totalSavings
      });
    } catch (error) {
      console.error('Error loading live stats:', error);
    }
  };

  const stats = [
    { label: "Community Members", value: liveStats.totalMembers.toLocaleString(), icon: Users },
    { label: "Products Available", value: liveStats.totalProducts.toLocaleString(), icon: Star },
    { label: "Group Purchases", value: liveStats.totalPledges.toLocaleString(), icon: TrendingUp },
    { label: "Savings Generated", value: `$${liveStats.totalSavings.toLocaleString()}`, icon: Sparkles }
  ];

  return (
    <>
      <Head>
        <title>About Us - MIGISTUS | Revolutionizing Group Buying</title>
        <meta name="description" content="Join MIGISTUS - where community power meets smart shopping. Discover how we're changing the way people buy premium products together." />
      </Head>
      
      <MainNavbar />
      
      <div className="min-h-screen bg-black text-white">
        {/* Hero Section with Animated Background */}
        <div className="relative overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/20 via-black to-purple-900/20" />
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
          </div>
          
          <div className={`relative max-w-7xl mx-auto px-6 py-32 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="text-center">
              <div className="flex justify-center mb-8">
                <div className="p-4 bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 rounded-2xl backdrop-blur-sm border border-yellow-500/30">
                  <Target className="w-20 h-20 text-yellow-400" />
                </div>
              </div>
              
              <h1 className="text-7xl md:text-8xl font-bold mb-6">
                <span className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text text-transparent animate-gradient">
                  Our Mission
                </span>
              </h1>
              
              <p className="text-3xl text-yellow-300 mb-6 font-semibold">
                Revolutionizing Commerce Through Community Power
              </p>
              
              <p className="text-xl text-zinc-300 max-w-4xl mx-auto leading-relaxed mb-12">
                MIGISTUS was built on a simple belief: when people unite around shared goals, they unlock 
                unprecedented purchasing power. We're transforming the marketplace by giving communities the tools 
                to negotiate, collaborate, and access premium products at prices previously reserved for bulk buyers.
              </p>

              {/* Core Values */}
              <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                <div className={`bg-gradient-to-br from-blue-900/40 to-zinc-900/60 border border-blue-500/30 rounded-2xl p-8 transition-all duration-500 hover:scale-105 hover:border-blue-500/60 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                  <Shield className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-blue-300 mb-2 text-center">Transparency</h3>
                  <p className="text-zinc-300 text-center text-sm">
                    No hidden fees, no tricks. See exactly how pricing works and track your savings in real-time.
                  </p>
                </div>

                <div className={`bg-gradient-to-br from-yellow-900/40 to-zinc-900/60 border border-yellow-500/30 rounded-2xl p-8 transition-all duration-500 hover:scale-105 hover:border-yellow-500/60 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: '100ms' }}>
                  <Users className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-yellow-300 mb-2 text-center">Community First</h3>
                  <p className="text-zinc-300 text-center text-sm">
                    Every decision starts with: "Is this good for our community?" Your feedback shapes our roadmap.
                  </p>
                </div>

                <div className={`bg-gradient-to-br from-green-900/40 to-zinc-900/60 border border-green-500/30 rounded-2xl p-8 transition-all duration-500 hover:scale-105 hover:border-green-500/60 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: '200ms' }}>
                  <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-green-300 mb-2 text-center">Quality Guaranteed</h3>
                  <p className="text-zinc-300 text-center text-sm">
                    Every product is vetted, every supplier verified. Premium quality at unbeatable prices.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Our Story Section */}
        <section className="py-24 bg-gradient-to-b from-black to-zinc-900/50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full px-4 py-2 mb-6">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-400 text-sm font-semibold">Our Story</span>
                </div>
                
                <h2 className="text-5xl font-bold text-white mb-6">
                  Built for <span className="text-yellow-400">Community</span>,<br />
                  Powered by <span className="text-yellow-400">Innovation</span>
                </h2>
                
                <div className="space-y-4 text-lg text-zinc-300 leading-relaxed">
                  <p>
                    MIGISTUS was born from a simple observation: individually, we struggle to access premium 
                    products at fair prices. But together? Together, we have the power to negotiate, to influence, 
                    and to achieve what seemed impossible.
                  </p>
                  
                  <p>
                    We've built a platform that doesn't just connect buyers and sellers—it creates a movement 
                    of empowered consumers who understand that their collective voice matters. Every vote counts. 
                    Every pledge makes a difference. Every member strengthens the community.
                  </p>
                  
                  <p>
                    This isn't about discounts. It's about democratizing access to quality products and proving 
                    that when people unite around shared goals, amazing things happen.
                  </p>
                </div>

                <div className="mt-8 flex flex-wrap gap-4">
                  <div className="flex items-center gap-3 bg-zinc-800/50 border border-zinc-700 rounded-lg px-6 py-3">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    <span className="text-zinc-300">Community-Driven</span>
                  </div>
                  <div className="flex items-center gap-3 bg-zinc-800/50 border border-zinc-700 rounded-lg px-6 py-3">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    <span className="text-zinc-300">Transparent Pricing</span>
                  </div>
                  <div className="flex items-center gap-3 bg-zinc-800/50 border border-zinc-700 rounded-lg px-6 py-3">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    <span className="text-zinc-300">Quality Guaranteed</span>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-purple-500/20 rounded-3xl blur-2xl" />
                <div className="relative bg-zinc-900/80 backdrop-blur-sm border border-yellow-500/30 rounded-3xl p-12 space-y-8">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-yellow-500/10 rounded-xl">
                      <Target className="w-8 h-8 text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-yellow-400 mb-2">Our Mission</h3>
                      <p className="text-zinc-300">
                        To revolutionize online shopping by harnessing the collective power of communities, 
                        making premium products accessible to everyone.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-purple-500/10 rounded-xl">
                      <Rocket className="w-8 h-8 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-purple-400 mb-2">Our Vision</h3>
                      <p className="text-zinc-300">
                        A world where consumers have the power to influence markets, where quality products 
                        aren't luxury items, but accessible choices for organized communities.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-xl">
                      <Heart className="w-8 h-8 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-blue-400 mb-2">Our Values</h3>
                      <p className="text-zinc-300">
                        Transparency, community first, quality over quantity, and the belief that together, 
                        we achieve more than we ever could alone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Our Philosophy Section */}
        <section className="py-24 bg-zinc-900/30">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full px-4 py-2 mb-6">
                <Shield className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400 text-sm font-semibold">Core Principles</span>
              </div>
              
              <h2 className="text-5xl font-bold text-white mb-4">
                What Makes Us <span className="text-yellow-400">Different</span>
              </h2>
              
              <p className="text-xl text-zinc-300 max-w-2xl mx-auto">
                Our platform is built on principles that put you—the community—first
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="group bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 border border-zinc-700 rounded-2xl p-8 hover:border-yellow-500/50 transition-all duration-300 hover:scale-105">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Users className="w-8 h-8 text-black" />
                </div>
                <h3 className="text-2xl font-bold text-yellow-300 mb-4">Collective Power</h3>
                <p className="text-zinc-300 leading-relaxed">
                  Alone, you're a customer. Together, you're a force. When thousands unite behind a product, 
                  suppliers listen, prices drop, and everyone wins. This is the power of organized demand.
                </p>
              </div>

              <div className="group bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 border border-zinc-700 rounded-2xl p-8 hover:border-yellow-500/50 transition-all duration-300 hover:scale-105">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-purple-300 mb-4">Quality Obsession</h3>
                <p className="text-zinc-300 leading-relaxed">
                  We don't compromise on quality. Every product is vetted, every supplier verified. Our community 
                  votes only on items they actually want—not what we want to sell them.
                </p>
              </div>

              <div className="group bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 border border-zinc-700 rounded-2xl p-8 hover:border-yellow-500/50 transition-all duration-300 hover:scale-105">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-blue-300 mb-4">Full Transparency</h3>
                <p className="text-zinc-300 leading-relaxed">
                  No hidden fees, no tricks, no fine print. See exactly how pricing works, track your savings in 
                  real-time, and understand where every dollar goes. Honesty builds trust.
                </p>
              </div>

              <div className="group bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 border border-zinc-700 rounded-2xl p-8 hover:border-yellow-500/50 transition-all duration-300 hover:scale-105">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-green-300 mb-4">Smart Technology</h3>
                <p className="text-zinc-300 leading-relaxed">
                  Cutting-edge platform that makes group buying seamless. Real-time updates, intelligent matching, 
                  automated tier unlocks—technology that works for you, not against you.
                </p>
              </div>

              <div className="group bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 border border-zinc-700 rounded-2xl p-8 hover:border-yellow-500/50 transition-all duration-300 hover:scale-105">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-red-300 mb-4">Community First</h3>
                <p className="text-zinc-300 leading-relaxed">
                  Every decision we make starts with one question: "Is this good for our community?" Your feedback 
                  shapes our roadmap. Your needs drive our features.
                </p>
              </div>

              <div className="group bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 border border-zinc-700 rounded-2xl p-8 hover:border-yellow-500/50 transition-all duration-300 hover:scale-105">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-8 h-8 text-black" />
                </div>
                <h3 className="text-2xl font-bold text-orange-300 mb-4">Sustainable Growth</h3>
                <p className="text-zinc-300 leading-relaxed">
                  We're building for the long term. No shortcuts, no quick grabs. Sustainable business practices 
                  that ensure MIGISTUS serves communities for years to come.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-24 bg-gradient-to-b from-zinc-900/50 to-black">
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
                Simple, transparent, and designed for maximum savings
              </p>
            </div>

            <div className="relative max-w-4xl mx-auto">
              {/* Connection Line */}
              <div className="absolute left-8 top-16 bottom-16 w-0.5 bg-gradient-to-b from-yellow-500 via-purple-500 to-blue-500 hidden md:block" />

              <div className="space-y-12">
                {/* Step 1 */}
                <div className="relative flex items-start gap-8">
                  <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 text-black rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg shadow-yellow-500/50 z-10">
                    1
                  </div>
                  <div className="flex-1 bg-gradient-to-r from-zinc-900/90 to-zinc-800/50 border border-zinc-700 rounded-2xl p-8 hover:border-yellow-500/50 transition-all duration-300 group">
                    <h3 className="text-2xl font-bold text-yellow-300 mb-3 group-hover:text-yellow-400 transition-colors">
                      Discover & Vote
                    </h3>
                    <p className="text-zinc-300 text-lg leading-relaxed mb-4">
                      Browse our curated collection of premium products. See something you love? Cast your vote! 
                      The community decides which products become live drops. Your vote isn't just a click—it's 
                      a signal to suppliers that demand exists.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 rounded-full px-3 py-1">Browse Catalog</span>
                      <span className="text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 rounded-full px-3 py-1">Cast Votes</span>
                      <span className="text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 rounded-full px-3 py-1">Track Trends</span>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="relative flex items-start gap-8">
                  <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg shadow-purple-500/50 z-10">
                    2
                  </div>
                  <div className="flex-1 bg-gradient-to-r from-zinc-900/90 to-zinc-800/50 border border-zinc-700 rounded-2xl p-8 hover:border-purple-500/50 transition-all duration-300 group">
                    <h3 className="text-2xl font-bold text-purple-300 mb-3 group-hover:text-purple-400 transition-colors">
                      Join the Group
                    </h3>
                    <p className="text-zinc-300 text-lg leading-relaxed mb-4">
                      When a product goes live, make your pledge to join the group purchase. Watch as others join 
                      and pricing tiers unlock in real-time. The more people participate, the better the price gets 
                      for everyone. It's collective bargaining in action.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded-full px-3 py-1">Make Pledge</span>
                      <span className="text-xs bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded-full px-3 py-1">Watch Tiers Unlock</span>
                      <span className="text-xs bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded-full px-3 py-1">Save More</span>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="relative flex items-start gap-8">
                  <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg shadow-blue-500/50 z-10">
                    3
                  </div>
                  <div className="flex-1 bg-gradient-to-r from-zinc-900/90 to-zinc-800/50 border border-zinc-700 rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-300 group">
                    <h3 className="text-2xl font-bold text-blue-300 mb-3 group-hover:text-blue-400 transition-colors">
                      Connect & Engage
                    </h3>
                    <p className="text-zinc-300 text-lg leading-relaxed mb-4">
                      Jump into product-specific chat rooms, discuss features, share experiences, and connect with 
                      fellow buyers. Follow community members, build relationships, and stay informed about drop 
                      progress through real-time notifications.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-full px-3 py-1">Join Discussions</span>
                      <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-full px-3 py-1">Follow Members</span>
                      <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-full px-3 py-1">Get Updates</span>
                    </div>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="relative flex items-start gap-8">
                  <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg shadow-green-500/50 z-10">
                    4
                  </div>
                  <div className="flex-1 bg-gradient-to-r from-zinc-900/90 to-zinc-800/50 border border-zinc-700 rounded-2xl p-8 hover:border-green-500/50 transition-all duration-300 group">
                    <h3 className="text-2xl font-bold text-green-300 mb-3 group-hover:text-green-400 transition-colors">
                      Receive & Enjoy
                    </h3>
                    <p className="text-zinc-300 text-lg leading-relaxed mb-4">
                      Once minimum quantities are met, orders are processed and shipped directly to your door. 
                      Track your order from warehouse to delivery, manage all purchases through your personalized 
                      dashboard, and enjoy premium quality at prices that beat the market.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/30 rounded-full px-3 py-1">Track Shipping</span>
                      <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/30 rounded-full px-3 py-1">Manage Orders</span>
                      <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/30 rounded-full px-3 py-1">Leave Reviews</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Value Proposition */}
            <div className="mt-20 bg-gradient-to-r from-yellow-900/20 via-purple-900/20 to-blue-900/20 border border-yellow-500/30 rounded-3xl p-12 text-center">
              <Sparkles className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
              <h3 className="text-3xl font-bold text-white mb-4">The Result?</h3>
              <p className="text-xl text-zinc-300 max-w-3xl mx-auto leading-relaxed">
                Premium products at <span className="text-yellow-400 font-bold">30-60% below retail prices</span>, 
                guaranteed quality, and a community that has your back. That's the MIGISTUS difference.
              </p>
            </div>
          </div>
        </section>

        {/* Current Features Section */}
        <section className="py-24 bg-gradient-to-b from-black to-zinc-900/50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-4 py-2 mb-6">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span className="text-green-400 text-sm font-semibold">Live Now</span>
              </div>
              
              <h2 className="text-5xl font-bold text-white mb-4">
                Features <span className="text-yellow-400">Available Today</span>
              </h2>
              
              <p className="text-xl text-zinc-300 max-w-2xl mx-auto">
                Everything you need to start saving, right now
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Product Voting */}
              <div className="bg-gradient-to-br from-zinc-800/90 to-zinc-900/80 border border-zinc-700 rounded-2xl p-8 hover:border-yellow-500/50 transition-all duration-300 hover:scale-105 group">
                <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <span className="text-2xl">🗳️</span>
                </div>
                <h3 className="text-xl font-bold text-yellow-300 mb-3 text-center">Community Voting</h3>
                <p className="text-zinc-300 leading-relaxed text-center text-sm">
                  Democracy in action. Vote for products you want, influence what goes live, and see real-time 
                  results. Your voice shapes the marketplace.
                </p>
              </div>

              {/* User Profiles */}
              <div className="bg-gradient-to-br from-zinc-800/90 to-zinc-900/80 border border-zinc-700 rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-300 hover:scale-105 group">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <span className="text-2xl">👤</span>
                </div>
                <h3 className="text-xl font-bold text-blue-300 mb-3 text-center">Smart Profiles</h3>
                <p className="text-zinc-300 leading-relaxed text-center text-sm">
                  Track your entire MIGISTUS journey. View pledges, savings, participation stats, and build your 
                  community reputation.
                </p>
              </div>

              {/* Product Chat */}
              <div className="bg-gradient-to-br from-zinc-800/90 to-zinc-900/80 border border-zinc-700 rounded-2xl p-8 hover:border-purple-500/50 transition-all duration-300 hover:scale-105 group">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <span className="text-2xl">💬</span>
                </div>
                <h3 className="text-xl font-bold text-purple-300 mb-3 text-center">Live Discussions</h3>
                <p className="text-zinc-300 leading-relaxed text-center text-sm">
                  Real-time chat for every product. Ask questions, share insights, coordinate with other buyers, 
                  and make informed decisions together.
                </p>
              </div>

              {/* Pledge Management */}
              <div className="bg-gradient-to-br from-zinc-800/90 to-zinc-900/80 border border-zinc-700 rounded-2xl p-8 hover:border-green-500/50 transition-all duration-300 hover:scale-105 group">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <span className="text-2xl">🤝</span>
                </div>
                <h3 className="text-xl font-bold text-green-300 mb-3 text-center">Pledge Dashboard</h3>
                <p className="text-zinc-300 leading-relaxed text-center text-sm">
                  Manage all your group purchases in one place. View active pledges, track progress to tier unlocks, 
                  and monitor order status.
                </p>
              </div>

              {/* Account Dashboard */}
              <div className="bg-gradient-to-br from-zinc-800/90 to-zinc-900/80 border border-zinc-700 rounded-2xl p-8 hover:border-cyan-500/50 transition-all duration-300 hover:scale-105 group">
                <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <span className="text-2xl">📊</span>
                </div>
                <h3 className="text-xl font-bold text-cyan-300 mb-3 text-center">Analytics Hub</h3>
                <p className="text-zinc-300 leading-relaxed text-center text-sm">
                  Detailed insights into your savings, purchase history, activity stats, and personalized 
                  recommendations based on your preferences.
                </p>
              </div>

              {/* Social Features */}
              <div className="bg-gradient-to-br from-zinc-800/90 to-zinc-900/80 border border-zinc-700 rounded-2xl p-8 hover:border-pink-500/50 transition-all duration-300 hover:scale-105 group">
                <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <span className="text-2xl">👥</span>
                </div>
                <h3 className="text-xl font-bold text-pink-300 mb-3 text-center">Social Network</h3>
                <p className="text-zinc-300 leading-relaxed text-center text-sm">
                  Follow members, share experiences, build your network, and discover products through your 
                  community connections.
                </p>
              </div>

              {/* Wishlist */}
              <div className="bg-gradient-to-br from-zinc-800/90 to-zinc-900/80 border border-zinc-700 rounded-2xl p-8 hover:border-red-500/50 transition-all duration-300 hover:scale-105 group">
                <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <span className="text-2xl">❤️</span>
                </div>
                <h3 className="text-xl font-bold text-red-300 mb-3 text-center">Smart Wishlist</h3>
                <p className="text-zinc-300 leading-relaxed text-center text-sm">
                  Save products you're interested in and get notified when they go live or when pricing tiers unlock.
                </p>
              </div>

              {/* Real-time Updates */}
              <div className="bg-gradient-to-br from-zinc-800/90 to-zinc-900/80 border border-zinc-700 rounded-2xl p-8 hover:border-orange-500/50 transition-all duration-300 hover:scale-105 group">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <span className="text-2xl">⚡</span>
                </div>
                <h3 className="text-xl font-bold text-orange-300 mb-3 text-center">Live Updates</h3>
                <p className="text-zinc-300 leading-relaxed text-center text-sm">
                  Real-time notifications for drop progress, tier unlocks, new products, and community activity. 
                  Never miss a deal.
                </p>
              </div>

              {/* Secure Accounts */}
              <div className="bg-gradient-to-br from-zinc-800/90 to-zinc-900/80 border border-zinc-700 rounded-2xl p-8 hover:border-emerald-500/50 transition-all duration-300 hover:scale-105 group">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <span className="text-2xl">🔒</span>
                </div>
                <h3 className="text-xl font-bold text-emerald-300 mb-3 text-center">Bank-Level Security</h3>
                <p className="text-zinc-300 leading-relaxed text-center text-sm">
                  Your data is protected with enterprise-grade encryption, secure authentication, and privacy 
                  controls you can trust.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Coming Soon Section */}
        <section className="py-24 bg-gradient-to-b from-zinc-900/50 to-black">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-full px-4 py-2 mb-6">
                <Rocket className="w-4 h-4 text-blue-400" />
                <span className="text-blue-400 text-sm font-semibold">On The Horizon</span>
              </div>
              
              <h2 className="text-5xl font-bold text-white mb-4">
                What's <span className="text-yellow-400">Coming Next</span>
              </h2>
              
              <p className="text-xl text-zinc-300 max-w-2xl mx-auto">
                The future of MIGISTUS is being built with your feedback
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="group bg-gradient-to-br from-blue-900/30 to-zinc-900/80 border-2 border-blue-500/30 rounded-2xl p-8 hover:border-blue-500/60 transition-all duration-300 hover:scale-105 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">Q1 2026</div>
                <Globe className="w-12 h-12 text-blue-400 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-2xl font-bold text-blue-300 mb-3">Live Drop Events</h3>
                <p className="text-zinc-300 leading-relaxed">
                  Real-time group buying events with countdown timers, dynamic pricing tiers, and instant 
                  notifications when thresholds are reached.
                </p>
              </div>

              <div className="group bg-gradient-to-br from-green-900/30 to-zinc-900/80 border-2 border-green-500/30 rounded-2xl p-8 hover:border-green-500/60 transition-all duration-300 hover:scale-105 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">Q2 2026</div>
                <Zap className="w-12 h-12 text-green-400 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-2xl font-bold text-green-300 mb-3">Payment Processing</h3>
                <p className="text-zinc-300 leading-relaxed">
                  Secure payment integration with multiple payment methods, escrow protection, and automatic 
                  refunds for failed drops. Your money stays safe.
                </p>
              </div>

              <div className="group bg-gradient-to-br from-purple-900/30 to-zinc-900/80 border-2 border-purple-500/30 rounded-2xl p-8 hover:border-purple-500/60 transition-all duration-300 hover:scale-105 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">Q2 2026</div>
                <Crown className="w-12 h-12 text-purple-400 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-2xl font-bold text-purple-300 mb-3">Premium Tiers</h3>
                <p className="text-zinc-300 leading-relaxed">
                  Subscription tiers with exclusive access to premium drops, better pricing, early voting rights, 
                  and VIP customer support.
                </p>
              </div>

              <div className="group bg-gradient-to-br from-red-900/30 to-zinc-900/80 border-2 border-red-500/30 rounded-2xl p-8 hover:border-red-500/60 transition-all duration-300 hover:scale-105 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">Q3 2026</div>
                <Heart className="w-12 h-12 text-red-400 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-2xl font-bold text-red-300 mb-3">Mobile Apps</h3>
                <p className="text-zinc-300 leading-relaxed">
                  Native iOS and Android apps with push notifications, offline browsing, biometric login, 
                  and seamless mobile shopping experience.
                </p>
              </div>

              <div className="group bg-gradient-to-br from-yellow-900/30 to-zinc-900/80 border-2 border-yellow-500/30 rounded-2xl p-8 hover:border-yellow-500/60 transition-all duration-300 hover:scale-105 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-bl-lg">Q3 2026</div>
                <Award className="w-12 h-12 text-yellow-400 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-2xl font-bold text-yellow-300 mb-3">Gamification</h3>
                <p className="text-zinc-300 leading-relaxed">
                  Achievements, badges, leaderboards, and rewards for active participation. Level up your profile 
                  and unlock exclusive perks.
                </p>
              </div>

              <div className="group bg-gradient-to-br from-cyan-900/30 to-zinc-900/80 border-2 border-cyan-500/30 rounded-2xl p-8 hover:border-cyan-500/60 transition-all duration-300 hover:scale-105 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-cyan-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">Q4 2026</div>
                <TrendingUp className="w-12 h-12 text-cyan-400 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-2xl font-bold text-cyan-300 mb-3">AI Analytics</h3>
                <p className="text-zinc-300 leading-relaxed">
                  Smart price predictions, personalized product recommendations, market trend analysis, 
                  and optimal purchase timing suggestions.
                </p>
              </div>
            </div>

            {/* Roadmap CTA */}
            <div className="mt-16 text-center">
              <p className="text-zinc-400 mb-6">
                Have ideas for features you'd like to see? We're always listening to our community.
              </p>
              <Link href="/community" className="inline-flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-8 rounded-lg transition-colors">
                Join the Discussion
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 bg-gradient-to-r from-yellow-900/30 via-purple-900/20 to-blue-900/30">
          <div className="max-w-5xl mx-auto px-6">
            <div className="bg-gradient-to-br from-zinc-900/90 to-zinc-800/90 border border-yellow-500/30 rounded-3xl p-12 text-center backdrop-blur-sm">
              <div className="flex justify-center mb-8">
                <div className="p-4 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl">
                  <Crown className="w-12 h-12 text-black" />
                </div>
              </div>
              
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Ready to Experience the <span className="text-yellow-400">Power</span> of Community?
              </h2>
              
              <p className="text-xl text-zinc-300 mb-10 max-w-2xl mx-auto leading-relaxed">
                Join thousands of smart shoppers who are already saving big through collective buying power. 
                Your next great deal is just a click away.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register" className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-4 px-10 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg shadow-yellow-500/30">
                  Create Free Account
                </Link>
                <Link href="/voting" className="border-2 border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-black font-bold py-4 px-10 rounded-xl transition-all duration-300 hover:scale-105">
                  Explore Products
                </Link>
              </div>

              <div className="mt-8 text-sm text-zinc-400">
                No credit card required • Join 10,000+ members • Free forever
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
