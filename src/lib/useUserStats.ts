"use client";
import { useState, useEffect, useCallback } from "react";

export default function useUserStats() {
  const [userCount, setUserCount] = useState(0);

  const fetchUserCount = useCallback(() => {
    fetch("/api/users")
      .then(res => res.json())
      .then(data => setUserCount(data.totalUsers ?? 0))
      .catch(err => {
        console.error("Failed to load user stats:", err);
        setUserCount(0);
      });
  }, []);

  useEffect(() => {
    fetchUserCount();
  }, [fetchUserCount]);

  return {
    userCount,
    refresh: fetchUserCount // 👈 this is what we pass into the button
  };
}
