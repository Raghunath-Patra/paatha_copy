// frontend/app/[board]/[class]/[subject]/[chapter]/performance/page.tsx - COMPLETE FILE
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navigation from '../../../../../components/navigation/Navigation';
import { getAuthHeaders } from '../../../../../utils/auth';
import { useSupabaseAuth } from '../../../../../contexts/SupabaseAuthContext';
import PerformanceAnalytics from '../../../../../components/performance/PerformanceAnalytics';

// ✅ NEW: Lightweight analytics data types
interface AnalyticsDataPoint {
  attempt_number: number;
  score: number;
  time_taken: number;
  timestamp: string;
  difficulty: string;
  type: string;
  bloom_level: string;
  category: string;
}

interface CategoryPerformance {
  [category: string]: {
    total_attempts: number;
    average_score: number;
    best_score: number;
  };
}

interface PerformanceAnalyticsData {
  analytics_data: AnalyticsDataPoint[];
  score_trends: Array<{attempt: number; score: number; date: string}>;
  category_performance: CategoryPerformance;
  difficulty_breakdown: any;
  time_performance: Array<{time_taken: number; score: number; category: string}>;
}

// ✅ EXISTING: Types for detailed questions data
interface QuestionMetadata {
  questionNumber: string;
  source: string;
  level: string;
  type: string;
  bloomLevel: string;
  statistics: {
    totalAttempts: number;
    averageScore: number;
  };
}

interface DetailedAttempt {
  question_id: string;
  question_text: string;
  user_answer: string;
  transcribed_text?: string;
  correct_answer: string;
  explanation: string;
  score: number;
  time_taken: number;
  timestamp: string;
  feedback: string;
  metadata: QuestionMetadata;
}

interface PerformanceSummary {
  total_attempts: number;
  average_score: number;
  total_time: number;
  unique_questions: number;
  performance_breakdown: {
    excellent: number;
    good: number;
    needs_improvement: number;
  };
  date_range: {
    first_attempt: string | null;
    last_attempt: string | null;
  };
  chapter_info: {
    board: string;
    class_level: string;
    subject: string;
    chapter: string;
  };
}

interface SolvedQuestionsResponse {
  attempts: DetailedAttempt[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
    next_offset: number | null;
  };
  chapter_info: {
    board: string;
    class_level: string;
    subject: string;
    chapter: string;
  };
}

interface PerformancePageParams {
  board: string;
  class: string;
  subject: string;
  chapter: string;
}

// ✅ Skeleton Components for Independent Loading
const PerformanceSummarySkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-50/30 to-transparent opacity-50"></div>
        <div className="relative z-10">
          <div className="h-4 bg-gradient-to-r from-blue-200 to-purple-200 rounded w-24 animate-pulse mb-2" 
               style={{ animationDelay: `${i * 100}ms` }}></div>
          <div className="h-8 bg-gradient-to-r from-red-200 to-orange-200 rounded w-16 animate-pulse" 
               style={{ animationDelay: `${i * 150}ms` }}></div>
        </div>
      </div>
    ))}
  </div>
);

const AnalyticsSkeleton = () => (
  <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/50 relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-50/30 to-transparent opacity-50"></div>
    <div className="relative z-10 space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance Analytics</h3>
      <div className="h-64 bg-gradient-to-r from-orange-200 to-yellow-200 rounded-lg animate-pulse"></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-48 bg-gradient-to-r from-blue-200 to-indigo-200 rounded-lg animate-pulse"></div>
        <div className="h-48 bg-gradient-to-r from-green-200 to-emerald-200 rounded-lg animate-pulse"></div>
      </div>
    </div>
  </div>
);

