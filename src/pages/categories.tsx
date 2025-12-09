import Link from "next/link";
import Image from "next/image";
import Head from "next/head";
import { useState } from "react";
import { Search, Grid3X3, ChevronDown, Sparkles } from "lucide-react";
import MainNavbar from "@/components/nav/MainNavbar";

const DEPARTMENTS = [
  { name: "Electronics", icon: "📱", description: "Latest tech and gadgets" },
  { name: "Computers", icon: "💻", description: "PCs, laptops & accessories" },
  { name: "Smart Home", icon: "🏠", description: "Connected living solutions" },
  { name: "Home, Garden & Tools", icon: "🔨", description: "Everything for your home" },
  { name: "Pet Supplies", icon: "🐕", description: "Care for your furry friends" },
  { name: "Food & Grocery", icon: "🥗", description: "Premium food & beverages" },
  { name: "Beauty & Health", icon: "💄", description: "Wellness & beauty products" },
  { name: "Toys, Kids & Baby", icon: "🧸", description: "Fun for the little ones" },
  { name: "Handmade", icon: "🎨", description: "Unique artisan creations" },
  { name: "Sports & Outdoors", icon: "⚽", description: "Gear for active lifestyles" },
  { name: "Automotive", icon: "🚗", description: "Car parts & accessories" },
  { name: "Industrial & Scientific", icon: "🔬", description: "Professional equipment" },
  { name: "Movies, Music & Games", icon: "🎮", description: "Entertainment essentials" }
];

const departmentImages: Record<string, string> = {
  "Electronics": "/images/electronics.png",
  "Computers": "/images/Computer.png",
  "Smart Home": "/images/smarthome.png",
  "Home, Garden & Tools": "/images/home.png",
  "Pet Supplies": "/images/pets.png",
  "Food & Grocery": "/images/food&grocery.png",
  "Beauty & Health": "/images/beauty.png",
  "Toys, Kids & Baby": "/images/toys.png",
  "Handmade": "/images/handmade.png",
  "Sports & Outdoors": "/images/sports&outdoors.png",
  "Automotive": "/images/automotive.png",
  "Industrial & Scientific": "/images/industrial&scientific.png",
  "Movies, Music & Games": "/images/movies-music&games.png"
};

function slugify(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "");
}

export default function Categories() {
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredDepartments = DEPARTMENTS.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Head>
        <title>Categories - MIGISTUS | Browse Product Departments</title>
        <meta name="description" content="Explore MIGISTUS product categories and discover amazing group buying opportunities across all departments." />
      </Head>
      
      <MainNavbar />
      
      <div className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black text-white">
        {/* Hero Section */}
        <div className="relative overflow-hidden pt-20 pb-12">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/5 via-transparent to-purple-900/5" />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500/20 to-purple-500/20 px-6 py-2 rounded-full border border-yellow-500/30 mb-6">
                <Grid3X3 className="w-5 h-5 text-yellow-400" />
                <span className="text-sm font-semibold text-yellow-400">Browse Departments</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-black mb-4 bg-gradient-to-r from-yellow-400 via-orange-400 to-purple-400 bg-clip-text text-transparent">
                Explore Categories
              </h1>
              <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
                Discover premium products across all departments and unlock exclusive group buying prices.
              </p>
            </div>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/20 transition-all backdrop-blur-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredDepartments.map((dept) => (
              <Link
                key={dept.name}
                href={`/categories/${slugify(dept.name)}`}
                className="group"
              >
                <div className="relative bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl overflow-hidden hover:border-yellow-500/50 transition-all duration-300 hover:transform hover:scale-105 shadow-lg hover:shadow-yellow-500/20">
                  {/* Category Image */}
                  <div className="relative w-full h-48 overflow-hidden bg-gradient-to-br from-zinc-800 to-zinc-900">
                    <Image
                      src={departmentImages[dept.name] || "/images/placeholder.png"}
                      alt={dept.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                    
                    {/* Category Icon Badge */}
                    <div className="absolute top-3 right-3 text-2xl bg-black/60 backdrop-blur-md rounded-full w-12 h-12 flex items-center justify-center border border-zinc-700/50 group-hover:scale-110 transition-transform">
                      {dept.icon}
                    </div>
                  </div>
                  
                  {/* Category Info */}
                  <div className="p-5 space-y-2">
                    <h3 className="text-lg font-bold text-white group-hover:text-yellow-400 transition-colors">
                      {dept.name}
                    </h3>
                    <p className="text-zinc-400 text-sm">
                      {dept.description}
                    </p>
                  
                    {/* Hover Indicator */}
                    <div className="flex items-center text-yellow-400 opacity-0 group-hover:opacity-100 transition-all pt-2">
                      <span className="text-xs font-semibold">Explore Category</span>
                      <svg className="w-3.5 h-3.5 ml-1.5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* No Results Message */}
          {filteredDepartments.length === 0 && searchTerm && (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-800 border border-zinc-700 mb-4">
                <Search className="w-8 h-8 text-zinc-600" />
              </div>
              <div className="text-zinc-400 text-lg mb-2">No categories found matching "{searchTerm}"</div>
              <p className="text-zinc-500 text-sm mb-6">Try searching with different keywords</p>
              <button
                onClick={() => setSearchTerm("")}
                className="px-6 py-2.5 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 rounded-lg font-semibold transition-all"
              >
                Clear Search
              </button>
            </div>
          )}

          {/* Call to Action */}
          {filteredDepartments.length > 0 && (
            <div className="text-center mt-16">
              <div className="relative bg-gradient-to-br from-yellow-900/20 to-purple-900/20 border border-yellow-500/30 rounded-2xl p-8 max-w-2xl mx-auto backdrop-blur-sm overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-purple-500/5" />
                <div className="relative">
                  <Sparkles className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-white mb-3">Ready to Start Group Buying?</h2>
                  <p className="text-zinc-300 mb-6">
                    Join active drops and unlock exclusive pricing through community power.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                      href="/live-drops"
                      className="inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg shadow-yellow-500/30"
                    >
                      <Sparkles className="w-5 h-5 mr-2" />
                      View Live Drops
                    </Link>
                    <Link
                      href="/voting"
                      className="inline-flex items-center justify-center px-8 py-3 border-2 border-yellow-500/50 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 font-bold rounded-xl transition-all"
                    >
                      Vote for Products
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
