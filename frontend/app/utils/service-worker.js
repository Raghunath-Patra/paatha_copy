// app/utils/service-worker.js

let lastUpdateCheck = 0;
const UPDATE_CHECK_COOLDOWN = 5 * 60 * 1000; // 5 minutes cooldown between checks

// Function to register the service worker
export function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
          .then((registration) => {
            console.log('ServiceWorker registration successful:', registration.scope);
            
            // Check for updates every 15 minutes (but with rate limiting)
            setInterval(() => checkForUpdates(registration), 15 * 60 * 1000);
            
            // Also check for updates when the app comes back to focus (with rate limiting)
            document.addEventListener('visibilitychange', () => {
              if (document.visibilityState === 'visible') {
                const now = Date.now();
                if (now - lastUpdateCheck > UPDATE_CHECK_COOLDOWN) {
                  console.log('App visible, checking for service worker updates');
                  checkForUpdates(registration);
                } else {
                  console.log('Skipping service worker update check due to cooldown');
                }
              }
            });
            
            // Initial update check (with delay to let app settle)
            setTimeout(() => checkForUpdates(registration), 5000);
          })
          .catch((error) => {
            console.error('ServiceWorker registration failed:', error);
          });
          
        // Handle controlled changes (when a new service worker takes over)
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (!refreshing) {
            refreshing = true;
            console.log('New service worker controller, refreshing page');
            window.location.reload();
          }
        });
      });
    }
  }
  
  // Function to check for service worker updates
  function checkForUpdates(registration) {
    const now = Date.now();
    
    // Rate limiting to prevent excessive checks
    if (now - lastUpdateCheck < UPDATE_CHECK_COOLDOWN) {
      console.log('Service worker update check rate limited');
      return;
    }
    
    lastUpdateCheck = now;
    
    // Force the update check
    registration.update()
      .then(() => {
        if (registration.waiting) {
          // If there's a waiting worker, activate it immediately
          console.log('New service worker waiting, activating now');
          postMessage(registration.waiting, { type: 'SKIP_WAITING' });
        } else {
          console.log('No service worker update available');
        }
      })
      .catch(err => {
        console.error('Error checking for service worker updates:', err);
      });
  }
  
  // Helper function to send a message to the service worker
  function postMessage(worker, message) {
    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();
      
      // Set timeout to prevent hanging
      const timeoutId = setTimeout(() => {
        reject(new Error('Service worker message timeout'));
      }, 5000);
      
      messageChannel.port1.onmessage = (event) => {
        clearTimeout(timeoutId);
        if (event.data.error) {
          reject(event.data.error);
        } else {
          resolve(event.data);
        }
      };
      
      try {
        worker.postMessage(message, [messageChannel.port2]);
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
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
      
      // Fetch the latest version info from the server with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`/version.json${cacheBuster}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
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