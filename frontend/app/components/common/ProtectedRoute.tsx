// frontend/app/components/common/ProtectedRoute.tsx - SIMPLIFIED FIXED VERSION
'use client';

import { useEffect, useState } from 'react';
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

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading: authLoading } = useSupabaseAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [shouldRender, setShouldRender] = useState(false);
  
  useEffect(() => {
    // If auth is still loading, don't make any decisions yet
    if (authLoading) {
      console.log('Auth still loading, waiting...');
      setShouldRender(false);
      return;
    }

    const isPublicPath = PUBLIC_PATHS.some(path => pathname?.startsWith(path));
    
    console.log('Route check:', { 
      isPublicPath, 
      pathname, 
      hasUser: !!user, 
      hasProfile: !!profile 
    });

    // For public paths, always allow access
    if (isPublicPath) {
      console.log('Public path, allowing access');
      setShouldRender(true);
      return;
    }

    // For private paths, check authentication
    if (!user) {
      console.log('No user, redirecting to login');
      // Store the intended path
      if (pathname) {
        sessionStorage.setItem('originalPath', pathname);
      }
      router.push('/login');
      return;
    }

    // Check if user needs to complete profile (phone number)
    if (user && profile && 
        (!profile.phone_number || profile.phone_number === '') && 
        !PHONE_CHECK_EXEMPT_ROUTES.includes(pathname as string)) {
      console.log('User missing phone number, redirecting to complete profile');
      router.push('/complete-profile');
      return;
    }

    // All checks passed, render the page
    console.log('All checks passed, rendering page');
    setShouldRender(true);

  }, [user, profile, authLoading, pathname, router]);

  // Show loading spinner while auth is loading or while routing decisions are being made
  if (authLoading || !shouldRender) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 px-4">
        <EnhancedSpinner size="lg" message="Preparing your learning journey..." />
      </div>
    );
  }

  return <>{children}</>;
}