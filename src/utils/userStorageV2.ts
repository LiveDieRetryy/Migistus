/**
 * User Storage Service
 * 
 * Dual-mode storage system:
 * - Development: Uses localStorage for quick iteration
 * - Production: Uses PostgreSQL database for persistence and scalability
 * 
 * Automatically detects environment and uses appropriate storage backend.
 */

// Check if running in production (database available)
const isProduction = () => {
  return process.env.NEXT_PUBLIC_USE_DATABASE === 'true' || 
         process.env.NODE_ENV === 'production';
};

/**
 * Database User Storage (Production)
 */
class DatabaseUserStorage {
  // Profile management
  static async getUserProfile(userId: number) {
    try {
      const res = await fetch('/api/users/profile', {
        credentials: 'include'
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.profile;
    } catch (error) {
      console.error('Error fetching profile from database:', error);
      return null;
    }
  }

  static async setUserProfile(userId: number, profile: any): Promise<void> {
    try {
      await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(profile)
      });
    } catch (error) {
      console.error('Error updating profile in database:', error);
    }
  }

  // Stats management
  static async getUserStats(userId: number) {
    try {
      const res = await fetch('/api/users/stats', {
        credentials: 'include'
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.stats;
    } catch (error) {
      console.error('Error fetching stats from database:', error);
      return null;
    }
  }

  // Settings management
  static async getUserSettings(userId: number) {
    try {
      const res = await fetch('/api/users/settings', {
        credentials: 'include'
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.settings;
    } catch (error) {
      console.error('Error fetching settings from database:', error);
      return null;
    }
  }

  static async setUserSettings(userId: number, settings: any): Promise<void> {
    try {
      await fetch('/api/users/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settings)
      });
    } catch (error) {
      console.error('Error updating settings in database:', error);
    }
  }

  // Follow/Unfollow
  static async followUser(followerId: number, followingId: number): Promise<boolean> {
    try {
      const res = await fetch('/api/users/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId: followingId })
      });
      return res.ok;
    } catch (error) {
      console.error('Error following user:', error);
      return false;
    }
  }

  static async unfollowUser(followerId: number, followingId: number): Promise<boolean> {
    try {
      const res = await fetch('/api/users/follow', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId: followingId })
      });
      return res.ok;
    } catch (error) {
      console.error('Error unfollowing user:', error);
      return false;
    }
  }

  static async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    try {
      const res = await fetch(`/api/users/followers?userId=${followingId}`, {
        credentials: 'include'
      });
      if (!res.ok) return false;
      const data = await res.json();
      return data.isFollowing || false;
    } catch (error) {
      console.error('Error checking follow status:', error);
      return false;
    }
  }

  static async getUserFollowers(userId: number): Promise<number> {
    try {
      const stats = await this.getUserStats(userId);
      return stats?.followers || 0;
    } catch (error) {
      console.error('Error getting followers count:', error);
      return 0;
    }
  }

  static async getUserFollowing(userId: number): Promise<number> {
    try {
      const stats = await this.getUserStats(userId);
      return stats?.following || 0;
    } catch (error) {
      console.error('Error getting following count:', error);
      return 0;
    }
  }

  // Wishlist management
  static async getWishlist(userId: number) {
    try {
      const res = await fetch('/api/users/wishlist', {
        credentials: 'include'
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.wishlist || [];
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      return [];
    }
  }

  static async addToWishlist(userId: number, productId: number): Promise<boolean> {
    try {
      const res = await fetch('/api/users/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ productId })
      });
      return res.ok;
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      return false;
    }
  }

  static async removeFromWishlist(userId: number, productId: number): Promise<boolean> {
    try {
      const res = await fetch('/api/users/wishlist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ productId })
      });
      return res.ok;
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      return false;
    }
  }
}

/**
 * LocalStorage User Storage (Development)
 * Kept for backward compatibility and development use
 */
