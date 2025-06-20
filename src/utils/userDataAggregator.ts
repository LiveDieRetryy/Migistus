import { UserStorage3 as UserStorage } from './userStorage';

export interface ComprehensiveUserData {
  // Basic Info
  id: number;
  username: string;
  email: string;
  tier: string;
  banned: boolean;
  joinDate: string;
  lastLogin: string;
  
  // Financial
  wallet: number;
  guildCoins: number;
  
  // Activity Stats
  totalPledges: number;
  totalVotes: number;
  totalDropsJoined: number;
  totalSessions: number;
  totalPageViews: number;
  totalChatMessages: number;
  
  // Live Status
  isOnline: boolean;
  currentPage?: string;
  sessionDuration: number;
  lastActivity: string;
  
  // Profile Data
  avatar?: string;
  bio?: string;
  badges: string[];
  titles: string[];
  
  // Detailed Activities
  recentActivities: ActivityRecord[];
  pledgeHistory: PledgeRecord[];
  voteHistory: VoteRecord[];
  sessionHistory: SessionRecord[];
  walletTransactions: WalletTransaction[];
  
  // Behavioral Analytics
  averageSessionDuration: number;
  mostActiveHours: number[];
  favoriteCategories: string[];
  engagementScore: number;
  
  // Moderation Data
  mutedUntil?: string;
  warningCount: number;
  lastWarning?: string;
  moderationHistory: ModerationRecord[];
}

export interface ActivityRecord {
  id: string;
  type: 'auth' | 'navigation' | 'pledge' | 'vote' | 'wallet' | 'profile' | 'chat' | 'search' | 'error';
  action: string;
  timestamp: string;
  page?: string;
  details?: any;
}

export interface PledgeRecord {
  id: string;
  productId: number;
  productName: string;
  amount: number;
  timestamp: string;
  status: 'active' | 'completed' | 'cancelled';
}

export interface VoteRecord {
  id: string;
  productId: number;
  productName: string;
  value: number;
  multiplier: number;
  timestamp: string;
}

export interface SessionRecord {
  id: string;
  loginTime: string;
  logoutTime?: string;
  duration: number;
  pagesVisited: string[];
  actionsPerformed: number;
  userAgent: string;
  ip?: string;
}

export interface WalletTransaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'gift_received' | 'gift_sent' | 'purchase' | 'refund';
  amount: number;
  description: string;
  timestamp: string;
  relatedUserId?: number;
  relatedProductId?: number;
}

export interface ModerationRecord {
  id: string;
  type: 'warning' | 'mute' | 'ban' | 'unban' | 'note';
  reason: string;
  moderatorId: number;
  timestamp: string;
  duration?: number;
  details?: any;
}

export class UserDataAggregator {
  private static instance: UserDataAggregator;
  private aggregatedData: Map<number, ComprehensiveUserData> = new Map();
  private lastUpdate: Map<number, number> = new Map();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes

  static getInstance(): UserDataAggregator {
    if (!UserDataAggregator.instance) {
      UserDataAggregator.instance = new UserDataAggregator();
    }
    return UserDataAggregator.instance;
  }

  async getComprehensiveUserData(userId: number, forceRefresh = false): Promise<ComprehensiveUserData | null> {
    const now = Date.now();
    const lastUpdate = this.lastUpdate.get(userId) || 0;
    
    // Return cached data if it's still fresh and not forced refresh
    if (!forceRefresh && this.aggregatedData.has(userId) && (now - lastUpdate) < this.cacheExpiry) {
      return this.aggregatedData.get(userId) || null;
    }

    // Aggregate data from all sources
    const comprehensiveData = await this.aggregateUserData(userId);
    
    if (comprehensiveData) {
      this.aggregatedData.set(userId, comprehensiveData);
      this.lastUpdate.set(userId, now);
    }

    return comprehensiveData;
  }

  async getAllUsersComprehensiveData(forceRefresh = false): Promise<ComprehensiveUserData[]> {
    const userIds = await this.getAllUserIds();
    const results: ComprehensiveUserData[] = [];

    for (const userId of userIds) {
      const userData = await this.getComprehensiveUserData(userId, forceRefresh);
      if (userData) {
        results.push(userData);
      }
    }

    return results;
  }

