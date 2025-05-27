"use client";

import Head from "next/head";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Users, Package, Crown, Settings } from "lucide-react";
import StatCard from "@/components/kingdom/StatCard";
import useUserStats from "@/lib/useUserStats";
import useProductStats from "@/lib/useProductStats";
import useRefundStats from "@/lib/useRefundStats";
import useVotingStats from "@/lib/useVotingStats";
import Link from "next/link";

export default function KingsDomainPage() {
  const { userCount } = useUserStats();
  const { liveProductCount } = useProductStats();
  const { pendingRefunds } = useRefundStats();
  const { weeklyVotes } = useVotingStats();

  return (
    <DashboardLayout>
      <div className="text-center py-10">
        <h1 className="text-4xl font-bold text-[#FFD700] mb-2 drop-shadow-md">
          🛡️ The King's Domain
        </h1>
        <p className="text-zinc-400">Manage your realm in royal fashion</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto px-4 pb-20">
        <StatCard title="Total Users" value={userCount} icon={<Users />} color="gold" />
        <StatCard title="Live Products" value={liveProductCount} icon={<Package />} color="cyan" />
        <StatCard title="Pending Refunds" value={pendingRefunds} icon={<Crown />} color="red" />
        <StatCard title="Weekly Votes" value={weeklyVotes} icon={<Settings />} color="purple" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-10 max-w-6xl mx-auto px-4">
        <Link href="/kingdom/voting-config">
          <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-6 hover:shadow-md hover:border-yellow-300 transition cursor-pointer">
            <h2 className="text-xl font-semibold text-yellow-400 mb-2">⚙️ Voting Configuration</h2>
            <p className="text-zinc-400 text-sm">Adjust tier multipliers, limits, and global vote settings.</p>
          </div>
        </Link>

        <Link href="/kingdom/product-pool">
          <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-6 hover:shadow-md hover:border-yellow-300 transition cursor-pointer">
            <h2 className="text-xl font-semibold text-yellow-400 mb-2">📦 Product Pool Editor</h2>
            <p className="text-zinc-400 text-sm">Edit live drop items, add new listings, or update categories.</p>
          </div>
        </Link>

        <Link href="/kingdom/refund-queue">
          <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-6 hover:shadow-md hover:border-yellow-300 transition cursor-pointer">
            <h2 className="text-xl font-semibold text-yellow-400 mb-2">💰 Refund Queue</h2>
            <p className="text-zinc-400 text-sm">View and process user refund requests from completed pledges.</p>
          </div>
        </Link>

        <Link href="/kingdom/users">
          <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-6 hover:shadow-md hover:border-yellow-300 transition cursor-pointer">
            <h2 className="text-xl font-semibold text-yellow-400 mb-2">👥 User Management</h2>
            <p className="text-zinc-400 text-sm">Review, ban, promote, or refund individual users by ID.</p>
          </div>
        </Link>

        <Link href="/kingdom/subscription-tiers">
          <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-6 hover:shadow-md hover:border-yellow-300 transition cursor-pointer">
            <h2 className="text-xl font-semibold text-yellow-400 mb-2">🥇 Tier Reward Editor</h2>
            <p className="text-zinc-400 text-sm">Control Initiate, Guild, and MIGISTUS membership perks.</p>
          </div>
        </Link>

        <Link href="/kingdom/stats">
          <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-6 hover:shadow-md hover:border-yellow-300 transition cursor-pointer">
            <h2 className="text-xl font-semibold text-yellow-400 mb-2">📊 Analytics Dashboard</h2>
            <p className="text-zinc-400 text-sm">Track usage stats, voting trends, engagement, and drop performance.</p>
          </div>
        </Link>
      </div>

      <footer className="text-center text-zinc-600 mt-16">
        <p>Throne Settings</p>
        <p className="text-xs">© 2025 MIGISTUS · The King's Domain is sovereign software.</p>
      </footer>
    </DashboardLayout>
  );
}
