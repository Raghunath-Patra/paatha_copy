'use client';

import { SupabaseAuthProvider } from './contexts/SupabaseAuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import BottomNavigation from './components/common/BottomNavigation';
import Footer from './components/common/Footer';
import AppUpdater from './components/common/AppUpdater';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import './globals.css';

const faviconVersion = '3';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();

  // DEBUG SCRIPT - REMOVE AFTER DEBUGGING
  useEffect(() => {
    // Only run once
    if (typeof window === 'undefined' || (window as any).debugEnabled) return;
    (window as any).debugEnabled = true;

    console.log('🔍 DEBUGGING: Setting up refresh detection...');

    // Override window.location methods to log when they're called
    const originalReload = window.location.reload;
    const originalHref = Object.getOwnPropertyDescriptor(window.location, 'href') || 
                        Object.getOwnPropertyDescriptor(Location.prototype, 'href');

    // Track reload calls
    window.location.reload = function(...args) {
      console.error('🔴 RELOAD CALLED!');
      console.trace('Reload stack trace:');
      return originalReload.apply(this, args);
    };

    // Track href changes
    if (originalHref) {
      Object.defineProperty(window.location, 'href', {
        set: function(value) {
          console.error('🔴 LOCATION.HREF SET TO:', value);
          console.trace('Location.href stack trace:');
          if (originalHref.set) {
            return originalHref.set.call(this, value);
          }
        },
        get: function() {
          if (originalHref.get) {
            return originalHref.get.call(this);
          }
          return window.location.toString();
        }
      });
    }

    // Monitor visibility changes
    const handleVisibilityChange = () => {
      console.log('👁️ Visibility changed:', document.visibilityState);
      if (document.visibilityState === 'visible') {
        console.log('🟢 Tab became visible - watching for refreshes...');
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Monitor beforeunload (page refresh/leave)
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      console.error('🔴 PAGE UNLOADING!');
      console.trace('Unload stack trace:');
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Monitor popstate (navigation)
    const handlePopState = (e: PopStateEvent) => {
      console.log('📍 Pop state event:', e);
    };
    window.addEventListener('popstate', handlePopState);

    console.log('🔍 Debug monitoring active. Switch tabs and check console for reload sources.');

    // Cleanup function
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);
  // END DEBUG SCRIPT

  // Route change handler
  useEffect(() => {
    const clearNavigationFlags = () => {
      console.log(`Route changed to: ${pathname}`);
    };
    
    clearNavigationFlags();
  }, [pathname]);

  return (
    <html lang="en">
      <head>
        <meta name="application-name" content="Paaṭha AI" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Paaṭha AI" />
        <meta name="description" content="The AI Study Buddy for Bright Minds" />
        <meta name="theme-color" content="#ff3131" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        
        <link rel="icon" type="image/svg+xml" href={`/favicon.svg?v=${faviconVersion}`} />
        <link rel="alternate icon" href={`/favicon.ico?v=${faviconVersion}`} type="image/x-icon" />
        
        <link rel="apple-touch-icon" href={`/icons/icon-192x192.png?v=${faviconVersion}`} />
        <link rel="apple-touch-icon" sizes="152x152" href={`/icons/icon-192x192.png?v=${faviconVersion}`} />
        <link rel="apple-touch-icon" sizes="180x180" href={`/icons/icon-192x192.png?v=${faviconVersion}`} />
        <link rel="apple-touch-icon" sizes="167x167" href={`/icons/icon-192x192.png?v=${faviconVersion}`} />
        
        <link rel="manifest" href={`/manifest.json?v=${faviconVersion}`} />
                
        <meta property="og:title" content="Paaṭha AI" />
        <meta property="og:description" content="The AI Study Buddy for Bright Minds" />
        <meta property="og:image" content="https://www.paatha.ai/icons/icon-512x512.png" />
        <meta property="og:image:width" content="512" />
        <meta property="og:image:height" content="512" />
        <meta property="og:url" content="https://www.paatha.ai/" />
        <meta property="og:type" content="website" />
                
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Paaṭha AI" />
        <meta name="twitter:description" content="The AI Study Buddy for Bright Minds" />
        <meta name="twitter:image" content="https://www.paatha.ai/icons/icon-512x512.png" />
      </head>
      <body className="flex flex-col min-h-screen">
        <SupabaseAuthProvider>
          <ProtectedRoute>
            <AppUpdater />
            <div className="flex-grow flex flex-col">
              {children}
            </div>
            <Footer />
            <BottomNavigation />
          </ProtectedRoute>
        </SupabaseAuthProvider>
      </body>
    </html>
  );
}