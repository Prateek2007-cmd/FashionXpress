import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

const RENDER_API = 'https://fashionxpress.onrender.com';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!localStorage.getItem('token'));
  const queryClient = useQueryClient();

  const fetchCurrentUser = async (tok: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${RENDER_API}/api/auth/me`, {
        headers: { Authorization: `Bearer ${tok}` },
      });
      if (!res.ok) {
        // Token invalid — clear it
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        return;
      }
      const data = await res.json();
      setUser(data);
    } catch {
      // Network error — keep token, don't log out (might be cold start)
      // But don't block rendering
    } finally {
      setIsLoading(false);
    }
  };

  // On mount or token change, fetch user profile
  useEffect(() => {
    if (token) {
      fetchCurrentUser(token);
    } else {
      setIsLoading(false);
      setUser(null);
    }
  }, [token]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
    queryClient.invalidateQueries();
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    queryClient.clear();
    window.location.href = '/';
  };

  const refreshUser = () => {
    if (token) fetchCurrentUser(token);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        login,
        logout,
        isLoading,
        isAuthenticated: !!token,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
