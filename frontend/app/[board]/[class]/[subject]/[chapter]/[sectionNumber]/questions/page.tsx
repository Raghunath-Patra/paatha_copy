// frontend/app/[board]/[class]/[subject]/[chapter]/[sectionNumber]/questions/page.tsx
// FIXED: Question loading issues resolved

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Navigation from '../../../../../../components/navigation/Navigation';
import QuestionCard from '../../../../../../components/questions/QuestionCard';
import AnswerForm from '../../../../../../components/questions/AnswerForm';
import FeedbackCard from '../../../../../../components/questions/FeedbackCard';
import QuestionTimer from '../../../../../../components/questions/QuestionTimer';
import AllSubjectsButton from '../../../../../../components/common/AllSubjectsButton';
import QuestionLimitIndicator from '../../../../../../components/common/QuestionLimitIndicator';
import TokenLimitWarning from '../../../../../../components/common/TokenLimitWarning';
import FloatingNextQuestionButton from '../../../../../../components/questions/FloatingNextQuestionButton';
import SwipeToNextQuestion from '../../../../../../components/questions/SwipeToNextQuestion';
import DailyLimitReached from '../../../../../../components/limits/DailyLimitReached';
import { getAuthHeaders } from '../../../../../../utils/auth';
import { useSupabaseAuth } from '../../../../../../contexts/SupabaseAuthContext';
import { userTokenService } from '../../../../../../utils/userTokenService';

// Interfaces (same as before)
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
    section_number?: number;
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

interface SectionInfo {
  number: number;
  name: string;
}

interface PerformancePageParams {
  board: string;
  class: string;
  subject: string;
  chapter: string;
  sectionNumber: string;
}

interface PrefetchedQuestion {
  question: Question;
  timestamp: number;
  isValid: boolean;
}

// Subject mapping (same as before)
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

// Removed the complex QuestionsNavigation component to match exercise page layout

// Enhanced skeleton components (same as before)
const SubmittingAnswerSkeleton = () => (
  <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-sm p-4 space-y-4 border border-white/50 relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-50/30 to-transparent opacity-50"></div>
    
    <div className="relative z-10 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 bg-gradient-to-r from-blue-200 to-indigo-200 rounded-full animate-pulse"></div>
        <div className="h-5 bg-gradient-to-r from-blue-200 to-indigo-200 rounded w-40 animate-pulse"></div>
      </div>
      
      <div className="space-y-2">
        <div className="h-2 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full w-full animate-pulse"></div>
        <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-32 animate-pulse"></div>
      </div>
      
      <div className="space-y-3 pt-4">
        <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-full animate-pulse"></div>
        <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-4/5 animate-pulse" style={{animationDelay: '0.1s'}}></div>
        <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-3/5 animate-pulse" style={{animationDelay: '0.2s'}}></div>
      </div>
    </div>
  </div>
);

const AnalyzingFeedbackSkeleton = () => (
  <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/50 relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-50/30 to-transparent opacity-50"></div>
    
    <div className="relative z-10 space-y-6">
      <div className="space-y-3">
        <div className="h-5 bg-gradient-to-r from-blue-200 to-indigo-200 rounded w-24 animate-pulse"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-full animate-pulse"></div>
          <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-4/5 animate-pulse" style={{animationDelay: '0.05s'}}></div>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="h-5 bg-gradient-to-r from-green-200 to-emerald-200 rounded w-20 animate-pulse" style={{animationDelay: '0.1s'}}></div>
        <div className="space-y-2">
          <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-full animate-pulse" style={{animationDelay: '0.15s'}}></div>
          <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-3/4 animate-pulse" style={{animationDelay: '0.2s'}}></div>
          <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-4/5 animate-pulse" style={{animationDelay: '0.25s'}}></div>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="h-5 bg-gradient-to-r from-purple-200 to-pink-200 rounded w-28 animate-pulse" style={{animationDelay: '0.2s'}}></div>
        <div className="space-y-2">
          <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-full animate-pulse" style={{animationDelay: '0.3s'}}></div>
          <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-5/6 animate-pulse" style={{animationDelay: '0.35s'}}></div>
          <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-3/5 animate-pulse" style={{animationDelay: '0.4s'}}></div>
        </div>
      </div>
      
      <div className="flex gap-3 pt-4">
        <div className="h-10 bg-gradient-to-r from-purple-200 to-pink-200 rounded-lg w-32 animate-pulse"></div>
        <div className="h-10 bg-gradient-to-r from-purple-200 to-pink-200 rounded-lg w-28 animate-pulse" style={{animationDelay: '0.1s'}}></div>
      </div>
    </div>
  </div>
);

