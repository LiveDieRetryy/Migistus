import { ReactNode } from "react";
import { useAuth } from "@/components/context/AuthContext";
import { Button } from "@/components/ui/button";
import AdminTopNav from "@/components/layout/AdminTopNav";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { isAdmin, logout } = useAuth();

  return (
    <div className="min-h-screen bg-zinc-800 text-zinc-100 flex flex-col">
      {/* Top Navigation */}
      <header className="bg-zinc-900 border-b border-zinc-700 shadow-sm">
        <AdminTopNav />
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6 space-y-6">
        {children}
      </main>

      {/* Footer */}
      {isAdmin && (
        <footer className="bg-zinc-900 border-t border-zinc-700 py-3 text-center text-sm text-zinc-400">
          Logged in as Admin •{" "}
          <Button variant="ghost" size="sm" onClick={logout}>
            Log Out
          </Button>
        </footer>
      )}
    </div>
  );
}
