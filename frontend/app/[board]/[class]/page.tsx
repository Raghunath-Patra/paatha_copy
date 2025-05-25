// frontend/app/[board]/[class]/page.tsx - Enhanced with theme
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navigation from '../../components/navigation/Navigation';
import SubjectProgress from '../../components/progress/SubjectProgress';
import { getAuthHeaders } from '../../utils/auth';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import { Home } from 'lucide-react';

interface Subject {
  name: string;
  code: string; // Make code required
  chapters: Array<{
    number: number;
    name: string;
  }>;
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

// Cache configuration
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

interface CachedData {
  subjects: Subject[];
  progress: any;
  timestamp: number;
}

// Enhanced skeleton loading component with theme
const ThemedSkeletonLoader = ({ boardDisplayName, classDisplayName }: { boardDisplayName: string, classDisplayName: string }) => (
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
              {boardDisplayName} {classDisplayName}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Loading your subjects...</p>
          </div>
          <div className="flex items-center gap-4 relative z-[100]">
            <Navigation />
          </div>
        </div>
        
        <div className="max-w-5xl mx-auto">
          {/* Enhanced Skeleton Subject Cards */}
          <div className="space-y-6 pb-6">
            {[1, 2].map((subjectIndex) => (
              <div key={subjectIndex} className="bg-white/90 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-lg border border-white/50 relative overflow-hidden">
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-50/30 to-transparent opacity-50"></div>
                
                <div className="relative z-10">
                  {/* Skeleton Subject Title */}
                  <div className="flex items-center mb-4 sm:mb-6">
                    <div className="h-6 sm:h-7 bg-gradient-to-r from-red-200 to-orange-200 rounded-lg w-32 sm:w-40 animate-pulse"></div>
                    <div className="ml-2 w-8 h-8 bg-gradient-to-r from-orange-200 to-yellow-200 rounded-full animate-pulse"></div>
                  </div>
                  
                  {/* Skeleton Chapters */}
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((chapterIndex) => (
                      <div key={chapterIndex} className="border border-gray-200/60 rounded-lg p-3 sm:p-4 bg-white/60 backdrop-blur-sm hover:shadow-md transition-all duration-200">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            {/* Skeleton Chapter Name */}
                            <div className="flex items-center mb-2">
                              <div className="h-3 sm:h-4 bg-gradient-to-r from-blue-200 to-purple-200 rounded w-4 sm:w-6 mr-2 animate-pulse" 
                                   style={{ animationDelay: `${chapterIndex * 100}ms` }}></div>
                              <div className="h-4 sm:h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-40 sm:w-48 animate-pulse"
                                   style={{ animationDelay: `${chapterIndex * 150}ms` }}></div>
                            </div>
                            
                            {/* Enhanced Progress Bar */}
                            <div className="w-full bg-gray-200/80 rounded-full h-2.5 relative overflow-hidden">
                              <div className="absolute inset-0 bg-gradient-to-r from-red-300 via-orange-300 to-yellow-300 rounded-full animate-pulse" 
                                   style={{ 
                                     width: `${Math.random() * 60 + 20}%`,
                                     animationDelay: `${chapterIndex * 200}ms`,
                                     animationDuration: '2s'
                                   }}>
                              </div>
                              {/* Shimmer effect */}
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
                            </div>
                          </div>
                          
                          {/* Skeleton Dropdown Arrow */}
                          <div className="ml-4 w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full animate-pulse"
                               style={{ animationDelay: `${chapterIndex * 250}ms` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    
    {/* Enhanced CSS with shimmer and gradient effects */}
    <style jsx>{`
      @keyframes shimmer {
        0% {
          transform: translateX(-100%);
        }
        100% {
          transform: translateX(100%);
        }
      }
      
      @keyframes gradientShift {
        0%, 100% {
          background-position: 0% 50%;
        }
        50% {
          background-position: 100% 50%;
        }
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

export default function ClassPage() {
  const params = useParams();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [progress, setProgress] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { profile, loading: authLoading } = useSupabaseAuth();
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  
  // Generate cache key based on board and class (use original params, not normalized)
  const getCacheKey = (board: string, classLevel: string) => {
    // 🔍 Use original params to avoid cache conflicts between different boards
    const originalBoard = typeof params.board === 'string' ? params.board : board;
    const originalClass = typeof params.class === 'string' ? params.class : classLevel;
    const cacheKey = `subjects_${originalBoard}_${originalClass}`;
    console.log('🔍 Cache key generated:', { originalBoard, originalClass, cacheKey });
    return cacheKey;
  };
  
  // Get cached data if available and not expired
  const getCachedData = (board: string, classLevel: string): { subjects: Subject[], progress: any } | null => {
    try {
      const cacheKey = getCacheKey(board, classLevel);
      const cached = sessionStorage.getItem(cacheKey);
      
      console.log('🔍 Checking cache for key:', cacheKey, 'Found:', !!cached);
      
      if (cached) {
        const parsedCache: CachedData = JSON.parse(cached);
        const now = Date.now();
        
        // Check if cache is still valid (not expired)
        if (now - parsedCache.timestamp < CACHE_DURATION) {
          console.log('✅ Using cached subjects and progress data for:', { board, classLevel, cacheKey });
          console.log('📚 Cached subjects:', parsedCache.subjects?.map(s => s.name));
          return { 
            subjects: parsedCache.subjects, 
            progress: parsedCache.progress || {} 
          };
        } else {
          // Cache expired, remove it
          sessionStorage.removeItem(cacheKey);
          console.log('⏰ Cache expired, removing cached data for:', cacheKey);
        }
      }
    } catch (error) {
      console.warn('❌ Error reading cache:', error);
      // If there's an error reading cache, clear it
      try {
        const cacheKey = getCacheKey(board, classLevel);
        sessionStorage.removeItem(cacheKey);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    
    return null;
  };
  
  // Save data to cache
  const setCachedData = (board: string, classLevel: string, subjects: Subject[], progress: any = {}) => {
    try {
      const cacheKey = getCacheKey(board, classLevel);
      const cacheData: CachedData = {
        subjects,
        progress,
        timestamp: Date.now()
      };
      
      sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log('💾 Subjects and progress data cached successfully for:', { 
        board, 
        classLevel, 
        cacheKey,
        subjectCount: subjects.length,
        subjectNames: subjects.map(s => s.name),
        progressKeys: Object.keys(progress)
      });
    } catch (error) {
      console.warn('❌ Error caching data:', error);
      // If storage is full or there's another error, continue without caching
    }
  };
  
  // Clear all cached data (useful for logout or when switching users)
  const clearAllCache = () => {
    try {
      // Clear all cache keys (subjects with progress)
      const keysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('subjects_')) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        sessionStorage.removeItem(key);
      });
      
      console.log('All cache cleared');
    } catch (error) {
      console.warn('Error clearing cache:', error);
    }
  };
  
  // Clear cache when user changes or logs out
  useEffect(() => {
    // If no profile (user logged out), clear cache
    if (!authLoading && !profile) {
      clearAllCache();
    }
  }, [profile, authLoading]);
  
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        if (authLoading) return;
        if (!profile) {
          console.log('No profile, redirecting to login');
          router.push('/login');
          return;
        }

        const board = typeof params.board === 'string' ? params.board.toLowerCase() : '';
        const classLevel = typeof params.class === 'string' ? params.class.toLowerCase() : '';
        
        // 🔍 DEBUG: Log the exact parameters being used
        console.log('🔍 DEBUG - Fetching data for:', {
          originalBoard: params.board,
          originalClass: params.class,
          normalizedBoard: board,
          normalizedClass: classLevel,
          fullUrl: `${API_URL}/api/subjects/${params.board}/${params.class}`
        });
        
        // Check cache first
        const cachedData = getCachedData(board, classLevel);
        if (cachedData) {
          console.log('✅ Using cached data for:', { board, classLevel });
          setSubjects(cachedData.subjects);
          setProgress(cachedData.progress);
          setLoading(false);
          return; // Use cached data, no need to fetch
        }

        setLoading(true);
        setError(null);

        console.log('🌐 Making API calls for:', { board: params.board, class: params.class });
        const authHeaders = await getAuthHeaders();
        if (!authHeaders.isAuthorized) {
          console.log('No auth headers, redirecting to login');
          router.push('/login');
          return;
        }

        // 🔍 DEBUG: Log exact API URLs being called
        const subjectsUrl = `${API_URL}/api/subjects/${params.board}/${params.class}`;
        const progressUrl = `${API_URL}/api/progress/user/${params.board}/${params.class}`;
        
        console.log('🔍 API URLs:', { subjectsUrl, progressUrl });

        // Only fetch subjects list (without chapters)
        const subjectsResponse = await fetch(subjectsUrl, { headers: authHeaders.headers });

        if (!subjectsResponse.ok) {
          throw new Error(`Failed to fetch subjects. Status: ${subjectsResponse.status}, URL: ${subjectsUrl}`);
        }

        const subjectsData = await subjectsResponse.json();
        console.log('📚 Fetched subjects data:', {
          board: params.board,
          class: params.class,
          subjectCount: subjectsData.subjects?.length,
          firstSubject: subjectsData.subjects?.[0],
          allSubjectNames: subjectsData.subjects?.map((s: any) => s.name)
        });
        
        // Keep the full subject data structure (with chapters)
        setSubjects(subjectsData.subjects || []);
        
        // Fetch progress data
        let progressData = {};
        try {
          const progressResponse = await fetch(progressUrl, { headers: authHeaders.headers });

          if (progressResponse.ok) {
            const progressResponse_data = await progressResponse.json();
            console.log('📊 Fetched progress data:', {
              board: params.board,
              class: params.class,
              progressKeys: Object.keys(progressResponse_data.progress || {}),
              progressData: progressResponse_data.progress
            });
            progressData = progressResponse_data.progress || {};
            setProgress(progressData);
          }
        } catch (progressError) {
          console.warn('Progress fetch error:', progressError);
          setProgress({});
        }
        
        // Cache the fetched data (both subjects and progress)
        setCachedData(board, classLevel, subjectsData.subjects || [], progressData);

      } catch (error) {
        console.error('❌ Error fetching subjects:', error);
        setError(error instanceof Error ? error.message : 'Failed to load subjects');
      } finally {
        setLoading(false);
      }
    };

    if (params.board && params.class) {
      fetchSubjects();
    }
  }, [API_URL, params.board, params.class, router, profile, authLoading]);

  const board = typeof params.board === 'string' ? params.board.toLowerCase() : '';
  const classLevel = typeof params.class === 'string' ? params.class.toLowerCase() : '';
  
  // Get friendly display names for board and class
  const boardDisplayName = BOARD_DISPLAY_NAMES[board] || board?.toUpperCase() || '';
  const classDisplayName = CLASS_DISPLAY_NAMES[classLevel] || classLevel?.toUpperCase() || '';

  if (loading) {
    return <ThemedSkeletonLoader boardDisplayName={boardDisplayName} classDisplayName={classDisplayName} />;
  }

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
          <h3 className="font-semibold text-red-800 mb-2">Error Loading Data</h3>
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
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-medium text-gray-800">
                {boardDisplayName} {classDisplayName}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                Select a subject to start your learning journey
              </p>
            </div>
            <div className="flex items-center gap-4 relative z-[100]">
              <Navigation />
            </div>
          </div>
          
          <div className="max-w-5xl mx-auto">
            <SubjectProgress
              board={board}
              classLevel={classLevel}
              subjects={subjects}
              progress={progress}
            />
          </div>
        </div>
      </div>
    </div>
  );
}