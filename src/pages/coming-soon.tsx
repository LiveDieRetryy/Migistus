import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import MainNavbar from "@/components/nav/MainNavbar";
import { useRef, useState, useEffect } from "react";

export default function ComingSoonPage() {
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

  const comingSoonRef = useRef<HTMLDivElement>(null);
  const [comingSoonOffset, setComingSoonOffset] = useState(0);
  const comingSoonItemWidth = 200;

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

  // Prevent page scroll when hovering over the carousel area
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
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

  return (
    <>
      <Head>
        <title>Coming Soon Drops - MIGISTUS</title>
      </Head>
      <MainNavbar />
      <div className="min-h-screen bg-zinc-900 text-white font-sans">
        <section className="relative px-6 py-12 text-center">
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
                ref={comingSoonRef}
                tabIndex={0}
                onWheel={handleComingSoonWheel}
                style={{
                  transform: `translateX(-${comingSoonOffset}px)`,
                  transition: "none",
                  minWidth: "100%",
                  willChange: "transform",
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
            <Link href="/drops">
              <button className="bg-yellow-600 hover:bg-yellow-500 text-black font-semibold py-2 px-6 rounded transition text-lg shadow-md">
                View All Drops
              </button>
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
