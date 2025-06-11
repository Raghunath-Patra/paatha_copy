// frontend/app/[board]/[class]/[subject]/[chapter]/section-[sectionNumber]/questions/page.tsx
// MOVED: Section Questions Page (previously at section-[sectionNumber]/page.tsx)

'use client';

import { useState, useEffect, useCallback } from 'react';
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

// Subject mapping
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

// ✅ NEW: Questions Navigation Component
const QuestionsNavigation = ({ params }: { params: PerformancePageParams }) => {
  const router = useRouter();
  
  const handleContentClick = () => {
    router.push(`/${params.board}/${params.class}/${params.subject}/${params.chapter}/section-${params.sectionNumber}/content`);
  };

  const handlePerformanceClick = () => {
    router.push(`/${params.board}/${params.class}/${params.subject}/${params.chapter}/section-${params.sectionNumber}/performance`);
  };

  const handleBackToChapter = () => {
    router.push(`/${params.board}/${params.class}/${params.subject}/${params.chapter}`);
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {/* Back to Chapter */}
      <button
        onClick={handleBackToChapter}
        className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-lg hover:from-gray-200 hover:to-gray-300 transition-all duration-300 shadow-sm hover:shadow-md"
        title="Back to Chapter"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span className="hidden sm:inline">Chapter</span>
      </button>

      {/* Content Icon */}
      <button
        onClick={handleContentClick}
        className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-lg hover:from-green-200 hover:to-emerald-200 transition-all duration-300 shadow-sm hover:shadow-md"
        title="Learning Content"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
        </svg>
        <span className="hidden sm:inline">Learning</span>
      </button>

      {/* Questions Icon (Current Page) */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg shadow-md">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="hidden sm:inline">Questions</span>
      </div>

      {/* Performance Icon */}
      <button
        onClick={handlePerformanceClick}
        className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-lg hover:from-purple-200 hover:to-pink-200 transition-all duration-300 shadow-sm hover:shadow-md"
        title="View Performance"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span className="hidden sm:inline">Performance</span>
      </button>

      {/* Question Limit Indicator */}
      <QuestionLimitIndicator />

      {/* Main Navigation */}
      <Navigation />
    </div>
  );
};

// Skeleton components (same as before)
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

  const [isUsingPrefetch, setIsUsingPrefetch] = useState(false);
  const [timerResetTrigger, setTimerResetTrigger] = useState(0);

  // Prefetch system state
  const [prefetchedQuestion, setPrefetchedQuestion] = useState<PrefetchedQuestion | null>(null);
  const [isPrefetching, setIsPrefetching] = useState(false);
  const [prefetchError, setPrefetchError] = useState<string | null>(null);
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

  const [isUsingPrefetch, setIsUsingPrefetch] = useState(false);
  const [timerResetTrigger, setTimerResetTrigger] = useState(0);

  // Prefetch system state
  const [prefetchedQuestion, setPrefetchedQuestion] = useState<PrefetchedQuestion | null>(null);
  const [isPrefetching, setIsPrefetching] = useState(false);
  const [prefetchError, setPrefetchError] = useState<string | null>(null);
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const PREFETCH_VALIDITY_TIME = 15 * 60 * 1000; // 15 minutes
  
  // Extract section number from params
  const sectionNumber = params.sectionNumber?.replace('section-', '') || '';
  const chapterNumber = params.chapter?.replace('chapter-', '') || '';
  
  // Keep all your existing functions but add the missing ones
  const prefetchNextQuestion = useCallback(async () => {
    if (isPrefetching || (prefetchedQuestion?.isValid && 
        Date.now() - prefetchedQuestion.timestamp < PREFETCH_VALIDITY_TIME)) {
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
  }, [API_URL, params.board, params.class, params.subject, chapterNumber, sectionNumber, isPrefetching, prefetchedQuestion]);

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
      resetTimer();
      
      const newUrl = `/${params.board}/${params.class}/${params.subject}/${params.chapter}/section-${sectionNumber}/questions?q=${prefetchedQuestion.question.id}`;
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
    
    console.log('⚠️ Fallback: No prefetch available, fetching section question normally...');
    
    setQuestion(null);
    setQuestionLoading(true);
    
    try {
      const actionCheck = userTokenService.canPerformAction('fetch_question');
      if (!actionCheck.allowed) {
        console.log('❌ Question fetch blocked:', actionCheck.reason);
        setShowLimitPage(true);
        setQuestionLoading(false);
        return;
      }

      const { headers, isAuthorized } = await getAuthHeaders();
      if (!isAuthorized) {
        router.push('/login');
        return;
      }

      const url = `${API_URL}/api/questions/${params.board}/${params.class}/${params.subject}/${chapterNumber}/section/${sectionNumber}/random`;
      const response = await fetch(url, { headers });

      if (!response.ok) {
        if (response.status === 402) {
          console.log('🚫 Server says limit reached, showing limit page');
          setShowLimitPage(true);
          setQuestionLoading(false);
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
          userTokenService.updateTokenUsage({ input: 1000, output: 1000 });
          setShowLimitPage(true);
          setQuestionLoading(false);
          return;
        }
        
        throw new Error('Failed to fetch section question');
      }

      const data = await response.json();
      setQuestion(data);
      
      const newUrl = `/${params.board}/${params.class}/${params.subject}/${params.chapter}/section-${sectionNumber}/questions?q=${data.id}`;
      window.history.replaceState({}, '', newUrl);
      
      userTokenService.updateTokenUsage({ input: 50 });
      setTimeout(() => prefetchNextQuestion(), 1000);
      
    } catch (error) {
      console.error('Error in fallback fetch:', error);
      if (!showLimitPage) {
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
        setErrorDisplayMode('error-message');
      }
    } finally {
      setQuestionLoading(false);
    }
  }, [prefetchedQuestion, prefetchError, prefetchNextQuestion, params, router, API_URL, showLimitPage, sectionNumber, chapterNumber]);

  const fetchQuestion = async (specificQuestionId?: string) => {
    try {
      setError(null);
      setQuestionLoading(true);
      setErrorDisplayMode('none');

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
        url = `${API_URL}/api/questions/${params.board}/${params.class}/${params.subject}/${chapterNumber}/section/${sectionNumber}/q/${specificQuestionId}`;
      } else {
        url = `${API_URL}/api/questions/${params.board}/${params.class}/${params.subject}/${chapterNumber}/section/${sectionNumber}/random`;
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        if (response.status === 402) {
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
        
        throw new Error('Failed to fetch section question');
      }

      const data = await response.json();
      setQuestion(data);
      
      userTokenService.updateTokenUsage({ input: 50 });
      
      return data;
    } catch (err) {
      console.error('Error fetching section question:', err);
      
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
  
  const stopTimerImmediately = useCallback(() => {
    console.log('Stopping timer immediately from button click');
    setShouldStopTimer(true);
  }, []);

  const resetTimer = useCallback(() => {
    console.log('Resetting timer');
    setTimerResetTrigger(prev => prev + 1);
    setShouldStopTimer(false);
  }, []);
  
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

  // ✅ All existing useEffects and initialization logic
  useEffect(() => {
    if (question && !questionLoading && !showLimitPage) {
      console.log('🎯 Current section question loaded, starting prefetch timer...');
      
      const prefetchTimer = setTimeout(() => {
        prefetchNextQuestion();
      }, 2000);
      
      return () => clearTimeout(prefetchTimer);
    }
  }, [question, questionLoading, showLimitPage, prefetchNextQuestion]);
  
  useEffect(() => {
    return () => {
      setPrefetchedQuestion(null);
      setPrefetchError(null);
    };
  }, []);

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

    const unsubscribe = userTokenService.onTokenUpdate((newStatus: any) => {
      setUserTokenStatus(newStatus);
      
      if (newStatus && newStatus.limit_reached && newStatus.questions_used_today > 0) {
        console.log('🚫 Confirmed token limit reached via update');
        setShowLimitPage(true);
        setPrefetchedQuestion(null);
        setPrefetchError('Daily limit reached');
      }
    });

    const limitReached = checkInitialTokenStatus();
    if (limitReached) {
      return unsubscribe;
    }

    return unsubscribe;
  }, []);
  
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

    const fetchSectionInfo = async () => {
      try {
        setSectionInfoLoading(true);
        const { headers, isAuthorized } = await getAuthHeaders();
        if (!isAuthorized) return;
        
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

      if (params.board && params.class && params.subject && params.chapter && params.sectionNumber) {
        if (searchParams?.get('token_limit') === 'true' || searchParams?.get('usage_limit') === 'true') {
          setError("You've reached your daily usage limit. Please upgrade or try again tomorrow.");
          setShowUpgradeButton(true);
          setShowTokenWarning(true);
          setErrorDisplayMode('token-warning');
          setLoading(false);
          return;
        }
        
        fetchSectionInfo();
        
        const isNewQuestion = searchParams?.get('newq') === '1';
        if (isNewQuestion) {
          setFeedback(null);
          setShouldStopTimer(false);
          const newUrl = `/${params.board}/${params.class}/${params.subject}/${params.chapter}/section-${sectionNumber}/questions?q=${searchParams?.get('q')}`;
          window.history.replaceState({}, '', newUrl);
        }
        
        const questionId = searchParams?.get('q');
        if (isUsingPrefetch) {
          console.log('📌 Skipping fetch - using prefetched section question');
          setLoading(false);
          return;
        }

        if (question && question.id === questionId) {
          console.log('📌 Section question already loaded, skipping fetch');
          setLoading(false);
          return;
        }

        setShouldStopTimer(false);

        fetchQuestion(questionId || undefined).then(newQuestion => {
          if (!questionId && newQuestion?.id) {
            const newUrl = `/${params.board}/${params.class}/${params.subject}/${params.chapter}/section-${sectionNumber}/questions?q=${newQuestion.id}`;
            window.history.replaceState({}, '', newUrl);
          }
        });
      }
      
      setLoading(false);
    };

    if (!showLimitPage) {
      initializePage();
    }
  }, [params.board, params.class, params.subject, params.chapter, params.sectionNumber, router, profile, authLoading, searchParams, API_URL, showLimitPage, chapterNumber, sectionNumber]);
  
  // ✅ NOTE: Keep all existing useEffects, fetch functions, etc. 
  // Just update any URL constructions to include /questions path

  // Keep loading and error screens the same...
  
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
          router.push(`/${params.board}/${params.class}/${params.subject}/${params.chapter}/section-${sectionNumber}/content`);
        }}
        showStats={true}
      />
    );
  }

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
            {/* ✅ UPDATED: Header with new navigation */}
            <div className="flex justify-between mb-6">
              <div className="flex flex-col">
                <h1 className="text-xl sm:text-2xl font-medium mb-2 text-gray-800">
                  {params.subject ? formatSubjectName(params.subject) : ''} - Chapter {chapterNumber}, Section {sectionNumber}
                  {sectionInfoLoading ? (
                    <div className="inline-block ml-2">
                      <div className="h-6 w-32 sm:w-48 bg-gradient-to-r from-red-200 to-orange-200 rounded animate-pulse inline-block"></div>
                    </div>
                  ) : sectionInfo?.name && (
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

              {/* ✅ UPDATED: Navigation with new questions navigation */}
              <div className="flex flex-wrap gap-2 items-start relative z-[100]">
                <QuestionsNavigation params={params} />
              </div>
            </div>

            {/* Content with independent loading states - SAME AS BEFORE */}
            
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
                {questionLoading && !question ? (
                  <div className="space-y-6">
                    {/* Question Card Skeleton */}
                    <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-sm p-4 sm:p-6 min-h-[200px] animate-pulse border border-white/50 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-50/30 to-transparent opacity-50"></div>
                      
                      <div className="relative z-10">
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full w-16 animate-pulse"></div>
                          <div className="h-5 bg-gradient-to-r from-orange-200 to-yellow-200 rounded-full w-20 animate-pulse" style={{animationDelay: '0.1s'}}></div>
                          <div className="h-5 bg-gradient-to-r from-blue-200 to-indigo-200 rounded-full w-24 animate-pulse" style={{animationDelay: '0.2s'}}></div>
                          <div className="h-5 bg-gradient-to-r from-purple-200 to-pink-200 rounded-full w-16 animate-pulse" style={{animationDelay: '0.3s'}}></div>
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

                    {/* Answer Form Skeleton */}
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