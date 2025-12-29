/**
 * Social Posts Storage Service
 * 
 * Dual-mode storage system:
 * - Development: Uses localStorage for quick iteration
 * - Production: Uses PostgreSQL database for persistence and scalability
 */

// Check if running in production (database available)
const isProduction = () => {
  return process.env.NEXT_PUBLIC_USE_DATABASE === 'true' || 
         process.env.NODE_ENV === 'production';
};

/**
 * Database Social Storage (Production)
 */
class DatabaseSocialStorage {
  // Posts
  static async createPost(data: {
    content: string;
    imageUrl?: string;
    type?: string;
    visibility?: string;
  }) {
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to create post');
      const result = await res.json();
      return result.post;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  static async getPosts(options: {
    userId?: number;
    type?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    try {
      const params = new URLSearchParams();
      if (options.userId) params.append('userId', options.userId.toString());
      if (options.type) params.append('type', options.type);
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.offset) params.append('offset', options.offset.toString());

      const res = await fetch(`/api/posts?${params}`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch posts');
      const result = await res.json();
      return result.posts || [];
    } catch (error) {
      console.error('Error fetching posts:', error);
      return [];
    }
  }

  static async getFeedPosts(limit: number = 50, offset: number = 0) {
    try {
      const res = await fetch(`/api/posts?feed=true&limit=${limit}&offset=${offset}`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch feed');
      const result = await res.json();
      return result.posts || [];
    } catch (error) {
      console.error('Error fetching feed:', error);
      return [];
    }
  }

  static async getPost(postId: number) {
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        credentials: 'include'
      });
      if (!res.ok) return null;
      const result = await res.json();
      return result.post;
    } catch (error) {
      console.error('Error fetching post:', error);
      return null;
    }
  }

  static async updatePost(postId: number, data: {
    content?: string;
    imageUrl?: string;
    visibility?: string;
  }) {
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to update post');
      const result = await res.json();
      return result.post;
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  }

  static async deletePost(postId: number) {
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      return res.ok;
    } catch (error) {
      console.error('Error deleting post:', error);
      return false;
    }
  }

  // Likes
  static async likePost(postId: number) {
    try {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        credentials: 'include'
      });
      return res.ok;
    } catch (error) {
      console.error('Error liking post:', error);
      return false;
    }
  }

  static async unlikePost(postId: number) {
    try {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: 'DELETE',
        credentials: 'include'
      });
      return res.ok;
    } catch (error) {
      console.error('Error unliking post:', error);
      return false;
    }
  }

  static async isPostLiked(postId: number) {
    try {
      const res = await fetch(`/api/posts/${postId}/like`, {
        credentials: 'include'
      });
      if (!res.ok) return false;
      const result = await res.json();
      return result.isLiked || false;
    } catch (error) {
      console.error('Error checking like status:', error);
      return false;
    }
  }

  static async getPostLikes(postId: number) {
    try {
      const res = await fetch(`/api/posts/${postId}/like`, {
        credentials: 'include'
      });
      if (!res.ok) return [];
      const result = await res.json();
      return result.likes || [];
    } catch (error) {
      console.error('Error fetching likes:', error);
      return [];
    }
  }

  // Comments
  static async createComment(postId: number, content: string) {
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content })
      });
      if (!res.ok) throw new Error('Failed to create comment');
      const result = await res.json();
      return result.comment;
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  }

  static async getComments(postId: number, limit: number = 100) {
    try {
      const res = await fetch(`/api/posts/${postId}/comments?limit=${limit}`, {
        credentials: 'include'
      });
      if (!res.ok) return [];
      const result = await res.json();
      return result.comments || [];
    } catch (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
  }

  static async updateComment(commentId: number, content: string) {
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content })
      });
      if (!res.ok) throw new Error('Failed to update comment');
      const result = await res.json();
      return result.comment;
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  }

  static async deleteComment(commentId: number) {
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      return res.ok;
    } catch (error) {
      console.error('Error deleting comment:', error);
      return false;
    }
  }
}

/**
 * LocalStorage Social Storage (Development)
 */
class LocalStorageSocialStorage {
  private static STORAGE_KEY = 'migistus_social_posts';

