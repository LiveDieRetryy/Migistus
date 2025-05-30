import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";

type Product = {
  id: number;
  name: string;
  image: string;
  description: string;
  category: string;
  slug?: string;
};

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

export default function CategoryPage() {
  const router = useRouter();
  const { category } = router.query;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Find the display name for the category (case-insensitive)
  const displayCategory =
    typeof category === "string"
      ? DEPARTMENTS.find(
          (d) => d.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "") === category.toLowerCase()
        ) || category
      : "";

  useEffect(() => {
    if (!category) return;
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.products)) {
          setProducts(
            data.products.filter(
              (p: Product) =>
                p.category &&
                p.category.toString().toLowerCase() === category.toString().toLowerCase()
            )
          );
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [category]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading...
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>
          {displayCategory} Drops - MIGISTUS
        </title>
      </Head>
      <div className="min-h-screen bg-zinc-950 text-white p-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold text-yellow-400 mb-8">
            {displayCategory} Drops
          </h1>
          {products.length === 0 ? (
            <div className="text-gray-400">No drops found in this category.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="block"
                >
                  <div className="bg-zinc-900 border border-yellow-500/20 rounded-lg p-6 hover:border-yellow-500 transition-all">
                    <div className="relative w-full h-40 mb-4">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover rounded"
                        sizes="(max-width: 768px) 100vw, 256px"
                      />
                    </div>
                    <h2 className="text-xl font-bold mb-2">{product.name}</h2>
                    <p className="text-gray-400">{product.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
