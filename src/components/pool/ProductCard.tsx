import { Button } from "@/components/ui/button";

export default function ProductCard({
  name,
  image,
  pledged,
  goal,
  timeLeft,
}: {
  name: string;
  image: string;
  pledged: number;
  goal: number;
  timeLeft: string;
}) {
  const percent = Math.min(100, Math.round((pledged / goal) * 100));

  return (
    <div className="bg-zinc-800 rounded-xl border border-zinc-700 overflow-hidden shadow-md">
      <img src={image} alt={name} className="w-full h-40 object-cover" />
      <div className="p-4 space-y-2">
        <h3 className="text-xl font-semibold text-white">{name}</h3>
        <p className="text-sm text-zinc-400">Time left: {timeLeft}</p>

        {/* Progress bar */}
        <div className="w-full bg-zinc-700 h-3 rounded-full overflow-hidden">
          <div
            className="bg-[#FFD700] h-full transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="text-xs text-zinc-300">{pledged}/{goal} pledged</p>

        <Button className="w-full">Pledge Now</Button>
      </div>
    </div>
  );
}
