// Authentication API Client
// Centralized client for all authentication-related API calls

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  country?: string;
  state?: string;
  city?: string;
  zipCode?: string;
  phoneNumber?: string;
  referralSource?: string;
  agreeToMarketing?: boolean;
  preferredLanguage?: string;
  timezone?: string;
  gender?: string;
  accountPurpose?: string;
  avatarFile?: File;
}

export interface User {
  id: number;
  username: string;
  email: string;
  tier: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  createdAt?: string;
  lastLogin?: string;
}

export interface Session {
  user: User;
  sessionId: string;
  expiresAt: string;
}

class AuthAPIClient {
  private baseURL = '/api';

  // Login with email/password
  async login(credentials: LoginCredentials): Promise<{ user: User; session: Session }> {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    return response.json();
  }

  // Admin login
  async adminLogin(username: string, password: string): Promise<{ user: User; session: Session }> {
    const response = await fetch(`${this.baseURL}/auth/admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Admin login failed');
    }

    return response.json();
  }

  // Register new user
  async register(data: RegisterData): Promise<{ user: User; session: Session }> {
    // Use FormData if avatar file is present, otherwise use JSON
    let body: FormData | string;
    let headers: HeadersInit = {};

    if (data.avatarFile) {
      const formData = new FormData();
      
      // Add all fields to FormData
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'avatarFile' && value instanceof File) {
          formData.append('avatar', value);
        } else if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });
      
      body = formData;
      // Don't set Content-Type for FormData - browser will set it with boundary
    } else {
      headers = { 'Content-Type': 'application/json' };
      body = JSON.stringify(data);
    }

    const response = await fetch(`${this.baseURL}/auth/register`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    return response.json();
  }

  // Logout
  async logout(): Promise<void> {
    const response = await fetch(`${this.baseURL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Logout failed');
    }
  }

  // Get current session
  async getSession(): Promise<Session | null> {
    try {
      const response = await fetch(`${this.baseURL}/auth/session`, {
        credentials: 'include',
      });

      if (!response.ok) {
        return null;
      }

      return response.json();
    } catch (error) {
      return null;
    }
  }

  // Validate session
  async validateSession(): Promise<boolean> {
    const session = await this.getSession();
    return session !== null;
  }

  // Update session activity
  async updateActivity(currentPage?: string): Promise<void> {
    await fetch(`${this.baseURL}/auth/activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ currentPage }),
    });
  }

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Password change failed');
    }
  }

  // Request password reset
  async requestPasswordReset(email: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Password reset request failed');
    }
  }

  // Reset password with token
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Password reset failed');
    }
  }
}

export const authAPI = new AuthAPIClient();
