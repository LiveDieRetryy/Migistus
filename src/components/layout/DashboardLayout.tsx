import { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-zinc-900 text-white">
      {/* Sidebar */}
      <div className="w-64 bg-zinc-950 border-r border-yellow-500 p-4">
        <h1 className="text-xl font-bold text-[#FFD700]">🛡 Admin</h1>
        {/* ...navigation... */}
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}


type Props = {
  children: React.ReactNode;
};

export default function DashboardLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      {children}
    </div>
  );
}
