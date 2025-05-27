import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardPanel from "@/components/kingdom/DashboardPanel";
import { VoteTestButton } from "@/components/kingdom/VoteTestButton";
import useUserStats from "@/lib/useUserStats";
import useProductStats from "@/lib/useProductStats";
import useVotingStats from "@/lib/useVotingStats";
import useRefundStats from "@/lib/useRefundStats";
import { Users, Package, Crown, Settings } from "lucide-react";

export default function AdminDashboard() {
  const { userCount } = useUserStats();
  const { liveProductCount } = useProductStats();
  const { totalVotes } = useVotingStats();
  const { pendingRefunds } = useRefundStats();

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold text-[#FFD700] mb-6">🏛 The King’s Domain</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardPanel icon={<Users />} label="Total Users" value={userCount} />
        <DashboardPanel icon={<Package />} label="Live Products" value={liveProductCount} />
        <DashboardPanel icon={<Crown />} label="Pending Refunds" value={pendingRefunds} />
        <DashboardPanel icon={<Settings />} label="Votes This Week" value={totalVotes} />
      </div>

      <div className="mt-6">
        <VoteTestButton />
      </div>
    </DashboardLayout>
  );
}
