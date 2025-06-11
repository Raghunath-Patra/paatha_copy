// frontend/app/[board]/[class]/[subject]/page.tsx
// UPDATED: Navigate to chapter overview (sections) instead of direct questions

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navigation from '../../../components/navigation/Navigation';
import { getAuthHeaders } from '../../../utils/auth';
import { useSupabaseAuth } from '../../../contexts/SupabaseAuthContext';
import { userTokenService } from '../../../utils/userTokenService';

interface Chapter {
  number: number;
  name: string;
}

interface ChapterProgress {
  [chapterKey: string]: {
    total_attempts: number;
    average_score: number;
    last_attempted?: string;
  };
}

interface SubjectPageParams {
  board: string;
  class: string;
  subject: string;
}

// Define a mapping for better display names
const BOARD_DISPLAY_NAMES: Record<string, string> = {
  'cbse': 'CBSE',
  'karnataka': 'Karnataka State Board'
};

const CLASS_DISPLAY_NAMES: Record<string, string> = {
  'viii': 'Class VIII',
  'ix': 'Class IX',
  'x': 'Class X',
  'xi': 'Class XI',
  'xii': 'Class XII',
  '8th': '8th Class',
  '9th': '9th Class',
  '10th': '10th Class',
  'puc-1': 'PUC-I',
  'puc-2': 'PUC-II'
};

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

