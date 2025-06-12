// frontend/app/[board]/[class]/[subject]/[chapter]/[sectionNumber]/performance/page.tsx
// UPDATED: Section Performance Page with new navigation structure

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navigation from '../../../../../../components/navigation/Navigation';
import { getAuthHeaders } from '../../../../../../utils/auth';
import { useSupabaseAuth } from '../../../../../../contexts/SupabaseAuthContext';
import PerformanceAnalytics from '../../../../../../components/performance/PerformanceAnalytics';

// Analytics data types (same as before)
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

// Question metadata and attempt interfaces
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
  section_info: {
    board: string;
    class_level: string;
    subject: string;
    chapter: string;
    section: string;
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
  section_info: {
    board: string;
    class_level: string;
    subject: string;
    chapter: string;
    section: string;
  };
}

interface PerformancePageParams {
  board: string;
  class: string;
  subject: string;
  chapter: string;
  sectionNumber: string;
}

// ✅ UPDATED: Performance Navigation Component with new URL structure
const PerformanceNavigation = ({ params }: { params: PerformancePageParams }) => {
  const router = useRouter();
  
  const handleContentClick = () => {
    router.push(`/${params.board}/${params.class}/${params.subject}/${params.chapter}/${params.sectionNumber}/content`);
  };

  const handleQuestionsClick = () => {
    router.push(`/${params.board}/${params.class}/${params.subject}/${params.chapter}/${params.sectionNumber}/questions`);
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

      {/* Questions Icon */}
      <button
        onClick={handleQuestionsClick}
        className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 rounded-lg hover:from-blue-200 hover:to-indigo-200 transition-all duration-300 shadow-sm hover:shadow-md"
        title="Practice Questions"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="hidden sm:inline">Questions</span>
      </button>

      {/* Performance Icon (Current Page) */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg shadow-md">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span className="hidden sm:inline">Performance</span>
      </div>

      {/* Main Navigation */}
      <Navigation />
    </div>
  );
};

// Skeleton Components (same as before)
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
        <div key={i} className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-24 sm:w-32 animate-pulse" 
                     style={{ animationDelay: `${i * 100}ms` }}></div>
                <div className="h-6 bg-gradient-to-r from-green-200 to-emerald-200 rounded-full w-12 animate-pulse" 
                     style={{ animationDelay: `${i * 150}ms` }}></div>
                <div className="h-5 bg-gradient-to-r from-orange-200 to-yellow-200 rounded-full w-16 animate-pulse" 
                     style={{ animationDelay: `${i * 200}ms` }}></div>
              </div>
              <div className="flex flex-wrap gap-1 sm:gap-2">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="h-5 bg-gradient-to-r from-blue-200 to-purple-200 rounded-full w-12 sm:w-16 animate-pulse" 
                       style={{ animationDelay: `${(i * 4 + j) * 50}ms` }}></div>
                ))}
              </div>
            </div>
            <div className="h-8 bg-gradient-to-r from-orange-200 to-yellow-200 rounded-lg w-full sm:w-24 animate-pulse" 
                 style={{ animationDelay: `${i * 250}ms` }}></div>
          </div>
          
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

