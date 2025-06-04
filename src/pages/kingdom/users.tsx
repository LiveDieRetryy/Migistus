import { useEffect, useState } from "react";
import Head from "next/head";
import DashboardLayout from "@/components/DashboardLayout";
import Link from "next/link";

type User = {
  id: number;
  username: string;
  email: string;
  tier?: string;
  banned?: boolean;
};

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/users")
      .then(res => res.json())
      .then(data => setUsers(Array.isArray(data.users) ? data.users : []))
      .finally(() => setLoading(false));
  }, []);

  const handleBan = (id: number) => {
    setUsers(users =>
      users.map(u => u.id === id ? { ...u, banned: !u.banned } : u)
    );
    // TODO: Persist ban status to backend if needed
  };

  const handlePromote = (id: number) => {
    setUsers(users =>
      users.map(u =>
        u.id === id
          ? { ...u, tier: u.tier === "MIGISTUS" ? "Guild" : "MIGISTUS" }
          : u
      )
    );
    // TODO: Persist tier change to backend if needed
  };

  const tierOptions = ["Initiate", "Guild", "MIGISTUS"];

  const handleTierChange = async (id: number, newTier: string) => {
    setUsers(users =>
      users.map(u => u.id === id ? { ...u, tier: newTier } : u)
    );
    // Persist to backend
    await fetch(`/api/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier: newTier }),
    });
  };

  return (
    <DashboardLayout>
      <Head>
        <title>User Management - The King's Domain</title>
      </Head>
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-yellow-400">👥 User Management</h1>
          <Link
            href="/kingdom/enforcement-management"
            className="bg-red-600 hover:bg-red-500 text-white font-semibold px-4 py-2 rounded transition"
          >
            🚨 Enforcement Management
          </Link>
        </div>
        {loading ? (
          <div className="text-yellow-300">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="text-gray-400">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-zinc-900 border border-yellow-500/20 rounded-lg">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-yellow-300">Username</th>
                  <th className="px-4 py-2 text-left text-yellow-300">Email</th>
                  <th className="px-4 py-2 text-left text-yellow-300">Tier</th>
                  <th className="px-4 py-2 text-left text-yellow-300">Status</th>
                  <th className="px-4 py-2 text-left text-yellow-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className={user.banned ? "bg-red-900/30" : ""}>
                    <td className="px-4 py-2">{user.username}</td>
                    <td className="px-4 py-2">{user.email}</td>
                    <td className="px-4 py-2">
                      <select
                        value={user.tier || "Initiate"}
                        onChange={e => handleTierChange(user.id, e.target.value)}
                        className="bg-zinc-800 border border-yellow-500/30 rounded px-2 py-1 text-yellow-300"
                      >
                        {tierOptions.map(tier => (
                          <option key={tier} value={tier}>{tier}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      {user.banned ? (
                        <span className="text-red-400 font-bold">Banned</span>
                      ) : (
                        <span className="text-green-400">Active</span>
                      )}
                    </td>
                    <td className="px-4 py-2 space-x-2">
                      <button
                        onClick={() => handleBan(user.id)}
                        className={`px-3 py-1 rounded font-semibold ${user.banned ? "bg-green-600 text-white" : "bg-red-600 text-white"} hover:opacity-80`}
                      >
                        {user.banned ? "Unban" : "Ban"}
                      </button>
                      <button
                        onClick={() => handlePromote(user.id)}
                        className="px-3 py-1 rounded bg-yellow-400 text-black font-semibold hover:bg-yellow-300"
                      >
                        Promote
                      </button>
                      {/* Add more actions as needed */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
