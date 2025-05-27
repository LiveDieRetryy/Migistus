// src/pages/products/[slug].tsx
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Head from "next/head";

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
};

export default function ProductPage() {
  const router = useRouter();
  const { slug } = router.query;
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (slug) {
      fetch(`/api/products`)
        .then((res) => res.json())
        .then((data: Product[]) => {
          const match = data.find(
            (p) => p.name.toLowerCase().replace(/\s+/g, "-") === slug
          );
          setProduct(match || null);
        });
    }
  }, [slug]);

  if (!product) return <p className="text-white p-8">Loading product...</p>;

  return (
    <>
      <Head>
        <title>{product.name} | Migistus</title>
      </Head>

      <div className="min-h-screen bg-black text-white p-6">
        <h1 className="text-3xl text-yellow-500 font-bold">{product.name}</h1>
        <img
          src={product.image}
          alt={product.name}
          className="mt-4 rounded-xl w-full max-w-md"
        />
        <p className="mt-4 text-lg">{product.description}</p>
        <p className="mt-2 text-yellow-300">
          Group Goal: {product.goal} buyers · Ends in {product.timeframe}
        </p>
      </div>
    </>
  );
}
