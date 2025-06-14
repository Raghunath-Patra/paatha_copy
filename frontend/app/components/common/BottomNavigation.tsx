// frontend/app/components/common/BottomNavigation.tsx

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Home, TableOfContents, BarChart2, FileQuestion, BookOpen } from 'lucide-react';
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
  const sectionNumber = params?.sectionNumber as string;
  
  // ✅ UPDATED: Enhanced page type detection for new section structure
  const isHomePage = pathname === '/';
  const isSubjectsPage = pathname.match(/\/[^\/]+\/[^\/]+$/) !== null;
  
  // Chapter overview page (shows list of sections) - NO performance button here
  const isChapterOverviewPage = pathname.match(/\/[^\/]+\/[^\/]+\/[^\/]+\/chapter-\d+$/) !== null;
  
  // Section-based pages
  const isSectionContentPage = pathname.match(/\/chapter-\d+\/\d+\/content$/) !== null;
  const isSectionQuestionsPage = pathname.match(/\/chapter-\d+\/\d+\/questions$/) !== null;
  const isSectionPerformancePage = pathname.match(/\/chapter-\d+\/\d+\/performance$/) !== null;
  
  // Exercise and chapter performance pages
  const isExerciseQuestionsPage = pathname.match(/\/chapter-\d+\/exercise$/) !== null;
  const isChapterPerformancePage = pathname.match(/\/chapter-\d+\/performance$/) !== null && !isSectionPerformancePage;
  
  // Any section-related page (content, questions, or performance for a specific section)
  const isInSectionView = isSectionContentPage || isSectionQuestionsPage || isSectionPerformancePage;
  
  // Legacy chapter page (old structure) - keep for backward compatibility
  const isLegacyChapterPage = pathname.match(/\/[^\/]+\/[^\/]+\/[^\/]+\/[^\/]+$/) !== null && 
                              !pathname.includes('/performance') && 
                              !pathname.includes('/exercise') && 
                              !pathname.includes('/content') && 
                              !pathname.includes('/questions') &&
                              !isChapterOverviewPage;
  
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

  // ✅ UPDATED: Navigate to chapters/subjects list (back from chapter overview)
  const goToSubjects = () => {
    if (isNavigating || isLoading) return;
    safeNavigate(`/${board}/${classLevel}`);
  };

  // ✅ NEW: Navigate back to chapter overview (from section pages)
  const goToChapter = () => {
    if (isNavigating || isLoading) return;
    safeNavigate(`/${board}/${classLevel}/${subject}/${chapter}`);
  };

  // ✅ UPDATED: Navigate to performance page (section-level based on current context)
  const goToPerformance = () => {
    if (isNavigating || isLoading) return;
    
    if ((isSectionContentPage || isSectionQuestionsPage) && sectionNumber) {
      // If we're in a section content or questions view, go to section performance
      safeNavigate(`/${board}/${classLevel}/${subject}/${chapter}/${sectionNumber}/performance`);
    } else {
      // Otherwise go to chapter performance
      safeNavigate(`/${board}/${classLevel}/${subject}/${chapter}/performance`);
    }
  };

  // ✅ UPDATED: Navigate to questions (section-specific or exercise)
  const goToQuestions = async () => {
    try {
      // If already navigating, don't do anything
      if (isNavigating || isLoading) {
        console.log('Already in progress, skipping questions navigation');
        return;
      }
      
      // For section content or performance pages, go to section questions
      if ((isSectionContentPage || isSectionPerformancePage) && sectionNumber) {
        safeNavigate(`/${board}/${classLevel}/${subject}/${chapter}/${sectionNumber}/questions`);
        return;
      }
      
      // For chapter performance page, go to exercise questions
      if (isChapterPerformancePage) {
        // Only show loading state if we need to fetch a question
        const currentQuestionId = searchParams?.get('q');
        if (currentQuestionId) {
          // If we already have a question ID in the URL, just use it
          safeNavigate(`/${board}/${classLevel}/${subject}/${chapter}/exercise?q=${currentQuestionId}`);
          return;
        }
        
        // If no question ID in URL, we need to fetch one
        console.log('No question ID found, fetching a random exercise question');
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
          
          const url = `${API_URL}/api/questions/${board}/${classLevel}/${subject}/${chapter}/exercise/random`;
          console.log(`Fetching random exercise question from: ${url}`);
          const response = await fetch(url, { headers });
          
          // Handle usage limit errors
          if (response.status === 402) {
            setIsLoading(false);
            // Instead of directly navigating, we'll update the URL with a token_limit=true parameter
            // This will allow the exercise page to display the appropriate message
            const tokenLimitUrl = `/${board}/${classLevel}/${subject}/${chapter}/exercise?token_limit=true`;
            window.location.href = tokenLimitUrl;
            return;
          }
          
          if (!response.ok) {
            throw new Error('Failed to fetch question');
          }
          
          const data = await response.json();
          
          if (data && data.id) {
            // Navigate to the new question URL
            const newUrl = `/${board}/${classLevel}/${subject}/${chapter}/exercise?q=${data.id}`;
            console.log(`Question fetched, navigating to: ${newUrl}`);
            safeNavigate(newUrl);
          } else {
            // Fallback in case of error
            console.warn('No question ID in response, using fallback navigation');
            safeNavigate(`/${board}/${classLevel}/${subject}/${chapter}/exercise`);
          }
        } catch (error) {
          console.error('Error navigating to exercise questions:', error);
          // Fallback to base URL
          safeNavigate(`/${board}/${classLevel}/${subject}/${chapter}/exercise`);
        } finally {
          // Always ensure loading state is reset
          setIsLoading(false);
        }
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
        
        // Determine the correct API endpoint based on current page
        let url;
        if (isSectionQuestionsPage && sectionNumber) {
          // For section questions, fetch section-specific questions
          url = `${API_URL}/api/questions/${board}/${classLevel}/${subject}/${chapter}/section/${sectionNumber}/random`;
        } else {
          // For exercise questions, fetch chapter-wide questions
          url = `${API_URL}/api/questions/${board}/${classLevel}/${subject}/${chapter}/exercise/random`;
        }
        
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
          // Navigate to the new question URL based on current context
          let newUrl;
          if (isSectionQuestionsPage && sectionNumber) {
            newUrl = `/${board}/${classLevel}/${subject}/${chapter}/${sectionNumber}/questions?q=${data.id}&newq=1`;
          } else {
            newUrl = `/${board}/${classLevel}/${subject}/${chapter}/exercise?q=${data.id}&newq=1`;
          }
          
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
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-1 sm:p-2 flex justify-around items-center z-50">
        {/* Loading indicator overlay */}
        {(isLoading || isNavigating) && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        {/* Home button - shown on all pages */}
        <button
          onClick={goToHome}
          className={`p-1 sm:p-2 ${isHomePage ? 'text-blue-600' : 'text-gray-600'} flex flex-col items-center justify-center min-w-0 flex-1`}
          title="Home"
          aria-label="Home"
          disabled={isLoading || isNavigating}
        >
          <Home size={16} className="sm:w-5 sm:h-5" />
          <span className="text-xs mt-0.5 hidden sm:block">Home</span>
        </button>
        
        {/* For simple pages (legal, upgrade), we only show the Home button */}
        {!isSimplePage && (
          <>
            {/* ✅ UPDATED: Subjects button - shown on chapter overview and section pages */}
            {(isChapterOverviewPage || isInSectionView || isExerciseQuestionsPage || isChapterPerformancePage) && (
              <button
                onClick={goToSubjects}
                className="p-1 sm:p-2 text-gray-600 flex flex-col items-center justify-center min-w-0 flex-1"
                title="Back to Subjects"
                aria-label="Back to Subject List"
                disabled={isLoading || isNavigating}
              >
                <TableOfContents size={16} className="sm:w-5 sm:h-5" />
                <span className="text-xs mt-0.5 hidden sm:block">Subjects</span>
              </button>
            )}

            {/* ✅ UPDATED: Chapter button - shown when in section views, exercise, or chapter performance */}
            {(isInSectionView || isExerciseQuestionsPage || isChapterPerformancePage) && (
              <button
                onClick={goToChapter}
                className="p-1 sm:p-2 text-gray-600 flex flex-col items-center justify-center min-w-0 flex-1"
                title="Back to Chapter"
                aria-label="Back to Chapter Overview"
                disabled={isLoading || isNavigating}
              >
                <BookOpen size={16} className="sm:w-5 sm:h-5" />
                <span className="text-xs mt-0.5 hidden sm:block">Chapter</span>
              </button>
            )}

            {/* ✅ UPDATED: Performance button - shown on section content and questions pages */}
            {(isSectionContentPage || isSectionQuestionsPage) && (
              <button
                onClick={goToPerformance}
                className="p-1 sm:p-2 text-gray-600 flex flex-col items-center justify-center min-w-0 flex-1"
                title="Performance"
                aria-label="View Performance Report"
                disabled={isLoading || isNavigating}
              >
                <BarChart2 size={16} className="sm:w-5 sm:h-5" />
                <span className="text-xs mt-0.5 hidden sm:block">Performance</span>
              </button>
            )}
            
            {/* ✅ UPDATED: Questions button - shown on section content and performance pages */}
            {(isSectionContentPage || isSectionPerformancePage || isChapterPerformancePage) && (
              <button
                onClick={goToQuestions}
                disabled={isLoading || isNavigating}
                className="p-1 sm:p-2 text-blue-600 flex flex-col items-center justify-center min-w-0 flex-1"
                title="Questions"
                aria-label="Questions"
              >
                <FileQuestion size={16} className="sm:w-5 sm:h-5" />
                <span className="text-xs mt-0.5 hidden sm:block whitespace-nowrap">
                  {isLoading ? "Loading..." : "Questions"}
                </span>
              </button>
            )}

            {/* ✅ LEGACY: Support for old chapter structure */}
            {isLegacyChapterPage && (
              <>
                <button
                  onClick={goToSubjects}
                  className="p-1 sm:p-2 text-gray-600 flex flex-col items-center justify-center min-w-0 flex-1"
                  title="Chapters"
                  aria-label="Back to Chapter List"
                  disabled={isLoading || isNavigating}
                >
                  <TableOfContents size={16} className="sm:w-5 sm:h-5" />
                  <span className="text-xs mt-0.5 hidden sm:block">Chapters</span>
                </button>
                
                <button
                  onClick={goToPerformance}
                  className="p-1 sm:p-2 text-gray-600 flex flex-col items-center justify-center min-w-0 flex-1"
                  title="Performance"
                  aria-label="View Performance Report"
                  disabled={isLoading || isNavigating}
                >
                  <BarChart2 size={16} className="sm:w-5 sm:h-5" />
                  <span className="text-xs mt-0.5 hidden sm:block">Performance</span>
                </button>
              </>
            )}
          </>
        )}
      </div>
      
      {/* Add padding at the bottom to prevent content from being hidden behind the navigation bar */}
      <div className="h-12 sm:h-16"></div>
    </>
  );
}