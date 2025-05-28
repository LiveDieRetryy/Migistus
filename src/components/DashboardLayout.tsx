import { ReactNode } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();

  const isActive = (path: string) => router.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-zinc-950">
      <nav className="fixed w-64 h-screen bg-zinc-900 border-r border-yellow-500/20 p-6">
        <div className="mb-8">
          <Link href="/">
            <span className="text-2xl font-bold text-yellow-400">🏰 Kingdom</span>
          </Link>
        </div>
        <div className="space-y-2">
          <Link
            href="/kingdom"
            className={`block px-4 py-2 rounded-lg ${
              isActive("/kingdom") && !router.pathname.includes("/kingdom/")
                ? "bg-yellow-400 text-black"
                : "text-gray-300 hover:bg-yellow-400/10"
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/kingdom/voting-config"
            className={`block px-4 py-2 rounded-lg ${
              isActive("/kingdom/voting-config")
                ? "bg-yellow-400 text-black"
                : "text-gray-300 hover:bg-yellow-400/10"
            }`}
          >
            Voting Config
          </Link>
          <Link
            href="/kingdom/product-pool"
            className={`block px-4 py-2 rounded-lg ${
              isActive("/kingdom/product-pool")
                ? "bg-yellow-400 text-black"
                : "text-gray-300 hover:bg-yellow-400/10"
            }`}
          >
            Product Pool
          </Link>
        </div>
      </nav>
      <div className="pl-64">
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
