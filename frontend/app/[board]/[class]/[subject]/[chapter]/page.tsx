'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Navigation from '../../../../components/navigation/Navigation';
import QuestionCard from '../../../../components/questions/QuestionCard';
import AnswerForm from '../../../../components/questions/AnswerForm';
import FeedbackCard from '../../../../components/questions/FeedbackCard';
import QuestionTimer from '../../../../components/questions/QuestionTimer';
import AllSubjectsButton from '../../../../components/common/AllSubjectsButton';
import QuestionLimitIndicator from '../../../../components/common/QuestionLimitIndicator';
import TokenLimitWarning from '../../../../components/common/TokenLimitWarning';
import FloatingNextQuestionButton from '../../../../components/questions/FloatingNextQuestionButton';
import SwipeToNextQuestion from '../../../../components/questions/SwipeToNextQuestion';
import { getAuthHeaders } from '../../../../utils/auth';
import { useSupabaseAuth } from '../../../../contexts/SupabaseAuthContext';
 
// Define a mapping for subject codes to user-friendly names
const SUBJECT_CODE_TO_NAME: Record<string, string> = {
  'iesc1dd': 'Science',
  'hesc1dd': 'Science',
  'jesc1dd': 'Science',
  'iemh1dd': 'Mathematics',
  'jemh1dd': 'Mathematics',
  'kemh1dd': 'Mathematics',
  'lemh1dd': 'Mathematics (Part I)',
  'lemh2dd': 'Mathematics (Part II)',
  'hemh1dd': 'Mathematics',
  'keph1dd': 'Physics (Part I)',
  'keph2dd': 'Physics (Part II)',
  'leph1dd': 'Physics (Part I)',
  'leph2dd': 'Physics (Part II)',
  'kech1dd': 'Chemistry (Part I)',
  'kech2dd': 'Chemistry (Part II)',
  'lech1dd': 'Chemistry (Part I)',
  'lech2dd': 'Chemistry (Part II)',
  'kebo1dd': 'Biology',
  'lebo1dd': 'Biology'
};

interface Question {
  id: string;
  question_text: string;
  type: string;
  difficulty: string;
  options?: string[];
  correct_answer: string;
  explanation: string;
  metadata: {
    bloom_level?: string;
    category?: string;
    question_number?: string;
  };
  statistics?: any;
}

interface Feedback {
  score: number;
  feedback: string;
  model_answer: string;
  explanation: string;
  transcribed_text?: string;
  user_answer?: string;
  plan_info?: {
    plan_name: string;
    display_name: string;
    requests_per_question: number;
  };
  follow_up_questions?: string[]; // Added follow-up questions
}

interface ChapterInfo {
  number: number;
  name: string;
}

interface PerformancePageParams {
  board: string;
  class: string;
  subject: string;
  chapter: string;
}

