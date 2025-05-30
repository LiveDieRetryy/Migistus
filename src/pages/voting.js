import Head from "next/head";
import MainNavbar from "@/components/nav/MainNavbar";
import Link from "next/link";
import { useEffect, useState } from "react";

function slugify(name) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "");
}

export default function VotingPage() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        // Only show products NOT in liveDrop, staffPick, or comingSoon
        if (Array.isArray(data.products)) {
          setProducts(
            data.products.filter(
              (p) => !p.liveDrop && !p.staffPick && !p.comingSoon
            )
          );
        }
      });
  }, []);

  return (
    <>
      <Head>
        <title>Vote for Drops - MIGISTUS</title>
      </Head>
      <MainNavbar />
      <div className="min-h-screen bg-zinc-950 text-white p-8">
        <h1 className="text-4xl font-bold text-yellow-400 mb-8">
          Vote for Upcoming Drops
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-zinc-900 border border-yellow-500/20 rounded-lg p-6 hover:border-yellow-500 transition-all"
            >
              <Link
                href={`/products/${
                  product.slug ? product.slug : slugify(product.name)
                }`}
              >
                <h2 className="text-xl font-bold mb-2 text-yellow-400 hover:underline">
                  {product.name}
                </h2>
              </Link>
              <p className="text-gray-400 mb-2">{product.description}</p>
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-gray-400">{product.category}</span>
                <button className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-2 px-4 rounded transition">
                  Vote
                </button>
              </div>
            </div>
          ))}
        </div>
        {products.length === 0 && (
          <div className="text-gray-400 mt-12 text-center">
            No products available for voting at this time.
          </div>
        )}
      </div>
    </>
  );
}