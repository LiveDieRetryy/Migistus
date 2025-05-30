import Head from "next/head";
import DashboardLayout from "@/components/DashboardLayout";
import { useEffect, useState } from "react";
import Link from "next/link";

type TierLimits = Record<string, number>;
type TierMultipliers = Record<string, number>;

type VotingConfig = {
  votingEnabled: boolean;
  doubleVoteWeek: boolean;
  tripleVoteWeek: boolean;
  topWinners: number;
  tierLimits: TierLimits;
  tierMultipliers: TierMultipliers;
  votingStartTime?: string;
  votingEndTime?: string;
  allowRevote?: boolean;
  allowVoteEdit?: boolean;
  requireLogin?: boolean;
  cooldownSeconds?: number;
  maxVotesPerUser?: number;
  minVotesToWin?: number;
  votingDescription?: string;
  votingBannerUrl?: string;
  votingRules?: string;
};

export default function VotingConfigPage() {
  const [config, setConfig] = useState<VotingConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/voting-config")
      .then(res => res.json())
      .then(setConfig)
      .catch(() => setError("Failed to load voting config"));
  }, []);

  const handleChange = (field: keyof VotingConfig, value: any) => {
    setConfig(prev => prev ? { ...prev, [field]: value } : prev);
  };

  const handleTierLimitChange = (tier: string, value: number) => {
    setConfig(prev =>
      prev
        ? { ...prev, tierLimits: { ...prev.tierLimits, [tier]: value } }
        : prev
    );
  };

  const handleTierMultiplierChange = (tier: string, value: number) => {
    setConfig(prev =>
      prev
        ? { ...prev, tierMultipliers: { ...prev.tierMultipliers, [tier]: value } }
        : prev
    );
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/voting-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Failed to save voting config");
    }
    setSaving(false);
  };

  if (!config) {
    return (
      <DashboardLayout>
        <Head>
          <title>Voting Config - King's Domain</title>
        </Head>
        <div className="text-yellow-400 text-xl p-8">Loading voting configuration...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Head>
        <title>Voting Config - King's Domain</title>
      </Head>
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center gap-3 mb-8">
          <span className="text-3xl">⚙️</span>
          <h1 className="text-3xl font-bold text-yellow-400">Voting Configuration</h1>
        </div>
        <div className="mb-6">
          <Link
            href="/kingdom/voting-stats"
            className="text-yellow-400 hover:underline"
          >
            View Voting Stats by Category →
          </Link>
        </div>
        {error && <div className="text-red-400 mb-4">{error}</div>}
        <div className="space-y-8">
          {/* Voting Toggles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-zinc-900/80 rounded-xl border border-yellow-400/10 p-6 shadow">
            <ToggleRow
              label="Voting Enabled"
              checked={config.votingEnabled}
              onChange={v => handleChange("votingEnabled", v)}
            />
            <ToggleRow
              label="Double Vote Week"
              checked={config.doubleVoteWeek}
              onChange={v => handleChange("doubleVoteWeek", v)}
            />
            <ToggleRow
              label="Triple Vote Week"
              checked={config.tripleVoteWeek}
              onChange={v => handleChange("tripleVoteWeek", v)}
            />
            <NumberRow
              label="Top Winners"
              value={config.topWinners}
              min={1}
              onChange={v => handleChange("topWinners", v)}
            />
            <ToggleRow
              label="Allow Revote"
              checked={!!config.allowRevote}
              onChange={v => handleChange("allowRevote", v)}
            />
            <ToggleRow
              label="Allow Vote Edit"
              checked={!!config.allowVoteEdit}
              onChange={v => handleChange("allowVoteEdit", v)}
            />
            <ToggleRow
              label="Require Login"
              checked={!!config.requireLogin}
              onChange={v => handleChange("requireLogin", v)}
            />
            <NumberRow
              label="Vote Cooldown (seconds)"
              value={config.cooldownSeconds ?? 0}
              min={0}
              onChange={v => handleChange("cooldownSeconds", v)}
            />
            <NumberRow
              label="Max Votes Per User"
              value={config.maxVotesPerUser ?? 1}
              min={1}
              onChange={v => handleChange("maxVotesPerUser", v)}
            />
            <NumberRow
              label="Min Votes to Win"
              value={config.minVotesToWin ?? 1}
              min={1}
              onChange={v => handleChange("minVotesToWin", v)}
            />
            <div className="flex flex-col gap-2 col-span-full md:col-span-2">
              <label className="text-zinc-200 font-medium">Voting Start Time</label>
              <input
                type="datetime-local"
                value={config.votingStartTime || ""}
                onChange={e => handleChange("votingStartTime", e.target.value)}
                className="px-2 py-1 rounded bg-zinc-800 border border-yellow-400/30 text-white"
              />
            </div>
            <div className="flex flex-col gap-2 col-span-full md:col-span-2">
              <label className="text-zinc-200 font-medium">Voting End Time</label>
              <input
                type="datetime-local"
                value={config.votingEndTime || ""}
                onChange={e => handleChange("votingEndTime", e.target.value)}
                className="px-2 py-1 rounded bg-zinc-800 border border-yellow-400/30 text-white"
              />
            </div>
          </div>

          {/* Voting Description, Banner, Rules */}
          <div className="bg-zinc-900/80 rounded-xl border border-yellow-400/10 p-6 shadow space-y-6">
            <div>
              <label className="text-zinc-200 font-medium block mb-1">Voting Description</label>
              <textarea
                value={config.votingDescription || ""}
                onChange={e => handleChange("votingDescription", e.target.value)}
                className="w-full px-3 py-2 rounded bg-zinc-800 border border-yellow-400/30 text-white"
                rows={2}
              />
            </div>
            <div>
              <label className="text-zinc-200 font-medium block mb-1">Voting Banner Image URL</label>
              <input
                type="text"
                value={config.votingBannerUrl || ""}
                onChange={e => handleChange("votingBannerUrl", e.target.value)}
                className="w-full px-3 py-2 rounded bg-zinc-800 border border-yellow-400/30 text-white"
              />
              {config.votingBannerUrl && (
                <img
                  src={config.votingBannerUrl}
                  alt="Voting Banner"
                  className="mt-2 rounded shadow max-h-32"
                />
              )}
            </div>
            <div>
              <label className="text-zinc-200 font-medium block mb-1">Voting Rules (Markdown supported)</label>
              <textarea
                value={config.votingRules || ""}
                onChange={e => handleChange("votingRules", e.target.value)}
                className="w-full px-3 py-2 rounded bg-zinc-800 border border-yellow-400/30 text-white"
                rows={4}
              />
            </div>
          </div>

          {/* Tier Vote Limits */}
          <div className="bg-zinc-900/80 rounded-xl border border-yellow-400/10 p-6 shadow">
            <h2 className="text-xl text-yellow-400 font-semibold mb-2">Tier Vote Limits</h2>
            <div className="space-y-2">
              {Object.entries(config.tierLimits).map(([tier, value]) => (
                <div key={tier} className="flex items-center justify-between">
                  <label className="text-zinc-300">{tier}</label>
                  <input
                    type="number"
                    min={1}
                    value={value}
                    onChange={e => handleTierLimitChange(tier, parseInt(e.target.value) || 1)}
                    className="w-20 px-2 py-1 rounded bg-zinc-800 border border-yellow-400/30 text-white"
                  />
                </div>
              ))}
            </div>
          </div>
          {/* Tier Vote Multipliers */}
          <div className="bg-zinc-900/80 rounded-xl border border-yellow-400/10 p-6 shadow">
            <h2 className="text-xl text-yellow-400 font-semibold mb-2">Tier Vote Multipliers</h2>
            <div className="space-y-2">
              {Object.entries(config.tierMultipliers).map(([tier, value]) => (
                <div key={tier} className="flex items-center justify-between">
                  <label className="text-zinc-300">{tier}</label>
                  <input
                    type="number"
                    min={1}
                    value={value}
                    onChange={e => handleTierMultiplierChange(tier, parseInt(e.target.value) || 1)}
                    className="w-20 px-2 py-1 rounded bg-zinc-800 border border-yellow-400/30 text-white"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        <button
          className="mt-10 w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded-xl shadow transition text-lg"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Configuration"}
        </button>
        {saved && <div className="text-green-400 mt-2 text-center">Saved!</div>}
      </div>
    </DashboardLayout>
  );
}

// Helper components for cleaner layout
function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <label className="text-zinc-200 font-medium">{label}</label>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="w-5 h-5 text-yellow-500 accent-yellow-500"
      />
    </div>
  );
}

function NumberRow({
  label,
  value,
  min,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <label className="text-zinc-200 font-medium">{label}</label>
      <input
        type="number"
        min={min}
        value={value}
        onChange={e => onChange(parseInt(e.target.value) || min)}
        className="w-24 px-2 py-1 rounded bg-zinc-800 border border-yellow-400/30 text-white"
      />
    </div>
  );
}
