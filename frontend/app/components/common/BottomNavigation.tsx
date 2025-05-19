// frontend/app/components/common/BottomNavigation.tsx

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Home, TableOfContents, BarChart2, FileQuestion } from 'lucide-react';
import { getAuthHeaders } from '../../utils/auth';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';

export default function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const searchParams = useSearchParams();
  const { loading: authLoading, refreshSession } = useSupabaseAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigationCompletionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Extract route parameters
  const board = params?.board as string;
  const classLevel = params?.class as string;
  const subject = params?.subject as string;
  const chapter = params?.chapter as string;
  
  // Determine current page type
  const isHomePage = pathname === '/';
  const isSubjectsPage = pathname.match(/\/[^\/]+\/[^\/]+$/) !== null;
  const isChapterPage = pathname.match(/\/[^\/]+\/[^\/]+\/[^\/]+\/[^\/]+$/) !== null && !pathname.includes('/performance');
  const isPerformancePage = pathname.includes('/performance');
  const isProfilePage = pathname === '/profile';
  const isUpgradePage = pathname === '/upgrade' || pathname.includes('/upgrade/');
  const isLegalPage = pathname === '/privacy' || pathname === '/terms' || pathname === '/refund' || pathname === '/about';
  
  // All non-course pages should show the home button only
  const isSimplePage = isUpgradePage || isLegalPage || isProfilePage;

  // Reset navigation when route changes
  useEffect(() => {
    // Clean up any pending timeouts
    setIsNavigating(false);
    setIsLoading(false);
    
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
      navigationTimeoutRef.current = null;
    }
    
    if (navigationCompletionTimeoutRef.current) {
      clearTimeout(navigationCompletionTimeoutRef.current);
      navigationCompletionTimeoutRef.current = null;
    }
    
    return () => {
      // Cleanup on unmount
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
      if (navigationCompletionTimeoutRef.current) {
        clearTimeout(navigationCompletionTimeoutRef.current);
      }
    };
  }, [pathname, searchParams]);

  // Listen for nextQuestionRequest events from FeedbackCard
  useEffect(() => {
    // Listen for the custom event from FeedbackCard
    const handleNextQuestionRequest = () => {
      handleNextQuestion();
    };
    
    window.addEventListener('nextQuestionRequest', handleNextQuestionRequest);
    
    return () => {
      window.removeEventListener('nextQuestionRequest', handleNextQuestionRequest);
    };
  }, []);

  // Safe navigation function - simplify to use direct URL changes for reliability
  const safeNavigate = useCallback((path: string) => {
    if (isNavigating || isLoading) {
      console.log('Already navigating or loading, ignoring navigation request');
      return;
    }
    
    console.log(`Starting navigation to: ${path}`);
    setIsNavigating(true);
    
    // Use direct navigation to avoid React router issues
    console.log(`Using direct navigation for path: ${path}`);
    window.location.href = path;
  }, [isNavigating, isLoading]);

  // Go to home page
  const goToHome = () => {
    if (isNavigating || isLoading) return;
    // Use direct navigation for home
    window.location.href = '/';
  };

  // Navigate to chapters/subjects list
  const goToChapters = () => {
    if (isNavigating || isLoading) return;
    safeNavigate(`/${board}/${classLevel}`);
  };

  // Navigate to performance page
  const goToPerformance = () => {
    if (isNavigating || isLoading) return;
    safeNavigate(`/${board}/${classLevel}/${subject}/${chapter}/performance`);
  };

  // Navigate to chapter page with question ID preserved or fetched
  const goToQuestions = async () => {
    try {
      // If already navigating, don't do anything
      if (isNavigating || isLoading) {
        console.log('Already in progress, skipping questions navigation');
        return;
      }
      
      // Only show loading state if we need to fetch a question
      const currentQuestionId = searchParams?.get('q');
      if (currentQuestionId) {
        // If we already have a question ID in the URL, just use it
        safeNavigate(`/${board}/${classLevel}/${subject}/${chapter}?q=${currentQuestionId}`);
        return;
      }
      
      // If no question ID in URL, we need to fetch one
      console.log('No question ID found, fetching a random question');
      setIsLoading(true);
      
      // Don't proceed if we don't have the required parameters
      if (!board || !classLevel || !subject || !chapter) {
        console.error("Missing route parameters");
        setIsLoading(false);
        router.push('/');
        return;
      }
      
      // If auth is loading, refresh first then continue
      if (authLoading) {
        await refreshSession();
      }
      
      try {
        // Fetch a random question to ensure we have a question ID
        const API_URL = process.env.NEXT_PUBLIC_API_URL;
        const { headers, isAuthorized } = await getAuthHeaders();
        
        if (!isAuthorized) {
          console.error("Not authorized");
          setIsLoading(false);
          router.push('/login');
          return;
        }
        
        const url = `${API_URL}/api/questions/${board}/${classLevel}/${subject}/${chapter}/random`;
        console.log(`Fetching random question from: ${url}`);
        const response = await fetch(url, { headers });
        
        // Handle usage limit errors
        if (response.status === 402) {
          setIsLoading(false);
          // Instead of directly navigating, we'll update the URL with a token_limit=true parameter
          // This will allow the chapter page to display the appropriate message
          const tokenLimitUrl = `/${board}/${classLevel}/${subject}/${chapter}?token_limit=true`;
          window.location.href = tokenLimitUrl;
          return;
        }
        
        if (!response.ok) {
          throw new Error('Failed to fetch question');
        }
        
        const data = await response.json();
        
        if (data && data.id) {
          // Navigate to the new question URL
          const newUrl = `/${board}/${classLevel}/${subject}/${chapter}?q=${data.id}`;
          console.log(`Question fetched, navigating to: ${newUrl}`);
          safeNavigate(newUrl);
        } else {
          // Fallback in case of error
          console.warn('No question ID in response, using fallback navigation');
          safeNavigate(`/${board}/${classLevel}/${subject}/${chapter}`);
        }
      } catch (error) {
        console.error('Error navigating to questions:', error);
        // Fallback to base URL
        safeNavigate(`/${board}/${classLevel}/${subject}/${chapter}`);
      } finally {
        // Always ensure loading state is reset
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error in goToQuestions:', error);
      setIsLoading(false);
    }
  };

  // Handle next question - fetches a new question and updates URL
  const handleNextQuestion = async () => {
    try {
      // If already navigating or loading, don't do anything
      if (isNavigating || isLoading) {
        console.log('Already in progress, skipping next question');
        return;
      }
      
      console.log('Fetching next question');
      setIsLoading(true);
      
      // Don't proceed if we don't have the required parameters
      if (!board || !classLevel || !subject || !chapter) {
        console.error("Missing route parameters");
        setIsLoading(false);
        return;
      }
      
      // If auth is loading, refresh first then continue
      if (authLoading) {
        await refreshSession();
      }
      
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL;
        const { headers, isAuthorized } = await getAuthHeaders();
        
        if (!isAuthorized) {
          console.error("Not authorized");
          setIsLoading(false);
          router.push('/login');
          return;
        }
        
        // First check if the user has reached their token limit before fetching a question
        const tokenCheckResponse = await fetch(`${API_URL}/api/user/token-status`, { headers });
        if (tokenCheckResponse.ok) {
          const tokenData = await tokenCheckResponse.json();
          if (tokenData.limit_reached) {
            console.log('Token limit reached, showing warning');
            setIsLoading(false);
            
            // Instead of redirecting, dispatch a custom event that the parent page can listen for
            const limitEvent = new CustomEvent('tokenLimitReached', { 
              detail: { 
                isPremium: tokenData.plan_name === 'premium',
                allowClose: false // Don't allow this warning to be closed
              } 
            });
            window.dispatchEvent(limitEvent);
            
            return;
          }
        }
        
        // Fetch a random question
        const url = `${API_URL}/api/questions/${board}/${classLevel}/${subject}/${chapter}/random`;
        console.log(`Fetching random question from: ${url}`);
        const response = await fetch(url, { headers });
        
        // Handle usage limit errors
        if (response.status === 402) {
          setIsLoading(false);
          
          // Dispatch custom event for token limit
          const limitEvent = new CustomEvent('tokenLimitReached', { 
            detail: { 
              isPremium: false,
              allowClose: false // Don't allow this warning to be closed
            }
          });
          window.dispatchEvent(limitEvent);
          
          return;
        }
        
        if (!response.ok) {
          throw new Error('Failed to fetch question');
        }
        
        const data = await response.json();
        
        if (data && data.id) {
          // Navigate to the new question URL with a specific flag to indicate new question
          const newUrl = `/${board}/${classLevel}/${subject}/${chapter}?q=${data.id}&newq=1`;
          console.log(`Question fetched, navigating to: ${newUrl}`);
          
          safeNavigate(newUrl);
        } else {
          console.error("No question ID in response");
          // Reset loading state since we won't be navigating
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error fetching next question:', error);
        // Reset loading state since we won't be navigating
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error in handleNextQuestion:', error);
      setIsLoading(false);
    }
  };
  
  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 flex justify-around items-center z-50">
        {/* Loading indicator overlay */}
        {(isLoading || isNavigating) && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        {/* Home button - shown on all pages */}
        <button
          onClick={goToHome}
          className={`p-2 ${isHomePage ? 'text-blue-600' : 'text-gray-600'} flex flex-col items-center justify-center`}
          title="Home"
          aria-label="Home"
          disabled={isLoading || isNavigating}
        >
          <Home size={20} />
          <span className="text-xs mt-1">Home</span>
        </button>
        
        {/* For simple pages (legal, upgrade), we only show the Home button */}
        {!isSimplePage && (
          <>
            {/* Chapters button - shown on chapter and performance pages */}
            {(isChapterPage || isPerformancePage) && (
              <button
                onClick={goToChapters}
                className="p-2 text-gray-600 flex flex-col items-center justify-center"
                title="Chapters"
                aria-label="Back to Chapter List"
                disabled={isLoading || isNavigating}
              >
                <TableOfContents size={20} />
                <span className="text-xs mt-1">Chapters</span>
              </button>
            )}
            
            {/* Performance button - shown on chapter and performance pages */}
            {(isChapterPage || isPerformancePage) && (
              <button
                onClick={goToPerformance}
                className={`p-2 ${isPerformancePage ? 'text-green-600' : 'text-gray-600'} flex flex-col items-center justify-center`}
                title="Performance"
                aria-label="View Performance Report"
                disabled={isLoading || isNavigating}
              >
                <BarChart2 size={20} />
                <span className="text-xs mt-1">Performance</span>
              </button>
            )}
            
            {/* Questions button - shown only on performance page */}
            {isPerformancePage && (
              <button
                onClick={goToQuestions}
                disabled={isLoading || isNavigating}
                className="p-2 text-blue-600 flex flex-col items-center justify-center min-w-[60px]"
                title="Questions"
                aria-label="Back to Questions"
              >
                <FileQuestion size={20} />
                <span className="text-xs mt-1 whitespace-nowrap">
                  {isLoading ? "Loading..." : "Questions"}
                </span>
              </button>
            )}
          </>
        )}
      </div>
      
      {/* Add padding at the bottom to prevent content from being hidden behind the navigation bar */}
      <div className="h-16"></div>
    </>
  );
}