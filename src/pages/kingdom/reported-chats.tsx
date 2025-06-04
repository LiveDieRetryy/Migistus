import Head from "next/head";
import DashboardLayout from "@/components/DashboardLayout";
import { useEffect, useState } from "react";

const REASON_LABELS: Record<string, string> = {
  spam: "Spam or advertising",
  offensive: "Offensive language",
  harmful: "Harmful speech",
  harassment: "Harassment or bullying",
  other: "Other",
};

const DURATION_OPTIONS = [
  { label: "1 hour", value: 1 / 24 },
  { label: "6 hours", value: 6 / 24 },
  { label: "12 hours", value: 12 / 24 },
  { label: "1 day", value: 1 },
  { label: "3 days", value: 3 },
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "Permanent", value: 3650 },
];

export default function ReportedChatsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [muteState, setMuteState] = useState<Record<number, number>>({});
  const [banState, setBanState] = useState<Record<number, number>>({});

  useEffect(() => {
    fetch("/api/reports")
      .then((res) => res.json())
      .then((data) => setReports(data));
  }, []);

  const filtered = filter
    ? reports.filter((r) => r.reason === filter)
    : reports;

  // Simulate mute/ban actions (replace with backend call in production)
  const handleMute = async (user: string, days: number, id: number) => {
    setActionLoading(id);
    setTimeout(() => {
      setReports((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, muteUntil: days, status: "muted" } : r
        )
      );
      setActionLoading(null);
    }, 800);
  };

  const handleBan = async (user: string, days: number, id: number) => {
    setActionLoading(id);
    setTimeout(() => {
      setReports((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, banUntil: days, status: "banned" } : r
        )
      );
      setActionLoading(null);
    }, 800);
  };

  const handleApprove = (id: number) => {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "approved" } : r))
    );
  };

  return (
    <DashboardLayout>
      <Head>
        <title>Reported Chats - The King's Domain</title>
      </Head>
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-red-400 mb-2">
            🚨 Reported Chats Monitor
          </h1>
          <p className="text-zinc-400">
            Review and moderate reported chat messages in real time.
          </p>
        </div>
        <div className="mb-6 flex gap-4 items-center">
          <label className="text-yellow-300 font-medium">Filter by reason:</label>
          <select
            className="bg-zinc-800 border border-yellow-500/20 text-yellow-300 rounded px-2 py-1"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="">All</option>
            {Object.entries(REASON_LABELS).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-6">
          {filtered.length === 0 && (
            <div className="text-gray-400 text-center">
              No reported chats at this time.
            </div>
          )}
          {filtered.map((r) => (
            <div
              key={r.id}
              className="bg-zinc-900 border border-red-600/40 rounded-lg p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-white">{r.user}</span>
                  <span className="text-xs bg-red-700/60 text-red-200 px-2 py-1 rounded">
                    {REASON_LABELS[r.reason] || r.reason}
                  </span>
                  <span className="text-xs text-zinc-400">
                    {r.time && new Date(r.time).toLocaleString()}
                  </span>
                  {r.productId && (
                    <span className="text-xs text-zinc-400">
                      Product: {r.productId}
                    </span>
                  )}
                  <span className="text-xs px-2 py-1 rounded bg-zinc-800 border border-zinc-700 ml-2">
                    {r.status || "pending"}
                  </span>
                </div>
                <div className="text-yellow-200 text-base mb-1">
                  "{r.message}"
                </div>
                {r.note && (
                  <div className="text-xs text-zinc-400">Note: {r.note}</div>
                )}
              </div>
              {/* Moderation actions */}
              <div className="flex flex-col gap-2 min-w-[180px]">
                <div className="flex gap-2">
                  <select
                    className="bg-zinc-800 border border-zinc-600 text-yellow-300 rounded px-2 py-1"
                    value={muteState[r.id] ?? 1}
                    onChange={(e) =>
                      setMuteState((s) => ({ ...s, [r.id]: Number(e.target.value) }))
                    }
                    id={`mute-${r.id}`}
                  >
                    {DURATION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        Mute {opt.label}
                      </option>
                    ))}
                  </select>
                  <button
                    className="bg-yellow-500 text-black px-3 py-1 rounded font-semibold hover:bg-yellow-400 transition"
                    disabled={actionLoading === r.id}
                    onClick={() =>
                      handleMute(
                        r.user,
                        muteState[r.id] ?? 1,
                        r.id
                      )
                    }
                  >
                    {actionLoading === r.id && r.status === "muted"
                      ? "Muting..."
                      : "Mute"}
                  </button>
                </div>
                <div className="flex gap-2">
                  <select
                    className="bg-zinc-800 border border-zinc-600 text-red-300 rounded px-2 py-1"
                    value={banState[r.id] ?? 1}
                    onChange={(e) =>
                      setBanState((s) => ({ ...s, [r.id]: Number(e.target.value) }))
                    }
                    id={`ban-${r.id}`}
                  >
                    {DURATION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        Ban {opt.label}
                      </option>
                    ))}
                  </select>
                  <button
                    className="bg-red-600 text-white px-3 py-1 rounded font-semibold hover:bg-red-500 transition"
                    disabled={actionLoading === r.id}
                    onClick={() =>
                      handleBan(
                        r.user,
                        banState[r.id] ?? 1,
                        r.id
                      )
                    }
                  >
                    {actionLoading === r.id && r.status === "banned"
                      ? "Banning..."
                      : "Ban"}
                  </button>
                </div>
                <button
                  className="bg-green-600 text-white px-3 py-1 rounded font-semibold hover:bg-green-500 transition"
                  disabled={actionLoading === r.id}
                  onClick={() => handleApprove(r.id)}
                >
                  Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
