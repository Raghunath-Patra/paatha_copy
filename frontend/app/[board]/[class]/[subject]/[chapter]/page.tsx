// frontend/app/[board]/[class]/[subject]/[chapter]/page.tsx - Enhanced with user token service
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
import DailyLimitReached from '../../../../components/limits/DailyLimitReached';
import { getAuthHeaders } from '../../../../utils/auth';
import { useSupabaseAuth } from '../../../../contexts/SupabaseAuthContext';
import { userTokenService } from '../../../../utils/userTokenService';
 
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
  follow_up_questions?: string[];
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

// Header skeleton component
const ThemedHeaderSkeleton = () => (
  <div className="flex justify-between mb-6">
    <div className="space-y-2">
      <div className="h-6 sm:h-8 bg-gradient-to-r from-red-200 to-orange-200 rounded w-64 sm:w-80 animate-pulse"></div>
      <div className="h-4 bg-gradient-to-r from-orange-200 to-yellow-200 rounded w-32 sm:w-40 animate-pulse"></div>
    </div>
    <div className="flex gap-2">
      <div className="h-10 w-20 bg-gradient-to-r from-red-200 to-orange-200 rounded-lg animate-pulse"></div>
      <div className="h-10 w-16 bg-gradient-to-r from-orange-200 to-yellow-200 rounded-lg animate-pulse"></div>
    </div>
  </div>
);

// Enhanced question skeleton with theme
const ThemedQuestionSkeleton = () => (
  <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-4 sm:p-6 border border-white/50 relative overflow-hidden">
    {/* Subtle gradient overlay */}
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-50/30 via-orange-50/30 to-yellow-50/30 opacity-50"></div>
    
    <div className="relative z-10 space-y-4">
      {/* Skeleton metadata tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-6 bg-gradient-to-r from-red-200 to-orange-200 rounded-full w-16 animate-pulse" 
               style={{ animationDelay: `${i * 100}ms` }} />
        ))}
      </div>
      
      {/* Skeleton question text */}
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-4 bg-gradient-to-r from-orange-200 to-yellow-200 rounded animate-pulse" 
               style={{ 
                 width: i === 3 ? '70%' : '100%',
                 animationDelay: `${i * 150}ms` 
               }} />
        ))}
      </div>
    </div>
  </div>
);

// Answer form skeleton during submission
const ThemedAnswerSkeleton = () => (
  <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-4 sm:p-6 border border-white/50 relative overflow-hidden">
    {/* Subtle gradient overlay */}
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-50/30 to-transparent opacity-50"></div>
    
    <div className="relative z-10 space-y-4">
      <div className="h-32 bg-gradient-to-r from-yellow-200 to-orange-200 rounded-lg animate-pulse"></div>
      <div className="h-12 bg-gradient-to-r from-orange-200 to-red-200 rounded-lg animate-pulse"></div>
    </div>
  </div>
);

// Feedback skeleton during submission
const ThemedFeedbackSkeleton = () => (
  <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/50 relative overflow-hidden">
    {/* Decorative gradient */}
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-50/30 via-orange-50/30 to-yellow-50/30 opacity-50"></div>
    
    <div className="relative z-10 space-y-4">
      {/* Score skeleton */}
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 bg-gradient-to-r from-red-200 to-orange-200 rounded w-20 animate-pulse"></div>
        <div className="h-8 w-16 bg-gradient-to-r from-orange-200 to-yellow-200 rounded-full animate-pulse"></div>
      </div>
      
      {/* Feedback text skeleton */}
      <div className="space-y-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} 
               className="h-4 bg-gradient-to-r from-yellow-200 to-red-200 rounded animate-pulse" 
               style={{ 
                 width: i === 4 ? '60%' : '100%',
                 animationDelay: `${i * 100}ms` 
               }} />
        ))}
      </div>
      
      {/* Model answer skeleton */}
      <div className="mt-6 space-y-2">
        <div className="h-5 bg-gradient-to-r from-red-200 to-orange-200 rounded w-32 animate-pulse"></div>
        {[1, 2, 3].map(i => (
          <div key={i} 
               className="h-4 bg-gradient-to-r from-orange-200 to-yellow-200 rounded animate-pulse" 
               style={{ 
                 width: i === 3 ? '80%' : '100%',
                 animationDelay: `${i * 150}ms` 
               }} />
        ))}
      </div>
    </div>
  </div>
);

