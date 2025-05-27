"use client";
import { useState, useEffect, useCallback } from "react";

export default function useRefundStats() {
  const [pendingRefunds, setPendingRefunds] = useState(0);

  const fetchRefunds = useCallback(() => {
    fetch("/api/refunds")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPendingRefunds(data.filter((r) => r.status === "pending").length);
        } else {
          setPendingRefunds(0);
        }
      })
      .catch((err) => {
        console.error("Failed to load refund stats:", err);
        setPendingRefunds(0);
      });
  }, []);

  useEffect(() => {
    fetchRefunds();
    const interval = setInterval(fetchRefunds, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [fetchRefunds]);

  return {
    pendingRefunds,
    refresh: fetchRefunds,
  };
}
