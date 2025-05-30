import Head from "next/head";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/kingdom/StatCard";
import useUserStats from "@/lib/useUserStats";
import useProductStats from "@/lib/useProductStats";
import useRefundStats from "@/lib/useRefundStats";
import useVotingStats from "@/lib/useVotingStats";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function KingsDomainPage() {
  const { userCount } = useUserStats();
  const { liveProductCount } = useProductStats();
  const { pendingRefunds } = useRefundStats();
  const { totalVotes } = useVotingStats();
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Only run on client
    if (typeof window !== "undefined") {
      const isAdmin = localStorage.getItem("isAdmin") === "true";
      if (!isAdmin) {
        router.replace("/admin-login");
      } else {
        setLoading(false);
      }
    }
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-yellow-400 text-2xl">
        Loading admin panel...
      </div>
    );
  }

  return (
    <DashboardLayout>
      <Head>
        <title>The King's Domain - MIGISTUS Admin</title>
      </Head>

      <div className="text-center py-6 sm:py-10">
        <h1 className="text-2xl sm:text-4xl font-bold text-[#FFD700] mb-2 drop-shadow-md">
          🛡️ The King's Domain
        </h1>
        <p className="text-zinc-400 text-base sm:text-lg">Manage your realm in royal fashion</p>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-6xl mx-auto px-2 sm:px-4 pb-10">
        <StatCard label="Total Users" value={userCount} icon={<span>👥</span>} />
        <StatCard label="Live Products" value={liveProductCount} icon={<span>📦</span>} />
        <StatCard label="Pending Refunds" value={pendingRefunds} icon={<span>💰</span>} />
        <StatCard label="Total Votes" value={totalVotes} icon={<span>🗳️</span>} />
      </div>

      {/* Management Cards - Enhanced */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-6 sm:mt-10 max-w-6xl mx-auto px-2 sm:px-4">
        
        <Link href="/kingdom/voting-config">
          <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-4 sm:p-6 hover:shadow-md hover:border-yellow-300 transition cursor-pointer">
            <h2 className="text-lg sm:text-xl font-semibold text-yellow-400 mb-2">⚙️ Voting Configuration</h2>
            <p className="text-zinc-400 text-sm">Adjust tier multipliers, limits, and global vote settings.</p>
          </div>
        </Link>

        <Link href="/kingdom/product-pool">
          <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-4 sm:p-6 hover:shadow-md hover:border-yellow-300 transition cursor-pointer">
            <h2 className="text-lg sm:text-xl font-semibold text-yellow-400 mb-2">📦 Product Pool Editor</h2>
            <p className="text-zinc-400 text-sm">Edit live drop items, add new listings, or update categories.</p>
          </div>
        </Link>

        <Link href="/kingdom/refund-queue">
          <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-4 sm:p-6 hover:shadow-md hover:border-yellow-300 transition cursor-pointer">
            <h2 className="text-lg sm:text-xl font-semibold text-yellow-400 mb-2">💰 Refund Queue</h2>
            <p className="text-zinc-400 text-sm">View and process user refund requests from completed pledges.</p>
          </div>
        </Link>

        <Link href="/kingdom/users">
          <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-4 sm:p-6 hover:shadow-md hover:border-yellow-300 transition cursor-pointer">
            <h2 className="text-lg sm:text-xl font-semibold text-yellow-400 mb-2">👥 User Management</h2>
            <p className="text-zinc-400 text-sm">Review, ban, promote, or refund individual users by ID.</p>
          </div>
        </Link>

        <Link href="/kingdom/subscription-tiers">
          <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-4 sm:p-6 hover:shadow-md hover:border-yellow-300 transition cursor-pointer">
            <h2 className="text-lg sm:text-xl font-semibold text-yellow-400 mb-2">🥇 Tier Reward Editor</h2>
            <p className="text-zinc-400 text-sm">Control Initiate, Guild, and MIGISTUS membership perks.</p>
          </div>
        </Link>

        {/* NEW: Chat Moderation Card */}
        <Link href="/kingdom/chat-moderation">
          <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-4 sm:p-6 hover:shadow-md hover:border-yellow-300 transition cursor-pointer">
            <h2 className="text-lg sm:text-xl font-semibold text-yellow-400 mb-2">💬 Chat Moderation</h2>
            <p className="text-zinc-400 text-sm">Monitor community discussions, manage profanity filters, and moderate users.</p>
          </div>
        </Link>

        {/* NEW: Content Management Card */}
        <Link href="/kingdom/content-manager">
          <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-4 sm:p-6 hover:shadow-md hover:border-yellow-300 transition cursor-pointer">
            <h2 className="text-lg sm:text-xl font-semibold text-yellow-400 mb-2">🎨 Content Manager</h2>
            <p className="text-zinc-400 text-sm">Update homepage, branding, and customize platform appearance.</p>
          </div>
        </Link>

        {/* NEW: Drop Analytics Card */}
        <Link href="/kingdom/drop-analytics">
          <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-4 sm:p-6 hover:shadow-md hover:border-yellow-300 transition cursor-pointer">
            <h2 className="text-lg sm:text-xl font-semibold text-yellow-400 mb-2">📈 Drop Analytics</h2>
            <p className="text-zinc-400 text-sm">Monitor drop performance, pledge rates, and community engagement.</p>
          </div>
        </Link>

        <Link href="/kingdom/stats">
          <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-4 sm:p-6 hover:shadow-md hover:border-yellow-300 transition cursor-pointer">
            <h2 className="text-lg sm:text-xl font-semibold text-yellow-400 mb-2">📊 Analytics Dashboard</h2>
            <p className="text-zinc-400 text-sm">Track usage stats, voting trends, engagement, and drop performance.</p>
          </div>
        </Link>
      </div>

      <footer className="text-center text-zinc-600 mt-10 sm:mt-16 px-2">
        <p>Throne Settings</p>
        <p className="text-xs">© 2025 MIGISTUS · The King's Domain is sovereign software.</p>
      </footer>
    </DashboardLayout>
  );
}