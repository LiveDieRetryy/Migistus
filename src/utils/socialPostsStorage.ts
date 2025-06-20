export interface SocialPost {
  id: number;
  userId: number;
  username: string;
  userAvatar?: string;
  userTier?: string;
  content: string;
  images?: string[];
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
  likedBy: number[];
  commentsList: PostComment[];
  sharedBy: number[];
  visibility: 'public' | 'followers' | 'private';
  tags: string[];
  mentions: string[];
  edited?: boolean;
  editedAt?: string;
  pinned?: boolean;
}

export interface PostComment {
  id: number;
  userId: number;
  username: string;
  userAvatar?: string;
  content: string;
  timestamp: string;
  likes: number;
  likedBy: number[];
  parentId?: number; // For replies
  replies?: PostComment[];
}

export class SocialPostsStorage {
  private static POSTS_KEY = 'migistus_social_posts';
  private static USER_POSTS_PREFIX = 'user_posts_';

  // Helper function to identify bot/test accounts
  private static isTestAccount(userId: number, username: string): boolean {
    if (!userId || !username) return true;
    
    const usernameLC = username.toLowerCase();
    
    // Filter out accounts with test-related names
    const testPatterns = [
      'test', 'bot', 'demo', 'sample', 'mock', 'fake', 'admin',
      'placeholder', 'example', 'dummy', 'temp'
    ];
    
    // Check username patterns
    if (testPatterns.some(pattern => usernameLC.includes(pattern))) {
      return true;
    }
    
    // Check for generic usernames like "user_123"
    if (/^user_\d+$/.test(usernameLC)) {
      return true;
    }
    
    // Filter out specific test user IDs (if any known test IDs exist)
    const testUserIds = [1001, 1002, 1003, 1004, 101, 102, 103, 999];
    if (testUserIds.includes(userId)) {
      return true;
    }
    
    return false;
  }

  static getAllPosts(): SocialPost[] {
    try {
      const posts = localStorage.getItem(this.POSTS_KEY);
      return posts ? JSON.parse(posts) : [];
    } catch {
      return [];
    }
  }