// Enhanced skeleton loading component
const ChaptersSkeleton = () => (
  <div className="space-y-6">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-50/30 to-transparent opacity-50"></div>
        <div className="relative z-10 space-y-4">
          {/* Chapter title skeleton */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-200 to-indigo-200 rounded-full animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-48 animate-pulse" 
                   style={{ animationDelay: `${i * 100}ms` }}></div>
              <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-24 animate-pulse" 
                   style={{ animationDelay: `${i * 150}ms` }}></div>
            </div>
          </div>
          
          {/* Progress bar skeleton */}
          <div className="space-y-2">
            <div className="h-2 bg-gradient-to-r from-orange-200 to-yellow-200 rounded-full w-full animate-pulse" 
                 style={{ animationDelay: `${i * 200}ms` }}></div>
            <div className="flex justify-between">
              <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-20 animate-pulse" 
                   style={{ animationDelay: `${i * 250}ms` }}></div>
              <div className="h-4 bg-gradient-to-r from-green-200 to-emerald-200 rounded w-16 animate-pulse" 
                   style={{ animationDelay: `${i * 300}ms` }}></div>
            </div>
          </div>
          
          {/* Action buttons skeleton */}
          <div className="flex gap-3 pt-2">
            <div className="h-9 bg-gradient-to-r from-blue-200 to-indigo-200 rounded-lg flex-1 animate-pulse" 
                 style={{ animationDelay: `${i * 350}ms` }}></div>
            <div className="h-9 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-24 animate-pulse" 
                 style={{ animationDelay: `${i * 400}ms` }}></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default function SubjectPage() {
  const params = useParams() as unknown as SubjectPageParams;
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [chapterProgress, setChapterProgress] = useState<ChapterProgress>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { profile, loading: authLoading } = useSupabaseAuth();
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  
  // Format subject name
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

  // Get friendly display names
  const boardDisplayName = BOARD_DISPLAY_NAMES[params.board?.toLowerCase()] || params.board?.toUpperCase() || '';
  const classDisplayName = CLASS_DISPLAY_NAMES[params.class?.toLowerCase()] || params.class?.toUpperCase() || '';

  useEffect(() => {
    const fetchData = async () => {
      if (authLoading) return;
      if (!profile) {
        console.log('No profile, redirecting to login');
        router.push('/login');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { headers, isAuthorized } = await getAuthHeaders();
        if (!isAuthorized) {
          console.log('No auth headers, redirecting to login');
          router.push('/login');
          return;
        }

        // Sync user data
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

        console.log(`🌐 Fetching chapters for: ${params.board}/${params.class}/${params.subject}`);

        // Fetch chapters
        const chaptersResponse = await fetch(
          `${API_URL}/api/subjects/${params.board}/${params.class}/${params.subject}/chapters`,
          { headers }
        );

        if (!chaptersResponse.ok) {
          throw new Error(`Failed to fetch chapters. Status: ${chaptersResponse.status}`);
        }

        const chaptersData = await chaptersResponse.json();
        console.log('📚 Fetched chapters data:', chaptersData);
        
        setChapters(chaptersData.chapters || []);

        // Fetch chapter progress
        try {
          const progressResponse = await fetch(
            `${API_URL}/api/progress/user/chapters/${params.board}/${params.class}/${params.subject}`,
            { headers }
          );

          if (progressResponse.ok) {
            const progressData = await progressResponse.json();
            console.log('📊 Fetched progress data:', progressData);
            setChapterProgress(progressData.progress || {});
          }
        } catch (progressError) {
          console.warn('Progress fetch error:', progressError);
          setChapterProgress({});
        }

        // Initialize token service
        userTokenService.fetchUserTokenStatus();

      } catch (error) {
        console.error('❌ Error fetching subject data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load subject data');
      } finally {
        setLoading(false);
      }
    };

    if (params.board && params.class && params.subject) {
      fetchData();
    }
  }, [params.board, params.class, params.subject, router, profile, authLoading, API_URL]);

  // UPDATED: Handle chapter click - now goes to chapter overview (sections)
  const handleChapterClick = (chapterNumber: number) => {
    router.push(`/${params.board}/${params.class}/${params.subject}/chapter-${chapterNumber}`);
  };

  // Handle performance click
  const handlePerformanceClick = (chapterNumber: number) => {
    router.push(`/${params.board}/${params.class}/${params.subject}/chapter-${chapterNumber}/performance`);
  };

  // Get chapter progress
  const getChapterProgress = (chapterNumber: number) => {
    const key = `chapter_${chapterNumber}`;
    return chapterProgress[key] || { total_attempts: 0, average_score: 0 };
  };

  // Get progress color
  const getProgressColor = (averageScore: number) => {
    if (averageScore >= 8) return 'bg-green-500';
    if (averageScore >= 6) return 'bg-yellow-500';
    if (averageScore > 0) return 'bg-orange-500';
    return 'bg-gray-300';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 relative">
        {/* Background decorations */}
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
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <div>
                <h1 className="text-2xl sm:text-3xl font-medium text-gray-800">
                  {formatSubjectName(params.subject)}
                </h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1">Loading chapters...</p>
              </div>
              <div className="flex items-center gap-4 relative z-[100]">
                <Navigation />
              </div>
            </div>
            
            <div className="max-w-5xl mx-auto">
              <ChaptersSkeleton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center relative">
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
          <h3 className="font-semibold text-red-800 mb-2">Error Loading Subject</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
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
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-medium mb-2 text-gray-800">
                {formatSubjectName(params.subject)}
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                {boardDisplayName} {classDisplayName} • Select a chapter to view sections
              </p>
            </div>
            <div className="flex items-center gap-4 relative z-[100]">
              <Navigation />
            </div>
          </div>
          
          <div className="max-w-5xl mx-auto">
            <div className="space-y-6">
              {chapters.map((chapter) => {
                const progress = getChapterProgress(chapter.number);
                const progressPercentage = progress.total_attempts > 0 ? Math.min((progress.average_score / 10) * 100, 100) : 0;
                
                return (
                  <div key={chapter.number} className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/50 relative overflow-hidden hover:shadow-xl transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-50/30 to-transparent opacity-50"></div>
                    
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {chapter.number}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800">Chapter {chapter.number}: {chapter.name}</h3>
                            <p className="text-sm text-gray-600">Click to view sections and practice questions</p>
                          </div>
                        </div>
                        
                        {progress.total_attempts > 0 && (
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-700">
                              Avg Score: {progress.average_score.toFixed(1)}/10
                            </div>
                            <div className="text-xs text-gray-500">
                              {progress.total_attempts} attempts
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                          <div 
                            className={`h-2.5 rounded-full transition-all duration-500 ${getProgressColor(progress.average_score)}`}
                            style={{ width: `${progressPercentage}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Overall Progress</span>
                          <span>{progressPercentage.toFixed(0)}%</span>
                        </div>
                      </div>
                      
                      {/* Action Buttons - UPDATED: Goes to chapter overview */}
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleChapterClick(chapter.number)}
                          className="flex-1 py-2 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                        >
                          📖 View Sections
                        </button>
                        
                        {progress.total_attempts > 0 && (
                          <button
                            onClick={() => handlePerformanceClick(chapter.number)}
                            className="py-2 px-4 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-lg hover:from-gray-200 hover:to-gray-300 transition-all duration-300 shadow-md hover:shadow-lg"
                          >
                            📊 Performance
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {chapters.length === 0 && (
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-white/50 text-center">
                <div className="text-4xl mb-4">📚</div>
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  No chapters available yet
                </h3>
                <p className="text-sm text-gray-500">
                  Chapters for this subject will be available soon
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}