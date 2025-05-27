"use client";
import { useState, useEffect, useCallback } from "react";

export default function useVotingStats() {
  const [totalVotes, setTotalVotes] = useState(0);

  const fetchVotes = useCallback(() => {
    fetch("/api/voting-config")
      .then(res => res.json())
      .then(data => setTotalVotes(data.votesCast ?? 0))
      .catch(err => {
        console.error("Failed to fetch votes:", err);
        setTotalVotes(0);
      });
  }, []);

  useEffect(() => {
    fetchVotes();
  }, [fetchVotes]);

  return {
    totalVotes,
    refresh: fetchVotes
  };
}
