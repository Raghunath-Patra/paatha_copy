// frontend/app/[board]/[class]/[subject]/[chapter]/page.tsx
// UPDATED: Chapter Overview Page - Now links to content first, then questions

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navigation from '../../../../components/navigation/Navigation';
import { getAuthHeaders } from '../../../../utils/auth';
import { useSupabaseAuth } from '../../../../contexts/SupabaseAuthContext';
import { userTokenService } from '../../../../utils/userTokenService';

interface Section {
  number: number;
  name: string;
}

interface ChapterInfo {
  number: number;
  name: string;
}

interface SectionProgress {
  [sectionKey: string]: {
    total_attempts: number;
    average_score: number;
    last_attempted?: string;
  };
}

interface PerformancePageParams {
  board: string;
  class: string;
  subject: string;
  chapter: string;
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

// Board display names
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

// Skeleton component for loading
const SectionsSkeleton = () => (
  <div className="space-y-6">
    {[1, 2, 3].map((i) => (
      <div key={i} className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-50/30 to-transparent opacity-50"></div>
        <div className="relative z-10 space-y-4">
          {/* Section title skeleton */}
          <div className="flex items-center gap-3">
            <div className="h-6 bg-gradient-to-r from-blue-200 to-indigo-200 rounded w-8 animate-pulse"></div>
            <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-48 animate-pulse" 
                 style={{ animationDelay: `${i * 100}ms` }}></div>
          </div>
          
          {/* Progress bar skeleton */}
          <div className="space-y-2">
            <div className="h-2 bg-gradient-to-r from-orange-200 to-yellow-200 rounded-full w-full animate-pulse" 
                 style={{ animationDelay: `${i * 150}ms` }}></div>
            <div className="flex justify-between">
              <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-24 animate-pulse" 
                   style={{ animationDelay: `${i * 200}ms` }}></div>
              <div className="h-4 bg-gradient-to-r from-green-200 to-emerald-200 rounded w-16 animate-pulse" 
                   style={{ animationDelay: `${i * 250}ms` }}></div>
            </div>
          </div>
          
          {/* Action buttons skeleton */}
          <div className="flex gap-2 pt-2">
            <div className="h-8 bg-gradient-to-r from-blue-200 to-indigo-200 rounded w-24 animate-pulse" 
                 style={{ animationDelay: `${i * 300}ms` }}></div>
            <div className="h-8 bg-gradient-to-r from-purple-200 to-pink-200 rounded w-28 animate-pulse" 
                 style={{ animationDelay: `${i * 350}ms` }}></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default function ChapterOverviewPage() {
  const params = useParams() as unknown as PerformancePageParams;
  const router = useRouter();
  const { profile, loading: authLoading } = useSupabaseAuth();
  
  const [sections, setSections] = useState<Section[]>([]);
  const [chapterInfo, setChapterInfo] = useState<ChapterInfo | null>(null);
  const [sectionProgress, setSectionProgress] = useState<SectionProgress>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  
  const chapterNumber = params.chapter?.replace('chapter-', '') || '';
  
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
        router.push('/login');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { headers, isAuthorized } = await getAuthHeaders();
        if (!isAuthorized) {
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

        // Fetch chapter info
        const chaptersResponse = await fetch(
          `${API_URL}/api/subjects/${params.board}/${params.class}/${params.subject}/chapters`,
          { headers }
        );
        
        if (chaptersResponse.ok) {
          const chaptersData = await chaptersResponse.json();
          const chapter = chaptersData.chapters?.find(
            (ch: any) => ch.number === parseInt(chapterNumber)
          );
          if (chapter) {
            setChapterInfo(chapter);
          }
        }

        // Fetch sections for this chapter
        const sectionsResponse = await fetch(
          `${API_URL}/api/subjects/${params.board}/${params.class}/${params.subject}/${chapterNumber}/sections`,
          { headers }
        );

        if (sectionsResponse.ok) {
          const sectionsData = await sectionsResponse.json();
          setSections(sectionsData.sections || []);
        } else {
          console.warn('Failed to fetch sections, using defaults');
          setSections([
            { number: 1, name: 'Section 1' },
            { number: 2, name: 'Section 2' },
            { number: 3, name: 'Section 3' }
          ]);
        }

        // Fetch section progress
        try {
          const progressResponse = await fetch(
            `${API_URL}/api/progress/user/sections/${params.board}/${params.class}/${params.subject}/${chapterNumber}`,
            { headers }
          );

          if (progressResponse.ok) {
            const progressData = await progressResponse.json();
            setSectionProgress(progressData.progress || {});
          }
        } catch (progressError) {
          console.warn('Progress fetch error:', progressError);
          setSectionProgress({});
        }

        // Initialize token service
        userTokenService.fetchUserTokenStatus();

      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load chapter data');
      } finally {
        setLoading(false);
      }
    };

    if (params.board && params.class && params.subject && params.chapter) {
      fetchData();
    }
  }, [params, router, profile, authLoading, API_URL, chapterNumber]);

  // ✅ UPDATED: Handle section click - now goes to content first
  const handleSectionClick = (sectionNumber: number) => {
    router.push(`/${params.board}/${params.class}/${params.subject}/${params.chapter}/section-${sectionNumber}/content`);
  };

  // ✅ NEW: Handle direct questions click (for "Practice Questions" button)
  const handleDirectQuestionsClick = (sectionNumber: number) => {
    router.push(`/${params.board}/${params.class}/${params.subject}/${params.chapter}/section-${sectionNumber}/questions`);
  };

  // Handle performance click
  const handlePerformanceClick = (sectionNumber: number) => {
    router.push(`/${params.board}/${params.class}/${params.subject}/${params.chapter}/section-${sectionNumber}/performance`);
  };

  // Handle exercise questions click
  const handleExerciseClick = () => {
    router.push(`/${params.board}/${params.class}/${params.subject}/${params.chapter}/exercise`);
  };

  // Get section progress
  const getSectionProgress = (sectionNumber: number) => {
    const key = `section_${sectionNumber}`;
    return sectionProgress[key] || { total_attempts: 0, average_score: 0 };
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
                  {formatSubjectName(params.subject)} - Chapter {chapterNumber}
                </h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1">Loading sections...</p>
              </div>
              <div className="flex items-center gap-4 relative z-[100]">
                <Navigation />
              </div>
            </div>
            
            <div className="max-w-5xl mx-auto">
              <SectionsSkeleton />
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
          <h3 className="font-semibold text-red-800 mb-2">Error Loading Chapter</h3>
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
                {formatSubjectName(params.subject)} - Chapter {chapterNumber}
                {chapterInfo?.name && (
                  <span className="ml-2 text-gray-600">: {chapterInfo.name}</span>
                )}
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                {boardDisplayName} {classDisplayName} • Select a section to start learning
              </p>
            </div>
            <div className="flex items-center gap-4 relative z-[100]">
              <Navigation />
            </div>
          </div>
          
          <div className="max-w-5xl mx-auto">
            {/* Exercise Questions Section */}
            <div className="mb-8">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/50 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-50/30 to-transparent opacity-50"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800 mb-2">📚 Exercise Questions</h2>
                      <p className="text-gray-600 text-sm">Practice with mixed questions from the entire chapter</p>
                    </div>
                    <div className="text-4xl">🏆</div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={handleExerciseClick}
                      className="px-6 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                    >
                      Start Practice
                    </button>
                    <button
                      onClick={() => router.push(`/${params.board}/${params.class}/${params.subject}/${params.chapter}/performance`)}
                      className="px-6 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-lg hover:from-gray-200 hover:to-gray-300 transition-all duration-300 shadow-md hover:shadow-lg"
                    >
                      View Performance
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sections List */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">📖 Chapter Sections</h2>
              
              {sections.map((section) => {
                const progress = getSectionProgress(section.number);
                const progressPercentage = progress.total_attempts > 0 ? Math.min((progress.average_score / 10) * 100, 100) : 0;
                
                return (
                  <div key={section.number} className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/50 relative overflow-hidden hover:shadow-xl transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-50/30 to-transparent opacity-50"></div>
                    
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {section.number}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800">{section.name}</h3>
                            <p className="text-sm text-gray-600">Section {section.number}</p>
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
                          <span>Progress</span>
                          <span>{progressPercentage.toFixed(0)}%</span>
                        </div>
                      </div>
                      
                      {/* ✅ UPDATED: Action Buttons - Primary button now goes to content */}
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleSectionClick(section.number)}
                          className="flex-1 py-2 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253z" />
                          </svg>
                          Learn Content
                        </button>
                        
                        <button
                          onClick={() => handleDirectQuestionsClick(section.number)}
                          className="py-2 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Questions
                        </button>
                        
                        {progress.total_attempts > 0 && (
                          <button
                            onClick={() => handlePerformanceClick(section.number)}
                            className="py-2 px-4 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-lg hover:from-gray-200 hover:to-gray-300 transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Performance
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {sections.length === 0 && (
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-white/50 text-center">
                <div className="text-4xl mb-4">📚</div>
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  No sections available yet
                </h3>
                <p className="text-sm text-gray-500">
                  Sections for this chapter will be available soon
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}