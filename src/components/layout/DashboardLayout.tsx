import { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: Props) {
  return (
    <div className="flex min-h-screen bg-zinc-950 text-white">
      {/* Sidebar */}
      <div className="w-64 bg-zinc-900 border-r border-yellow-500 p-4">
        <h1 className="text-xl font-bold text-[#FFD700] mb-4">🛡 Admin</h1>
        {/* Add sidebar navigation links here */}
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  );
}