  private static getAllPosts() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private static savePosts(posts: any[]) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(posts));
  }

  // Posts
  static async createPost(data: {
    content: string;
    imageUrl?: string;
    type?: string;
    visibility?: string;
  }) {
    const posts = this.getAllPosts();
    const newPost = {
      id: Date.now(),
      userId: 1, // In dev mode, assume single user
      content: data.content,
      imageUrl: data.imageUrl,
      type: data.type || 'post',
      visibility: data.visibility || 'public',
      likesCount: 0,
      commentsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    posts.unshift(newPost);
    this.savePosts(posts);
    return newPost;
  }

  static async getPosts(options: {
    userId?: number;
    type?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    let posts = this.getAllPosts();
    
    if (options.userId) {
      posts = posts.filter((p: any) => p.userId === options.userId);
    }
    
    if (options.type) {
      posts = posts.filter((p: any) => p.type === options.type);
    }
    
    const start = options.offset || 0;
    const end = start + (options.limit || 50);
    
    return posts.slice(start, end);
  }

  static async getFeedPosts(limit: number = 50, offset: number = 0) {
    return this.getPosts({ limit, offset });
  }

  static async getPost(postId: number) {
    const posts = this.getAllPosts();
    return posts.find((p: any) => p.id === postId) || null;
  }

  static async updatePost(postId: number, data: {
    content?: string;
    imageUrl?: string;
    visibility?: string;
  }) {
    const posts = this.getAllPosts();
    const index = posts.findIndex((p: any) => p.id === postId);
    
    if (index === -1) throw new Error('Post not found');
    
    posts[index] = {
      ...posts[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    this.savePosts(posts);
    return posts[index];
  }

  static async deletePost(postId: number) {
    const posts = this.getAllPosts();
    const filtered = posts.filter((p: any) => p.id !== postId);
    
    if (filtered.length === posts.length) return false;
    
    this.savePosts(filtered);
    return true;
  }

  // Likes
  static async likePost(postId: number) {
    const posts = this.getAllPosts();
    const post = posts.find((p: any) => p.id === postId);
    
    if (!post) return false;
    
    post.likesCount = (post.likesCount || 0) + 1;
    this.savePosts(posts);
    return true;
  }

  static async unlikePost(postId: number) {
    const posts = this.getAllPosts();
    const post = posts.find((p: any) => p.id === postId);
    
    if (!post) return false;
    
    post.likesCount = Math.max((post.likesCount || 0) - 1, 0);
    this.savePosts(posts);
    return true;
  }

  static async isPostLiked(postId: number) {
    // In dev mode, simulate not liked
    return false;
  }

  static async getPostLikes(postId: number) {
    return [];
  }

  // Comments
  static async createComment(postId: number, content: string) {
    const posts = this.getAllPosts();
    const post = posts.find((p: any) => p.id === postId);
    
    if (!post) throw new Error('Post not found');
    
    if (!post.comments) post.comments = [];
    
    const newComment = {
      id: Date.now(),
      postId,
      userId: 1,
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    post.comments.push(newComment);
    post.commentsCount = post.comments.length;
    this.savePosts(posts);
    
    return newComment;
  }

  static async getComments(postId: number, limit: number = 100) {
    const post = await this.getPost(postId);
    return post?.comments || [];
  }

  static async updateComment(commentId: number, content: string) {
    const posts = this.getAllPosts();
    
    for (const post of posts) {
      if (post.comments) {
        const comment = post.comments.find((c: any) => c.id === commentId);
        if (comment) {
          comment.content = content;
          comment.updatedAt = new Date().toISOString();
          this.savePosts(posts);
          return comment;
        }
      }
    }
    
    throw new Error('Comment not found');
  }

  static async deleteComment(commentId: number) {
    const posts = this.getAllPosts();
    
    for (const post of posts) {
      if (post.comments) {
        const index = post.comments.findIndex((c: any) => c.id === commentId);
        if (index !== -1) {
          post.comments.splice(index, 1);
          post.commentsCount = post.comments.length;
          this.savePosts(posts);
          return true;
        }
      }
    }
    
    return false;
  }
}

/**
 * Unified SocialPostsStorage interface
 * Automatically routes to correct backend based on environment
 */
export class SocialPostsStorage {
  // Posts
  static async createPost(data: {
    content: string;
    imageUrl?: string;
    type?: string;
    visibility?: string;
  }) {
    if (typeof window === 'undefined') throw new Error('Client-side only');
    
    if (isProduction()) {
      return await DatabaseSocialStorage.createPost(data);
    }
    return await LocalStorageSocialStorage.createPost(data);
  }

  static async getPosts(options: {
    userId?: number;
    type?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    if (typeof window === 'undefined') return [];
    
    if (isProduction()) {
      return await DatabaseSocialStorage.getPosts(options);
    }
    return await LocalStorageSocialStorage.getPosts(options);
  }

  static async getFeedPosts(limit: number = 50, offset: number = 0) {
    if (typeof window === 'undefined') return [];
    
    if (isProduction()) {
      return await DatabaseSocialStorage.getFeedPosts(limit, offset);
    }
    return await LocalStorageSocialStorage.getFeedPosts(limit, offset);
  }

  static async getPost(postId: number) {
    if (typeof window === 'undefined') return null;
    
    if (isProduction()) {
      return await DatabaseSocialStorage.getPost(postId);
    }
    return await LocalStorageSocialStorage.getPost(postId);
  }

  static async updatePost(postId: number, data: {
    content?: string;
    imageUrl?: string;
    visibility?: string;
  }) {
    if (typeof window === 'undefined') throw new Error('Client-side only');
    
    if (isProduction()) {
      return await DatabaseSocialStorage.updatePost(postId, data);
    }
    return await LocalStorageSocialStorage.updatePost(postId, data);
  }

  static async deletePost(postId: number) {
    if (typeof window === 'undefined') return false;
    
    if (isProduction()) {
      return await DatabaseSocialStorage.deletePost(postId);
    }
    return await LocalStorageSocialStorage.deletePost(postId);
  }

  // Likes
  static async likePost(postId: number) {
    if (typeof window === 'undefined') return false;
    
    if (isProduction()) {
      return await DatabaseSocialStorage.likePost(postId);
    }
    return await LocalStorageSocialStorage.likePost(postId);
  }

  static async unlikePost(postId: number) {
    if (typeof window === 'undefined') return false;
    
    if (isProduction()) {
      return await DatabaseSocialStorage.unlikePost(postId);
    }
    return await LocalStorageSocialStorage.unlikePost(postId);
  }

  static async isPostLiked(postId: number) {
    if (typeof window === 'undefined') return false;
    
    if (isProduction()) {
      return await DatabaseSocialStorage.isPostLiked(postId);
    }
    return await LocalStorageSocialStorage.isPostLiked(postId);
  }

  static async getPostLikes(postId: number) {
    if (typeof window === 'undefined') return [];
    
    if (isProduction()) {
      return await DatabaseSocialStorage.getPostLikes(postId);
    }
    return await LocalStorageSocialStorage.getPostLikes(postId);
  }

  // Comments
  static async createComment(postId: number, content: string) {
    if (typeof window === 'undefined') throw new Error('Client-side only');
    
    if (isProduction()) {
      return await DatabaseSocialStorage.createComment(postId, content);
    }
    return await LocalStorageSocialStorage.createComment(postId, content);
  }

  static async getComments(postId: number, limit: number = 100) {
    if (typeof window === 'undefined') return [];
    
    if (isProduction()) {
      return await DatabaseSocialStorage.getComments(postId, limit);
    }
    return await LocalStorageSocialStorage.getComments(postId, limit);
  }

  static async updateComment(commentId: number, content: string) {
    if (typeof window === 'undefined') throw new Error('Client-side only');
    
    if (isProduction()) {
      return await DatabaseSocialStorage.updateComment(commentId, content);
    }
    return await LocalStorageSocialStorage.updateComment(commentId, content);
  }

  static async deleteComment(commentId: number) {
    if (typeof window === 'undefined') return false;
    
    if (isProduction()) {
      return await DatabaseSocialStorage.deleteComment(commentId);
    }
    return await LocalStorageSocialStorage.deleteComment(commentId);
  }
}

export default SocialPostsStorage;
