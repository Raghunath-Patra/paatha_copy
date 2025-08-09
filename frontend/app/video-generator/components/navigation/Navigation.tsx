// frontend/app/video-generator/components/navigation/Navigation.tsx
// Updated to include credit balance with proper TypeScript and refresh functionality

'use client';

import React, { useState, useEffect, useCallback } from 'react';
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

// Create a context for credit refresh functionality
interface CreditContextType {
  refreshCredits: () => Promise<void>;
}

// You can use this context in other components to trigger refresh
export const CreditContext = React.createContext<CreditContextType | null>(null);

// Custom hook to use credit refresh
export const useCreditRefresh = () => {
  const context = React.useContext(CreditContext);
  if (!context) {
    throw new Error('useCreditRefresh must be used within a CreditProvider');
  }
  return context;
};

const Navigation: React.FC = () => {
  const { profile } = useSupabaseAuth();
  const [balance, setBalance] = useState<UserBalance | null>(null);
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [showCreditPopup, setShowCreditPopup] = useState<boolean>(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Memoized fetch function to prevent unnecessary re-renders
  const fetchBalance = useCallback(async (): Promise<void> => {
    if (!profile) return;
    
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
  }, [profile, API_URL]);

  // Initial fetch
  useEffect(() => {
    if (profile) {
      fetchBalance();
    }
  }, [profile, fetchBalance]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      const target = event.target as Element;
      if (showUserMenu && !target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
      if (showCreditPopup && !target.closest('.credit-popup-container')) {
        setShowCreditPopup(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu, showCreditPopup]);

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

  const isLowCredits: boolean = balance !== null && balance.available_credits < 100;

  const handleCreditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowCreditPopup(!showCreditPopup);
  };

  const navigateToCredits = () => {
    setShowCreditPopup(false);
    window.location.href = '/video-generator/video-credits';
  };

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
    <CreditContext.Provider value={{ refreshCredits: fetchBalance }}>
      <div className="flex items-center space-x-4">
        {/* Credit Balance - Now always visible */}
        <div className="relative credit-popup-container">
          <button
            onClick={handleCreditClick}
            disabled={loading}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors border hover:border-blue-300 group ${
              isLowCredits 
                ? 'bg-orange-50 border border-orange-200 hover:bg-orange-100' 
                : 'bg-blue-50 border border-blue-200 hover:bg-blue-100'
            } ${loading ? 'opacity-75 cursor-wait' : 'cursor-pointer'}`}
            title="Click for credit details"
          >
            <div className={`w-2 h-2 rounded-full ${
              loading 
                ? 'bg-gray-400 animate-pulse'
                : isLowCredits ? 'bg-orange-400 animate-pulse' : 'bg-blue-400'
            }`}></div>
            <span className={`text-sm font-medium ${
              loading 
                ? 'text-gray-500'
                : isLowCredits ? 'text-orange-700' : 'text-blue-700'
            }`}>
              {loading ? 'Loading...' : balance ? `${formatNumber(balance.available_credits)} credits` : 'Credits'}
            </span>
            <svg 
              className={`w-3 h-3 transition-transform ${showCreditPopup ? 'rotate-180' : ''} ${
                loading ? 'text-gray-400' : isLowCredits ? 'text-orange-600' : 'text-blue-600'
              }`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Credit Details Popup */}
          {showCreditPopup && balance && (
            <>
              {/* Backdrop for mobile */}
              <div className="fixed inset-0 z-40 md:hidden" onClick={() => setShowCreditPopup(false)} />
              
              {/* Popup Content */}
              <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-lg shadow-xl border z-50 p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    💳 Credits
                  </h3>
                  <button
                    onClick={() => setShowCreditPopup(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Available Credits */}
                <div className="bg-blue-50 p-3 rounded-lg mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-800">Available</span>
                    <div className="flex items-center space-x-1">
                      <span className="text-blue-600 font-bold">₹</span>
                      <span className="text-lg font-bold text-blue-900">
                        {formatNumber(balance.available_credits)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <button
                    onClick={navigateToCredits}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-2 px-4 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                    </svg>
                    <span>Buy More Credits</span>
                  </button>
                  
                  <button
                    onClick={fetchBalance}
                    disabled={loading}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link 
            href="/video-generator" 
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            Projects
          </Link>
          <Link 
            href="/video-generator/video-credits" 
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
                href="/video-generator/video-credits" 
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={() => setShowUserMenu(false)}
              >
                Credit History
              </Link>
              
              <hr className="my-1" />
              
            </div>
          )}
        </div>
      </div>
    </CreditContext.Provider>
  );
};

export default Navigation;