  static getUserPosts(userId: number): SocialPost[] {
    try {
      const allPosts = this.getAllPosts();
      return allPosts.filter(post => post.userId === userId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch {
      return [];
    }
  }

  static createPost(post: Omit<SocialPost, 'id' | 'timestamp' | 'likes' | 'comments' | 'shares' | 'likedBy' | 'commentsList' | 'sharedBy'>): SocialPost {
    const newPost: SocialPost = {
      ...post,
      id: Date.now(),
      timestamp: new Date().toISOString(),
      likes: 0,
      comments: 0,
      shares: 0,
      likedBy: [],
      commentsList: [],
      sharedBy: []
    };

    const allPosts = this.getAllPosts();
    allPosts.unshift(newPost);
    localStorage.setItem(this.POSTS_KEY, JSON.stringify(allPosts));

    // Track activity
    this.addPostActivity(post.userId, 'Created a new post', newPost.id);

    return newPost;
  }

  static updatePost(postId: number, updates: Partial<SocialPost>): boolean {
    try {
      const allPosts = this.getAllPosts();
      const postIndex = allPosts.findIndex(post => post.id === postId);
      
      if (postIndex !== -1) {
        allPosts[postIndex] = { 
          ...allPosts[postIndex], 
          ...updates,
          edited: true,
          editedAt: new Date().toISOString()
        };
        localStorage.setItem(this.POSTS_KEY, JSON.stringify(allPosts));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  static deletePost(postId: number, userId: number): boolean {
    try {
      const allPosts = this.getAllPosts();
      const postIndex = allPosts.findIndex(post => post.id === postId && post.userId === userId);
      
      if (postIndex !== -1) {
        allPosts.splice(postIndex, 1);
        localStorage.setItem(this.POSTS_KEY, JSON.stringify(allPosts));
        this.addPostActivity(userId, 'Deleted a post', postId);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  static likePost(postId: number, userId: number): boolean {
    try {
      const allPosts = this.getAllPosts();
      const postIndex = allPosts.findIndex(post => post.id === postId);
      
      if (postIndex !== -1) {
        const post = allPosts[postIndex];
        const isLiked = post.likedBy.includes(userId);
        
        if (isLiked) {
          // Unlike
          post.likedBy = post.likedBy.filter(id => id !== userId);
          post.likes = Math.max(0, post.likes - 1);
        } else {
          // Like
          post.likedBy.push(userId);
          post.likes += 1;
          this.addPostActivity(userId, `Liked ${post.username}'s post`, postId);
        }
        
        localStorage.setItem(this.POSTS_KEY, JSON.stringify(allPosts));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  static addComment(postId: number, comment: Omit<PostComment, 'id' | 'timestamp' | 'likes' | 'likedBy' | 'replies'>): boolean {
    try {
      const allPosts = this.getAllPosts();
      const postIndex = allPosts.findIndex(post => post.id === postId);
      
      if (postIndex !== -1) {
        const newComment: PostComment = {
          ...comment,
          id: Date.now(),
          timestamp: new Date().toISOString(),
          likes: 0,
          likedBy: [],
          replies: []
        };

        allPosts[postIndex].commentsList.push(newComment);
        allPosts[postIndex].comments = allPosts[postIndex].commentsList.length;
        
        localStorage.setItem(this.POSTS_KEY, JSON.stringify(allPosts));
        this.addPostActivity(comment.userId, `Commented on ${allPosts[postIndex].username}'s post`, postId);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  static sharePost(postId: number, userId: number): boolean {
    try {
      const allPosts = this.getAllPosts();
      const postIndex = allPosts.findIndex(post => post.id === postId);
      
      if (postIndex !== -1) {
        const post = allPosts[postIndex];
        if (!post.sharedBy.includes(userId)) {
          post.sharedBy.push(userId);
          post.shares += 1;
          localStorage.setItem(this.POSTS_KEY, JSON.stringify(allPosts));
          this.addPostActivity(userId, `Shared ${post.username}'s post`, postId);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  static getFollowingPosts(userId: number): SocialPost[] {
    try {
      // Get users that this user is following
      const followData = JSON.parse(localStorage.getItem('migistus_follows') || '[]');
      const followingIds = followData
        .filter((follow: any) => follow.followerId === userId)
        .map((follow: any) => follow.followingId);

      // Include user's own posts
      followingIds.push(userId);      const allPosts = this.getAllPosts();
      return allPosts
        .filter(post => !this.isTestAccount(post.userId, post.username)) // Filter out test accounts
        .filter(post => followingIds.includes(post.userId) && 
               (post.visibility === 'public' || 
                (post.visibility === 'followers' && followingIds.includes(post.userId))))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());    } catch {
      return this.getAllPosts()
        .filter(post => !this.isTestAccount(post.userId, post.username)) // Filter out test accounts
        .filter(post => post.visibility === 'public');
    }
  }

  static getExplorePosts(userId?: number): SocialPost[] {
    try {      const allPosts = this.getAllPosts();
      return allPosts
        .filter(post => !this.isTestAccount(post.userId, post.username)) // Filter out test accounts
        .filter(post => post.visibility === 'public')
        .sort((a, b) => {
          // Sort by engagement score (likes + comments + shares)
          const scoreA = a.likes + a.comments + a.shares;
          const scoreB = b.likes + b.comments + b.shares;
          return scoreB - scoreA;
        })
        .slice(0, 50); // Limit to top 50 posts
    } catch {
      return [];
    }
  }

  static searchPosts(query: string, userId?: number): SocialPost[] {
    try {
      const allPosts = this.getAllPosts();
      const searchQuery = query.toLowerCase().trim();
      
      if (!searchQuery) return [];      return allPosts
        .filter(post => !this.isTestAccount(post.userId, post.username)) // Filter out test accounts
        .filter(post => {
          if (post.visibility === 'private') return false;
          if (post.visibility === 'followers' && userId) {
            // Check if user follows the post author
            const followData = JSON.parse(localStorage.getItem('migistus_follows') || '[]');
            const isFollowing = followData.some((follow: any) => 
              follow.followerId === userId && follow.followingId === post.userId
            );
            if (!isFollowing && post.userId !== userId) return false;
          }

          return (
            post.content.toLowerCase().includes(searchQuery) ||
            post.username.toLowerCase().includes(searchQuery) ||
            post.tags.some(tag => tag.toLowerCase().includes(searchQuery))
          );
        })
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch {
      return [];
    }
  }

  private static addPostActivity(userId: number, action: string, postId: number) {
    try {
      const { UserStorage3 } = require('./userStorage');
      UserStorage3.addUserActivity(userId, {
        type: 'social',
        action,
        postId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.warn('Failed to track post activity:', error);
    }
  }

  static getPostStats(): { totalPosts: number; totalLikes: number; totalComments: number; totalShares: number; activeUsers: number } {
    try {
      const allPosts = this.getAllPosts();
      const activeUsers = new Set(allPosts.map(post => post.userId)).size;
      
      return {
        totalPosts: allPosts.length,
        totalLikes: allPosts.reduce((sum, post) => sum + post.likes, 0),
        totalComments: allPosts.reduce((sum, post) => sum + post.comments, 0),
        totalShares: allPosts.reduce((sum, post) => sum + post.shares, 0),
        activeUsers
      };
    } catch {
      return { totalPosts: 0, totalLikes: 0, totalComments: 0, totalShares: 0, activeUsers: 0 };
    }
  }
}
