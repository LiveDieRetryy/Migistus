import { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-zinc-900 min-h-screen text-white font-sans px-8 py-6">
      <header className="text-[#FFD700] text-2xl font-bold mb-8 font-[Cinzel]">
        MIGISTUS Admin
      </header>

      <main>{children}</main>

      <footer className="mt-16 text-sm text-zinc-500 text-center">
        © 2025 MIGISTUS · The King’s Domain is sovereign software.
      </footer>
    </div>
  );
}