class LocalStorageUserStorage {
  private static getUserPrefix(userId: number): string {
    return `user_${userId}_`;
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

  // Social features
  static getUserFollowers(userId: number): number {
    try {
      const followData = JSON.parse(localStorage.getItem('migistus_follows') || '[]');
      return followData.filter((follow: any) => follow.followingId === userId).length;
    } catch {
      return 0;
    }
  }

  static getUserFollowing(userId: number): number {
    try {
      const followData = JSON.parse(localStorage.getItem('migistus_follows') || '[]');
      return followData.filter((follow: any) => follow.followerId === userId).length;
    } catch {
      return 0;
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
        
        // Trigger update event
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
        
        // Trigger update event
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

  // Wishlist
  static getWishlist(userId: number) {
    const key = `${this.getUserPrefix(userId)}wishlist`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  static addToWishlist(userId: number, productId: number): boolean {
    const wishlist = this.getWishlist(userId);
    if (!wishlist.includes(productId)) {
      wishlist.push(productId);
      const key = `${this.getUserPrefix(userId)}wishlist`;
      localStorage.setItem(key, JSON.stringify(wishlist));
      return true;
    }
    return false;
  }

  static removeFromWishlist(userId: number, productId: number): boolean {
    const wishlist = this.getWishlist(userId);
    const index = wishlist.indexOf(productId);
    if (index > -1) {
      wishlist.splice(index, 1);
      const key = `${this.getUserPrefix(userId)}wishlist`;
      localStorage.setItem(key, JSON.stringify(wishlist));
      return true;
    }
    return false;
  }

  static getUserStats(userId: number) {
    const key = `${this.getUserPrefix(userId)}stats`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : {
      followers: this.getUserFollowers(userId),
      following: this.getUserFollowing(userId),
      totalPledges: 0,
      totalVotes: 0,
      dropsJoined: 0,
      profileViews: 0,
      postsCount: 0
    };
  }
}

/**
 * Unified UserStorage interface
 * Automatically routes to correct backend based on environment
 */
export class UserStorage {
  // Profile methods
  static async getUserProfile(userId: number) {
    if (typeof window === 'undefined') return null;
    
    if (isProduction()) {
      return await DatabaseUserStorage.getUserProfile(userId);
    }
    return LocalStorageUserStorage.getUserProfile(userId);
  }

  static async setUserProfile(userId: number, profile: any): Promise<void> {
    if (typeof window === 'undefined') return;
    
    if (isProduction()) {
      await DatabaseUserStorage.setUserProfile(userId, profile);
    } else {
      LocalStorageUserStorage.setUserProfile(userId, profile);
    }
  }

  // Stats methods
  static async getUserStats(userId: number) {
    if (typeof window === 'undefined') return null;
    
    if (isProduction()) {
      return await DatabaseUserStorage.getUserStats(userId);
    }
    return LocalStorageUserStorage.getUserStats(userId);
  }

  // Settings methods
  static async getUserSettings(userId: number) {
    if (typeof window === 'undefined') return null;
    
    if (isProduction()) {
      return await DatabaseUserStorage.getUserSettings(userId);
    }
    return LocalStorageUserStorage.getUserSettings(userId);
  }

  static async setUserSettings(userId: number, settings: any): Promise<void> {
    if (typeof window === 'undefined') return;
    
    if (isProduction()) {
      await DatabaseUserStorage.setUserSettings(userId, settings);
    } else {
      LocalStorageUserStorage.setUserSettings(userId, settings);
    }
  }

  // Follow methods
  static async followUser(followerId: number, followingId: number): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    
    if (isProduction()) {
      return await DatabaseUserStorage.followUser(followerId, followingId);
    }
    return LocalStorageUserStorage.followUser(followerId, followingId);
  }

  static async unfollowUser(followerId: number, followingId: number): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    
    if (isProduction()) {
      return await DatabaseUserStorage.unfollowUser(followerId, followingId);
    }
    return LocalStorageUserStorage.unfollowUser(followerId, followingId);
  }

  static async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    
    if (isProduction()) {
      return await DatabaseUserStorage.isFollowing(followerId, followingId);
    }
    return LocalStorageUserStorage.isFollowing(followerId, followingId);
  }

  static async getUserFollowers(userId: number): Promise<number> {
    if (typeof window === 'undefined') return 0;
    
    if (isProduction()) {
      return await DatabaseUserStorage.getUserFollowers(userId);
    }
    return LocalStorageUserStorage.getUserFollowers(userId);
  }

  static async getUserFollowing(userId: number): Promise<number> {
    if (typeof window === 'undefined') return 0;
    
    if (isProduction()) {
      return await DatabaseUserStorage.getUserFollowing(userId);
    }
    return LocalStorageUserStorage.getUserFollowing(userId);
  }

  // Wishlist methods
  static async getWishlist(userId: number) {
    if (typeof window === 'undefined') return [];
    
    if (isProduction()) {
      return await DatabaseUserStorage.getWishlist(userId);
    }
    return LocalStorageUserStorage.getWishlist(userId);
  }

  static async addToWishlist(userId: number, productId: number): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    
    if (isProduction()) {
      return await DatabaseUserStorage.addToWishlist(userId, productId);
    }
    return LocalStorageUserStorage.addToWishlist(userId, productId);
  }

  static async removeFromWishlist(userId: number, productId: number): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    
    if (isProduction()) {
      return await DatabaseUserStorage.removeFromWishlist(userId, productId);
    }
    return LocalStorageUserStorage.removeFromWishlist(userId, productId);
  }
}

// Export the legacy class for backward compatibility
// This maintains the existing API while redirecting to the new dual-mode system
export { UserStorage as UserStorage3 };
export default UserStorage;
