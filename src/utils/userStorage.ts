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
    // Preserve the original timestamp if provided, otherwise use current time
    const activityWithTimestamp = {
      ...activity,
      timestamp: activity.timestamp || new Date().toISOString()
    };
    activities.unshift(activityWithTimestamp);
    const key = `${this.getUserPrefix(userId)}activity`;
    localStorage.setItem(key, JSON.stringify(activities.slice(0, 100))); // Keep last 100 activities
  }

  // Pledges
  static getUserPledges(userId: number) {
    const key = `${this.getUserPrefix(userId)}pledges`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  // Enhanced pledge management
  static addUserPledge(userId: number, pledge: any): void {
    const pledges = this.getUserPledges(userId);
    const newPledge = { 
      ...pledge, 
      id: Date.now(), 
      timestamp: Date.now(),
      status: pledge.status || 'active'
    };
    pledges.push(newPledge);
    const key = `${this.getUserPrefix(userId)}pledges`;
    localStorage.setItem(key, JSON.stringify(pledges));

    // Update activity
    this.addUserActivity(userId, {
      type: 'pledge',
      action: `Pledged $${pledge.amount} for ${pledge.productName || 'product'}`,
      productId: pledge.productId,
      amount: pledge.amount
    });
  }

  static updatePledgeStatus(userId: number, pledgeId: number, status: 'active' | 'completed' | 'cancelled'): void {
    const pledges = this.getUserPledges(userId);
    const pledgeIndex = pledges.findIndex((p: any) => p.id === pledgeId);
    if (pledgeIndex !== -1) {
      pledges[pledgeIndex].status = status;
      pledges[pledgeIndex].updatedAt = Date.now();
      const key = `${this.getUserPrefix(userId)}pledges`;
      localStorage.setItem(key, JSON.stringify(pledges));

      // Update activity
      this.addUserActivity(userId, {
        type: 'pledge',
        action: `Pledge ${status}: ${pledges[pledgeIndex].productName || 'product'}`,
        productId: pledges[pledgeIndex].productId,
        status
      });
    }
  }

  static setUserPledge(userId: number, pledge: any): void {
    const key = `${this.getUserPrefix(userId)}pledges`;
    localStorage.setItem(key, JSON.stringify(pledge));
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

    // Update activity
    this.addUserActivity(userId, {
      type: 'vote',
      action: `Voted for ${vote.productName || 'product'}`,
      productId: vote.productId,
      tier: vote.tier
    });
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

  // Social features
  static getUserFollowers(userId: number): number {
    try {
      const followData = JSON.parse(localStorage.getItem('migistus_follows') || '[]');
      return followData.filter((follow: any) => follow.followingId === userId).length;
    } catch {
      return Math.floor(Math.random() * 50) + 10;
    }
  }

  static getUserFollowing(userId: number): number {
    try {
      const followData = JSON.parse(localStorage.getItem('migistus_follows') || '[]');
      return followData.filter((follow: any) => follow.followerId === userId).length;
    } catch {
      return Math.floor(Math.random() * 30) + 5;
    }
  }

  static followUser(followerId: number, followingId: number): boolean {
    if (followerId === followingId) return false;
    
    try {
      const followData = JSON.parse(localStorage.getItem('migistus_follows') || '[]');
      const existingFollow = followData.find(
        (follow: any) => follow.followerId === followerId && follow.followingId === followingId
      );
      
      if (!existingFollow) {
        followData.push({
          followerId,
          followingId,
          timestamp: new Date().toISOString()
        });
        localStorage.setItem('migistus_follows', JSON.stringify(followData));
        
        // Sync with API to update database
        fetch('/api/followers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ followerId, followingId, action: 'follow' })
        }).catch(err => console.error('Failed to sync follow with API:', err));
        
        // Get usernames for better activity descriptions
        const followerProfile = this.getUserProfile(followerId);
        const followingProfile = this.getUserProfile(followingId);
        
        const followerName = followerProfile?.username || `User ${followerId}`;
        const followingName = followingProfile?.username || `User ${followingId}`;
        
        // Track activity for follower
        this.addUserActivity(followerId, {
          type: 'social',
          action: `Started following ${followingName}`,
          targetUserId: followingId,
          description: `You are now following ${followingName}`
        });
        
        // Track activity for the person being followed
        this.addUserActivity(followingId, {
          type: 'social', 
          action: `${followerName} started following you`,
          targetUserId: followerId,
          description: `${followerName} is now following you`
        });
        
        // Increment reputation of the person being followed (+1 rep per follower)
        this.incrementReputation(followingId, 1);
        
        // Trigger live update event
        window.dispatchEvent(new CustomEvent('followerUpdate', {
          detail: { followerId, followingId, action: 'follow' }
        }));
        
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  static unfollowUser(followerId: number, followingId: number): boolean {
    try {
      const followData = JSON.parse(localStorage.getItem('migistus_follows') || '[]');
      const followIndex = followData.findIndex(
        (follow: any) => follow.followerId === followerId && follow.followingId === followingId
      );
      
      if (followIndex !== -1) {
        followData.splice(followIndex, 1);
        localStorage.setItem('migistus_follows', JSON.stringify(followData));
        
        // Sync with API to update database
        fetch('/api/followers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ followerId, followingId, action: 'unfollow' })
        }).catch(err => console.error('Failed to sync unfollow with API:', err));
        
        // Get usernames for better activity descriptions
        const followerProfile = this.getUserProfile(followerId);
        const followingProfile = this.getUserProfile(followingId);
        
        const followerName = followerProfile?.username || `User ${followerId}`;
        const followingName = followingProfile?.username || `User ${followingId}`;
        
        // Track activity for unfollower
        this.addUserActivity(followerId, {
          type: 'social',
          action: `Unfollowed ${followingName}`,
          targetUserId: followingId,
          description: `You unfollowed ${followingName}`
        });
        
        // Track activity for the person being unfollowed
        this.addUserActivity(followingId, {
          type: 'social',
          action: `${followerName} unfollowed you`,
          targetUserId: followerId,
          description: `${followerName} unfollowed you`
        });
        
        // Decrement reputation of the person being unfollowed (-1 rep per lost follower)
        this.decrementReputation(followingId, 1);
        
        // Trigger live update event
        window.dispatchEvent(new CustomEvent('followerUpdate', {
          detail: { followerId, followingId, action: 'unfollow' }
        }));
        
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  static isFollowing(followerId: number, followingId: number): boolean {
    try {
      const followData = JSON.parse(localStorage.getItem('migistus_follows') || '[]');
      return followData.some(
        (follow: any) => follow.followerId === followerId && follow.followingId === followingId
      );
    } catch {
      return false;
    }
  }

  static getFollowersList(userId: number): any[] {
    try {
      const followData = JSON.parse(localStorage.getItem('migistus_follows') || '[]');
      return followData
        .filter((follow: any) => follow.followingId === userId)
        .map((follow: any) => ({
          userId: follow.followerId,
          timestamp: follow.timestamp
        }));
    } catch {
      return [];
    }
  }  static getFollowingList(userId: number): any[] {
    try {
      const followData = JSON.parse(localStorage.getItem('migistus_follows') || '[]');
      return followData
        .filter((follow: any) => follow.followerId === userId)
        .map((follow: any) => ({
          userId: follow.followingId,
          timestamp: follow.timestamp
        }));
    } catch {
      return [];
    }
  }

  static getUserReputation(userId: number): number {
    const key = `${this.getUserPrefix(userId)}reputation`;
    const data = localStorage.getItem(key);
    
    // If no data exists, initialize with 0 and save it
    if (!data) {
      localStorage.setItem(key, '0');
      return 0;
    }
    
    return parseInt(data);
  }

  static incrementReputation(userId: number, amount: number = 1): void {
    const current = this.getUserReputation(userId);
    const key = `${this.getUserPrefix(userId)}reputation`;
    localStorage.setItem(key, String(current + amount));
  }

  static decrementReputation(userId: number, amount: number = 1): void {
    const current = this.getUserReputation(userId);
    const key = `${this.getUserPrefix(userId)}reputation`;
    localStorage.setItem(key, String(Math.max(0, current - amount)));
  }

  static getUserProfileViews(userId: number): number {
    const key = `${this.getUserPrefix(userId)}profileViews`;
    const data = localStorage.getItem(key);
    
    // If no data exists, initialize with 0 and save it
    if (!data) {
      localStorage.setItem(key, '0');
      return 0;
    }
    
    return parseInt(data);
  }

  static incrementProfileViews(userId: number): void {
    const current = this.getUserProfileViews(userId);
    const key = `${this.getUserPrefix(userId)}profileViews`;
    localStorage.setItem(key, String(current + 1));
  }

  static getUserInteractions(userId: number): number {
    const key = `${this.getUserPrefix(userId)}interactions`;
    const data = localStorage.getItem(key);
    
    // If no data exists, initialize with 0 and save it
    if (!data) {
      localStorage.setItem(key, '0');
      return 0;
    }
    
    return parseInt(data);
  }

  static incrementInteractions(userId: number): void {
    const current = this.getUserInteractions(userId);
    const key = `${this.getUserPrefix(userId)}interactions`;
    localStorage.setItem(key, String(current + 1));
  }

  // Enhanced stats calculation
  static calculateUserStats(userId: number) {
    const pledges = this.getUserPledges(userId);
    const votes = this.getUserVotes(userId);
    const drops = this.getUserDrops(userId);
    
    return {
      totalPledges: pledges.length,
      totalVotes: votes.length,
      dropsJoined: drops.length,
      followers: this.getUserFollowers(userId),
      following: this.getUserFollowing(userId),
      reputation: this.getUserReputation(userId),
      profileViews: this.getUserProfileViews(userId),
      interactions: this.getUserInteractions(userId),
      completedPledges: pledges.filter((p: any) => p.status === 'completed').length,
      activePledges: pledges.filter((p: any) => p.status === 'active').length,
      totalPledgeAmount: pledges.reduce((sum: number, p: any) => sum + (p.amount || 0), 0),
      successRate: pledges.length > 0 ? 
        (pledges.filter((p: any) => p.status === 'completed').length / pledges.length) * 100 : 0
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

  // Social interaction tracking for likes and comments
  static addUserLike(userId: number, target: any): void {
    this.addUserActivity(userId, {
      type: 'like',
      action: `Liked ${target.type || 'content'}`,
      targetId: target.id,
      description: target.description || ''
    });
  }

  static addUserComment(userId: number, comment: any): void {
    this.addUserActivity(userId, {
      type: 'comment',
      action: `Commented on ${comment.targetType || 'content'}`,
      targetId: comment.targetId,
      message: comment.message || '',
      description: comment.description || ''
    });
  }

  // Daily vote tracking utilities
  static getTodaysVotes(userId: number) {
    const votes = this.getUserVotes(userId);
    const today = new Date().toDateString();
    return votes.filter((vote: any) => {
      const voteDate = vote.timestamp ? new Date(vote.timestamp).toDateString() : new Date(vote.timestamp).toDateString();
      return voteDate === today;
    });
  }

  static getTodaysVoteCount(userId: number): number {
    return this.getTodaysVotes(userId).length;
  }

  static hasVotedTodayForProduct(userId: number, productId: any): boolean {
    const todaysVotes = this.getTodaysVotes(userId);
    return todaysVotes.some((vote: any) => vote.productId === productId);
  }
}
