// Social API Client - Connect to backend social endpoints

export interface Post {
  id: number;
  user_id: number;
  username?: string;
  userAvatar?: string;
  content: string;
  image_url?: string;
  type: 'post' | 'announcement' | 'update';
  visibility: 'public' | 'followers' | 'private';
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at?: string;
  isLiked?: boolean;
}

export interface Comment {
  id: number;
  post_id: number;
  user_id: number;
  username?: string;
  userAvatar?: string;
  content: string;
  created_at: string;
  updated_at?: string;
}

export interface CreatePostData {
  content: string;
  imageUrl?: string;
  type?: 'post' | 'announcement' | 'update';
  visibility?: 'public' | 'followers' | 'private';
}

export interface UpdatePostData {
  content?: string;
  imageUrl?: string;
  type?: 'post' | 'announcement' | 'update';
  visibility?: 'public' | 'followers' | 'private';
}

class SocialAPI {
  // Posts
  async getPosts(options: {
    userId?: number;
    type?: string;
    limit?: number;
    offset?: number;
    feed?: boolean;
  } = {}): Promise<{ posts: Post[] }> {
    const params = new URLSearchParams();
    if (options.userId) params.append('userId', options.userId.toString());
    if (options.type) params.append('type', options.type);
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());
    if (options.feed) params.append('feed', 'true');

    const response = await fetch(`/api/posts?${params}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch posts');
    }

    return response.json();
  }

  async getPost(postId: number): Promise<{ post: Post }> {
    const response = await fetch(`/api/posts/${postId}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch post');
    }

    return response.json();
  }

  async createPost(data: CreatePostData): Promise<{ post: Post }> {
    const response = await fetch('/api/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create post');
    }

    return response.json();
  }

  async updatePost(postId: number, data: UpdatePostData): Promise<{ post: Post }> {
    const response = await fetch(`/api/posts/${postId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update post');
    }

    return response.json();
  }

  async deletePost(postId: number): Promise<{ success: boolean }> {
    const response = await fetch(`/api/posts/${postId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete post');
    }

    return response.json();
  }

  // Likes
  async likePost(postId: number): Promise<{ liked: boolean; likesCount: number }> {
    const response = await fetch(`/api/posts/${postId}/like`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to like post');
    }

    return response.json();
  }

  async unlikePost(postId: number): Promise<{ liked: boolean; likesCount: number }> {
    const response = await fetch(`/api/posts/${postId}/like`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to unlike post');
    }

    return response.json();
  }

  // Comments
  async getComments(postId: number, limit = 50, offset = 0): Promise<{ comments: Comment[] }> {
    const response = await fetch(
      `/api/posts/${postId}/comments?limit=${limit}&offset=${offset}`,
      {
        credentials: 'include',
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch comments');
    }

    return response.json();
  }

  async createComment(postId: number, content: string): Promise<{ comment: Comment }> {
    const response = await fetch(`/api/posts/${postId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create comment');
    }

    return response.json();
  }

  async deleteComment(postId: number, commentId: number): Promise<{ success: boolean }> {
    const response = await fetch(`/api/posts/${postId}/comments`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ commentId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete comment');
    }

    return response.json();
  }
}

export const socialAPI = new SocialAPI();
