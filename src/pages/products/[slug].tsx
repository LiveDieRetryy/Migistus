// pages/products/[slug].tsx
import { useRouter } from "next/router";
import Head from "next/head";
import Image from "next/image";
import { useEffect, useState } from "react";

type PricingTier = { min: number; max: number; price: number };
type Product = {
  id: number;
  name: string;
  image: string;
  description: string;
  goal: number;
  link: string;
  timeframe: string;
  category: string;
  votes?: number;
  featured?: boolean;
  pledges: number;
  pricingTiers?: PricingTier[];
};

function slugify(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "");
}

export default function ProductPage() {
  const router = useRouter();
  const { slug } = router.query;
  const [product, setProduct] = useState<Product | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [pledges, setPledges] = useState(0);
  const [pledged, setPledged] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchProduct = async () => {
    setLoading(true);
    const res = await fetch("/api/products");
    const data = await res.json();
    const match = (data.products || data).find(
      (p: Product) => slugify(p.name) === slug
    );
    setProduct(match || null);
    setPledges(match?.pledges || 0);
    // Parse timeframe as days, convert to seconds
    if (match?.timeframe) {
      // Extract number from string like "30 days"
      const daysMatch = match.timeframe.match(/(\d+)/);
      const days = daysMatch ? parseInt(daysMatch[1]) : 30;
      setTimeLeft(days * 24 * 60 * 60);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  useEffect(() => {
    if (timeLeft > 0) {
      const interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${d}d ${h}h ${m}m ${s}s`;
  };

  const getCurrentPrice = () => {
    if (!product?.pricingTiers) return null;
    const tier = product.pricingTiers.find(
      (t) => pledges >= t.min && pledges <= t.max
    );
    return tier ? tier.price : product.pricingTiers[0].price;
  };

  const handlePledge = async () => {
    if (!product || pledged) return;
    setLoading(true);
    const res = await fetch("/api/products", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...product, pledges: pledges + 1 }),
    });
    if (res.ok) {
      await fetchProduct(); // Refetch to sync
      setPledged(true);
    }
    setLoading(false);
  };

  if (!product || loading) return <p className="text-white p-8">Loading product...</p>;

  return (
    <>
      <Head>
        <title>{product.name} — MIGISTUS</title>
      </Head>
      <div className="min-h-screen bg-zinc-900 text-white p-10">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div className="rounded-xl overflow-hidden border border-yellow-400/30 shadow-lg">
            <Image
              src={product.image}
              alt={product.name}
              width={600}
              height={600}
              className="w-full h-auto object-cover"
            />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-yellow-400 mb-4">{product.name}</h1>
            <p className="text-gray-300 mb-6">{product.description}</p>
            <p className="text-yellow-500 mb-2 font-semibold">
              Goal: {product.goal} units · Pledged: {pledges}
            </p>
            <p className="text-zinc-400 mb-2">Time left: {formatTime(timeLeft)}</p>
            <p className="text-zinc-400 mb-6">Category: {product.category}</p>
            {product.pricingTiers && (
              <div className="mb-4">
                <span className="text-yellow-400 font-bold">
                  Current Price: ${getCurrentPrice()}
                </span>
              </div>
            )}
            <a
              href={product.link}
              target="_blank"
              rel="noreferrer"
              className="bg-yellow-400 hover:bg-yellow-300 text-black px-6 py-3 rounded-lg font-bold transition-all"
            >
              View Product Source ↗
            </a>
            <button
              onClick={handlePledge}
              disabled={pledged || pledges >= product.goal || timeLeft <= 0}
              className="bg-yellow-400 hover:bg-yellow-300 text-black px-6 py-3 rounded-lg font-bold transition-all mt-4"
            >
              {pledged ? "Pledged!" : "Pledge"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
