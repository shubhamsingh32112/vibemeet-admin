import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

export interface BdUser {
  id: string;
  email: string;
  role: string;
  displayName?: string | null;
}

interface BdAuthContextType {
  user: BdUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isBd: boolean;
}

const BdAuthContext = createContext<BdAuthContextType | undefined>(undefined);

export const BdAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<BdUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('bdToken');
    const saved = localStorage.getItem('bdUser');
    if (token && saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        localStorage.removeItem('bdToken');
        localStorage.removeItem('bdUser');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await axios.post(`${API_BASE_URL}/auth/bd-login`, { email, password });
    const { token, user: u } = res.data.data;
    localStorage.setItem('bdToken', token);
    localStorage.setItem('bdUser', JSON.stringify(u));
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem('bdToken');
    localStorage.removeItem('bdUser');
    setUser(null);
  };

  const isBd = user?.role === 'bd';

  return (
    <BdAuthContext.Provider value={{ user, loading, login, logout, isBd }}>
      {children}
    </BdAuthContext.Provider>
  );
};

export const useBdAuth = () => {
  const ctx = useContext(BdAuthContext);
  if (!ctx) throw new Error('useBdAuth must be used within BdAuthProvider');
  return ctx;
};
