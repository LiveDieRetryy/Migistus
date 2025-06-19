import { UserStorage3 as UserStorage } from './userStorage';

export interface BackendUser {
  id: number;
  username: string;
  email: string;
  tier: string;
  joinedDate: string;
  lastActive: string;
  stats: {
    totalPledges: number;
    totalVotes: number;
    dropsJoined: number;
    followers: number;
    following: number;
  };
  profile: {
    bio?: string;
    avatar?: string;
    links: Array<{ name: string; url: string }>;
  };
  status: 'active' | 'inactive' | 'banned';
  guildTokens: number;
}

export class UserSyncService {
  private static readonly KINGS_DOMAIN_URL = process.env.NEXT_PUBLIC_KINGS_DOMAIN_URL || 'http://localhost:3001';
  private static readonly SYNC_INTERVAL = 30000; // 30 seconds for better performance
  private static syncTimer: NodeJS.Timeout | null = null;
  private static isOnline = true;
  private static lastSyncData: string = '';
  private static syncCount = 0;
  private static isInitialized = false;

  // Updated getAllUsersForBackend to match admin/community methods
  static getAllUsersForBackend(): BackendUser[] {
    const users: BackendUser[] = [];
    const userIds = new Set<number>();

    if (typeof window === 'undefined') return users;

    console.log('🔍 Sync: Scanning for users in all storage systems...');

    try {
      // Use the SAME method as admin and community pages
      
      // 1. Get users from registry system (PRIMARY)
      const userRegistry = JSON.parse(localStorage.getItem('migistus_user_registry') || '{}');
      console.log('📋 Sync: User registry entries:', Object.keys(userRegistry).length);
      
      Object.entries(userRegistry).forEach(([email, userData]: [string, any]) => {
        if (userData.id && !userIds.has(userData.id)) {
          let profile = this.getProfileForUser(userData.id);
          
          if (!profile) {
            profile = {
              id: userData.id,
              username: userData.username || `user_${userData.id}`,
              email: userData.email || email,
              bio: '',
              tier: 'New Member',
              joinedDate: new Date().toISOString().split('T')[0],
              stats: { totalPledges: 0, totalVotes: 0, dropsJoined: 0, followers: 0, following: 0 }
            };
            
            // Save the created profile
            try {
              localStorage.setItem(`user_${userData.id}_profile`, JSON.stringify(profile));
            } catch (error) {
              console.warn('Failed to save generated profile');
            }
          }
          
          if (profile.username) {
            const backendUser = this.createBackendUser(profile);
            users.push(backendUser);
            userIds.add(userData.id);
            console.log(`✅ Sync: Added registry user: ${profile.username} (ID: ${userData.id})`);
          }
        }
      });

      // 2. Get users from current session
      const currentSession = localStorage.getItem('userSession');
      if (currentSession) {
        try {
          const session = JSON.parse(currentSession);
          if (session.user && session.user.id && !userIds.has(session.user.id)) {
            let profile = this.getProfileForUser(session.user.id);
            
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
              const backendUser = this.createBackendUser(profile);
              users.push(backendUser);
              userIds.add(session.user.id);
              console.log(`✅ Sync: Added session user: ${profile.username} (ID: ${session.user.id})`);
            }
          }
        } catch (error) {
          console.warn('Sync: Error processing session user:', error);
        }
      }

      // 3. Get users from new user_ storage system
      const newProfileKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('user_') && key.endsWith('_profile')
      );
      console.log('🗂️ Sync: Found', newProfileKeys.length, 'new-style profiles');
      
      newProfileKeys.forEach(key => {
        try {
          const profile = JSON.parse(localStorage.getItem(key) || '{}');
          
          if (profile.id && profile.username && !userIds.has(profile.id)) {
            const backendUser = this.createBackendUser(profile);
            users.push(backendUser);
            userIds.add(profile.id);
            console.log(`✅ Sync: Added new storage user: ${profile.username} (ID: ${profile.id})`);
          }
        } catch (error) {
          console.error('Sync: Error parsing new profile:', key, error);
        }
      });

      // 4. Get users from old userProfile_ system
      const oldProfileKeys = Object.keys(localStorage).filter(key => key.startsWith('userProfile_'));
      console.log('📁 Sync: Found', oldProfileKeys.length, 'old-style profiles');
      
