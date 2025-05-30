import Head from "next/head";
import Link from "next/link";
import MainNavbar from "@/components/nav/MainNavbar";
import { useEffect, useRef } from "react";

function Feature({ icon, title, text }: { icon: string, title: string, text: string }) {
  return (
    <div className="bg-zinc-900 rounded-lg p-6 border border-yellow-500/20">
      <h3 className="text-yellow-300 font-bold text-lg mb-2 flex items-center">
        <span className="text-2xl mr-2">{icon}</span> {title}
      </h3>
      <p className="text-zinc-400 text-sm">{text}</p>
    </div>
  );
}

// Twinkling stars background component
function TwinklingStars({ count = 60 }: { count?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    // Remove previous stars
    container.innerHTML = "";
    for (let i = 0; i < count; i++) {
      const star = document.createElement("div");
      const size = Math.random() * 2 + 1.5;
      const left = Math.random() * 100;
      const top = Math.random() * 100;
      const duration = 2 + Math.random() * 3;
      const delay = Math.random() * 5;
      star.style.position = "absolute";
      star.style.left = `${left}%`;
      star.style.top = `${top}%`;
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      star.style.borderRadius = "50%";
      star.style.background = "radial-gradient(circle, #FFD700 70%, #fff0 100%)";
      star.style.opacity = "0.85";
      star.style.boxShadow = `0 0 8px 2px #FFD70088`;
      star.style.animation = `twinkle ${duration}s infinite alternate`;
      star.style.animationDelay = `${delay}s`;
      container.appendChild(star);
    }
  }, [count]);

  return (
    <>
      <style>
        {`
        @keyframes twinkle {
          0% { opacity: 0.7; transform: scale(1);}
          50% { opacity: 1; transform: scale(1.3);}
          100% { opacity: 0.7; transform: scale(1);}
        }
        `}
      </style>
      <div
        ref={containerRef}
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden="true"
        style={{
          overflow: "hidden",
        }}
      />
    </>
  );
}

export default function LandingPage() {
  return (
    <>
      <Head>
        <title>MIGISTUS — The Guilded Marketplace</title>
        <meta name="description" content="Migistus is a movement. A marketplace forged by the people, for the people — where unity drives down prices, and your voice helps shape what comes next." />
      </Head>
      <MainNavbar />
      <div className="relative bg-black text-white font-sans px-2 sm:px-6 py-6 sm:py-12 space-y-10 sm:space-y-16 min-h-screen overflow-hidden">
        {/* Animated twinkling gold stars background */}
        <TwinklingStars count={60} />
        {/* Hero Section */}
        <section className="text-center max-w-3xl mx-auto bg-zinc-900/70 rounded-2xl border border-yellow-400/10 shadow-lg p-4 sm:p-8 backdrop-blur-md">
          <h1
            className="text-3xl sm:text-5xl font-bold text-yellow-400 mb-2"
            style={{
              letterSpacing: "0.01em"
            }}
          >
            🛡️ Welcome to MIGISTUS
          </h1>
          <p
            className="text-xl sm:text-2xl md:text-3xl font-semibold text-yellow-400 mb-4"
            style={{
              letterSpacing: "0.02em"
            }}
          >
            The Guilded Marketplace
          </p>
          <p className="mt-4 text-zinc-400 max-w-2xl mx-auto text-base sm:text-lg">
            Migistus is not just a store. It’s a movement. A marketplace forged by the people, for the people — where unity drives down prices, and your voice helps shape what comes next.
          </p>
          <div className="mt-8 flex justify-center">
            <Link href="/drops">
              <button className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 sm:py-4 px-6 sm:px-10 rounded-2xl shadow-lg text-lg sm:text-xl transition-all">
                Explore Drops
              </button>
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="relative max-w-5xl mx-auto bg-zinc-900/70 rounded-2xl border border-yellow-400/10 shadow-lg p-4 sm:p-8 backdrop-blur-md">
          <div className="absolute left-1/2 -translate-x-1/2 w-20 sm:w-32 h-1 bg-gradient-to-r from-yellow-400/30 via-yellow-400/60 to-yellow-400/30 rounded-full mb-10 top-0" />
          <h2 className="text-lg sm:text-2xl text-yellow-400 font-semibold mb-6 text-center mt-10">🔥 What Makes Migistus Different?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <Feature icon="💠" title="Group Buying Reimagined" text="Instead of paying full price alone, you pledge into product drops with others. As more people join, prices fall. When the threshold is met, the drop locks in." />
            <Feature icon="💠" title="Vote-Driven Curation" text="You don’t just shop — you vote. Help decide what launches next. Guild and MIGISTUS tiers get extra voting power." />
            <Feature icon="💠" title="Limited Drops, Big Rewards" text="Each drop is time-limited. Once it expires, it's gone — unless voted back. It creates urgency and strategy in every drop." />
            <Feature icon="💠" title="Earn Perks Through Ranks" text="Advance from Initiate to Guild to MIGISTUS. Perks include cashback, faster chat cooldowns, and boosted votes." />
            <Feature icon="💠" title="Social Commerce, Reforged" text="Live product chat, community flair, and drop stats — shop together, rise together." />
          </div>
        </section>

        {/* How It Works */}
        <section className="max-w-3xl mx-auto text-center bg-zinc-900/70 rounded-2xl border border-yellow-400/10 shadow-lg p-4 sm:p-8 backdrop-blur-md">
          <h2 className="text-yellow-400 text-lg sm:text-2xl font-semibold mb-4">🧠 How It Works</h2>
          <ol className="text-zinc-300 space-y-2 text-left list-decimal list-inside text-base sm:text-lg">
            <li>Vote for what you want to see in the store</li>
            <li>Pledge to drops that excite you</li>
            <li>Watch the price fall as others join</li>
            <li>Get rewarded when the MOQ is reached</li>
            <li>Earn perks by subscribing and ranking up</li>
          </ol>
        </section>

        {/* Why Migistus */}
        <section className="text-center max-w-3xl mx-auto bg-zinc-900/70 rounded-2xl border border-yellow-400/10 shadow-lg p-4 sm:p-8 backdrop-blur-md">
          <h2 className="text-yellow-400 text-lg sm:text-2xl font-semibold mb-2">⚔️ Why MIGISTUS?</h2>
          <blockquote className="text-lg sm:text-xl italic text-zinc-200 mb-4">“Alone, you're just a buyer. Together, you're a guild.”</blockquote>
          <p className="text-zinc-400 text-base sm:text-lg">
            Migistus challenges the standard retail model. It’s a platform where demand shapes supply, community unlocks savings, and every purchase is a shared conquest.
          </p>
        </section>

        {/* Call to Action Buttons */}
        <section className="flex flex-col sm:flex-row gap-4 justify-center pt-8 max-w-3xl mx-auto bg-zinc-900/70 rounded-2xl border border-yellow-400/10 shadow-lg p-4 sm:p-8 backdrop-blur-md">
          <Link href="/drops">
            <button className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 px-8 rounded-xl shadow transition-all text-lg">
              Explore Drops
            </button>
          </Link>
          <Link href="/voting">
            <button className="bg-zinc-900 border border-yellow-500 text-yellow-400 font-bold py-3 px-8 rounded-xl hover:bg-yellow-500 hover:text-black transition-all text-lg">
              View Vote Board
            </button>
          </Link>
          <Link href="/categories">
            <button className="bg-zinc-900 border border-yellow-500 text-yellow-400 font-bold py-3 px-8 rounded-xl hover:bg-yellow-500 hover:text-black transition-all text-lg">
              Browse Categories
            </button>
          </Link>
        </section>
      </div>
    </>
  );
}
