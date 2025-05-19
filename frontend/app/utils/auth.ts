// frontend/app/utils/auth.ts

import { supabase } from './supabase';

interface AuthHeaders {
  headers: HeadersInit;
  isAuthorized: boolean;
}

// Track when we last refreshed the session to avoid too many refreshes
let lastRefreshTime = 0;
const MIN_REFRESH_INTERVAL = 10000; // 10 seconds minimum between refreshes

export const getAuthHeaders = async (): Promise<AuthHeaders> => {
  try {
    const now = Date.now();
    const shouldRefresh = now - lastRefreshTime > MIN_REFRESH_INTERVAL;
    
    // Get current session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    // If no session or error, try refreshing it (but not too frequently)
    if ((!session || error) && shouldRefresh) {
      console.log('No valid session, attempting refresh');
      lastRefreshTime = now;
      
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError || !refreshData.session) {
        console.error('Session refresh failed:', refreshError);
        // Handle expired sessions by redirecting to login
        handleSessionExpired();
        return {
          headers: {
            'Content-Type': 'application/json'
          },
          isAuthorized: false
        };
      }
      
      console.log('Session refreshed successfully');
      return {
        headers: {
          'Authorization': `Bearer ${refreshData.session.access_token}`,
          'Content-Type': 'application/json'
        },
        isAuthorized: true
      };
    }
    
    // If still no session after refresh attempt
    if (!session) {
      console.error('No session available after refresh attempt');
      // Handle expired sessions by redirecting to login
      handleSessionExpired();
      return {
        headers: {
          'Content-Type': 'application/json'
        },
        isAuthorized: false
      };
    }

    return {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      isAuthorized: true
    };
  } catch (error) {
    console.error('Error getting auth headers:', error);
    return {
      headers: {
        'Content-Type': 'application/json'
      },
      isAuthorized: false
    };
  }
};

// New function to handle expired sessions
const handleSessionExpired = async () => {
  // Only redirect if we're in a browser environment
  if (typeof window !== 'undefined') {
    try {
      // Sign out to clear any invalid tokens
      await supabase.auth.signOut();
      
      // Redirect to login page with session expired parameter
      window.location.href = '/login?session_expired=true';
    } catch (error) {
      console.error('Error during session expiry handling:', error);
      // Force redirect even if the signOut fails
      window.location.href = '/login?session_expired=true';
    }
  }
};

// Modify the fetch logic to detect 401 errors
export const safeFetch = async (url: string, options: RequestInit = {}) => {
  try {
    const { headers, isAuthorized } = await getAuthHeaders();
    
    if (!isAuthorized) {
      // getAuthHeaders will handle redirection if needed
      throw new Error('Not authorized');
    }
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...(options.headers || {})
      }
    });
    
    // Check for 401 Unauthorized errors
    if (response.status === 401) {
      console.error('Received 401 Unauthorized response');
      await handleSessionExpired();
      throw new Error('Session expired');
    }
    
    return response;
  } catch (error) {
    console.error('Error in safeFetch:', error);
    throw error;
  }
};

// Refresh token if needed
export const refreshSessionIfNeeded = async (): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.log('No session found, attempting refresh');
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error || !data.session) {
        console.error('Session refresh failed:', error);
        await handleSessionExpired();
        return false;
      }
      
      return true;
    }
    
    // Check if session is about to expire (within 10 minutes)
    // Handle possible undefined expires_at
    if (session.expires_at) {
      const expiresAt = session.expires_at * 1000; // Convert to milliseconds
      const now = Date.now();
      const tenMinutes = 10 * 60 * 1000;
      
      if (expiresAt - now < tenMinutes) {
        console.log('Session about to expire, refreshing');
        const { data, error } = await supabase.auth.refreshSession();
        
        if (error || !data.session) {
          console.error('Session refresh failed:', error);
          await handleSessionExpired();
          return false;
        }
        
        return true;
      }
    } else {
      // If expires_at is undefined, refresh session as a precaution
      console.log('Session expiration unknown, refreshing as precaution');
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error || !data.session) {
        console.error('Precautionary session refresh failed:', error);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error checking/refreshing session:', error);
    return false;
  }
};