export default function SectionPerformanceReport() {
  const params = useParams() as unknown as PerformancePageParams;
  const router = useRouter();
  const { profile, loading: authLoading } = useSupabaseAuth();
  
  // Split state for all three data sources
  const [performanceSummary, setPerformanceSummary] = useState<PerformanceSummary | null>(null);
  const [analyticsData, setAnalyticsData] = useState<PerformanceAnalyticsData | null>(null);
  const [solvedQuestions, setSolvedQuestions] = useState<DetailedAttempt[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  
  // Independent loading states
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Error handling
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [questionsError, setQuestionsError] = useState<string | null>(null);
  
  // UI state
  const [sectionName, setSectionName] = useState('');
  const [sectionNameLoading, setSectionNameLoading] = useState(true);
  
  // Expandable questions state
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  
  // Extract numbers from params
  const sectionNumber = params.sectionNumber || '';
  const chapterNumber = params.chapter?.replace('chapter-', '') || '';
  
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

  // Fetch performance summary for section
  const fetchPerformanceSummary = useCallback(async () => {
    try {
      const { headers, isAuthorized } = await getAuthHeaders();
      if (!isAuthorized) return false;
      
      setSummaryLoading(true);
      setSummaryError(null);
      
      const response = await fetch(
        `${API_URL}/api/progress/user/performance-summary/${params.board}/${params.class}/${params.subject}/${chapterNumber}/section/${sectionNumber}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch section performance summary: ${response.status}`);
      }

      const data = await response.json();
      setPerformanceSummary(data);
      return true;
    } catch (err) {
      console.error('Error fetching section performance summary:', err);
      setSummaryError(err instanceof Error ? err.message : 'Failed to fetch performance summary');
      return false;
    } finally {
      setSummaryLoading(false);
    }
  }, [params, API_URL, chapterNumber, sectionNumber]);

  // Fetch analytics data for section
  const fetchAnalyticsData = useCallback(async () => {
    try {
      const { headers, isAuthorized } = await getAuthHeaders();
      if (!isAuthorized) return false;
      
      setAnalyticsLoading(true);
      setAnalyticsError(null);
      
      const response = await fetch(
        `${API_URL}/api/progress/user/performance-analytics/${params.board}/${params.class}/${params.subject}/${chapterNumber}/section/${sectionNumber}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch section analytics data: ${response.status}`);
      }

      const data = await response.json();
      setAnalyticsData(data);
      return true;
    } catch (err) {
      console.error('Error fetching section analytics data:', err);
      setAnalyticsError(err instanceof Error ? err.message : 'Failed to fetch analytics data');
      return false;
    } finally {
      setAnalyticsLoading(false);
    }
  }, [params, API_URL, chapterNumber, sectionNumber]);

  // Fetch solved questions for section
  const fetchSolvedQuestions = useCallback(async (offset = 0, append = false) => {
    try {
      const { headers, isAuthorized } = await getAuthHeaders();
      if (!isAuthorized) return false;
      
      if (!append) {
        setQuestionsLoading(true);
        setQuestionsError(null);
      } else {
        setLoadingMore(true);
      }

      const response = await fetch(
        `${API_URL}/api/progress/user/solved-questions/${params.board}/${params.class}/${params.subject}/${chapterNumber}/section/${sectionNumber}?limit=20&offset=${offset}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch section solved questions: ${response.status}`);
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
      console.error('Error fetching section solved questions:', err);
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
  }, [params, API_URL, chapterNumber, sectionNumber]);

  // Fetch section name
  const fetchSectionName = useCallback(async () => {
    try {
      const { headers, isAuthorized } = await getAuthHeaders();
      if (!isAuthorized) return;

      const sectionsResponse = await fetch(
        `${API_URL}/api/subjects/${params.board}/${params.class}/${params.subject}/${chapterNumber}/sections`,
        { headers }
      );
      
      if (sectionsResponse.ok) {
        const sectionsData = await sectionsResponse.json();
        const section = sectionsData.sections?.find(
          (s: any) => s.number === parseInt(sectionNumber || '0')
        );
        if (section) {
          setSectionName(section.name);
        }
      }
    } catch (err) {
      console.error('Error fetching section name:', err);
    } finally {
      setSectionNameLoading(false);
    }
  }, [params, API_URL, chapterNumber, sectionNumber]);

  // Main effect - Optimized parallel loading
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

      console.log('Starting parallel data loading for section performance...');
      
      const [summarySuccess, analyticsSuccess] = await Promise.all([
        fetchPerformanceSummary(),
        fetchAnalyticsData(),
        fetchSectionName()
      ]);

      console.log(`Section Summary: ${summarySuccess}, Analytics: ${analyticsSuccess}`);

      // Load questions after critical data
      fetchSolvedQuestions();
    };

    if (params.board && params.class && params.subject && params.chapter && params.sectionNumber) {
      loadData();
    }
  }, [params, router, profile, authLoading, fetchPerformanceSummary, fetchAnalyticsData, fetchSolvedQuestions, fetchSectionName]);

  // Load more questions handler
  const loadMoreQuestions = () => {
    if (pagination?.has_more && !loadingMore) {
      fetchSolvedQuestions(pagination.next_offset, true);
    }
  };

  // Utility functions
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

  // Toggle question expansion
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

  // Expand/Collapse all questions
  const toggleAllQuestions = () => {
    if (expandedQuestions.size === solvedQuestions.length) {
      setExpandedQuestions(new Set());
    } else {
      const allKeys = solvedQuestions.map(attempt => `${attempt.question_id}-${attempt.timestamp}`);
      setExpandedQuestions(new Set(allKeys));
    }
  };

  // Error handling
  const hasAnyData = performanceSummary || analyticsData || solvedQuestions.length > 0;
  const hasAllErrors = summaryError && analyticsError && questionsError;
  
  if (hasAllErrors && !hasAnyData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center relative p-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-red-200/30 rounded-full animate-pulse" 
               style={{animationDuration: '3s'}} />
          <div className="absolute bottom-1/4 right-1/4 w-16 h-16 bg-yellow-200/25 rounded-full animate-bounce" 
               style={{animationDuration: '4s'}} />
        </div>
        
        <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg max-w-md text-center border border-red-200 relative z-10 w-full">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="font-semibold text-red-800 mb-2">Error Loading Section Report</h3>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 relative">
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
        <div className="max-w-[1600px] mx-auto">
          {/* ✅ UPDATED: Header with new navigation */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-medium mb-2 text-gray-800">
                Chapter {chapterNumber}, Section {sectionNumber} Performance Report
                {sectionNameLoading ? (
                  <span className="block sm:inline sm:ml-2 mt-1 sm:mt-0">
                    <span className="inline-block h-5 sm:h-6 w-32 sm:w-48 bg-gradient-to-r from-red-200 to-orange-200 rounded animate-pulse"></span>
                  </span>
                ) : sectionName && (
                  <span className="block sm:inline sm:ml-2 text-orange-600 text-lg sm:text-xl lg:text-2xl mt-1 sm:mt-0">
                    : {sectionName}
                  </span>
                )}
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                {params.board?.toUpperCase()} Class {params.class?.toUpperCase()}
              </p>
            </div>
            <div className="flex gap-4 items-center relative z-[100] justify-end">
              <PerformanceNavigation params={params} />
            </div>
          </div>

          {/* Content with independent loading states - SAME AS BEFORE */}
          <div className="space-y-6">
            {/* Performance Summary Section */}
            {summaryLoading ? (
              <PerformanceSummarySkeleton />
            ) : summaryError ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                <p className="text-red-700">Failed to load section performance summary</p>
                <button 
                  onClick={fetchPerformanceSummary}
                  className="mt-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : performanceSummary && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-lg border border-white/50 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 to-indigo-50/30 opacity-50"></div>
                  <div className="relative z-10">
                    <h3 className="text-xs sm:text-sm font-medium text-blue-600 mb-1 flex items-center gap-2">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 rounded-full"></div>
                      Total Attempts
                    </h3>
                    <p className="text-2xl sm:text-3xl font-bold text-blue-900">{performanceSummary.total_attempts}</p>
                  </div>
                </div>

                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-lg border border-white/50 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-50/30 to-emerald-50/30 opacity-50"></div>
                  <div className="relative z-10">
                    <h3 className="text-xs sm:text-sm font-medium text-green-600 mb-1 flex items-center gap-2">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full"></div>
                      Average Score
                    </h3>
                    <p className="text-2xl sm:text-3xl font-bold text-green-900">{performanceSummary.average_score}/10</p>
                  </div>
                </div>

                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-lg border border-white/50 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-50/30 to-pink-50/30 opacity-50"></div>
                  <div className="relative z-10">
                    <h3 className="text-xs sm:text-sm font-medium text-purple-600 mb-1 flex items-center gap-2">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-purple-500 rounded-full"></div>
                      Total Time Spent
                    </h3>
                    <p className="text-2xl sm:text-3xl font-bold text-purple-900">{formatTime(performanceSummary.total_time)}</p>
                  </div>
                </div>

                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-lg border border-white/50 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-50/30 to-yellow-50/30 opacity-50"></div>
                  <div className="relative z-10">
                    <h3 className="text-xs sm:text-sm font-medium text-orange-600 mb-1 flex items-center gap-2">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-orange-500 rounded-full"></div>
                      Unique Questions
                    </h3>
                    <p className="text-2xl sm:text-3xl font-bold text-orange-900">{performanceSummary.unique_questions}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Analytics Section */}
            {analyticsLoading ? (
              <AnalyticsSkeleton />
            ) : analyticsError ? (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
                <p className="text-orange-700">Failed to load section analytics data</p>
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

            {/* Questions Section */}
            {questionsLoading ? (
              <QuestionsSkeleton />
            ) : questionsError ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
                <p className="text-yellow-700">Failed to load section question details</p>
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
                  <div className="p-4 sm:p-6 pb-0 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-800">Section Question Attempts</h3>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      {solvedQuestions.length > 0 && (
                        <button
                          onClick={toggleAllQuestions}
                          className="px-3 py-2 text-sm bg-gradient-to-r from-blue-100 to-indigo-100 hover:from-blue-200 hover:to-indigo-200 text-blue-700 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md w-full sm:w-auto"
                        >
                          {expandedQuestions.size === solvedQuestions.length ? 'Collapse All' : 'Expand All'}
                        </button>
                      )}
                      {pagination && (
                        <span className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
                          Showing {solvedQuestions.length} of {pagination.total} attempts
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* No questions message */}
                  {!questionsLoading && solvedQuestions.length === 0 && !questionsError && (
                    <div className="p-8 sm:p-12 text-center">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="font-semibold text-gray-800 mb-2 text-base sm:text-lg">No attempts yet</h3>
                      <p className="text-gray-600 text-sm sm:text-base">You haven't attempted any questions in this section yet.</p>
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