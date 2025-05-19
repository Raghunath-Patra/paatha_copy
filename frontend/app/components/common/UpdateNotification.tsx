// app/components/common/UpdateNotification.tsx

'use client';

import { useState, useEffect } from 'react';
import { checkAppVersion } from '../../utils/service-worker';
import { RefreshCw } from 'lucide-react';

export default function UpdateNotification() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    // Check for updates on component mount
    checkForUpdates();
    
    // Set up interval to check for updates (every 5 minutes)
    const interval = setInterval(checkForUpdates, 5 * 60 * 1000);
    
    // Also check when the tab becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdates();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  async function checkForUpdates() {
    try {
      const { needsUpdate } = await checkAppVersion();
      setUpdateAvailable(Boolean(needsUpdate));
    } catch (error) {
      console.error('Error checking for updates:', error);
    }
  }
  
  function handleUpdate() {
    setLoading(true);
    // Force reload from server, bypass cache
    window.location.reload();
  }
  
  if (!updateAvailable) {
    return null;
  }
  
  return (
    <div className="fixed bottom-16 left-4 right-4 bg-blue-50 text-blue-700 px-4 py-3 rounded-lg shadow-lg z-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <RefreshCw size={18} className="mr-2" />
          <p>A new version is available</p>
        </div>
        <button
          onClick={handleUpdate}
          disabled={loading}
          className="ml-4 px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center"
        >
          {loading ? (
            <>
              <RefreshCw size={14} className="mr-1 animate-spin" />
              <span>Updating...</span>
            </>
          ) : (
            <span>Update Now</span>
          )}
        </button>
      </div>
    </div>
  );
}