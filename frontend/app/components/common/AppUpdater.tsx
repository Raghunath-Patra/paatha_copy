// app/components/common/AppUpdater.tsx - FIXED VERSION
'use client';

import { useEffect, useState, useRef } from 'react';

export default function AppUpdater() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const isCheckingRef = useRef(false);
  const lastCheckTime = useRef(0);
  const MIN_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes minimum between checks
  const INITIAL_DELAY = 2 * 1000; //  initial delay - INCREASED FROM 2 SECONDS

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    // Function to check for updates
    const checkForUpdates = async () => {
      // Prevent multiple simultaneous checks
      if (isCheckingRef.current) {
        console.log('Update check already in progress, skipping');
        return;
      }

      // Rate limit checks to prevent excessive requests
      const now = Date.now();
      if (now - lastCheckTime.current < MIN_CHECK_INTERVAL) {
        console.log('Update check rate limited, skipping');
        return;
      }

      try {
        isCheckingRef.current = true;
        lastCheckTime.current = now;

        // Fetch current version info with a cache-busting parameter
        const response = await fetch(`/version.json?_=${Date.now()}`);
        
        // If version.json doesn't exist or fetch fails, don't trigger update
        if (!response.ok) {
          console.log('Version file not found or fetch failed, skipping update check');
          return;
        }
        
        const serverVersion = await response.json();
        
        // Validate server version structure
        if (!serverVersion || typeof serverVersion.version !== 'string') {
          console.log('Invalid server version format, skipping update check');
          return;
        }
        
        // Get stored version from localStorage
        const storedVersion = localStorage.getItem('appVersion');
        const storedLogoVersion = localStorage.getItem('logoVersion');
        
        // FIXED: Initialize versions if they don't exist (first visit)
        if (!storedVersion || !storedLogoVersion) {
          console.log('First visit - storing initial versions without triggering update');
          localStorage.setItem('appVersion', serverVersion.version);
          localStorage.setItem('logoVersion', serverVersion.logoVersion || serverVersion.version);
          return; // Don't trigger update on first visit
        }
        
        // If the versions are different, update is available
        if (
          storedVersion !== serverVersion.version || 
          storedLogoVersion !== (serverVersion.logoVersion || serverVersion.version)
        ) {
          console.log('New version available:', serverVersion);
          setUpdateAvailable(true);
          
          // Update stored version immediately to prevent repeated triggers
          localStorage.setItem('appVersion', serverVersion.version);
          localStorage.setItem('logoVersion', serverVersion.logoVersion || serverVersion.version);
          
          // Only attempt service worker cache clearing if it exists and is ready
          if (navigator.serviceWorker && navigator.serviceWorker.controller) {
            try {
              const channel = new MessageChannel();
              
              // Set a timeout for service worker response
              const timeoutId = setTimeout(() => {
                console.log('Service worker response timeout, refreshing anyway');
                window.location.reload();
              }, 3000);
              
              navigator.serviceWorker.controller.postMessage(
                { type: 'CLEAR_ICON_CACHE' },
                [channel.port2]
              );
              
              // Listen for response
              channel.port1.onmessage = (event) => {
                clearTimeout(timeoutId);
                if (event.data && event.data.type === 'ICON_CACHE_CLEARED') {
                  console.log('Icon cache cleared successfully');
                  // Refresh the page after a short delay
                  setTimeout(() => {
                    window.location.reload();
                  }, 1000);
                } else {
                  console.log('Unexpected service worker response, refreshing anyway');
                  window.location.reload();
                }
              };
            } catch (error) {
              console.error('Service worker communication error:', error);
              // Refresh without service worker cache clearing
              setTimeout(() => {
                window.location.reload();
              }, 1000);
            }
          } else {
            // No service worker, just refresh
            console.log('No service worker available, refreshing page');
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          }
        } else {
          console.log('App is up to date');
        }
      } catch (error) {
        console.error('Error checking for updates:', error);
        // Don't trigger update on error to prevent refresh loops
      } finally {
        isCheckingRef.current = false;
      }
    };

    // FIXED: Much longer initial delay to prevent immediate checks on page load
    const initialCheck = setTimeout(() => {
      // Only check if the user has been on the page for a while
      if (document.visibilityState === 'visible' && !document.hidden) {
        console.log('Initial update check after delay');
        checkForUpdates();
      }
    }, INITIAL_DELAY); // Now 2 minutes instead of 2 seconds
    
    // Set up interval to check periodically (every 30 minutes)
    intervalId = setInterval(checkForUpdates, 30 * 60 * 1000);
    
    // Handle visibility change with rate limiting
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Only check on visibility change if enough time has passed
        const now = Date.now();
        if (now - lastCheckTime.current > MIN_CHECK_INTERVAL) {
          console.log('App came to foreground, checking for updates');
          setTimeout(checkForUpdates, 5000); // 5 second delay instead of 1 second
        } else {
          console.log('App came to foreground, but skipping update check due to rate limit');
        }
      }
    };

    // Add visibility change listener with debouncing
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearTimeout(initialCheck);
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      isCheckingRef.current = false;
    };
  }, []);

  // This component doesn't render anything visible
  return null;
}