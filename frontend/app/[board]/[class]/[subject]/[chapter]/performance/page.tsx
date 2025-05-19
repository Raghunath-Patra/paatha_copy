// frontend/app/[board]/[class]/[subject]/[chapter]/performance/page.tsx
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

export default function ChapterPerformanceReport() {
  const params = useParams() as unknown as PerformancePageParams;
  const router = useRouter();
  const { profile, loading: authLoading } = useSupabaseAuth();
  const [report, setReport] = useState<DetailedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chapterName, setChapterName] = useState('');

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
        
        const response = await fetch(
          `${API_URL}/api/progress/user/detailed-report/${params.board}/${params.class}/${params.subject}/${chapterNum}`,
          { headers }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch performance report');
        }

        const data = await response.json();
        setReport(data);

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
    if (score >= 8) return 'bg-green-50 text-green-800';
    if (score >= 6) return 'bg-yellow-50 text-yellow-800';
    return 'bg-red-50 text-red-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="container-fluid px-8 py-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container-fluid px-8 py-6">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-medium mb-2">
                Chapter {params.chapter?.replace('chapter-', '')} Performance Report
                {chapterName && (
                  <span className="ml-2 text-neutral-600">
                    : {chapterName}
                  </span>
                )}
              </h1>
              <p className="text-neutral-600">
                {params.board?.toUpperCase()} Class {params.class?.toUpperCase()}
              </p>
            </div>
            <div className="flex gap-4 items-center">
              <Navigation />
            </div>
          </div>

          {report && (
            <div className="space-y-6">
              {/* Performance Analytics Component */}
              <PerformanceAnalytics attempts={report.attempts} />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-6">
                  <h3 className="text-sm font-medium text-blue-600 mb-1">Total Attempts</h3>
                  <p className="text-3xl font-bold text-blue-900">{report.total_attempts}</p>
                </div>

                <div className="bg-green-50 rounded-lg p-6">
                  <h3 className="text-sm font-medium text-green-600 mb-1">Average Score</h3>
                  <p className="text-3xl font-bold text-green-900">{report.average_score.toFixed(1)}/10</p>
                </div>

                <div className="bg-purple-50 rounded-lg p-6">
                  <h3 className="text-sm font-medium text-purple-600 mb-1">Total Time Spent</h3>
                  <p className="text-3xl font-bold text-purple-900">{formatTime(report.total_time)}</p>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm divide-y">
                {report.attempts.map((attempt, index) => (
                  <div key={`${attempt.question_id}-${attempt.timestamp}`} className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-500">
                            {formatDate(attempt.timestamp)}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-sm font-medium ${getScoreColor(attempt.score)}`}>
                            {attempt.score}/10
                          </span>
                          <span className="text-sm text-gray-500">
                            {formatTime(attempt.time_taken)}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 text-xs">
                          {attempt.metadata && (
                            <>
                              <span className="px-2 py-1 bg-gray-100 rounded-full">
                                {attempt.metadata.questionNumber}
                              </span>
                              <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full">
                                Source: {attempt.metadata.source}
                              </span>
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                                Level: {attempt.metadata.level}
                              </span>
                              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
                                Type: {attempt.metadata.type}
                              </span>
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">
                                Bloom: {attempt.metadata.bloomLevel}
                              </span>
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                                {attempt.metadata.statistics.totalAttempts} attempts | 
                                Avg: {attempt.metadata.statistics.averageScore.toFixed(1)}/10
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="prose max-w-none">
                      <h4 className="text-lg font-medium mb-2">{attempt.question_text}</h4>
                      <div className="space-y-4">
                        <div>
                          <p className="font-medium text-gray-700">Your Answer:</p>
                          <div className="text-gray-600 whitespace-pre-wrap">
                            {
                              attempt.transcribed_text 
                                ? `Typed:\n${attempt.user_answer}\n\nHandwritten:\n${attempt.transcribed_text}`
                                : `Typed:\n${attempt.user_answer}`
                            }
                          </div>
                        </div>

                        <div>
                          <p className="font-medium text-gray-700">Model Answer:</p>
                          <p className="text-gray-600">{attempt.correct_answer}</p>
                        </div>
                        
                        {attempt.explanation && (
                          <div>
                            <p className="font-medium text-gray-700">Explanation:</p>
                            <p className="text-gray-600">{attempt.explanation}</p>
                          </div>
                        )}

                        <div>
                          <p className="font-medium text-gray-700">Feedback:</p>
                          <p className="text-gray-600">{attempt.feedback}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}