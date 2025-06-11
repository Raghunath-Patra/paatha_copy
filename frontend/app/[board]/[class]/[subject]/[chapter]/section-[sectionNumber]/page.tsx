// frontend/app/[board]/[class]/[subject]/[chapter]/section-[sectionNumber]/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Navigation from '../../../../../components/navigation/Navigation';
import QuestionCard from '../../../../../components/questions/QuestionCard';
import AnswerForm from '../../../../../components/questions/AnswerForm';
import FeedbackCard from '../../../../../components/questions/FeedbackCard';
import QuestionTimer from '../../../../../components/questions/QuestionTimer';
import AllSubjectsButton from '../../../../../components/common/AllSubjectsButton';
import QuestionLimitIndicator from '../../../../../components/common/QuestionLimitIndicator';
import TokenLimitWarning from '../../../../../components/common/TokenLimitWarning';
import FloatingNextQuestionButton from '../../../../../components/questions/FloatingNextQuestionButton';
import SwipeToNextQuestion from '../../../../../components/questions/SwipeToNextQuestion';
import DailyLimitReached from '../../../../../components/limits/DailyLimitReached';
import { getAuthHeaders } from '../../../../../utils/auth';
import { useSupabaseAuth } from '../../../../../contexts/SupabaseAuthContext';
import { userTokenService } from '../../../../../utils/userTokenService';

// Interfaces (updated - removed question_count)
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
  // Removed: question_count field
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
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const PREFETCH_VALIDITY_TIME = 15 * 60 * 1000; // 15 minutes
  
  // Extract section number from params
  const sectionNumber = params.sectionNumber?.replace('section-', '') || '';
  const chapterNumber = params.chapter?.replace('chapter-', '') || '';
  
  const stopTimerImmediately = useCallback(() => {
    console.log('Stopping timer immediately from button click');
    setShouldStopTimer(true);
  }, []);

  const resetTimer = useCallback(() => {
    console.log('Resetting timer');
    setTimerResetTrigger(prev => prev + 1);
    setShouldStopTimer(false);
  }, []);
  
  // ... (keep all your existing functions: prefetchNextQuestion, handleNextQuestion, fetchQuestion, handleSubmitAnswer)
  // I'll omit them here to save space, but they remain exactly the same

  // Main initialization useEffect
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
        
        // Fetch section info from the sections endpoint
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

    // ... (rest of initializePage function remains the same)
  }, [/* dependencies remain the same */]);

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

  // ... (keep loading screen and limit page components the same)

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
            {/* Updated header for section questions - REMOVED question count */}
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
                
                {/* UPDATED: Removed question count display */}
                <p className="text-sm text-gray-600 mb-2">
                  {params.board?.toUpperCase()} Class {params.class?.toUpperCase()} • Section Questions
                </p>
                
                {/* Timer (unchanged) */}
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

              {/* Navigation (unchanged) */}
              <div className="flex flex-wrap gap-2 items-start relative z-[100]">
                <Navigation />
                <QuestionLimitIndicator />
              </div>
            </div>

            {/* Rest of the component remains the same (Token Warning, Error Message, Questions, etc.) */}
            {/* ... */}
            
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