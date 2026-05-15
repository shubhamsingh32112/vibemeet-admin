import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

export interface AgencyUser {
  id: string;
  email: string;
  role: string;
  displayName?: string | null;
  referralCode?: string | null;
  mustChangePassword?: boolean;
}

interface AgencyAuthContextType {
  user: AgencyUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AgencyUser>;
  logout: () => void;
  isAgency: boolean;
  updateUser: (patch: Partial<AgencyUser>) => void;
  updateUserFields: (patch: Partial<AgencyUser>) => void;
}

const AgencyAuthContext = createContext<AgencyAuthContextType | undefined>(undefined);

function persistAgencyUser(u: AgencyUser | null) {
  if (u) {
    localStorage.setItem('agencyUser', JSON.stringify(u));
  } else {
    localStorage.removeItem('agencyUser');
  }
}

export const AgencyAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AgencyUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const token = localStorage.getItem('agencyToken');
      const saved = localStorage.getItem('agencyUser');
      let parsed: AgencyUser | null = null;
      if (token && saved) {
        try {
          parsed = JSON.parse(saved) as AgencyUser;
        } catch {
          localStorage.removeItem('agencyToken');
          localStorage.removeItem('agencyUser');
        }
      }

      if (token && parsed) {
        try {
          const res = await axios.get(`${API_BASE_URL}/agency/summary`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const mustChangePassword = res.data?.data?.mustChangePassword === true;
          parsed = { ...parsed, mustChangePassword };
          persistAgencyUser(parsed);
        } catch {
          /* keep cached user; protected routes may 401 */
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
    const res = await axios.post(`${API_BASE_URL}/auth/agency-login`, { email, password });
    const { token, user: u } = res.data.data as { token: string; user: AgencyUser };
    localStorage.setItem('agencyToken', token);
    persistAgencyUser(u);
    setUser(u);
    return u;
  };

  const logout = () => {
    localStorage.removeItem('agencyToken');
    localStorage.removeItem('agencyUser');
    setUser(null);
  };

  const updateUser = (patch: Partial<AgencyUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      persistAgencyUser(next);
      return next;
    });
  };

  const isAgency = user?.role === 'agency';

  return (
    <AgencyAuthContext.Provider
      value={{ user, loading, login, logout, isAgency, updateUser, updateUserFields: updateUser }}
    >
      {children}
    </AgencyAuthContext.Provider>
  );
};

export const useAgencyAuth = () => {
  const ctx = useContext(AgencyAuthContext);
  if (!ctx) throw new Error('useAgencyAuth must be used within AgencyAuthProvider');
  return ctx;
};
