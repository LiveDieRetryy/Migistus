"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Tier = {
  name: string;
  color: string;
  badge: string;
  votePower: number;
  chatCooldown: number;
};

const STORAGE_KEY = "migistus_tiers";

const defaultTiers: Tier[] = [
  { name: "Initiate", color: "gray", badge: "⚪", votePower: 1, chatCooldown: 60 },
  { name: "Guild", color: "silver", badge: "🛡️", votePower: 2, chatCooldown: 30 },
  { name: "MIGISTUS", color: "gold", badge: "👑", votePower: 4, chatCooldown: 0 },
];

export default function TierEditor() {
  const [tiers, setTiers] = useState<Tier[]>(defaultTiers);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setTiers(JSON.parse(stored));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tiers));
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const updateTier = (index: number, key: keyof Tier, value: string | number) => {
    const updated = [...tiers];
    updated[index][key] = value as never;
    setTiers(updated);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl text-[#FFD700]">🧙 Tier Reward Editor</h2>

      {tiers.map((tier, i) => (
        <div key={i} className="p-4 rounded-lg bg-zinc-800 border border-zinc-700 space-y-3">
          <h3 className="text-lg font-semibold text-white">{tier.name}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Input
              value={tier.badge}
              onChange={(e) => updateTier(i, "badge", e.target.value)}
              placeholder="Badge (emoji)"
            />
            <Input
              value={tier.color}
              onChange={(e) => updateTier(i, "color", e.target.value)}
              placeholder="Tier Color"
            />
            <Input
              type="number"
              value={tier.votePower}
              onChange={(e) => updateTier(i, "votePower", parseInt(e.target.value))}
              placeholder="Vote Power"
            />
            <Input
              type="number"
              value={tier.chatCooldown}
              onChange={(e) => updateTier(i, "chatCooldown", parseInt(e.target.value))}
              placeholder="Chat Cooldown (sec)"
            />
          </div>
        </div>
      ))}

            <Button onClick={handleSave}>💾 Save Changes</Button>
      {saved && <p className="text-green-400 text-sm">Saved!</p>}
    </div>
  );
}