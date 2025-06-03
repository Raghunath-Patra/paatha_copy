// app/components/common/SmartAppUpdater.tsx
'use client';

import { useEffect, useState, useRef } from 'react';

export default function SmartAppUpdater() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);
  const isCheckingRef = useRef(false);
  const lastCheckTime = useRef(0);
  const updateDismissed = useRef(false);
  
  // More conservative checking intervals
  const MIN_CHECK_INTERVAL = 30 * 60 * 1000; // 30 minutes minimum between checks
  const INITIAL_CHECK_DELAY = 10000; // 10 seconds after app load
  const PERIODIC_CHECK_INTERVAL = 2 * 60 * 60 * 1000; // Check every 2 hours

  useEffect(() => {
    let periodicInterval: NodeJS.Timeout;
    let visibilityTimeout: NodeJS.Timeout;

    // Function to check for updates
    const checkForUpdates = async () => {
      // Prevent multiple simultaneous checks
      if (isCheckingRef.current) {
        console.log('SmartUpdater: Check already in progress, skipping');
        return;
      }

      // Rate limiting - much more conservative
      const now = Date.now();
      if (now - lastCheckTime.current < MIN_CHECK_INTERVAL) {
        console.log('SmartUpdater: Rate limited, skipping check');
        return;
      }

      try {
        isCheckingRef.current = true;
        lastCheckTime.current = now;

        console.log('SmartUpdater: Checking for updates...');
        
        // Fetch current version info
        const response = await fetch(`/version.json?_=${Date.now()}`);
        
        if (!response.ok) {
          console.log('SmartUpdater: Version file not found, skipping');
          return;
        }
        
        const serverVersion = await response.json();
        
        if (!serverVersion || typeof serverVersion.version !== 'string') {
          console.log('SmartUpdater: Invalid server version format');
          return;
        }
        
        // Get stored version from localStorage
        const storedVersion = localStorage.getItem('appVersion');
        const storedLogoVersion = localStorage.getItem('logoVersion');
        
        // Check if version has changed
        const hasVersionChanged = (
          !storedVersion || 
          !storedLogoVersion || 
          storedVersion !== serverVersion.version || 
          storedLogoVersion !== (serverVersion.logoVersion || serverVersion.version)
        );

        if (hasVersionChanged && !updateDismissed.current) {
          console.log('SmartUpdater: New version detected:', serverVersion);
          setUpdateAvailable(true);
          setShowUpdateBanner(true);
          
          // Update stored version to prevent repeated detection
          localStorage.setItem('appVersion', serverVersion.version);
          localStorage.setItem('logoVersion', serverVersion.logoVersion || serverVersion.version);
        } else if (hasVersionChanged && updateDismissed.current) {
          console.log('SmartUpdater: Update available but user dismissed');
        } else {
          console.log('SmartUpdater: App is up to date');
        }
      } catch (error) {
        console.error('SmartUpdater: Error checking for updates:', error);
      } finally {
        isCheckingRef.current = false;
      }
    };

    // Initial check after app loads
    const initialTimer = setTimeout(() => {
      console.log('SmartUpdater: Initial update check');
      checkForUpdates();
    }, INITIAL_CHECK_DELAY);
    
    // Periodic checks every 2 hours
    periodicInterval = setInterval(() => {
      console.log('SmartUpdater: Periodic update check');
      checkForUpdates();
    }, PERIODIC_CHECK_INTERVAL);
    
    // SMART visibility handling - only check if significant time has passed
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        const timeSinceLastCheck = now - lastCheckTime.current;
        
        console.log(`SmartUpdater: App visible, time since last check: ${Math.round(timeSinceLastCheck / 1000 / 60)} minutes`);
        
        // Only check if it's been at least 30 minutes since last check
        if (timeSinceLastCheck > MIN_CHECK_INTERVAL) {
          console.log('SmartUpdater: Scheduling delayed update check on visibility');
          
          // Add a longer delay to avoid immediate checking
          visibilityTimeout = setTimeout(() => {
            console.log('SmartUpdater: Executing delayed visibility update check');
            checkForUpdates();
          }, 5000); // 5 second delay
        } else {
          console.log('SmartUpdater: Skipping visibility check - too recent');
        }
      }
    };

    // Add visibility listener with smart behavior
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearTimeout(initialTimer);
      clearTimeout(visibilityTimeout);
      clearInterval(periodicInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      isCheckingRef.current = false;
    };
  }, []);

  // Manual refresh handler
  const handleRefreshNow = () => {
    console.log('SmartUpdater: User requested manual refresh');
    setShowUpdateBanner(false);
    
    // Clear service worker cache if available
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      try {
        const channel = new MessageChannel();
        navigator.serviceWorker.controller.postMessage(
          { type: 'CLEAR_CACHE' },
          [channel.port2]
        );
        
        // Refresh after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } catch (error) {
        console.error('SmartUpdater: Service worker communication error:', error);
        window.location.reload();
      }
    } else {
      window.location.reload();
    }
  };

  // Dismiss update for this session
  const handleDismissUpdate = () => {
    console.log('SmartUpdater: User dismissed update');
    setShowUpdateBanner(false);
    updateDismissed.current = true;
    
    // Store dismissal in sessionStorage (resets on app restart)
    sessionStorage.setItem('updateDismissed', 'true');
  };

  // Remind later (check again in 1 hour)
  const handleRemindLater = () => {
    console.log('SmartUpdater: User chose remind later');
    setShowUpdateBanner(false);
    
    // Reset the last check time to allow checking again in 1 hour
    lastCheckTime.current = Date.now() - (MIN_CHECK_INTERVAL - 60 * 60 * 1000);
    
    setTimeout(() => {
      if (!updateDismissed.current) {
        setShowUpdateBanner(true);
      }
    }, 60 * 60 * 1000); // 1 hour
  };

  // Check if update was dismissed this session
  useEffect(() => {
    const dismissed = sessionStorage.getItem('updateDismissed');
    if (dismissed === 'true') {
      updateDismissed.current = true;
    }
  }, []);

  // Show update notification banner
  if (showUpdateBanner && updateAvailable) {
    return (
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 z-50 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-sm sm:text-base">New App Version Available!</h4>
              <p className="text-xs sm:text-sm text-blue-100">
                We've improved the app with new features and bug fixes.
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefreshNow}
              className="px-3 py-1.5 bg-white text-blue-600 rounded text-sm font-medium hover:bg-blue-50 transition-colors"
            >
              Update Now
            </button>
            <button
              onClick={handleRemindLater}
              className="px-3 py-1.5 bg-blue-700 text-white rounded text-sm hover:bg-blue-800 transition-colors hidden sm:block"
            >
              Later
            </button>
            <button
              onClick={handleDismissUpdate}
              className="p-1.5 text-blue-200 hover:text-white transition-colors"
              aria-label="Dismiss"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}