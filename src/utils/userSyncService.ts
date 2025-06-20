import { UserStorage3 as UserStorage } from './userStorage';

export class UserSyncService {
  private static instance: UserSyncService;
  private isInitialized = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private lastSync: number = 0;
  private isSyncing = false;

  static getInstance(): UserSyncService {
    if (!UserSyncService.instance) {
      UserSyncService.instance = new UserSyncService();
    }
    return UserSyncService.instance;
  }

  initialize() {
    if (this.isInitialized || typeof window === 'undefined') return;
    
    this.isInitialized = true;
    console.log('UserSyncService initialized');
    
    this.startAutoSync();
    
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.triggerManualSync();
      }
    });

    window.addEventListener('focus', () => {
      this.triggerManualSync();
    });

    (window as any).MigistusUserSync = this;
  }

  private startAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      this.triggerManualSync();
    }, 5 * 60 * 1000);
  }

  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  async triggerManualSync(): Promise<void> {
    if (this.isSyncing || typeof window === 'undefined') return;
    
    const now = Date.now();
    if (now - this.lastSync < 30000) return;

    this.isSyncing = true;
    this.lastSync = now;

    try {
      await this.syncUsersToBackend();
      console.log('User sync completed successfully');
    } catch (error) {
      console.warn('User sync failed:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  private async syncUsersToBackend(): Promise<void> {
    try {
      const users = this.getAllLocalUsers();
      
      if (users.length === 0) {
        console.log('No users to sync');
        return;
      }

      console.log(`Syncing ${users.length} users to backend`);
      await this.syncToLocalAPI(users);
      
    } catch (error) {
      console.error('Failed to sync users to backend:', error);
      throw error;
    }
  }

  private getAllLocalUsers() {
    const users: any[] = [];
    const userIds = new Set<number>();

    try {
      const registry = JSON.parse(localStorage.getItem('migistus_user_registry') || '{}');
      Object.values(registry).forEach((userData: any) => {
        if (userData.id && !userIds.has(userData.id)) {
          userIds.add(userData.id);
          users.push({
            id: userData.id,
            username: userData.username,
            email: userData.email,
            tier: userData.tier || 'Initiate',
            banned: userData.banned || false,
            joinDate: userData.joinDate || new Date().toISOString().split('T')[0],
            lastLogin: new Date().toISOString().split('T')[0],
            wallet: UserStorage.getUserWalletBalance(userData.id),
            guildCoins: UserStorage.getUserGuildCoins(userData.id)
          });
        }
      });

      const profiles = UserStorage.getAllUserProfiles();
      profiles.forEach(profile => {
        if (profile.id && !userIds.has(profile.id)) {
          userIds.add(profile.id);
          users.push({
            id: profile.id,
            username: profile.username,
            email: profile.email,
            tier: profile.tier || 'Initiate',
            banned: false,
            joinDate: profile.joinedDate || new Date().toISOString().split('T')[0],
            lastLogin: new Date().toISOString().split('T')[0],
            wallet: UserStorage.getUserWalletBalance(profile.id),
            guildCoins: UserStorage.getUserGuildCoins(profile.id)
          });
        }
      });

      const session = localStorage.getItem('userSession');
      if (session) {
        try {
          const sessionData = JSON.parse(session);
          if (sessionData.user && !userIds.has(sessionData.user.id)) {
            userIds.add(sessionData.user.id);
            users.push({
              id: sessionData.user.id,
              username: sessionData.user.username,
              email: sessionData.user.email,
              tier: sessionData.user.tier || 'Initiate',
              banned: sessionData.user.banned || false,
              joinDate: new Date().toISOString().split('T')[0],
              lastLogin: new Date().toISOString().split('T')[0],
              wallet: UserStorage.getUserWalletBalance(sessionData.user.id),
              guildCoins: UserStorage.getUserGuildCoins(sessionData.user.id)
            });
          }
        } catch (error) {
          console.warn('Failed to parse session data:', error);
        }
      }

      console.log(`Found ${users.length} unique users to sync`);
      return users;
    } catch (error) {
      console.error('Failed to get local users:', error);
      return [];
    }
  }

  private async syncToLocalAPI(users: any[]): Promise<void> {
    try {
      let existingUsers: any[] = [];
      try {
        const response = await fetch('/api/users', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          const data = await response.json();
          existingUsers = Array.isArray(data.users) ? data.users : [];
        }
      } catch (error) {
        console.warn('Failed to fetch existing users, proceeding with sync:', error);
      }

      const existingIds = new Set(existingUsers.map(u => u.id));
      const newUsers = users.filter(u => !existingIds.has(u.id));

      if (newUsers.length === 0) {
        console.log('No new users to sync');
        return;
      }

      console.log(`Syncing ${newUsers.length} new users`);

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUsers)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`API responded with ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Sync result:', result);

    } catch (error) {
      console.error('Failed to sync to local API:', error);
      throw error;
    }
  }

  async addUserAndSync(userData: any): Promise<void> {
    try {
      const registry = JSON.parse(localStorage.getItem('migistus_user_registry') || '{}');
      registry[userData.email.toLowerCase()] = userData;
      localStorage.setItem('migistus_user_registry', JSON.stringify(registry));

      await this.syncToLocalAPI([userData]);
      
      console.log('User added and synced successfully:', userData.username);
    } catch (error) {
      console.error('Failed to add user and sync:', error);
      throw error;
    }
  }

  getSyncStatus() {
    return {
      isInitialized: this.isInitialized,
      isSyncing: this.isSyncing,
      lastSync: this.lastSync,
      timeSinceLastSync: this.lastSync ? Date.now() - this.lastSync : null
    };
  }

  async forceFullSync(): Promise<void> {
    this.lastSync = 0;
    await this.triggerManualSync();
  }
}

export const userSyncService = UserSyncService.getInstance();

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      userSyncService.initialize();
    });
  } else {
    userSyncService.initialize();
  }
}
