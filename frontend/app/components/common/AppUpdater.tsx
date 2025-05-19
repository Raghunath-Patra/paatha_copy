// app/components/common/AppUpdater.tsx
'use client';

import { useEffect, useState } from 'react';

export default function AppUpdater() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    // Function to check for updates
    const checkForUpdates = async () => {
      try {
        // Fetch current version info with a cache-busting parameter
        const response = await fetch(`/version.json?_=${Date.now()}`);
        if (!response.ok) return;
        
        const serverVersion = await response.json();
        
        // Get stored version from localStorage
        const storedVersion = localStorage.getItem('appVersion');
        const storedLogoVersion = localStorage.getItem('logoVersion');
        
        // If the versions are different, update is available
        if (
          !storedVersion || 
          !storedLogoVersion || 
          storedVersion !== serverVersion.version || 
          storedLogoVersion !== serverVersion.logoVersion
        ) {
          console.log('New version available:', serverVersion);
          setUpdateAvailable(true);
          
          // Update stored version
          localStorage.setItem('appVersion', serverVersion.version);
          localStorage.setItem('logoVersion', serverVersion.logoVersion);
          
          // Clear icon cache via service worker
          if (navigator.serviceWorker && navigator.serviceWorker.controller) {
            const channel = new MessageChannel();
            navigator.serviceWorker.controller.postMessage(
              { type: 'CLEAR_ICON_CACHE' },
              [channel.port2]
            );
            
            // Listen for response
            channel.port1.onmessage = (event) => {
              if (event.data && event.data.type === 'ICON_CACHE_CLEARED') {
                console.log('Icon cache cleared successfully');
                // Refresh the page after a short delay
                setTimeout(() => {
                  window.location.reload();
                }, 1000);
              }
            };
          }
        }
      } catch (error) {
        console.error('Error checking for updates:', error);
      }
    };

    // Check immediately on component mount
    checkForUpdates();
    
    // Set up interval to check periodically (every 30 minutes)
    intervalId = setInterval(checkForUpdates, 30 * 60 * 1000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  // This component doesn't render anything visible
  return null;
}