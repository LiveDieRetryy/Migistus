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
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Account navigation items
  const getProfileSlug = () => {
    if (!user?.username) return "/account/profile";
    return `/account/profile/${user.username.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")}`;
  };

  const accountNav = [
    { label: "Account Overview", href: "/account", icon: "🏠" },
    { label: "Notifications", href: "/notifications", icon: "🔔" },
    { label: "My Current Pledges", href: "/account/pledges", icon: "🤝" },
    { label: "My Orders", href: "/account/orders", icon: "📦" },
    { label: "My Wishlist", href: "/account/wishlist", icon: "❤️" },
    { label: "My Votes", href: "/account/votes", icon: "🗳️" },
    { label: "Wallet", href: "/wallet", icon: "💰" },
    { label: "View Profile", href: getProfileSlug(), icon: "👤" },
    { label: "Account Settings", href: "/account/settings", icon: "⚙️" },
  ];

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(router.asPath)}`);
      return;
    }

    if (user) {
      loadPledges();
    }
  }, [user, isAuthenticated, loading, router]);

  const loadPledges = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/account/pledges`, {
        credentials: 'include' // Send cookies with request
      });
      
      if (response.status === 401) {
        // Session expired, redirect to login
        router.push('/');
        return;
      }
      
      const result = await response.json();
      
      if (!result.success) {
        console.error('Failed to load pledges:', result.error);
        setPledges([]);
        return;
      }
      
      // API now returns standardized format: { success, data, total }
      const pledgesArray = Array.isArray(result.data) ? result.data : [];
      setPledges(pledgesArray);
    } catch (error) {
      console.error('Failed to load pledges:', error);
      setPledges([]); // Set empty array on error
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
      
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white">
        <div className="flex flex-col lg:flex-row max-w-7xl mx-auto px-4 py-12 gap-8">
          
          {/* Mobile Header with Hamburger */}
          <div className="lg:hidden w-full mb-4 flex items-center justify-between">
            <Link href="/account" className="text-yellow-400 hover:text-yellow-300">
              ← Back to Account
            </Link>
            <button
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className="bg-zinc-800 p-2 rounded-lg text-yellow-400 hover:bg-zinc-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileSidebarOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Sidebar Overlay */}
          {isMobileSidebarOpen && (
            <div 
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <aside className={`
            lg:w-80
            ${isMobileSidebarOpen ? 'fixed inset-y-0 left-0 z-50 w-80' : 'hidden'}
            lg:block lg:relative lg:z-0
          `}>
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-yellow-500/20 rounded-2xl p-6 sticky top-8 h-full lg:h-auto overflow-y-auto">
              <div className="hidden lg:block mb-6">
                <Link href="/account" className="text-yellow-400 hover:text-yellow-300">
                  ← Back to Account
                </Link>
              </div>
              
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center text-2xl">
                  👤
                </div>
                <div>
                  <h2 className="text-xl font-bold text-yellow-400">
                    Account Menu
                  </h2>
                  <p className="text-sm text-gray-400">{user?.username}</p>
                </div>
              </div>
              
              <ul className="space-y-2">
                {accountNav.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setIsMobileSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        router.pathname === item.href
                          ? "bg-yellow-400 text-black font-semibold"
                          : "text-yellow-300 hover:bg-yellow-400/10 hover:text-yellow-400"
                      }`}
                    >
                      <span className="text-lg">{item.icon}</span>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Header */}
            <div className="mb-8">
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
          </main>
        </div>
      </div>
    </>
  );
}
