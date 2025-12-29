// Followers API Client - Connect to backend follower endpoints

export interface Follower {
  id: number;
  username: string;
  email?: string;
  avatar?: string;
  tier?: string;
  followedAt?: string;
}

export interface FollowStats {
  followers: number;
  following: number;
}

class FollowersAPI {
  // Get followers for a user
  async getFollowers(userId: number): Promise<{ followers: Follower[] }> {
    const response = await fetch(`/api/followers/${userId}?type=followers`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch followers');
    }

    return response.json();
  }

  // Get users that a user is following
  async getFollowing(userId: number): Promise<{ following: Follower[] }> {
    const response = await fetch(`/api/followers/${userId}?type=following`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch following');
    }

    return response.json();
  }

  // Get follow stats
  async getFollowStats(userId: number): Promise<FollowStats> {
    try {
      const response = await fetch(`/api/followers?userId=${userId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        return { followers: 0, following: 0 };
      }

      const data = await response.json();
      return {
        followers: data.followersCount || 0,
        following: data.followingCount || 0
      };
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      return { followers: 0, following: 0 };
    }
  }

  // Follow a user
  async follow(targetUserId: number): Promise<{ success: boolean; message: string }> {
    const response = await fetch('/api/followers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ 
        followingId: targetUserId,
        action: 'follow'
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to follow user');
    }

    return response.json();
  }

  // Unfollow a user
  async unfollow(targetUserId: number): Promise<{ success: boolean; message: string }> {
    const response = await fetch('/api/followers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ 
        followingId: targetUserId,
        action: 'unfollow'
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to unfollow user');
    }

    return response.json();
  }

  // Check if current user is following target user
  async isFollowing(targetUserId: number, currentUserId: number): Promise<{ isFollowing: boolean }> {
    try {
      const response = await fetch(`/api/followers?userId=${currentUserId}&type=following`, {
        credentials: 'include',
      });

      if (!response.ok) {
        return { isFollowing: false };
      }

      const data = await response.json();
      const following = data.following || [];
      // The API returns objects with 'id' property, not 'userId'
      const isFollowing = following.some((f: any) => f.id === targetUserId);
      
      return { isFollowing };
    } catch (error) {
      console.error('Failed to check follow status:', error);
      return { isFollowing: false };
    }
  }
}

export const followersAPI = new FollowersAPI();
