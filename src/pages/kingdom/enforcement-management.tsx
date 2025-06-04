import Head from "next/head";
import DashboardLayout from "@/components/DashboardLayout";
import { useEffect, useState } from "react";

type User = {
  id: number;
  username: string;
  email: string;
  banned?: boolean;
  mutedUntil?: string | null;
};

export default function EnforcementManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/users")
      .then(res => res.json())
      .then(data => {
        setUsers(Array.isArray(data.users) ? data.users : []);
        setLoading(false);
      });
  }, []);

  const handleUnban = async (userId: number) => {
    // Implement backend call to unban user if needed
    setUsers(prev =>
      prev.map(u => u.id === userId ? { ...u, banned: false } : u)
    );
    // TODO: POST/PUT to /api/users/[id] to update ban status
  };

  const handleUnmute = async (userId: number) => {
    setUsers(prev =>
      prev.map(u => u.id === userId ? { ...u, mutedUntil: null } : u)
    );
    // TODO: POST/PUT to /api/users/[id] to update mute status
  };

  const bannedUsers = users.filter(u => u.banned);
  const mutedUsers = users.filter(u => u.mutedUntil && new Date(u.mutedUntil) > new Date());

  return (
    <DashboardLayout>
      <Head>
        <title>Enforcement Management - The King's Domain</title>
      </Head>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-red-400 mb-6">🚨 Enforcement Management</h1>
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-yellow-400 mb-2">Banned Users</h2>
          {bannedUsers.length === 0 ? (
            <div className="text-gray-400">No banned users.</div>
          ) : (
            <div className="space-y-3">
              {bannedUsers.map(u => (
                <div key={u.id} className="bg-zinc-900 border border-red-600/40 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white">{u.username}</span>
                    <span className="ml-2 text-xs text-zinc-400">{u.email}</span>
                  </div>
                  <button
                    className="bg-green-600 text-white px-3 py-1 rounded font-semibold hover:bg-green-500 transition"
                    onClick={() => handleUnban(u.id)}
                  >
                    Unban
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <h2 className="text-xl font-semibold text-yellow-400 mb-2">Muted Users</h2>
          {mutedUsers.length === 0 ? (
            <div className="text-gray-400">No muted users.</div>
          ) : (
            <div className="space-y-3">
              {mutedUsers.map(u => (
                <div key={u.id} className="bg-zinc-900 border border-yellow-600/40 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white">{u.username}</span>
                    <span className="ml-2 text-xs text-zinc-400">{u.email}</span>
                    <span className="ml-2 text-xs text-yellow-300">
                      Muted until: {u.mutedUntil && new Date(u.mutedUntil).toLocaleString()}
                    </span>
                  </div>
                  <button
                    className="bg-green-600 text-white px-3 py-1 rounded font-semibold hover:bg-green-500 transition"
                    onClick={() => handleUnmute(u.id)}
                  >
                    Unmute
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
