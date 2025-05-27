// pages/products/[slug].tsx
import { useRouter } from "next/router";
import fs from "fs";
import path from "path";
import { GetStaticPaths, GetStaticProps } from "next";
import Head from "next/head";
import Image from "next/image";

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
            <p className="text-yellow-500 mb-2 font-semibold">Goal: {product.goal} units</p>
            <p className="text-zinc-400 mb-2">Timeframe: {product.timeframe}</p>
            <p className="text-zinc-400 mb-6">Category: {product.category}</p>
            <a
              href={product.link}
              target="_blank"
              rel="noreferrer"
              className="bg-yellow-400 hover:bg-yellow-300 text-black px-6 py-3 rounded-lg font-bold transition-all"
            >
              View Product Source ↗
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

// Load paths for static build
export const getStaticPaths: GetStaticPaths = async () => {
  const filePath = path.resolve("public/data/products.json");
  const json = fs.readFileSync(filePath, "utf-8");
  const products: Product[] = JSON.parse(json);

  const paths = products.map(p => ({
    params: { slug: slugify(p.name) }
  }));

  return {
    paths,
    fallback: true // allow dynamic pages for newly added products
  };
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
