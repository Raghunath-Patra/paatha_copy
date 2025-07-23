// frontend/app/components/navigation/Navigation.tsx
// Updated to include credit balance with proper TypeScript

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSupabaseAuth } from '../../../contexts/SupabaseAuthContext';
import { getAuthHeaders } from '../../../utils/auth';

interface UserBalance {
  available_credits: number;
}

interface Profile {
  full_name?: string;
  email?: string;
}

const Navigation: React.FC = () => {
  const { profile, signOut } = useSupabaseAuth();
  const [balance, setBalance] = useState<UserBalance | null>(null);
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (profile) {
      fetchBalance();
    }
  }, [profile]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      const target = event.target as Element;
      if (showUserMenu && !target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const fetchBalance = async (): Promise<void> => {
    try {
      setLoading(true);
      const { headers, isAuthorized } = await getAuthHeaders();
      if (!isAuthorized) return;

      const response = await fetch(`${API_URL}/api/video-credits/balance`, { headers });
      if (response.ok) {
        const data: UserBalance = await response.json();
        setBalance(data);
      }
    } catch (error: unknown) {
      console.error('Error fetching balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const getInitials = (profile: Profile): string => {
    return profile.full_name?.charAt(0).toUpperCase() || 
           profile.email?.charAt(0).toUpperCase() || 
           '?';
  };

  const handleSignOut = async (): Promise<void> => {
    try {
      setShowUserMenu(false);
      await signOut();
    } catch (error: unknown) {
      console.error('Error signing out:', error);
    }
  };

  const isLowCredits: boolean = balance !== null && balance.available_credits < 100;

  if (!profile) {
    return (
      <div className="flex items-center space-x-4">
        <Link 
          href="/login" 
          className="text-gray-600 hover:text-gray-900 transition-colors"
        >
          Login
        </Link>
        <Link 
          href="/signup" 
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Sign Up
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      {/* Credit Balance */}
      {balance && !loading && (
        <Link 
          href="/video-credits"
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
            isLowCredits 
              ? 'bg-orange-50 border border-orange-200 hover:bg-orange-100' 
              : 'bg-blue-50 border border-blue-200 hover:bg-blue-100'
          }`}
        >
          <div className={`w-2 h-2 rounded-full ${
            isLowCredits ? 'bg-orange-400' : 'bg-blue-400'
          } ${isLowCredits ? 'animate-pulse' : ''}`}></div>
          <span className={`text-sm font-medium ${
            isLowCredits ? 'text-orange-700' : 'text-blue-700'
          }`}>
            {formatNumber(balance.available_credits)} credits
          </span>
        </Link>
      )}

      {/* Loading state for credits */}
      {loading && (
        <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 animate-pulse">
          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
          <div className="w-16 h-4 bg-gray-300 rounded"></div>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex items-center space-x-6">
        <Link 
          href="/projects" 
          className="text-gray-600 hover:text-gray-900 transition-colors"
        >
          Projects
        </Link>
        <Link 
          href="/video-credits" 
          className="text-gray-600 hover:text-gray-900 transition-colors"
        >
          Buy Credits
        </Link>
      </nav>

      {/* User Menu */}
      <div className="relative user-menu-container">
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          aria-label="User menu"
        >
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium">
              {getInitials(profile)}
            </span>
          </div>
          <svg 
            className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showUserMenu && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900 truncate">
                {profile.full_name || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">{profile.email}</p>
            </div>
            
            <Link 
              href="/profile" 
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => setShowUserMenu(false)}
            >
              Profile Settings
            </Link>
            
            <Link 
              href="/video-credits" 
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => setShowUserMenu(false)}
            >
              Credit History
            </Link>
            
            <hr className="my-1" />
            
            <button
              onClick={handleSignOut}
              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navigation;