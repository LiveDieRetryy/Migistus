import { useEffect, useState } from "react";
import Head from "next/head";
import DashboardLayout from "@/components/DashboardLayout";
import Link from "next/link";
import { userDataAggregator, ComprehensiveUserData } from '@/utils/userDataAggregator';
import { activityTracker } from "@/utils/activityTracker";

interface User {
  id: number;
  username: string;
  email: string;
  tier?: string;
  banned?: boolean;
  wallet?: number;
  guildCoins?: number;
  joinDate?: string;
  lastLogin?: string;
  mutedUntil?: string;
  totalPledges?: number;
  totalVotes?: number;
  currentPage?: string;
  isOnline?: boolean;
}

type FilterState = {
  tier: string;
  status: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  dateRange: string;
};

type BulkActionState = {
  selectedUsers: number[];
  action: string;
  isProcessing: boolean;
};

export default function UserManagementPage() {
  const [users, setUsers] = useState<ComprehensiveUserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Enhanced filtering state
  const [filters, setFilters] = useState<FilterState>({
    tier: 'all',
    status: 'all',
    sortBy: 'joinDate',
    sortOrder: 'desc',
    dateRange: 'all'
  });

  // Bulk actions state
  const [bulkActions, setBulkActions] = useState<BulkActionState>({
    selectedUsers: [],
    action: '',
    isProcessing: false
  });

  // Individual action states
  const [giftUserId, setGiftUserId] = useState<number | null>(null);
  const [giftAmount, setGiftAmount] = useState<number>(0);
  const [giftStatus, setGiftStatus] = useState<string>("");
  const [deleteConfirm, setDeleteConfirm] = useState<{userId: number, username: string} | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userDetailsModal, setUserDetailsModal] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<ComprehensiveUserData | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(20);

  // Analytics state
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    newUsersToday: 0,
    activeUsers: 0,
    bannedUsers: 0,
    totalWalletValue: 0,
    totalGuildCoins: 0,
    tierDistribution: { Initiate: 0, Guild: 0, MIGISTUS: 0 },
    totalSessions: 0,
    totalPageViews: 0,
    totalActivities: 0,
    averageEngagement: 0
  });

  interface LiveActivity {
    type: 'auth' | 'navigation' | 'pledge' | 'vote' | 'wallet' | 'profile' | 'chat' | 'search';
    action: string;
    timestamp: string;
    userId: number;
  }
  
  interface LiveSession {
    userId: number;
    isActive: boolean;
    loginTime: string;
    currentPage?: string;
  }
  
    // Live tracking data
    const [liveActivities, setLiveActivities] = useState<LiveActivity[]>([]);
    const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);

  useEffect(() => {
    loadUsers();
    loadLiveData();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(loadLiveData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    calculateAnalytics();
  }, [users]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Get comprehensive data from aggregator
      const comprehensiveUsers = await userDataAggregator.getAllUsersComprehensiveData(true);
      
      // If no comprehensive data, fall back to API
      if (comprehensiveUsers.length === 0) {
        interface UserApiResponse {
          users: User[];
        }
        const response = await fetch("/api/users");
        const data = await response.json() as UserApiResponse;
        const userList = Array.isArray(data.users) ? data.users : [];        // Convert basic users to comprehensive format
        const enhancedUsers = userList.map(user => ({
          ...user,
          tier: user.tier || 'Initiate', // Provide default tier if undefined
          banned: user.banned || false, // Provide default banned status if undefined
          wallet: user.wallet || 0, // Provide default wallet amount if undefined
          guildCoins: user.guildCoins || 0, // Provide default guild coins if undefined
          joinDate: user.joinDate || new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          lastLogin: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          totalPledges: Math.floor(Math.random() * 20),
          totalVotes: Math.floor(Math.random() * 50),
          // Add default comprehensive data fields
          totalDropsJoined: 0,
          totalSessions: 0,
          totalPageViews: 0,
          totalChatMessages: 0,
          isOnline: false,
          sessionDuration: 0,
          lastActivity: new Date().toISOString(),
          recentActivities: [],
          pledgeHistory: [],
          voteHistory: [],
          sessionHistory: [],
          walletTransactions: [],
          averageSessionDuration: 0,
          mostActiveHours: [],
          favoriteCategories: [],
          engagementScore: 0,
          badges: [],
          titles: [],
          warningCount: 0,
          moderationHistory: []
        }));
        
        setUsers(enhancedUsers as ComprehensiveUserData[]);
      } else {
        setUsers(comprehensiveUsers);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLiveData = async () => {
    // This is now handled by the aggregator
    // Just refresh the comprehensive data
    try {
      const refreshedUsers = await userDataAggregator.getAllUsersComprehensiveData(true);
      if (refreshedUsers.length > 0) {
        setUsers(refreshedUsers);
      }
    } catch (error) {
      console.error('Failed to refresh live data:', error);
    }
  };

  // Fix 1: Add type annotation for user parameter
  const enhanceUsersWithLiveData = (users: User[]): User[] => {
    return users.map((user: User) => {
      // Ensure liveActivities and liveSessions are arrays before filtering
      const userSessions = Array.isArray(liveSessions) ? liveSessions.filter((s: any) => s.userId === user.id) : [];
      const activeSession = userSessions.find((s: any) => s.isActive);
      const userActivities = Array.isArray(liveActivities) ? liveActivities.filter((a: any) => a.userId === user.id) : [];
      
      return {
        ...user,
        isOnline: !!activeSession,
        currentPage: activeSession?.currentPage,
        sessionDuration: activeSession ? 
          Math.round((Date.now() - new Date(activeSession.loginTime).getTime()) / 1000 / 60) : 0,
        totalSessions: userSessions.length,
        recentActivity: userActivities.slice(0, 5)
      };
    });
  };
  const calculateAnalytics = () => {
    const today = new Date().toISOString().split('T')[0];
    const analytics = {
      totalUsers: users.length,
      newUsersToday: users.filter(u => u.joinDate === today).length,
      activeUsers: users.filter(u => !u.banned).length,
      bannedUsers: users.filter(u => u.banned).length,
      totalWalletValue: users.reduce((sum, u) => sum + (u.wallet || 0), 0),
      totalGuildCoins: users.reduce((sum, u) => sum + (u.guildCoins || 0), 0),
      tierDistribution: {
        Initiate: users.filter(u => !u.tier || u.tier === 'Initiate').length,
        Guild: users.filter(u => u.tier === 'Guild').length,
        MIGISTUS: users.filter(u => u.tier === 'MIGISTUS').length
      },
      // Add new analytics from comprehensive data
      totalSessions: users.reduce((sum, u) => sum + ((u as any).totalSessions || 0), 0),
      totalPageViews: users.reduce((sum, u) => sum + ((u as any).totalPageViews || 0), 0),
      totalActivities: users.reduce((sum, u) => sum + ((u as any).recentActivities?.length || 0), 0),
      averageEngagement: users.length > 0 ? 
        users.reduce((sum, u) => sum + ((u as any).engagementScore || 0), 0) / users.length : 0
    };
    setAnalytics(analytics);
  };

  // Enhanced filtering and sorting
  const getFilteredUsers = () => {
    let filtered = enhanceUsersWithLiveData(users).filter(user => {
      const matchesSearch = ((user.username ?? '').toLowerCase()).includes((searchTerm || '').toLowerCase()) ||
                           ((user.email ?? '').toLowerCase()).includes((searchTerm || '').toLowerCase());
      
      const matchesTier = filters.tier === 'all' || user.tier === filters.tier || 
                         (filters.tier === 'Initiate' && !user.tier);
      
      const matchesStatus = filters.status === 'all' ||
                           (filters.status === 'active' && !user.banned) ||
                           (filters.status === 'banned' && user.banned) ||
                           (filters.status === 'muted' && user.mutedUntil);

      const matchesDateRange = filters.dateRange === 'all' || (() => {
        const joinDate = new Date(user.joinDate || '');
        const now = new Date();
        switch (filters.dateRange) {
          case 'today': return joinDate.toDateString() === now.toDateString();
          case 'week': return (now.getTime() - joinDate.getTime()) <= 7 * 24 * 60 * 60 * 1000;
          case 'month': return (now.getTime() - joinDate.getTime()) <= 30 * 24 * 60 * 60 * 1000;
          default: return true;
        }
      })();

      return matchesSearch && matchesTier && matchesStatus && matchesDateRange;
    });

    // Sort users
    filtered.sort((a, b) => {
      let aVal: string | number | Date;
      let bVal: string | number | Date;
      switch (filters.sortBy) {
        case 'username': aVal = a.username; bVal = b.username; break;
        case 'email': aVal = a.email; bVal = b.email; break;
        case 'tier': aVal = a.tier || 'Initiate'; bVal = b.tier || 'Initiate'; break;
        case 'wallet': aVal = a.wallet || 0; bVal = b.wallet || 0; break;
        case 'guildCoins': aVal = a.guildCoins || 0; bVal = b.guildCoins || 0; break;
        case 'joinDate': aVal = new Date(a.joinDate || ''); bVal = new Date(b.joinDate || ''); break;
        case 'lastLogin': aVal = new Date(a.lastLogin || ''); bVal = new Date(b.lastLogin || ''); break;
        default: aVal = a.id; bVal = b.id;
      }
      
      // Fix: Only use arithmetic for numbers
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return filters.sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      // Fix: Only use getTime for Date objects
      if (aVal instanceof Date && bVal instanceof Date) {
        return filters.sortOrder === 'asc'
          ? aVal.getTime() - bVal.getTime()
          : bVal.getTime() - aVal.getTime();
      }
      // Fix: Always convert to string before localeCompare
      const aStr = aVal instanceof Date ? aVal.toISOString() : String(aVal);
      const bStr = bVal instanceof Date ? bVal.toISOString() : String(bVal);
      return filters.sortOrder === 'asc'
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });

    return filtered;
  };

  // Pagination
  const filteredUsers = getFilteredUsers();
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  // Bulk action handlers
  const handleSelectAll = (checked: boolean) => {
    setBulkActions(prev => ({
      ...prev,
      selectedUsers: checked ? paginatedUsers.map(u => u.id) : []
    }));
  };

  const handleSelectUser = (userId: number, checked: boolean) => {
    setBulkActions(prev => ({
      ...prev,
      selectedUsers: checked 
        ? [...prev.selectedUsers, userId]
        : prev.selectedUsers.filter(id => id !== userId)
    }));
  };

  const handleBulkAction = async () => {
    if (!bulkActions.action || bulkActions.selectedUsers.length === 0) return;
    
    setBulkActions(prev => ({ ...prev, isProcessing: true }));
    
    try {
      const promises = bulkActions.selectedUsers.map(userId => {
        switch (bulkActions.action) {
          case 'ban':
            return fetch(`/api/users/${userId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ banned: true }),
            });
          case 'unban':
            return fetch(`/api/users/${userId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ banned: false }),
            });
          case 'promote-guild':
            return fetch(`/api/users/${userId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ tier: 'Guild' }),
            });
          case 'demote-initiate':
            return fetch(`/api/users/${userId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ tier: 'Initiate' }),
            });
          default:
            return Promise.resolve();
        }
      });
      
      await Promise.all(promises);
      
      // Update local state
      setUsers(users => users.map(user => {
        if (bulkActions.selectedUsers.includes(user.id)) {
          switch (bulkActions.action) {
            case 'ban': return { ...user, banned: true };
            case 'unban': return { ...user, banned: false };
            case 'promote-guild': return { ...user, tier: 'Guild' };
            case 'demote-initiate': return { ...user, tier: 'Initiate' };
            default: return user;
          }
        }
        return user;
      }));
      
      setBulkActions({ selectedUsers: [], action: '', isProcessing: false });
    } catch (error) {
      console.error('Bulk action failed:', error);
      setBulkActions(prev => ({ ...prev, isProcessing: false }));
    }
  };

  // Individual action handlers (keeping existing functionality)
  const handleBan = async (id: number) => {
    const user = users.find(u => u.id === id);
    const newBanned = !user?.banned;
    
    setUsers(users => users.map(u => u.id === id ? { ...u, banned: newBanned } : u));
    
    await fetch(`/api/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ banned: newBanned }),
    });
  };

  const handleTierChange = async (id: number, newTier: string) => {
    setUsers(users => users.map(u => u.id === id ? { ...u, tier: newTier } : u));
    
    await fetch(`/api/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier: newTier }),
    });
  };

  const handleGiftCoins = async (userId: number) => {
    setGiftStatus("");
    if (!giftAmount || giftAmount <= 0) {
      setGiftStatus("Enter a valid amount.");
      return;
    }
    
    const userObj = users.find(u => u.id === userId);
    const currentGuildCoins = userObj?.guildCoins || 0;
    const newAmount = currentGuildCoins + giftAmount;
    
    setUsers(users => users.map(u => 
      u.id === userId ? { ...u, guildCoins: newAmount } : u
    ));
    
    await fetch(`/api/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guildCoins: newAmount }),
    });
    
    setGiftStatus("Gifted!");
    setTimeout(() => {
      setGiftUserId(null);
      setGiftAmount(0);
      setGiftStatus("");
    }, 1200);
  };

  const handleDeleteUser = async (userId: number, username: string) => {
    setDeleteConfirm({ userId, username });
  };

  const confirmDeleteUser = async () => {
    if (!deleteConfirm) return;
    
    const { userId, username } = deleteConfirm;
    setDeleting(userId);
    
    try {
      const response = await fetch(`/api/users/${userId}`, { method: "DELETE" });
      
      if (!response.ok) {
        throw new Error("Failed to delete user from backend");
      }
      
      setUsers(users => users.filter(u => u.id !== userId));
      
      // Cleanup localStorage
      const sessionData = localStorage.getItem('userSession');
      if (sessionData) {
        const session = JSON.parse(sessionData);
        if (session.user && session.user.id === userId) {
          localStorage.removeItem('userSession');
          localStorage.removeItem('currentUserId');
        }
      }
      
      const userRegistry = JSON.parse(localStorage.getItem('migistus_user_registry') || '{}');
      Object.keys(userRegistry).forEach(email => {
        if (userRegistry[email].id === userId) {
          delete userRegistry[email];
        }
      });
      localStorage.setItem('migistus_user_registry', JSON.stringify(userRegistry));
      
      const keysToRemove = Object.keys(localStorage).filter(key => 
        key.startsWith(`user_${userId}_`) || 
        key === `userProfile_${userId}` ||
        key.includes(`_${userId}_`) ||
        key.endsWith(`_${userId}`)
      );
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert(`Failed to delete user ${username}. Please try again.`);
    } finally {
      setDeleting(null);
    }
  };
  const handleUserClick = (user: ComprehensiveUserData) => {
    // Track admin viewing user details
    activityTracker.trackAdminAction("view_user_details", {
      targetUserId: user.id,
      targetUsername: user.username,
      userTier: user.tier,
      isOnline: user.isOnline,
      action: "open_user_modal"
    });
    
    setSelectedUser(user);
  };

  const handleUserUpdate = (updatedUser: ComprehensiveUserData) => {
    setUsers(users => users.map(u => u.id === updatedUser.id ? updatedUser : u));
    setSelectedUser(updatedUser);
  };

  const handleUserDelete = async (userId: number) => {
    try {
      const response = await fetch(`/api/users/${userId}`, { method: "DELETE" });
      
      if (!response.ok) {
        throw new Error("Failed to delete user from backend");
      }
      
      setUsers(users => users.filter(u => u.id !== userId));
      setSelectedUser(null);
      
      // Cleanup localStorage
      const sessionData = localStorage.getItem('userSession');
      if (sessionData) {
        const session = JSON.parse(sessionData);
        if (session.user && session.user.id === userId) {
          localStorage.removeItem('userSession');
          localStorage.removeItem('currentUserId');
        }
      }
      
      const userRegistry = JSON.parse(localStorage.getItem('migistus_user_registry') || '{}');
      Object.keys(userRegistry).forEach(email => {
        if (userRegistry[email].id === userId) {
          delete userRegistry[email];
        }
      });
      localStorage.setItem('migistus_user_registry', JSON.stringify(userRegistry));
      
      const keysToRemove = Object.keys(localStorage).filter(key => 
        key.startsWith(`user_${userId}_`) || 
        key === `userProfile_${userId}` ||
        key.includes(`_${userId}_`) ||
        key.endsWith(`_${userId}`)
      );
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user. Please try again.');
    }
  };

  const tierOptions = ["Initiate", "Guild", "MIGISTUS"];
  
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const isUserSelected = (userId: number) => bulkActions.selectedUsers.includes(userId);

  return (
    <DashboardLayout>
      <Head>
        <title>User Management - The King's Domain</title>
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 to-zinc-800 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Header Section */}
          <div className="bg-zinc-900/50 backdrop-blur-sm border border-yellow-500/20 rounded-2xl p-6 shadow-lg">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center text-2xl">
                  👥
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-yellow-400">User Management</h1>
                  <p className="text-gray-400">Click on any user to manage their account</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/kingdom/enforcement-management"
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                  🚨 Enforcement
                </Link>
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                  🔧 Filters
                </button>
              </div>
            </div>

            {/* Enhanced Analytics Dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-10 gap-4">
              <div className="bg-zinc-800/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white">{analytics.totalUsers}</div>
                <div className="text-sm text-gray-400">Total Users</div>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400">
                  {users.filter(u => u.isOnline).length}
                </div>
                <div className="text-sm text-gray-400">Online Now</div>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{analytics.activeUsers}</div>
                <div className="text-sm text-gray-400">Active</div>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-400">{analytics.bannedUsers}</div>
                <div className="text-sm text-gray-400">Banned</div>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400">${analytics.totalWalletValue.toFixed(0)}</div>
                <div className="text-sm text-gray-400">Total Wallet</div>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-400">{analytics.totalGuildCoins}</div>
                <div className="text-sm text-gray-400">Guild Coins</div>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">{analytics.totalSessions}</div>
                <div className="text-sm text-gray-400">Total Sessions</div>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-cyan-400">{analytics.totalPageViews}</div>
                <div className="text-sm text-gray-400">Page Views</div>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-400">{Math.round(analytics.averageEngagement)}</div>
                <div className="text-sm text-gray-400">Avg Engagement</div>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-4 text-center">
                <div className="text-lg font-bold text-yellow-400">{analytics.tierDistribution.MIGISTUS}</div>
                <div className="text-lg font-bold text-purple-400">{analytics.tierDistribution.Guild}</div>
                <div className="text-sm text-gray-400">Elite/Guild</div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-zinc-900/50 backdrop-blur-sm border border-yellow-500/20 rounded-2xl p-6">
            <div className="flex flex-col lg:flex-row gap-4 mb-4">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search users by username or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 pl-10 bg-zinc-800 border border-yellow-500/30 rounded-lg text-white placeholder-gray-400 focus:border-yellow-400 focus:outline-none"
                  />
                  <span className="absolute left-3 top-3.5 text-gray-400">🔍</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <select
                  value={filters.tier}
                  onChange={(e) => setFilters(prev => ({ ...prev, tier: e.target.value }))
                  }
                  className="px-4 py-3 bg-zinc-800 border border-yellow-500/30 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                >
                  <option value="all">All Tiers</option>
                  <option value="MIGISTUS">MIGISTUS</option>
                  <option value="Guild">Guild</option>
                  <option value="Initiate">Initiate</option>
                </select>
                
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))
                  }
                  className="px-4 py-3 bg-zinc-800 border border-yellow-500/30 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="banned">Banned</option>
                  <option value="muted">Muted</option>
                </select>
              </div>
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="border-t border-zinc-700 pt-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Sort By</label>
                    <select
                      value={filters.sortBy}
                      onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))
                      }
                      className="w-full px-3 py-2 bg-zinc-800 border border-yellow-500/30 rounded-lg text-white text-sm"
                    >
                      <option value="joinDate">Join Date</option>
                      <option value="lastLogin">Last Login</option>
                      <option value="username">Username</option>
                      <option value="email">Email</option>
                      <option value="tier">Tier</option>
                      <option value="wallet">Wallet</option>
                      <option value="guildCoins">Guild Coins</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Order</label>
                    <select
                      value={filters.sortOrder}
                      onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value as 'asc' | 'desc' }))
                      }
                      className="w-full px-3 py-2 bg-zinc-800 border border-yellow-500/30 rounded-lg text-white text-sm"
                    >
                      <option value="desc">Descending</option>
                      <option value="asc">Ascending</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Join Date</label>
                    <select
                      value={filters.dateRange}
                      onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))
                      }
                      className="w-full px-3 py-2 bg-zinc-800 border border-yellow-500/30 rounded-lg text-white text-sm"
                    >
                      <option value="all">All Time</option>
                      <option value="today">Today</option>
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Per Page</label>
                    <div className="text-sm text-gray-300 pt-2">{usersPerPage} users</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bulk Actions */}
          {bulkActions.selectedUsers.length > 0 && (
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-yellow-500/20 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div className="text-yellow-400 font-semibold">
                  {bulkActions.selectedUsers.length} user(s) selected
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={bulkActions.action}
                    onChange={(e) => setBulkActions(prev => ({ ...prev, action: e.target.value }))
                    }
                    className="px-3 py-2 bg-zinc-800 border border-yellow-500/30 rounded-lg text-white text-sm"
                  >
                    <option value="">Select Action</option>
                    <option value="ban">Ban Users</option>
                    <option value="unban">Unban Users</option>
                    <option value="promote-guild">Promote to Guild</option>
                    <option value="demote-initiate">Demote to Initiate</option>
                  </select>
                  <button
                    onClick={handleBulkAction}
                    disabled={!bulkActions.action || bulkActions.isProcessing}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-colors text-sm"
                  >
                    {bulkActions.isProcessing ? 'Processing...' : 'Apply'}
                  </button>
                  <button
                    onClick={() => setBulkActions({ selectedUsers: [], action: '', isProcessing: false })}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-lg transition-colors text-sm"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Users Table */}
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
                      <th className="px-4 py-4 text-left">
                        <input
                          type="checkbox"
                          checked={bulkActions.selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="w-4 h-4 accent-yellow-400"
                        />
                      </th>
                      <th className="px-6 py-4 text-left text-yellow-300 font-semibold">User</th>
                      <th className="px-6 py-4 text-left text-yellow-300 font-semibold">Tier</th>
                      <th className="px-6 py-4 text-left text-yellow-300 font-semibold">Status</th>
                      <th className="px-6 py-4 text-left text-yellow-300 font-semibold">Live Activity</th>
                      <th className="px-6 py-4 text-left text-yellow-300 font-semibold">Session</th>
                      <th className="px-6 py-4 text-left text-yellow-300 font-semibold">Join Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-700/50">
                    {paginatedUsers.map(user => (
                      <tr 
                        key={user.id} 
                        onClick={() => handleUserClick(user as ComprehensiveUserData)}
                        className={`hover:bg-zinc-800/50 transition-colors cursor-pointer ${
                          user.banned ? "bg-red-900/10" : ""
                        } ${isUserSelected(user.id) ? "bg-blue-900/20" : ""} ${
                          user.isOnline ? "border-l-4 border-green-400" : ""
                        }`}
                      >
                        {/* Select Checkbox */}
                        <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isUserSelected(user.id)}
                            onChange={(e) => handleSelectUser(user.id, e.target.checked)}
                            className="w-4 h-4 accent-yellow-400"
                          />
                        </td>

                        {/* User Info */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-10 h-10 bg-gradient-to-r from-zinc-600 to-zinc-700 rounded-full flex items-center justify-center text-white font-bold">
                                {user.username.charAt(0).toUpperCase()}
                              </div>
                              {user.isOnline && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border border-zinc-900 rounded-full animate-pulse"></div>
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-white">{user.username}</div>
                              <div className="text-sm text-gray-400">{user.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Tier */}
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${getTierBadgeColor(user.tier)}`}>
                            {getTierIcon(user.tier)} {user.tier || "Initiate"}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${
                                user.isOnline ? 'bg-green-400' : 
                                user.banned ? 'bg-red-400' : 'bg-gray-400'
                              }`}></span>
                              <span className={`text-sm font-medium ${
                                user.isOnline ? 'text-green-300' :
                                user.banned ? 'text-red-300' : 'text-gray-300'
                              }`}>
                                {user.isOnline ? 'Online' : user.banned ? 'Banned' : 'Offline'}
                              </span>
                            </div>
                            {user.mutedUntil && (
                              <span className="text-xs text-orange-400">Muted</span>
                            )}
                          </div>
                        </td>

                        {/* Enhanced Live Activity */}
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            {user.isOnline ? (
                              <div>
                                <div className="text-blue-400 font-medium">
                                  {user.currentPage || '/'}
                                </div>
                                <div className="text-gray-400">
                                  Active for {(user as any).sessionDuration || 0}m
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="text-blue-400">{user.totalPledges || 0} pledges</div>
                                <div className="text-purple-400">{user.totalVotes || 0} votes</div>
                                <div className="text-orange-400">Score: {Math.round((user as any).engagementScore || 0)}</div>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Enhanced Session Info */}
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-400">                            <div>Sessions: {(user as any).totalSessions || 0}</div>
                            <div>Avg: {Math.round((user as any).averageSessionDuration || 0)}m</div>
                            <div>Views: {(user as any).totalPageViews || 0}</div>
                          </div>
                        </td>

                        {/* Join Date */}
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-400">{formatDate(user.joinDate)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-zinc-800/50 px-6 py-4 border-t border-zinc-700">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-400">
                      Showing {((currentPage - 1) * usersPerPage) + 1} to {Math.min(currentPage * usersPerPage, filteredUsers.length)} of {filteredUsers.length} users
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-2 bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 disabled:opacity-50 text-white rounded transition-colors"
                      >
                        Previous
                      </button>
                      <span className="px-3 py-2 text-yellow-400 font-semibold">
                        {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 disabled:opacity-50 text-white rounded transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Enhanced User Management Modal with Comprehensive Data */}
        {selectedUser && (
                  <UserManagementModal
                    user={selectedUser}
                    onClose={() => setSelectedUser(null)}
                    onUpdate={handleUserUpdate}
                    onDelete={handleUserDelete}
                    liveActivities={liveActivities || []}
                    liveSessions={liveSessions || []}
                  />
                )}
      </div>
    </DashboardLayout>
  );
}

// Enhanced User Management Modal
function UserManagementModal({ 
  user, 
  onClose, 
  onUpdate, 
  onDelete,
  liveActivities = [],
  liveSessions = []
}: {
  user: ComprehensiveUserData;
  onClose: () => void;
  onUpdate: (user: ComprehensiveUserData) => void;
  onDelete: (userId: number) => void;  liveActivities?: any[];
  liveSessions?: any[];
}) {
  const [editedUser, setEditedUser] = useState<User>(user);
  const [saving, setSaving] = useState(false);
  const [giftAmount, setGiftAmount] = useState(0);
  const [giftStatus, setGiftStatus] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const tierOptions = ["Initiate", "Guild", "MIGISTUS"];

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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };
  const handleSave = async () => {
    setSaving(true);
    
    // Track admin user modification
    activityTracker.trackAdminAction("user_modification", {
      targetUserId: editedUser.id,
      targetUsername: editedUser.username,
      modifications: {
        tier: editedUser.tier,
        banned: editedUser.banned,
        wallet: editedUser.wallet,
        guildCoins: editedUser.guildCoins,
        email: editedUser.email,
        mutedUntil: editedUser.mutedUntil
      },
      action: "save_user_changes"
    });

    try {
      await fetch(`/api/users/${editedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editedUser),
      });
      onUpdate(editedUser as ComprehensiveUserData);
      
      // Track successful save
      activityTracker.trackAdminAction("user_modification_success", {
        targetUserId: editedUser.id,
        targetUsername: editedUser.username
      });
      
    } catch (error) {
      console.error('Failed to update user:', error);
      alert('Failed to update user. Please try again.');
      
      // Track failed save
      activityTracker.trackAdminAction("user_modification_failed", {
        targetUserId: editedUser.id,
        targetUsername: editedUser.username,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setSaving(false);
    }
  };
  const handleGiftCoins = async () => {
    setGiftStatus("");
    if (!giftAmount || giftAmount <= 0) {
      setGiftStatus("Enter a valid amount.");
      return;
    }

    const newAmount = (editedUser.guildCoins || 0) + giftAmount;
    const updatedUser = { ...editedUser, guildCoins: newAmount };
    
    try {
      // Track admin action before executing
      activityTracker.trackAdminAction("gift_coins", {
        targetUserId: editedUser.id,
        targetUsername: editedUser.username,
        amount: giftAmount,
        newTotal: newAmount,
        action: "gift_guild_coins"
      });

      await fetch(`/api/users/${editedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildCoins: newAmount }),
      });
      
      setEditedUser(updatedUser);
      onUpdate(updatedUser as ComprehensiveUserData);
      setGiftStatus("Gifted!");
      setGiftAmount(0);
      
      // Track successful completion
      activityTracker.trackAdminAction("gift_coins_success", {
        targetUserId: editedUser.id,
        targetUsername: editedUser.username,
        amount: giftAmount,
        newTotal: newAmount
      });
      
      setTimeout(() => setGiftStatus(""), 2000);
    } catch (error) {
      setGiftStatus("Failed to gift coins.");
      
      // Track failed action
      activityTracker.trackAdminAction("gift_coins_failed", {
        targetUserId: editedUser.id,
        targetUsername: editedUser.username,
        amount: giftAmount,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };
  const handleDelete = async () => {
    setDeleting(true);
    
    // Track admin user deletion
    activityTracker.trackAdminAction("user_deletion", {
      targetUserId: editedUser.id,
      targetUsername: editedUser.username,
      action: "delete_user_account",
      userTier: editedUser.tier,
      reason: "admin_action"
    });

    try {
      await onDelete(editedUser.id);
      
      // Track successful deletion
      activityTracker.trackAdminAction("user_deletion_success", {
        targetUserId: editedUser.id,
        targetUsername: editedUser.username
      });
      
      onClose();
    } catch (error) {
      setDeleting(false);
      
      // Track failed deletion
      activityTracker.trackAdminAction("user_deletion_failed", {
        targetUserId: editedUser.id,
        targetUsername: editedUser.username,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-xl border border-yellow-500/30 w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-zinc-600 to-zinc-700 rounded-full flex items-center justify-center text-white font-bold text-xl">
              {editedUser.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-yellow-400">{editedUser.username}</h2>
              <p className="text-gray-400">User ID: {editedUser.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Basic Information */}
            <div className="space-y-6">
              <div className="bg-zinc-800/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-400 mb-4">Basic Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Username</label>
                    <input
                      type="text"
                      value={editedUser.username}
                      onChange={(e) => setEditedUser(prev => ({ ...prev, username: e.target.value }))
                      }
                      className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Email</label>
                    <input
                      type="email"
                      value={editedUser.email}
                      onChange={(e) => setEditedUser(prev => ({ ...prev, email: e.target.value }))
                      }
                      className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Tier</label>
                    <div className="flex items-center gap-3">
                      <select
                        value={editedUser.tier || "Initiate"}
                        onChange={(e) => setEditedUser(prev => ({ ...prev, tier: e.target.value }))
                        }
                        className="flex-1 px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                      >
                        {tierOptions.map(tier => (
                          <option key={tier} value={tier}>{tier}</option>
                        ))}
                      </select>
                      <span className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold ${getTierBadgeColor(editedUser.tier)}`}>
                        {getTierIcon(editedUser.tier)} {editedUser.tier || "Initiate"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Status */}
              <div className="bg-zinc-800/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-400 mb-4">Account Status</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-400">Account Status</label>
                    <button
                      onClick={() => setEditedUser(prev => ({ ...prev, banned: !prev.banned }))
                      }
                      className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                        editedUser.banned 
                          ? "bg-red-600 hover:bg-red-500 text-white" 
                          : "bg-green-600 hover:bg-green-500 text-white"
                      }`}
                    >
                      {editedUser.banned ? "🚫 Banned" : "✅ Active"}
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Muted Until</label>
                    <input
                      type="datetime-local"
                      value={editedUser.mutedUntil || ""}
                      onChange={(e) => setEditedUser(prev => ({ ...prev, mutedUntil: e.target.value }))
                      }
                      className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:border-yellow-400 focus:outline-none text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Dangerous Actions */}
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-400 mb-4">Dangerous Actions</h3>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full px-4 py-3 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition-colors"
                >
                  🗑️ Delete Account Permanently
                </button>
                <p className="text-xs text-red-300 mt-2">This action cannot be undone and will remove all user data.</p>
              </div>
            </div>

            {/* Live Tracking Data */}
            <div className="space-y-6">
              {/* Live Session Info */}
              <div className="bg-zinc-800/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-400 mb-4">Live Session</h3>
                {user.isOnline ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-green-400 font-semibold">Online Now</span>
                    </div>
                    <div className="text-sm text-gray-300">
                      <div>Current Page: <span className="text-blue-400">{user.currentPage}</span></div>
                      <div>Session Duration: <span className="text-yellow-400">{user.sessionDuration}m</span></div>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-400">User is offline</div>
                )}
              </div>

              {/* Recent Activity */}
              <div className="bg-zinc-800/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-400 mb-4">Recent Activity</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {Array.isArray(liveActivities) && liveActivities.slice(0, 10).map((activity, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 bg-zinc-700/50 rounded">
                      <div className="text-lg">
                        {activity.type === 'auth' && '🔑'}
                        {activity.type === 'navigation' && '📄'}
                        {activity.type === 'pledge' && '🤝'}
                        {activity.type === 'vote' && '🗳️'}
                        {activity.type === 'wallet' && '💰'}
                        {activity.type === 'profile' && '👤'}
                        {activity.type === 'chat' && '💬'}
                        {activity.type === 'search' && '🔍'}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-white font-medium">
                          {activity.action}
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(activity.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!Array.isArray(liveActivities) || liveActivities.length === 0) && (
                    <div className="text-gray-400 text-center">No recent activity</div>
                  )}
                </div>
              </div>

              {/* Session History */}
              <div className="bg-zinc-800/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-400 mb-4">Session History</h3>
                <div className="space-y-2">
                  <div className="text-sm text-gray-300">
                    Total Sessions: <span className="text-white">{Array.isArray(liveSessions) ? liveSessions.length : 0}</span>
                  </div>
                  <div className="text-sm text-gray-300">
                    Active Sessions: <span className="text-green-400">{Array.isArray(liveSessions) ? liveSessions.filter(s => s.isActive).length : 0}</span>
                  </div>
                  <div className="text-sm text-gray-300">
                    Last Login: <span className="text-white">{formatDate(user.lastLogin)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial & Activity */}
            <div className="space-y-6">
              {/* Wallet & Coins */}
              <div className="bg-zinc-800/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-400 mb-4">Financial Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Wallet Balance ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editedUser.wallet || 0}
                      onChange={(e) => setEditedUser(prev => ({ ...prev, wallet: parseFloat(e.target.value) || 0 }))
                      }
                      className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Guild Coins</label>
                    <input
                      type="number"
                      value={editedUser.guildCoins || 0}
                      onChange={(e) => setEditedUser(prev => ({ ...prev, guildCoins: parseInt(e.target.value) || 0 }))
                      }
                      className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                    />
                  </div>
                  
                  {/* Gift Coins */}
                  <div className="border-t border-zinc-700 pt-4">
                    <label className="block text-sm text-gray-400 mb-2">Gift Guild Coins</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="1"
                        value={giftAmount}
                        onChange={(e) => setGiftAmount(parseInt(e.target.value) || 0)}
                        placeholder="Amount to gift"
                        className="flex-1 px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                      />
                      <button
                        onClick={handleGiftCoins}
                        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-black font-semibold rounded-lg transition-colors"
                      >
                        🪙 Gift
                      </button>
                    </div>
                    {giftStatus && (
                      <p className={`text-sm mt-2 ${giftStatus === "Gifted!" ? "text-green-400" : "text-red-400"}`}>
                        {giftStatus}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Activity Stats */}
              <div className="bg-zinc-800/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-400 mb-4">Activity Statistics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">{editedUser.totalPledges || 0}</div>
                    <div className="text-sm text-gray-400">Total Pledges</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">{editedUser.totalVotes || 0}</div>
                    <div className="text-sm text-gray-400">Total Votes</div>
                  </div>
                </div>
              </div>

              {/* Account Dates */}
              <div className="bg-zinc-800/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-400 mb-4">Account Timeline</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Join Date:</span>
                    <span className="text-white">{formatDate(editedUser.joinDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Last Login:</span>
                    <span className="text-white">{formatDate(editedUser.lastLogin)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-zinc-700">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-zinc-700 hover:bg-zinc-600 text-white font-semibold rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-zinc-800 rounded-xl p-6 border border-red-500/30 w-full max-w-md">
              <div className="text-center">
                <div className="text-6xl mb-4">⚠️</div>
                <h3 className="text-xl font-bold text-red-400 mb-4">Delete Account</h3>
                <p className="text-gray-300 mb-2">
                  Are you sure you want to permanently delete:
                </p>
                <p className="text-yellow-400 font-bold text-lg mb-6">
                  {editedUser.username}
                </p>
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 mb-6">
                  <p className="text-red-300 text-sm">
                    <strong>This action cannot be undone!</strong><br/>
                    All user data will be permanently removed.
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-4 py-2 bg-zinc-600 hover:bg-zinc-500 text-white font-semibold rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-red-800 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
                  >
                    {deleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
