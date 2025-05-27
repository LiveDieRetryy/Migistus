import DashboardLayout from "@/components/layout/dashboard";
import LiveDropFeed from "@/components/live/LiveDropFeed";

export default function LiveDropsPage() {
  return (
    <DashboardLayout>
      <h1 className="text-2xl text-[#FFD700] mb-4">🗡 Live Drops</h1>
      <LiveDropFeed />
    </DashboardLayout>
  );
}
