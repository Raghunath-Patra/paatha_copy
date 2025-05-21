// frontend/app/components/navigation/Navigation.tsx

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import { supabase } from '../../utils/supabase';
import InstallButton from '../common/InstallButton';

const Navigation = () => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [menuHeight, setMenuHeight] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuContentRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const { profile, logout, loading: authLoading, refreshSession } = useSupabaseAuth();

  // Toggle menu and measure content height
  const toggleMenu = useCallback(() => {
    if (!isUserMenuOpen && menuContentRef.current) {
      // When opening, measure content height first
      const contentHeight = menuContentRef.current.scrollHeight;
      setMenuHeight(contentHeight);
    }
    
    setIsUserMenuOpen(prev => !prev);
  }, [isUserMenuOpen]);

  // Update height when menu state changes
  useEffect(() => {
    if (!isUserMenuOpen) {
      // When closing, set height to 0
      const timer = setTimeout(() => {
        setMenuHeight(0);
      }, 10); // Small delay to ensure the transition starts
      return () => clearTimeout(timer);
    } else if (menuContentRef.current) {
      // When opening, set to content height
      setMenuHeight(menuContentRef.current.scrollHeight);
    }
  }, [isUserMenuOpen]);

  // Safe navigation function - simplify to use direct URL changes for reliability
  const safeNavigate = useCallback((path: string) => {
    if (isNavigating) return;
    
    setIsNavigating(true);
    
    // Use direct navigation to avoid React router issues
    console.log(`Using direct navigation for path: ${path}`);
    window.location.href = path;
  }, [isNavigating]);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (!profile || authLoading) {
          return;
        }
        setIsLoading(true);
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.log('No session found');
          window.location.href = '/login';
          return;
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        if (error instanceof Error && (
          error.message.includes('401') || 
          error.message.includes('Unauthorized')
        )) {
          window.location.href = '/login';
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
    
    // Reset navigation state on pathname change
    return () => {
      setIsNavigating(false);
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, [profile, authLoading, safeNavigate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isUserMenuOpen &&
        menuRef.current &&
        avatarRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !avatarRef.current.contains(event.target as Node)
      ) {
        toggleMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen, toggleMenu]);

  const handleRouteChange = useCallback((path: string) => {
    // Skip if already navigating
    if (isNavigating) return;
    
    // If auth is loading, refresh first then navigate
    if (authLoading) {
      refreshSession().then(() => {
        safeNavigate(path);
      }).catch(() => {
        // Force navigation if refresh fails
        window.location.href = path;
      });
      return;
    }
    
    safeNavigate(path);
  }, [isNavigating, authLoading, refreshSession, safeNavigate]);

  const handleLogout = async () => {
    try {
      setIsNavigating(true);
      await logout();
      // Note: logout function now handles navigation directly
    } catch (error) {
      console.error('Logout error:', error);
      // Force page refresh on logout error
      window.location.href = '/login';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <>
      <style jsx>{`
        .menu-container {
          overflow: hidden;
          transition: height 0.3s ease, opacity 0.3s ease;
          height: ${menuHeight}px;
          opacity: ${isUserMenuOpen ? '1' : '0'};
          visibility: ${menuHeight === 0 ? 'hidden' : 'visible'};
          transform-origin: top right;
        }
      `}</style>
      <div className="relative z-50 flex items-center justify-end w-full gap-4">
        {isNavigating && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        <InstallButton />
        <div className="relative">
          <div 
            ref={avatarRef}
            onClick={toggleMenu}
            className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-medium hover:bg-blue-600 cursor-pointer transition-colors"
          >
            {profile.full_name?.[0]?.toUpperCase() || '?'}
          </div>

          <div 
            ref={menuRef}
            className="menu-container absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-neutral-200"
          >
            <div ref={menuContentRef}>
              <div className="px-4 py-3 border-b border-neutral-200">
                <p className="text-sm font-medium text-neutral-900 truncate">
                  {profile.full_name}
                </p>
                {profile.board && (
                  <p className="text-xs text-neutral-500 truncate uppercase">
                    {profile.board} - Class {profile.class_level}
                  </p>
                )}
              </div>
              <div className="py-1">
                <button
                  onClick={() => window.location.href = '/profile'}
                  className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                >
                  Settings
                </button>
                
                {/* Upgrade button for non-premium users */}
                {!profile?.is_premium && (
                  <button
                    onClick={() => window.location.href = '/upgrade'}
                    className="block w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 font-medium"
                  >
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      Upgrade to Premium
                    </div>
                  </button>
                )}
                
                {/* Premium status indicator for premium users */}
                {profile?.is_premium && (
                  <div className="block w-full text-left px-4 py-2 text-sm text-green-600 bg-green-50">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Premium Member
                    </div>
                  </div>
                )}
                
                {/* Daily Challenge link - ADDED NEW ITEM HERE */}
                <div className="border-t border-neutral-200 pt-1">
                  <button
                    onClick={() => window.location.href = '/try'}
                    className="block w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 font-medium"
                  >
                    🔥 Daily Challenge
                  </button>
                </div>
                
                {/* Core Links */}
                <div className="border-t border-neutral-200 pt-1">
                  <button
                    onClick={() => window.location.href = '/pricing'}
                    className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                  >
                    Pricing
                  </button>
                  <button
                    onClick={() => window.location.href = '/contact'}
                    className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                  >
                    Contact Us
                  </button>
                </div>
                
                {/* Legal links */}
                <div className="border-t border-neutral-200 pt-1">
                  <button
                    onClick={() => window.location.href = '/about'}
                    className="block w-full text-left px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-100"
                  >
                    About Us
                  </button>
                  <button
                    onClick={() => window.location.href = '/privacy'}
                    className="block w-full text-left px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-100"
                  >
                    Privacy Policy
                  </button>
                  <button
                    onClick={() => window.location.href = '/terms'}
                    className="block w-full text-left px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-100"
                  >
                    Terms & Conditions
                  </button>
                  <button
                    onClick={() => window.location.href = '/refund'}
                    className="block w-full text-left px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-100"
                  >
                    Refund Policy
                  </button>
                </div>
                
                {/* Sign Out */}
                <div className="border-t border-neutral-200 pt-1">
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-neutral-900 hover:bg-neutral-100"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navigation;