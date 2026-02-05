import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { api } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);



export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for saved session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('evara_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('evara_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const data = response.data; // Access nested data object

      const userData = {
        id: data.user.id || data.user._id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role
      };

      setUser(userData);
      localStorage.setItem('evara_user', JSON.stringify(userData));
      localStorage.setItem('evara_token', data.token);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const response = await api.post('/auth/register', { name, email, password });
      const data = response.data; // Access nested data object

      const userData = {
        id: data.user.id || data.user._id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role
      };

      setUser(userData);
      localStorage.setItem('evara_user', JSON.stringify(userData));
      localStorage.setItem('evara_token', data.token);
      return true;
    } catch (error) {
      console.error('Signup failed:', error);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('evara_user');
    localStorage.removeItem('evara_token');
  }, []);

  const updateProfile = useCallback((updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('evara_user', JSON.stringify(updatedUser));
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        updateProfile,
      }}
    >
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
