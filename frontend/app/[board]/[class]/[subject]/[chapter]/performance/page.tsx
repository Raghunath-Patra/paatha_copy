// frontend/app/[board]/[class]/[subject]/[chapter]/performance/page.tsx - Updated version
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navigation from '../../../../../components/navigation/Navigation';
import { getAuthHeaders } from '../../../../../utils/auth';
import { useSupabaseAuth } from '../../../../../contexts/SupabaseAuthContext';
import PerformanceAnalytics from '../../../../../components/performance/PerformanceAnalytics';

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

interface DetailedReport {
  total_attempts: number;
  average_score: number;
  total_time: number;
  attempts: DetailedAttempt[];
}

interface PerformancePageParams {
  board: string;
  class: string;
  subject: string;
  chapter: string;
}

// ✅ NEW: Skeleton for performance data only
const PerformanceDataSkeleton = () => (
  <div className="space-y-6">
    {/* Stats cards skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
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

    {/* Performance analytics skeleton */}
    <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/50 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-50/30 to-transparent opacity-50"></div>
      <div className="relative z-10 space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance Analytics</h3>
        <div className="h-64 bg-gradient-to-r from-orange-200 to-yellow-200 rounded-lg animate-pulse"></div>
      </div>
    </div>

    {/* Attempts list skeleton */}
    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 divide-y divide-orange-100 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-50/30 to-transparent opacity-50"></div>
      <div className="relative z-10">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Question Attempts</h3>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-32 animate-pulse" 
                       style={{ animationDelay: `${i * 100}ms` }}></div>
                  <div className="h-6 bg-gradient-to-r from-green-200 to-emerald-200 rounded-full w-12 animate-pulse" 
                       style={{ animationDelay: `${i * 150}ms` }}></div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="h-5 bg-gradient-to-r from-blue-200 to-purple-200 rounded-full w-16 animate-pulse" 
                         style={{ animationDelay: `${(i * 4 + j) * 50}ms` }}></div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="h-6 bg-gradient-to-r from-red-200 to-orange-200 rounded w-full animate-pulse" 
                   style={{ animationDelay: `${i * 200}ms` }}></div>
              <div className="space-y-2">
                {[1, 2, 3].map((k) => (
                  <div key={k} className="h-4 bg-gradient-to-r from-orange-200 to-yellow-200 rounded animate-pulse" 
                       style={{ 
                         width: k === 3 ? '70%' : '100%',
                         animationDelay: `${(i * 3 + k) * 100}ms` 
                       }}></div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default function ChapterPerformanceReport() {
  const params = useParams() as unknown as PerformancePageParams;
  const router = useRouter();
  const { profile, loading: authLoading } = useSupabaseAuth();
  const [report, setReport] = useState<DetailedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chapterName, setChapterName] = useState('');
  const [chapterNameLoading, setChapterNameLoading] = useState(true);

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

  useEffect(() => {
    const fetchDetailedReport = async () => {
      try {
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

        const { headers, isAuthorized } = await getAuthHeaders();
        if (!isAuthorized) {
          router.push('/login');
          return;
        }

        const chapterNum = typeof params.chapter === 'string' 
          ? params.chapter.replace(/^chapter-/, '')
          : '';
        
        // Fetch performance report
        const response = await fetch(
          `${API_URL}/api/progress/user/detailed-report/${params.board}/${params.class}/${params.subject}/${chapterNum}`,
          { headers }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch performance report');
        }

        const data = await response.json();
        setReport(data);

        // Fetch chapter name separately
        const chaptersResponse = await fetch(
          `${API_URL}/api/subjects/${params.board}/${params.class}/${params.subject}/chapters`,
          { headers }
        );
        
        if (chaptersResponse.ok) {
          const chaptersData = await chaptersResponse.json();
          const chapterInfo = chaptersData.chapters.find(
            (ch: any) => ch.number === parseInt(chapterNum || '0')
          );
          if (chapterInfo) {
            setChapterName(chapterInfo.name);
          }
        }
        setChapterNameLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred while fetching the report');
      } finally {
        setLoading(false);
      }
    };

    if (params.board && params.class && params.subject && params.chapter) {
      fetchDetailedReport();
    }
  }, [params, router, profile, authLoading]);

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

  if (error) {
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
          <p className="text-red-700 mb-4">{error}</p>
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
      {/* Animated background decorations - ALWAYS VISIBLE */}
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
          {/* ✅ Header - ALWAYS VISIBLE (no loading states for known content) */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-medium mb-2 text-gray-800">
                Chapter {displayChapter} Performance Report
                {/* ✅ Only chapter name has skeleton when loading */}
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
            {/* ✅ Navigation - ALWAYS VISIBLE */}
            <div className="flex gap-4 items-center relative z-[100]">
              <Navigation />
            </div>
          </div>

          {/* ✅ Content - Show skeleton only when data is loading */}
          {loading ? (
            <PerformanceDataSkeleton />
          ) : report && (
            <div className="space-y-6">
              {/* ✅ Performance Analytics Component - Show with labels but skeleton for progress */}
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-50/20 to-transparent opacity-50"></div>
                <div className="relative z-10">
                  <PerformanceAnalytics attempts={report.attempts} />
                </div>
              </div>
              
              {/* ✅ Summary stats - Real data */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/50 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 to-indigo-50/30 opacity-50"></div>
                  <div className="relative z-10">
                    <h3 className="text-sm font-medium text-blue-600 mb-1 flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                      Total Attempts
                    </h3>
                    <p className="text-3xl font-bold text-blue-900">{report.total_attempts}</p>
                  </div>
                </div>

                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/50 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-50/30 to-emerald-50/30 opacity-50"></div>
                  <div className="relative z-10">
                    <h3 className="text-sm font-medium text-green-600 mb-1 flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                      Average Score
                    </h3>
                    <p className="text-3xl font-bold text-green-900">{report.average_score.toFixed(1)}/10</p>
                  </div>
                </div>

                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/50 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-50/30 to-pink-50/30 opacity-50"></div>
                  <div className="relative z-10">
                    <h3 className="text-sm font-medium text-purple-600 mb-1 flex items-center gap-2">
                      <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                      Total Time Spent
                    </h3>
                    <p className="text-3xl font-bold text-purple-900">{formatTime(report.total_time)}</p>
                  </div>
                </div>
              </div>

              {/* ✅ Attempts list - Real data */}
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg divide-y divide-orange-100 border border-white/50 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-50/20 to-transparent opacity-30"></div>
                
                <div className="relative z-10">
                  {/* ✅ Section header - always visible */}
                  <div className="p-6 pb-0">
                    <h3 className="text-lg font-semibold text-gray-800">Question Attempts</h3>
                  </div>
                  
                  {report.attempts.map((attempt, index) => (
                    <div key={`${attempt.question_id}-${attempt.timestamp}`} className="p-6 hover:bg-gradient-to-r hover:from-orange-50/20 hover:to-yellow-50/20 transition-all duration-200">
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
                                  Avg: {attempt.metadata.statistics.averageScore.toFixed(1)}/10
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="prose max-w-none">
                        <h4 className="text-lg font-medium mb-2 text-gray-800">{attempt.question_text}</h4>
                        <div className="space-y-4">
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                            <p className="font-medium text-blue-800 mb-2">Your Answer:</p>
                            <div className="text-blue-700 whitespace-pre-wrap text-sm">
                              {
                                attempt.transcribed_text 
                                  ? `Typed:\n${attempt.user_answer}\n\nHandwritten:\n${attempt.transcribed_text}`
                                  : `Typed:\n${attempt.user_answer}`
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
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}