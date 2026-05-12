import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

export interface AgencyUser {
  id: string;
  email: string;
  role: string;
  displayName?: string | null;
}

interface AgencyAuthContextType {
  user: AgencyUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAgency: boolean;
}

const AgencyAuthContext = createContext<AgencyAuthContextType | undefined>(undefined);

export const AgencyAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AgencyUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('agencyToken');
    const saved = localStorage.getItem('agencyUser');
    if (token && saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        localStorage.removeItem('agencyToken');
        localStorage.removeItem('agencyUser');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await axios.post(`${API_BASE_URL}/auth/agency-login`, { email, password });
    const { token, user: u } = res.data.data;
    localStorage.setItem('agencyToken', token);
    localStorage.setItem('agencyUser', JSON.stringify(u));
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem('agencyToken');
    localStorage.removeItem('agencyUser');
    setUser(null);
  };

  const isAgency = user?.role === 'agency';

  return (
    <AgencyAuthContext.Provider value={{ user, loading, login, logout, isAgency }}>
      {children}
    </AgencyAuthContext.Provider>
  );
};

export const useAgencyAuth = () => {
  const ctx = useContext(AgencyAuthContext);
  if (!ctx) throw new Error('useAgencyAuth must be used within AgencyAuthProvider');
  return ctx;
};
