// frontend/app/utils/authRedirect.ts
import { NextRouter } from 'next/router';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

/**
 * Handles redirect after successful authentication
 * Checks for stored original path and redirects accordingly
 */
export const handlePostAuthRedirect = (router: NextRouter) => {
  try {
    // Check if there's a stored original path
    const originalPath = sessionStorage.getItem('originalPath');
    
    if (originalPath) {
      console.log('Redirecting to stored original path:', originalPath);
      // Clear the stored path
      sessionStorage.removeItem('originalPath');
      // Redirect to the original path
      router.push(originalPath);
    } else {
      console.log('No stored path found, redirecting to home');
      // Default redirect to home
      router.push('/');
    }
  } catch (error) {
    console.error('Error handling post-auth redirect:', error);
    // Fallback to home page
    router.push('/');
  }
};

/**
 * Alternative function for use with useRouter from next/navigation (App Router)
 */
export const handlePostAuthRedirectNavigation = (router: AppRouterInstance) => {
  try {
    // Check if there's a stored original path
    const originalPath = sessionStorage.getItem('originalPath');
    
    if (originalPath) {
      console.log('Redirecting to stored original path:', originalPath);
      // Clear the stored path
      sessionStorage.removeItem('originalPath');
      // Use window.location.href for more reliable navigation in auth contexts
      window.location.href = originalPath;
    } else {
      console.log('No stored path found, redirecting to home');
      // Default redirect to home
      window.location.href = '/';
    }
  } catch (error) {
    console.error('Error handling post-auth redirect:', error);
    // Fallback to home page
    window.location.href = '/';
  }
};

/**
 * Store the current path for post-auth redirect
 * Useful for storing paths before redirecting to login
 */
export const storeOriginalPath = (path: string) => {
  try {
    if (typeof window !== 'undefined') {
      console.log('Storing original path:', path);
      sessionStorage.setItem('originalPath', path);
    }
  } catch (error) {
    console.error('Error storing original path:', error);
  }
};

/**
 * Get the stored original path without removing it
 */
export const getStoredPath = (): string | null => {
  try {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('originalPath');
    }
    return null;
  } catch (error) {
    console.error('Error getting stored path:', error);
    return null;
  }
};

/**
 * Clear the stored original path
 */
export const clearStoredPath = () => {
  try {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('originalPath');
    }
  } catch (error) {
    console.error('Error clearing stored path:', error);
  }
};