const QuestionsSkeleton = () => (
  <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 divide-y divide-orange-100 relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-50/30 to-transparent opacity-50"></div>
    <div className="relative z-10">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Question Attempts</h3>
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-6 space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-3">
                <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-32 animate-pulse" 
                     style={{ animationDelay: `${i * 100}ms` }}></div>
                <div className="h-6 bg-gradient-to-r from-green-200 to-emerald-200 rounded-full w-12 animate-pulse" 
                     style={{ animationDelay: `${i * 150}ms` }}></div>
                <div className="h-5 bg-gradient-to-r from-orange-200 to-yellow-200 rounded-full w-16 animate-pulse" 
                     style={{ animationDelay: `${i * 200}ms` }}></div>
              </div>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="h-5 bg-gradient-to-r from-blue-200 to-purple-200 rounded-full w-16 animate-pulse" 
                       style={{ animationDelay: `${(i * 4 + j) * 50}ms` }}></div>
                ))}
              </div>
            </div>
            {/* Expand button skeleton */}
            <div className="h-8 bg-gradient-to-r from-orange-200 to-yellow-200 rounded-lg w-24 animate-pulse ml-4" 
                 style={{ animationDelay: `${i * 250}ms` }}></div>
          </div>
          
          {/* Question text skeleton */}
          <div className="space-y-2">
            <div className="h-6 bg-gradient-to-r from-red-200 to-orange-200 rounded w-full animate-pulse" 
                 style={{ animationDelay: `${i * 300}ms` }}></div>
            <div className="h-4 bg-gradient-to-r from-red-200 to-orange-200 rounded w-3/4 animate-pulse" 
                 style={{ animationDelay: `${i * 350}ms` }}></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default function ChapterPerformanceReport() {
  const params = useParams() as unknown as PerformancePageParams;
  const router = useRouter();
  const { profile, loading: authLoading } = useSupabaseAuth();
  
  // ✅ Split state for all three data sources
  const [performanceSummary, setPerformanceSummary] = useState<PerformanceSummary | null>(null);
  const [analyticsData, setAnalyticsData] = useState<PerformanceAnalyticsData | null>(null);
  const [solvedQuestions, setSolvedQuestions] = useState<DetailedAttempt[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  
  // ✅ Independent loading states
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // ✅ Error handling
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [questionsError, setQuestionsError] = useState<string | null>(null);
  
  // ✅ UI state
  const [chapterName, setChapterName] = useState('');
  const [chapterNameLoading, setChapterNameLoading] = useState(true);
  
  // ✅ NEW: Expandable questions state
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  
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

  // ✅ Fetch performance summary (fastest call - ~200ms)
  const fetchPerformanceSummary = useCallback(async () => {
    try {
      const { headers, isAuthorized } = await getAuthHeaders();
      if (!isAuthorized) return false;

      const chapterNum = typeof params.chapter === 'string' 
        ? params.chapter.replace(/^chapter-/, '')
        : '';
      
      setSummaryLoading(true);
      setSummaryError(null);
      
      const response = await fetch(
        `${API_URL}/api/progress/user/performance-summary/${params.board}/${params.class}/${params.subject}/${chapterNum}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch performance summary: ${response.status}`);
      }

      const data = await response.json();
      setPerformanceSummary(data);
      return true;
    } catch (err) {
      console.error('Error fetching performance summary:', err);
      setSummaryError(err instanceof Error ? err.message : 'Failed to fetch performance summary');
      return false;
    } finally {
      setSummaryLoading(false);
    }
  }, [params, API_URL]);

  // ✅ Fetch analytics data (medium speed - ~400ms) 
  const fetchAnalyticsData = useCallback(async () => {
    try {
      const { headers, isAuthorized } = await getAuthHeaders();
      if (!isAuthorized) return false;

      const chapterNum = typeof params.chapter === 'string' 
        ? params.chapter.replace(/^chapter-/, '')
        : '';
      
      setAnalyticsLoading(true);
      setAnalyticsError(null);
      
      const response = await fetch(
        `${API_URL}/api/progress/user/performance-analytics/${params.board}/${params.class}/${params.subject}/${chapterNum}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch analytics data: ${response.status}`);
      }

      const data = await response.json();
      setAnalyticsData(data);
      return true;
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setAnalyticsError(err instanceof Error ? err.message : 'Failed to fetch analytics data');
      return false;
    } finally {
      setAnalyticsLoading(false);
    }
  }, [params, API_URL]);

  // ✅ Fetch solved questions (slowest call - 1-3s)
  const fetchSolvedQuestions = useCallback(async (offset = 0, append = false) => {
    try {
      const { headers, isAuthorized } = await getAuthHeaders();
      if (!isAuthorized) return false;

      const chapterNum = typeof params.chapter === 'string' 
        ? params.chapter.replace(/^chapter-/, '')
        : '';
      
      if (!append) {
        setQuestionsLoading(true);
        setQuestionsError(null);
      } else {
        setLoadingMore(true);
      }

      const response = await fetch(
        `${API_URL}/api/progress/user/solved-questions/${params.board}/${params.class}/${params.subject}/${chapterNum}?limit=20&offset=${offset}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch solved questions: ${response.status}`);
      }

      const data: SolvedQuestionsResponse = await response.json();
      
      if (append) {
        setSolvedQuestions(prev => [...prev, ...data.attempts]);
      } else {
        setSolvedQuestions(data.attempts);
      }
      
      setPagination(data.pagination);
      return true;
    } catch (err) {
      console.error('Error fetching solved questions:', err);
      if (!append) {
        setQuestionsError(err instanceof Error ? err.message : 'Failed to fetch solved questions');
      }
      return false;
    } finally {
      if (!append) {
        setQuestionsLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  }, [params, API_URL]);

  // ✅ Fetch chapter name
  const fetchChapterName = useCallback(async () => {
    try {
      const { headers, isAuthorized } = await getAuthHeaders();
      if (!isAuthorized) return;

      const chaptersResponse = await fetch(
        `${API_URL}/api/subjects/${params.board}/${params.class}/${params.subject}/chapters`,
        { headers }
      );
      
      if (chaptersResponse.ok) {
        const chaptersData = await chaptersResponse.json();
        const chapterNum = typeof params.chapter === 'string' 
          ? params.chapter.replace(/^chapter-/, '')
          : '';
        const chapterInfo = chaptersData.chapters.find(
          (ch: any) => ch.number === parseInt(chapterNum || '0')
        );
        if (chapterInfo) {
          setChapterName(chapterInfo.name);
        }
      }
    } catch (err) {
      console.error('Error fetching chapter name:', err);
    } finally {
      setChapterNameLoading(false);
    }
  }, [params, API_URL]);

  // ✅ Main effect - Optimized parallel loading
  useEffect(() => {
    const loadData = async () => {
      if (authLoading) return;
      if (!profile) {
        console.log('No profile, redirecting to login');
        router.push('/login');
        return;
      }

      const synced = await syncUserData();
      if (!synced) {
        console.error('Failed to sync user data');
        return;
      }

      // ✅ Load critical data first (summary + analytics), questions last
      console.log('Starting parallel data loading...');
      
      const [summarySuccess, analyticsSuccess] = await Promise.all([
        fetchPerformanceSummary(),    // Fast - shows stats immediately
        fetchAnalyticsData(),         // Medium - for charts
        fetchChapterName()            // Fast - for title
      ]);

      console.log(`Summary: ${summarySuccess}, Analytics: ${analyticsSuccess}`);

      // ✅ Load questions after critical data (can be slow)
      fetchSolvedQuestions();
    };

    if (params.board && params.class && params.subject && params.chapter) {
      loadData();
    }
  }, [params, router, profile, authLoading, fetchPerformanceSummary, fetchAnalyticsData, fetchSolvedQuestions, fetchChapterName]);

  // ✅ Load more questions handler
  const loadMoreQuestions = () => {
    if (pagination?.has_more && !loadingMore) {
      fetchSolvedQuestions(pagination.next_offset, true);
    }
  };

  // ✅ Utility functions
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'bg-green-50 text-green-800 border-green-200';
    if (score >= 6) return 'bg-yellow-50 text-yellow-800 border-yellow-200';
    return 'bg-red-50 text-red-800 border-red-200';
  };

  // ✅ NEW: Toggle question expansion
  const toggleQuestionExpansion = (questionKey: string) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionKey)) {
        newSet.delete(questionKey);
      } else {
        newSet.add(questionKey);
      }
      return newSet;
    });
  };

  // ✅ NEW: Expand/Collapse all questions
  const toggleAllQuestions = () => {
    if (expandedQuestions.size === solvedQuestions.length) {
      // All expanded, collapse all
      setExpandedQuestions(new Set());
    } else {
      // Some or none expanded, expand all
      const allKeys = solvedQuestions.map(attempt => `${attempt.question_id}-${attempt.timestamp}`);
      setExpandedQuestions(new Set(allKeys));
    }
  };

  // ✅ Error handling - only show error if ALL critical data fails
  const hasAnyData = performanceSummary || analyticsData || solvedQuestions.length > 0;
  const hasAllErrors = summaryError && analyticsError && questionsError;
  
  if (hasAllErrors && !hasAnyData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center relative">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-red-200/30 rounded-full animate-pulse" 
               style={{animationDuration: '3s'}} />
          <div className="absolute bottom-1/4 right-1/4 w-16 h-16 bg-yellow-200/25 rounded-full animate-bounce" 
               style={{animationDuration: '4s'}} />
        </div>
        
        <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg max-w-md text-center border border-red-200 relative z-10">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="font-semibold text-red-800 mb-2">Error Loading Report</h3>
          <p className="text-red-700 mb-4">
            {summaryError || analyticsError || questionsError}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg hover:from-red-600 hover:to-orange-600 transition-all duration-300 shadow-md"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const displayChapter = typeof params.chapter === 'string'
    ? params.chapter.replace(/^chapter-/, '')
    : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 relative">
      {/* ✅ Animated background decorations - ALWAYS VISIBLE */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-4 -right-4 w-16 h-16 sm:w-24 sm:h-24 bg-red-200/30 rounded-full animate-pulse" 
             style={{animationDuration: '3s'}} />
        <div className="absolute bottom-1/4 right-1/4 w-12 h-12 sm:w-16 sm:h-16 bg-yellow-200/25 rounded-full animate-bounce" 
             style={{animationDuration: '4s'}} />
        <div className="absolute top-1/2 left-1/4 w-8 h-8 sm:w-12 sm:h-12 bg-orange-200/20 rounded-full animate-ping" 
             style={{animationDuration: '2s'}} />
      </div>

      <div className="container-fluid px-4 sm:px-8 py-4 sm:py-6 relative z-10">
        <div className="max-w-[1600px] mx-auto">
          {/* ✅ Header - ALWAYS VISIBLE */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-medium mb-2 text-gray-800">
                Chapter {displayChapter} Performance Report
                {chapterNameLoading ? (
                  <span className="ml-2">
                    <span className="inline-block h-6 w-32 sm:w-48 bg-gradient-to-r from-red-200 to-orange-200 rounded animate-pulse"></span>
                  </span>
                ) : chapterName && (
                  <span className="ml-2 text-orange-600">
                    : {chapterName}
                  </span>
                )}
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                {params.board?.toUpperCase()} Class {params.class?.toUpperCase()}
              </p>
            </div>
            <div className="flex gap-4 items-center relative z-[100]">
              <Navigation />
            </div>
          </div>

          {/* ✅ Content with independent loading states */}
          <div className="space-y-6">
            {/* ✅ Performance Summary Section */}
            {summaryLoading ? (
              <PerformanceSummarySkeleton />
            ) : summaryError ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                <p className="text-red-700">Failed to load performance summary</p>
                <button 
                  onClick={fetchPerformanceSummary}
                  className="mt-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : performanceSummary && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/50 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 to-indigo-50/30 opacity-50"></div>
                  <div className="relative z-10">
                    <h3 className="text-sm font-medium text-blue-600 mb-1 flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                      Total Attempts
                    </h3>
                    <p className="text-3xl font-bold text-blue-900">{performanceSummary.total_attempts}</p>
                  </div>
                </div>

                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/50 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-50/30 to-emerald-50/30 opacity-50"></div>
                  <div className="relative z-10">
                    <h3 className="text-sm font-medium text-green-600 mb-1 flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                      Average Score
                    </h3>
                    <p className="text-3xl font-bold text-green-900">{performanceSummary.average_score}/10</p>
                  </div>
                </div>

                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/50 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-50/30 to-pink-50/30 opacity-50"></div>
                  <div className="relative z-10">
                    <h3 className="text-sm font-medium text-purple-600 mb-1 flex items-center gap-2">
                      <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                      Total Time Spent
                    </h3>
                    <p className="text-3xl font-bold text-purple-900">{formatTime(performanceSummary.total_time)}</p>
                  </div>
                </div>

                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/50 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-50/30 to-yellow-50/30 opacity-50"></div>
                  <div className="relative z-10">
                    <h3 className="text-sm font-medium text-orange-600 mb-1 flex items-center gap-2">
                      <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                      Unique Questions
                    </h3>
                    <p className="text-3xl font-bold text-orange-900">{performanceSummary.unique_questions}</p>
                  </div>
                </div>
              </div>
            )}

            {/* ✅ Analytics Section - Independent loading */}
            {analyticsLoading ? (
              <AnalyticsSkeleton />
            ) : analyticsError ? (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
                <p className="text-orange-700">Failed to load analytics data</p>
                <button 
                  onClick={fetchAnalyticsData}
                  className="mt-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : analyticsData && analyticsData.analytics_data.length > 0 ? (
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-50/20 to-transparent opacity-50"></div>
                <div className="relative z-10">
                  <PerformanceAnalytics analyticsData={analyticsData} />
                </div>
              </div>
            ) : !analyticsLoading && (
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/50 text-center">
                <p className="text-gray-600">Not enough data for analytics visualization</p>
              </div>
            )}

            {/* ✅ Questions Section - Loads last */}
            {questionsLoading ? (
              <QuestionsSkeleton />
            ) : questionsError ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
                <p className="text-yellow-700">Failed to load question details</p>
                <button 
                  onClick={() => fetchSolvedQuestions()}
                  className="mt-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg divide-y divide-orange-100 border border-white/50 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-50/20 to-transparent opacity-30"></div>
                
                <div className="relative z-10">
                  {/* Section header */}
                  <div className="p-6 pb-0 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-800">Question Attempts</h3>
                    <div className="flex items-center gap-3">
                      {/* ✅ NEW: Expand/Collapse All Button */}
                      {solvedQuestions.length > 0 && (
                        <button
                          onClick={toggleAllQuestions}
                          className="px-3 py-1 text-sm bg-gradient-to-r from-blue-100 to-indigo-100 hover:from-blue-200 hover:to-indigo-200 text-blue-700 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                          {expandedQuestions.size === solvedQuestions.length ? 'Collapse All' : 'Expand All'}
                        </button>
                      )}
                      {pagination && (
                        <span className="text-sm text-gray-500">
                          Showing {solvedQuestions.length} of {pagination.total} attempts
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* ✅ Questions list with collapsible details */}
                  {solvedQuestions.map((attempt, index) => {
                    const questionKey = `${attempt.question_id}-${attempt.timestamp}`;
                    const isExpanded = expandedQuestions.has(questionKey);
                    
                    return (
                      <div key={questionKey} 
                           className="border-b border-orange-100 hover:bg-gradient-to-r hover:from-orange-50/20 hover:to-yellow-50/20 transition-all duration-200">
                        
                        {/* ✅ Question Header - Always Visible */}
                        <div className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-gray-500">
                                  {formatDate(attempt.timestamp)}
                                </span>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getScoreColor(attempt.score)}`}>
                                  {attempt.score}/10
                                </span>
                                <span className="text-sm text-gray-500 bg-orange-50 px-2 py-1 rounded-full">
                                  {formatTime(attempt.time_taken)}
                                </span>
                              </div>
                              
                              <div className="flex flex-wrap gap-2 text-xs">
                                {attempt.metadata && (
                                  <>
                                    <span className="px-2 py-1 bg-gradient-to-r from-red-100 to-orange-100 text-red-800 rounded-full">
                                      {attempt.metadata.questionNumber}
                                    </span>
                                    <span className="px-2 py-1 bg-gradient-to-r from-orange-100 to-yellow-100 text-orange-800 rounded-full">
                                      Source: {attempt.metadata.source}
                                    </span>
                                    <span className="px-2 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 rounded-full">
                                      Level: {attempt.metadata.level}
                                    </span>
                                    <span className="px-2 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 rounded-full">
                                      Type: {attempt.metadata.type}
                                    </span>
                                    <span className="px-2 py-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-full">
                                      Bloom: {attempt.metadata.bloomLevel}
                                    </span>
                                    <span className="px-2 py-1 bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 rounded-full">
                                      {attempt.metadata.statistics.totalAttempts} attempts | 
                                      Avg: {attempt.metadata.statistics.averageScore}/10
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* ✅ Expand/Collapse Button */}
                            <button
                              onClick={() => toggleQuestionExpansion(questionKey)}
                              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-orange-100 to-yellow-100 hover:from-orange-200 hover:to-yellow-200 text-orange-700 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                              <span className="text-sm font-medium">
                                {isExpanded ? 'Hide Details' : 'Show Details'}
                              </span>
                              <svg 
                                className={`w-4 h-4 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </div>

                          {/* ✅ Question Text - Always Visible */}
                          <div className="mb-4">
                            <h4 className="text-lg font-medium text-gray-800 leading-relaxed">
                              {attempt.question_text}
                            </h4>
                          </div>

                          {/* ✅ Expandable Details Section */}
                          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                            isExpanded ? 'max-h-none opacity-100' : 'max-h-0 opacity-0'
                          }`}>
                            {isExpanded && (
                              <div className="space-y-4 pt-4 border-t border-orange-100">
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                                  <p className="font-medium text-blue-800 mb-2">Your Answer:</p>
                                  <div className="text-blue-700 whitespace-pre-wrap text-sm">
                                    {
                                      attempt.transcribed_text 
                                        ? `Typed:\n${attempt.user_answer}\n\nHandwritten:\n${attempt.transcribed_text}`
                                        : attempt.user_answer
                                    }
                                  </div>
                                </div>

                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                                  <p className="font-medium text-green-800 mb-2">Model Answer:</p>
                                  <p className="text-green-700 text-sm">{attempt.correct_answer}</p>
                                </div>
                                
                                {attempt.explanation && (
                                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                                    <p className="font-medium text-purple-800 mb-2">Explanation:</p>
                                    <p className="text-purple-700 text-sm">{attempt.explanation}</p>
                                  </div>
                                )}

                                <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-4 rounded-lg border border-orange-200">
                                  <p className="font-medium text-orange-800 mb-2">Feedback:</p>
                                  <p className="text-orange-700 text-sm">{attempt.feedback}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* ✅ Load more button */}
                  {pagination?.has_more && (
                    <div className="p-6 text-center border-t border-orange-100">
                      <button
                        onClick={loadMoreQuestions}
                        disabled={loadingMore}
                        className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-300 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loadingMore ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Loading more...
                          </div>
                        ) : (
                          `Load More (${pagination.total - solvedQuestions.length} remaining)`
                        )}
                      </button>
                    </div>
                  )}

                  {/* ✅ No questions message */}
                  {!questionsLoading && solvedQuestions.length === 0 && !questionsError && (
                    <div className="p-12 text-center">
                      <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="font-semibold text-gray-800 mb-2">No attempts yet</h3>
                      <p className="text-gray-600">You haven't attempted any questions in this chapter yet.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}