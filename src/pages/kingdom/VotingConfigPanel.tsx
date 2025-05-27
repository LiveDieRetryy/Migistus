"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

interface VotingConfig {
  votingEnabled: boolean;
  doubleVoteWeek: boolean;
  tripleVoteWeek: boolean;
  topWinners: number;
  tierLimits: Record<string, number>;
  tierMultipliers: Record<string, number>;
}

export default function VotingConfigPanel() {
  const [config, setConfig] = useState<VotingConfig | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/voting-config")
      .then(res => res.json())
      .then(data => {
        const filled: VotingConfig = {
          votingEnabled: data.votingEnabled ?? false,
          topWinners: data.topWinners ?? 3,
          doubleVoteWeek: data.doubleVoteWeek ?? false,
          tripleVoteWeek: data.tripleVoteWeek ?? false,
          tierLimits: {
            Initiate: data.tierLimits?.Initiate ?? 1,
            Guild: data.tierLimits?.Guild ?? 2,
            MIGISTUS: data.tierLimits?.MIGISTUS ?? 4,
          },
          tierMultipliers: {
            Initiate: data.tierMultipliers?.Initiate ?? 1,
            Guild: data.tierMultipliers?.Guild ?? 2,
            MIGISTUS: data.tierMultipliers?.MIGISTUS ?? 4,
          },
        };

        setConfig(filled);
        setLoading(false);
      });
  }, []);

  const handleChange = <T extends keyof VotingConfig>(
    key: T,
    value: VotingConfig[T]
  ) => {
    setConfig(prev => prev ? { ...prev, [key]: value } : prev);
  };

  const handleTierChange = (
    type: "tierLimits" | "tierMultipliers",
    tier: string,
    value: number
  ) => {
    setConfig(prev =>
      prev
        ? {
            ...prev,
            [type]: {
              ...prev[type],
              [tier]: value,
            },
          }
        : prev
    );
  };

  const handleSave = async () => {
    const res = await fetch("/api/voting-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  if (loading || !config) {
    return <p className="text-white p-4">Loading voting config...</p>;
  }

  return (
    <div className="space-y-8 p-4">
      <h2 className="text-2xl font-bold text-[#FFD700]">🗳️ Voting Configuration</h2>

      <div className="flex flex-wrap gap-6">
        <div className="flex items-center gap-2">
          <span className="text-white">Voting Enabled</span>
          <Switch
            checked={config.votingEnabled}
            onCheckedChange={(val: boolean) => handleChange("votingEnabled", val)}
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-white">Double Vote Week</span>
          <Switch
            checked={config.doubleVoteWeek}
            onCheckedChange={(val: boolean) => handleChange("doubleVoteWeek", val)}
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-white">Triple Vote Week</span>
          <Switch
            checked={config.tripleVoteWeek}
            onCheckedChange={(val: boolean) => handleChange("tripleVoteWeek", val)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="font-medium text-white">Top Winners Promoted</label>
        <Input
          type="number"
          value={config.topWinners}
          onChange={(e) =>
            handleChange("topWinners", parseInt(e.target.value) || 0)
          }
        />
      </div>

      <div>
        <h3 className="font-bold text-[#FFD700] text-lg mb-2">🧮 Vote Limits Per Tier</h3>
        {Object.keys(config.tierLimits).map((tier) => (
          <div key={tier} className="mb-2">
            <label className="font-semibold text-white">{tier}</label>
            <Input
              type="number"
              className="mt-1"
              value={config.tierLimits[tier]}
              onChange={(e) =>
                handleTierChange("tierLimits", tier, parseInt(e.target.value) || 0)
              }
            />
          </div>
        ))}
      </div>

      <div>
        <h3 className="font-bold text-[#FFD700] text-lg mb-2">🔢 Vote Multipliers Per Tier</h3>
        {Object.keys(config.tierMultipliers).map((tier) => (
          <div key={tier} className="mb-2">
            <label className="font-semibold text-white">{tier}</label>
            <Input
              type="number"
              className="mt-1"
              value={config.tierMultipliers[tier]}
              onChange={(e) =>
                handleTierChange("tierMultipliers", tier, parseInt(e.target.value) || 0)
              }
            />
          </div>
        ))}
      </div>

      <div className="flex justify-end items-center gap-4">
        <Button onClick={handleSave}>💾 Save Changes</Button>
        {saved && <span className="text-green-400 text-sm">Saved!</span>}
      </div>
    </div>
  );
}
