"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function VoteTestButton({ onCast }: { onCast?: () => void }) {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const castVote = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/vote", { method: "POST" });
      const data = await res.json();
      setCount(data.votesCast);
      if (onCast) onCast();
    } catch (error) {
      console.error("Failed to cast vote:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <Button onClick={castVote} disabled={loading}>
        {loading ? "Voting..." : "🗳️ Cast Test Vote"}
      </Button>
      {count !== null && (
        <p className="text-sm text-green-400 mt-2">Total Votes: {count}</p>
      )}
    </div>
  );
}