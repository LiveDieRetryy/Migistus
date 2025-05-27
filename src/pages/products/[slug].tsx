// pages/products/[slug].tsx
import { useRouter } from "next/router";
import fs from "fs";
import path from "path";
import { GetStaticPaths, GetStaticProps } from "next";
import Head from "next/head";
import Image from "next/image";
import { useEffect, useState } from "react";

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

export default function ProductPage({ product }: { product: Product }) {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(0);
  const [pledges, setPledges] = useState(product.pledges || 0);
  const [pledged, setPledged] = useState(false);

  useEffect(() => {
    // Example: parse timeframe as days, convert to seconds
    if (product?.timeframe) {
      const days = parseInt(product.timeframe);
      setTimeLeft(days * 24 * 60 * 60);
    }
  }, [product]);

  useEffect(() => {
    if (timeLeft > 0) {
      const interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
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

  const handlePledge = async () => {
    if (pledged) return;
    const res = await fetch("/api/products", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...product, pledges: pledges + 1 }),
    });
    if (res.ok) {
      setPledges(pledges + 1);
      setPledged(true);
    }
  };

  if (router.isFallback) {
    return <div className="text-white p-10">Loading product...</div>;
  }

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
            <a
              href={product.link}
              target="_blank"uct[] = JSON.parse(json);
              rel="noreferrer"
              className="bg-yellow-400 hover:bg-yellow-300 text-black px-6 py-3 rounded-lg font-bold transition-all"const paths = products.map(p => ({
            >    params: { slug: slugify(p.name) }
              View Product Source ↗
            </a>
            <button
              onClick={handlePledge}   paths,
              disabled={pledged || pledges >= product.goal || timeLeft <= 0}    fallback: true // allow dynamic pages for newly added products













































}  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "");function slugify(name: string) {// Simple slugifier to match URLs};  };    props: { product },  return {  }    return { notFound: true };  if (!product) {  const product = products.find(p => slugify(p.name) === params?.slug);  const products: Product[] = JSON.parse(json);  const json = fs.readFileSync(filePath, "utf-8");  const filePath = path.resolve("public/data/products.json");export const getStaticProps: GetStaticProps = async ({ params }) => {};  return { paths, fallback: true };  }));    params: { slug: slugify(product.name) },  const paths = products.map(product => ({  const products: Product[] = JSON.parse(json);  const json = fs.readFileSync(filePath, "utf-8");  const filePath = path.resolve("public/data/products.json");export const getStaticPaths: GetStaticPaths = async () => {// Load paths for static build}  );    </>      </div>        </div>          </div>            </button>              {pledged ? "Pledged!" : "Pledge"}            >              className="bg-yellow-400 hover:bg-yellow-300 text-black px-6 py-3 rounded-lg font-bold transition-all mt-4"  };
};

// Load specific product by slug
export const getStaticProps: GetStaticProps = async ({ params }) => {
  const filePath = path.resolve("public/data/products.json");
  const json = fs.readFileSync(filePath, "utf-8");
  const products: Product[] = JSON.parse(json);

  const product = products.find(p => slugify(p.name) === params?.slug);

  if (!product) {
    return { notFound: true };
  }

  return {
    props: { product }
  };
};

// Simple slugifier to match URLs
function slugify(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "");
}
