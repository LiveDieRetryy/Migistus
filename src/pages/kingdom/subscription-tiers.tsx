import { useEffect, useState } from "react";
import Head from "next/head";
import DashboardLayout from "@/components/DashboardLayout";

const TIERS = ["Initiate", "Guild", "MIGISTUS"] as const;
type Tier = typeof TIERS[number];

type TierSettings = {
  perks: string[];
  votingMultiplier: number;
  chatCooldown: number;
  discount: number;
  socialCards?: {
    titles: string[];
    banners: string[];
    description?: string;
  };
};

type RewardsData = Record<Tier, TierSettings>;

const DEFAULT_SETTINGS: TierSettings = {
  perks: [],
  votingMultiplier: 1,
  chatCooldown: 30,
  discount: 0,
  socialCards: { titles: [], banners: [], description: "" }
};

export default function TierRewardEditorPage() {
  const [rewards, setRewards] = useState<RewardsData>({
    Initiate: { ...DEFAULT_SETTINGS },
    Guild: { ...DEFAULT_SETTINGS },
    MIGISTUS: { ...DEFAULT_SETTINGS },
  });
  const [original, setOriginal] = useState<RewardsData>(rewards);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTier, setActiveTier] = useState<Tier>("Initiate");

  // Social card input states
  const [newTitle, setNewTitle] = useState("");
  const [newBanner, setNewBanner] = useState("");

  useEffect(() => {
    fetch("/api/tier-rewards")
      .then(res => res.json())
      .then(data => {
        // Ensure socialCards exists for each tier
        for (const tier of TIERS) {
          if (!data[tier].socialCards) {
            data[tier].socialCards = { titles: [], banners: [], description: "" };
          }
        }
        setRewards(data);
        setOriginal(data);
      })
      .finally(() => setLoading(false));
  }, []);

  // Perk handlers
  const handlePerkChange = (idx: number, value: string) => {
    setRewards(r => ({
      ...r,
      [activeTier]: {
        ...r[activeTier],
        perks: r[activeTier].perks.map((item, i) => (i === idx ? value : item)),
      },
    }));
  };

  const addPerk = () => {
    setRewards(r => ({
      ...r,
      [activeTier]: {
        ...r[activeTier],
        perks: [...r[activeTier].perks, ""],
      },
    }));
  };

  const removePerk = (idx: number) => {
    setRewards(r => ({
      ...r,
      [activeTier]: {
        ...r[activeTier],
        perks: r[activeTier].perks.filter((_, i) => i !== idx),
      },
    }));
  };

  // Numeric setting handlers
  const handleSettingChange = (field: keyof Omit<TierSettings, "perks" | "socialCards">, value: number) => {
    setRewards(r => ({
      ...r,
      [activeTier]: {
        ...r[activeTier],
        [field]: value,
      },
    }));
  };

  // Social card handlers
  const addTitle = () => {
    if (!newTitle.trim()) return;
    setRewards(r => ({
      ...r,
      [activeTier]: {
        ...r[activeTier],
        socialCards: {
          ...r[activeTier].socialCards,
          titles: [...(r[activeTier].socialCards?.titles || []), newTitle.trim()],
          banners: r[activeTier].socialCards?.banners || [],
          description: r[activeTier].socialCards?.description || "",
        },
      },
    }));
    setNewTitle("");
  };

  const removeTitle = (idx: number) => {
    setRewards(r => ({
      ...r,
      [activeTier]: {
        ...r[activeTier],
        socialCards: {
          ...r[activeTier].socialCards,
          titles: (r[activeTier].socialCards?.titles || []).filter((_, i) => i !== idx),
          banners: r[activeTier].socialCards?.banners || [],
          description: r[activeTier].socialCards?.description || "",
        },
      },
    }));
  };

  const addBanner = () => {
    if (!newBanner.trim()) return;
    setRewards(r => ({
      ...r,
      [activeTier]: {
        ...r[activeTier],
        socialCards: {
          ...r[activeTier].socialCards,
          banners: [...(r[activeTier].socialCards?.banners || []), newBanner.trim()],
          titles: r[activeTier].socialCards?.titles || [],
          description: r[activeTier].socialCards?.description || "",
        },
      },
    }));
    setNewBanner("");
  };

  const removeBanner = (idx: number) => {
    setRewards(r => ({
      ...r,
      [activeTier]: {
        ...r[activeTier],
        socialCards: {
          ...r[activeTier].socialCards,
          banners: (r[activeTier].socialCards?.banners || []).filter((_, i) => i !== idx),
          titles: r[activeTier].socialCards?.titles || [],
          description: r[activeTier].socialCards?.description || "",
        },
      },
    }));
  };

  const handleSocialDescriptionChange = (value: string) => {
    setRewards(r => ({
      ...r,
      [activeTier]: {
        ...r[activeTier],
        socialCards: {
          ...r[activeTier].socialCards,
          description: value,
          titles: r[activeTier].socialCards?.titles || [],
          banners: r[activeTier].socialCards?.banners || [],
        },
      },
    }));
  };

  const saveRewards = async () => {
    setSaving(true);
    await fetch("/api/tier-rewards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rewards),
    });
    setSaving(false);
    setSaved(true);
    setOriginal(rewards);
    setTimeout(() => setSaved(false), 1200);
  };

  const resetRewards = () => {
    setRewards(original);
  };

  const hasChanges = JSON.stringify(rewards) !== JSON.stringify(original);

  return (
    <DashboardLayout>
      <Head>
        <title>Tier Reward Editor - The King's Domain</title>
      </Head>
      <div className="max-w-5xl mx-auto p-6"> {/* widen the main container */}
        <h1 className="text-3xl font-bold text-yellow-400 mb-2">🥇 Tier Reward Editor</h1>
        <p className="text-zinc-400 mb-6">
          Edit perks and settings for Initiate, Guild, and MIGISTUS membership tiers.
        </p>
        {loading ? (
          <div className="text-yellow-300">Loading...</div>
        ) : (
          <div>
            {/* Tabs for tiers */}
            <div className="flex mb-6 border-b border-yellow-500/30">
              {TIERS.map(tier => (
                <button
                  key={tier}
                  onClick={() => setActiveTier(tier)}
                  className={`px-4 py-2 font-semibold transition border-b-2 ${
                    activeTier === tier
                      ? "text-yellow-400 border-yellow-400"
                      : "text-gray-400 border-transparent hover:text-yellow-300"
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>
            {/* Settings for active tier */}
            <div className="bg-zinc-900 border border-yellow-500/20 rounded-lg p-8 mb-8">
              <h2 className="text-xl font-semibold text-yellow-300 mb-3">{activeTier} Settings</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
                <div>
                  <label className="block text-yellow-300 mb-1 font-medium">Voting Multiplier</label>
                  <input
                    type="number"
                    min={1}
                    value={rewards[activeTier].votingMultiplier}
                    onChange={e => handleSettingChange("votingMultiplier", Number(e.target.value))}
                    className="w-full px-3 py-2 rounded bg-zinc-800 border border-yellow-500/20 text-white"
                  />
                  <span className="text-xs text-zinc-400">How many votes this tier gets per vote action.</span>
                </div>
                <div>
                  <label className="block text-yellow-300 mb-1 font-medium">Chat Cooldown (seconds)</label>
                  <input
                    type="number"
                    min={0}
                    value={rewards[activeTier].chatCooldown}
                    onChange={e => handleSettingChange("chatCooldown", Number(e.target.value))}
                    className="w-full px-3 py-2 rounded bg-zinc-800 border border-yellow-500/20 text-white"
                  />
                  <span className="text-xs text-zinc-400">Minimum seconds between chat messages.</span>
                </div>
                <div>
                  <label className="block text-yellow-300 mb-1 font-medium">Discount (%)</label>
                  <input
                    type="number"
                    min={0}
                    value={rewards[activeTier].discount}
                    onChange={e => handleSettingChange("discount", Number(e.target.value))}
                    className="w-full px-3 py-2 rounded bg-zinc-800 border border-yellow-500/20 text-white"
                  />
                  <span className="text-xs text-zinc-400">Extra discount for this tier (applied at checkout).</span>
                </div>
              </div>
              {/* Perks */}
              <h3 className="text-lg font-semibold text-yellow-300 mb-2">Perks</h3>
              <ul className="space-y-2 mb-4">
                {(!rewards[activeTier] || !Array.isArray(rewards[activeTier].perks) || rewards[activeTier].perks.length === 0) && (
                  <li className="text-gray-500 italic">No perks yet. Add one below.</li>
                )}
                {Array.isArray(rewards[activeTier]?.perks) &&
                  rewards[activeTier].perks.map((perk, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={perk}
                        onChange={e => handlePerkChange(idx, e.target.value)}
                        className="flex-1 bg-zinc-800 border border-yellow-500/20 rounded px-3 py-2 text-white"
                        placeholder={`Perk #${idx + 1}`}
                      />
                      <button
                        onClick={() => removePerk(idx)}
                        className="text-red-400 hover:text-red-300 px-2 py-1 rounded"
                        title="Remove"
                      >
                        ×
                      </button>
                    </li>
                  ))}
              </ul>
              <button
                onClick={addPerk}
                className="bg-yellow-500 text-black px-4 py-2 rounded font-semibold hover:bg-yellow-400 transition"
              >
                + Add Perk
              </button>
            </div>
            {/* --- Social Card Section --- */}
            <div className="bg-zinc-900 border border-yellow-500/20 rounded-lg p-8 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Social Card Editing Tools (left) */}
                <div className="bg-zinc-800 border border-yellow-500/10 rounded-lg p-8 flex flex-col h-full">
                  <h2 className="text-xl font-semibold text-yellow-300 mb-6">{activeTier} Social Card Editor</h2>
                  <div className="mb-8">
                    <label className="block text-yellow-300 mb-1 font-medium">Add Title</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={newTitle}
                        onChange={e => setNewTitle(e.target.value)}
                        className="flex-1 px-3 py-2 rounded bg-zinc-800 border border-yellow-500/20 text-white"
                        placeholder="Add new title..."
                      />
                      <button
                        onClick={addTitle}
                        className="bg-yellow-500 text-black px-4 py-2 rounded font-semibold hover:bg-yellow-400 transition shrink-0"
                        style={{ minWidth: 80 }}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                  <div className="mb-8">
                    <label className="block text-yellow-300 mb-1 font-medium">Add Banner (URL or CSS)</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={newBanner}
                        onChange={e => setNewBanner(e.target.value)}
                        className="flex-1 px-3 py-2 rounded bg-zinc-800 border border-yellow-500/20 text-white"
                        placeholder="Add new banner URL or CSS..."
                      />
                      <button
                        onClick={addBanner}
                        className="bg-yellow-500 text-black px-4 py-2 rounded font-semibold hover:bg-yellow-400 transition shrink-0"
                        style={{ minWidth: 80 }}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-yellow-300 mb-1 font-medium">Card Description</label>
                    <textarea
                      value={rewards[activeTier].socialCards?.description || ""}
                      onChange={e => handleSocialDescriptionChange(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-zinc-900 border border-yellow-500/20 text-white"
                      placeholder="Describe this tier for social/profile cards"
                    />
                  </div>
                </div>
                {/* Social Card Current Preview (right) */}
                <div className="bg-zinc-800 border border-yellow-500/10 rounded-lg p-8 flex flex-col h-full">
                  <h3 className="text-lg font-semibold text-yellow-300 mb-4">Current Titles</h3>
                  <div className="flex flex-wrap gap-2 mb-8">
                    {(rewards[activeTier].socialCards?.titles || []).length === 0 && (
                      <span className="text-gray-500 italic">No titles yet.</span>
                    )}
                    {(rewards[activeTier].socialCards?.titles || []).map((title, idx) => (
                      <span key={idx} className="bg-yellow-900/40 border border-yellow-500/30 text-yellow-200 px-3 py-1 rounded-full flex items-center gap-2">
                        {title}
                        <button
                          onClick={() => removeTitle(idx)}
                          className="text-yellow-400 hover:text-yellow-300"
                          title="Remove"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <h3 className="text-lg font-semibold text-yellow-300 mb-4">Current Banners</h3>
                  <div className="flex flex-wrap gap-2 mb-8">
                    {(rewards[activeTier].socialCards?.banners || []).length === 0 && (
                      <span className="text-gray-500 italic">No banners yet.</span>
                    )}
                    {(rewards[activeTier].socialCards?.banners || []).map((banner, idx) => (
                      <div key={idx} className="flex flex-col items-center mb-2">
                        <span className="bg-yellow-900/40 border border-yellow-500/30 text-yellow-200 px-3 py-1 rounded-full mb-1 break-all max-w-xs">
                          {banner}
                        </span>
                        {banner.startsWith("http") ? (
                          <img
                            src={banner}
                            alt="Banner preview"
                            className="w-32 h-8 object-cover rounded shadow border border-yellow-400/30"
                          />
                        ) : (
                          <div
                            className="w-32 h-8 rounded shadow border border-yellow-400/30"
                            style={{ background: banner }}
                            title={banner}
                          />
                        )}
                        <button
                          onClick={() => removeBanner(idx)}
                          className="text-yellow-400 hover:text-yellow-300 mt-1"
                          title="Remove"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <h3 className="text-lg font-semibold text-yellow-300 mb-2">Current Description</h3>
                  <div className="bg-zinc-900 border border-yellow-500/10 rounded p-3 text-yellow-100 min-h-[48px]">
                    {rewards[activeTier].socialCards?.description || <span className="text-gray-500 italic">No description yet.</span>}
                  </div>
                </div>
              </div>
            </div>
            {/* Save/Reset controls */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={resetRewards}
                disabled={!hasChanges || saving}
                className="px-4 py-2 rounded border border-yellow-500 text-yellow-400 hover:bg-yellow-500/10 transition disabled:opacity-50"
              >
                Reset
              </button>
              <button
                onClick={saveRewards}
                disabled={!hasChanges || saving}
                className="px-6 py-2 rounded bg-yellow-500 text-black font-bold hover:bg-yellow-400 transition disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              {saved && (
                <span className="ml-2 text-green-400 font-semibold self-center">Saved!</span>
              )}
            </div>
          </div>
        )}
        {/* Yes, all edits on this page are live and persist to the backend
            as long as your /api/tier-rewards endpoint is implemented and
            your backend has write access to public/data/tier-rewards.json.
            Changes to perks, titles, banners, and descriptions are saved
            and reflected immediately after clicking "Save Changes". */}
      </div>
    </DashboardLayout>
  );
}
