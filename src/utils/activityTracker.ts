class ActivityTracker {
  private static instance: ActivityTracker;
  private userId: number | null = null;
  private sessionId: string | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;
  private lastPage: string | null = null;
  private pageStartTime: number = Date.now();

  static getInstance(): ActivityTracker {
    if (!ActivityTracker.instance) {
      ActivityTracker.instance = new ActivityTracker();
    }
    return ActivityTracker.instance;
  }

  initialize(userId: number, sessionId: string) {
    this.userId = userId;
    this.sessionId = sessionId;
    this.isInitialized = true;
    
    // Track initialization
    this.trackActivity({
      type: 'auth',
      action: 'session_initialized',
      timestamp: new Date().toISOString()
    });

    // Start heartbeat for live tracking
    this.startHeartbeat();
    
    // Track page visibility changes
    this.setupVisibilityTracking();
    
    // Track page navigation
    this.setupNavigationTracking();
  }

  private startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    // Send heartbeat every 30 seconds
    this.heartbeatInterval = setInterval(() => {
      if (this.isInitialized && typeof window !== 'undefined') {
        this.trackActivity({
          type: 'session',
          action: 'heartbeat',
          details: {
            page: window.location.pathname,
            timeOnPage: Date.now() - this.pageStartTime
          }
        });
      }
    }, 30000);
  }

  private setupVisibilityTracking() {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        this.trackActivity({
          type: 'session',
          action: document.hidden ? 'page_hidden' : 'page_visible',
          details: {
            page: window.location.pathname,
            timeOnPage: Date.now() - this.pageStartTime
          }
        });
      });
    }
  }

  private setupNavigationTracking() {
    if (typeof window !== 'undefined') {
      // Track page unload
      window.addEventListener('beforeunload', () => {
        this.trackActivity({
          type: 'navigation',
          action: 'page_unload',
          details: {
            page: window.location.pathname,
            timeOnPage: Date.now() - this.pageStartTime
          }
        });
      });
    }
  }

  // Public method to track page navigation
  trackPageView(page: string) {
    if (this.lastPage) {
      // Track time spent on previous page
      this.trackActivity({
        type: 'navigation',
        action: 'page_exit',
        details: {
          page: this.lastPage,
          timeOnPage: Date.now() - this.pageStartTime
        }
      });
    }

    this.lastPage = page;
    this.pageStartTime = Date.now();

    this.trackActivity({
      type: 'navigation',
      action: 'page_view',
      details: {
        page,
        referrer: typeof document !== 'undefined' ? document.referrer : null
      }
    });
  }

  // Make trackActivity public with live backend integration
  async trackActivity(activity: {
    type: string;
    action: string;
    timestamp?: string;
    details?: any;
    targetUserId?: number;
  }) {
    if (!this.isInitialized || !this.userId || !this.sessionId) {
      console.warn('ActivityTracker not initialized');
      return;
    }

    const activityData = {
      ...activity,
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: activity.timestamp || new Date().toISOString(),
      page: typeof window !== 'undefined' ? window.location.pathname : null
    };

    try {
      // Store locally first (for immediate access)
      const { UserStorage3 } = require('@/utils/userStorage');
      UserStorage3.addUserActivity(this.userId, activityData);

      // Update session activity to mark user as online
      if (typeof fetch !== 'undefined') {
        fetch('/api/users/activity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        }).catch(error => {
          // Silent fail - online status is not critical
          console.debug('Failed to update session activity:', error);
        });
      }

      // Send to live backend tracking
      if (typeof fetch !== 'undefined') {
        fetch('/api/tracking/live', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(activityData)
        }).catch(error => {
          console.error('Failed to send live tracking data:', error);
        });
      }

      // Also send to user activity API for persistent storage
      if (typeof fetch !== 'undefined') {
        fetch('/api/users/activity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(activityData)
        }).catch(error => {
          console.error('Failed to send activity to user API:', error);
        });
      }

      // Update session tracking
      if (typeof fetch !== 'undefined') {
        fetch('/api/users/sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: this.userId,
            sessionId: this.sessionId,
            action: 'update',
            page: activityData.page,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
            timestamp: activityData.timestamp
          })
        }).catch(error => {
          console.error('Failed to update session:', error);
        });
      }
    } catch (error) {
      console.error('Activity tracking error:', error);
    }
  }

  trackSocialAction(action: string, targetUserId?: number, details?: any) {
    this.trackActivity({
      type: 'social',
      action,
      targetUserId,
      details
    });
  }

  trackFollow(targetUserId: number, targetUsername: string) {
    this.trackActivity({
      type: 'social',
      action: 'follow_user',
      targetUserId,
      details: { targetUsername }
    });
  }

  trackUnfollow(targetUserId: number, targetUsername: string) {
    this.trackActivity({
      type: 'social',
      action: 'unfollow_user',
      targetUserId,
      details: { targetUsername }
    });
  }

  trackLogin() {
    this.trackActivity({
      type: 'auth',
      action: 'login_success'
    });
  }

  trackLogout() {
    this.trackActivity({
      type: 'auth',
      action: 'logout'
    });
  }

  trackNavigation(page: string) {
    this.trackPageView(page);
  }

  trackPledge(productId: number, amount: number, productName: string) {
    this.trackActivity({
      type: 'commerce',
      action: 'pledge_created',
      details: { productId, amount, productName }
    });
  }

  trackVote(productId: number, productName: string) {
    this.trackActivity({
      type: 'voting',
      action: 'vote_cast',
      details: { productId, productName }
    });
  }

  trackWalletTransaction(type: 'deposit' | 'withdrawal' | 'transfer', amount: number) {
    this.trackActivity({
      type: 'wallet',
      action: `wallet_${type}`,
      details: { amount }
    });
  }

  trackProfileUpdate(field: string, value: any) {
    this.trackActivity({
      type: 'profile',
      action: 'profile_updated',
      details: { field, value }
    });
  }

  trackSearch(query: string, results: number) {
    this.trackActivity({
      type: 'search',
      action: 'search_performed',
      details: { query, results }
    });
  }

  // Add method for social posts
  trackSocialPost(postContent: string, postType: string = 'text') {
    this.trackActivity({
      type: 'social',
      action: 'post_created',
      details: { postType, contentLength: postContent.length }
    });
  }

  // Track profile views
  trackProfileView(viewedUserId: number, viewedUsername: string) {
    this.trackActivity({
      type: 'social',
      action: 'profile_viewed',
      targetUserId: viewedUserId,
      details: { viewedUsername }
    });
  }

  // Track account menu interactions
  trackAccountMenuAction(action: string, details?: any) {
    this.trackActivity({
      type: 'navigation',
      action: `account_menu_${action}`,
      details
    });
  }

  // Track admin actions
  trackAdminAction(action: string, details?: any) {
    this.trackActivity({
      type: 'admin',
      action,
      details
    });
  }

  // Get user's activity history
  async getUserActivity(limit: number = 50) {
    if (!this.userId) return [];
    
    try {
      const response = await fetch(`/api/tracking/live?userId=${this.userId}&limit=${limit}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Failed to fetch user activity:', error);
    }
    
    // Fallback to local storage
    const { UserStorage3 } = require('@/utils/userStorage');
    return UserStorage3.getUserActivity(this.userId).slice(0, limit);
  }

  // Get session activity
  async getSessionActivity(limit: number = 50) {
    if (!this.sessionId) return [];
    
    try {
      const response = await fetch(`/api/tracking/live?sessionId=${this.sessionId}&limit=${limit}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Failed to fetch session activity:', error);
    }
    
    return [];
  }

  // Clean up when user logs out or component unmounts
  cleanup() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    this.trackActivity({
      type: 'session',
      action: 'session_ended'
    });
    
    this.userId = null;
    this.sessionId = null;
    this.isInitialized = false;
    this.lastPage = null;
  }
}

// Prevent redeclaration in dev/hot-reload environments
declare global {
  // eslint-disable-next-line no-var
  var activityTracker: ActivityTracker | undefined;
}

export const activityTracker: ActivityTracker =
  globalThis.activityTracker ?? ActivityTracker.getInstance();

if (typeof window !== 'undefined') {
  (window as any).activityTracker = activityTracker;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTracker);
  } else {
    initializeTracker();
  }
}

function initializeTracker() {
  try {
    const session = localStorage.getItem('userSession');
    if (session) {
      const { user, sessionId } = JSON.parse(session);
      if (user && sessionId && user.id) {
        activityTracker.initialize(user.id, sessionId);
      }
    }
  } catch {}
}

if (typeof globalThis !== "undefined") {
  globalThis.activityTracker = activityTracker;
}