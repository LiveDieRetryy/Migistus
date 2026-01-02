import Head from "next/head";
import Link from "next/link";
import MainNavbar from "@/components/nav/MainNavbar";
import { ArrowRight, Zap, Users, Crown, TrendingUp, Gift } from "lucide-react";

export default function LiveDropsPage() {
  return (
    <>
      <Head>
        <title>Live Drops - MIGISTUS</title>
        <meta name="description" content="Discover active community drops and staff-curated selections on MIGISTUS" />
      </Head>

      <MainNavbar />

      <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black">
        {/* Hero Section */}
        <div className="relative pt-32 pb-20 overflow-hidden">
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/20 via-black to-green-900/20"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(234,179,8,0.1),transparent_50%)]"></div>
          
          {/* Floating particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl -top-48 -left-48 animate-pulse"></div>
            <div className="absolute w-96 h-96 bg-green-500/5 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-yellow-500/20 blur-xl rounded-full"></div>
                <Zap className="relative w-20 h-20 text-yellow-400 animate-pulse" />
              </div>
            </div>
            
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-white mb-6 leading-tight">
              Live <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-green-400">Drops</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-zinc-300 max-w-3xl mx-auto mb-12">
              Discover exclusive deals powered by community engagement and expert curation
            </p>

            {/* Stats */}
            <div className="flex flex-wrap items-center justify-center gap-8 mb-12">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400 mb-1">Active Now</div>
                <div className="text-zinc-400 text-sm">Limited Time</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400 mb-1">Best Prices</div>
                <div className="text-zinc-400 text-sm">Guild Power</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Two Sections */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Community Drops Section */}
            <Link 
              href="/community-drops"
              className="group relative overflow-hidden bg-gradient-to-br from-green-900/30 to-zinc-900/50 border-2 border-green-500/30 hover:border-green-500/60 rounded-3xl p-8 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-green-500/20"
            >
              <div className="relative z-10">
                {/* Icon */}
                <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-green-500/20 border border-green-500/30 mb-6 group-hover:bg-green-500/30 transition-colors">
                  <Users className="w-10 h-10 text-green-400" />
                </div>

                {/* Title */}
                <h2 className="text-4xl font-black text-white mb-4 flex items-center gap-3">
                  Community Drops
                  <ArrowRight className="w-8 h-8 text-green-400 transform group-hover:translate-x-2 transition-transform" />
                </h2>

                {/* Description */}
                <p className="text-lg text-zinc-300 mb-6 leading-relaxed">
                  Products powered by guild pledges. The more members pledge, the better the price gets. Join the movement and save together.
                </p>

                {/* Features */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                    </div>
                    <div>
                      <div className="text-white font-semibold">Dynamic Pricing</div>
                      <div className="text-sm text-zinc-400">Prices drop as pledges increase</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Zap className="w-3.5 h-3.5 text-green-400" />
                    </div>
                    <div>
                      <div className="text-white font-semibold">Limited Time</div>
                      <div className="text-sm text-zinc-400">Active drops end soon</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Users className="w-3.5 h-3.5 text-green-400" />
                    </div>
                    <div>
                      <div className="text-white font-semibold">Community Power</div>
                      <div className="text-sm text-zinc-400">Better deals together</div>
                    </div>
                  </div>
                </div>

                {/* CTA Badge */}
                <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full text-green-400 font-semibold text-sm">
                  <Zap className="w-4 h-4" />
                  View Active Drops
                </div>
              </div>

              {/* Animated background effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>

            {/* Staff Picks Section */}
            <Link 
              href="/staff-picks"
              className="group relative overflow-hidden bg-gradient-to-br from-yellow-900/30 to-zinc-900/50 border-2 border-yellow-500/30 hover:border-yellow-500/60 rounded-3xl p-8 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-yellow-500/20"
            >
              <div className="relative z-10">
                {/* Icon */}
                <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-yellow-500/20 border border-yellow-500/30 mb-6 group-hover:bg-yellow-500/30 transition-colors">
                  <Crown className="w-10 h-10 text-yellow-400" />
                </div>

                {/* Title */}
                <h2 className="text-4xl font-black text-white mb-4 flex items-center gap-3">
                  Staff Picks
                  <ArrowRight className="w-8 h-8 text-yellow-400 transform group-hover:translate-x-2 transition-transform" />
                </h2>

                {/* Description */}
                <p className="text-lg text-zinc-300 mb-6 leading-relaxed">
                  Handpicked products by our team. Curated for quality, value, and guild appeal. Premium selections at exceptional prices.
                </p>

                {/* Features */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Crown className="w-3.5 h-3.5 text-yellow-400" />
                    </div>
                    <div>
                      <div className="text-white font-semibold">Expert Curation</div>
                      <div className="text-sm text-zinc-400">Vetted by our team</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Gift className="w-3.5 h-3.5 text-yellow-400" />
                    </div>
                    <div>
                      <div className="text-white font-semibold">Premium Selection</div>
                      <div className="text-sm text-zinc-400">Top quality products</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <TrendingUp className="w-3.5 h-3.5 text-yellow-400" />
                    </div>
                    <div>
                      <div className="text-white font-semibold">Best Value</div>
                      <div className="text-sm text-zinc-400">Negotiated guild pricing</div>
                    </div>
                  </div>
                </div>

                {/* CTA Badge */}
                <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-yellow-400 font-semibold text-sm">
                  <Crown className="w-4 h-4" />
                  Browse Staff Picks
                </div>
              </div>

              {/* Animated background effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
          </div>

          {/* Info Banner */}
          <div className="mt-12 bg-gradient-to-r from-zinc-900/50 to-zinc-800/50 border border-zinc-700 rounded-2xl p-8 text-center">
            <Zap className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">How Live Drops Work</h3>
            <p className="text-zinc-300 max-w-2xl mx-auto">
              Live Drops combine community engagement with expert curation to deliver unbeatable prices. 
              Community Drops get better as more members pledge, while Staff Picks offer pre-negotiated guild pricing on premium products.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
