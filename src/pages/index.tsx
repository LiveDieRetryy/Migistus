import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import MainNavbar from "@/components/nav/MainNavbar";
import { useRef, useState, useEffect } from "react";

export default function HomePage() {
  // Add a slugify helper for category links
  function slugify(name: string) {
    return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "");
  }

  // Use the full DEPARTMENTS list (excluding "All") for categories
  const categories = [
    { name: "Electronics", image: "/images/electronics.png" },
    { name: "Beauty & Health", image: "/images/beauty.png" },
    { name: "Toys, Kids & Baby", image: "/images/toys.png" },
    { name: "Home, Garden & Tools", image: "/images/home.png" },
    { name: "Computers", image: "/images/computers.png" },
    { name: "Smart Home", image: "/images/smart-home.png" },
    { name: "Pet Supplies", image: "/images/pet.png" },
    { name: "Food & Grocery", image: "/images/food.png" },
    { name: "Handmade", image: "/images/handmade.png" },
    { name: "Sports & Outdoors", image: "/images/sports.png" },
    { name: "Automotive", image: "/images/auto.png" },
    { name: "Industrial & Scientific", image: "/images/industrial.png" },
    { name: "Movies, Music & Games", image: "/images/movies.png" }
  ];

  // Coming soon categories (example, you can adjust images/names as needed)
  const comingSoonCategories = [
    { name: "Electronics", image: "/images/electronics.png", date: "in 4 days" },
    { name: "Beauty & Health", image: "/images/beauty.png", date: "in 7 days" },
    { name: "Toys, Kids & Baby", image: "/images/toys.png", date: "in 10 days" },
    { name: "Home, Garden & Tools", image: "/images/home.png", date: "in 12 days" },
    { name: "Computers", image: "/images/computers.png", date: "in 14 days" },
    { name: "Smart Home", image: "/images/smart-home.png", date: "in 16 days" },
    { name: "Pet Supplies", image: "/images/pet.png", date: "in 18 days" },
    { name: "Food & Grocery", image: "/images/food.png", date: "in 20 days" },
    { name: "Handmade", image: "/images/handmade.png", date: "in 22 days" },
    { name: "Sports & Outdoors", image: "/images/sports.png", date: "in 24 days" },
    { name: "Automotive", image: "/images/auto.png", date: "in 26 days" },
    { name: "Industrial & Scientific", image: "/images/industrial.png", date: "in 28 days" },
    { name: "Movies, Music & Games", image: "/images/movies.png", date: "in 30 days" }
  ];

  // Example trending drops array (replace/add more as needed)
  const trendingDrops = [
    {
      name: "Warehouse-15 LED Headlamp",
      price: 18,
      image: "/images/headlamp.png",
      link: "/drops/warehouse-15-led-headlamp",
      endsIn: "2h 9m",
      description: "Current Price: $18",
    },
    // Add more trending drops here as you expand
    // {
    //   name: "Another Trending Product",
    //   price: 25,
    //   image: "/images/another.png",
    //   link: "/drops/another-trending-product",
    //   endsIn: "1h 30m",
    //   description: "Current Price: $25",
    // },
  ];

  const carouselRef = useRef<HTMLDivElement>(null);
  const comingSoonRef = useRef<HTMLDivElement>(null);
  const trendingRef = useRef<HTMLDivElement | null>(null);
  const [scrollPos, setScrollPos] = useState(0);

  // Animation state for infinite smooth scroll
  const [carouselOffset, setCarouselOffset] = useState(0);
  const [comingSoonOffset, setComingSoonOffset] = useState(0);
  const [trendingOffset, setTrendingOffset] = useState(0);

  // Calculate total scroll width for infinite loop
  const categoryItemWidth = 200; // px, matches w-48 + margin
  const comingSoonItemWidth = 200;
  const trendingItemWidth = 260; // px, adjust as needed

  // Infinite auto-scroll for categories (forward)
  useEffect(() => {
    let raf: number;
    let last = Date.now();
    function animate() {
      const now = Date.now();
      const delta = now - last;
      last = now;
      setCarouselOffset((prev) => {
        let next = prev + (delta * 0.03);
        if (next >= categories.length * categoryItemWidth) {
          next = 0;
        }
        return next;
      });
      raf = requestAnimationFrame(animate);
    }
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [categories.length]);

  // Infinite auto-scroll for coming soon (forward)
  useEffect(() => {
    let raf: number;
    let last = Date.now();
    function animate() {
      const now = Date.now();
      const delta = now - last;
      last = now;
      setComingSoonOffset((prev) => {
        let next = prev + (delta * 0.03);
        if (next >= comingSoonCategories.length * comingSoonItemWidth) {
          next = 0;
        }
        return next;
      });
      raf = requestAnimationFrame(animate);
    }
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [comingSoonCategories.length]);

  // Trending auto-scroll (optional, can remove if not desired)
  useEffect(() => {
    let raf: number;
    let last = Date.now();
    function animate() {
      const now = Date.now();
      const delta = now - last;
      last = now;
      setTrendingOffset((prev) => {
        let next = prev + (delta * 0.03);
        if (next >= trendingDrops.length * trendingItemWidth) {
          next = 0;
        }
        return next;
      });
      raf = requestAnimationFrame(animate);
    }
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [trendingDrops.length]);

  const scrollBy = (amount: number) => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: amount, behavior: "smooth" });
      setScrollPos(carouselRef.current.scrollLeft + amount);
    }
  };

  const scrollComingSoon = (amount: number) => {
    if (comingSoonRef.current) {
      comingSoonRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  // Auto-scroll logic for carousels
  useEffect(() => {
    let autoScroll: NodeJS.Timeout | null = null;
    if (carouselRef.current) {
      autoScroll = setInterval(() => {
        if (carouselRef.current) {
          carouselRef.current.scrollBy({ left: 1, behavior: "smooth" });
        }
      }, 20);
    }
    return () => {
      if (autoScroll) clearInterval(autoScroll);
    };
  }, []);

  useEffect(() => {
    let autoScroll: NodeJS.Timeout | null = null;
    if (comingSoonRef.current) {
      autoScroll = setInterval(() => {
        if (comingSoonRef.current) {
          comingSoonRef.current.scrollBy({ left: 1, behavior: "smooth" });
        }
      }, 20);
    }
    return () => {
      if (autoScroll) clearInterval(autoScroll);
    };
  }, []);

  // Prevent page scroll when hovering over the carousel area
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (
        carouselRef.current &&
        carouselRef.current.matches(":hover")
      ) {
        e.preventDefault();
      }
      if (
        comingSoonRef.current &&
        comingSoonRef.current.matches(":hover")
      ) {
        e.preventDefault();
      }
    };
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, []);

  // Bidirectional infinite wheel scroll for carousels
  const handleCarouselWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (carouselRef.current) {
      e.preventDefault();
      let newOffset = carouselOffset + (e.deltaY || e.deltaX);
      const totalWidth = categories.length * categoryItemWidth;
      // Wrap around both directions
      if (newOffset < 0) newOffset = totalWidth + newOffset;
      if (newOffset >= totalWidth) newOffset = newOffset - totalWidth;
      setCarouselOffset(newOffset);
    }
  };
  const handleComingSoonWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (comingSoonRef.current) {
      e.preventDefault();
      let newOffset = comingSoonOffset + (e.deltaY || e.deltaX);
      const totalWidth = comingSoonCategories.length * comingSoonItemWidth;
      if (newOffset < 0) newOffset = totalWidth + newOffset;
      if (newOffset >= totalWidth) newOffset = newOffset - totalWidth;
      setComingSoonOffset(newOffset);
    }
  };

  // Trending scroll logic: prevent page scroll on hover, allow bidirectional infinite scroll
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (
        trendingRef.current &&
        trendingRef.current.matches(":hover")
      ) {
        e.preventDefault();
      }
    };
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, []);

  const handleTrendingWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (trendingRef.current) {
      e.preventDefault();
      let newOffset = trendingOffset + (e.deltaY || e.deltaX);
      const totalWidth = trendingDrops.length * trendingItemWidth;
      if (newOffset < 0) newOffset = totalWidth + newOffset;
      if (newOffset >= totalWidth) newOffset = newOffset - totalWidth;
      setTrendingOffset(newOffset);
    }
  };

  // For toolbar dropdown
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  return (
    <>
      <Head>
        <title>MIGISTUS — The Guilded Marketplace</title>
      </Head>

      <MainNavbar />

      <div className="min-h-screen bg-black text-white font-sans">
        {/* Category Toolbar Dropdown */}
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
              {categories.map((cat) => (
                <Link
                  key={cat.name}
                  href={`/categories/${slugify(cat.name)}`}
                  className="flex items-center px-4 py-2 hover:bg-yellow-400/10 transition text-yellow-200"
                  onClick={() => setShowCategoryDropdown(false)}
                >
                  <span className="inline-block w-8 h-8 mr-3 relative">
                    <Image
                      src={cat.image}
                      alt={cat.name}
                      fill
                      className="object-cover rounded-lg"
                      sizes="32px"
                    />
                  </span>
                  <span className="font-medium">{cat.name}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Category Carousel */}
        <section className="relative px-6 py-8">
          {/* Stylized header */}
          <div className="mb-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-yellow-400 drop-shadow-lg tracking-wide">
              Explore Categories
            </h2>
            <p className="text-gray-400 text-base mt-2">
              Browse by department and discover exclusive drops
            </p>
          </div>
          <div className="relative overflow-hidden" style={{ height: 180 }}>
            <div
              className="flex items-center"
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none"
              }}
            >
              <div
                className="flex"
                style={{
                  transform: `translateX(-${carouselOffset}px)`,
                  transition: "none",
                  minWidth: "100%",
                  willChange: "transform"
                }}
                ref={carouselRef}
                tabIndex={0}
                onWheel={handleCarouselWheel}
                style={{
                  ...{
                    transform: `translateX(-${carouselOffset}px)`,
                    transition: "none",
                    minWidth: "100%",
                    willChange: "transform"
                  },
                  pointerEvents: "auto"
                }}
              >
                {/* Duplicate categories for seamless loop */}
                {[...categories, ...categories].map((cat, idx) => (
                  <Link
                    key={cat.name + idx}
                    href={`/categories/${slugify(cat.name)}`}
                    className="flex-shrink-0 w-48 mx-2 snap-center block text-center hover:scale-105 transition-transform"
                    style={{ minWidth: 180, pointerEvents: "auto" }}
                  >
                    <div className="relative w-32 h-32 mx-auto rounded-2xl mb-2 border border-yellow-400/10 bg-zinc-800/80 shadow-inner hover:border-yellow-400/40 transition-all">
                      <Image 
                        src={cat.image} 
                        alt={cat.name} 
                        fill
                        className="object-cover rounded-2xl"
                        sizes="128px"
                      />
                    </div>
                    <span className="text-yellow-300 font-medium text-lg">{cat.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
          {/* View Drops Button */}
          <div className="mt-6 flex justify-center">
            <Link href="/drops">
              <button className="bg-yellow-600 hover:bg-yellow-500 text-black font-semibold py-2 px-6 rounded transition text-lg shadow-md">
                View All Drops
              </button>
            </Link>
          </div>
          {/* Trending Drop (now a horizontal scroll bar) */}
          <section className="px-6 py-12 text-center">
            <h2 className="text-yellow-500 text-lg font-semibold mb-6">Trending Drops</h2>
            <div className="relative overflow-hidden" style={{ height: 320 }}>
              <div
                className="flex items-center"
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: "100%",
                  height: "100%",
                  pointerEvents: "none"
                }}
              >
                <div
                  className="flex"
                  style={{
                    transform: `translateX(-${trendingOffset}px)`,
                    transition: "none",
                    minWidth: "100%",
                    willChange: "transform"
                  }}
                  ref={trendingRef}
                  tabIndex={0}
                  onWheel={handleTrendingWheel}
                  style={{
                    ...{
                      transform: `translateX(-${trendingOffset}px)`,
                      transition: "none",
                      minWidth: "100%",
                      willChange: "transform"
                    },
                    pointerEvents: "auto"
                  }}
                >
                  {[...trendingDrops, ...trendingDrops].map((drop, idx) => (
                    <Link
                      key={drop.name + idx}
                      href={drop.link}
                      className="flex-shrink-0 w-64 mx-4 snap-center block text-center hover:scale-105 transition-transform"
                      style={{ minWidth: 240, pointerEvents: "auto" }}
                    >
                      <div className="relative w-48 h-48 mx-auto mb-4 cursor-pointer rounded-2xl border border-yellow-400/10 bg-zinc-800/80 shadow-inner hover:border-yellow-400/40 transition-all flex items-center justify-center">
                        <Image 
                          src={drop.image} 
                          alt={drop.name} 
                          fill
                          className="object-contain rounded-2xl"
                          sizes="192px"
                        />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">{drop.name}</h3>
                      <p className="text-yellow-400 text-md">{drop.description}</p>
                      <p className="text-sm text-gray-400 mb-2">Ends in: {drop.endsIn}</p>
                      <button className="bg-yellow-600 hover:bg-yellow-500 text-black font-semibold py-2 px-6 rounded transition">
                        Join Drop
                      </button>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </section>

        {/* Coming Soon Carousel */}
        <section className="relative px-6 py-12 bg-zinc-900 text-center">
          <div className="mb-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-yellow-400 drop-shadow-lg tracking-wide">
              Coming Soon
            </h2>
            <p className="text-gray-400 text-base mt-2">
              Upcoming drops by category — join the waitlist!
            </p>
          </div>
          <div className="relative overflow-hidden" style={{ height: 180 }}>
            <div
              className="flex items-center"
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none"
              }}
            >
              <div
                className="flex"
                style={{
                  transform: `translateX(-${comingSoonOffset}px)`,
                  transition: "none",
                  minWidth: "100%",
                  willChange: "transform"
                }}
                ref={comingSoonRef}
                tabIndex={0}
                onWheel={handleComingSoonWheel}
                style={{
                  ...{
                    transform: `translateX(-${comingSoonOffset}px)`,
                    transition: "none",
                    minWidth: "100%",
                    willChange: "transform"
                  },
                  pointerEvents: "auto"
                }}
              >
                {[...comingSoonCategories, ...comingSoonCategories].map((cat, idx) => (
                  <div
                    key={cat.name + idx}
                    className="flex-shrink-0 w-48 mx-2 snap-center block text-center hover:scale-105 transition-transform"
                    style={{ minWidth: 180, pointerEvents: "auto" }}
                  >
                    <div className="relative w-32 h-32 mx-auto rounded-2xl mb-2 border border-yellow-400/10 bg-zinc-800/80 shadow-inner hover:border-yellow-400/40 transition-all">
                      <Image 
                        src={cat.image} 
                        alt={cat.name} 
                        fill
                        className="object-cover rounded-2xl"
                        sizes="128px"
                      />
                      <div className="absolute bottom-2 right-2 bg-yellow-400 text-black text-sm px-3 py-1 rounded-full shadow">
                        {cat.date}
                      </div>
                    </div>
                    <span className="text-yellow-300 font-medium text-lg">{cat.name}</span>
                    <div className="mt-3">
                      <button className="bg-yellow-600 hover:bg-yellow-500 text-black font-semibold py-2 px-6 rounded transition text-base">
                        Join Waitlist
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* View All Incoming Drops Button */}
          <div className="mt-6 flex justify-center">
            <Link href="/coming-soon">
              <button className="bg-yellow-600 hover:bg-yellow-500 text-black font-semibold py-2 px-6 rounded transition text-lg shadow-md">
                View All Incoming Drops
              </button>
            </Link>
          </div>
        </section>

        {/* Vote Section */}
        <section className="px-6 py-12 text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Vote on Next Products</h2>
          <p className="text-gray-300 mb-4">Vote for your products prepared:</p>
          <h3 className="text-2xl font-bold text-white mb-4">Multifunctional Laptop Stand</h3>
          <div className="relative w-48 h-48 mx-auto mb-4">
            <Image 
              src="/images/laptop-stand.png" 
              alt="Laptop Stand" 
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 192px"
            />
          </div>
          <Link href="/voting">
            <button className="bg-yellow-600 hover:bg-yellow-500 text-black font-semibold py-2 px-6 rounded transition">
              Vote Now
            </button>
          </Link>
        </section>
      </div>
    </>
  );
}