export default function SectionQuestionsPage() {
  const params = useParams() as unknown as PerformancePageParams;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, loading: authLoading } = useSupabaseAuth();
  
  // State variables
  const [question, setQuestion] = useState<Question | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sectionInfo, setSectionInfo] = useState<SectionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [sectionInfoLoading, setSectionInfoLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeTaken, setTimeTaken] = useState<number>(0);
  const [shouldStopTimer, setShouldStopTimer] = useState(false);
  const [showUpgradeButton, setShowUpgradeButton] = useState(false);
  const [showTokenWarning, setShowTokenWarning] = useState(false);
  const [tokenWarningAllowClose, setTokenWarningAllowClose] = useState(true);
  const [errorDisplayMode, setErrorDisplayMode] = useState<'none' | 'token-warning' | 'error-message'>('none');
  const [showLimitPage, setShowLimitPage] = useState(false);
  const [userTokenStatus, setUserTokenStatus] = useState<any>(null);

  // ✅ FIXED: Simplified question loading state
  const [isUsingPrefetch, setIsUsingPrefetch] = useState(false);
  const [isLoadingSpecificQuestion, setIsLoadingSpecificQuestion] = useState(false);
  const [timerResetTrigger, setTimerResetTrigger] = useState(0);
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);

  // Prefetch system state
  const [prefetchedQuestion, setPrefetchedQuestion] = useState<PrefetchedQuestion | null>(null);
  const [isPrefetching, setIsPrefetching] = useState(false);
  const [prefetchError, setPrefetchError] = useState<string | null>(null);
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const PREFETCH_VALIDITY_TIME = 15 * 60 * 1000; // 15 minutes
  
  // ✅ FIXED: Simplified section number extraction with useMemo
  const sectionNumber = useMemo(() => {
    if (params.sectionNumber && params.sectionNumber !== 'undefined') {
      return params.sectionNumber.toString();
    }
    return '';
  }, [params.sectionNumber]);

  const chapterNumber = useMemo(() => {
    return params.chapter?.replace('chapter-', '') || '';
  }, [params.chapter]);

  const stopTimerImmediately = useCallback(() => {
    console.log('Stopping timer immediately from button click');
    setShouldStopTimer(true);
  }, []);

  const resetTimer = useCallback(() => {
    console.log('Resetting timer');
    setTimerResetTrigger(prev => prev + 1);
    setShouldStopTimer(false);
  }, []);
  
  // Prefetch next section question in background
  const prefetchNextQuestion = useCallback(async () => {
    if (isPrefetching || isLoadingSpecificQuestion || 
        (prefetchedQuestion?.isValid && Date.now() - prefetchedQuestion.timestamp < PREFETCH_VALIDITY_TIME)) {
      return;
    }
    
    console.log('🔄 Starting background prefetch of next section question...');
    setIsPrefetching(true);
    setPrefetchError(null);
    
    try {
      const actionCheck = userTokenService.canPerformAction('fetch_question');
      if (!actionCheck.allowed) {
        console.log('❌ Prefetch blocked - insufficient tokens:', actionCheck.reason);
        setPrefetchError(actionCheck.reason || 'Token limit reached');
        setPrefetchedQuestion(null);
        return;
      }

      const { headers, isAuthorized } = await getAuthHeaders();
      if (!isAuthorized) {
        console.log('❌ Prefetch blocked - not authorized');
        return;
      }

      const url = `${API_URL}/api/questions/${params.board}/${params.class}/${params.subject}/${chapterNumber}/section/${sectionNumber}/random`;
      const response = await fetch(url, { headers });

      if (!response.ok) {
        if (response.status === 402) {
          console.log('🚫 Prefetch: Server says limit reached');
          setPrefetchError('Daily limit reached');
          setPrefetchedQuestion(null);
          return;
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
          console.log('🚫 Prefetch: Token limit error detected');
          setPrefetchError('Token limit reached');
          setPrefetchedQuestion(null);
          return;
        }
        
        throw new Error('Failed to prefetch question');
      }

      const data = await response.json();
      
      setPrefetchedQuestion({
        question: data,
        timestamp: Date.now(),
        isValid: true
      });
      
      console.log('✅ Section question prefetched successfully:', data.id);
      
    } catch (error) {
      console.error('❌ Prefetch error:', error);
      setPrefetchError(error instanceof Error ? error.message : 'Prefetch failed');
      setPrefetchedQuestion(null);
    } finally {
      setIsPrefetching(false);
    }
  }, [API_URL, params.board, params.class, params.subject, chapterNumber, sectionNumber, isPrefetching, prefetchedQuestion, isLoadingSpecificQuestion]);

  // ✅ FIXED: Consolidated question loading function
  const loadQuestion = useCallback(async (
    specificQuestionId?: string,
    source: 'url' | 'random' | 'prefetch' = 'random'
  ) => {
    console.log(`🔄 Loading section question: ${specificQuestionId || 'random'} from ${source}`);
    
    // Check if we already have this question loaded
    if (specificQuestionId && question?.id === specificQuestionId) {
      console.log('✅ Question already loaded:', specificQuestionId);
      return question;
    }

    if (source === 'url' && specificQuestionId) {
      setIsLoadingSpecificQuestion(true);
      setCurrentQuestionId(specificQuestionId);
    }

    try {
      setError(null);
      setQuestionLoading(true);
      setErrorDisplayMode('none');

      if (!specificQuestionId && source === 'random') {
        const actionCheck = userTokenService.canPerformAction('fetch_question');
        if (!actionCheck.allowed) {
          console.log('❌ Random question fetch blocked:', actionCheck.reason);
          setShowLimitPage(true);
          return undefined;
        }
      }

      const { headers, isAuthorized } = await getAuthHeaders();
      if (!isAuthorized) {
        router.push('/login');
        return;
      }

      let url;
      if (specificQuestionId) {
        url = `${API_URL}/api/questions/${params.board}/${params.class}/${params.subject}/${chapterNumber}/section/${sectionNumber}/q/${specificQuestionId}`;
        console.log('🔗 Fetching specific section question URL:', url);
      } else {
        url = `${API_URL}/api/questions/${params.board}/${params.class}/${params.subject}/${chapterNumber}/section/${sectionNumber}/random`;
        console.log('🎲 Fetching random section question URL:', url);
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        if (response.status === 402) {
          console.log('🚫 Server says limit reached');
          setShowLimitPage(true);
          return undefined;
        }
        
        if (response.status === 404 && specificQuestionId) {
          console.log('❌ Specific question not found, trying random question');
          return await loadQuestion(undefined, 'random');
        }
        
        const responseText = await response.text();
        console.error('❌ API Error:', response.status, responseText);
        
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
          return undefined;
        }
        
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }

      const data = await response.json();
      console.log('✅ Section question loaded successfully:', data.id);
      setQuestion(data);
      setCurrentQuestionId(data.id);
      
      if (!specificQuestionId && source === 'random') {
        userTokenService.updateTokenUsage({ input: 50 });
      }
      
      return data;
    } catch (err) {
      console.error('💥 Error loading section question:', err);
      
      if (!showLimitPage) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setErrorDisplayMode('error-message');
      }
      return undefined;
    } finally {
      setQuestionLoading(false);
      if (source === 'url') {
        setIsLoadingSpecificQuestion(false);
      }
    }
  }, [API_URL, params.board, params.class, params.subject, chapterNumber, sectionNumber, question, router, showLimitPage]);

  // Handle next question with prefetch logic
  const handleNextQuestion = useCallback(async () => {
    console.log('🔄 Next section question requested');
    
    setFeedback(null);
    setShouldStopTimer(false);
    setErrorDisplayMode('none');
    setShowTokenWarning(false);
    
    if (prefetchedQuestion?.isValid && 
        Date.now() - prefetchedQuestion.timestamp < PREFETCH_VALIDITY_TIME) {
      
      console.log('✅ Using prefetched section question:', prefetchedQuestion.question.id);
      
      setIsUsingPrefetch(true);
      setQuestion(prefetchedQuestion.question);
      setCurrentQuestionId(prefetchedQuestion.question.id);
      resetTimer();
      
      const newUrl = `/${params.board}/${params.class}/${params.subject}/${params.chapter}/${sectionNumber}/questions?q=${prefetchedQuestion.question.id}`;
      window.history.replaceState({}, '', newUrl);
      
      userTokenService.updateTokenUsage({ input: 50 });
      setPrefetchedQuestion(null);
      
      setTimeout(() => {
        setIsUsingPrefetch(false);
      }, 100);
      
      setTimeout(() => prefetchNextQuestion(), 1000);
      return;
    }
    
    if (prefetchError) {
      console.log('🚫 No prefetch available due to error:', prefetchError);
      
      if (prefetchError.includes('limit') || prefetchError.includes('token')) {
        setShowLimitPage(true);
        return;
      }
    }
    
    console.log('⚠️ Fallback: No prefetch available, loading section question normally...');
    
    setQuestion(null);
    setCurrentQuestionId(null);
    
    const newQuestion = await loadQuestion(undefined, 'random');
    
    if (newQuestion) {
      const newUrl = `/${params.board}/${params.class}/${params.subject}/${params.chapter}/${sectionNumber}/questions?q=${newQuestion.id}`;
      window.history.replaceState({}, '', newUrl);
      
      setTimeout(() => prefetchNextQuestion(), 1000);
    }
  }, [prefetchedQuestion, prefetchError, prefetchNextQuestion, params, loadQuestion, sectionNumber, resetTimer]);

  // Handle submit answer
  const handleSubmitAnswer = async (answer: string, imageData?: string) => {
    try {
      if (!profile) {
        router.push('/login');
        return;
      }

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
      
      console.log('✅ Section answer submitted and graded successfully, updating token usage');
      userTokenService.updateTokenUsage({ 
        input: 40, 
        output: 100, 
        questionSubmitted: true
      });
      
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
      console.error('Error submitting section answer:', err);
      if (!showLimitPage) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setErrorDisplayMode('error-message');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
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

  // Auto-prefetch when current question loads
  useEffect(() => {
    if (question && !questionLoading && !showLimitPage && !isLoadingSpecificQuestion) {
      console.log('🎯 Current section question loaded, starting prefetch timer...');
      
      const prefetchTimer = setTimeout(() => {
        prefetchNextQuestion();
      }, 2000);
      
      return () => clearTimeout(prefetchTimer);
    }
  }, [question, questionLoading, showLimitPage, isLoadingSpecificQuestion, prefetchNextQuestion]);
  
  // Cleanup prefetch on unmount
  useEffect(() => {
    return () => {
      setPrefetchedQuestion(null);
      setPrefetchError(null);
    };
  }, []);

  // Token status monitoring
  useEffect(() => {
    console.log('🔍 Monitoring token status...');
    
    const checkInitialTokenStatus = () => {
      const status = userTokenService.getTokenStatus();
      console.log('📊 Initial token status:', status);
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

    const unsubscribe = userTokenService.onTokenUpdate((newStatus: any) => {
      console.log('📊 Token status updated:', newStatus);
      setUserTokenStatus(newStatus);
      
      if (newStatus && newStatus.limit_reached && newStatus.questions_used_today > 0) {
        console.log('🚫 Confirmed token limit reached via update');
        setShowLimitPage(true);
        setPrefetchedQuestion(null);
        setPrefetchError('Daily limit reached');
      }
    });

    const limitReached = checkInitialTokenStatus();
    console.log('📊 Token limit check result:', limitReached);

    return unsubscribe;
  }, []);
  
  // Additional token status check
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

  // ✅ FIXED: Main initialization useEffect with simplified dependencies
  useEffect(() => {
    const initializePage = async () => {
      console.log('🚀 Starting section page initialization...');
      
      if (authLoading) {
        console.log('⏳ Auth still loading, waiting...');
        return;
      }
      
      if (!profile) {
        console.log('❌ No profile found, redirecting to login');
        router.push('/login');
        return;
      }

      if (searchParams?.get('token_limit') === 'true' || searchParams?.get('usage_limit') === 'true') {
        console.log('🚫 Token limit flag in URL detected');
        setError("You've reached your daily usage limit. Please upgrade or try again tomorrow.");
        setShowUpgradeButton(true);
        setShowTokenWarning(true);
        setErrorDisplayMode('token-warning');
        setLoading(false);
        return;
      }

      if (!sectionNumber || !chapterNumber) {
        console.log('❌ Missing section or chapter number');
        setError('Invalid section or chapter number');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setErrorDisplayMode('none');

        // Sync user data
        console.log('🔄 Syncing user data...');
        const { headers, isAuthorized } = await getAuthHeaders();
        if (!isAuthorized) {
          console.log('❌ Not authorized, redirecting to login');
          router.push('/login');
          return;
        }

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
        console.log('✅ User data synced');

        // Fetch section info
        console.log('🔄 Fetching section info...');
        try {
          setSectionInfoLoading(true);
          const response = await fetch(
            `${API_URL}/api/subjects/${params.board}/${params.class}/${params.subject}/${chapterNumber}/sections`,
            { headers }
          );
          
          if (response.ok) {
            const data = await response.json();
            const section = data.sections?.find((s: any) => s.number === parseInt(sectionNumber));
            if (section) {
              setSectionInfo(section);
            }
          }
        } catch (error) {
          console.error('Error fetching section info:', error);
        } finally {
          setSectionInfoLoading(false);
        }
        
        // ✅ FIXED: Simplified question loading logic
        const questionId = searchParams?.get('q');
        console.log('🎯 Question ID from URL:', questionId);
        
        // Handle new question flag
        const isNewQuestion = searchParams?.get('newq') === '1';
        if (isNewQuestion) {
          console.log('🆕 New question flag detected, resetting feedback');
          setFeedback(null);
          setShouldStopTimer(false);
          const newUrl = `/${params.board}/${params.class}/${params.subject}/${params.chapter}/${sectionNumber}/questions?q=${questionId}`;
          window.history.replaceState({}, '', newUrl);
        }
        
        if (isUsingPrefetch) {
          console.log('📌 Skipping fetch - using prefetched section question');
          setLoading(false);
          return;
        }

        // ✅ FIXED: Simplified condition - only skip if we have the exact question loaded
        if (questionId && currentQuestionId === questionId && question?.id === questionId) {
          console.log('📌 Section question already loaded, skipping fetch');
          setLoading(false);
          return;
        }

        console.log('🔄 Loading question...');
        setShouldStopTimer(false);

        const newQuestion = await loadQuestion(questionId || undefined, questionId ? 'url' : 'random');
        
        if (!questionId && newQuestion?.id) {
          const newUrl = `/${params.board}/${params.class}/${params.subject}/${params.chapter}/${sectionNumber}/questions?q=${newQuestion.id}`;
          window.history.replaceState({}, '', newUrl);
          console.log('📝 Updated URL with question ID:', newQuestion.id);
        }

        userTokenService.fetchUserTokenStatus();

      } catch (error) {
        console.error('💥 Error in page initialization:', error);
        setError(error instanceof Error ? error.message : 'Failed to initialize page');
        setErrorDisplayMode('error-message');
      } finally {
        setLoading(false);
      }
    };

    if (!showLimitPage && params.board && params.class && params.subject && params.chapter && params.sectionNumber) {
      initializePage();
    }
  }, [
    // ✅ FIXED: Reduced dependencies to essential ones only
    params.board, 
    params.class, 
    params.subject, 
    params.chapter, 
    params.sectionNumber,
    profile?.id, // Use profile.id instead of entire profile object
    authLoading,
    showLimitPage,
    sectionNumber,
    chapterNumber
    // Removed: isUsingPrefetch, question?.id, currentQuestionId, searchParams
    // These are accessed inside the effect instead
  ]);
  
  // Loading screen (same as before)
  if (loading && !showLimitPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center relative">
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
            <p className="text-gray-600 animate-pulse">Loading section questions...</p>
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
          router.push(`/${params.board}/${params.class}/${params.subject}/${params.chapter}/${sectionNumber}/content`);
        }}
        showStats={true}
      />
    );
  }

  // ✅ MAIN RENDER (rest of the component remains the same but with fixed state management)
  const displayChapter = typeof params.chapter === 'string'
    ? params.chapter.replace(/^chapter-/, '')
    : '';

  return (
    <>
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
            {/* Header */}
            <div className="flex justify-between mb-6">
              <div className="flex flex-col">
                <h1 className="text-xl sm:text-2xl font-medium mb-2 text-gray-800">
                  {params.subject ? formatSubjectName(params.subject) : ''} - Chapter {displayChapter}, Section {sectionNumber}
                  {sectionInfoLoading ? (
                    <div className="inline-block ml-2">
                      <div className="h-6 w-32 sm:w-48 bg-gradient-to-r from-red-200 to-orange-200 rounded animate-pulse inline-block"></div>
                    </div>
                  ) : sectionInfo && (
                    <span className="ml-2 text-gray-600">
                      : {sectionInfo.name}
                    </span>
                  )}
                </h1>
                
                <p className="text-sm text-gray-600 mb-2">
                  {params.board?.toUpperCase()} Class {params.class?.toUpperCase()} • Section Questions
                </p>
                
                {/* Timer */}
                {questionLoading && !question ? (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 backdrop-blur-sm rounded-lg px-4 py-2 shadow-sm border border-blue-200/50 w-fit">
                    <div className="h-6 w-16 bg-gradient-to-r from-blue-200 to-indigo-200 rounded animate-pulse"></div>
                  </div>
                ) : question && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 backdrop-blur-sm rounded-lg px-4 py-2 shadow-sm border border-blue-200/50 w-fit relative overflow-hidden timer-active">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-100/0 via-blue-100/30 to-blue-100/0 shimmer-effect"></div>
                    <div className="relative flex items-center gap-2 text-blue-700 font-medium">
                      <svg className="w-4 h-4 clock-icon" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      <QuestionTimer 
                        onTimeUpdate={setTimeTaken}
                        shouldStop={shouldStopTimer}
                        resetTrigger={timerResetTrigger}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation - Simplified to match exercise page layout */}
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

            {/* Main content area with enhanced skeletons */}
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="w-full lg:w-1/2">
                {/* Question section */}
                {questionLoading && !question ? (
                  <div className="space-y-6">
                    {/* Enhanced Question Card Skeleton */}
                    <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-sm p-4 sm:p-6 min-h-[200px] animate-pulse border border-white/50 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-50/30 to-transparent opacity-50"></div>
                      
                      <div className="relative z-10">
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full w-16 animate-pulse"></div>
                          <div className="h-5 bg-gradient-to-r from-orange-200 to-yellow-200 rounded-full w-20 animate-pulse" style={{animationDelay: '0.1s'}}></div>
                          <div className="h-5 bg-gradient-to-r from-blue-200 to-indigo-200 rounded-full w-24 animate-pulse" style={{animationDelay: '0.2s'}}></div>
                        </div>
                        
                        <div className="flex items-center gap-3 py-2 mb-4">
                          <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-32 animate-pulse"></div>
                          <div className="h-5 bg-gradient-to-r from-green-200 to-emerald-200 rounded w-24 animate-pulse" style={{animationDelay: '0.2s'}}></div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-full animate-pulse"></div>
                          <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-full animate-pulse" style={{animationDelay: '0.1s'}}></div>
                          <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-3/4 animate-pulse" style={{animationDelay: '0.2s'}}></div>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Answer Form Skeleton */}
                    <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-sm p-4 space-y-3 border border-white/50 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-50/30 to-transparent opacity-50"></div>
                      
                      <div className="relative z-10">
                        <div className="h-24 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg w-full animate-pulse"></div>
                        
                        <div className="flex gap-2 mt-3">
                          <div className="h-10 bg-gradient-to-r from-blue-200 to-indigo-200 rounded-lg w-32 animate-pulse"></div>
                          <div className="h-10 bg-gradient-to-r from-blue-200 to-indigo-200 rounded-lg w-32 animate-pulse" style={{animationDelay: '0.1s'}}></div>
                        </div>
                        
                        <div className="h-10 bg-gradient-to-r from-blue-300 to-indigo-300 rounded-lg w-full mt-3 animate-pulse"></div>
                      </div>
                    </div>
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

                    {isSubmitting ? (
                      <SubmittingAnswerSkeleton />
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
                {/* Feedback section */}
                {isSubmitting ? (
                  <AnalyzingFeedbackSkeleton />
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
        
        <FloatingNextQuestionButton
          onNextQuestion={handleNextQuestion}
        />
        
        <SwipeToNextQuestion
          onNextQuestion={handleNextQuestion}
        />
      </div>
    </>
  );
}