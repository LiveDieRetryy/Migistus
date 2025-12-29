import MainNavbar from "@/components/nav/MainNavbar";
import Head from "next/head";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

interface Vote {
  id: number;
  userId: number;
  productId: number;
  productName: string;
  voteType: 'upvote' | 'downvote';
  votedAt: string;
}

export default function MyVotesPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [votes, setVotes] = useState<Vote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      router.push('/');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (user && isAuthenticated) {
      loadVotes();
    }
  }, [user, isAuthenticated]);

  const loadVotes = async () => {
    try {
      const response = await fetch('/api/account/votes', {
        credentials: 'include' // Send cookies with request
      });
      
      if (response.status === 401) {
        router.push('/');
        return;
      }
      
      const result = await response.json();
      
      if (result.success && Array.isArray(result.data)) {
        setVotes(result.data);
      }
    } catch (error) {
      console.error('Failed to load votes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || !isAuthenticated) {
    return null;
  }

  return (
    <>
      <Head>
        <title>My Votes - MIGISTUS</title>
      </Head>
      <MainNavbar />
      
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white">
        <div className="flex flex-col lg:flex-row max-w-7xl mx-auto px-4 py-12 gap-8">
          
          {/* Back Link - Mobile */}
          <div className="lg:hidden mb-4">
            <Link href="/account" className="text-yellow-400 hover:text-yellow-300">
              ← Back to Account
            </Link>
          </div>

          {/* Sidebar */}
          <aside className="lg:w-80">
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-yellow-500/20 rounded-2xl p-6 sticky top-8">
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
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-yellow-500/20 rounded-2xl p-8">
              <h1 className="text-3xl font-bold text-yellow-400 mb-2">My Votes</h1>
              <p className="text-gray-400 mb-6">Track your voting history on products</p>
          
          {isLoading ? (
            <div className="text-center text-gray-400 py-12">
              <div className="animate-spin w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Loading votes...</p>
            </div>
          ) : votes.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4 opacity-50">🗳️</div>
              <p className="text-gray-400 mb-4">You haven't voted on any products yet.</p>
              <Link
                href="/voting"
                className="inline-block bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-6 py-3 rounded-lg transition-colors"
              >
                Explore Products to Vote
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {votes.map((vote) => (
                  <div
                    key={vote.id}
                    className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 flex justify-between items-center hover:border-yellow-500/30 transition-colors"
                  >
                    <div>
                      <h3 className="text-lg font-semibold text-white">{vote.productName}</h3>
                      <p className="text-sm text-gray-400">
                        Voted on {new Date(vote.votedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className={`px-4 py-2 rounded-full font-semibold ${
                      vote.voteType === 'upvote' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {vote.voteType === 'upvote' ? '👍 Upvote' : '👎 Downvote'}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 pt-6 border-t border-zinc-700 text-center">
                <p className="text-gray-400">Total Votes: {votes.length}</p>
              </div>
            </>
          )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