export default function ChapterPage() {
  const params = useParams() as unknown as PerformancePageParams;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, loading: authLoading } = useSupabaseAuth();
  const [question, setQuestion] = useState<Question | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [chapterName, setChapterName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeTaken, setTimeTaken] = useState<number>(0);
  const [shouldStopTimer, setShouldStopTimer] = useState(false);
  const [showUpgradeButton, setShowUpgradeButton] = useState(false);
  const [showTokenWarning, setShowTokenWarning] = useState(false);
  const [tokenWarningAllowClose, setTokenWarningAllowClose] = useState(true);
  // Add this state variable to track which error display is active
  const [errorDisplayMode, setErrorDisplayMode] = useState<'none' | 'token-warning' | 'error-message'>('none');
  // Remove the showNextControls state variable since we'll always show the controls

  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  
  // Direct function to stop the timer immediately when button is clicked
  const stopTimerImmediately = useCallback(() => {
    console.log('Stopping timer immediately from button click');
    setShouldStopTimer(true);
  }, []);
  
  // Check token status regularly
  useEffect(() => {
    const checkTokenStatus = async () => {
      try {
        const { headers, isAuthorized } = await getAuthHeaders();
        if (!isAuthorized) return;
        
        const response = await fetch(`${API_URL}/api/user/token-status`, { headers });
        if (response.ok) {
          const data = await response.json();
          if (data.limit_reached) {
            setShowTokenWarning(true);
          }
        }
      } catch (error) {
        console.error('Error checking token status:', error);
      }
    };
    
    // Check on initial load
    checkTokenStatus();
    
    // Also check when URL parameters change (in case we came from a "token_limit=true" redirect)
    if (searchParams?.get('token_limit') === 'true') {
      setShowTokenWarning(true);
      setError("You've reached your daily usage limit. Please upgrade or try again tomorrow.");
      setShowUpgradeButton(true);
      setErrorDisplayMode('token-warning');
    }
    
    // Check every minute
    const interval = setInterval(checkTokenStatus, 60000);
    return () => clearInterval(interval);
  }, [API_URL, searchParams]);
  
  // Add this useEffect to listen for the custom event
  useEffect(() => {
    // Listen for the token limit reached event from BottomNavigation
    const handleTokenLimitReached = (event: CustomEvent) => {
      console.log('Token limit reached event received', event.detail);
      
      // Get detail props
      const isPremium = event.detail?.isPremium || false;
      const allowClose = event.detail?.allowClose !== false; // Default to true if not specified
      
      // Set token warning to show, but hide any other error messages
      setShowTokenWarning(true);
      setTokenWarningAllowClose(allowClose);
      setErrorDisplayMode('token-warning');
      
      // Still set these for the button but don't show the error text
      setShowUpgradeButton(true);
      setError("You've reached your daily usage limit. Please upgrade or try again tomorrow.");
    };
    // Add event listener with type assertion
    window.addEventListener('tokenLimitReached', handleTokenLimitReached as EventListener);
    
    // Cleanup
    return () => {
      window.removeEventListener('tokenLimitReached', handleTokenLimitReached as EventListener);
    };
  }, []);
  
  // Remove the useEffect that controls showing/hiding next controls based on feedback
  
  const fetchQuestion = async (specificQuestionId?: string) => {
    try {
      setError(null);
      setLoading(true);
      // Reset error display state
      setErrorDisplayMode('none');

      const { headers, isAuthorized } = await getAuthHeaders();
      if (!isAuthorized) {
        router.push('/login');
        return;
      }

      let url;
      if (specificQuestionId) {
        url = `${API_URL}/api/questions/${params.board}/${params.class}/${params.subject}/${params.chapter}/q/${specificQuestionId}`;
      } else {
        url = `${API_URL}/api/questions/${params.board}/${params.class}/${params.subject}/${params.chapter}/random`;
      }

      const response = await fetch(url, { headers });

      // Handle usage limit errors with better messaging
      if (!response.ok) {
        if (response.status === 402) {
          // This is a token limit error - show the token warning
          setError("You've reached your daily usage limit. Please upgrade or try again tomorrow.");
          setShowUpgradeButton(true);
          setShowTokenWarning(true);
          setErrorDisplayMode('token-warning');
          setLoading(false);
          return undefined;
        }
        
        // Check if the error response contains a message about token limits
        const responseText = await response.text();
        let isTokenLimitError = false;
        
        try {
          const errorData = JSON.parse(responseText);
          // Check for common token limit error messages
          isTokenLimitError = 
            (errorData.detail && errorData.detail.toLowerCase().includes('token limit')) ||
            (errorData.detail && errorData.detail.toLowerCase().includes('usage limit')) ||
            (errorData.detail && errorData.detail.toLowerCase().includes('daily limit')) ||
            (errorData.detail && errorData.detail.toLowerCase().includes('limit reached'));
        } catch (e) {
          // Not JSON or parse error, check the raw response text
          isTokenLimitError = 
            responseText.toLowerCase().includes('token limit') ||
            responseText.toLowerCase().includes('usage limit') ||
            responseText.toLowerCase().includes('daily limit') ||
            responseText.toLowerCase().includes('limit reached');
        }
        
        if (isTokenLimitError) {
          // Handle as a token limit error
          setError("You've reached your daily usage limit. Please upgrade or try again tomorrow.");
          setShowUpgradeButton(true);
          setShowTokenWarning(true);
          setErrorDisplayMode('token-warning');
          setLoading(false);
          return undefined;
        }
        
        // For other errors, throw to be caught below
        throw new Error('Failed to fetch question');
      }

      const data = await response.json();
      setQuestion(data);
      return data;
    } catch (err) {
      console.error('Error fetching question:', err);
      
      // Don't set generic error message if we already have a usage limit message showing
      if (!showUpgradeButton && !showTokenWarning) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setErrorDisplayMode('error-message');
      }
      return undefined;
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async (answer: string, imageData?: string) => {
    try {
      if (!profile) {
        router.push('/login');
        return;
      }

      // Timer should already be stopped via the stopTimerImmediately function
      // But we'll make sure it's stopped here too as a fallback
      setShouldStopTimer(true);
      
      // Capture final time
      const finalTime = timeTaken;
      
      setIsSubmitting(true);
      setError(null);
      setShowUpgradeButton(false);
      setShowTokenWarning(false); // Reset token warning on new submission
      setErrorDisplayMode('none'); // Reset error display mode

      const { headers, isAuthorized } = await getAuthHeaders();
      if (!isAuthorized) {
        console.log('No auth headers, redirecting to login');
        router.push('/login');
        return;
      }

      const response = await fetch(`${API_URL}/api/grade`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          answer,
          question_id: question?.id,
          time_taken: finalTime, // Use the final time that was captured
          image_data: imageData
        }),
      });
      
      if (!response.ok) {
        // First, try to parse the error response
        let errorDetail = "Failed to submit answer";
        
        try {
          const errorResponse = await response.json();
          errorDetail = errorResponse.detail || errorDetail;
        } catch (e) {
          // If parsing fails, try to get text
          errorDetail = await response.text() || errorDetail;
        }
        
        // Handle specific status codes
        if (response.status === 402) {
          // Usage limit reached - Payment Required
          setError("You've reached your daily usage limit. Please upgrade to Premium or try again tomorrow.");
          setShowTokenWarning(true);
          setShowUpgradeButton(true);
          setErrorDisplayMode('token-warning');
        } else if (response.status === 413) {
          setError("Your answer is too long or image is too large. Make it focused and concise.");
          setErrorDisplayMode('error-message');
        } else if (response.status === 429) {
          setError("You've reached the token limit for this question. Please move to another question.");
          setErrorDisplayMode('error-message');
        } else {
          setError(errorDetail);
          setErrorDisplayMode('error-message');
        }
        return;
      }
      
      const result = await response.json();
      setFeedback({
        score: result.score,
        feedback: result.feedback,
        model_answer: result.model_answer,
        explanation: result.explanation,
        transcribed_text: result.transcribed_text,
        user_answer: answer,
        plan_info: result.plan_info,
        follow_up_questions: result.follow_up_questions || []
      });
      
      // Add auto-scroll to feedback for PWA users
      setTimeout(() => {
        // Check if we're in PWA mode
        const isPWA = window.matchMedia('(display-mode: standalone)').matches;
        
        if (isPWA) {
          // Find the feedback element
          const feedbackElement = document.querySelector('.feedback-card');
          if (feedbackElement) {
            // Scroll to the feedback element with smooth behavior
            feedbackElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start'
            });
          }
        }
      }, 300);
    } catch (err) {
      console.error('Error submitting answer:', err);
      // Don't show generic error if we're already showing a usage limit message
      if (!showUpgradeButton && !showTokenWarning) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setErrorDisplayMode('error-message');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextQuestion = useCallback(async () => {
    // Reset feedback and timer when fetching a new question
    setFeedback(null);
    setShouldStopTimer(false);
    setErrorDisplayMode('none');
    setShowTokenWarning(false);
    // Remove the line that hides controls while loading
    
    try {
      const newQuestion = await fetchQuestion();
      
      if (newQuestion?.id) {
        // Use router.push to ensure proper navigation and state update
        const newUrl = `/${params.board}/${params.class}/${params.subject}/${params.chapter}?q=${newQuestion.id}`;
        router.push(newUrl);
      }
    } catch (error) {
      console.error('Error fetching next question:', error);
    }
  }, [params.board, params.class, params.subject, params.chapter, router, fetchQuestion]);

  useEffect(() => {
    const syncUserData = async () => {
      try {
        const { headers, isAuthorized } = await getAuthHeaders();
        if (!isAuthorized) return false;

        await fetch(`${API_URL}/api/auth/sync-user`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            email: profile?.email,
            full_name: profile?.full_name,
            board: profile?.board,
            class_level: profile?.class_level
          })
        });
        return true;
      } catch (error) {
        console.error('Error syncing user data:', error);
        return false;
      }
    };

    const checkTokenStatus = async () => {
      try {
        const { headers, isAuthorized } = await getAuthHeaders();
        if (!isAuthorized) return false;
        
        const response = await fetch(`${API_URL}/api/user/token-status`, { headers });
        if (response.ok) {
          const data = await response.json();
          if (data.limit_reached) {
            // User has already reached their token limit
            setError("You've reached your daily usage limit. Please upgrade or try again tomorrow.");
            setShowUpgradeButton(true);
            setShowTokenWarning(true);
            setErrorDisplayMode('token-warning');
            return true; // Indicate that limit was reached
          }
        }
        return false; // No limit reached
      } catch (error) {
        console.error('Error checking token status:', error);
        return false;
      }
    };

    const initializePage = async () => {
      if (authLoading) return;
      if (!profile) {
        router.push('/login');
        return;
      }
      
      const synced = await syncUserData();
      if (!synced) {
        console.error('Failed to sync user data');
      }

      if (params.board && params.class && params.subject && params.chapter) {
        // Check for usage limit flag in URL (supporting both token_limit and usage_limit)
        if (searchParams?.get('token_limit') === 'true' || searchParams?.get('usage_limit') === 'true') {
          setError("You've reached your daily usage limit. Please upgrade or try again tomorrow.");
          setShowUpgradeButton(true);
          setShowTokenWarning(true);
          setErrorDisplayMode('token-warning');
          return;
        }
        
        // Pro-actively check token status before attempting to fetch a question
        const limitReached = await checkTokenStatus();
        if (limitReached) {
          // If limit reached, don't proceed with fetching a question
          setLoading(false);
          return;
        }
        
        // Check for the new question flag and reset feedback state if present
        const isNewQuestion = searchParams?.get('newq') === '1';
        if (isNewQuestion) {
          setFeedback(null);
          setShouldStopTimer(false);
          // Remove the flag from the URL without navigating
          const newUrl = `/${params.board}/${params.class}/${params.subject}/${params.chapter}?q=${searchParams?.get('q')}`;
          window.history.replaceState({}, '', newUrl);
        }
        
        // Get question ID from query params
        const questionId = searchParams?.get('q');
        
        // Always fetch a question - either the specified one or a random one
        fetchQuestion(questionId || undefined).then(newQuestion => {
          // If we fetched a random question (no ID specified), update the URL
          if (!questionId && newQuestion?.id) {
            // Update URL without triggering a new navigation
            const newUrl = `/${params.board}/${params.class}/${params.subject}/${params.chapter}?q=${newQuestion.id}`;
            window.history.replaceState({}, '', newUrl);
          }
        });
        
        try {
          const { headers, isAuthorized } = await getAuthHeaders();
          if (!isAuthorized) return;
          
          const response = await fetch(
            `${API_URL}/api/subjects/${params.board}/${params.class}/${params.subject}/chapters`,
            { headers }
          );
          
          if (response.ok) {
            const data = await response.json();
            const chapterNum = typeof params.chapter === 'string'
              ? parseInt(params.chapter.replace(/^chapter-/, '') || '0')
              : 0;
            const chapterInfo = data.chapters.find(
              (ch: ChapterInfo) => ch.number === chapterNum
            );
            if (chapterInfo) {
              setChapterName(chapterInfo.name);
            }
          }
        } catch (error) {
          console.error('Error fetching chapter name:', error);
        }
      }
    };

    initializePage();
  }, [params.board, params.class, params.subject, params.chapter, router, profile, authLoading, searchParams, API_URL]);

  // Updated formatSubjectName function to use the mapping
  const formatSubjectName = (subject: string) => {
    if (!subject) return '';
    
    // Check if we have a mapping for this subject code
    const mappedName = SUBJECT_CODE_TO_NAME[subject.toLowerCase()];
    if (mappedName) {
      return mappedName;
    }
    
    // Fall back to the original formatting logic for unknown codes
    const parts = subject.split('-');
    return parts.map(part => {
      if (/^[IVX]+$/i.test(part)) return part.toUpperCase();
      return part.charAt(0).toUpperCase() + part.slice(1);
    }).join(' ');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const displayChapter = typeof params.chapter === 'string'
    ? params.chapter.replace(/^chapter-/, '')
    : '';

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <div className="container-fluid px-8 py-6">
        <div className="max-w-[1600px] mx-auto w-full">
          <div className="flex justify-between mb-4">
            <div>
              <h1 className="text-2xl font-medium mb-2">
                {params.subject ? formatSubjectName(params.subject) : ''} - Chapter {displayChapter}
                {chapterName && (
                  <span className="ml-2 text-neutral-600">
                    : {chapterName}
                  </span>
                )}
              </h1>
              <p className="text-sm text-neutral-600">
                {params.board?.toUpperCase()} Class {params.class?.toUpperCase()}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 items-start">
              <Navigation />
              <QuestionLimitIndicator />
            </div>
          </div>

          {/* Only show TokenLimitWarning if that's the active display mode */}
          {errorDisplayMode === 'token-warning' && (
            <TokenLimitWarning 
              isVisible={showTokenWarning}
              onClose={tokenWarningAllowClose ? () => {
                setShowTokenWarning(false);
                setErrorDisplayMode('none');
              } : undefined}
              isPremium={!!profile?.is_premium}
              allowClose={tokenWarningAllowClose}
            />
          )}

          {/* Only show the error message with upgrade button if that's the active display mode */}
          {errorDisplayMode === 'error-message' && error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
              {error}
              {showUpgradeButton && !profile?.is_premium && (
                <div className="mt-4">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.href = '/upgrade';
                    }}
                    className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Upgrade to Premium
                  </button>
                </div>
              )}
              {showUpgradeButton && profile?.is_premium && (
                <div className="mt-4 text-sm">
                  <p>Your daily usage limit will reset at midnight UTC. Thank you for being a premium member!</p>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/2">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading question...</p>
                </div>
              ) : question && (
                <div className="space-y-6">
                  <div className="flex justify-end">
                    <QuestionTimer 
                      onTimeUpdate={setTimeTaken}
                      shouldStop={shouldStopTimer}
                    />
                  </div>
                  
                  <QuestionCard
                    question={question.question_text}
                    difficulty={question.difficulty}
                    type={question.type}
                    bloomLevel={question.metadata?.bloom_level}
                    category={question.metadata?.category}
                    questionNumber={question.metadata?.question_number}
                    statistics={question.statistics}
                  />

                  <AnswerForm
                    onSubmit={handleSubmitAnswer}
                    isSubmitting={isSubmitting}
                    questionType={question.type}
                    options={question.options}
                    isDisabled={!!feedback}
                    stopTimer={stopTimerImmediately}
                    errorMessage={error || undefined} // Convert null to undefined to match expected type
                  />
                </div>
              )}
            </div>

            <div className="w-full md:w-1/2 mt-6 md:mt-0">
              {feedback ? (
                <FeedbackCard
                  score={feedback.score}
                  feedback={feedback.feedback}
                  modelAnswer={feedback.model_answer}
                  explanation={feedback.explanation}
                  transcribedText={feedback.transcribed_text}
                  userAnswer={feedback.user_answer}
                  className="feedback-card"
                  questionId={question?.id}
                  followUpQuestions={feedback.follow_up_questions} // Add the follow-up questions prop
                />
              ) : (
                <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                  <div className="py-8">
                    <div className="text-4xl mb-4">📝</div>
                    <h3 className="text-lg font-medium text-neutral-600 mb-2">
                      Feedback will appear here
                    </h3>
                    <p className="text-sm text-neutral-500">
                      Submit your answer to see feedback and explanation
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Floating Next Question Button - always show on desktop */}
      <FloatingNextQuestionButton
        onNextQuestion={handleNextQuestion}
      />
      
      {/* Swipe to Next Question - always show on mobile */}
      <SwipeToNextQuestion
        onNextQuestion={handleNextQuestion}
      />
    </div>
  );
}