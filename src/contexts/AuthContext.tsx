import React, { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { jwtDecode } from 'jwt-decode';

interface User {
  id: string;
  email: string;
  full_name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  if (token) {
    try {
      const decoded: any = jwtDecode(token);
      const currentTime = Date.now() / 1000; 
      if (decoded.exp && decoded.exp < currentTime) {
        console.log('Token expired, logging out');
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        toast.error('Session expired, please sign in again');
        return;
      }
      setUser(user ? user : { id: decoded.userId, email: '', full_name: '' });
    } catch (error) {
      console.error('Invalid token:', error);
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    }
  } else {
    setUser(null);
  }
  setLoading(false);
}, [token]);

  const signUp = async (email: string, password: string, fullName: string) => {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, fullName }),
  });
  if (!res.ok) {
    const error = await res.json();
    toast.error(error.error || 'Signup failed');
    throw new Error('Signup failed');
  }
  const data = await res.json();
  localStorage.setItem('token', data.token);
  setToken(data.token);
  setUser(data.user);
  toast.success('Account created successfully!');
};

const signIn = async (email: string, password: string) => {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const error = await res.json();
    toast.error(error.error || 'Signin failed');
    throw new Error('Signin failed');
  }
  const data = await res.json();
  localStorage.setItem('token', data.token);
  setToken(data.token);
  setUser(data.user);
  toast.success('Welcome back!');
};

  const signOut = async () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    toast.success('Signed out successfully');
  };

  const signInWithGoogle = async () => {
    
    toast.error('Google sign-in not implemented yet');
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}