// frontend/app/video-generator/components/credits/CreditDisplay.tsx
// Standalone credit display component with refresh functionality

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSupabaseAuth } from '../../../contexts/SupabaseAuthContext';
import { getAuthHeaders } from '../../../utils/auth';

interface UserBalance {
  available_credits: number;
  current_package: {
    name: string;
    total_credits: number;
  } | null;
  purchased_at: string | null;
}

interface CreditDisplayProps {
  className?: string;
}

// Create a context for credit refresh functionality
interface CreditContextType {
  refreshCredits: () => Promise<void>;
}

export const CreditContext = React.createContext<CreditContextType | null>(null);

// Custom hook to use credit refresh
export const useCreditRefresh = () => {
  const context = React.useContext(CreditContext);
  if (!context) {
    // Fallback to global event system
    return {
      refreshCredits: async () => {
        window.dispatchEvent(new CustomEvent('refreshCredits'));
      }
    };
  }
  return context;
};

const CreditDisplay: React.FC<CreditDisplayProps> = ({ className = '' }) => {
  const { profile } = useSupabaseAuth();
  const [userBalance, setUserBalance] = useState<UserBalance | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  
  const popupRef = useRef<HTMLDivElement>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Memoized fetch function
  const fetchBalance = useCallback(async (): Promise<void> => {
    if (!profile) return;
    
    try {
      setLoading(true);
      const { headers, isAuthorized } = await getAuthHeaders();
      if (!isAuthorized) return;

      const response = await fetch(`${API_URL}/api/video-credits/balance`, { headers });
      if (response.ok) {
        const data: UserBalance = await response.json();
        setUserBalance(data);
      }
    } catch (error: unknown) {
      console.error('Error fetching balance:', error);
    } finally {
      setLoading(false);
    }
  }, [profile, API_URL]);

  // Initial fetch and global event listener
  useEffect(() => {
    if (profile) {
      fetchBalance();
    }

    // Listen for global refresh events
    const handleGlobalRefresh = () => {
      fetchBalance();
    };

    window.addEventListener('refreshCredits', handleGlobalRefresh);
    
    return () => {
      window.removeEventListener('refreshCredits', handleGlobalRefresh);
    };
  }, [profile, fetchBalance]);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setShowPopup(false);
      }
    };

    if (showPopup) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPopup]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleCreditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPopup(!showPopup);
  };

  const handleUpgradeClick = async () => {
    setIsNavigating(true);
    setTimeout(() => {
      setShowPopup(false);
      window.location.href = '/video-generator/video-credits';
    }, 300);
  };

  const handleRefreshClick = async () => {
    await fetchBalance();
  };

  if (!profile || !userBalance) {
    if (loading) {
      return (
        <div className={`animate-pulse ${className}`}>
          <div className="flex items-center space-x-2 sm:space-x-3 bg-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg shadow-sm">
            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-200 rounded-full flex-shrink-0"></div>
            <div className="w-20 sm:w-24 h-4 sm:h-5 bg-gray-200 rounded"></div>
          </div>
        </div>
      );
    }
    return null;
  }

  const isLowCredits = userBalance.available_credits < 100;

  return (
    <CreditContext.Provider value={{ refreshCredits: fetchBalance }}>
      <div className={`relative ${className}`}>
        <button
          onClick={handleCreditClick}
          className="flex items-center space-x-2 sm:space-x-3 bg-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border hover:border-blue-300 group"
          disabled={isNavigating}
        >
          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-blue-600 text-xs sm:text-sm font-bold">₹</span>
          </div>
          <div className="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-blue-600 whitespace-nowrap">
            {formatNumber(userBalance.available_credits)} credits left
          </div>
        </button>

        {/* Credit Details Popup */}
        {showPopup && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setShowPopup(false)} />
            
            {/* Popup Content */}
            <div ref={popupRef} className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-lg sm:rounded-xl shadow-xl border z-50 p-4 sm:p-6">
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800">💳 Credit Details</h3>
                <button
                  onClick={() => setShowPopup(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {/* Available Credits */}
                <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-medium text-blue-800">Available Credits</span>
                    <div className="flex items-center space-x-1">
                      <span className="text-blue-600 font-bold text-sm sm:text-base">₹</span>
                      <span className="text-base sm:text-lg font-bold text-blue-900">
                        {formatNumber(userBalance.available_credits)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Current Package */}
                {userBalance.current_package ? (
                  <div className="border-l-4 border-purple-400 pl-3 sm:pl-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-gray-700">Current Package</p>
                        <p className="text-sm sm:text-lg font-semibold text-gray-900">
                          {userBalance.current_package.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs sm:text-sm text-gray-500">Total Credits</p>
                        <div className="flex items-center space-x-1">
                          <span className="text-purple-600 text-sm sm:text-base">₹</span>
                          <span className="font-semibold text-gray-900 text-sm sm:text-base">
                            {formatNumber(userBalance.current_package.total_credits)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border-l-4 border-gray-300 pl-3 sm:pl-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-700">Current Package</p>
                    <p className="text-gray-500 text-sm">No active package</p>
                  </div>
                )}

                {/* Purchase Date */}
                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <span className="text-gray-600">Purchased On</span>
                  <span className="font-medium text-gray-900">
                    {formatDate(userBalance.purchased_at)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200 space-y-2">
                <button
                  onClick={handleUpgradeClick}
                  disabled={isNavigating}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-2 sm:py-3 px-3 sm:px-4 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center space-x-2 text-sm sm:text-base disabled:opacity-75 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-lg"
                >
                  {isNavigating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent"></div>
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                      </svg>
                      <span>Upgrade Package</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleRefreshClick}
                  disabled={loading}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 sm:py-3 px-3 sm:px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 text-sm sm:text-base disabled:opacity-50"
                >
                  <svg className={`w-4 h-4 sm:w-5 sm:h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* Loading overlay during navigation */}
        {isNavigating && (
          <div className="absolute inset-0 bg-white bg-opacity-75 rounded-lg flex items-center justify-center z-60">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
              <span className="text-sm text-gray-600">Loading...</span>
            </div>
          </div>
        )}
      </div>
    </CreditContext.Provider>
  );
};

export default CreditDisplay;