// app/components/common/NetworkStatus.tsx


'use client';

import { useState, useEffect, useCallback } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [showReconnectPrompt, setShowReconnectPrompt] = useState(false);
  const { refreshSession } = useSupabaseAuth();

  // Check network status
  const checkNetwork = useCallback(async () => {
    // First check navigator.onLine for basic connectivity
    const onlineStatus = navigator.onLine;
    if (!onlineStatus) {
      setIsOnline(false);
      return false;
    }
    
    // Then try to ping an endpoint to check real connectivity
    try {
      // Use a simple HEAD request with a cache-busting parameter
      const timestamp = new Date().getTime();
      const response = await fetch(`https://www.paatha.ai/api/health?_=${timestamp}`, { 
        method: 'HEAD',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
        // Add a tight timeout to avoid hanging requests
        signal: AbortSignal.timeout(3000)
      });
      
      const isConnected = response.ok;
      setIsOnline(isConnected);
      return isConnected;
    } catch (error) {
      console.warn('Connectivity check failed:', error);
      // Don't immediately set offline if the ping fails once
      // This prevents flickering when there are temporary network issues
      return navigator.onLine;
    }
  }, []);

  // Handle reconnection attempts
  const handleReconnect = useCallback(async () => {
    if (isReconnecting) return; // Prevent multiple simultaneous reconnection attempts
    
    setIsReconnecting(true);
    
    try {
      // Check network first
      const networkResult = await checkNetwork();
      
      if (networkResult) {
        // If network is back, refresh auth session
        await refreshSession();
        
        // Force page refresh if reconnect was successful
        window.location.reload();
      } else {
        // If still no connection, show the reconnect prompt
        setShowReconnectPrompt(true);
      }
    } catch (error) {
      console.error('Error during reconnection:', error);
      setShowReconnectPrompt(true);
    } finally {
      setIsReconnecting(false);
    }
  }, [checkNetwork, refreshSession, isReconnecting]);

  useEffect(() => {
    // Set up event handlers for online/offline events
    function handleOnline() {
      console.log('Device is online');
      // Delay to ensure connection is really established
      setTimeout(() => checkNetwork(), 1000);
    }

    function handleOffline() {
      console.log('Device is offline');
      setIsOnline(false);
    }

    // Check initial state
    checkNetwork();

    // Set up listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Set up periodic network checks only when offline
    const intervalId = setInterval(() => {
      if (!isOnline) {
        checkNetwork();
      }
    }, 15000); // Check every 15 seconds if offline (reduced from 30s)

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [checkNetwork, isOnline]);

  // Show reconnect prompt after 5 seconds of being offline (reduced from 10s)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (!isOnline) {
      timeoutId = setTimeout(() => {
        setShowReconnectPrompt(true);
      }, 5000);
    } else {
      setShowReconnectPrompt(false);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isOnline]);

  if (isOnline) return null;

  if (showReconnectPrompt) {
    return (
      <div className="fixed bottom-20 left-4 right-4 bg-red-50 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <WifiOff size={18} className="mr-2" />
            <span>You're offline. Check your connection.</span>
          </div>
          <button
            onClick={handleReconnect}
            disabled={isReconnecting}
            className="ml-4 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 flex items-center"
          >
            {isReconnecting ? (
              <>
                <RefreshCw size={14} className="mr-1 animate-spin" />
                <span>Reconnecting...</span>
              </>
            ) : (
              <>
                <RefreshCw size={14} className="mr-1" />
                <span>Reconnect</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 right-4 bg-red-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-50">
      <WifiOff size={18} />
      <span>Offline</span>
    </div>
  );
}