import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from '../config/firebase';
import api from '../config/api';

interface AuthContextType {
  user: User | null;
  userRole: 'user' | 'creator' | 'admin' | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'user' | 'creator' | 'admin' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const token = await firebaseUser.getIdToken();
        localStorage.setItem('firebaseToken', token);
        
        // Provision user + fetch role from backend (creates user ONLY in /auth/login)
        try {
          const response = await api.post('/auth/login');
          const role = response.data.data.user.role || 'user';
          setUserRole(role);
        } catch (error) {
          console.error('Failed to fetch user role:', error);
          setUserRole('user');
        }
      } else {
        setUser(null);
        setUserRole(null);
        localStorage.removeItem('firebaseToken');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const token = await userCredential.user.getIdToken();
    localStorage.setItem('firebaseToken', token);
    
    // Provision user + fetch role
    const response = await api.post('/auth/login');
    const role = response.data.data.user.role || 'user';
    setUserRole(role);
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const token = await userCredential.user.getIdToken();
    localStorage.setItem('firebaseToken', token);
    
    // Provision user + fetch role
    const response = await api.post('/auth/login');
    const role = response.data.data.user.role || 'user';
    setUserRole(role);
  };

  const logout = async () => {
    await signOut(auth);
    localStorage.removeItem('firebaseToken');
    setUserRole(null);
  };

  const isAdmin = userRole === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        userRole,
        loading,
        login,
        loginWithGoogle,
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
