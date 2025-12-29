// User API Client
// Centralized client for all user-related API calls

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  tier: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatar?: string;
  banner?: string;
  badges?: any[];
  titles?: any[];
  links?: any[];
  createdAt: string;
  updatedAt?: string;
}

export interface UserStats {
  userId: number;
  followers: number;
  following: number;
  totalPledges: number;
  totalVotes: number;
  dropsJoined: number;
  profileViews: number;
  postsCount: number;
}

export interface UserSettings {
  userId: number;
  showOnlineStatus: boolean;
  allowMessages: boolean;
  emailNotifications: boolean;
  marketingEmails: boolean;
  preferences: any;
}

export interface UpdateUserData {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatar?: string;
  banner?: string;
  links?: any[];
}

class UserAPIClient {
  private baseURL = '/api';

  // Get user profile by ID
  async getProfile(userId: number): Promise<UserProfile> {
    try {
      const response = await fetch(`${this.baseURL}/users/${userId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to fetch user profile (${response.status})`);
      }

      const data = await response.json();
      return data.user || data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to fetch user profile');
    }
  }

  // Get user profile by username
  async getProfileByUsername(username: string): Promise<UserProfile> {
    const response = await fetch(`${this.baseURL}/users/username/${username}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }

    const data = await response.json();
    return data.user;
  }

  // Update current user's profile
  async updateProfile(data: UpdateUserData): Promise<UserProfile> {
    const response = await fetch(`${this.baseURL}/users/me`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update profile');
    }

    const result = await response.json();
    return result.user;
  }

  // Get user statistics
  async getStats(userId?: number): Promise<UserStats> {
    const url = userId ? `${this.baseURL}/users/${userId}/stats` : `${this.baseURL}/users/me/stats`;
    
    try {
      const response = await fetch(url, { credentials: 'include' });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to fetch user stats (${response.status})`);
      }

      const data = await response.json();
      return data.stats || data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to fetch user stats');
    }
  }

  // Get user settings
  async getSettings(): Promise<UserSettings> {
    const response = await fetch(`${this.baseURL}/users/me/settings`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user settings');
    }

    const data = await response.json();
    return data.settings;
  }

  // Update user settings
  async updateSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    const response = await fetch(`${this.baseURL}/users/me/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update settings');
    }

    const data = await response.json();
    return data.settings;
  }

  // Follow a user
  async follow(userId: number): Promise<void> {
    const response = await fetch(`${this.baseURL}/users/${userId}/follow`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to follow user');
    }
  }

  // Unfollow a user
  async unfollow(userId: number): Promise<void> {
    const response = await fetch(`${this.baseURL}/users/${userId}/follow`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to unfollow user');
    }
  }

  // Get followers list
  async getFollowers(userId?: number, limit: number = 50): Promise<UserProfile[]> {
    const url = userId 
      ? `${this.baseURL}/users/${userId}/followers?limit=${limit}`
      : `${this.baseURL}/users/me/followers?limit=${limit}`;
    
    const response = await fetch(url, { credentials: 'include' });
    
    if (!response.ok) {
      throw new Error('Failed to fetch followers');
    }

    const data = await response.json();
    return data.followers;
  }

  // Get following list
  async getFollowing(userId?: number, limit: number = 50): Promise<UserProfile[]> {
    const url = userId 
      ? `${this.baseURL}/users/${userId}/following?limit=${limit}`
      : `${this.baseURL}/users/me/following?limit=${limit}`;
    
    const response = await fetch(url, { credentials: 'include' });
    
    if (!response.ok) {
      throw new Error('Failed to fetch following');
    }

    const data = await response.json();
    return data.following;
  }

  // Check if following a user
  async isFollowing(userId: number): Promise<boolean> {
    const response = await fetch(`${this.baseURL}/users/${userId}/is-following`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.isFollowing;
  }

  // Upload avatar
  async uploadAvatar(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('alt', `${file.name} avatar`);

    const response = await fetch('/api/media', {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload avatar');
    }

    const data = await response.json();
    return data.media.url;
  }

  // Upload banner
  async uploadBanner(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('alt', `${file.name} banner`);

    const response = await fetch('/api/media', {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload banner');
    }

    const data = await response.json();
    return data.media.url;
  }

  // Get user activity
  async getActivity(userId?: number, limit: number = 20): Promise<any[]> {
    try {
      const url = userId 
        ? `${this.baseURL}/users/${userId}/activity?limit=${limit}`
        : `${this.baseURL}/users/me/activity?limit=${limit}`;
      
      const response = await fetch(url, { credentials: 'include' });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to fetch activity (${response.status})`);
      }

      const data = await response.json();
      return data.activities || data.activity || [];
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to fetch activity');
    }
  }

  // Get online users
  async getOnlineUsers(): Promise<UserProfile[]> {
    const response = await fetch(`${this.baseURL}/users/online`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch online users');
    }

    const data = await response.json();
    return data.users;
  }

  // Check if user is online
  async isOnline(userId: number): Promise<boolean> {
    const response = await fetch(`${this.baseURL}/users/${userId}/online`);
    
    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.isOnline;
  }

  // Delete account
  async deleteAccount(password: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/users/me`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete account');
    }
  }
}

export const userAPI = new UserAPIClient();
