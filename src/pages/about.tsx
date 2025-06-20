import Head from "next/head";
import MainNavbar from "@/components/nav/MainNavbar";
import { Crown, Users, Shield, Star, Zap, Globe, Heart, Award } from "lucide-react";

export default function AboutPage() {
  return (
    <>
      <Head>
        <title>About - MIGISTUS | The Group Buying Platform</title>
        <meta name="description" content="Discover MIGISTUS - where communities unite to unlock better pricing through group buying power." />
      </Head>
      
      <MainNavbar />
      
      <div className="min-h-screen bg-black text-white">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/20 via-black to-purple-900/20" />
          <div className="relative max-w-7xl mx-auto px-6 py-24">
            <div className="text-center">
              <div className="flex justify-center mb-8">
                <Crown className="w-16 h-16 text-yellow-400" />
              </div>
              <h1 className="text-6xl font-bold mb-6">
                <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                  MIGISTUS
                </span>
              </h1>
              <p className="text-2xl text-yellow-300 mb-4 font-semibold">
                Premium Group Buying Platform
              </p>
              <p className="text-lg text-zinc-300 max-w-3xl mx-auto leading-relaxed">
                MIGISTUS brings communities together to unlock better pricing through collective buying power. 
                Vote for products, join group purchases, and experience premium quality at unbeatable prices.
              </p>
            </div>
          </div>
        </div>

        {/* Our Philosophy Section */}
        <section className="py-20 bg-zinc-900/50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <div className="flex justify-center mb-6">
                <Shield className="w-12 h-12 text-yellow-400" />
              </div>
              <h2 className="text-4xl font-bold text-yellow-400 mb-4">Our Philosophy</h2>
              <p className="text-xl text-zinc-300 max-w-2xl mx-auto">
                The Core Principles That Drive Our Platform
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-8 hover:border-yellow-500/50 transition-colors">
                <Users className="w-10 h-10 text-yellow-400 mb-4" />
                <h3 className="text-xl font-bold text-yellow-300 mb-3">Community Power</h3>
                <p className="text-zinc-300 leading-relaxed">
                  When communities unite with shared purchasing goals, they unlock pricing that's impossible 
                  for individual buyers. Together, we achieve more.
                </p>
              </div>

              <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-8 hover:border-yellow-500/50 transition-colors">
                <Heart className="w-10 h-10 text-yellow-400 mb-4" />
                <h3 className="text-xl font-bold text-yellow-300 mb-3">Quality First</h3>
                <p className="text-zinc-300 leading-relaxed">
                  We focus on premium products that our community actually wants. Every item is carefully 
                  selected based on member voting and demand.
                </p>
              </div>

              <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-8 hover:border-yellow-500/50 transition-colors">
                <Zap className="w-10 h-10 text-yellow-400 mb-4" />
                <h3 className="text-xl font-bold text-yellow-300 mb-3">Smart Technology</h3>
                <p className="text-zinc-300 leading-relaxed">
                  Our platform combines intuitive user experience with powerful backend systems to 
                  make group buying simple and reliable.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <div className="flex justify-center mb-6">
                <Star className="w-12 h-12 text-yellow-400" />
              </div>
              <h2 className="text-4xl font-bold text-yellow-400 mb-4">How MIGISTUS Works</h2>
              <p className="text-xl text-zinc-300 max-w-2xl mx-auto">
                Simple Steps to Better Pricing
              </p>
            </div>

            <div className="space-y-12">
              <div className="bg-gradient-to-r from-zinc-900/80 to-zinc-800/50 border border-zinc-700 rounded-xl p-8">
                <div className="flex items-start space-x-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-yellow-500 text-black rounded-full flex items-center justify-center text-xl font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-yellow-300 mb-3">Vote for Products</h3>
                    <p className="text-zinc-300 text-lg leading-relaxed">
                      Browse our curated selection and vote for products you want to see in upcoming drops. 
                      Popular items get prioritized for group buying opportunities.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-zinc-900/80 to-zinc-800/50 border border-zinc-700 rounded-xl p-8">
                <div className="flex items-start space-x-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-yellow-500 text-black rounded-full flex items-center justify-center text-xl font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-yellow-300 mb-3">Join Group Purchases</h3>
                    <p className="text-zinc-300 text-lg leading-relaxed">
                      When products go live, pledge to join the group purchase. As more people join, 
                      pricing tiers unlock automatically, providing better deals for everyone.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-zinc-900/80 to-zinc-800/50 border border-zinc-700 rounded-xl p-8">
                <div className="flex items-start space-x-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-yellow-500 text-black rounded-full flex items-center justify-center text-xl font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-yellow-300 mb-3">Connect & Discuss</h3>
                    <p className="text-zinc-300 text-lg leading-relaxed">
                      Chat with other members about products, share experiences, and stay updated on 
                      group progress through our integrated community features.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-zinc-900/80 to-zinc-800/50 border border-zinc-700 rounded-xl p-8">
                <div className="flex items-start space-x-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-yellow-500 text-black rounded-full flex items-center justify-center text-xl font-bold">
                    4
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-yellow-300 mb-3">Receive Your Products</h3>
                    <p className="text-zinc-300 text-lg leading-relaxed">
                      Once minimum quantities are met, orders are processed and shipped directly to you. 
                      Track your orders and manage your purchases through your account dashboard.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Current Features Section */}
        <section className="py-20 bg-zinc-900/50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <div className="flex justify-center mb-6">
                <Award className="w-12 h-12 text-yellow-400" />
              </div>
              <h2 className="text-4xl font-bold text-yellow-400 mb-4">Platform Features</h2>
              <p className="text-xl text-zinc-300 max-w-2xl mx-auto">
                What's Available Right Now
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Product Voting */}
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-8 hover:border-yellow-500/50 transition-colors">
                <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-black text-xl">🗳️</span>
                </div>
                <h3 className="text-xl font-bold text-yellow-300 mb-3 text-center">Product Voting</h3>
                <p className="text-zinc-300 leading-relaxed text-center">
                  Vote for products you want to see in upcoming drops. Community-driven product selection.
                </p>
              </div>

              {/* User Profiles */}
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-8 hover:border-yellow-500/50 transition-colors">
                <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-black text-xl">👤</span>
                </div>
                <h3 className="text-xl font-bold text-yellow-300 mb-3 text-center">User Profiles</h3>
                <p className="text-zinc-300 leading-relaxed text-center">
                  Create your profile, track your pledges, and build your reputation in the community.
                </p>
              </div>

              {/* Community Chat */}
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-8 hover:border-yellow-500/50 transition-colors">
                <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-black text-xl">💬</span>
                </div>
                <h3 className="text-xl font-bold text-yellow-300 mb-3 text-center">Product Chat</h3>
                <p className="text-zinc-300 leading-relaxed text-center">
                  Real-time chat for each product to discuss features, ask questions, and coordinate purchases.
                </p>
              </div>

              {/* Pledge Management */}
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-8 hover:border-yellow-500/50 transition-colors">
                <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-black text-xl">🤝</span>
                </div>
                <h3 className="text-xl font-bold text-yellow-300 mb-3 text-center">Pledge Tracking</h3>
                <p className="text-zinc-300 leading-relaxed text-center">
                  Track your current pledges, view history, and manage your commitment to group purchases.
                </p>
              </div>

              {/* Account Dashboard */}
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-8 hover:border-yellow-500/50 transition-colors">
                <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-black text-xl">📊</span>
                </div>
                <h3 className="text-xl font-bold text-yellow-300 mb-3 text-center">Account Dashboard</h3>
                <p className="text-zinc-300 leading-relaxed text-center">
                  Comprehensive account management with stats, settings, and purchase history.
                </p>
              </div>

              {/* Social Features */}
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-8 hover:border-yellow-500/50 transition-colors">
                <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-black text-xl">👥</span>
                </div>
                <h3 className="text-xl font-bold text-yellow-300 mb-3 text-center">Social Network</h3>
                <p className="text-zinc-300 leading-relaxed text-center">
                  Follow other members, share posts, and build connections within the community.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Coming Soon Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <div className="flex justify-center mb-6">
                <Zap className="w-12 h-12 text-yellow-400" />
              </div>
              <h2 className="text-4xl font-bold text-yellow-400 mb-4">Coming Soon</h2>
              <p className="text-xl text-zinc-300 max-w-2xl mx-auto">
                Features We're Building Next
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-gradient-to-br from-blue-900/20 to-zinc-800/50 border border-zinc-700 rounded-xl p-8">
                <Globe className="w-10 h-10 text-blue-400 mb-4" />
                <h3 className="text-xl font-bold text-blue-300 mb-3">Live Drops</h3>
                <p className="text-zinc-300 leading-relaxed">
                  Real-time group buying events with live countdown timers and dynamic pricing tiers.
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-900/20 to-zinc-800/50 border border-zinc-700 rounded-xl p-8">
                <Zap className="w-10 h-10 text-green-400 mb-4" />
                <h3 className="text-xl font-bold text-green-300 mb-3">Payment Integration</h3>
                <p className="text-zinc-300 leading-relaxed">
                  Secure payment processing with multiple payment options and automatic refunds for failed drops.
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-900/20 to-zinc-800/50 border border-zinc-700 rounded-xl p-8">
                <Star className="w-10 h-10 text-purple-400 mb-4" />
                <h3 className="text-xl font-bold text-purple-300 mb-3">Tier Subscriptions</h3>
                <p className="text-zinc-300 leading-relaxed">
                  Premium membership tiers with exclusive access, better pricing, and additional perks.
                </p>
              </div>

              <div className="bg-gradient-to-br from-red-900/20 to-zinc-800/50 border border-zinc-700 rounded-xl p-8">
                <Heart className="w-10 h-10 text-red-400 mb-4" />
                <h3 className="text-xl font-bold text-red-300 mb-3">Mobile App</h3>
                <p className="text-zinc-300 leading-relaxed">
                  Native mobile applications for iOS and Android with push notifications and offline browsing.
                </p>
              </div>

              <div className="bg-gradient-to-br from-yellow-900/20 to-zinc-800/50 border border-zinc-700 rounded-xl p-8">
                <Award className="w-10 h-10 text-yellow-400 mb-4" />
                <h3 className="text-xl font-bold text-yellow-300 mb-3">Gamification</h3>
                <p className="text-zinc-300 leading-relaxed">
                  Achievement systems, leaderboards, and rewards for active community participation.
                </p>
              </div>

              <div className="bg-gradient-to-br from-cyan-900/20 to-zinc-800/50 border border-zinc-700 rounded-xl p-8">
                <Shield className="w-10 h-10 text-cyan-400 mb-4" />
                <h3 className="text-xl font-bold text-cyan-300 mb-3">Advanced Analytics</h3>
                <p className="text-zinc-300 leading-relaxed">
                  Detailed insights into market trends, price predictions, and personalized recommendations.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-16 bg-gradient-to-r from-yellow-900/20 to-zinc-900">
          <div className="max-w-4xl mx-auto text-center px-6">
            <h2 className="text-3xl font-bold text-yellow-400 mb-4">Ready to Join MIGISTUS?</h2>
            <p className="text-lg text-zinc-300 mb-8">
              Start saving money through group buying power. Join our community of smart shoppers today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-8 rounded-lg transition-colors">
                Create Account
              </button>
              <button className="border border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-black font-bold py-3 px-8 rounded-lg transition-colors">
                Browse Products
              </button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
