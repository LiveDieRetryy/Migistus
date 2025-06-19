import { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import MainNavbar from '@/components/nav/MainNavbar';
import { useAuth } from '@/context/AuthContext';

interface User {
  id: number;
  username: string;
  email: string;
  tier: string;
  joinedDate: string;
  stats: {
    totalPledges: number;
    totalVotes: number;
    dropsJoined: number;
    followers: number;
    following: number;
  };
  avatar?: string;
  bio?: string;
  lastActive?: string;
}

export default function AdminUsersPage() {
  const { user, isAuthenticated } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'username' | 'joinedDate' | 'tier'>('username');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [refreshKey, setRefreshKey] = useState(0);

  // Use the EXACT SAME comprehensive user retrieval method as the sync service
  const getAllUsers = (): User[] => {
    const allUsers: User[] = [];
    const userIds = new Set<number>();

    if (typeof window === 'undefined') return allUsers;

    console.log('🔍 ADMIN: Starting COMPREHENSIVE user scan...');

    try {
      // 1. Get users from migistus_user_registry (PRIMARY SOURCE)
      try {
        const userRegistry = JSON.parse(localStorage.getItem('migistus_user_registry') || '{}');
        console.log('📋 ADMIN: Registry entries found:', Object.keys(userRegistry).length);
        
        Object.entries(userRegistry).forEach(([email, userData]: [string, any]) => {
          if (userData.id && !userIds.has(userData.id)) {
            let profile = getProfileForUser(userData.id);
            
            if (!profile) {
              // Create profile from registry data
              profile = {
                id: userData.id,
                username: userData.username || `user_${userData.id}`,
                email: userData.email || email,
                bio: '',
                tier: 'New Member',
                joinedDate: new Date().toISOString().split('T')[0],
                stats: { totalPledges: 0, totalVotes: 0, dropsJoined: 0, followers: 0, following: 0 }
              };
              
              // Save the created profile for future use
              try {
                localStorage.setItem(`user_${userData.id}_profile`, JSON.stringify(profile));
              } catch (error) {
                console.warn('Failed to save generated profile');
              }
            }
            
            if (profile.username) {
              const user = createUserFromProfile(profile);
              allUsers.push(user);
              userIds.add(userData.id);
              console.log(`✅ ADMIN: Added registry user: ${profile.username} (ID: ${userData.id})`);
            }
          }
        });
      } catch (error) {
        console.warn('ADMIN: Error reading user registry:', error);
      }

      // 2. Get users from current userSession
      try {
        const currentSession = localStorage.getItem('userSession');
        if (currentSession) {
          const session = JSON.parse(currentSession);
          if (session.user && session.user.id && !userIds.has(session.user.id)) {
            let profile = getProfileForUser(session.user.id);
            
            if (!profile) {
              profile = {
                id: session.user.id,
                username: session.user.username || `user_${session.user.id}`,
                email: session.user.email,
                bio: '',
                tier: 'New Member',
                joinedDate: new Date().toISOString().split('T')[0],
                stats: { totalPledges: 0, totalVotes: 0, dropsJoined: 0, followers: 0, following: 0 }
              };
              
              try {
                localStorage.setItem(`user_${session.user.id}_profile`, JSON.stringify(profile));
              } catch (error) {
                console.warn('Failed to save session profile');
              }
            }
            
            if (profile.username) {
              const user = createUserFromProfile(profile);
              allUsers.push(user);
              userIds.add(session.user.id);
              console.log(`✅ ADMIN: Added session user: ${profile.username} (ID: ${session.user.id})`);
            }
          }
        }
      } catch (error) {
        console.warn('ADMIN: Error processing session user:', error);
      }

      // 3. Get users from new user_X_profile storage system
      const newProfileKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('user_') && key.endsWith('_profile')
      );
      console.log('🗂️ ADMIN: Found new-style profiles:', newProfileKeys.length);
      
      newProfileKeys.forEach(key => {
        try {
          const profile = JSON.parse(localStorage.getItem(key) || '{}');
          
          if (profile.id && profile.username && !userIds.has(profile.id)) {
            const user = createUserFromProfile(profile);
            allUsers.push(user);
            userIds.add(profile.id);
            console.log(`✅ ADMIN: Added new storage user: ${profile.username} (ID: ${profile.id})`);
          }
        } catch (error) {
          console.error('ADMIN: Error parsing new profile:', key, error);
        }
      });

      // 4. Get users from old userProfile_ system
      const oldProfileKeys = Object.keys(localStorage).filter(key => key.startsWith('userProfile_'));
      console.log('📁 ADMIN: Found old-style profiles:', oldProfileKeys.length);
      
      oldProfileKeys.forEach(key => {
        try {
          const profile = JSON.parse(localStorage.getItem(key) || '{}');
          
          if (profile.id && profile.username && !userIds.has(profile.id)) {
            const user = createUserFromProfile(profile);
            allUsers.push(user);
            userIds.add(profile.id);
            console.log(`✅ ADMIN: Added old storage user: ${profile.username} (ID: ${profile.id})`);
          }
        } catch (error) {
          console.error('ADMIN: Error parsing old profile:', key, error);
        }
      });

      // 5. Check for any other user-related data patterns
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(key => {
        // Look for any other user data patterns we might have missed
        if ((key.includes('user') || key.includes('User')) && 
            !key.startsWith('user_') && 
            !key.startsWith('userProfile_') && 
            !key.includes('Session') &&
            !key.includes('registry') &&
            !key.includes('Storage') &&
            !key.includes('Sync')) {
          try {
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            if (data.id && data.username && data.email && !userIds.has(data.id)) {
              const user = createUserFromProfile(data);
              allUsers.push(user);
              userIds.add(data.id);
              console.log(`✅ ADMIN: Added misc user: ${data.username} (ID: ${data.id}) from key: ${key}`);
            }
          } catch (error) {
            // Not JSON or not user data
          }
        }
      });

      console.log(`📊 ADMIN: SCAN COMPLETE - Found ${allUsers.length} unique users total`);
      console.log('👥 ADMIN: User list:', allUsers.map(u => `${u.username}(${u.id})`).join(', '));

    } catch (error) {
      console.error('❌ ADMIN: Error during user scan:', error);
    }

    return allUsers;
  };

  // Helper function to get profile for a user ID
  const getProfileForUser = (userId: number): any => {
    // Try new storage first
    try {
      const manualKey = `user_${userId}_profile`;
      const manualProfile = localStorage.getItem(manualKey);
      if (manualProfile) {
        return JSON.parse(manualProfile);
      }
    } catch (error) {
      // Continue to old storage
    }

    // Try old storage
    try {
      const oldKey = `userProfile_${userId}`;
      const oldProfile = localStorage.getItem(oldKey);
      if (oldProfile) {
        return JSON.parse(oldProfile);
      }
    } catch (error) {
      // No profile found
    }

    return null;
  };

  // Helper function to create User object from profile
  const createUserFromProfile = (profile: any): User => {
    return {
      id: profile.id,
      username: profile.username,
      email: profile.email || '',
      tier: profile.tier || 'New Member',
      joinedDate: profile.joinedDate || new Date().toISOString().split('T')[0],
      stats: profile.stats || {
        totalPledges: 0,
        totalVotes: 0,
        dropsJoined: 0,
        followers: 0,
        following: 0
      },
      avatar: profile.avatar || null,
      bio: profile.bio || '',
      lastActive: profile.lastActive || new Date().toISOString()
    };
  };

  // Enhanced load users function with detailed logging
  const loadUsers = () => {
    console.log('🔄 ADMIN: Starting user load process...');
    setLoading(true);
    
    // Clear any cached data and force fresh scan
    setTimeout(() => {
      const allUsers = getAllUsers();
      console.log(`🎯 ADMIN: Setting ${allUsers.length} users in state`);
      setUsers(allUsers);
      setLoading(false);
      
      // Log storage state for debugging
      console.log('🐛 ADMIN: Current localStorage state:');
      console.log('- Registry keys:', Object.keys(localStorage).filter(k => k.includes('registry')));
      console.log('- Session keys:', Object.keys(localStorage).filter(k => k.includes('Session')));
      console.log('- Profile keys:', Object.keys(localStorage).filter(k => k.includes('profile') || k.includes('Profile')));
      console.log('- User keys:', Object.keys(localStorage).filter(k => k.startsWith('user_')));
    }, 100);
  };

  // Initial load
  useEffect(() => {
    console.log('🚀 ADMIN: Component mounted, starting initial load...');
    loadUsers();
  }, [refreshKey]);

  // Enhanced auto-refresh with better logging
  useEffect(() => {
    console.log('🔄 ADMIN: Setting up auto-refresh interval...');
    const interval = setInterval(() => {
      console.log('⏰ ADMIN: Auto-refresh triggered');
      loadUsers();
    }, 5000); // Reduced to 5 seconds for faster detection

    return () => {
      console.log('🛑 ADMIN: Cleaning up auto-refresh interval');
      clearInterval(interval);
    };
  }, []);

  // Enhanced storage listener
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      console.log('👂 ADMIN: Storage change detected:', e.key, e.newValue ? 'added/updated' : 'removed');
      if (e.key && (
        e.key.includes('user') || 
        e.key.includes('User') || 
        e.key.includes('registry') ||
        e.key.includes('Session') ||
        e.key.includes('profile') ||
        e.key.includes('Profile')
      )) {
        console.log('🔄 ADMIN: User-related storage change, refreshing...');
        setTimeout(loadUsers, 500);
      }
    };

    // Also listen for manual localStorage changes in same tab
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
      originalSetItem.call(this, key, value);
      if (key.includes('user') || key.includes('User') || key.includes('registry') || key.includes('Session')) {
        console.log('📝 ADMIN: Manual localStorage write detected:', key);
        setTimeout(loadUsers, 500);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      localStorage.setItem = originalSetItem;
    };
  }, []);

  // Force refresh function with detailed logging
  const forceRefresh = () => {
    console.log('🔄 ADMIN: FORCE REFRESH initiated by user');
    setRefreshKey(prev => prev + 1);
    
    // Also trigger a manual comprehensive scan
    console.log('🔍 ADMIN: Running immediate comprehensive scan...');
    const foundUsers = getAllUsers();
    console.log(`📊 ADMIN: Force refresh found ${foundUsers.length} users`);
    setUsers(foundUsers);
  };

  // Filter and sort users
  const filteredUsers = users
    .filter(user => {
      const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTier = filterTier === 'all' || user.tier === filterTier;
      return matchesSearch && matchesTier;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'username':
          return a.username.localeCompare(b.username);
        case 'joinedDate':
          return new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime();
        case 'tier':
          return a.tier.localeCompare(b.tier);
        default:
          return 0;
      }
    });

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'MIGISTUS':
        return 'text-yellow-400 bg-yellow-400/10';
      case 'Guild':
        return 'text-purple-400 bg-purple-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getTierEmoji = (tier: string) => {
    switch (tier) {
      case 'MIGISTUS':
        return '👑';
      case 'Guild':
        return '⚔️';
      default:
        return '🛡️';
    }
  };

  if (!isAuthenticated || user?.email !== 'admin@migistus.com') {
    return (
      <>
        <Head>
          <title>Access Denied - MIGISTUS</title>
        </Head>
        <MainNavbar />
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
            <p className="text-gray-400">You don't have permission to access this page.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>User Management - MIGISTUS Admin</title>
      </Head>

      <MainNavbar />

      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white">
        <div className="px-4 sm:px-8 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header with Enhanced Controls */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                    <span>👥</span> User Management
                  </h1>
                  <p className="text-gray-400">
                    Comprehensive scan - Total Users Found: {users.length}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={forceRefresh}
                    className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    🔄 Force Refresh
                  </button>
                  <button
                    onClick={() => {
                      console.log('🐛 ADMIN: Manual storage dump triggered');
                      console.log('=== COMPLETE STORAGE DUMP ===');
                      Object.keys(localStorage).forEach(key => {
                        console.log(`${key}:`, localStorage.getItem(key));
                      });
                    }}
                    className="px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    🐛 Debug Log
                  </button>
                  <div className="px-4 py-2 bg-zinc-800 text-gray-300 rounded-lg text-sm">
                    Auto-refresh: Every 5s
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-700 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Search Users
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by username or email..."
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                  />
                </div>

                {/* Sort */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                  >
                    <option value="username">Username</option>
                    <option value="joinedDate">Join Date</option>
                    <option value="tier">Tier</option>
                  </select>
                </div>

                {/* Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Filter by Tier
                  </label>
                  <select
                    value={filterTier}
                    onChange={(e) => setFilterTier(e.target.value)}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                  >
                    <option value="all">All Tiers</option>
                    <option value="New Member">New Member</option>
                    <option value="Guild">Guild</option>
                    <option value="MIGISTUS">MIGISTUS</option>
                  </select>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-6 border-t border-zinc-700">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {users.length}
                  </div>
                  <div className="text-sm text-gray-400">Total Users</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">
                    {users.filter(u => u.tier === 'MIGISTUS').length}
                  </div>
                  <div className="text-sm text-gray-400">MIGISTUS</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    {users.filter(u => u.tier === 'Guild').length}
                  </div>
                  <div className="text-sm text-gray-400">Guild</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-400">
                    {users.filter(u => u.tier === 'New Member').length}
                  </div>
                  <div className="text-sm text-gray-400">New Members</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {users.reduce((sum, u) => sum + u.stats.totalPledges, 0)}
                  </div>
                  <div className="text-sm text-gray-400">Total Pledges</div>
                </div>
              </div>
            </div>

            {/* Users List */}
            <div className="bg-zinc-900 rounded-xl border border-zinc-700 overflow-hidden">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="text-yellow-400 text-xl flex items-center justify-center gap-2">
                    <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                    Scanning for users...
                  </div>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-4xl mb-4">👤</div>
                  <h3 className="text-lg font-semibold text-gray-300 mb-2">No Users Found</h3>
                  <p className="text-gray-400 mb-4">
                    {searchTerm ? 'Try adjusting your search criteria' : 'No users found in any storage system'}
                  </p>
                  <button
                    onClick={forceRefresh}
                    className="px-4 py-2 bg-yellow-400 text-black font-medium rounded-lg hover:bg-yellow-300 transition-colors"
                  >
                    🔄 Refresh Now
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-zinc-800 border-b border-zinc-700">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">User</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Email</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Tier</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Joined</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Activity</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-700">
                      {filteredUsers.map((userData) => (
                        <tr key={userData.id} className="hover:bg-zinc-800/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center overflow-hidden">
                                {userData.avatar ? (
                                  <Image
                                    src={userData.avatar}
                                    alt={userData.username}
                                    width={40}
                                    height={40}
                                    className="object-cover rounded-full"
                                  />
                                ) : (
                                  <Image
                                    src="/Icons/New Member.png"
                                    alt="Default Avatar"
                                    width={40}
                                    height={40}
                                    className="object-contain"
                                  />
                                )}
                              </div>
                              <div>
                                <div className="font-medium text-white">{userData.username}</div>
                                <div className="text-sm text-gray-400">ID: {userData.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-300">{userData.email}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getTierColor(userData.tier)}`}>
                              <span>{getTierEmoji(userData.tier)}</span>
                              {userData.tier}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-300">
                            {new Date(userData.joinedDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-300">
                              <div>Pledges: {userData.stats.totalPledges}</div>
                              <div>Votes: {userData.stats.totalVotes}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  const userSlug = userData.username.toLowerCase().replace(/[^a-z0-9]/g, '-');
                                  window.open(`/account/profile/${userSlug}`, '_blank');
                                }}
                                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                              >
                                View
                              </button>
                              <button className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors">
                                Edit
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Enhanced Debug Info */}
            <div className="mt-8 bg-zinc-900 rounded-xl p-6 border border-zinc-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-yellow-400">Enhanced Debug Information</h3>
                <div className="text-sm text-gray-400">
                  Last scan: {new Date().toLocaleTimeString()}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <h4 className="font-medium text-white mb-2">Storage Systems</h4>
                  <ul className="space-y-1 text-gray-400">
                    <li>• Registry: {Object.keys(JSON.parse(localStorage.getItem('migistus_user_registry') || '{}')).length}</li>
                    <li>• New profiles: {Object.keys(localStorage).filter(k => k.startsWith('user_') && k.endsWith('_profile')).length}</li>
                    <li>• Old profiles: {Object.keys(localStorage).filter(k => k.startsWith('userProfile_')).length}</li>
                    <li>• Session: {localStorage.getItem('userSession') ? 'Active' : 'None'}</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-white mb-2">Detection Stats</h4>
                  <div className="text-gray-400">
                    <p>Total found: {users.length}</p>
                    <p>Displayed: {filteredUsers.length}</p>
                    <p>Refresh count: {refreshKey}</p>
                    <p>Loading: {loading ? 'Yes' : 'No'}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-white mb-2">Real-time Monitoring</h4>
                  <div className="text-gray-400">
                    <p>✅ Auto-refresh: 5s</p>
                    <p>✅ Storage listener: Active</p>
                    <p>✅ Manual refresh: Available</p>
                    <p>✅ Comprehensive scan: Enabled</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-white mb-2">User Sources</h4>
                  <div className="text-gray-400 text-xs">
                    {users.map(u => (
                      <div key={u.id}>• {u.username} ({u.id})</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
