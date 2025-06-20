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
  "Computers": "/images/computers.png",
  "Smart Home": "/images/smarthome.png",
  "Home, Garden & Tools": "/images/home.png",
  "Pet Supplies": "/images/pet.png",
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
      
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white">
        {/* Hero Section */}
        <div className="relative overflow-hidden pt-8 pb-16">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/10 via-transparent to-purple-900/10" />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <Grid3X3 className="w-16 h-16 text-yellow-400" />
                  <Sparkles className="w-6 h-6 text-yellow-300 absolute -top-2 -right-2 animate-pulse" />
                </div>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
                <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                  Explore Categories
                </span>
              </h1>
              <p className="text-xl text-zinc-300 max-w-3xl mx-auto leading-relaxed">
                Discover premium products across all departments. Find your perfect group buy and unlock exclusive pricing.
              </p>
            </div>

            {/* Search and Quick Access */}
            <div className="max-w-2xl mx-auto mb-12">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-zinc-800/50 border border-zinc-700 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-zinc-400 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all"
                />
              </div>
              
              {/* Quick Access Dropdown */}
              <div className="relative mt-4">
                <button
                  className="flex items-center justify-center w-full bg-zinc-800/30 border border-zinc-700 rounded-xl px-6 py-3 text-zinc-300 font-medium hover:bg-zinc-700/50 hover:border-yellow-500/50 transition-all group"
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                >
                  <Grid3X3 className="mr-2 w-5 h-5" />
                  Quick Category Access
                  <ChevronDown className={`ml-2 w-5 h-5 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showCategoryDropdown && (
                  <div className="absolute z-30 mt-2 w-full bg-zinc-800/95 backdrop-blur-sm border border-zinc-700 rounded-xl shadow-2xl py-2 max-h-80 overflow-y-auto">
                    {DEPARTMENTS.map((dept) => (
                      <Link
                        key={dept.name}
                        href={`/categories/${slugify(dept.name)}`}
                        className="flex items-center px-4 py-3 hover:bg-yellow-500/10 transition-colors text-zinc-200 hover:text-yellow-300"
                        onClick={() => setShowCategoryDropdown(false)}
                      >
                        <span className="text-2xl mr-3">{dept.icon}</span>
                        <div>
                          <div className="font-medium">{dept.name}</div>
                          <div className="text-sm text-zinc-400">{dept.description}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
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
                <div className="bg-zinc-800/30 border border-zinc-700 rounded-2xl p-6 hover:bg-zinc-700/30 hover:border-yellow-500/50 transition-all duration-300 hover:transform hover:scale-105">
                  {/* Category Image */}
                  <div className="relative w-full h-48 mb-4 rounded-xl overflow-hidden bg-zinc-700/50">
                    <Image
                      src={departmentImages[dept.name] || "/images/placeholder.png"}
                      alt={dept.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-110"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    
                    {/* Category Icon Overlay */}
                    <div className="absolute top-4 right-4 text-3xl bg-black/50 rounded-full w-12 h-12 flex items-center justify-center backdrop-blur-sm">
                      {dept.icon}
                    </div>
                  </div>
                  
                  {/* Category Info */}
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-white group-hover:text-yellow-300 transition-colors">
                      {dept.name}
                    </h3>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      {dept.description}
                    </p>
                  </div>
                  
                  {/* Hover Indicator */}
                  <div className="mt-4 flex items-center text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-sm font-medium">Explore Category</span>
                    <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* No Results Message */}
          {filteredDepartments.length === 0 && searchTerm && (
            <div className="text-center py-12">
              <div className="text-zinc-400 text-lg mb-4">No categories found matching "{searchTerm}"</div>
              <button
                onClick={() => setSearchTerm("")}
                className="text-yellow-400 hover:text-yellow-300 font-medium transition-colors"
              >
                Clear search
              </button>
            </div>
          )}

          {/* Call to Action */}
          <div className="text-center mt-16">
            <div className="bg-gradient-to-r from-zinc-800/50 to-zinc-700/50 border border-zinc-600 rounded-2xl p-8 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-yellow-400 mb-4">Ready to Start Group Buying?</h2>
              <p className="text-zinc-300 mb-6">
                Join active drops and unlock exclusive pricing through community power.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/drops"
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-8 rounded-xl transition-colors inline-flex items-center justify-center"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  View Active Drops
                </Link>
                <Link
                  href="/voting"
                  className="border border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-black font-bold py-3 px-8 rounded-xl transition-colors inline-flex items-center justify-center"
                >
                  Vote for Products
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
