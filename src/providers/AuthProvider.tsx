import { useState, useEffect } from 'react';
import { AuthContext } from '@/context/AuthContext';

// Add a no-op updateUser function to match the required AuthContextType
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = async (email: string, password: string) => {
    // Implement your login logic here
    return false;
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  // Add this function to satisfy AuthContextType
  const updateUser = (data: Partial<any>) => {
    setUser((prev: any) => ({ ...prev, ...data }));
  };

  useEffect(() => {
    // Check initial auth state
    const checkAuth = async () => {
      try {
        setLoading(true);
        const userId = localStorage.getItem('userId');
        setIsAuthenticated(!!userId);
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
