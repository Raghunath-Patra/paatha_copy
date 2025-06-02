// app/utils/service-worker.js

// Function to register the service worker
export function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
          .then((registration) => {
            console.log('ServiceWorker registration successful:', registration.scope);
            
            // Check for updates every 15 minutes
            setInterval(() => checkForUpdates(registration), 15 * 60 * 1000);
            
            // REMOVED: Auto-check on visibility change to prevent auto-refresh
            // document.addEventListener('visibilitychange', () => {
            //   if (document.visibilityState === 'visible') {
            //     checkForUpdates(registration);
            //   }
            // });
            
            // Initial update check
            checkForUpdates(registration);
          })
          .catch((error) => {
            console.error('ServiceWorker registration failed:', error);
          });
          
        // MODIFIED: Show notification instead of auto-refresh
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (!refreshing) {
            refreshing = true;
            console.log('New service worker available');
            // Instead of auto-refresh, show a notification or prompt user
            showUpdateNotification();
          }
        });
      });
    }
  }
  
  // Function to check for service worker updates (modified to be less aggressive)
  function checkForUpdates(registration) {
    // Check for updates but don't activate immediately
    registration.update()
      .then(() => {
        if (registration.waiting) {
          console.log('New service worker waiting, but not activating automatically');
          // Optionally show user notification about available update
          showUpdateNotification();
        }
      })
      .catch(err => {
        console.error('Error checking for updates:', err);
      });
  }
  
  // Show update notification instead of auto-refresh
  function showUpdateNotification() {
    // You can implement a toast notification or banner here
    console.log('App update available. Refresh to get the latest version.');
    
    // Optional: Show a simple browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('App Update Available', {
        body: 'Refresh the page to get the latest version',
        icon: '/icons/icon-192x192.png'
      });
    }
  }
  
  // Helper function to send a message to the service worker
  function postMessage(worker, message) {
    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data.error) {
          reject(event.data.error);
        } else {
          resolve(event.data);
        }
      };
      
      worker.postMessage(message, [messageChannel.port2]);
    });
  }
  
  // Function to manually refresh app (call this from user action)
  export function manualRefresh() {
    window.location.reload();
  }
  
  // Function to check current version against server version
  export async function checkAppVersion() {
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
      return { current: null, latest: null };
    }
    
    try {
      // Get current version from the active service worker
      const current = await postMessage(navigator.serviceWorker.controller, { type: 'CHECK_VERSION' });
      
      // For development environments, add a random query param to bypass caching
      const cacheBuster = process.env.NODE_ENV === 'development' ? `?_=${Date.now()}` : '';
      
      // Fetch the latest version info from the server
      const response = await fetch(`/version.json${cacheBuster}`);
      if (!response.ok) throw new Error('Failed to fetch version info');
      
      const latest = await response.json();
      
      return {
        current: current.version,
        latest: latest.version,
        needsUpdate: current.version !== latest.version
      };
    } catch (error) {
      console.error('Error checking app version:', error);
      return { current: null, latest: null, error };
    }
  }