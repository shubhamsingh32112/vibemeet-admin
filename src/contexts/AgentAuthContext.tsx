import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

export interface AgentUser {
  id: string;
  email: string;
  role: string;
  displayName?: string | null;
  referralCode?: string | null;
}

interface AgentAuthContextType {
  user: AgentUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAgent: boolean;
}

const AgentAuthContext = createContext<AgentAuthContextType | undefined>(undefined);

export const AgentAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AgentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('agentToken');
    const saved = localStorage.getItem('agentUser');
    if (token && saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        localStorage.removeItem('agentToken');
        localStorage.removeItem('agentUser');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await axios.post(`${API_BASE_URL}/auth/agent-login`, { email, password });
    const { token, user: u } = res.data.data;
    localStorage.setItem('agentToken', token);
    localStorage.setItem('agentUser', JSON.stringify(u));
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem('agentToken');
    localStorage.removeItem('agentUser');
    setUser(null);
  };

  const isAgent = user?.role === 'agent' || user?.role === 'bd';

  return (
    <AgentAuthContext.Provider value={{ user, loading, login, logout, isAgent }}>
      {children}
    </AgentAuthContext.Provider>
  );
};

export const useAgentAuth = () => {
  const ctx = useContext(AgentAuthContext);
  if (!ctx) throw new Error('useAgentAuth must be used within AgentAuthProvider');
  return ctx;
};
