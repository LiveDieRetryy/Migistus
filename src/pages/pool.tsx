import DashboardLayout from "@/components/layout/dashboard";
import ProductCard from "@/components/pool/ProductCard";
import Link from "next/link";
import { getProductUrl } from "@/utils/productUtils";

export default function ProductPoolPage() {
  const products = [
    {
      id: 1,
      name: "Gilded Vanguard Headset",
      image: "https://placehold.co/400x200?text=Headset",
      pledged: 42,
      goal: 100,
      timeLeft: "2d 14h",
    },
    {
      id: 2,
      name: "Soulforge Controller",
      image: "https://placehold.co/400x200?text=Controller",
      pledged: 88,
      goal: 150,
      timeLeft: "1d 6h",
    },
    {
      id: 3,
      name: "Enchanted Mousepad XL",
      image: "https://placehold.co/400x200?text=Mousepad+XL",
      pledged: 63,
      goal: 100,
      timeLeft: "3d 3h",
    },
  ];

  return (
    <DashboardLayout>
      <h1 className="text-2xl text-[#FFD700] mb-6">📦 Product Pool</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {products.map((product, i) => (
          <Link key={i} href={getProductUrl(product)} className="block">
            <div className="cursor-pointer">
              <ProductCard {...product} />
            </div>
          </Link>
        ))}
      </div>
    </DashboardLayout>
  );
}
