export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-zinc-900 text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-950 p-4 border-r border-zinc-800">
        <h2 className="text-xl font-bold mb-6">🜁 Migistus</h2>
        <nav className="space-y-2">
          <a href="/live" className="block hover:text-[#FFD700]">🗡 Live Drops</a>
          <a href="/pool" className="block hover:text-[#FFD700]">📦 Product Pool</a>
          <a href="/kingdom" className="block hover:text-[#FFD700]">🏛 The King’s Domain</a>
        </nav>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col bg-zinc-900 text-white">
        <header className="bg-zinc-800 px-6 py-4 border-b border-zinc-700">
          {/* Can put page title here if you want it persistent */}
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
