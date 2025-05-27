import React, { useState, useEffect } from 'react';
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import MainNavbar from "@/components/nav/MainNavbar";
import { useState, useEffect } from "react";
import { Clock, Users, TrendingDown, Star, Crown, Zap } from "lucide-react";

export default function HomePage() {
  const [timeLeft, setTimeLeft] = useState(7740); // 2h 9m in seconds

  // Timer effect for trending drop
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const trendingDrop = {
    name: "Warehouse-15 LED Headlamp",
    currentPrice: 18,
    originalPrice: 45,
    pledged: 89,
    goal: 150,
    image: "/images/headlamp.png"
  };

  const categories = [
    { name: "Electronics", image: "/images/electronics.png", link: "/categories/electronics", count: "12 active drops" },
    { name: "Beauty & Health", image: "/images/beauty.png", link: "/categories/beauty", count: "8 active drops" },
    { name: "Toys & Hobbies", image: "/images/toys.png", link: "/categories/toys", count: "6 active drops" },
    { name: "Home & Garden", image: "/images/home.png", link: "/categories/home", count: "15 active drops" },
  ];

  const progressPercentage = (trendingDrop.pledged / trendingDrop.goal) * 100;

  return (
    <>
      <Head>
        <title>MIGISTUS — The Guilded Marketplace</title>
        <meta name="description" content="Unlock exclusive pricing through collective buying power. Join drops and save with the community." />
      </Head>

      <MainNavbar />

      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white font-sans">
        
        {/* Enhanced Trending Drop Section */}
        <section className="relative px-6 py-16 text-center overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-transparent to-yellow-500/5"></div>
          <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-24 h-24 bg-yellow-500/10 rounded-full blur-2xl"></div>
          
          <div className="relative z-10">
            <div className="inline-flex items-center bg-yellow-500/20 text-yellow-300 px-4 py-2 rounded-full text-sm font-medium mb-4 border border-yellow-500/30">
              <Zap className="w-4 h-4 mr-2" />
              Trending Drop
            </div>
            
            <h1 className="text-5xl font-bold text-white mb-4 leading-tight">{trendingDrop.name}</h1>
            
            {/* Enhanced Price Display */}
            <div className="flex items-center justify-center space-x-6 mb-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-yellow-400">${trendingDrop.currentPrice}</div>
                <div className="text-sm text-gray-400 line-through">${trendingDrop.originalPrice}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{formatTime(timeLeft)}</div>
                <div className="text-sm text-gray-400">Time Remaining</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{trendingDrop.pledged}/{trendingDrop.goal}</div>
                <div className="text-sm text-gray-400">Pledged</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="max-w-md mx-auto mb-8">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Progress to next tier</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-yellow-600 to-yellow-400 h-3 rounded-full transition-all duration-500 shadow-lg shadow-yellow-500/50"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>

            <div className="relative w-64 h-64 mx-auto mb-8">
              <Image 
                src={trendingDrop.image} 
                alt={trendingDrop.name} 
                fill
                className="object-contain drop-shadow-2xl"
                sizes="(max-width: 768px) 100vw, 256px"
              />
            </div>
            
            <Link href="/drops/warehouse-15-led-headlamp">
              <button className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-black font-bold py-4 px-8 rounded-xl hover:shadow-xl hover:shadow-yellow-500/50 transition-all transform hover:-translate-y-1 text-lg">
                Join This Drop
              </button>
            </Link>
          </div>
        </section>

        {/* Enhanced Category Grid */}
        <section className="px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">Explore Categories</h2>
            <p className="text-xl text-gray-400">Discover premium products across all categories</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {categories.map((cat) => (
              <Link href={cat.link} key={cat.name} className="group block text-center">
                <div className="relative overflow-hidden rounded-2xl border border-gray-700 hover:border-yellow-500/50 transition-all group-hover:scale-105">
                  <div className="relative w-full h-40 bg-gradient-to-br from-gray-800 to-gray-900">
                    <Image 
                      src={cat.image} 
                      alt={cat.name} 
                      fill
                      className="object-cover rounded-2xl"
                      sizes="(max-width: 768px) 50vw, 256px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-2xl"></div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-lg font-bold text-white mb-1 group-hover:text-yellow-400 transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-sm text-gray-300">{cat.count}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Enhanced Coming Soon Section */}
        <section className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 py-16 border-y border-gray-700">
          <div className="text-center">
            <div className="inline-flex items-center bg-blue-500/20 text-blue-300 px-4 py-2 rounded-full text-sm font-medium mb-4 border border-blue-500/30">
              <Clock className="w-4 h-4 mr-2" />
              Coming Soon
            </div>
            
            <h2 className="text-4xl font-bold text-white mb-4">Wi-Fi Smart Bulb</h2>
            <p className="text-xl text-blue-400 mb-2">Launches in 4 days</p>
            <p className="text-gray-400 mb-8">Be the first to join when it drops</p>
            
            <div className="relative w-32 h-32 mx-auto mb-8">
              <Image 
                src="/images/bulb.png" 
                alt="Smart Bulb" 
                fill
                className="object-contain drop-shadow-xl"
                sizes="128px"
              />
            </div>
            
            <button className="bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold py-3 px-8 rounded-xl hover:shadow-xl hover:shadow-blue-500/50 transition-all transform hover:-translate-y-1">
              Join Waitlist
            </button>
          </div>
        </section>

        {/* Enhanced Vote Section */}
        <section className="px-6 py-16 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-white mb-4">Shape the Future</h2>
            <p className="text-xl text-gray-300 mb-8">Vote on products you want to see as drops</p>
            
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 p-8 mb-8">
              <h3 className="text-3xl font-bold text-white mb-6">Multifunctional Laptop Stand</h3>
              
              <div className="relative w-64 h-64 mx-auto mb-8">
                <Image 
                  src="/images/laptop-stand.png" 
                  alt="Laptop Stand" 
                  fill
                  className="object-contain drop-shadow-2xl"
                  sizes="(max-width: 768px) 100vw, 256px"
                />
              </div>

              <div className="flex items-center justify-center space-x-8 mb-6 text-lg">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  <span className="text-white font-bold">247 votes</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Crown className="w-5 h-5 text-yellow-400" />
                  <span className="text-gray-300">Guild members get 2x votes</span>
                </div>
              </div>
              
              <Link href="/voting">
                <button className="bg-gradient-to-r from-purple-600 to-purple-500 text-white font-bold py-4 px-8 rounded-xl hover:shadow-xl hover:shadow-purple-500/50 transition-all transform hover:-translate-y-1 text-lg">
                  Cast Your Vote
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="px-6 py-16 bg-gradient-to-r from-yellow-900/20 to-yellow-800/20 border-t border-yellow-500/30">
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-white mb-4">Ready to Save More?</h2>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of members unlocking exclusive pricing through collective buying power.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/membership">
                <button className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-black font-bold py-4 px-8 rounded-xl hover:shadow-xl hover:shadow-yellow-500/50 transition-all transform hover:-translate-y-1">
                  Upgrade Membership
                </button>
              </Link>
              <Link href="/drops">
                <button className="border-2 border-yellow-500 text-yellow-400 font-bold py-4 px-8 rounded-xl hover:bg-yellow-500 hover:text-black transition-all">
                  Browse All Drops
                </button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}