  private async aggregateUserData(userId: number): Promise<ComprehensiveUserData | null> {
    try {
      // Get basic user info from multiple sources
      const basicInfo = await this.getBasicUserInfo(userId);
      if (!basicInfo) return null;

      // Get all activity data
      const [
        activities,
        sessions,
        pledges,
        votes,
        profile,
        walletTransactions,
        moderationHistory
      ] = await Promise.all([
        this.getUserActivities(userId),
        this.getUserSessions(userId),
        this.getUserPledges(userId),
        this.getUserVotes(userId),
        this.getUserProfile(userId),
        this.getUserWalletTransactions(userId),
        this.getUserModerationHistory(userId)
      ]);

      // Calculate live status
      const liveStatus = this.calculateLiveStatus(sessions);
      
      // Calculate behavioral analytics
      const analytics = this.calculateBehavioralAnalytics(activities, sessions, pledges, votes);

      // Compile comprehensive data
      const comprehensiveData: ComprehensiveUserData = {
        ...basicInfo,
        ...liveStatus,
        ...analytics,
        
        // Activity records
        recentActivities: activities.slice(0, 50), // Last 50 activities
        pledgeHistory: pledges,
        voteHistory: votes,
        sessionHistory: sessions,
        walletTransactions: walletTransactions,
        moderationHistory: moderationHistory,
        
        // Profile data
        avatar: profile?.avatar,
        bio: profile?.bio || '',
        badges: profile?.badges || [],
        titles: profile?.titles || [],
        
        // Moderation data
        warningCount: moderationHistory.filter(m => m.type === 'warning').length,
        lastWarning: moderationHistory.find(m => m.type === 'warning')?.timestamp,
      };

      return comprehensiveData;
    } catch (error) {
      console.error(`Failed to aggregate data for user ${userId}:`, error);
      return null;
    }
  }

  private async getBasicUserInfo(userId: number) {
    // Try multiple sources for user info
    const sources = [
      () => this.getUserFromRegistry(userId),
      () => this.getUserFromProfile(userId),
      () => this.getUserFromSession(userId),
      () => this.getUserFromBackend(userId)
    ];

    for (const source of sources) {
      try {
        const userInfo = await source();
        if (userInfo) return userInfo;
      } catch (error) {
        continue; // Try next source
      }
    }

    return null;
  }

  private getUserFromRegistry(userId: number) {
    const registry = JSON.parse(localStorage.getItem('migistus_user_registry') || '{}');
    for (const userData of Object.values(registry)) {
      if ((userData as any).id === userId) {
        return {
          id: userId,
          username: (userData as any).username,
          email: (userData as any).email,
          tier: (userData as any).tier || 'Initiate',
          banned: (userData as any).banned || false,
          joinDate: (userData as any).joinDate || new Date().toISOString().split('T')[0],
          lastLogin: new Date().toISOString().split('T')[0],
          wallet: UserStorage.getUserWalletBalance(userId),
          guildCoins: UserStorage.getUserGuildCoins(userId)
        };
      }
    }
    return null;
  }

  private getUserFromProfile(userId: number) {
    const profile = UserStorage.getUserProfile(userId);
    if (profile) {
      return {
        id: userId,
        username: profile.username,
        email: profile.email,
        tier: profile.tier || 'Initiate',
        banned: false,
        joinDate: profile.joinedDate || new Date().toISOString().split('T')[0],
        lastLogin: new Date().toISOString().split('T')[0],
        wallet: UserStorage.getUserWalletBalance(userId),
        guildCoins: UserStorage.getUserGuildCoins(userId)
      };
    }
    return null;
  }

  private getUserFromSession(userId: number) {
    const session = localStorage.getItem('userSession');
    if (session) {
      try {
        const sessionData = JSON.parse(session);
        if (sessionData.user && sessionData.user.id === userId) {
          return {
            id: userId,
            username: sessionData.user.username,
            email: sessionData.user.email,
            tier: sessionData.user.tier || 'Initiate',
            banned: sessionData.user.banned || false,
            joinDate: new Date().toISOString().split('T')[0],
            lastLogin: new Date().toISOString().split('T')[0],
            wallet: UserStorage.getUserWalletBalance(userId),
            guildCoins: UserStorage.getUserGuildCoins(userId)
          };
        }
      } catch (error) {
        // Continue to next source
      }
    }
    return null;
  }

