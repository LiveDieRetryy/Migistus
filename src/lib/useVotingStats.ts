"use client";
import { useState, useEffect, useCallback } from "react";

export default function useVotingStats() {
  const [totalVotes, setTotalVotes] = useState(0);

  const fetchVotes = useCallback(() => {
    fetch("/api/stats")
      .then(res => res.json())
      .then(data => {
        if (typeof data.votesCast === "number") {
          setTotalVotes(data.votesCast);
        } else {
          setTotalVotes(0);
        }
      })
      .catch(err => {
        console.error("Failed to load voting stats:", err);
        setTotalVotes(0);
      });
  }, []);

  useEffect(() => {
    fetchVotes();
    const interval = setInterval(fetchVotes, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [fetchVotes]);

  return {
    totalVotes,
    refresh: fetchVotes
  };
}
