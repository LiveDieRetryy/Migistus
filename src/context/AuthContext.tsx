import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserStorage3 as UserStorage } from '@/utils/userStorage';
import { UserSyncService } from '@/utils/userSyncService';

interface User {
  id: number;
  username: string;
  email: string;
  sessionId: string;
}

interface RegistrationData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  country: string;
  state?: string;
  city?: string;
  phoneNumber?: string;
  referralSource?: string;
  agreeToMarketing?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, username?: string, registrationData?: RegistrationData) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  isAuthenticated: boolean;
  loading: boolean;
}

// Add this export so AuthContext is available for import elsewhere
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // Only run on client side to prevent hydration issues
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }
    
    const sessionData = localStorage.getItem('userSession');
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData);
        const user = session.user;
        const sessionId = session.sessionId;
        if (user && sessionId && user.id) {
          setUser(user);
          console.log('Restored user session:', user);
          
          // Initialize sync service when user is restored
          if ((window as any).MigistusUserSync) {
            (window as any).MigistusUserSync.initialize();
          } else {
            // Fallback: wait for sync service to load
            setTimeout(() => {
              if ((window as any).MigistusUserSync) {
                (window as any).MigistusUserSync.initialize();
              }
            }, 1000);
          }
        } else {
          localStorage.removeItem('userSession');
          localStorage.removeItem('currentUserId');
        }
      } catch (error) {
        console.error('Invalid session data:', error);
        localStorage.removeItem('userSession');
        localStorage.removeItem('currentUserId');
      }
    } else {
      // Even without a session, initialize sync to capture any existing users
      setTimeout(() => {
        if ((window as any).MigistusUserSync) {
          (window as any).MigistusUserSync.initialize();
        }
      }, 2000);
    }
    setLoading(false);
  }, [mounted]);

  const login = async (email: string, password: string, username?: string, registrationData?: RegistrationData): Promise<boolean> => {
    try {
      console.log(`Starting ${username ? 'registration' : 'login'} process for: ${email}`);
      
      // If this is a registration (username provided), call the register API
      if (username && registrationData) {
        try {
          console.log('📝 Calling registration API...');
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              username,
              email,
              password,
              ...registrationData
            }),
          });

          if (response.ok) {
            const data = await response.json();
            const newUser = data.user;
            
            console.log('✅ Registration API successful:', newUser);
            
            // Create user profile in localStorage
            const newProfile = {
              id: newUser.id,
              username: newUser.username,
              email: newUser.email,
              bio: newUser.bio || "",
              avatar: newUser.avatar || null,
              banner: null,
              tier: newUser.tier || "New Member",
              guildTokens: newUser.guildCoins || 100,
              joinedDate: newUser.joinDate || new Date().toISOString().split('T')[0],
              titles: [],
              badges: [],
              links: [],
              stats: {
                totalPledges: newUser.totalPledges || 0,
                totalVotes: newUser.totalVotes || 0,
                dropsJoined: newUser.dropsJoined || 0,
                followers: newUser.followers || 0,
                following: newUser.following || 0
              },
              firstName: newUser.firstName,
              lastName: newUser.lastName,
              dateOfBirth: registrationData.dateOfBirth,
              country: newUser.country,
              state: newUser.state || '',
              city: newUser.city || '',
              phoneNumber: registrationData.phoneNumber || '',
              referralSource: registrationData.referralSource || '',
              agreeToMarketing: registrationData.agreeToMarketing || false,
              registrationComplete: true,
              registeredAt: new Date().toISOString()
            };
            UserStorage.setUserProfile(newUser.id, newProfile);
            
            const sessionId = generateSessionId();
            const sessionData = {
              user: { ...newUser, sessionId: sessionId },
              createdAt: new Date().toISOString(),
              sessionId: sessionId
            };

            localStorage.setItem('userSession', JSON.stringify(sessionData));
            localStorage.setItem('currentUserId', newUser.id.toString());
            
            setUser(newUser);
            console.log('✅ New user registered and logged in via API');
            
            // Initialize activity tracking
            const { activityTracker } = await import('@/utils/activityTracker');
            activityTracker.initialize(newUser.id, sessionId);
            
            // Initialize sync service
            if ((window as any).MigistusUserSync) {
              (window as any).MigistusUserSync.initialize();
              setTimeout(() => {
                (window as any).MigistusUserSync.triggerManualSync();
              }, 1000);
            }
            
            return true;
          } else {
            const errorData = await response.json();
            console.error('❌ Registration API failed:', errorData.error);
            return false;
          }
        } catch (registerError) {
          console.error('❌ Registration API error:', registerError);
          return false;
        }
      }
      
      // For login (no username), try API authentication with the database
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        if (response.ok) {
          const data = await response.json();
          const authenticatedUser = data.user;
          
          console.log('API authentication successful:', authenticatedUser);
          
          // Ensure user profile exists in localStorage
          const existingProfile = UserStorage.getUserProfile(authenticatedUser.id);
          if (!existingProfile) {
            console.log('Creating profile for user:', authenticatedUser.username);
            const newProfile = {
              id: authenticatedUser.id,
              username: authenticatedUser.username,
              email: authenticatedUser.email,
              bio: authenticatedUser.bio || "",
              avatar: authenticatedUser.avatar || null,
              banner: authenticatedUser.banner || null,
              tier: authenticatedUser.tier || "New Member",
              guildTokens: authenticatedUser.guildCoins || 0,
              joinedDate: authenticatedUser.joinDate || new Date().toISOString().split('T')[0],
              titles: authenticatedUser.titles || [],
              badges: authenticatedUser.badges || [],
              links: authenticatedUser.links || [],
              stats: {
                totalPledges: authenticatedUser.totalPledges || 0,
                totalVotes: authenticatedUser.totalVotes || 0,
                dropsJoined: authenticatedUser.dropsJoined || 0,
                followers: authenticatedUser.followers || 0,
                following: authenticatedUser.following || 0
              },
              // Add registration data if this is a new registration
              ...(registrationData && {
                firstName: registrationData.firstName,
                lastName: registrationData.lastName,
                dateOfBirth: registrationData.dateOfBirth,
                country: registrationData.country,
                state: registrationData.state || '',
                city: registrationData.city || '',
                phoneNumber: registrationData.phoneNumber || '',
                referralSource: registrationData.referralSource || '',
                agreeToMarketing: registrationData.agreeToMarketing || false,
                registrationComplete: true,
                registeredAt: new Date().toISOString()
              })
            };
            UserStorage.setUserProfile(authenticatedUser.id, newProfile);
          }
          
          const sessionId = generateSessionId();
          const sessionData = {
            user: {...authenticatedUser, sessionId: sessionId},
            createdAt: new Date().toISOString(),
            sessionId: sessionId
          };

          localStorage.setItem('userSession', JSON.stringify(sessionData));
          localStorage.setItem('currentUserId', authenticatedUser.id.toString());
          
          setUser(authenticatedUser);
          console.log('User logged in successfully via API');
          
          // Initialize activity tracking
          const { activityTracker } = await import('@/utils/activityTracker');
          activityTracker.initialize(authenticatedUser.id, sessionId);
          
          // Initialize sync service and trigger immediate sync
          if ((window as any).MigistusUserSync) {
            (window as any).MigistusUserSync.initialize();
            setTimeout(() => {
              (window as any).MigistusUserSync.triggerManualSync();
            }, 1000);
          }
          
          return true;
        }
      } catch (apiError) {
        console.log('API login failed, trying localStorage fallback:', apiError);
      }
      
      // Fallback: Check if this is an existing user in localStorage
      const existingUser = findExistingUser(email);
      
      if (existingUser) {
        // Existing user login
        console.log('Found existing user in localStorage, logging them in:', existingUser);
        
        const sessionId = generateSessionId();
        const sessionData = {
          user: {...existingUser, sessionId: sessionId},
          createdAt: new Date().toISOString(),
          sessionId: sessionId
        };

        localStorage.setItem('userSession', JSON.stringify(sessionData));
        localStorage.setItem('currentUserId', existingUser.id.toString());
        
        setUser(existingUser);
        console.log('Existing user logged in successfully');
        
        // Initialize activity tracking
        const { activityTracker } = await import('@/utils/activityTracker');
        activityTracker.initialize(existingUser.id, sessionId);
        
        // Initialize sync service and trigger immediate sync
        if ((window as any).MigistusUserSync) {
          (window as any).MigistusUserSync.initialize();
          setTimeout(() => {
            (window as any).MigistusUserSync.triggerManualSync();
          }, 1000);
        }
        
        // --- ADD: Sync wallet and guild coins to backend on login ---
        try {
          const wallet = UserStorage.getUserWalletBalance(existingUser.id);
          const guildCoins = UserStorage.getUserGuildCoins(existingUser.id);
          await fetch(`/api/users/${existingUser.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              wallet,
              guildCoins
            }),
          });
        } catch (err) {
          console.warn("Failed to sync wallet/guild coins to backend:", err);
        }
        // --- END ADD ---
        return true;
      }
      
      // New user registration
      if (!username) {
        console.log('No existing user found and no username provided for registration');
        return false;
      }

      // ENFORCE UNIQUENESS: Check for duplicate email or username
      if (isEmailTaken(email)) {
        console.log('Registration failed: Email already exists');
        return false;
      }
      if (isUsernameTaken(username)) {
        console.log('Registration failed: Username already exists');
        return false;
      }
      
      console.log('Creating new user account');
      
      // Generate truly unique user ID
      const timestamp = Date.now();
      const emailHash = hashString(email);
      const uniqueId = parseInt(`${emailHash}${timestamp.toString().slice(-6)}`);
      
      console.log(`Generated UNIQUE user ID: ${uniqueId} for email: ${email}`);
      
      // Use the provided username directly
      const finalUsername = username.trim();
      
      const userData: User = {
        id: uniqueId,
        username: finalUsername,
        email,
        sessionId: generateSessionId()
      };

      // Save user to persistent storage
      saveUserToPersistentStorage(userData);

      // Create fresh profile immediately with registration data
      if (finalUsername) {
        const freshProfile = {
          id: uniqueId,
          username: finalUsername,
          email,
          bio: "",
          avatar: null,
          banner: null,
          tier: "New Member",
          guildTokens: 0,
          joinedDate: new Date().toISOString().split('T')[0],
          titles: [],
          badges: [],
          links: [],
          stats: { totalPledges: 0, totalVotes: 0, dropsJoined: 0, followers: 0, following: 0 },
          // Add registration data if provided
          ...(registrationData && {
            firstName: registrationData.firstName,
            lastName: registrationData.lastName,
            dateOfBirth: registrationData.dateOfBirth,
            country: registrationData.country,
            state: registrationData.state || '',
            city: registrationData.city || '',
            phoneNumber: registrationData.phoneNumber || '',
            referralSource: registrationData.referralSource || '',
            agreeToMarketing: registrationData.agreeToMarketing || false,
            registrationComplete: true,
            registeredAt: new Date().toISOString()
          })
        };
        
        try {
          UserStorage?.setUserProfile?.(uniqueId, freshProfile);
        } catch (error) {
          console.warn('UserStorage not available, using manual storage');
          localStorage.setItem(`user_${uniqueId}_profile`, JSON.stringify(freshProfile));
        }
      }

      const sessionData = {
        user: userData,
        createdAt: new Date().toISOString(),
        sessionId: userData.sessionId // <-- FIX: use explicit property assignment
      };

      localStorage.setItem('userSession', JSON.stringify(sessionData));
      localStorage.setItem('currentUserId', uniqueId.toString());
      
      setUser(userData);
      
      // Initialize activity tracking for new user
      const { activityTracker } = await import('@/utils/activityTracker');
      activityTracker.initialize(uniqueId, userData.sessionId); // <-- FIX: use userData.sessionId
      
      console.log(`New user created:`, userData);
      
      // Initialize sync service and trigger immediate sync for new user
      if ((window as any).MigistusUserSync) {
        (window as any).MigistusUserSync.initialize();
        setTimeout(() => {
          (window as any).MigistusUserSync.triggerManualSync();
        }, 1500);
      }
      
      // --- ADD: Sync new user to backend for user management page ---
      try {
        const wallet = UserStorage.getUserWalletBalance(uniqueId);
        const guildCoins = UserStorage.getUserGuildCoins(uniqueId);
        await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify([{
            id: uniqueId,
            username: finalUsername,
            tier: "New Member",
            banned: false,
            wallet,
            guildCoins
          }])
        });
      } catch (err) {
        console.warn("Failed to sync new user to backend:", err);
      }
      // --- END ADD ---
      
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  // Find existing user by email
  const findExistingUser = (email: string): User | null => {
    // Ensure we're on the client side
    if (typeof window === 'undefined') return null;
    
    try {
      // Check in persistent user registry
      const userRegistry = JSON.parse(localStorage.getItem('migistus_user_registry') || '{}');
      const existingUserData = userRegistry[email.toLowerCase()];
      
      if (existingUserData) {
        return existingUserData;
      }
      
      // Fallback: check old storage systems
      const allKeys = Object.keys(localStorage);
      
      // Check new system profiles
      for (const key of allKeys) {
        if (key.startsWith('user_') && key.endsWith('_profile')) {
          try {
            const profile = JSON.parse(localStorage.getItem(key) || '{}');
            if (profile.email && profile.email.toLowerCase() === email.toLowerCase()) {
              return {
                id: profile.id,
                username: profile.username,
                email: profile.email,
                sessionId: generateSessionId()
              };
            }
          } catch (error) {
            // Continue checking other keys
          }
        }
      }
      
      // Check old system profiles
      for (const key of allKeys) {
        if (key.startsWith('userProfile_')) {
          try {
            const profile = JSON.parse(localStorage.getItem(key) || '{}');
            if (profile.email && profile.email.toLowerCase() === email.toLowerCase()) {
              return {
                id: profile.id,
                username: profile.username,
                email: profile.email,
                sessionId: generateSessionId()
              };
            }
          } catch (error) {
            // Continue checking other keys
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error finding existing user:', error);
      return null;
    }
  };

  // Save user to persistent registry
  const saveUserToPersistentStorage = (userData: User) => {
    // Ensure we're on the client side
    if (typeof window === 'undefined') return;
    
    try {
      const userRegistry = JSON.parse(localStorage.getItem('migistus_user_registry') || '{}');
      userRegistry[userData.email.toLowerCase()] = userData;
      localStorage.setItem('migistus_user_registry', JSON.stringify(userRegistry));
      console.log('User saved to persistent registry');
    } catch (error) {
      console.error('Failed to save user to registry:', error);
    }
  };

  const logout = async () => {
    if (user) {
      // Track logout before clearing data
      import('@/utils/activityTracker').then(({ activityTracker }) => {
        activityTracker.trackLogout();
      });
      
      // Stop user sync service on logout
      if ((window as any).MigistusUserSync) {
        (window as any).MigistusUserSync.stopAutoSync();
      }
      
      // Call server-side logout to clear session
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch (error) {
        console.error('Logout API error:', error);
      }
      
      // Only clear session data, preserve user data and profiles
      if (typeof window !== 'undefined') {
        localStorage.removeItem('userSession');
        localStorage.removeItem('currentUserId');
      }
    }
    setUser(null);
    console.log('User logged out, data preserved');
  };

  const updateUser = (updates: Partial<User>) => {
    if (!user || typeof window === 'undefined') return;
    
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    
    // Update session storage
    const sessionData = JSON.parse(localStorage.getItem('userSession') || '{}');
    if (sessionData.user) {
      sessionData.user = updatedUser;
      localStorage.setItem('userSession', JSON.stringify(sessionData));
    }
    
    // Update user registry
    try {
      const userRegistry = JSON.parse(localStorage.getItem('migistus_user_registry') || '{}');
      userRegistry[updatedUser.email.toLowerCase()] = updatedUser;
      localStorage.setItem('migistus_user_registry', JSON.stringify(userRegistry));
    } catch (error) {
      console.error('Failed to update user registry:', error);
    }
    
    // Trigger immediate sync when user is updated
    if ((window as any).MigistusUserSync) {
      setTimeout(() => {
        (window as any).MigistusUserSync.triggerManualSync();
      }, 500);
    }
  };

  // Improved hash function
  function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash % 99999) + 10000;
  }

  function generateSessionId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // Helper: Check if email is already registered (case-insensitive)
  const isEmailTaken = (email: string): boolean => {
    try {
      const userRegistry = JSON.parse(localStorage.getItem('migistus_user_registry') || '{}');
      if (userRegistry[email.toLowerCase()]) return true;
      // Check all profiles for duplicate email
      const allKeys = Object.keys(localStorage);
      for (const key of allKeys) {
        if (key.endsWith('_profile')) {
          const profile = JSON.parse(localStorage.getItem(key) || '{}');
          if (profile.email && profile.email.toLowerCase() === email.toLowerCase()) {
            return true;
          }
        }
      }
      return false;
    } catch {
      return false;
    }
  };

  // Helper: Check if username is already taken (case-insensitive)
  const isUsernameTaken = (username: string): boolean => {
    try {
      // Check all profiles for duplicate username
      const allKeys = Object.keys(localStorage);
      for (const key of allKeys) {
        if (key.endsWith('_profile')) {
          const profile = JSON.parse(localStorage.getItem(key) || '{}');
          if (profile.username && profile.username.toLowerCase() === username.toLowerCase()) {
            return true;
          }
        }
      }
      // Check user registry as well
      const userRegistry = JSON.parse(localStorage.getItem('migistus_user_registry') || '{}');
      for (const userData of Object.values(userRegistry)) {
        if ((userData as any).username && (userData as any).username.toLowerCase() === username.toLowerCase()) {
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      updateUser,
      isAuthenticated: mounted ? !!user : false, // Prevent hydration mismatch
      loading: !mounted || loading // Keep loading until mounted
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
