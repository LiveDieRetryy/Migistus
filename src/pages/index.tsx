import Head from "next/head";
import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <>
      <Head>
        <title>MIGISTUS — The Guilded Marketplace</title>
      </Head>

      <div className="min-h-screen bg-black text-white font-sans">
        {/* Trending Drop */}
        <section className="px-6 py-12 text-center">
          <h2 className="text-yellow-500 text-lg font-semibold mb-2">Trending Drops</h2>
          <h1 className="text-4xl font-bold text-white mb-2">Warehouse-15 LED Headlamp</h1>
          <p className="text-yellow-400 text-md">Current Price: $18</p>
          <p className="text-sm text-gray-400 mb-4">Ends in: 2h 9m</p>
          <Image src="/images/headlamp.png" alt="LED Headlamp" width={200} height={200} className="mx-auto mb-4" />
          <button className="bg-yellow-600 hover:bg-yellow-500 text-black font-semibold py-2 px-6 rounded transition">
            Join Drop
          </button>
        </section>

        {/* Category Grid */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-6 px-6 py-8">
          {[
            { name: "Electronics", image: "/images/electronics.png", link: "/categories/electronics" },
            { name: "Beauty & Health", image: "/images/beauty.png", link: "/categories/beauty" },
            { name: "Toys & Hobbies", image: "/images/toys.png", link: "/categories/toys" },
            { name: "Home & Garden", image: "/images/home.png", link: "/categories/home" },
          ].map((cat) => (
            <Link href={cat.link} key={cat.name} className="block text-center hover:scale-105 transition">
              <Image src={cat.image} alt={cat.name} width={150} height={150} className="mx-auto rounded-lg mb-2" />
              <span className="text-yellow-400 font-medium">{cat.name}</span>
            </Link>
          ))}
        </section>

        {/* Coming Soon */}
        <section className="bg-zinc-900 py-12 text-center">
          <h2 className="text-yellow-500 text-lg font-semibold mb-2">Coming Soon</h2>
          <h1 className="text-3xl font-bold text-white mb-2">Wi-Fi Smart Bulb</h1>
          <p className="text-yellow-400 text-md">Launches in 4 days</p>
          <Image src="/images/bulb.png" alt="Smart Bulb" width={100} height={100} className="mx-auto my-4" />
          <button className="bg-yellow-600 hover:bg-yellow-500 text-black font-semibold py-2 px-6 rounded transition">
            Join Waitlist
          </button>
        </section>

        {/* Vote Section */}
        <section className="px-6 py-12 text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Vote on Next Products</h2>
          <p className="text-gray-300 mb-4">Vote for your products prepared:</p>
          <h3 className="text-2xl font-bold text-white mb-4">Multifunctional Laptop Stand</h3>
          <Image src="/images/laptop-stand.png" alt="Laptop Stand" width={200} height={200} className="mx-auto mb-4" />
          <button className="bg-yellow-600 hover:bg-yellow-500 text-black font-semibold py-2 px-6 rounded transition">
            Vote Now
          </button>
        </section>
      </div>
    </>
  );
}
