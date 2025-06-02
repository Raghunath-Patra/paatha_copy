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

  // Route change handler to reset navigation state
  useEffect(() => {
    const clearNavigationFlags = () => {
      console.log(`Route changed to: ${pathname}`);
    };
    
    clearNavigationFlags();
  }, [pathname]);

  // REMOVED: All visibility change session refresh logic
  // This was causing the refresh when switching tabs!

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
        
        {/* SVG favicon with version parameter to prevent caching */}
        <link rel="icon" type="image/svg+xml" href={`/favicon.svg?v=${faviconVersion}`} />
        <link rel="alternate icon" href={`/favicon.ico?v=${faviconVersion}`} type="image/x-icon" />
        
        {/* PWA icons */}
        <link rel="apple-touch-icon" href={`/icons/icon-192x192.png?v=${faviconVersion}`} />
        <link rel="apple-touch-icon" sizes="152x152" href={`/icons/icon-192x192.png?v=${faviconVersion}`} />
        <link rel="apple-touch-icon" sizes="180x180" href={`/icons/icon-192x192.png?v=${faviconVersion}`} />
        <link rel="apple-touch-icon" sizes="167x167" href={`/icons/icon-192x192.png?v=${faviconVersion}`} />
        
        {/* Manifest */}
        <link rel="manifest" href={`/manifest.json?v=${faviconVersion}`} />
                
        {/* Open Graph meta tags for social sharing */}
        <meta property="og:title" content="Paaṭha AI" />
        <meta property="og:description" content="The AI Study Buddy for Bright Minds" />
        <meta property="og:image" content="https://www.paatha.ai/icons/icon-512x512.png" />
        <meta property="og:image:width" content="512" />
        <meta property="og:image:height" content="512" />
        <meta property="og:url" content="https://www.paatha.ai/" />
        <meta property="og:type" content="website" />
                
        {/* Twitter Card tags */}
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