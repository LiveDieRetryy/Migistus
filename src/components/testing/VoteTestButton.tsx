"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

function VoteTestComponent({ onCast }: { onCast?: () => void }) {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const castVote = async () => {
    setLoading(true);
    const res = await fetch("/api/vote", { method: "POST" });
    const data = await res.json();
    setCount(data.votesCast);
    setLoading(false);
    if (onCast) onCast();
  };

  return (
    <div className="p-8">
      <h1 className="text-xl text-white mb-4">Vote Test Page</h1>
      <Button onClick={castVote} disabled={loading}>
        {loading ? "Voting..." : "🗳️ Cast Test Vote"}
      </Button>
      {count !== null && (
        <p className="text-sm text-green-400 mt-2">Total Votes: {count}</p>
      )}
    </div>
  );
}

export default function VoteTestButtonPage() {
  return <VoteTestComponent />;
}
