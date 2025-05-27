import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type RefundRequest = {
  id: number;
  user: string;
  amount: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
};

const STORAGE_KEY = "migistus_refunds";

export default function RefundQueuePanel() {
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setRefunds(JSON.parse(stored));
    } else {
      // fallback mock data
      setRefunds([
        { id: 1, user: "goldhands", amount: 15, reason: "Product was delayed", status: "pending" },
        { id: 2, user: "eira", amount: 25, reason: "Accidental pledge", status: "pending" },
        { id: 3, user: "n00bkiller99", amount: 10, reason: "No longer interested", status: "pending" },
      ]);
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(refunds));
  }, [refunds]);

  const updateStatus = (id: number, status: "approved" | "rejected") => {
    setRefunds((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl text-[#FFD700] font-semibold">💰 Refund Queue</h2>

      {refunds.length === 0 && (
        <p className="text-zinc-400 italic">No refund requests pending.</p>
      )}

      {refunds.map((req) => (
        <div
          key={req.id}
          className="bg-zinc-800 p-4 rounded-lg border border-zinc-700 space-y-2"
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="text-white font-semibold">@{req.user}</p>
              <p className="text-sm text-zinc-400">💵 ${req.amount} — {req.reason}</p>
            </div>
            <div className="flex gap-2">
              {req.status === "pending" ? (
                <>
                  <Button size="sm" onClick={() => updateStatus(req.id, "approved")}>
                    ✅ Approve
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => updateStatus(req.id, "rejected")}>
                    ❌ Reject
                  </Button>
                </>
              ) : (
                <span className={`text-sm font-bold ${req.status === "approved" ? "text-green-400" : "text-red-400"}`}>
                  {req.status.toUpperCase()}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
