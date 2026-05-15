import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

export interface BdUser {
  id: string;
  email: string;
  role: string;
  displayName?: string | null;
  mustChangePassword?: boolean;
}

interface BdAuthContextType {
  user: BdUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<BdUser>;
  logout: () => void;
  isBd: boolean;
  updateUser: (patch: Partial<BdUser>) => void;
}

const BdAuthContext = createContext<BdAuthContextType | undefined>(undefined);

function persistBdUser(u: BdUser | null) {
  if (u) {
    localStorage.setItem('bdUser', JSON.stringify(u));
  } else {
    localStorage.removeItem('bdUser');
  }
}

export const BdAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<BdUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const token = localStorage.getItem('bdToken');
      const saved = localStorage.getItem('bdUser');
      let parsed: BdUser | null = null;
      if (token && saved) {
        try {
          parsed = JSON.parse(saved) as BdUser;
        } catch {
          localStorage.removeItem('bdToken');
          localStorage.removeItem('bdUser');
        }
      }

      if (token && parsed) {
        try {
          const res = await axios.get(`${API_BASE_URL}/bd/summary`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const mustChangePassword = res.data?.data?.mustChangePassword === true;
          parsed = { ...parsed, mustChangePassword };
          persistBdUser(parsed);
        } catch {
          /* keep cached user */
        }
      }

      if (!cancelled) {
        setUser(parsed);
        setLoading(false);
      }
    };

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email: string, password: string) => {
    const res = await axios.post(`${API_BASE_URL}/auth/bd-login`, { email, password });
    const { token, user: u } = res.data.data as { token: string; user: BdUser };
    localStorage.setItem('bdToken', token);
    persistBdUser(u);
    setUser(u);
    return u;
  };

  const logout = () => {
    localStorage.removeItem('bdToken');
    localStorage.removeItem('bdUser');
    setUser(null);
  };

  const updateUser = (patch: Partial<BdUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      persistBdUser(next);
      return next;
    });
  };

  const isBd = user?.role === 'bd';

  return (
    <BdAuthContext.Provider value={{ user, loading, login, logout, isBd, updateUser }}>
      {children}
    </BdAuthContext.Provider>
  );
};

export const useBdAuth = () => {
  const ctx = useContext(BdAuthContext);
  if (!ctx) throw new Error('useBdAuth must be used within BdAuthProvider');
  return ctx;
};