      oldProfileKeys.forEach(key => {
        try {
          const profile = JSON.parse(localStorage.getItem(key) || '{}');
          
          if (profile.id && profile.username && !userIds.has(profile.id)) {
            const backendUser = this.createBackendUser(profile);
            users.push(backendUser);
            userIds.add(profile.id);
            console.log(`✅ Sync: Added old storage user: ${profile.username} (ID: ${profile.id})`);
          }
        } catch (error) {
          console.error('Sync: Error parsing old profile:', key, error);
        }
      });

      console.log(`📊 Sync: Total unique users found: ${users.length}`);
      console.log('Sync Users:', users.map(u => `${u.username}(${u.id})`).join(', '));

    } catch (error) {
      console.error('❌ Sync: Error getting users for backend:', error);
    }

    return users;
  }

  // Helper method to get profile for a user ID
  private static getProfileForUser(userId: number): any {
    // Try new storage first
    try {
      const profile = UserStorage?.getUserProfile?.(userId);
      if (profile) return profile;
    } catch (error) {
      // Continue to manual methods
    }

    // Try manual new storage
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
  }

  // Helper method to create BackendUser object
  private static createBackendUser(profile: any): BackendUser {
    return {
      id: profile.id,
      username: profile.username,
      email: profile.email || '',
      tier: profile.tier || 'New Member',
      joinedDate: profile.joinedDate || new Date().toISOString().split('T')[0],
      lastActive: new Date().toISOString(),
      stats: profile.stats || {
        totalPledges: 0,
        totalVotes: 0,
        dropsJoined: 0,
        followers: 0,
        following: 0
      },
      profile: {
        bio: profile.bio || '',
        avatar: profile.avatar || null,
        links: profile.links || []
      },
      status: 'active',
      guildTokens: profile.guildTokens || 0
    };
  }

  // Enhanced sync method with better error handling
  static async syncUsersToBackend(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    try {
      const users = this.getAllUsersForBackend();
      const syncData = {
        users,
        totalUsers: users.length,
        timestamp: new Date().toISOString(),
        source: 'migistus-frontend',
        stats: this.getUserStats(),
        syncCount: this.syncCount
      };

      console.log(`🚀 Sync #${this.syncCount}: Attempting to sync ${users.length} users...`);

      if (users.length === 0) {
        console.warn('⚠️ No users found to sync!');
        return false;
      }

      // Check if data actually changed
      const currentDataHash = JSON.stringify(users.map(u => ({ id: u.id, username: u.username, lastActive: u.lastActive })));
      const hasChanged = currentDataHash !== this.lastSyncData;
      
      if (!hasChanged && this.syncCount > 1) {
        if (this.syncCount % 5 === 0) {
          console.log(`🔄 Sync #${this.syncCount}: No changes detected, skipping...`);
        }
        return true;
      }

      this.lastSyncData = currentDataHash;

      // Sync to local API
      const localApiSuccess = await this.syncToLocalAPI(syncData);
      
      // Store for King's Domain to read
      this.storeForKingsDomain(syncData);

      // Try to sync directly to King's Domain if configured
      let directSyncSuccess = false;
      if (this.KINGS_DOMAIN_URL && !this.KINGS_DOMAIN_URL.includes('localhost:3001')) {
        directSyncSuccess = await this.syncToKingsDomain(syncData);
      }

      console.log(`✅ Sync #${this.syncCount} completed:`, {
        localApi: localApiSuccess,
        directSync: directSyncSuccess,
        usersCount: users.length
      });

      return localApiSuccess;
    } catch (error) {
      console.error('❌ Sync failed:', error);
      return false;
    }
  }

  // Improved local API sync
  private static async syncToLocalAPI(data: any): Promise<boolean> {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Source': 'migistus-sync',
          'X-Sync-Count': this.syncCount.toString()
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`API responded with ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('📡 Local API sync result:', result);
      return true;
    } catch (error) {
      console.error('❌ Local API sync failed:', error);
      return false;
    }
  }

  // Improved King's Domain sync
  private static async syncToKingsDomain(data: any): Promise<boolean> {
    try {
      const response = await fetch(`${this.KINGS_DOMAIN_URL}/api/migistus/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_KINGS_DOMAIN_TOKEN || 'migistus-sync'}`,
          'X-Source': 'migistus-frontend'
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        console.log('✅ King\'s Domain direct sync successful');
        return true;
      } else {
        console.warn(`⚠️ King's Domain sync failed: ${response.status}`);
        return false;
      }
    } catch (error) {
      console.warn('⚠️ King\'s Domain sync error:', error);
      return false;
    }
  }

  // Enhanced storage for King's Domain
  private static storeForKingsDomain(data: any): void {
    try {
      const wrappedData = {
        ...data,
        syncTimestamp: Date.now(),
        version: '2.0',
        lastUpdated: new Date().toISOString()
      };

      // Store in multiple places for reliability
      localStorage.setItem('kings_domain_users', JSON.stringify(wrappedData));
      localStorage.setItem('migistus_sync_data', JSON.stringify(wrappedData));
      sessionStorage.setItem('migistus_live_users', JSON.stringify(wrappedData));
      
      // Also store a simple version for debugging
      localStorage.setItem('migistus_user_count', data.totalUsers.toString());
      
      console.log(`💾 Stored ${data.totalUsers} users for King's Domain access`);
    } catch (error) {
      console.error('❌ Failed to store data for King\'s Domain:', error);
    }
  }

  // Initialize and start the sync service
  static initialize(): void {
    if (this.isInitialized) return;
    
    console.log('🚀 Initializing MIGISTUS User Sync Service...');
    
    // Force immediate comprehensive sync
    setTimeout(() => {
      this.triggerManualSync();
    }, 1000);
    
    // Start auto sync
    this.startAutoSync();
    
    this.isInitialized = true;
  }

  // Enhanced auto-sync
  static startAutoSync(): void {
    if (typeof window === 'undefined') return;

    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    console.log('🔄 Starting user auto-sync (every 30 seconds)...');

    this.syncTimer = setInterval(async () => {
      this.syncCount++;
      await this.syncUsersToBackend();
    }, this.SYNC_INTERVAL);

    // Setup change listeners
    this.setupUserChangeListeners();
  }

  // Stop automatic syncing
  static stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
      console.log('🛑 User auto-sync stopped');
    }
  }

  // Listen for user data changes and trigger immediate sync (but throttled)
  private static lastManualSync = 0;
  private static setupUserChangeListeners(): void {
    if (typeof window === 'undefined') return;

    // Listen for localStorage changes
    window.addEventListener('storage', (e) => {
      if (e.key?.includes('user') || e.key?.includes('profile')) {
        this.throttledManualSync();
      }
    });

    // Override localStorage setItem to catch changes in same tab
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key: string, value: string) {
      originalSetItem.call(this, key, value);
      if (key.includes('user') || key.includes('profile')) {
        UserSyncService.throttledManualSync();
      }
    };
  }

  // Throttled manual sync to prevent spam
  private static throttledManualSync(): void {
    const now = Date.now();
    if (now - this.lastManualSync < 5000) { // Minimum 5 seconds between manual syncs
      return;
    }
    this.lastManualSync = now;
    setTimeout(() => this.triggerManualSync(), 1000);
  }

  // Manual sync trigger with immediate response
  static async triggerManualSync(): Promise<boolean> {
    console.log('🔄 Triggering manual user sync...');
    
    try {
      const success = await this.syncUsersToBackend();
      
      // Also trigger immediate update via custom event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('migistus-users-updated', {
          detail: {
            users: this.getAllUsersForBackend(),
            stats: this.getUserStats(),
            timestamp: Date.now()
          }
        }));
      }
      
      return success;
    } catch (error) {
      console.error('❌ Manual sync failed:', error);
      return false;
    }
  }

  // Get user stats for King's Domain dashboard
  static getUserStats() {
    const users = this.getAllUsersForBackend();
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.status === 'active').length,
      newUsersThisMonth: users.filter(u => 
        new Date(u.joinedDate) >= thirtyDaysAgo
      ).length,
      totalPledges: users.reduce((sum, u) => sum + u.stats.totalPledges, 0),
      totalVotes: users.reduce((sum, u) => sum + u.stats.totalVotes, 0),
      totalGuildTokens: users.reduce((sum, u) => sum + u.guildTokens, 0),
      tiers: {
        'New Member': users.filter(u => u.tier === 'New Member').length,
        'Guild': users.filter(u => u.tier === 'Guild').length,
        'MIGISTUS': users.filter(u => u.tier === 'MIGISTUS').length,
      },
      lastUpdated: new Date().toISOString(),
      isOnline: this.isOnline
    };
  }

  // Method for King's Domain to call to get live data
  static getLiveUserData() {
    return {
      users: this.getAllUsersForBackend(),
      stats: this.getUserStats(),
      timestamp: Date.now(),
      source: 'migistus-frontend'
    };
  }
}

// Make the service globally accessible for King's Domain
if (typeof window !== 'undefined') {
  (window as any).MigistusUserSync = UserSyncService;
  
  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => UserSyncService.initialize(), 2000);
    });
  } else {
    setTimeout(() => UserSyncService.initialize(), 2000);
  }
}
