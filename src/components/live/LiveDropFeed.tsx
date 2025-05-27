export default function LiveDropFeed() {
  const mockDrops = [
    { code: "FANG-BETA-KEY-2025", time: "2 minutes ago" },
    { code: "SOUL-VAULT-HUNT", time: "5 minutes ago" },
    { code: "MIGI-REDEEM-NOW", time: "10 minutes ago" },
  ];

  return (
    <div className="space-y-4">
      {mockDrops.map((drop, i) => (
        <div
          key={i}
          className="bg-zinc-800 border border-zinc-700 p-4 rounded-xl shadow-lg hover:scale-[1.01] transition"
        >
          <p className="text-lg font-mono text-[#FFD700]">{drop.code}</p>
          <p className="text-sm text-zinc-400">{drop.time}</p>
        </div>
      ))}
    </div>
  );
}
