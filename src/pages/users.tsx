import { useEffect, useState } from "react";
import Head from "next/head";
import MainNavbar from "@/components/nav/MainNavbar";
import Link from "next/link";

type User = {
  id: number;
  username: string;
  email: string;
  tier?: string;
  banned?: boolean;
};

export default function PublicUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/users")
      .then(res => res.json())
      .then(data => setUsers(Array.isArray(data.users) ? data.users : []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Head>
        <title>All Users - MIGISTUS</title>
      </Head>
      <MainNavbar />
      <div className="min-h-screen bg-black text-white px-2 sm:px-8 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-yellow-400 mb-8 text-center">All Users</h1>
          {loading ? (
            <div className="text-yellow-300 text-center">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="text-gray-400 text-center">No users found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-zinc-900 border border-yellow-500/20 rounded-lg">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-yellow-300">Username</th>
                    <th className="px-4 py-2 text-left text-yellow-300">Email</th>
                    <th className="px-4 py-2 text-left text-yellow-300">Tier</th>
                    <th className="px-4 py-2 text-left text-yellow-300">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className={user.banned ? "bg-red-900/30" : ""}>
                      <td className="px-4 py-2">{user.username}</td>
                      <td className="px-4 py-2">{user.email}</td>
                      <td className="px-4 py-2">{user.tier || "Initiate"}</td>
                      <td className="px-4 py-2">
                        {user.banned ? (
                          <span className="text-red-400 font-bold">Banned</span>
                        ) : (
                          <span className="text-green-400">Active</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
