// frontend/app/components/common/ProtectedRoute.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import EnhancedSpinner from './EnhancedSpinner';

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/reset-password',
  '/verify-email',
  '/forgot-password',
  '/auth/callback',
  '/privacy',
  '/terms',
  '/refund',
  '/about',
  '/contact',
  '/try',
  '/try/challenge',
  '/try/results'
];

const PHONE_CHECK_EXEMPT_ROUTES = [
  '/complete-profile'
];

// Maximum time to wait for auth state to resolve (10 seconds)
const AUTH_RESOLUTION_TIMEOUT = 10000;

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading: authLoading, refreshSession } = useSupabaseAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [renderState, setRenderState] = useState<'loading' | 'children'>('loading');
  const routeCheckTimeout = useRef<NodeJS.Timeout | null>(null);
  const navigationInProgress = useRef<boolean>(false);
  const timeoutAttempted = useRef<boolean>(false);
  
  // Reset navigation status when pathname changes
  useEffect(() => {
    // Reset navigation status when pathname changes
    navigationInProgress.current = false;
    timeoutAttempted.current = false;
    
    // Clear any existing timeout
    if (routeCheckTimeout.current) {
      clearTimeout(routeCheckTimeout.current);
      routeCheckTimeout.current = null;
    }
  }, [pathname]);
  
  useEffect(() => {
    // Set a timeout to avoid hanging indefinitely on auth
    if (!routeCheckTimeout.current && !timeoutAttempted.current) {
      timeoutAttempted.current = true;
      routeCheckTimeout.current = setTimeout(() => {
        console.log('Auth resolution timeout reached');
        
        // If still loading, force a session refresh and try again
        if (authLoading) {
          console.log('Still loading after timeout, trying session refresh');
          refreshSession().catch(() => {
            // If refresh fails, handle public/private paths
            const isPublicPath = PUBLIC_PATHS.some(path => pathname?.startsWith(path));
            if (!isPublicPath) {
              console.log('Auth timeout on protected route, redirecting to login');
              navigationInProgress.current = true;
              window.location.href = '/login'; // Use direct navigation
            } else {
              setRenderState('children');
            }
          });
        } else {
          // If not loading anymore but we hit the timeout, render children
          setRenderState('children');
        }
      }, AUTH_RESOLUTION_TIMEOUT);
    }

    // Store original path for after phone number collection
    if (pathname && !PUBLIC_PATHS.includes(pathname as string) && 
        !PHONE_CHECK_EXEMPT_ROUTES.includes(pathname as string)) {
      sessionStorage.setItem('originalPath', pathname);
    }

    // Skip any redirects while loading unless timeout was reached
    if (authLoading && renderState === 'loading') {
      console.log('Auth is still loading, skipping route check');
      return;
    }

    const isPublicPath = PUBLIC_PATHS.some(path => pathname?.startsWith(path));
    console.log('Path check:', { isPublicPath, pathname });

    // Handle public paths - allow authenticated users to access public paths
    if (isPublicPath) {
      setRenderState('children');
      return;
    }

    // Handle private paths - redirect to login if not authenticated
    if (!user) {
      console.log('Unauthenticated user on private path, redirecting to login');
      navigationInProgress.current = true;
      window.location.href = '/login'; // Use direct navigation
      return;
    }
    
    // Check if user has phone number
    if (user && profile && (!profile.phone_number || profile.phone_number === '') && 
        !PHONE_CHECK_EXEMPT_ROUTES.includes(pathname as string)) {
      console.log('User missing phone number, redirecting to complete profile');
      navigationInProgress.current = true;
      window.location.href = '/complete-profile'; // Use direct navigation
      return;
    }

    // For all other cases, render the children
    console.log('Route check complete, allowing render');
    setRenderState('children');
    
    // Clean up timeout
    if (routeCheckTimeout.current) {
      clearTimeout(routeCheckTimeout.current);
      routeCheckTimeout.current = null;
    }
  }, [user, profile, authLoading, pathname, router, refreshSession, renderState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (routeCheckTimeout.current) {
        clearTimeout(routeCheckTimeout.current);
      }
    };
  }, []);

  // Show loading state for initial auth check only
  if (renderState === 'loading') {
    console.log('Rendering loading spinner');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 px-4">
        <EnhancedSpinner size="lg" message="Preparing your learning journey..." />
      </div>
    );
  }

  console.log('Rendering children');
  return children;
}