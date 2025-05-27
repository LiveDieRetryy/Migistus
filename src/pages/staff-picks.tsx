import { useEffect, useState } from "react";
import Image from "next/image";

type Product = {
  id: number;
  name: string;
  image: string;
  goal: number;
  link: string;
  timeframe: string;
  featured?: boolean;
};

export default function StaffPicksPage() {
  const [staffPicks, setStaffPicks] = useState<Product[]>([]);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) =>
        setStaffPicks(data.filter((product: Product) => product.featured))
      );
  }, []);

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-8">
      <h1 className="text-4xl font-[Cinzel] text-[#FFD700] text-center mb-8">
        🌟 Staff Picks
      </h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {staffPicks.map((product) => (
          <div key={product.id} className="bg-zinc-800 p-4 rounded shadow border border-[#FFD700]/30">
            <div className="relative w-full h-32 mb-2 rounded overflow-hidden">
              <Image
                src={product.image}
                alt={product.name}
                layout="fill"
                objectFit="cover"
                className="rounded"
              />
            </div>
            <h3 className="text-md font-semibold text-[#FFD700]">{product.name}</h3>
            <p className="text-sm text-zinc-300">Goal: {product.goal}</p>
            <p className="text-xs text-zinc-400">{product.timeframe}</p>
            <a
              href={product.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:underline block mt-2"
            >
              View Product
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
