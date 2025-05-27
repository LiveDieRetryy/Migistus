"use client";

import { ReactNode } from "react";
import Link from "next/link";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-zinc-950 text-white">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-zinc-900 border-r border-yellow-500 p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-[#FFD700] mb-6 tracking-wide">
          🜁 Migistus
        </h1>
        <nav className="space-y-3 text-sm">
          <Link
            href="/live"
            className="block px-2 py-1 rounded hover:bg-yellow-500 hover:text-black transition"
          >
            🗡 Live Drops
          </Link>
          <Link
            href="/pool"
            className="block px-2 py-1 rounded hover:bg-yellow-500 hover:text-black transition"
          >
            📦 Product Pool
          </Link>
          <Link
            href="/kingdom"
            className="block px-2 py-1 rounded hover:bg-yellow-500 hover:text-black transition"
          >
            🏛 The King’s Domain
          </Link>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        <header className="bg-zinc-900 border-b border-zinc-800 px-6 py-4">
          {/* Optional persistent header (e.g., title or actions) */}
        </header>
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
