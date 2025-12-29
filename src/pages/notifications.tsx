// pages/notifications.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Bell, Check, CheckCheck, Trash2, Settings, Filter } from 'lucide-react';

interface Notification {
  id: string;
  userId: string;
  type: 'follow' | 'like' | 'comment' | 'mention' | 'product' | 'system';
  title: string;
  message: string;
  read: boolean;
  link?: string;
  imageUrl?: string;
  createdAt: string;
  actorId?: string;
  actorName?: string;
  actorAvatar?: string;
}

export default function NotificationsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [hasMore, setHasMore] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Account navigation items
  const getProfileSlug = () => {
    if (!user?.username) return "/account/profile";
    return `/account/profile/${user.username.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")}`;
  };

  const accountNav = [
    { label: "Account Overview", href: "/account", icon: "🏠" },
    { label: "Notifications", href: "/notifications", icon: "🔔" },
    { label: "My Current Pledges", href: "/account/pledges", icon: "🤝" },
    { label: "My Orders", href: "/account/orders", icon: "📦" },
    { label: "My Wishlist", href: "/account/wishlist", icon: "❤️" },
    { label: "My Votes", href: "/account/votes", icon: "🗳️" },
    { label: "Wallet", href: "/wallet", icon: "💰" },
    { label: "View Profile", href: getProfileSlug(), icon: "👤" },
    { label: "Account Settings", href: "/account/settings", icon: "⚙️" },
  ];

  // Fetch notifications
  const fetchNotifications = async (offset = 0, filterType: string = 'all', onlyUnread = false) => {
    if (!isAuthenticated) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '50',
        offset: offset.toString(),
        ...(onlyUnread && { unreadOnly: 'true' })
      });

      const response = await fetch(`/api/notifications?${params}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        let fetchedNotifications = data.notifications || [];

        // Filter by type if needed
        if (filterType !== 'all') {
          fetchedNotifications = fetchedNotifications.filter(
            (n: Notification) => n.type === filterType
          );
        }

        if (offset === 0) {
          setNotifications(fetchedNotifications);
        } else {
          setNotifications(prev => [...prev, ...fetchedNotifications]);
        }

        setHasMore(data.pagination?.hasMore || false);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notificationId })
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);

      await Promise.all(
        unreadIds.map(id =>
          fetch('/api/notifications/mark-read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ notificationId: id })
          })
        )
      );

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        selectedIds.delete(notificationId);
        setSelectedIds(new Set(selectedIds));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Delete selected notifications
  const deleteSelected = async () => {
    if (selectedIds.size === 0) return;

    try {
      await Promise.all(
        Array.from(selectedIds).map(id =>
          fetch(`/api/notifications/${id}`, {
            method: 'DELETE',
            credentials: 'include'
          })
        )
      );

      setNotifications(prev => prev.filter(n => !selectedIds.has(n.id)));
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Error deleting notifications:', error);
    }
  };

  // Toggle selection
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Select all
  const selectAll = () => {
    if (selectedIds.size === notifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(notifications.map(n => n.id)));
    }
  };

  // Fetch on mount and filter changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications(0, typeFilter, filter === 'unread');
    }
  }, [isAuthenticated, filter, typeFilter]);

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'follow':
        return '👤';
      case 'like':
        return '❤️';
      case 'comment':
        return '💬';
      case 'mention':
        return '📢';
      case 'product':
        return '🎁';
      case 'system':
        return '⚙️';
      default:
        return '🔔';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const typeOptions = [
    { value: 'all', label: 'All Types', icon: '📊' },
    { value: 'follow', label: 'Follows', icon: '👤' },
    { value: 'like', label: 'Likes', icon: '❤️' },
    { value: 'comment', label: 'Comments', icon: '💬' },
    { value: 'mention', label: 'Mentions', icon: '📢' },
    { value: 'product', label: 'Products', icon: '🎁' },
    { value: 'system', label: 'System', icon: '⚙️' }
  ];

  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-zinc-950 pt-32 pb-20">
          <div className="max-w-4xl mx-auto px-4">
            <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-12 text-center">
              <Bell className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
              <h2 className="text-2xl font-bold text-white mb-2">
                Sign in to view notifications
              </h2>
              <p className="text-zinc-400 mb-6">
                You need to be signed in to access your notifications
              </p>
              <Link
                href="/login"
                className="inline-block px-6 py-3 bg-yellow-400 text-black rounded-lg font-semibold hover:bg-yellow-300 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white pt-32 pb-20">
        <div className="flex flex-col lg:flex-row max-w-7xl mx-auto px-4 gap-8">
          
          {/* Back Link - Mobile */}
          <div className="lg:hidden mb-4">
            <Link href="/account" className="text-yellow-400 hover:text-yellow-300">
              ← Back to Account
            </Link>
          </div>

          {/* Sidebar */}
          <aside className="lg:w-80">
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-yellow-500/20 rounded-2xl p-6 sticky top-8">
              <div className="hidden lg:block mb-6">
                <Link href="/account" className="text-yellow-400 hover:text-yellow-300">
                  ← Back to Account
                </Link>
              </div>
              
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center text-2xl">
                  👤
                </div>
                <div>
                  <h2 className="text-xl font-bold text-yellow-400">
                    Account Menu
                  </h2>
                  <p className="text-sm text-gray-400">{user?.username}</p>
                </div>
              </div>
              
              <ul className="space-y-2">
                {accountNav.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        router.pathname === item.href
                          ? "bg-yellow-400 text-black font-semibold"
                          : "text-yellow-300 hover:bg-yellow-400/10 hover:text-yellow-400"
                      }`}
                    >
                      <span className="text-lg">{item.icon}</span>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-white mb-2">Notifications</h1>
              <p className="text-zinc-400">
                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
              </p>
            </div>

          {/* Filters & Actions */}
          <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4 mb-4">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              {/* Filter Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === 'all'
                      ? 'bg-yellow-400 text-black'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === 'unread'
                      ? 'bg-yellow-400 text-black'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  Unread {unreadCount > 0 && `(${unreadCount})`}
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {selectedIds.size > 0 && (
                  <button
                    onClick={deleteSelected}
                    className="flex items-center gap-2 px-4 py-2 bg-red-900/20 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete ({selectedIds.size})
                  </button>
                )}
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 rounded-lg transition-colors"
                  >
                    <CheckCheck className="w-4 h-4" />
                    Mark all read
                  </button>
                )}
                <Link
                  href="/account/settings?section=notifications"
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 rounded-lg transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
              </div>
            </div>

            {/* Type Filter */}
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
              {typeOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => setTypeFilter(option.value)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    typeFilter === option.value
                      ? 'bg-yellow-400 text-black'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  <span>{option.icon}</span>
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notifications List */}
          <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
            {loading && notifications.length === 0 ? (
              <div className="p-12 text-center">
                <div className="animate-spin w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-zinc-400">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-12 text-center">
                <Bell className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
                <p className="text-xl font-semibold text-white mb-2">
                  {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                </p>
                <p className="text-zinc-400">
                  {filter === 'unread'
                    ? "You're all caught up!"
                    : "We'll notify you when something happens"}
                </p>
              </div>
            ) : (
              <>
                {/* Select All */}
                {notifications.length > 0 && (
                  <div className="px-4 py-3 bg-zinc-950 border-b border-zinc-800 flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === notifications.length}
                      onChange={selectAll}
                      className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-yellow-400 focus:ring-yellow-400 focus:ring-offset-0"
                    />
                    <span className="text-sm text-zinc-400">
                      {selectedIds.size > 0
                        ? `${selectedIds.size} selected`
                        : 'Select all'}
                    </span>
                  </div>
                )}

                {/* Notifications */}
                <div className="divide-y divide-zinc-800">
                  {notifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`px-4 py-4 hover:bg-zinc-800/30 transition-colors ${
                        !notification.read ? 'bg-yellow-400/5' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        {/* Checkbox */}
                        <div className="flex-shrink-0 pt-1">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(notification.id)}
                            onChange={() => toggleSelect(notification.id)}
                            className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-yellow-400 focus:ring-yellow-400 focus:ring-offset-0"
                          />
                        </div>

                        {/* Icon/Avatar */}
                        <div className="flex-shrink-0">
                          {notification.actorAvatar ? (
                            <img
                              src={notification.actorAvatar}
                              alt={notification.actorName || 'User'}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-2xl">
                              {getNotificationIcon(notification.type)}
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div
                            className="cursor-pointer"
                            onClick={() => {
                              if (!notification.read) {
                                markAsRead(notification.id);
                              }
                              if (notification.link) {
                                window.location.href = notification.link;
                              }
                            }}
                          >
                            <p className="text-base font-semibold text-white mb-1">
                              {notification.title}
                            </p>
                            <p className="text-sm text-zinc-400 mb-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-zinc-500">
                              {formatTime(notification.createdAt)}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex-shrink-0 flex items-start gap-2">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
                              title="Mark as read"
                            >
                              <Check className="w-4 h-4 text-yellow-400" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>

                        {/* Unread Indicator */}
                        {!notification.read && (
                          <div className="flex-shrink-0">
                            <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Load More */}
                {hasMore && (
                  <div className="p-4 bg-zinc-950">
                    <button
                      onClick={() =>
                        fetchNotifications(notifications.length, typeFilter, filter === 'unread')
                      }
                      disabled={loading}
                      className="w-full px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Loading...' : 'Load more'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
          </main>
        </div>
      </div>
    </MainLayout>
  );
}
