import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, useGetCurrentUser } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';

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
  const [initialUser, setInitialUser] = useState<User | null>(null);
  const queryClient = useQueryClient();
  
  const { data: fetchedUser, isLoading, isError } = useGetCurrentUser({
    query: {
      queryKey: ['/api/auth/me'],
      enabled: !!token,
      retry: false,
    }
  });

  const currentUser = fetchedUser || initialUser;

  useEffect(() => {
    if (isError && !initialUser) {
      localStorage.removeItem('token');
      setToken(null);
      setInitialUser(null);
    }
  }, [isError, initialUser]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    setInitialUser(newUser);
    setToken(newToken);
    queryClient.invalidateQueries();
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setInitialUser(null);
    queryClient.clear();
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider 
      value={{ 
        token, 
        user: currentUser || null, 
        login, 
        logout, 
        isLoading: !!token && !currentUser && isLoading, 
        isAuthenticated: !!token 
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
