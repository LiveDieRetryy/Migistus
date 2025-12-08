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
  password?: string;
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
      console.log(`🔧 Performing bulk action '${bulkActions.action}' on ${bulkActions.selectedUsers.length} users`);
      
      const promises = bulkActions.selectedUsers.map(async userId => {
        let updateData = {};
        
        switch (bulkActions.action) {
          case 'ban':
            updateData = { banned: true };
            break;
          case 'unban':
            updateData = { banned: false };
            break;
          case 'promote-guild':
            updateData = { tier: 'Guild' };
            break;
          case 'demote-initiate':
            updateData = { tier: 'Initiate' };
            break;
          default:
            return { success: false, userId };
        }
        
        const response = await fetch(`/api/users/${userId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        });
        
        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          console.error(`❌ Failed to update user ${userId}:`, error);
          return { success: false, userId, error };
        }
        
        return { success: true, userId };
      });
      
      const results = await Promise.all(promises);
      const failures = results.filter(r => !r.success);
      
      if (failures.length > 0) {
        console.warn(`⚠️ ${failures.length} bulk actions failed:`, failures);
        alert(`Bulk action completed with ${failures.length} failures. Check console for details.`);
      } else {
        console.log(`✅ All ${results.length} bulk actions completed successfully`);
      }
      
      // Update local state only for successful updates
      setUsers(users => users.map(user => {
        const result = results.find(r => r.userId === user.id);
        if (result && result.success && bulkActions.selectedUsers.includes(user.id)) {
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
      console.error('❌ Bulk action failed:', error);
      alert(`Bulk action failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setBulkActions(prev => ({ ...prev, isProcessing: false }));
    }
  };

  // Individual action handlers (keeping existing functionality)
  const handleBan = async (id: number) => {
    const user = users.find(u => u.id === id);
    const newBanned = !user?.banned;
    
    try {
      console.log(`${newBanned ? '🚫 Banning' : '✅ Unbanning'} user ${id}...`);
      const response = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ banned: newBanned }),
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error('❌ Ban/unban failed:', error);
        throw new Error(error.error || 'Failed to update ban status');
      }
      
      setUsers(users => users.map(u => u.id === id ? { ...u, banned: newBanned } : u));
      console.log(`✅ User ${id} ${newBanned ? 'banned' : 'unbanned'} successfully`);
    } catch (error) {
      console.error('Ban/unban error:', error);
      alert(`Failed to ${newBanned ? 'ban' : 'unban'} user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleTierChange = async (id: number, newTier: string) => {
    try {
      console.log(`🔄 Changing tier for user ${id} to ${newTier}...`);
      const response = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: newTier }),
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error('❌ Tier change failed:', error);
        throw new Error(error.error || 'Failed to change tier');
      }
      
      setUsers(users => users.map(u => u.id === id ? { ...u, tier: newTier } : u));
      console.log(`✅ User ${id} tier changed to ${newTier}`);
    } catch (error) {
      console.error('Tier change error:', error);
      alert(`Failed to change tier: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
    
    try {
      console.log(`🎁 Gifting ${giftAmount} coins to user ${userId}...`);
      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildCoins: newAmount }),
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error('❌ Gift coins failed:', error);
        throw new Error(error.error || 'Failed to gift coins');
      }
      
      setUsers(users => users.map(u => 
        u.id === userId ? { ...u, guildCoins: newAmount } : u
      ));
      
      console.log(`✅ Gifted ${giftAmount} coins to user ${userId}`);
      setGiftStatus("Gifted!");
      setTimeout(() => {
        setGiftUserId(null);
        setGiftAmount(0);
        setGiftStatus("");
      }, 1200);
    } catch (error) {
      console.error('Gift coins error:', error);
      setGiftStatus(`Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
      console.log(`🗑️ Attempting to delete user ${userId}...`);
      const response = await fetch(`/api/users/${userId}`, { method: "DELETE" });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Delete API failed:', response.status, errorData);
        throw new Error(errorData.error || `Failed to delete user from backend (${response.status})`);
      }
      
      const result = await response.json();
      console.log('✅ User deleted successfully:', result);
      
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
      
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-4 md:p-8">
        <div className="max-w-[1800px] mx-auto space-y-6">
          
          {/* Modern Header Section with Glassmorphism */}
          <div className="relative bg-gradient-to-r from-zinc-900/80 via-zinc-800/80 to-zinc-900/80 backdrop-blur-xl border border-yellow-500/30 rounded-3xl p-8 shadow-2xl overflow-hidden">
            {/* Animated Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-transparent to-yellow-500/5 animate-pulse"></div>
            
            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-yellow-500/50 transform transition-transform hover:scale-110">
                      👥
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-zinc-900 animate-pulse"></div>
                  </div>
                  <div>
                    <h1 className="text-4xl font-black bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 bg-clip-text text-transparent mb-1">
                      User Management
                    </h1>
                    <p className="text-gray-400 text-sm font-medium">Manage your community with precision and care</p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/kingdom/enforcement-management"
                    className="group flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold px-6 py-3 rounded-xl transition-all duration-300 shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:scale-105"
                  >
                    <span className="text-lg group-hover:animate-pulse">🚨</span>
                    <span>Enforcement</span>
                  </Link>
                  <button
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className="group flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold px-6 py-3 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105"
                  >
                    <span className="text-lg group-hover:rotate-180 transition-transform duration-300">🔧</span>
                    <span>{showAdvancedFilters ? 'Hide' : 'Show'} Filters</span>
                  </button>
                </div>
              </div>

              {/* Enhanced Analytics Dashboard with Modern Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-10 gap-3">
                {[
                  { value: analytics.totalUsers, label: 'Total Users', color: 'from-blue-500 to-blue-600', icon: '👥', glow: 'blue' },
                  { value: users.filter(u => u.isOnline).length, label: 'Online Now', color: 'from-green-500 to-green-600', icon: '🟢', glow: 'green' },
                  { value: analytics.activeUsers, label: 'Active', color: 'from-cyan-500 to-cyan-600', icon: '⚡', glow: 'cyan' },
                  { value: analytics.bannedUsers, label: 'Banned', color: 'from-red-500 to-red-600', icon: '🚫', glow: 'red' },
                  { value: `$${analytics.totalWalletValue.toFixed(0)}`, label: 'Total Wallet', color: 'from-emerald-500 to-emerald-600', icon: '💰', glow: 'emerald' },
                  { value: analytics.totalGuildCoins, label: 'Guild Coins', color: 'from-yellow-500 to-yellow-600', icon: '🪙', glow: 'yellow' },
                  { value: analytics.totalSessions, label: 'Sessions', color: 'from-purple-500 to-purple-600', icon: '📊', glow: 'purple' },
                  { value: analytics.totalPageViews, label: 'Page Views', color: 'from-pink-500 to-pink-600', icon: '👁️', glow: 'pink' },
                  { value: Math.round(analytics.averageEngagement), label: 'Avg Score', color: 'from-orange-500 to-orange-600', icon: '📈', glow: 'orange' },
                  { value: `${analytics.tierDistribution.MIGISTUS}👑 ${analytics.tierDistribution.Guild}⚔️`, label: 'Elite/Guild', color: 'from-indigo-500 to-indigo-600', icon: '🎖️', glow: 'indigo' },
                ].map((stat, idx) => (
                  <div 
                    key={idx}
                    className={`group relative bg-gradient-to-br ${stat.color} rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer overflow-hidden`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                    <div className="relative z-10 text-center">
                      <div className="text-xl mb-1 group-hover:scale-125 transition-transform duration-300">{stat.icon}</div>
                      <div className="text-2xl font-black text-white mb-1 tracking-tight">{stat.value}</div>
                      <div className="text-xs text-white/90 font-semibold uppercase tracking-wider">{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Modern Search and Filters Card */}
          <div className="bg-gradient-to-br from-zinc-900/90 via-zinc-800/90 to-zinc-900/90 backdrop-blur-xl border border-yellow-500/30 rounded-3xl p-6 shadow-2xl">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Enhanced Search Bar */}
              <div className="flex-1 relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-transparent rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search users by username or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-5 py-4 pl-12 bg-zinc-800/80 border-2 border-yellow-500/40 hover:border-yellow-400/60 focus:border-yellow-400 rounded-xl text-white placeholder-gray-400 focus:outline-none transition-all duration-300 font-medium shadow-inner"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-400 text-xl">🔍</span>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
              
              {/* Modern Filter Dropdowns */}
              <div className="flex gap-3">
                <select
                  value={filters.tier}
                  onChange={(e) => setFilters(prev => ({ ...prev, tier: e.target.value }))}
                  className="px-5 py-4 bg-zinc-800/80 border-2 border-yellow-500/40 hover:border-yellow-400/60 focus:border-yellow-400 rounded-xl text-white focus:outline-none transition-all duration-300 font-semibold cursor-pointer shadow-lg hover:shadow-yellow-500/20"
                >
                  <option value="all">🎖️ All Tiers</option>
                  <option value="MIGISTUS">👑 MIGISTUS</option>
                  <option value="Guild">⚔️ Guild</option>
                  <option value="Initiate">🛡️ Initiate</option>
                </select>
                
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="px-5 py-4 bg-zinc-800/80 border-2 border-yellow-500/40 hover:border-yellow-400/60 focus:border-yellow-400 rounded-xl text-white focus:outline-none transition-all duration-300 font-semibold cursor-pointer shadow-lg hover:shadow-yellow-500/20"
                >
                  <option value="all">📊 All Status</option>
                  <option value="active">✅ Active</option>
                  <option value="banned">🚫 Banned</option>
                  <option value="muted">🔇 Muted</option>
                </select>
              </div>
            </div>

            {/* Advanced Filters with Smooth Animation */}
            {showAdvancedFilters && (
              <div className="border-t border-yellow-500/20 pt-6 mt-6 animate-fadeIn">
                <h3 className="text-yellow-400 font-bold text-lg mb-4 flex items-center gap-2">
                  <span>⚙️</span> Advanced Filters
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm text-gray-300 font-semibold">Sort By</label>
                    <select
                      value={filters.sortBy}
                      onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                      className="w-full px-4 py-3 bg-zinc-800/80 border border-yellow-500/40 hover:border-yellow-400/60 rounded-lg text-white text-sm font-medium focus:outline-none focus:border-yellow-400 transition-all"
                    >
                      <option value="joinDate">📅 Join Date</option>
                      <option value="lastLogin">🕐 Last Login</option>
                      <option value="username">👤 Username</option>
                      <option value="email">📧 Email</option>
                      <option value="tier">🎖️ Tier</option>
                      <option value="wallet">💰 Wallet</option>
                      <option value="guildCoins">🪙 Guild Coins</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm text-gray-300 font-semibold">Order</label>
                    <select
                      value={filters.sortOrder}
                      onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value as 'asc' | 'desc' }))}
                      className="w-full px-4 py-3 bg-zinc-800/80 border border-yellow-500/40 hover:border-yellow-400/60 rounded-lg text-white text-sm font-medium focus:outline-none focus:border-yellow-400 transition-all"
                    >
                      <option value="desc">⬇️ Descending</option>
                      <option value="asc">⬆️ Ascending</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm text-gray-300 font-semibold">Join Date Range</label>
                    <select
                      value={filters.dateRange}
                      onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                      className="w-full px-4 py-3 bg-zinc-800/80 border border-yellow-500/40 hover:border-yellow-400/60 rounded-lg text-white text-sm font-medium focus:outline-none focus:border-yellow-400 transition-all"
                    >
                      <option value="all">🌐 All Time</option>
                      <option value="today">📆 Today</option>
                      <option value="week">📅 This Week</option>
                      <option value="month">🗓️ This Month</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm text-gray-300 font-semibold">Results Per Page</label>
                    <div className="flex items-center justify-center h-12 bg-zinc-800/80 border border-yellow-500/40 rounded-lg">
                      <span className="text-yellow-400 font-bold text-lg">{usersPerPage} users</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modern Bulk Actions Bar */}
          {bulkActions.selectedUsers.length > 0 && (
            <div className="bg-gradient-to-r from-blue-900/50 via-blue-800/50 to-blue-900/50 backdrop-blur-xl border-2 border-blue-500/40 rounded-2xl p-5 shadow-2xl shadow-blue-500/20 animate-fadeIn">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    {bulkActions.selectedUsers.length}
                  </div>
                  <span className="text-white font-bold text-lg">
                    {bulkActions.selectedUsers.length} user{bulkActions.selectedUsers.length !== 1 ? 's' : ''} selected
                  </span>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <select
                    value={bulkActions.action}
                    onChange={(e) => setBulkActions(prev => ({ ...prev, action: e.target.value }))}
                    className="flex-1 sm:flex-none px-4 py-3 bg-zinc-800/90 border-2 border-blue-400/40 hover:border-blue-400 rounded-xl text-white font-semibold focus:outline-none focus:border-blue-400 transition-all"
                  >
                    <option value="">Select Action...</option>
                    <option value="ban">🚫 Ban Users</option>
                    <option value="unban">✅ Unban Users</option>
                    <option value="promote-guild">⬆️ Promote to Guild</option>
                    <option value="demote-initiate">⬇️ Demote to Initiate</option>
                  </select>
                  <button
                    onClick={handleBulkAction}
                    disabled={!bulkActions.action || bulkActions.isProcessing}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-blue-500/50 disabled:cursor-not-allowed hover:scale-105 disabled:scale-100"
                  >
                    {bulkActions.isProcessing ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin">⚙️</span> Processing...
                      </span>
                    ) : (
                      'Apply'
                    )}
                  </button>
                  <button
                    onClick={() => setBulkActions({ selectedUsers: [], action: '', isProcessing: false })}
                    className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:scale-105"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modern Users Table */}
          {loading ? (
            <div className="bg-gradient-to-br from-zinc-900/90 via-zinc-800/90 to-zinc-900/90 backdrop-blur-xl border border-yellow-500/30 rounded-3xl p-16 text-center shadow-2xl">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                <div className="text-yellow-400 text-2xl font-bold">Loading users...</div>
                <div className="text-gray-400">Please wait while we fetch the data</div>
              </div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="bg-gradient-to-br from-zinc-900/90 via-zinc-800/90 to-zinc-900/90 backdrop-blur-xl border border-yellow-500/30 rounded-3xl p-16 text-center shadow-2xl">
              <div className="flex flex-col items-center gap-4">
                <div className="text-7xl mb-4">🔍</div>
                <div className="text-gray-300 text-2xl font-bold">
                  {searchTerm ? `No users found matching "${searchTerm}"` : "No users found"}
                </div>
                <div className="text-gray-500">Try adjusting your search or filters</div>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-zinc-900/90 via-zinc-800/90 to-zinc-900/90 backdrop-blur-xl border border-yellow-500/30 rounded-3xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-zinc-800/90 to-zinc-900/90 border-b-2 border-yellow-500/30">
                    <tr>
                      <th className="px-6 py-5 text-left">
                        <input
                          type="checkbox"
                          checked={bulkActions.selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="w-5 h-5 accent-yellow-400 cursor-pointer rounded border-2 border-yellow-500/50"
                        />
                      </th>
                      <th className="px-6 py-5 text-left text-yellow-300 font-black uppercase tracking-wider text-sm">👤 User</th>
                      <th className="px-6 py-5 text-left text-yellow-300 font-black uppercase tracking-wider text-sm">🎖️ Tier</th>
                      <th className="px-6 py-5 text-left text-yellow-300 font-black uppercase tracking-wider text-sm">📊 Status</th>
                      <th className="px-6 py-5 text-left text-yellow-300 font-black uppercase tracking-wider text-sm">⚡ Activity</th>
                      <th className="px-6 py-5 text-left text-yellow-300 font-black uppercase tracking-wider text-sm">📈 Session</th>
                      <th className="px-6 py-5 text-left text-yellow-300 font-black uppercase tracking-wider text-sm">📅 Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-700/30">
                    {paginatedUsers.map((user, index) => (
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

              {/* Modern Pagination */}
              {totalPages > 1 && (
                <div className="bg-gradient-to-r from-zinc-800/90 to-zinc-900/90 px-8 py-6 border-t-2 border-yellow-500/30">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-gray-300 font-semibold">
                      Showing <span className="text-yellow-400 font-bold">{((currentPage - 1) * usersPerPage) + 1}</span> to <span className="text-yellow-400 font-bold">{Math.min(currentPage * usersPerPage, filteredUsers.length)}</span> of <span className="text-yellow-400 font-bold">{filteredUsers.length}</span> users
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-5 py-3 bg-gradient-to-r from-zinc-700 to-zinc-800 hover:from-zinc-600 hover:to-zinc-700 disabled:from-zinc-800 disabled:to-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-yellow-500/20 hover:scale-105 disabled:scale-100"
                      >
                        ← Previous
                      </button>
                      <div className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-black rounded-xl shadow-lg shadow-yellow-500/50">
                        {currentPage} / {totalPages}
                      </div>
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="px-5 py-3 bg-gradient-to-r from-zinc-700 to-zinc-800 hover:from-zinc-600 hover:to-zinc-700 disabled:from-zinc-800 disabled:to-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-yellow-500/20 hover:scale-105 disabled:scale-100"
                      >
                        Next →
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
  const [activeTab, setActiveTab] = useState<'info' | 'activity' | 'financial'>('info');
  const [saving, setSaving] = useState(false);
  const [giftAmount, setGiftAmount] = useState(0);
  const [giftStatus, setGiftStatus] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [passwordResetStatus, setPasswordResetStatus] = useState("");

  // Prevent body scrolling when modal is open
  useEffect(() => {
    // Save original body overflow style
    const originalStyle = window.getComputedStyle(document.body).overflow;
    
    // Prevent scrolling on mount
    document.body.style.overflow = 'hidden';
    
    // Restore original overflow on unmount
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

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
      console.log('💾 Saving user changes for user:', editedUser.id);
      const response = await fetch(`/api/users/${editedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editedUser),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Update API failed:', response.status, errorData);
        throw new Error(errorData.error || `Failed to update user (${response.status})`);
      }
      
      const result = await response.json();
      console.log('✅ User updated successfully:', result);
      
      onUpdate(editedUser as ComprehensiveUserData);
      
      // Track successful save
      activityTracker.trackAdminAction("user_modification_success", {
        targetUserId: editedUser.id,
        targetUsername: editedUser.username
      });
      
    } catch (error) {
      console.error('Failed to update user:', error);
      alert(`Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
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

      console.log(`🎁 Gifting ${giftAmount} coins to user ${editedUser.id}...`);
      const response = await fetch(`/api/users/${editedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildCoins: newAmount }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Gift coins API failed:', response.status, errorData);
        throw new Error(errorData.error || 'Failed to gift coins');
      }
      
      console.log('✅ Coins gifted successfully');
      
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
      console.error('Gift coins error:', error);
      setGiftStatus(`Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
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

  const handlePasswordReset = async () => {
    setPasswordResetStatus("");
    
    if (!newPassword || newPassword.length < 8) {
      setPasswordResetStatus("Password must be at least 8 characters.");
      return;
    }

    // Track admin password reset action
    activityTracker.trackAdminAction("password_reset", {
      targetUserId: editedUser.id,
      targetUsername: editedUser.username,
      action: "admin_password_reset"
    });

    try {
      const response = await fetch(`/api/admin/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({
          userId: editedUser.id,
          newPassword: newPassword
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPasswordResetStatus("✅ Password reset successfully!");
        setNewPassword("");
        
        // Track successful reset
        activityTracker.trackAdminAction("password_reset_success", {
          targetUserId: editedUser.id,
          targetUsername: editedUser.username
        });
        
        setTimeout(() => {
          setPasswordResetStatus("");
          setShowPasswordReset(false);
        }, 2000);
      } else {
        const error = await response.json();
        setPasswordResetStatus(`❌ ${error.error || 'Failed to reset password'}`);
        
        // Track failed reset
        activityTracker.trackAdminAction("password_reset_failed", {
          targetUserId: editedUser.id,
          targetUsername: editedUser.username,
          error: error.error
        });
      }
    } catch (error) {
      setPasswordResetStatus("❌ Failed to reset password.");
      
      // Track failed reset
      activityTracker.trackAdminAction("password_reset_failed", {
        targetUserId: editedUser.id,
        targetUsername: editedUser.username,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn overflow-hidden"
      onClick={(e) => {
        // Close modal when clicking the backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 rounded-3xl border-2 border-yellow-500/40 w-full max-w-7xl max-h-[95vh] flex flex-col shadow-2xl shadow-black/50 overflow-hidden">
        
        {/* Enhanced Header - Fixed */}
        <div className="relative bg-gradient-to-r from-zinc-800 via-zinc-900 to-zinc-800 p-8 border-b-2 border-yellow-500/30 flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-transparent to-yellow-500/5 animate-pulse"></div>
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-zinc-600 via-zinc-500 to-zinc-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg ring-4 ring-zinc-700">
                  {editedUser.username.charAt(0).toUpperCase()}
                </div>
                {user.isOnline && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 border-4 border-zinc-900 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                )}
              </div>
              <div>
                <h2 className="text-3xl font-black bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 bg-clip-text text-transparent mb-1">
                  {editedUser.username}
                </h2>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-400 font-medium">ID: <span className="text-gray-300">{editedUser.id}</span></span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-400 font-medium">Joined: <span className="text-gray-300">{formatDate(editedUser.joinDate)}</span></span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="group p-3 rounded-xl text-gray-400 hover:text-white hover:bg-red-500/20 border border-transparent hover:border-red-500/40 transition-all duration-300"
              title="Close"
            >
              <span className="text-2xl">✕</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {/* Tab Navigation - Sticky */}
          <div className="sticky top-0 z-10 bg-zinc-900/95 backdrop-blur-md border-b border-yellow-500/30 px-8 pt-6">
            <div className="flex gap-2 pb-0">
              {[
                { id: 'info', label: 'Account Info', icon: '👤' },
                { id: 'activity', label: 'Activity & Sessions', icon: '📊' },
                { id: 'financial', label: 'Financial', icon: '💰' }
              ].map((tab, index) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-3 font-bold transition-all duration-300 ${
                    index === 0 ? 'rounded-tl-xl rounded-tr-xl' : index === 2 ? 'rounded-t-xl' : 'rounded-t-xl'
                  } ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black shadow-lg shadow-yellow-500/30'
                      : 'bg-zinc-800/50 text-gray-400 hover:text-white hover:bg-zinc-700/50'
                  }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {/* Account Info Tab */}
            {activeTab === 'info' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
                {/* Basic Information Card */}
                <div className="bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 rounded-2xl p-6 border border-yellow-500/20 shadow-xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-xl">📝</span>
                    </div>
                    <h3 className="text-xl font-black text-yellow-400">Basic Information</h3>
                  </div>
                  
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-bold text-gray-300 mb-2">Username</label>
                      <input
                        type="text"
                        value={editedUser.username}
                        onChange={(e) => setEditedUser(prev => ({ ...prev, username: e.target.value }))}
                        className="w-full px-4 py-3 bg-zinc-700/80 border-2 border-zinc-600 hover:border-yellow-500/40 focus:border-yellow-400 rounded-xl text-white font-medium focus:outline-none transition-all shadow-inner"
                        placeholder="Enter username"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-gray-300 mb-2">Email Address</label>
                      <input
                        type="email"
                        value={editedUser.email}
                        onChange={(e) => setEditedUser(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-4 py-3 bg-zinc-700/80 border-2 border-zinc-600 hover:border-yellow-500/40 focus:border-yellow-400 rounded-xl text-white font-medium focus:outline-none transition-all shadow-inner"
                        placeholder="user@example.com"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-gray-300 mb-2">Account Tier</label>
                      <div className="flex items-center gap-3">
                        <select
                          value={editedUser.tier || "Initiate"}
                          onChange={(e) => setEditedUser(prev => ({ ...prev, tier: e.target.value }))}
                          className="flex-1 px-4 py-3 bg-zinc-700/80 border-2 border-zinc-600 hover:border-yellow-500/40 focus:border-yellow-400 rounded-xl text-white font-medium focus:outline-none transition-all cursor-pointer"
                        >
                          {tierOptions.map(tier => (
                            <option key={tier} value={tier}>{tier}</option>
                          ))}
                        </select>
                        <span className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-black shadow-lg ${getTierBadgeColor(editedUser.tier)} transform transition-all hover:scale-110`}>
                          <span className="text-lg">{getTierIcon(editedUser.tier)}</span>
                          <span>{editedUser.tier || "Initiate"}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Account Status Card */}
                <div className="bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 rounded-2xl p-6 border border-yellow-500/20 shadow-xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-xl">📊</span>
                    </div>
                    <h3 className="text-xl font-black text-yellow-400">Account Status</h3>
                  </div>
                  
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-bold text-gray-300 mb-3">Account Status</label>
                      <button
                        onClick={() => setEditedUser(prev => ({ ...prev, banned: !prev.banned }))}
                        className={`w-full px-6 py-4 rounded-xl font-black text-base transition-all duration-300 shadow-lg transform hover:scale-105 ${
                          editedUser.banned 
                            ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-red-500/30" 
                            : "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white shadow-green-500/30"
                        }`}
                      >
                        {editedUser.banned ? "🚫 BANNED - Click to Unban" : "✅ ACTIVE - Click to Ban"}
                      </button>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-gray-300 mb-2">Mute Until (Optional)</label>
                      <input
                        type="datetime-local"
                        value={editedUser.mutedUntil || ""}
                        onChange={(e) => setEditedUser(prev => ({ ...prev, mutedUntil: e.target.value }))}
                        className="w-full px-4 py-3 bg-zinc-700/80 border-2 border-zinc-600 hover:border-yellow-500/40 focus:border-yellow-400 rounded-xl text-white font-medium focus:outline-none transition-all shadow-inner"
                      />
                      <p className="text-xs text-gray-500 mt-2">🔇 User will be unable to chat until this time</p>
                    </div>

                    <div className="pt-4 border-t border-zinc-700">
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-bold text-gray-300">Live Status</label>
                        {user.isOnline ? (
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                            <span className="text-green-400 font-bold text-sm">Online Now</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                            <span className="text-gray-400 font-bold text-sm">Offline</span>
                          </div>
                        )}
                      </div>
                      {user.isOnline && (
                        <div className="bg-zinc-700/50 rounded-lg p-3 space-y-1">
                          <div className="text-sm"><span className="text-gray-400">Current Page:</span> <span className="text-blue-400 font-semibold">{user.currentPage || '/'}</span></div>
                          <div className="text-sm"><span className="text-gray-400">Active for:</span> <span className="text-yellow-400 font-semibold">{user.sessionDuration || 0}m</span></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Password Reset Card */}
                <div className="bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 rounded-2xl p-6 border border-yellow-500/20 shadow-xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-xl">🔑</span>
                    </div>
                    <h3 className="text-xl font-black text-yellow-400">Password Management</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {!showPasswordReset ? (
                      <div>
                        <button
                          onClick={() => setShowPasswordReset(true)}
                          className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-black rounded-xl transition-all duration-300 shadow-lg shadow-purple-500/30 hover:scale-105"
                        >
                          🔐 Reset User Password
                        </button>
                        <p className="text-xs text-gray-500 mt-3 text-center">Current password is encrypted and cannot be viewed</p>
                      </div>
                    ) : (
                      <div className="space-y-4 p-4 bg-purple-900/20 border border-purple-500/30 rounded-xl">
                        <div>
                          <label className="block text-sm font-bold text-purple-300 mb-2">New Password (Plain Text)</label>
                          <input
                            type="text"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password (min 8 chars)"
                            className="w-full px-4 py-3 bg-zinc-700/80 border-2 border-purple-500/40 focus:border-purple-400 rounded-xl text-white font-medium focus:outline-none transition-all shadow-inner"
                          />
                        </div>
                        
                        <div className="flex gap-3">
                          <button
                            onClick={handlePasswordReset}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-bold rounded-xl transition-all shadow-lg"
                          >
                            ✅ Set New Password
                          </button>
                          <button
                            onClick={() => {
                              setShowPasswordReset(false);
                              setNewPassword("");
                              setPasswordResetStatus("");
                            }}
                            className="px-4 py-3 bg-zinc-700 hover:bg-zinc-600 text-white font-bold rounded-xl transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                        
                        {passwordResetStatus && (
                          <div className={`text-sm p-3 rounded-xl font-semibold ${
                            passwordResetStatus.includes('✅') 
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}>
                            {passwordResetStatus}
                          </div>
                        )}
                        
                        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3">
                          <p className="text-xs text-yellow-300 font-semibold">⚠️ User will be able to login with this new password immediately. Make sure to communicate it securely.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Dangerous Actions Card */}
                <div className="bg-gradient-to-br from-red-900/40 to-red-950/40 rounded-2xl p-6 border-2 border-red-500/40 shadow-xl shadow-red-500/10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-xl">⚠️</span>
                    </div>
                    <h3 className="text-xl font-black text-red-400">Danger Zone</h3>
                  </div>
                  
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black rounded-xl transition-all duration-300 shadow-lg shadow-red-500/30 hover:scale-105"
                  >
                    🗑️ Delete Account Permanently
                  </button>
                  <p className="text-xs text-red-300 mt-3 text-center font-semibold">⚠️ This action cannot be undone and will remove all user data</p>
                </div>
              </div>
            )}

            {/* Activity & Sessions Tab */}
            {activeTab === 'activity' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
                {/* Live Session Card */}
                <div className="bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 rounded-2xl p-6 border border-yellow-500/20 shadow-xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-xl">🔴</span>
                    </div>
                    <h3 className="text-xl font-black text-yellow-400">Live Session</h3>
                  </div>
                  
                  {user.isOnline ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                        <div className="w-4 h-4 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                        <span className="text-green-400 font-black text-lg">Online Now</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-zinc-700/50 rounded-xl p-4">
                          <div className="text-gray-400 text-sm font-semibold mb-1">Current Page</div>
                          <div className="text-blue-400 font-bold">{user.currentPage || '/'}</div>
                        </div>
                        <div className="bg-zinc-700/50 rounded-xl p-4">
                          <div className="text-gray-400 text-sm font-semibold mb-1">Session Time</div>
                          <div className="text-yellow-400 font-bold">{user.sessionDuration || 0} mins</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center p-8 bg-zinc-700/30 rounded-xl border border-zinc-600">
                      <div className="text-center">
                        <div className="w-3 h-3 bg-gray-400 rounded-full mx-auto mb-3"></div>
                        <span className="text-gray-400 font-semibold">User is Offline</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Session History Card */}
                <div className="bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 rounded-2xl p-6 border border-yellow-500/20 shadow-xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-xl">📅</span>
                    </div>
                    <h3 className="text-xl font-black text-yellow-400">Session History</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl p-4">
                        <div className="text-blue-300 text-sm font-semibold mb-1">Total Sessions</div>
                        <div className="text-white font-black text-2xl">{Array.isArray(liveSessions) ? liveSessions.length : 0}</div>
                      </div>
                      <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl p-4">
                        <div className="text-green-300 text-sm font-semibold mb-1">Active Now</div>
                        <div className="text-white font-black text-2xl">{Array.isArray(liveSessions) ? liveSessions.filter(s => s.isActive).length : 0}</div>
                      </div>
                    </div>
                    <div className="bg-zinc-700/50 rounded-xl p-4">
                      <div className="text-gray-400 text-sm font-semibold mb-1">Last Login</div>
                      <div className="text-white font-bold">{formatDate(user.lastLogin)}</div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity Card - Full Width */}
                <div className="lg:col-span-2 bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 rounded-2xl p-6 border border-yellow-500/20 shadow-xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-xl">📊</span>
                    </div>
                    <h3 className="text-xl font-black text-yellow-400">Recent Activity</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-2">
                    {Array.isArray(liveActivities) && liveActivities.slice(0, 20).map((activity, index) => (
                      <div key={index} className="flex items-center gap-4 p-4 bg-zinc-700/50 hover:bg-zinc-700/70 rounded-xl border border-zinc-600 hover:border-yellow-500/40 transition-all">
                        <div className="w-12 h-12 bg-gradient-to-br from-zinc-600 to-zinc-700 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                          {activity.type === 'auth' && '🔑'}
                          {activity.type === 'navigation' && '📄'}
                          {activity.type === 'pledge' && '🤝'}
                          {activity.type === 'vote' && '🗳️'}
                          {activity.type === 'wallet' && '💰'}
                          {activity.type === 'profile' && '👤'}
                          {activity.type === 'chat' && '💬'}
                          {activity.type === 'search' && '🔍'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-semibold truncate">{activity.action}</div>
                          <div className="text-gray-400 text-xs">{new Date(activity.timestamp).toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                    {(!Array.isArray(liveActivities) || liveActivities.length === 0) && (
                      <div className="col-span-2 text-center py-12 text-gray-400 font-semibold">
                        No recent activity to display
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Financial Tab */}
            {activeTab === 'financial' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
                {/* Wallet & Currency Overview - Read Only */}
                <div className="bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 rounded-2xl p-6 border border-yellow-500/20 shadow-xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-xl">💵</span>
                    </div>
                    <h3 className="text-xl font-black text-yellow-400">Wallet & Currency Overview</h3>
                  </div>
                  
                  <div className="space-y-5">
                    {/* Wallet Balance - Read Only Display */}
                    <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-2 border-green-500/30 rounded-xl p-5">
                      <label className="block text-sm font-bold text-green-300 mb-3">💳 Wallet Balance</label>
                      <div className="text-4xl font-black text-white mb-1">
                        ${typeof editedUser.wallet === 'number' ? editedUser.wallet.toFixed(2) : '0.00'}
                      </div>
                      <p className="text-xs text-green-300 font-semibold">Real currency balance for purchases</p>
                    </div>
                    
                    {/* Guild Coins - Read Only Display */}
                    <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-2 border-yellow-500/30 rounded-xl p-5">
                      <label className="block text-sm font-bold text-yellow-300 mb-3">🪙 Guild Coins</label>
                      <div className="text-4xl font-black text-white mb-1">
                        {editedUser.guildCoins || 0}
                      </div>
                      <p className="text-xs text-yellow-300 font-semibold">Reward points for platform activities</p>
                    </div>

                    <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                      <p className="text-xs text-blue-300 font-semibold flex items-center gap-2">
                        <span>ℹ️</span>
                        <span>These balances are managed automatically by the system. Use the Gift Coins feature to add Guild Coins.</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Gift Coins Card */}
                <div className="bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 rounded-2xl p-6 border border-yellow-500/20 shadow-xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-xl">🎁</span>
                    </div>
                    <h3 className="text-xl font-black text-yellow-400">Gift Guild Coins</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-300 mb-2">Amount to Gift</label>
                      <input
                        type="number"
                        min="1"
                        value={giftAmount}
                        onChange={(e) => setGiftAmount(parseInt(e.target.value) || 0)}
                        placeholder="Enter coin amount"
                        className="w-full px-4 py-3 bg-zinc-700/80 border-2 border-zinc-600 hover:border-yellow-500/40 focus:border-yellow-400 rounded-xl text-white font-medium focus:outline-none transition-all shadow-inner"
                      />
                    </div>
                    
                    <button
                      onClick={handleGiftCoins}
                      className="w-full px-6 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-black rounded-xl transition-all duration-300 shadow-lg shadow-yellow-500/30 hover:scale-105"
                    >
                      🪙 Send Gift Coins
                    </button>
                    
                    {giftStatus && (
                      <div className={`text-sm p-3 rounded-xl font-semibold ${
                        giftStatus === "Gifted!" 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {giftStatus}
                      </div>
                    )}
                    
                    <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3">
                      <p className="text-xs text-yellow-300 font-semibold">💡 Coins will be added to the user's current balance instantly</p>
                    </div>
                  </div>
                </div>

                {/* Activity Stats Card */}
                <div className="bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 rounded-2xl p-6 border border-yellow-500/20 shadow-xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-xl">📈</span>
                    </div>
                    <h3 className="text-xl font-black text-yellow-400">Activity Statistics</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl p-5 text-center">
                      <div className="text-3xl font-black text-blue-400 mb-1">{editedUser.totalPledges || 0}</div>
                      <div className="text-sm text-blue-300 font-semibold">Total Pledges</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-xl p-5 text-center">
                      <div className="text-3xl font-black text-purple-400 mb-1">{editedUser.totalVotes || 0}</div>
                      <div className="text-sm text-purple-300 font-semibold">Total Votes</div>
                    </div>
                  </div>
                </div>

                {/* Account Timeline Card */}
                <div className="bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 rounded-2xl p-6 border border-yellow-500/20 shadow-xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-xl">⏱️</span>
                    </div>
                    <h3 className="text-xl font-black text-yellow-400">Account Timeline</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-zinc-700/50 rounded-xl">
                      <span className="text-gray-300 font-semibold">Join Date</span>
                      <span className="text-white font-bold">{formatDate(editedUser.joinDate)}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-zinc-700/50 rounded-xl">
                      <span className="text-gray-300 font-semibold">Last Login</span>
                      <span className="text-white font-bold">{formatDate(editedUser.lastLogin)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Footer with Prominent Save Button - Fixed */}
        <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 border-t-2 border-yellow-500/30 px-8 py-6 shadow-2xl flex-shrink-0">
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-8 py-3 bg-zinc-700/80 hover:bg-zinc-600 text-white font-bold rounded-xl transition-all hover:scale-105 shadow-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="relative px-12 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-black text-lg rounded-xl transition-all duration-300 shadow-2xl shadow-yellow-500/40 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {saving ? (
                <span className="flex items-center gap-3">
                  <div className="w-5 h-5 border-3 border-black border-t-transparent rounded-full animate-spin"></div>
                  Saving Changes...
                </span>
              ) : (
                <span className="flex items-center gap-3">
                  💾 Save All Changes
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-2xl p-8 border-2 border-red-500/50 w-full max-w-md shadow-2xl shadow-red-500/20">
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


// Disable footer for Kingdom pages
(UserManagementPage as any).showFooter = false;