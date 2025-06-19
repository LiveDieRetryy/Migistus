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
  wallet?: number;
  guildCoins?: number;
};

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [giftUserId, setGiftUserId] = useState<number | null>(null);
  const [giftAmount, setGiftAmount] = useState<number>(0);
  const [giftStatus, setGiftStatus] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

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

  // Gift Guild Coins to a user
  const handleGiftCoins = async (userId: number) => {
    setGiftStatus("");
    if (!giftAmount || giftAmount <= 0) {
      setGiftStatus("Enter a valid amount.");
      return;
    }
    setUsers(users =>
      users.map(u =>
        u.id === userId
          ? { ...u, guildCoins: (u.guildCoins || 0) + giftAmount }
          : u
      )
    );
    // Safely get the user's current guildCoins value
    const userObj = users.find(u => u.id === userId);
    const currentGuildCoins = typeof userObj?.guildCoins === "number" ? userObj.guildCoins : 0;
    // Persist to backend
    await fetch(`/api/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guildCoins: currentGuildCoins + giftAmount }),
    });
    setGiftStatus("Gifted!");
    setTimeout(() => {
      setGiftUserId(null);
      setGiftAmount(0);
      setGiftStatus("");
    }, 1200);
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTierBadgeColor = (tier: string = "Initiate") => {
    switch (tier) {
      case "MIGISTUS": return "bg-yellow-500 text-black";
      case "Guild": return "bg-purple-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const getTierIcon = (tier: string = "Initiate") => {
    switch (tier) {
      case "MIGISTUS": return "👑";
      case "Guild": return "⚔️";
      default: return "🛡️";
    }
  };

  return (
    <DashboardLayout>
      <Head>
        <title>User Management - The King's Domain</title>
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 to-zinc-800 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="bg-zinc-900/50 backdrop-blur-sm border border-yellow-500/20 rounded-2xl p-6 mb-8 shadow-lg">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center text-2xl">
                  👥
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-yellow-400">User Management</h1>
                  <p className="text-gray-400">Manage users, tiers, and guild coins</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-64 px-4 py-2 bg-zinc-800 border border-yellow-500/30 rounded-lg text-white placeholder-gray-400 focus:border-yellow-400 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-gray-400">🔍</span>
                </div>
                <Link
                  href="/kingdom/enforcement-management"
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                  🚨 Enforcement
                </Link>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-white">{users.length}</div>
                <div className="text-sm text-gray-400">Total Users</div>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-yellow-400">{users.filter(u => u.tier === "MIGISTUS").length}</div>
                <div className="text-sm text-gray-400">MIGISTUS</div>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-purple-400">{users.filter(u => u.tier === "Guild").length}</div>
                <div className="text-sm text-gray-400">Guild</div>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-red-400">{users.filter(u => u.banned).length}</div>
                <div className="text-sm text-gray-400">Banned</div>
              </div>
            </div>
          </div>

          {/* Users Table */}
          {loading ? (
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-yellow-500/20 rounded-2xl p-12 text-center">
              <div className="text-yellow-400 text-xl">Loading users...</div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-yellow-500/20 rounded-2xl p-12 text-center">
              <div className="text-gray-400 text-xl">
                {searchTerm ? `No users found matching "${searchTerm}"` : "No users found"}
              </div>
            </div>
          ) : (
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-yellow-500/20 rounded-2xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-zinc-800/50 border-b border-yellow-500/20">
                    <tr>
                      <th className="px-6 py-4 text-left text-yellow-300 font-semibold">User</th>
                      <th className="px-6 py-4 text-left text-yellow-300 font-semibold">Tier</th>
                      <th className="px-6 py-4 text-left text-yellow-300 font-semibold">Wallet</th>
                      <th className="px-6 py-4 text-left text-yellow-300 font-semibold">Guild Coins</th>
                      <th className="px-6 py-4 text-left text-yellow-300 font-semibold">Status</th>
                      <th className="px-6 py-4 text-left text-yellow-300 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-700/50">
                    {filteredUsers.map(user => (
                      <tr key={user.id} className={`hover:bg-zinc-800/30 transition-colors ${user.banned ? "bg-red-900/20" : ""}`}>
                        {/* User Info */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-zinc-600 to-zinc-700 rounded-full flex items-center justify-center text-white font-bold">
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-white">{user.username}</div>
                              <div className="text-sm text-gray-400">{user.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Tier */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <select
                              value={user.tier || "Initiate"}
                              onChange={e => handleTierChange(user.id, e.target.value)}
                              className="bg-zinc-800 border border-yellow-500/30 rounded-lg px-3 py-2 text-yellow-300 focus:border-yellow-400 focus:outline-none"
                            >
                              {tierOptions.map(tier => (
                                <option key={tier} value={tier}>{tier}</option>
                              ))}
                            </select>
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${getTierBadgeColor(user.tier)}`}>
                              {getTierIcon(user.tier)} {user.tier || "Initiate"}
                            </span>
                          </div>
                        </td>

                        {/* Wallet */}
                        <td className="px-6 py-4">
                          <div className="text-green-400 font-semibold">
                            ${typeof user.wallet === "number" ? user.wallet.toFixed(2) : "0.00"}
                          </div>
                        </td>

                        {/* Guild Coins */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-yellow-400 font-semibold">
                              {typeof user.guildCoins === "number" ? user.guildCoins : 0}
                            </span>
                            <span className="text-lg">🪙</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${
                            user.banned 
                              ? "bg-red-900 text-red-300 border border-red-700" 
                              : "bg-green-900 text-green-300 border border-green-700"
                          }`}>
                            {user.banned ? "🚫 Banned" : "✅ Active"}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            {/* Ban/Unban */}
                            <button
                              onClick={() => handleBan(user.id)}
                              className={`px-3 py-1 rounded-lg font-semibold text-sm transition-colors ${
                                user.banned 
                                  ? "bg-green-600 hover:bg-green-500 text-white" 
                                  : "bg-red-600 hover:bg-red-500 text-white"
                              }`}
                            >
                              {user.banned ? "Unban" : "Ban"}
                            </button>

                            {/* Promote */}
                            <button
                              onClick={() => handlePromote(user.id)}
                              className="px-3 py-1 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black font-semibold text-sm transition-colors"
                            >
                              Promote
                            </button>

                            {/* Gift Coins */}
                            {giftUserId === user.id ? (
                              <div className="flex items-center gap-2 bg-zinc-800 rounded-lg p-2 border border-yellow-500/30">
                                <input
                                  type="number"
                                  min={1}
                                  value={giftAmount}
                                  onChange={e => setGiftAmount(Number(e.target.value))}
                                  className="w-16 px-2 py-1 rounded bg-zinc-700 border border-yellow-500/30 text-yellow-300 text-sm"
                                  placeholder="0"
                                />
                                <button
                                  onClick={() => handleGiftCoins(user.id)}
                                  className="px-2 py-1 rounded bg-green-500 hover:bg-green-400 text-black font-bold text-sm transition-colors"
                                >
                                  Send
                                </button>
                                <button
                                  onClick={() => setGiftUserId(null)}
                                  className="px-2 py-1 rounded bg-zinc-600 hover:bg-zinc-500 text-yellow-300 text-sm transition-colors"
                                >
                                  ✕
                                </button>
                                {giftStatus && (
                                  <span className={`text-sm font-semibold ${
                                    giftStatus === "Gifted!" ? "text-green-400" : "text-red-400"
                                  }`}>
                                    {giftStatus}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setGiftUserId(user.id);
                                  setGiftAmount(0);
                                  setGiftStatus("");
                                }}
                                className="px-3 py-1 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-black font-semibold text-sm transition-colors"
                              >
                                🪙 Gift
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
