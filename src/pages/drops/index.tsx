import Head from "next/head";
import MainNavbar from "@/components/nav/MainNavbar";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Product {
  id: string | number;
  name: string;
  description: string;
}

export default function DropsPage() {
  const [products, setProducts] = useState<Product[]>([]);

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
      <div className="min-h-screen bg-zinc-950 text-white p-8">
        <h1 className="text-4xl font-bold text-yellow-400 mb-8">Active Drops</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(product => (
            <Link key={product.id} href={`/drops/${product.id}`}>
              <div className="bg-zinc-900 border border-yellow-500/20 rounded-lg p-6 hover:border-yellow-500 transition-all">
                <h2 className="text-xl font-bold mb-2">{product.name}</h2>
                <p className="text-gray-400">{product.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
