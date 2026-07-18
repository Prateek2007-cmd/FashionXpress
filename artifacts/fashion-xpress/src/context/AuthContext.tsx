import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, useGetCurrentUser } from '@workspace/api-client-react';

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  
  // We use the query, but only enable it if we have a token.
  // Wait, orval generated hooks:
  // useGetCurrentUser(options?: { query?: UseQueryOptions... })
  const { data: user, isLoading, isError } = useGetCurrentUser({
    query: {
      enabled: !!token,
      retry: false,
      queryKey: ['/auth/me']
    }
  });

  useEffect(() => {
    if (isError) {
      // Token might be invalid
      localStorage.removeItem('token');
      setToken(null);
    }
  }, [isError]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    // The query will automatically fetch the user now, but we don't have a way to manually set the query data here easily without queryClient.
    // It will just reload quickly.
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ token, user: user || null, login, logout, isLoading: !!token && isLoading, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
