"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

function UserTestComponent({ onCreate }: { onCreate?: () => void }) {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const createUser = async () => {
    setLoading(true);
    const res = await fetch("/api/users", { method: "POST" });
    const data = await res.json();
    setCount(data.totalUsers);
    setLoading(false);
    if (onCreate) onCreate(); // trigger external refresh
  };

  return (
    <div className="p-8">
      <h1 className="text-xl text-white mb-4">User Test Page</h1>
      <Button onClick={createUser} disabled={loading}>
        {loading ? "Creating..." : "👤 Create Test User"}
      </Button>
      {count !== null && (
        <p className="text-sm text-green-400 mt-2">Total Users: {count}</p>
      )}
    </div>
  );
}

export default function UserTestButtonPage() {
  return <UserTestComponent />;
}
