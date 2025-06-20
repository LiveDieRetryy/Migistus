import { useEffect, useState } from "react";
import Head from "next/head";
import MainNavbar from "@/components/nav/MainNavbar";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext"; // Updated import
import { useRouter } from "next/router";

// Helper function to generate slug from product name
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
}

type Pledge = {
  id: number;
  userId: number;
  productId: number;
  productName: string;
  amount: number;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
};

export default function PledgesPage() {
  const { user, isAuthenticated, loading } = useAuth(); // Updated to use correct hook
  const router = useRouter();
  const [pledges, setPledges] = useState<Pledge[]>([]);
  const [pledgeLoading, setPledgeLoading] = useState(true);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user) {
      loadPledges();
    }
  }, [user, isAuthenticated, loading, router]);

  const loadPledges = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/account/pledges?userId=${user.id}`);
      const data = await response.json();
      setPledges(data);
    } catch (error) {
      console.error('Failed to load pledges:', error);
    } finally {
      setPledgeLoading(false);
    }
  };

  const cancelPledge = async (pledgeId: number) => {
    try {
      await fetch(`/api/account/pledges?pledgeId=${pledgeId}`, {
        method: 'DELETE'
      });
      setPledges(pledges.filter(p => p.id !== pledgeId));
    } catch (error) {
      console.error('Failed to cancel pledge:', error);
    }
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>My Pledges - MIGISTUS</title>
        </Head>
        <MainNavbar />
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-yellow-400 text-xl">Loading...</div>
        </div>
      </>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <Head>
          <title>My Pledges - MIGISTUS</title>
        </Head>
        <MainNavbar />
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-yellow-400 text-xl">Please sign in to view your pledges</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>My Pledges - MIGISTUS</title>
      </Head>
      <MainNavbar />
      
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          
          {/* Header */}
          <div className="mb-8">
            <Link href="/account" className="text-yellow-400 hover:text-yellow-300 mb-4 inline-block">
              ← Back to Account
            </Link>
            <h1 className="text-3xl font-bold text-yellow-400 mb-2">My Pledges</h1>
            <p className="text-gray-400">Track and manage your product pledges</p>
          </div>

          {/* Pledges List */}
          {pledgeLoading ? (
            <div className="bg-zinc-900/50 border border-yellow-500/20 rounded-2xl p-12 text-center">
              <div className="text-yellow-400 text-xl">Loading your pledges...</div>
            </div>
          ) : pledges.length === 0 ? (
            <div className="bg-zinc-900/50 border border-yellow-500/20 rounded-2xl p-12 text-center">
              <div className="text-6xl mb-4 opacity-50">🤝</div>
              <h3 className="text-xl font-semibold text-gray-300 mb-2">No pledges yet</h3>
              <p className="text-gray-400 mb-6">Start pledging on drops to see them here</p>
              <Link
                href="/drops"
                className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-6 py-3 rounded-lg transition-colors"
              >
                Browse Drops
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {pledges.map((pledge) => (
                <div key={pledge.id} className="bg-zinc-900/50 border border-yellow-500/20 rounded-xl p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white mb-2">{pledge.productName}</h3>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <span className="text-gray-400">
                          Amount: <span className="text-yellow-400 font-semibold">${pledge.amount}</span>
                        </span>
                        <span className="text-gray-400">
                          Date: <span className="text-white">{new Date(pledge.createdAt).toLocaleDateString()}</span>
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          pledge.status === 'active' ? 'bg-green-900 text-green-300' :
                          pledge.status === 'completed' ? 'bg-blue-900 text-blue-300' :
                          'bg-red-900 text-red-300'
                        }`}>
                          {pledge.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                      <div className="flex gap-2">
                      <Link
                        href={`/products/${slugify(pledge.productName)}`}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-yellow-400 border border-yellow-500/30 rounded-lg transition-colors"
                      >
                        View Product
                      </Link>
                      
                      {pledge.status === 'active' && (
                        <button
                          onClick={() => cancelPledge(pledge.id)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
