import Head from "next/head";
import Link from "next/link";

export default function SuppliersPage() {
  return (
    <>
      <Head>
        <title>Suppliers - MIGISTUS</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white px-6 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-300 bg-clip-text text-transparent mb-4">
              Partner With MIGISTUS
            </h1>
            <p className="text-xl text-zinc-300 mb-6">
              Join our network of trusted suppliers and reach a community of engaged customers
            </p>
            
            {/* Supplier Login Button */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link 
                href="/supplier-login"
                className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-bold rounded-lg transition-all transform hover:scale-105"
              >
                Supplier Login
              </Link>
              <Link 
                href="/supplier-registration"
                className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg border border-yellow-400/20 transition-all"
              >
                Become a Supplier
              </Link>
            </div>
          </div>

          {/* Benefits Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <div className="bg-zinc-900/50 border border-yellow-400/20 rounded-xl p-6">
              <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white font-bold text-xl">🎯</span>
              </div>
              <h3 className="text-xl font-bold text-yellow-400 mb-2">Targeted Audience</h3>
              <p className="text-zinc-300">
                Reach customers who are actively looking for quality products and are willing to participate in group buying.
              </p>
            </div>

            <div className="bg-zinc-900/50 border border-yellow-400/20 rounded-xl p-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white font-bold text-xl">📈</span>
              </div>
              <h3 className="text-xl font-bold text-yellow-400 mb-2">Bulk Sales</h3>
              <p className="text-zinc-300">
                Leverage our group buying model to move larger quantities and achieve better profit margins.
              </p>
            </div>

            <div className="bg-zinc-900/50 border border-yellow-400/20 rounded-xl p-6">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white font-bold text-xl">🔥</span>
              </div>
              <h3 className="text-xl font-bold text-yellow-400 mb-2">Live Drops</h3>
              <p className="text-zinc-300">
                Create excitement with time-limited product drops that generate buzz and drive quick sales.
              </p>
            </div>

            <div className="bg-zinc-900/50 border border-yellow-400/20 rounded-xl p-6">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-orange-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white font-bold text-xl">💎</span>
              </div>
              <h3 className="text-xl font-bold text-yellow-400 mb-2">Quality Focus</h3>
              <p className="text-zinc-300">
                Join a platform that prioritizes quality over quantity, ensuring your products reach appreciative customers.
              </p>
            </div>

            <div className="bg-zinc-900/50 border border-yellow-400/20 rounded-xl p-6">
              <div className="w-12 h-12 bg-gradient-to-r from-teal-400 to-teal-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white font-bold text-xl">🤝</span>
              </div>
              <h3 className="text-xl font-bold text-yellow-400 mb-2">Community Driven</h3>
              <p className="text-zinc-300">
                Benefit from community voting and feedback that helps validate and improve your product offerings.
              </p>
            </div>

            <div className="bg-zinc-900/50 border border-yellow-400/20 rounded-xl p-6">
              <div className="w-12 h-12 bg-gradient-to-r from-pink-400 to-pink-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white font-bold text-xl">📊</span>
              </div>
              <h3 className="text-xl font-bold text-yellow-400 mb-2">Analytics & Insights</h3>
              <p className="text-zinc-300">
                Get detailed analytics on customer behavior, sales trends, and product performance.
              </p>
            </div>
          </div>

          {/* Contact Section */}
          <div className="bg-zinc-900/70 rounded-xl border border-yellow-400/20 shadow-lg p-8 text-center">
            <h2 className="text-yellow-400 text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-zinc-300 mb-6 text-lg">
              Join hundreds of suppliers who trust MIGISTUS to connect them with engaged customers
            </p>
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="text-left">
                <h3 className="text-yellow-400 font-semibold mb-2">Partnership Inquiries</h3>
                <p className="text-zinc-300 mb-2">
                  Email: <a href="mailto:suppliers@migistus.com" className="text-yellow-400 underline hover:text-yellow-300">suppliers@migistus.com</a>
                </p>
                <p className="text-zinc-400 text-sm">
                  Include your company name, product catalog, and business goals
                </p>
              </div>
              
              <div className="text-left">
                <h3 className="text-yellow-400 font-semibold mb-2">Existing Suppliers</h3>
                <p className="text-zinc-300 mb-2">
                  Access your supplier dashboard to manage products and view analytics
                </p>
                <Link 
                  href="/supplier-login"
                  className="inline-block px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-medium rounded-lg transition-all text-sm"
                >
                  Login to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
