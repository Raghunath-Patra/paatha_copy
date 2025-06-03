'use client';

import { SupabaseAuthProvider } from './contexts/SupabaseAuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import BottomNavigation from './components/common/BottomNavigation';
import Footer from './components/common/Footer';
import SmartAppUpdater from './components/common/SmartAppUpdater'; // 👈 NEW: Smart updater
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

  // Simple route change handler - no extra functionality
  useEffect(() => {
    console.log(`Route changed to: ${pathname}`);
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
        
        {/* Static favicon without cache-busting to prevent refresh triggers */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="alternate icon" href="/favicon.ico" type="image/x-icon" />
        
        {/* Static PWA icons without cache-busting */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-192x192.png" />
        
        {/* Static manifest without cache-busting */}
        <link rel="manifest" href="/manifest.json" />
                
        {/* Open Graph meta tags */}
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
            <SmartAppUpdater /> {/* 👈 NEW: Smart app updater component */}
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