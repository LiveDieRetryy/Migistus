import Head from "next/head";
import DashboardLayout from "@/components/DashboardLayout";
import { useEffect, useState } from "react";

type User = {
  id: number;
  username: string;
  email: string;
  banned?: boolean;
  bannedReason?: string;
  mutedUntil?: string | null;
  mutedReason?: string;
};

export default function EnforcementManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showBanModal, setShowBanModal] = useState<{ userId: number; username: string } | null>(null);
  const [showMuteModal, setShowMuteModal] = useState<{ userId: number; username: string } | null>(null);
  const [banReason, setBanReason] = useState('');
  const [muteReason, setMuteReason] = useState('');
  const [muteDuration, setMuteDuration] = useState(60); // minutes

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    fetch("/api/users")
      .then(res => res.json())
      .then(data => {
        setUsers(Array.isArray(data.users) ? data.users : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load users:', err);
        showNotification('Failed to load users', 'error');
        setLoading(false);
      });
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleBan = async (userId: number) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ban', reason: banReason })
      });

      const data = await response.json();
      
      if (response.ok) {
        showNotification(`User banned successfully`, 'success');
        setShowBanModal(null);
        setBanReason('');
        loadUsers(); // Reload users
      } else {
        showNotification(data.error || 'Failed to ban user', 'error');
      }
    } catch (error) {
      console.error('Ban error:', error);
      showNotification('Failed to ban user', 'error');
    }
  };

  const handleUnban = async (userId: number) => {
    if (!confirm('Are you sure you want to unban this user?')) return;

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unban' })
      });

      const data = await response.json();
      
      if (response.ok) {
        showNotification('User unbanned successfully', 'success');
        loadUsers(); // Reload users
      } else {
        showNotification(data.error || 'Failed to unban user', 'error');
      }
    } catch (error) {
      console.error('Unban error:', error);
      showNotification('Failed to unban user', 'error');
    }
  };

  const handleMute = async (userId: number) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'mute', 
          reason: muteReason,
          durationMinutes: muteDuration
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        showNotification(`User muted for ${muteDuration} minutes`, 'success');
        setShowMuteModal(null);
        setMuteReason('');
        setMuteDuration(60);
        loadUsers(); // Reload users
      } else {
        showNotification(data.error || 'Failed to mute user', 'error');
      }
    } catch (error) {
      console.error('Mute error:', error);
      showNotification('Failed to mute user', 'error');
    }
  };

  const handleUnmute = async (userId: number) => {
    if (!confirm('Are you sure you want to unmute this user?')) return;

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unmute' })
      });

      const data = await response.json();
      
      if (response.ok) {
        showNotification('User unmuted successfully', 'success');
        loadUsers(); // Reload users
      } else {
        showNotification(data.error || 'Failed to unmute user', 'error');
      }
    } catch (error) {
      console.error('Unmute error:', error);
      showNotification('Failed to unmute user', 'error');
    }
  };

  const bannedUsers = users.filter(u => u.banned);
  const mutedUsers = users.filter(u => u.mutedUntil && new Date(u.mutedUntil) > new Date());
  const activeUsers = users.filter(u => !u.banned && (!u.mutedUntil || new Date(u.mutedUntil) <= new Date()));

  return (
    <DashboardLayout>
      <Head>
        <title>Enforcement Management - The King's Domain</title>
      </Head>
      <div className="max-w-6xl mx-auto p-6">
        {/* Notification */}
        {notification && (
          <div className={`mb-6 p-4 rounded-lg ${
            notification.type === 'success' 
              ? 'bg-green-900/50 border border-green-500 text-green-200' 
              : 'bg-red-900/50 border border-red-500 text-red-200'
          }`}>
            {notification.message}
          </div>
        )}

        <h1 className="text-3xl font-bold text-red-400 mb-6">🚨 Enforcement Management</h1>

        {/* Active Users Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-blue-400 mb-4">Active Users ({activeUsers.length})</h2>
          {activeUsers.length === 0 ? (
            <div className="text-gray-400">No active users to moderate.</div>
          ) : (
            <div className="grid gap-3">
              {activeUsers.map(u => (
                <div key={u.id} className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white">{u.username}</span>
                    <span className="ml-2 text-xs text-zinc-400">{u.email}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="bg-red-600 text-white px-4 py-2 rounded font-semibold hover:bg-red-500 transition"
                      onClick={() => setShowBanModal({ userId: u.id, username: u.username })}
                    >
                      Ban User
                    </button>
                    <button
                      className="bg-yellow-600 text-white px-4 py-2 rounded font-semibold hover:bg-yellow-500 transition"
                      onClick={() => setShowMuteModal({ userId: u.id, username: u.username })}
                    >
                      Mute User
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Banned Users Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-red-400 mb-4">Banned Users ({bannedUsers.length})</h2>
          {bannedUsers.length === 0 ? (
            <div className="text-gray-400">No banned users.</div>
          ) : (
            <div className="space-y-3">
              {bannedUsers.map(u => (
                <div key={u.id} className="bg-zinc-900 border border-red-600/40 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div>
                        <span className="font-bold text-white">{u.username}</span>
                        <span className="ml-2 text-xs text-zinc-400">{u.email}</span>
                      </div>
                      {u.bannedReason && (
                        <div className="mt-2 text-sm text-red-300">
                          <strong>Reason:</strong> {u.bannedReason}
                        </div>
                      )}
                    </div>
                    <button
                      className="bg-green-600 text-white px-4 py-2 rounded font-semibold hover:bg-green-500 transition"
                      onClick={() => handleUnban(u.id)}
                    >
                      Unban
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Muted Users Section */}
        <div>
          <h2 className="text-xl font-semibold text-yellow-400 mb-4">Muted Users ({mutedUsers.length})</h2>
          {mutedUsers.length === 0 ? (
            <div className="text-gray-400">No muted users.</div>
          ) : (
            <div className="space-y-3">
              {mutedUsers.map(u => (
                <div key={u.id} className="bg-zinc-900 border border-yellow-600/40 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div>
                        <span className="font-bold text-white">{u.username}</span>
                        <span className="ml-2 text-xs text-zinc-400">{u.email}</span>
                        <span className="ml-2 text-xs text-yellow-300">
                          Until: {u.mutedUntil && new Date(u.mutedUntil).toLocaleString()}
                        </span>
                      </div>
                      {u.mutedReason && (
                        <div className="mt-2 text-sm text-yellow-300">
                          <strong>Reason:</strong> {u.mutedReason}
                        </div>
                      )}
                    </div>
                    <button
                      className="bg-green-600 text-white px-4 py-2 rounded font-semibold hover:bg-green-500 transition"
                      onClick={() => handleUnmute(u.id)}
                    >
                      Unmute
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ban Modal */}
        {showBanModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 border border-red-600 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-red-400 mb-4">Ban User: {showBanModal.username}</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Reason (optional)
                </label>
                <textarea
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white"
                  rows={3}
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="e.g., Spam, harassment, TOS violation..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded font-semibold hover:bg-red-500"
                  onClick={() => handleBan(showBanModal.userId)}
                >
                  Confirm Ban
                </button>
                <button
                  className="flex-1 bg-zinc-700 text-white px-4 py-2 rounded font-semibold hover:bg-zinc-600"
                  onClick={() => {
                    setShowBanModal(null);
                    setBanReason('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mute Modal */}
        {showMuteModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 border border-yellow-600 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-yellow-400 mb-4">Mute User: {showMuteModal.username}</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Duration (minutes)
                </label>
                <select
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white"
                  value={muteDuration}
                  onChange={(e) => setMuteDuration(parseInt(e.target.value))}
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={180}>3 hours</option>
                  <option value={360}>6 hours</option>
                  <option value={720}>12 hours</option>
                  <option value={1440}>24 hours</option>
                  <option value={4320}>3 days</option>
                  <option value={10080}>7 days</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Reason (optional)
                </label>
                <textarea
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white"
                  rows={3}
                  value={muteReason}
                  onChange={(e) => setMuteReason(e.target.value)}
                  placeholder="e.g., Excessive messaging, off-topic discussion..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  className="flex-1 bg-yellow-600 text-white px-4 py-2 rounded font-semibold hover:bg-yellow-500"
                  onClick={() => handleMute(showMuteModal.userId)}
                >
                  Confirm Mute
                </button>
                <button
                  className="flex-1 bg-zinc-700 text-white px-4 py-2 rounded font-semibold hover:bg-zinc-600"
                  onClick={() => {
                    setShowMuteModal(null);
                    setMuteReason('');
                    setMuteDuration(60);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}


// Disable footer for Kingdom pages
(EnforcementManagementPage as any).showFooter = false;