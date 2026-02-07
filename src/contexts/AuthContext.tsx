import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../config/api';

interface AdminUser {
  id: string;
  email: string;
  role: string;
  firebaseUid: string;
}

interface AuthContextType {
  user: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount, check if we have a saved session
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const savedUser = localStorage.getItem('adminUser');

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/admin-login', { email, password });
    const { token, user: adminUser } = response.data.data;

    localStorage.setItem('adminToken', token);
    localStorage.setItem('adminUser', JSON.stringify(adminUser));
    setUser(adminUser);
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
