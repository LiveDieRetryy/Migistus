export class UserStorage3 {
  private static getUserPrefix(userId: number): string {
    return `user_${userId}_`;
  }

  // Clear all data for a specific user
  static clearUserData(userId: number): void {
    const prefix = this.getUserPrefix(userId);
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(prefix)) {
        localStorage.removeItem(key);
      }
    });
  }

  // Clear all user data (for complete reset)
  static clearAllUserData(): void {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('user_') || key.includes('userProfile_') || key.includes('userSession')) {
        localStorage.removeItem(key);
      }
    });
  }

  // Profile management
  static getUserProfile(userId: number) {
    const key = `${this.getUserPrefix(userId)}profile`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  static setUserProfile(userId: number, profile: any): void {
    const key = `${this.getUserPrefix(userId)}profile`;
    localStorage.setItem(key, JSON.stringify(profile));
  }

  // Activity tracking
  static getUserActivity(userId: number) {
    const key = `${this.getUserPrefix(userId)}activity`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  static addUserActivity(userId: number, activity: any): void {
    const activities = this.getUserActivity(userId);
    activities.unshift({ ...activity, timestamp: Date.now() });
    const key = `${this.getUserPrefix(userId)}activity`;
    localStorage.setItem(key, JSON.stringify(activities.slice(0, 100))); // Keep last 100 activities
  }

  // Pledges
  static getUserPledges(userId: number) {
    const key = `${this.getUserPrefix(userId)}pledges`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  static addUserPledge(userId: number, pledge: any): void {
    const pledges = this.getUserPledges(userId);
    pledges.push({ ...pledge, id: Date.now(), timestamp: Date.now() });
    const key = `${this.getUserPrefix(userId)}pledges`;
    localStorage.setItem(key, JSON.stringify(pledges));
  }

  // Votes
  static getUserVotes(userId: number) {
    const key = `${this.getUserPrefix(userId)}votes`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  static addUserVote(userId: number, vote: any): void {
    const votes = this.getUserVotes(userId);
    votes.push({ ...vote, id: Date.now(), timestamp: Date.now() });
    const key = `${this.getUserPrefix(userId)}votes`;
    localStorage.setItem(key, JSON.stringify(votes));
  }

  // Drops joined
  static getUserDrops(userId: number) {
    const key = `${this.getUserPrefix(userId)}drops`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  static addUserDrop(userId: number, drop: any): void {
    const drops = this.getUserDrops(userId);
    drops.push({ ...drop, id: Date.now(), timestamp: Date.now() });
    const key = `${this.getUserPrefix(userId)}drops`;
    localStorage.setItem(key, JSON.stringify(drops));
  }

  // Settings
  static getUserSettings(userId: number) {
    const key = `${this.getUserPrefix(userId)}settings`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : {
      notifications: true,
      privacy: 'public',
      theme: 'dark'
    };
  }

  static setUserSettings(userId: number, settings: any): void {
    const key = `${this.getUserPrefix(userId)}settings`;
    localStorage.setItem(key, JSON.stringify(settings));
  }

  // Wallet balance
  static getUserWalletBalance(userId: number): number {
    const key = `${this.getUserPrefix(userId)}wallet`;
    const data = localStorage.getItem(key);
    return data ? Number(data) : 0;
  }

  static setUserWalletBalance(userId: number, amount: number): void {
    const key = `${this.getUserPrefix(userId)}wallet`;
    localStorage.setItem(key, String(amount));
  }

  static incrementUserWallet(userId: number, amount: number): void {
    const current = this.getUserWalletBalance(userId);
    this.setUserWalletBalance(userId, current + amount);
  }

  static decrementUserWallet(userId: number, amount: number): void {
    const current = this.getUserWalletBalance(userId);
    this.setUserWalletBalance(userId, Math.max(0, current - amount));
  }

  // Guild Coins
  static getUserGuildCoins(userId: number): number {
    const key = `${this.getUserPrefix(userId)}guildCoins`;
    const data = localStorage.getItem(key);
    return data ? Number(data) : 0;
  }

  static setUserGuildCoins(userId: number, amount: number): void {
    const key = `${this.getUserPrefix(userId)}guildCoins`;
    localStorage.setItem(key, String(amount));
  }

  static incrementUserGuildCoins(userId: number, amount: number): void {
    const current = this.getUserGuildCoins(userId);
    this.setUserGuildCoins(userId, current + amount);
  }

  static decrementUserGuildCoins(userId: number, amount: number): void {
    const current = this.getUserGuildCoins(userId);
    this.setUserGuildCoins(userId, Math.max(0, current - amount));
  }

  // Calculate user stats
  static calculateUserStats(userId: number) {
    return {
      totalPledges: this.getUserPledges(userId).length,
      totalVotes: this.getUserVotes(userId).length,
      dropsJoined: this.getUserDrops(userId).length,
      followers: 0, // Will implement later
      following: 0, // Will implement later
    };
  }

  // Get all user profiles for discovery
  static getAllUserProfiles() {
    const profiles: any[] = [];
    
    // Get users from new system
    const userMap = JSON.parse(localStorage.getItem('userEmailMap') || '{}');
    Object.values(userMap).forEach((userData: any) => {
      const profile = this.getUserProfile(userData.id);
      if (profile) {
        profiles.push({
          ...profile,
          stats: this.calculateUserStats(userData.id)
        });
      }
    });
    
    // Get users from old system
    const oldProfileKeys = Object.keys(localStorage).filter(key => key.startsWith('userProfile_'));
    oldProfileKeys.forEach(key => {
      try {
        const profile = JSON.parse(localStorage.getItem(key) || '{}');
        const userId = parseInt(key.replace('userProfile_', ''));
        
        // Skip if already exists in new system
        if (profiles.some(p => p.id === userId)) {
          return;
        }
        
        if (profile.id && profile.username) {
          profiles.push({
            ...profile,
            stats: profile.stats || this.calculateUserStats(userId)
          });
        }
      } catch (error) {
        console.error('Error parsing old profile:', error);
      }
    });
    
    return profiles;
  }
}
