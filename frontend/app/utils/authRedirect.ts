// utils/authRedirect.ts
import { NextRouter } from 'next/router';

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
 * Alternative function for use with useRouter from next/navigation
 */
export const handlePostAuthRedirectNavigation = (router: any) => {
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