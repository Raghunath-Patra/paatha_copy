// frontend/app/[board]/[class]/page.tsx

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

export default function ClassPage() {
  const params = useParams();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [progress, setProgress] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { profile, loading: authLoading } = useSupabaseAuth();
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  
  // Generate cache key based on board and class
  const getCacheKey = (board: string, classLevel: string) => {
    return `subjects_${board}_${classLevel}`;
  };
  
  // Get cached data if available and not expired
  const getCachedData = (board: string, classLevel: string): { subjects: Subject[], progress: any } | null => {
    try {
      const cacheKey = getCacheKey(board, classLevel);
      const cached = sessionStorage.getItem(cacheKey);
      
      if (cached) {
        const parsedCache: CachedData = JSON.parse(cached);
        const now = Date.now();
        
        // Check if cache is still valid (not expired)
        if (now - parsedCache.timestamp < CACHE_DURATION) {
          console.log('Using cached subjects and progress data');
          return { 
            subjects: parsedCache.subjects, 
            progress: parsedCache.progress || {} 
          };
        } else {
          // Cache expired, remove it
          sessionStorage.removeItem(cacheKey);
          console.log('Cache expired, removing cached data');
        }
      }
    } catch (error) {
      console.warn('Error reading cache:', error);
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
      console.log('Subjects and progress data cached successfully');
    } catch (error) {
      console.warn('Error caching data:', error);
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
        
        // Check cache first
        const cachedData = getCachedData(board, classLevel);
        if (cachedData) {
          setSubjects(cachedData.subjects);
          setProgress(cachedData.progress);
          setLoading(false);
          return; // Use cached data, no need to fetch
        }

        setLoading(true);
        setError(null);

        console.log('Fetching subjects for:', params);
        const authHeaders = await getAuthHeaders();
        if (!authHeaders.isAuthorized) {
          console.log('No auth headers, redirecting to login');
          router.push('/login');
          return;
        }

        // Only fetch subjects list (without chapters)
        const subjectsResponse = await fetch(
          `${API_URL}/api/subjects/${params.board}/${params.class}`,
          { headers: authHeaders.headers }
        );

        if (!subjectsResponse.ok) {
          throw new Error('Failed to fetch subjects');
        }

        const subjectsData = await subjectsResponse.json();
        console.log('Fetched subjects:', subjectsData);
        
        // Keep the full subject data structure (with chapters)
        setSubjects(subjectsData.subjects || []);
        
        // Fetch progress data
        let progressData = {};
        try {
          const progressResponse = await fetch(
            `${API_URL}/api/progress/user/${params.board}/${params.class}`,
            { headers: authHeaders.headers }
          );

          if (progressResponse.ok) {
            const progressResponse_data = await progressResponse.json();
            console.log('Fetched progress:', progressResponse_data);
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
        console.error('Error fetching subjects:', error);
        setError(error instanceof Error ? error.message : 'Failed to load subjects');
      } finally {
        setLoading(false);
      }
    };

    if (params.board && params.class) {
      fetchSubjects();
    }
  }, [API_URL, params.board, params.class, router, profile, authLoading]);

  // Function to fetch chapters for a specific subject (with caching)
  const fetchSubjectChapters = async (subjectCode: string) => {
    try {
      // Check cache first
      const chaptersCacheKey = `chapters_${board}_${classLevel}_${subjectCode}`;
      try {
        const cachedChapters = sessionStorage.getItem(chaptersCacheKey);
        if (cachedChapters) {
          const parsedCache = JSON.parse(cachedChapters);
          const now = Date.now();
          
          if (now - parsedCache.timestamp < CACHE_DURATION) {
            console.log('Using cached chapters data for:', subjectCode);
            return parsedCache.chapters;
          } else {
            sessionStorage.removeItem(chaptersCacheKey);
          }
        }
      } catch (cacheError) {
        console.warn('Error reading chapters cache:', cacheError);
      }

      const authHeaders = await getAuthHeaders();
      if (!authHeaders.isAuthorized) {
        router.push('/login');
        return null;
      }

      const response = await fetch(
        `${API_URL}/api/subjects/${params.board}/${params.class}/${subjectCode}/chapters`,
        { headers: authHeaders.headers }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch chapters');
      }

      const data = await response.json();
      
      // Cache the chapters data
      try {
        const cacheData = {
          chapters: data.chapters,
          timestamp: Date.now()
        };
        sessionStorage.setItem(chaptersCacheKey, JSON.stringify(cacheData));
        console.log('Chapters data cached for:', subjectCode);
      } catch (cacheError) {
        console.warn('Error caching chapters:', cacheError);
      }
      
      return data.chapters;
    } catch (error) {
      console.error('Error fetching chapters:', error);
      return null;
    }
  };

  // Function to fetch progress for a specific subject (with caching)
  const fetchSubjectProgress = async (subjectCode: string) => {
    try {
      // Check cache first
      const progressCacheKey = `progress_${board}_${classLevel}_${subjectCode}`;
      try {
        const cachedProgress = sessionStorage.getItem(progressCacheKey);
        if (cachedProgress) {
          const parsedCache = JSON.parse(cachedProgress);
          const now = Date.now();
          
          // Use shorter cache duration for progress (5 minutes) since it changes more frequently
          const PROGRESS_CACHE_DURATION = 5 * 60 * 1000;
          
          if (now - parsedCache.timestamp < PROGRESS_CACHE_DURATION) {
            console.log('Using cached progress data for:', subjectCode);
            return parsedCache.progress;
          } else {
            sessionStorage.removeItem(progressCacheKey);
          }
        }
      } catch (cacheError) {
        console.warn('Error reading progress cache:', cacheError);
      }

      const authHeaders = await getAuthHeaders();
      if (!authHeaders.isAuthorized) {
        return {};
      }

      const response = await fetch(
        `${API_URL}/api/progress/user/${params.board}/${params.class}/${subjectCode}`,
        { headers: authHeaders.headers }
      );

      let progressData = {};
      if (response.ok) {
        const data = await response.json();
        progressData = data.progress || {};
        
        // Cache the progress data
        try {
          const cacheData = {
            progress: progressData,
            timestamp: Date.now()
          };
          sessionStorage.setItem(progressCacheKey, JSON.stringify(cacheData));
          console.log('Progress data cached for:', subjectCode);
        } catch (cacheError) {
          console.warn('Error caching progress:', cacheError);
        }
      }
      
      return progressData;
    } catch (error) {
      console.warn('Progress fetch error for subject:', subjectCode, error);
      return {};
    }
  };

  const board = typeof params.board === 'string' ? params.board.toLowerCase() : '';
  const classLevel = typeof params.class === 'string' ? params.class.toLowerCase() : '';
  
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-red-600 bg-red-50 p-4 rounded-lg max-w-md text-center">
          <h3 className="font-medium mb-2">Error Loading Data</h3>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Get friendly display names for board and class
  const boardDisplayName = BOARD_DISPLAY_NAMES[board] || board?.toUpperCase() || '';
  const classDisplayName = CLASS_DISPLAY_NAMES[classLevel] || classLevel?.toUpperCase() || '';

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <div className="container-fluid px-8 py-6">
        <div className="max-w-[1600px] mx-auto w-full">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-medium">
              {boardDisplayName} {classDisplayName}
            </h1>
            <div className="flex items-center gap-4">
              <Navigation />
            </div>
          </div>
          
          <div className="max-w-5xl mx-auto overflow-y-auto">
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