  private async getUserFromBackend(userId: number) {
    try {
      const response = await fetch(`/api/users/${userId}`);
      if (response.ok) {
        const userData = await response.json();
        return {
          id: userId,
          username: userData.username,
          email: userData.email,
          tier: userData.tier || 'Initiate',
          banned: userData.banned || false,
          joinDate: userData.joinDate || new Date().toISOString().split('T')[0],
          lastLogin: userData.lastLogin || new Date().toISOString().split('T')[0],
          wallet: userData.wallet || 0,
          guildCoins: userData.guildCoins || 0
        };
      }
    } catch (error) {
      // Fallback to local data
    }
    return null;
  }

  private async getUserActivities(userId: number): Promise<ActivityRecord[]> {
    const activities: ActivityRecord[] = [];

    // Get from local storage
    const localActivities = UserStorage.getUserActivity(userId);
    localActivities.forEach((activity: any) => {
      activities.push({
        id: `local_${activity.timestamp}`,
        type: activity.type || 'navigation',
        action: activity.action || 'unknown',
        timestamp: new Date(activity.timestamp).toISOString(),
        page: activity.page,
        details: activity
      });
    });

    // Get from backend activity API
    try {
      const response = await fetch(`/api/users/activity?userId=${userId}`);
      if (response.ok) {
        const backendActivities = await response.json();
        backendActivities.forEach((activity: any) => {
          activities.push({
            id: `backend_${activity.id}`,
            type: activity.type,
            action: activity.action,
            timestamp: activity.timestamp,
            page: activity.page,
            details: activity
          });
        });
      }
    } catch (error) {
      // Use local data only
    }

    // Sort by timestamp, newest first
    return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  private async getUserSessions(userId: number): Promise<SessionRecord[]> {
    const sessions: SessionRecord[] = [];

    try {
      const response = await fetch('/api/users/sessions');
      if (response.ok) {
        const allSessions = await response.json();
        const userSessions = allSessions.filter((s: any) => s.userId === userId);
        
        userSessions.forEach((session: any) => {
          sessions.push({
            id: session.sessionId,
            loginTime: session.loginTime,
            logoutTime: session.logoutTime,
            duration: session.logoutTime ? 
              new Date(session.logoutTime).getTime() - new Date(session.loginTime).getTime() :
              Date.now() - new Date(session.loginTime).getTime(),
            pagesVisited: [session.currentPage || '/'],
            actionsPerformed: 0, // Could be calculated from activities
            userAgent: session.userAgent,
            ip: session.ip
          });
        });
      }
    } catch (error) {
      // Create mock session data from current session if available
      const currentSession = localStorage.getItem('userSession');
      if (currentSession) {
        try {
          const sessionData = JSON.parse(currentSession);
          if (sessionData.user && sessionData.user.id === userId) {
            sessions.push({
              id: sessionData.sessionId,
              loginTime: sessionData.createdAt,
              duration: Date.now() - new Date(sessionData.createdAt).getTime(),
              pagesVisited: ['/'],
              actionsPerformed: 0,
              userAgent: navigator.userAgent
            });
          }
        } catch (error) {
          // Ignore
        }
      }
    }

    return sessions;
  }

  private getUserPledges(userId: number): Promise<PledgeRecord[]> {
    const pledges = UserStorage.getUserPledges(userId);
    return Promise.resolve(pledges.map((pledge: any) => ({
      id: `pledge_${pledge.id}`,
      productId: pledge.productId,
      productName: pledge.productName || 'Unknown Product',
      amount: pledge.amount,
      timestamp: new Date(pledge.timestamp).toISOString(),
      status: pledge.status || 'active'
    })));
  }

  private getUserVotes(userId: number): Promise<VoteRecord[]> {
    const votes = UserStorage.getUserVotes(userId);
    return Promise.resolve(votes.map((vote: any) => ({
      id: `vote_${vote.id}`,
      productId: vote.productId,
      productName: vote.productName || 'Unknown Product',
      value: vote.value,
      multiplier: vote.multiplier || 1,
      timestamp: new Date(vote.timestamp).toISOString()
    })));
  }

  private getUserProfile(userId: number) {
    return Promise.resolve(UserStorage.getUserProfile(userId));
  }

  private getUserWalletTransactions(userId: number): Promise<WalletTransaction[]> {
    // This would be expanded to track actual wallet transactions
    // For now, return empty array
    return Promise.resolve([]);
  }

  private getUserModerationHistory(userId: number): Promise<ModerationRecord[]> {
    // This would be expanded to track moderation actions
    // For now, return empty array
    return Promise.resolve([]);
  }

  private calculateLiveStatus(sessions: SessionRecord[]) {
    const activeSession = sessions.find(s => !s.logoutTime);
    
    return {
      isOnline: !!activeSession,
      currentPage: activeSession ? '/' : undefined, // Would be tracked more accurately
      sessionDuration: activeSession ? 
        Math.round((Date.now() - new Date(activeSession.loginTime).getTime()) / 1000 / 60) : 0,
      lastActivity: sessions.length > 0 ? sessions[0].loginTime : new Date().toISOString()
    };
  }

  private calculateBehavioralAnalytics(
    activities: ActivityRecord[], 
    sessions: SessionRecord[], 
    pledges: PledgeRecord[], 
    votes: VoteRecord[]
  ) {
    const totalSessions = sessions.length;
    const averageSessionDuration = sessions.length > 0 ? 
      sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length / 1000 / 60 : 0;

    // Calculate most active hours (simplified)
    const activityHours = activities.map(a => new Date(a.timestamp).getHours());
    const hourCounts: { [hour: number]: number } = {};
    activityHours.forEach(hour => {
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    const mostActiveHours = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));

    // Calculate engagement score (simplified)
    const engagementScore = Math.min(100, 
      (activities.length * 0.1) + 
      (pledges.length * 5) + 
      (votes.length * 2) + 
      (totalSessions * 3)
    );

    return {
      totalPledges: pledges.length,
      totalVotes: votes.length,
      totalDropsJoined: 0, // Would be calculated from actual drop data
      totalSessions,
      totalPageViews: activities.filter(a => a.type === 'navigation').length,
      totalChatMessages: activities.filter(a => a.type === 'chat').length,
      averageSessionDuration,
      mostActiveHours,
      favoriteCategories: [], // Would be calculated from activity patterns
      engagementScore
    };
  }

  private async getAllUserIds(): Promise<number[]> {
    const userIds = new Set<number>();

    // Get from registry
    try {
      const registry = JSON.parse(localStorage.getItem('migistus_user_registry') || '{}');
      Object.values(registry).forEach((userData: any) => {
        if (userData.id) userIds.add(userData.id);
      });
    } catch (error) {
      // Continue
    }

    // Get from profiles
    try {
      const profiles = UserStorage.getAllUserProfiles();
      profiles.forEach(profile => {
        if (profile.id) userIds.add(profile.id);
      });
    } catch (error) {
      // Continue
    }

    // Get from backend
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.users)) {
          data.users.forEach((user: any) => {
            if (user.id) userIds.add(user.id);
          });
        }
      }
    } catch (error) {
      // Continue
    }

    return Array.from(userIds);
  }

  // Method to sync data to backend
  async syncUserDataToBackend(userId: number): Promise<void> {
    const comprehensiveData = await this.getComprehensiveUserData(userId, true);
    if (!comprehensiveData) return;

    try {
      await fetch(`/api/users/${userId}/comprehensive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(comprehensiveData)
      });
    } catch (error) {
      console.error(`Failed to sync user ${userId} data to backend:`, error);
    }
  }

  // Method to clear cache
  clearCache(userId?: number): void {
    if (userId) {
      this.aggregatedData.delete(userId);
      this.lastUpdate.delete(userId);
    } else {
      this.aggregatedData.clear();
      this.lastUpdate.clear();
    }
  }
}

export const userDataAggregator = UserDataAggregator.getInstance();
