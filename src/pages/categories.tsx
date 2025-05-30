import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import MainNavbar from "@/components/nav/MainNavbar"; // Add this import

const DEPARTMENTS = [
  "Electronics",
  "Computers",
  "Smart Home",
  "Home, Garden & Tools",
  "Pet Supplies",
  "Food & Grocery",
  "Beauty & Health",
  "Toys, Kids & Baby",
  "Handmade",
  "Sports & Outdoors",
  "Automotive",
  "Industrial & Scientific",
  "Movies, Music & Games"
];

const departmentImages: Record<string, string> = {
  "Electronics": "/images/electronics.png",
  "Computers": "/images/computers.png",
  "Smart Home": "/images/smart-home.png",
  "Home, Garden & Tools": "/images/home.png",
  "Pet Supplies": "/images/pet.png",
  "Food & Grocery": "/images/food.png",
  "Beauty & Health": "/images/beauty.png",
  "Toys, Kids & Baby": "/images/toys.png",
  "Handmade": "/images/handmade.png",
  "Sports & Outdoors": "/images/sports.png",
  "Automotive": "/images/auto.png",
  "Industrial & Scientific": "/images/industrial.png",
  "Movies, Music & Games": "/images/movies.png"
};

function slugify(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "");
}

export default function Categories() {
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  return (
    <>
      <MainNavbar />
      <div className="min-h-screen bg-black text-yellow-400">
        {/* Browse Categories Dropdown */}
        <div className="relative flex justify-center mt-8 mb-2">
          <button
            className="flex items-center bg-zinc-900 border border-yellow-400/30 rounded-xl px-6 py-3 text-yellow-300 font-semibold shadow hover:bg-yellow-400/10 transition"
            onClick={() => setShowCategoryDropdown((v) => !v)}
            onBlur={() => setTimeout(() => setShowCategoryDropdown(false), 150)}
            aria-haspopup="listbox"
            aria-expanded={showCategoryDropdown}
          >
            <svg className="mr-2" width="20" height="20" fill="none" stroke="currentColor"><path d="M6 9l6 6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Browse Categories
            <svg className="ml-2" width="18" height="18" fill="none" stroke="currentColor"><path d="M6 9l6 6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          {showCategoryDropdown && (
            <div
              className="absolute z-30 mt-2 w-72 bg-zinc-900 border border-yellow-400/20 rounded-xl shadow-lg py-2"
              style={{ left: "50%", transform: "translateX(-50%)" }}
              tabIndex={-1}
              onMouseLeave={() => setShowCategoryDropdown(false)}
            >
              {DEPARTMENTS.map((cat) => (
                <Link
                  key={cat}
                  href={`/categories/${slugify(cat)}`}
                  className="flex items-center px-4 py-2 hover:bg-yellow-400/10 transition text-yellow-200"
                  onClick={() => setShowCategoryDropdown(false)}
                >
                  <span className="inline-block w-8 h-8 mr-3 relative">
                    <Image
                      src={departmentImages[cat] || "/images/placeholder.png"}
                      alt={cat}
                      fill
                      className="object-cover rounded-lg"
                      sizes="32px"
                    />
                  </span>
                  <span className="font-medium">{cat}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="w-full bg-zinc-900/50 border-b border-yellow-400/20 py-6 mb-8">
          <div className="max-w-6xl mx-auto px-6">
            <h1 className="text-4xl font-bold text-yellow-400 text-center drop-shadow-lg">
              Explore Categories
            </h1>
            <p className="text-blue-200 text-center mt-2">
              Browse by department and discover exclusive drops
            </p>
          </div>
        </div>
        <div className="flex justify-center">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-10 gap-y-14 w-full max-w-7xl">
            {DEPARTMENTS.map((cat) => (
              <Link
                key={cat}
                href={`/categories/${slugify(cat)}`}
                className="flex flex-col items-center group"
              >
                <div className="w-40 h-40 bg-zinc-900 border border-yellow-400 rounded-xl flex items-center justify-center mb-2 overflow-hidden group-hover:border-yellow-300 transition">
                  <Image
                    src={departmentImages[cat] || "/images/placeholder.png"}
                    alt={cat}
                    width={160}
                    height={160}
                    className="object-cover rounded"
                  />
                </div>
                <div className="text-yellow-400 text-lg font-semibold text-center group-hover:text-yellow-300 transition">
                  {cat}
                </div>
              </Link>
            ))}
          </div>
        </div>
        <div className="flex justify-center mt-10">
          <Link href="/drops" className="bg-yellow-400 text-black font-bold px-6 py-3 rounded hover:bg-yellow-300 transition">
            View All Drops
          </Link>
        </div>
      </div>
    </>
  );
}
