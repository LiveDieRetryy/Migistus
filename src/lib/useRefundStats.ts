"use client";
import { useState, useEffect, useCallback } from "react";

export default function useRefundStats() {
  const [pendingRefunds, setPendingRefunds] = useState(0);

  const fetchRefunds = useCallback(() => {
    fetch("/api/refunds")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => setPendingRefunds(data.pendingRefunds ?? 0))
      .catch((err) => {
        console.error("❌ Failed to load refund stats:", err);
        setPendingRefunds(0);
      });
  }, []);

  useEffect(() => {
    fetchRefunds();
  }, [fetchRefunds]);

  return {
    pendingRefunds,
    refresh: fetchRefunds,
  };
}
