// frontend/app/contexts/AuthContext.tsx

'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  full_name: string;
  board?: string;
  class_level?: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (userData: any) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<boolean>;
  resetPassword: (token: string, password: string) => Promise<void>;
  deleteAccount: (password: string) => Promise<boolean>;
}

interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  class_level?: string;
  board?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  });
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const userData = await response.json();
        setState(prev => ({
          ...prev,
          user: userData,
          loading: false
        }));
      } else {
        localStorage.removeItem('token');
        setState(prev => ({
          ...prev,
          user: null,
          loading: false
        }));
        router.push('/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      setState(prev => ({
        ...prev,
        user: null,
        loading: false,
        error: 'Authentication check failed'
      }));
      router.push('/login');
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403 && data.detail.includes('Email not verified')) {
          setState(prev => ({
            ...prev,
            error: 'Please verify your email. A new verification link has been sent.',
            loading: false
          }));
          return;
        }
        throw new Error(data.detail || 'Login failed');
      }

      localStorage.setItem('token', data.access_token);
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token);
      }

      setState(prev => ({
        ...prev,
        user: data.user,
        loading: false,
        error: null
      }));

      // After successful login, redirect based on user data
      if (data.user.board && data.user.class_level) {
        window.location.href = `/${data.user.board}/${data.user.class_level}`;
      } else {
        window.location.href = '/';
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Login failed',
        loading: false
      }));
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Registration failed');
      }

      setState(prev => ({ ...prev, loading: false }));
      router.push('/login?registered=true');
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Registration failed',
        loading: false
      }));
    }
  };

  const updateProfile = async (userData: any) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await fetch(`${API_URL}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData),
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to update profile');
      }

      const data = await response.json();
      setState(prev => ({
        ...prev,
        user: data.user,
        loading: false
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to update profile',
        loading: false
      }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');

      setState(prev => ({
        ...prev,
        user: null,
        loading: false,
        error: null
      }));

      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      setState(prev => ({
        ...prev,
        user: null,
        loading: false,
        error: null
      }));
      window.location.href = '/login';
    }
  };

  const requestPasswordReset = async (email: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await fetch(`${API_URL}/api/auth/request-password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to request password reset');
      }
      setState(prev => ({ ...prev, loading: false }));
      return true;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to request password reset',
        loading: false
      }));
      return false;
    }
  };

  const resetPassword = async (token: string, password: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to reset password');
      }
      setState(prev => ({ ...prev, loading: false }));
      router.push('/login?reset=success');
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to reset password',
        loading: false
      }));
    }
  };

  const deleteAccount = async (password: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await fetch(`${API_URL}/api/user/account`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
      });
      const data = await response.json();
      if (!response.ok) {
        setState(prev => ({
          ...prev,
          error: data.detail || 'Failed to delete account',
          loading: false
        }));
        return false;
      }
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      setState(prev => ({
        ...prev,
        user: null,
        loading: false,
        error: null
      }));
      return true;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to delete account',
        loading: false
      }));
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        updateProfile,
        requestPasswordReset,
        resetPassword,
        deleteAccount
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};