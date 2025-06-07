// frontend/app/[board]/[class]/[subject]/[chapter]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navigation from '../../../../components/navigation/Navigation';
import SectionProgress from '../../../../components/progress/SectionProgress';
import { getAuthHeaders } from '../../../../utils/auth';
import { useSupabaseAuth } from '../../../../contexts/SupabaseAuthContext';
import { userTokenService } from '../../../../utils/userTokenService';

interface Section {
  number: number;
  name: string;
  question_count: number;
  difficulty_distribution?: {
    easy: number;
    medium: number;
    hard: number;
  };
}

interface ChapterInfo {
  number: number;
  name: string;
  sections: Section[];
  total_questions: number;
}

// Define display name mappings
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

// Cache configuration
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

interface CachedSectionData {
  chapterInfo: ChapterInfo;
  progress: any;
  timestamp: number;
}

// Enhanced skeleton loading component
const ThemedSectionsSkeleton = ({ 
  boardDisplayName, 
  classDisplayName, 
  subjectDisplayName, 
  chapterDisplayName 
}: { 
  boardDisplayName: string;
  classDisplayName: string;
  subjectDisplayName: string;
  chapterDisplayName: string;
}) => (
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
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-medium text-gray-800">
              {subjectDisplayName} - Chapter {chapterDisplayName}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              {boardDisplayName} {classDisplayName} • Loading sections...
            </p>
          </div>
          <div className="flex items-center gap-4 relative z-[100]">
            <Navigation />
          </div>
        </div>
        
        <div className="max-w-5xl mx-auto">
          {/* Exercise Questions Card Skeleton */}
          <div className="mb-6 bg-white/90 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-lg border border-white/50 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-50/30 to-transparent opacity-50"></div>
            
            <div className="relative z-10">
              <div className="flex items-center mb-4">
                <div className="h-6 sm:h-7 bg-gradient-to-r from-green-200 to-emerald-200 rounded-lg w-40 sm:w-48 animate-pulse"></div>
                <div className="ml-2 w-8 h-8 bg-gradient-to-r from-green-200 to-emerald-200 rounded-full animate-pulse"></div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-3/4 animate-pulse"></div>
                  <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/2 animate-pulse"></div>
                </div>
                <div className="h-10 bg-gradient-to-r from-green-200 to-emerald-200 rounded-lg w-24 sm:w-32 animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Sections Skeleton */}
          <div className="space-y-4">
            <div className="h-6 bg-gradient-to-r from-blue-200 to-indigo-200 rounded w-32 animate-pulse mb-4"></div>
            
            {[1, 2, 3, 4].map((sectionIndex) => (
              <div key={sectionIndex} className="border border-gray-200/60 rounded-lg p-4 sm:p-6 bg-white/90 backdrop-blur-sm hover:shadow-md transition-all duration-200 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50/30 to-transparent opacity-50"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {/* Section Name */}
                      <div className="flex items-center mb-3">
                        <div className="h-4 sm:h-5 bg-gradient-to-r from-blue-200 to-purple-200 rounded w-6 sm:w-8 mr-3 animate-pulse" 
                             style={{ animationDelay: `${sectionIndex * 100}ms` }}></div>
                        <div className="h-5 sm:h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-48 sm:w-64 animate-pulse"
                             style={{ animationDelay: `${sectionIndex * 150}ms` }}></div>
                      </div>
                      
                      {/* Stats */}
                      <div className="flex items-center gap-4 mb-3">
                        <div className="h-4 bg-gradient-to-r from-orange-200 to-yellow-200 rounded w-24 animate-pulse"
                             style={{ animationDelay: `${sectionIndex * 200}ms` }}></div>
                        <div className="h-4 bg-gradient-to-r from-green-200 to-emerald-200 rounded w-20 animate-pulse"
                             style={{ animationDelay: `${sectionIndex * 250}ms` }}></div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200/80 rounded-full h-2.5 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 rounded-full animate-pulse" 
                             style={{ 
                               width: `${Math.random() * 60 + 20}%`,
                               animationDelay: `${sectionIndex * 300}ms`,
                               animationDuration: '2s'
                             }}>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
                      </div>
                    </div>
                    
                    {/* Start Button Skeleton */}
                    <div className="ml-6 h-10 bg-gradient-to-r from-blue-200 to-indigo-200 rounded-lg w-20 sm:w-24 animate-pulse"
                         style={{ animationDelay: `${sectionIndex * 350}ms` }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    
    {/* Enhanced CSS with shimmer effects */}
    <style jsx>{`
      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
      
      @keyframes gradientShift {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }
      
      .animate-shimmer {
        animation: shimmer 2s infinite;
      }
      
      .animate-pulse {
        background-size: 200% 200%;
        animation: gradientShift 2s ease infinite;
      }
    `}</style>
  </div>
);

export default function ChapterSectionsPage() {
  const params = useParams();
  const [chapterInfo, setChapterInfo] = useState<ChapterInfo | null>(null);
  const [progress, setProgress] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { profile, loading: authLoading } = useSupabaseAuth();
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  
  // Generate cache key for sections
  const getCacheKey = (board: string, classLevel: string, subject: string, chapter: string) => {
    return `sections_${board}_${classLevel}_${subject}_${chapter}`;
  };
  
  // Get cached sections data
  const getCachedData = (board: string, classLevel: string, subject: string, chapter: string) => {
    try {
      const cacheKey = getCacheKey(board, classLevel, subject, chapter);
      const cached = sessionStorage.getItem(cacheKey);
      
      if (cached) {
        const parsedCache: CachedSectionData = JSON.parse(cached);
        const now = Date.now();
        
        if (now - parsedCache.timestamp < CACHE_DURATION) {
          console.log('✅ Using cached sections data');
          return { 
            chapterInfo: parsedCache.chapterInfo, 
            progress: parsedCache.progress || {} 
          };
        } else {
          sessionStorage.removeItem(cacheKey);
        }
      }
    } catch (error) {
      console.warn('❌ Error reading sections cache:', error);
    }
    
    return null;
  };
  
  // Save sections data to cache
  const setCachedData = (board: string, classLevel: string, subject: string, chapter: string, chapterInfo: ChapterInfo, progress: any = {}) => {
    try {
      const cacheKey = getCacheKey(board, classLevel, subject, chapter);
      const cacheData: CachedSectionData = {
        chapterInfo,
        progress,
        timestamp: Date.now()
      };
      
      sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log('💾 Sections data cached successfully');
    } catch (error) {
      console.warn('❌ Error caching sections data:', error);
    }
  };

  // Clear cache when user logs out
  useEffect(() => {
    if (!authLoading && !profile) {
      // Clear all cache
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && key.startsWith('sections_')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => sessionStorage.removeItem(key));
        userTokenService.clearCache();
      } catch (error) {
        console.warn('Error clearing cache:', error);
      }
    }
  }, [profile, authLoading]);

  useEffect(() => {
    const fetchSectionsData = async () => {
      try {
        if (authLoading) return;
        if (!profile) {
          router.push('/login');
          return;
        }

        const board = typeof params.board === 'string' ? params.board.toLowerCase() : '';
        const classLevel = typeof params.class === 'string' ? params.class.toLowerCase() : '';
        const subject = typeof params.subject === 'string' ? params.subject.toLowerCase() : '';
        const chapter = typeof params.chapter === 'string' ? params.chapter.replace(/^chapter-/, '') : '';
        
        // Check cache first
        const cachedData = getCachedData(board, classLevel, subject, chapter);
        if (cachedData) {
          setChapterInfo(cachedData.chapterInfo);
          setProgress(cachedData.progress);
          setLoading(false);
          userTokenService.fetchUserTokenStatus();
          return;
        }

        setLoading(true);
        setError(null);

        const authHeaders = await getAuthHeaders();
        if (!authHeaders.isAuthorized) {
          router.push('/login');
          return;
        }

        // Fetch sections data
        const sectionsUrl = `${API_URL}/api/subjects/${params.board}/${params.class}/${params.subject}/${chapter}/sections`;
        const progressUrl = `${API_URL}/api/progress/user/${params.board}/${params.class}/${params.subject}/${chapter}/sections`;
        
        console.log('🔍 Fetching sections from:', sectionsUrl);

        const sectionsResponse = await fetch(sectionsUrl, { headers: authHeaders.headers });

        if (!sectionsResponse.ok) {
          throw new Error(`Failed to fetch sections. Status: ${sectionsResponse.status}`);
        }

        const sectionsData = await sectionsResponse.json();
        console.log('📚 Fetched sections data:', sectionsData);
        
        setChapterInfo(sectionsData);
        
        // Fetch progress data
        let progressData = {};
        try {
          const progressResponse = await fetch(progressUrl, { headers: authHeaders.headers });
          if (progressResponse.ok) {
            const progressResponseData = await progressResponse.json();
            progressData = progressResponseData.progress || {};
            setProgress(progressData);
          }
        } catch (progressError) {
          console.warn('Progress fetch error:', progressError);
          setProgress({});
        }
        
        // Cache the data
        setCachedData(board, classLevel, subject, chapter, sectionsData, progressData);
        
        // Initialize token service
        userTokenService.fetchUserTokenStatus();

      } catch (error) {
        console.error('❌ Error fetching sections:', error);
        setError(error instanceof Error ? error.message : 'Failed to load sections');
      } finally {
        setLoading(false);
      }
    };

    if (params.board && params.class && params.subject && params.chapter) {
      fetchSectionsData();
    }
  }, [API_URL, params.board, params.class, params.subject, params.chapter, router, profile, authLoading]);

  // Format subject name
  const formatSubjectName = (subject: string) => {
    if (!subject) return '';
    
    const mappedName = SUBJECT_CODE_TO_NAME[subject.toLowerCase()];
    if (mappedName) return mappedName;
    
    const parts = subject.split('-');
    return parts.map(part => {
      if (/^[IVX]+$/i.test(part)) return part.toUpperCase();
      return part.charAt(0).toUpperCase() + part.slice(1);
    }).join(' ');
  };

  const board = typeof params.board === 'string' ? params.board.toLowerCase() : '';
  const classLevel = typeof params.class === 'string' ? params.class.toLowerCase() : '';
  const subject = typeof params.subject === 'string' ? params.subject : '';
  const chapter = typeof params.chapter === 'string' ? params.chapter.replace(/^chapter-/, '') : '';
  
  // Get display names
  const boardDisplayName = BOARD_DISPLAY_NAMES[board] || board?.toUpperCase() || '';
  const classDisplayName = CLASS_DISPLAY_NAMES[classLevel] || classLevel?.toUpperCase() || '';
  const subjectDisplayName = formatSubjectName(subject);
  
  if (loading) {
    return (
      <ThemedSectionsSkeleton 
        boardDisplayName={boardDisplayName}
        classDisplayName={classDisplayName}
        subjectDisplayName={subjectDisplayName}
        chapterDisplayName={chapter}
      />
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
          <h3 className="font-semibold text-red-800 mb-2">Error Loading Sections</h3>
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
          {/* Header */}
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-medium text-gray-800">
                {subjectDisplayName} - Chapter {chapter}
                {chapterInfo?.name && (
                  <span className="ml-2 text-orange-600">: {chapterInfo.name}</span>
                )}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                {boardDisplayName} {classDisplayName} • Choose a section or try exercise questions
              </p>
            </div>
            <div className="flex items-center gap-4 relative z-[100]">
              <Navigation />
            </div>
          </div>
          
          <div className="max-w-5xl mx-auto">
            {/* Exercise Questions Card */}
            <div className="mb-8 bg-white/90 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-lg border border-white/50 relative overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-50/30 to-transparent opacity-50"></div>
              
              <div className="relative z-10">
                <div className="flex items-center mb-4">
                  <h2 className="text-xl sm:text-2xl font-semibold text-green-800 flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    Exercise Questions
                  </h2>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div className="space-y-2">
                    <p className="text-gray-700 text-base sm:text-lg">
                      Practice questions covering the entire chapter
                    </p>
                    <p className="text-gray-600 text-sm">
                      {chapterInfo?.total_questions || 0} questions available • Mixed difficulty
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      router.push(`/${params.board}/${params.class}/${params.subject}/${params.chapter}/exercise`);
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-md hover:shadow-lg font-medium whitespace-nowrap"
                  >
                    Start Practice
                  </button>
                </div>
              </div>
            </div>

            {/* Sections List */}
            {chapterInfo?.sections && chapterInfo.sections.length > 0 ? (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  Sections
                </h2>
                
                <SectionProgress
                  board={board}
                  classLevel={classLevel}
                  subject={subject}
                  chapter={chapter}
                  sections={chapterInfo.sections}
                  progress={progress}
                />
              </div>
            ) : (
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-8 text-center shadow-lg border border-white/50">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">No sections available</h3>
                <p className="text-gray-600 mb-4">
                  This chapter doesn't have separate sections. You can still practice exercise questions covering the entire chapter.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}