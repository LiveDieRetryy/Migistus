import Head from "next/head";
import MainNavbar from "@/components/nav/MainNavbar";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";

interface Product {
  id: string | number;
  name: string;
  description: string;
  slug?: string; // <-- Add this line
}

export default function DropsPage() {
  const [products, setProducts] = useState<Product[]>([]);

  // Trending Drops Data (reuse from home page)
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

  // Trending scroll logic
  const trendingRef = useRef<HTMLDivElement | null>(null);
  const [trendingOffset, setTrendingOffset] = useState(0);
  const trendingItemWidth = 260;

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

  useEffect(() => {
    fetch("/api/products")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.products)) {
          setProducts(data.products);
        }
      })
      .catch(console.error);
  }, []);

  return (
    <>
      <Head>
        <title>Active Drops - MIGISTUS</title>
      </Head>
      <MainNavbar />

      {/* Trending Drops Section */}
      <section className="px-2 sm:px-6 py-8 sm:py-12 text-center">
        <h2 className="text-yellow-500 text-lg sm:text-2xl font-semibold mb-6">Trending Drops</h2>
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
              ref={trendingRef}
              tabIndex={0}
              onWheel={handleTrendingWheel}
              style={{
                transform: `translateX(-${trendingOffset}px)`,
                transition: "none",
                minWidth: "100%",
                willChange: "transform",
                pointerEvents: "auto"
              }}
            >
              {[...trendingDrops, ...trendingDrops].map((drop, idx) => (
                <Link
                  key={drop.name + idx}
                  href={drop.link}
                  className="flex-shrink-0 w-56 sm:w-64 mx-2 sm:mx-4 snap-center block text-center hover:scale-105 transition-transform"
                  style={{ minWidth: 200, pointerEvents: "auto" }}
                >
                  <div className="relative w-40 h-40 sm:w-48 sm:h-48 mx-auto mb-4 cursor-pointer rounded-2xl border border-yellow-400/10 bg-zinc-800/80 shadow-inner hover:border-yellow-400/40 transition-all flex items-center justify-center">
                    <Image 
                      src={drop.image} 
                      alt={drop.name} 
                      fill
                      className="object-contain rounded-2xl"
                      sizes="(max-width: 640px) 160px, 192px"
                    />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">{drop.name}</h3>
                  <p className="text-yellow-400 text-md">{drop.description}</p>
                  <p className="text-sm text-gray-400 mb-2">Ends in: {drop.endsIn}</p>
                  <button className="bg-yellow-600 hover:bg-yellow-500 text-black font-semibold py-2 px-4 sm:px-6 rounded transition text-sm sm:text-base">
                    Join Drop
                  </button>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="min-h-screen bg-zinc-950 text-white px-2 sm:px-8 py-6">
        <h1 className="text-2xl sm:text-4xl font-bold text-yellow-400 mb-8">Active Drops</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {products.map(product => (
            <Link key={product.id} href={`/drops/${product.slug || product.id}`}>
              <div className="bg-zinc-900 border border-yellow-500/20 rounded-lg p-4 sm:p-6 hover:border-yellow-500 transition-all">
                <h2 className="text-lg sm:text-xl font-bold mb-2">{product.name}</h2>
                <p className="text-gray-400 text-sm sm:text-base">{product.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
