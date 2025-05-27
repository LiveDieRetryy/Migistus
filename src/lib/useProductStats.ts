"use client";
import { useState, useEffect, useCallback } from "react";

export default function useProductStats() {
  const [liveProductCount, setLiveProductCount] = useState(0);

  const fetchProductCount = useCallback(() => {
    fetch("/api/products")
      .then(res => res.json())
      .then(data => setLiveProductCount(data.totalProducts ?? 0))
      .catch(err => {
        console.error("Failed to load product stats:", err);
        setLiveProductCount(0);
      });
  }, []);

  useEffect(() => {
    fetchProductCount();
  }, [fetchProductCount]);

  return {
    liveProductCount,
    refresh: fetchProductCount
  };
}