// Floating button skeleton
const ThemedFloatingButtonSkeleton = () => (
  <div className="fixed bottom-6 right-6 z-50">
    <div className="h-14 w-14 bg-gradient-to-r from-red-200 to-orange-200 rounded-full animate-pulse shadow-lg"></div>
  </div>
);

export default function ThemedChapterPage() {
  const params = useParams() as unknown as PerformancePageParams;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, loading: authLoading } = useSupabaseAuth();
  const [question, setQuestion] = useState<Question | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [chapterName, setChapterName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [chapterNameLoading, setChapterNameLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeTaken, setTimeTaken] = useState<number>(0);
  const [shouldStopTimer, setShouldStopTimer] = useState(false);
  const [showUpgradeButton, setShowUpgradeButton] = useState(false);
  const [showTokenWarning, setShowTokenWarning] = useState(false);
  const [tokenWarningAllowClose, setTokenWarningAllowClose] = useState(true);
  const [errorDisplayMode, setErrorDisplayMode] = useState<'none' | 'token-warning' | 'error-message'>('none');
  
  // NEW: State for showing daily limit page
  const [showLimitPage, setShowLimitPage] = useState(false);
  const [userTokenStatus, setUserTokenStatus] = useState<any>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  
  // Direct function to stop the timer immediately when button is clicked
  const stopTimerImmediately = useCallback(() => {
    console.log('Stopping timer immediately from button click');
    setShouldStopTimer(true);
  }, []);
  
  // Check initial token status on page load
  useEffect(() => {
    const checkInitialTokenStatus = () => {
      const status = userTokenService.getTokenStatus();
      setUserTokenStatus(status);
      
      if (status) {
        if (status.limit_reached || !status.can_fetch_question) {
          console.log('🚫 Token limit reached, showing limit page');
          setShowLimitPage(true);
          setLoading(false);
          return true;
        }
      }
      return false;
    };

    // Subscribe to token updates
    const unsubscribe = userTokenService.onTokenUpdate((newStatus: any) => {
      setUserTokenStatus(newStatus);
      if (newStatus && (newStatus.limit_reached || !newStatus.can_fetch_question)) {
        console.log('🚫 Token limit reached via update, showing limit page');
        setShowLimitPage(true);
      }
    });

    const limitReached = checkInitialTokenStatus();
    if (limitReached) {
      return () => unsubscribe();
    }

    return () => unsubscribe();
  }, []);
  
  // Check token status regularly
  useEffect(() => {
    const checkTokenStatus = async () => {
      try {
        const { headers, isAuthorized } = await getAuthHeaders();
        if (!isAuthorized) return;
        
        const response = await fetch(`${API_URL}/api/user/question-status`, { headers });
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
    
    checkTokenStatus();
    
    if (searchParams?.get('token_limit') === 'true') {
      setShowTokenWarning(true);
      setError("You've reached your daily usage limit. Please upgrade or try again tomorrow.");
      setShowUpgradeButton(true);
      setErrorDisplayMode('token-warning');
    }
    
    const interval = setInterval(checkTokenStatus, 60000);
    return () => clearInterval(interval);
  }, [API_URL, searchParams]);
  
  const fetchQuestion = async (specificQuestionId?: string) => {
    try {
      setError(null);
      setQuestionLoading(true);
      setErrorDisplayMode('none');

      // SMART PRE-VALIDATION: Check user tokens before making API call
      const actionCheck = userTokenService.canPerformAction('fetch_question');
      if (!actionCheck.allowed) {
        console.log('❌ Question fetch blocked:', actionCheck.reason);
        setShowLimitPage(true);
        setQuestionLoading(false);
        return undefined;
      }

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

      if (!response.ok) {
        if (response.status === 402) {
          // DON'T update token service cache - just show limit page
          // The server already knows the limit is reached
          console.log('🚫 Server says limit reached, showing limit page');
          setShowLimitPage(true);
          setQuestionLoading(false);
          return undefined;
        }
        
        const responseText = await response.text();
        let isTokenLimitError = false;
        
        try {
          const errorData = JSON.parse(responseText);
          isTokenLimitError = 
            (errorData.detail && errorData.detail.toLowerCase().includes('token limit')) ||
            (errorData.detail && errorData.detail.toLowerCase().includes('usage limit')) ||
            (errorData.detail && errorData.detail.toLowerCase().includes('daily limit')) ||
            (errorData.detail && errorData.detail.toLowerCase().includes('limit reached'));
        } catch (e) {
          isTokenLimitError = 
            responseText.toLowerCase().includes('token limit') ||
            responseText.toLowerCase().includes('usage limit') ||
            responseText.toLowerCase().includes('daily limit') ||
            responseText.toLowerCase().includes('limit reached');
        }
        
        if (isTokenLimitError) {
          userTokenService.updateTokenUsage({ input: 1000, output: 1000 });
          setShowLimitPage(true);
          setQuestionLoading(false);
          return undefined;
        }
        
        throw new Error('Failed to fetch question');
      }

      const data = await response.json();
      setQuestion(data);
      
      // Update token usage after successful fetch (don't increment question count for fetching)
      userTokenService.updateTokenUsage({ input: 50 });
      
      return data;
    } catch (err) {
      console.error('Error fetching question:', err);
      
      if (!showLimitPage) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setErrorDisplayMode('error-message');
      }
      return undefined;
    } finally {
      setQuestionLoading(false);
    }
  };

  const handleSubmitAnswer = async (answer: string, imageData?: string) => {
    try {
      if (!profile) {
        router.push('/login');
        return;
      }

      // SMART PRE-VALIDATION: Check user tokens before making API call
      const actionCheck = userTokenService.canPerformAction('submit_answer');
      if (!actionCheck.allowed) {
        console.log('❌ Answer submission blocked:', actionCheck.reason);
        setShowLimitPage(true);
        return;
      }

      setShouldStopTimer(true);
      const finalTime = timeTaken;
      
      setIsSubmitting(true);
      setError(null);
      setShowUpgradeButton(false);
      setShowTokenWarning(false);
      setErrorDisplayMode('none');

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
          time_taken: finalTime,
          image_data: imageData
        }),
      });
      
      if (!response.ok) {
        if (response.status === 402) {
          // DON'T update token cache - server already knows limit is reached
          console.log('🚫 Server says limit reached, showing limit page');
          setShowLimitPage(true);
          return;
        } else if (response.status === 413) {
          setError("Your answer is too long or image is too large. Make it focused and concise.");
          setErrorDisplayMode('error-message');
        } else if (response.status === 429) {
          setError("You've reached the token limit for this question. Please move to another question.");
          setErrorDisplayMode('error-message');
        } else {
          let errorDetail = "Failed to submit answer";
          try {
            const errorResponse = await response.json();
            errorDetail = errorResponse.detail || errorDetail;
          } catch (e) {
            errorDetail = await response.text() || errorDetail;
          }
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
      
      // ONLY update token usage after successful submission with response data
      // This ensures we only increment when the backend actually processed the submission
      console.log('✅ Answer submitted and graded successfully, updating token usage');
      userTokenService.updateTokenUsage({ 
        input: 60, 
        output: 140, 
        questionSubmitted: true  // ✅ This will increment questions_used_today
      });
      
      // Auto-scroll to feedback for PWA users
      setTimeout(() => {
        const isPWA = window.matchMedia('(display-mode: standalone)').matches;
        
        if (isPWA) {
          const feedbackElement = document.querySelector('.feedback-card');
          if (feedbackElement) {
            feedbackElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start'
            });
          }
        }
      }, 300);
    } catch (err) {
      console.error('Error submitting answer:', err);
      if (!showLimitPage) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setErrorDisplayMode('error-message');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextQuestion = useCallback(async () => {
    // Check token status before fetching next question
    const actionCheck = userTokenService.canPerformAction('fetch_question');
    if (!actionCheck.allowed) {
      console.log('❌ Next question blocked:', actionCheck.reason);
      setShowLimitPage(true);
      return;
    }

    setFeedback(null);
    setShouldStopTimer(false);
    setErrorDisplayMode('none');
    setShowTokenWarning(false);
    
    try {
      const newQuestion = await fetchQuestion();
      
      if (newQuestion?.id) {
        const newUrl = `/${params.board}/${params.class}/${params.subject}/${params.chapter}?q=${newQuestion.id}`;
        router.push(newUrl);
      }
    } catch (error) {
      console.error('Error fetching next question:', error);
    }
  }, [params.board, params.class, params.subject, params.chapter, router]);

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

    const fetchChapterName = async () => {
      try {
        setChapterNameLoading(true);
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
      } finally {
        setChapterNameLoading(false);
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
        if (searchParams?.get('token_limit') === 'true' || searchParams?.get('usage_limit') === 'true') {
          setError("You've reached your daily usage limit. Please upgrade or try again tomorrow.");
          setShowUpgradeButton(true);
          setShowTokenWarning(true);
          setErrorDisplayMode('token-warning');
          setLoading(false);
          return;
        }
        
        // Fetch chapter name in parallel
        fetchChapterName();
        
        const isNewQuestion = searchParams?.get('newq') === '1';
        if (isNewQuestion) {
          setFeedback(null);
          setShouldStopTimer(false);
          const newUrl = `/${params.board}/${params.class}/${params.subject}/${params.chapter}?q=${searchParams?.get('q')}`;
          window.history.replaceState({}, '', newUrl);
        }
        
        const questionId = searchParams?.get('q');
        
        fetchQuestion(questionId || undefined).then(newQuestion => {
          if (!questionId && newQuestion?.id) {
            const newUrl = `/${params.board}/${params.class}/${params.subject}/${params.chapter}?q=${newQuestion.id}`;
            window.history.replaceState({}, '', newUrl);
          }
        });
      }
      
      setLoading(false);
    };

    // Don't initialize if showing limit page
    if (!showLimitPage) {
      initializePage();
    }
  }, [params.board, params.class, params.subject, params.chapter, router, profile, authLoading, searchParams, API_URL, showLimitPage]);

  // Format subject name function
  const formatSubjectName = (subject: string) => {
    if (!subject) return '';
    
    const mappedName = SUBJECT_CODE_TO_NAME[subject.toLowerCase()];
    if (mappedName) {
      return mappedName;
    }
    
    const parts = subject.split('-');
    return parts.map(part => {
      if (/^[IVX]+$/i.test(part)) return part.toUpperCase();
      return part.charAt(0).toUpperCase() + part.slice(1);
    }).join(' ');
  };

  // Full page loading
  if (loading && !showLimitPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center relative">
        {/* Animated background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-4 -right-4 w-16 h-16 sm:w-24 sm:h-24 bg-red-200/30 rounded-full animate-pulse" 
               style={{animationDuration: '3s'}} />
          <div className="absolute bottom-1/4 right-1/4 w-12 h-12 sm:w-16 sm:h-16 bg-yellow-200/25 rounded-full animate-bounce" 
               style={{animationDuration: '4s'}} />
          <div className="absolute top-1/2 left-1/4 w-8 h-8 sm:w-12 sm:h-12 bg-orange-200/20 rounded-full animate-ping" 
               style={{animationDuration: '2s'}} />
        </div>
        
        <div className="text-center relative z-10">
          <div className="relative mb-8">
            <div className="w-16 h-16 border-4 border-red-200 rounded-full animate-spin border-t-red-500 mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent rounded-full animate-ping border-t-red-300 mx-auto"></div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-center space-x-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
            <p className="text-gray-600 animate-pulse">Loading your question...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show daily limit page when token limits are reached
  if (showLimitPage) {
    return (
      <DailyLimitReached
        questionsUsedToday={userTokenStatus?.questions_used_today || 0}
        planName={userTokenStatus?.plan_name || 'free'}
        displayName={userTokenStatus?.display_name || 'Free Plan'}
        onUpgrade={() => {
          router.push('/upgrade');
        }}
        onGoBack={() => {
          router.push(`/${params.board}/${params.class}`);
        }}
        showStats={true}
      />
    );
  }

  const displayChapter = typeof params.chapter === 'string'
    ? params.chapter.replace(/^chapter-/, '')
    : '';

  return (
    <>
      {/* Enhanced timer animations */}
      <style jsx>{`
        @keyframes timer-pulse {
          0%, 100% { 
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.3);
            transform: scale(1);
          }
          50% { 
            box-shadow: 0 0 0 8px rgba(59, 130, 246, 0);
            transform: scale(1.02);
          }
        }
        
        @keyframes shimmer-slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        
        @keyframes clock-tick {
          0%, 50%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-5deg); }
          75% { transform: rotate(5deg); }
        }
        
        .timer-active {
          animation: timer-pulse 3s infinite;
        }
        
        .shimmer-effect {
          animation: shimmer-slide 3s infinite;
        }
        
        .clock-icon {
          animation: clock-tick 2s infinite;
        }
      `}</style>

      <div className="min-h-screen flex flex-col bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 relative">
      {/* Animated background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-4 -right-4 w-16 h-16 sm:w-24 sm:h-24 bg-red-200/30 rounded-full animate-pulse" 
             style={{animationDuration: '3s'}} />
        <div className="absolute bottom-1/4 right-1/4 w-12 h-12 sm:w-16 sm:h-16 bg-yellow-200/25 rounded-full animate-bounce" 
             style={{animationDuration: '4s'}} />
        <div className="absolute top-1/2 left-1/4 w-8 h-8 sm:w-12 sm:h-12 bg-orange-200/20 rounded-full animate-ping" 
             style={{animationDuration: '2s'}} />
      </div>

      <div className="container-fluid px-4 sm:px-8 py-4 sm:py-6 relative z-10">
        <div className="max-w-[1600px] mx-auto w-full">
          {/* Header - with skeleton for chapter name loading */}
          <div className="flex justify-between mb-6">
            <div className="flex flex-col">
              <h1 className="text-xl sm:text-2xl font-medium mb-2 text-gray-800">
                {params.subject ? formatSubjectName(params.subject) : ''} - Chapter {displayChapter}
                {chapterNameLoading ? (
                  <div className="inline-block ml-2">
                    <div className="h-6 w-32 sm:w-48 bg-gradient-to-r from-red-200 to-orange-200 rounded animate-pulse inline-block"></div>
                  </div>
                ) : chapterName && (
                  <span className="ml-2 text-gray-600">
                    : {chapterName}
                  </span>
                )}
              </h1>
              
              <p className="text-sm text-gray-600 mb-2">
                {params.board?.toUpperCase()} Class {params.class?.toUpperCase()}
              </p>
              
              {/* Timer below class heading with enhanced styling */}
              {questionLoading ? (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 backdrop-blur-sm rounded-lg px-4 py-2 shadow-sm border border-blue-200/50 w-fit">
                  <div className="h-6 w-16 bg-gradient-to-r from-blue-200 to-indigo-200 rounded animate-pulse"></div>
                </div>
              ) : question && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 backdrop-blur-sm rounded-lg px-4 py-2 shadow-sm border border-blue-200/50 w-fit relative overflow-hidden timer-active">
                  {/* Subtle animated background for active timer */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-100/0 via-blue-100/30 to-blue-100/0 shimmer-effect"></div>
                  
                  {/* Timer with icon */}
                  <div className="relative flex items-center gap-2 text-blue-700 font-medium">
                    <svg className="w-4 h-4 clock-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <QuestionTimer 
                      onTimeUpdate={setTimeTaken}
                      shouldStop={shouldStopTimer}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 items-start relative z-[100]">
              <Navigation />
              <QuestionLimitIndicator />
            </div>
          </div>

          {/* Token Warning */}
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

          {/* Error Message */}
          {errorDisplayMode === 'error-message' && error && (
            <div className="bg-red-50/90 backdrop-blur-sm text-red-600 p-4 rounded-xl mb-6 border border-red-200 shadow-sm">
              {error}
              {showUpgradeButton && !profile?.is_premium && (
                <div className="mt-4">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.href = '/upgrade';
                    }}
                    className="w-full py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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

          <div className="flex flex-col lg:flex-row gap-6">
            <div className="w-full lg:w-1/2">
              {/* Question section */}
              {questionLoading ? (
                <div className="space-y-6">
                  <ThemedQuestionSkeleton />
                  <ThemedAnswerSkeleton />
                </div>
              ) : question && (
                <div className="space-y-6">
                  <QuestionCard
                    question={question.question_text}
                    difficulty={question.difficulty}
                    type={question.type}
                    bloomLevel={question.metadata?.bloom_level}
                    category={question.metadata?.category}
                    questionNumber={question.metadata?.question_number}
                    statistics={question.statistics}
                  />

                  {/* Answer form - show skeleton during submission */}
                  {isSubmitting ? (
                    <ThemedAnswerSkeleton />
                  ) : (
                    <AnswerForm
                      onSubmit={handleSubmitAnswer}
                      isSubmitting={isSubmitting}
                      questionType={question.type}
                      options={question.options}
                      isDisabled={!!feedback}
                      stopTimer={stopTimerImmediately}
                      errorMessage={error || undefined}
                    />
                  )}
                </div>
              )}
            </div>

            <div className="w-full lg:w-1/2 mt-6 lg:mt-0">
              {/* Feedback section - show skeleton during submission */}
              {isSubmitting ? (
                <ThemedFeedbackSkeleton />
              ) : feedback ? (
                <FeedbackCard
                  score={feedback.score}
                  feedback={feedback.feedback}
                  modelAnswer={feedback.model_answer}
                  explanation={feedback.explanation}
                  transcribedText={feedback.transcribed_text}
                  userAnswer={feedback.user_answer}
                  className="feedback-card"
                  questionId={question?.id}
                  followUpQuestions={feedback.follow_up_questions}
                />
              ) : (
                <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 text-center border border-white/50 relative overflow-hidden">
                  {/* Decorative gradient */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-50/30 to-transparent opacity-50"></div>
                  
                  <div className="relative z-10 py-8">
                    <div className="text-4xl mb-4">📝</div>
                    <h3 className="text-lg font-medium text-gray-600 mb-2">
                      Feedback will appear here
                    </h3>
                    <p className="text-sm text-gray-500">
                      Submit your answer to see feedback and explanation
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Floating Next Question Button - show skeleton during question loading */}
      {questionLoading ? (
        <ThemedFloatingButtonSkeleton />
      ) : (
        <FloatingNextQuestionButton
          onNextQuestion={handleNextQuestion}
        />
      )}
      
      {/* Swipe to Next Question - mobile */}
      <SwipeToNextQuestion
        onNextQuestion={handleNextQuestion}
      />
    </div>
    </>
  );
}