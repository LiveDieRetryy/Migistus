// Session Management Hook
// Provides session validation, auto-refresh, and expiration handling

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { authAPI } from '@/lib/authAPI';
import type { Session, User } from '@/lib/authAPI';

interface UseSessionOptions {
  redirectTo?: string;
  redirectIfFound?: boolean;
  onSessionExpired?: () => void;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
  showWarning?: boolean;
  warningTime?: number; // seconds before expiration to show warning
}

interface UseSessionReturn {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isExpiring: boolean;
  timeUntilExpiration: number | null;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
  updateActivity: (page?: string) => Promise<void>;
}

export function useSession(options: UseSessionOptions = {}): UseSessionReturn {
  const {
    redirectTo,
    redirectIfFound = false,
    onSessionExpired,
    autoRefresh = true,
    refreshInterval = 5 * 60 * 1000, // 5 minutes
    showWarning = true,
    warningTime = 5 * 60, // 5 minutes
  } = options;

  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExpiring, setIsExpiring] = useState(false);
  const [timeUntilExpiration, setTimeUntilExpiration] = useState<number | null>(null);
  const refreshTimerRef = useRef<NodeJS.Timeout>();
  const expirationTimerRef = useRef<NodeJS.Timeout>();

  // Calculate time until session expires
  const calculateTimeUntilExpiration = useCallback((expiresAt: string): number => {
    const expirationTime = new Date(expiresAt).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((expirationTime - now) / 1000));
  }, []);

  // Refresh session
  const refreshSession = useCallback(async () => {
    try {
      const newSession = await authAPI.getSession();
      if (newSession) {
        setSession(newSession);
        const timeLeft = calculateTimeUntilExpiration(newSession.expiresAt);
        setTimeUntilExpiration(timeLeft);
        
        // Check if session is expiring soon
        if (showWarning && timeLeft <= warningTime && timeLeft > 0) {
          setIsExpiring(true);
        } else {
          setIsExpiring(false);
        }
      } else {
        // Session expired or doesn't exist
        setSession(null);
        setTimeUntilExpiration(null);
        setIsExpiring(false);
        
        if (onSessionExpired) {
          onSessionExpired();
        }
        
        if (redirectTo && !router.pathname.startsWith('/login')) {
          router.push(redirectTo);
        }
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
      setSession(null);
    }
  }, [calculateTimeUntilExpiration, onSessionExpired, redirectTo, router, showWarning, warningTime]);

  // Update activity
  const updateActivity = useCallback(async (page?: string) => {
    try {
      await authAPI.updateActivity(page || router.pathname);
      // Refresh session after activity update
      await refreshSession();
    } catch (error) {
      console.error('Error updating activity:', error);
    }
  }, [refreshSession, router.pathname]);

  // Logout
  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
      setSession(null);
      setTimeUntilExpiration(null);
      setIsExpiring(false);
      
      // Clear local storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('isSignedIn');
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('userId');
        localStorage.removeItem('userSession');
      }
      
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }, [router]);

  // Initial session load
  useEffect(() => {
    async function loadSession() {
      setLoading(true);
      try {
        const currentSession = await authAPI.getSession();
        
        if (currentSession) {
          setSession(currentSession);
          const timeLeft = calculateTimeUntilExpiration(currentSession.expiresAt);
          setTimeUntilExpiration(timeLeft);
          
          // Redirect if session found and redirectIfFound is true
          if (redirectIfFound && redirectTo) {
            router.push(redirectTo);
          }
        } else if (redirectTo && !redirectIfFound) {
          // No session and should redirect to login
          router.push(redirectTo);
        }
      } catch (error) {
        console.error('Error loading session:', error);
      } finally {
        setLoading(false);
      }
    }

    loadSession();
  }, [calculateTimeUntilExpiration, redirectIfFound, redirectTo, router]);

  // Auto-refresh session
  useEffect(() => {
    if (!session || !autoRefresh) return;

    refreshTimerRef.current = setInterval(() => {
      refreshSession();
    }, refreshInterval);

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [session, autoRefresh, refreshInterval, refreshSession]);

  // Track expiration countdown
  useEffect(() => {
    if (!session || timeUntilExpiration === null) return;

    expirationTimerRef.current = setInterval(() => {
      setTimeUntilExpiration((prev) => {
        if (prev === null || prev <= 0) return 0;
        const newTime = prev - 1;
        
        // Show warning when close to expiration
        if (showWarning && newTime <= warningTime && newTime > 0) {
          setIsExpiring(true);
        }
        
        // Session expired
        if (newTime <= 0) {
          setIsExpiring(false);
          if (onSessionExpired) {
            onSessionExpired();
          }
          return 0;
        }
        
        return newTime;
      });
    }, 1000);

    return () => {
      if (expirationTimerRef.current) {
        clearInterval(expirationTimerRef.current);
      }
    };
  }, [session, timeUntilExpiration, showWarning, warningTime, onSessionExpired]);

  // Update activity on route change
  useEffect(() => {
    if (!session) return;

    const handleRouteChange = () => {
      updateActivity();
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [session, router.events, updateActivity]);

  return {
    session,
    user: session?.user || null,
    loading,
    isAuthenticated: !!session,
    isExpiring,
    timeUntilExpiration,
    refreshSession,
    logout,
    updateActivity,
  };
}

// Format time remaining
export function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return 'Expired';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}
