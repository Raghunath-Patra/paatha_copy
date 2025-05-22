// frontend/app/[board]/[class]/[subject]/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navigation from '../../components/navigation/Navigation';
import { getAuthHeaders } from '../../utils/auth';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import { ChevronDown, BarChart3, TrendingUp, BookOpen } from 'lucide-react';

// Define a mapping for subject codes to user-friendly names
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

interface Chapter {
  number: number;
  name: string;
}

interface ChapterProgress {
  chapter_number: number;
  total_questions: number;
  attempted_questions: number;
  average_score: number;
  completion_percentage: number;
  last_activity?: string;
}

interface SubjectPageParams {
  board: string;
  class: string;
  subject: string;
}

export default function SubjectPage() {
  const params = useParams() as unknown as SubjectPageParams;
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [progress, setProgress] = useState<Record<number, ChapterProgress>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const router = useRouter();
  const { profile, loading: authLoading } = useSupabaseAuth();
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (authLoading) return;
        if (!profile) {
          console.log('No profile, redirecting to login');
          router.push('/login');
          return;
        }

        setLoading(true);
        setError(null);

        console.log('Fetching data for:', params);
        const authHeaders = await getAuthHeaders();
        if (!authHeaders.isAuthorized) {
          console.log('No auth headers, redirecting to login');
          router.push('/login');
          return;
        }

        // Fetch chapters
        const chaptersResponse = await fetch(
          `${API_URL}/api/subjects/${params.board}/${params.class}/${params.subject}/chapters`,
          { headers: authHeaders.headers }
        );

        if (!chaptersResponse.ok) {
          throw new Error('Failed to fetch chapters');
        }

        const chaptersData = await chaptersResponse.json();
        console.log('Fetched chapters:', chaptersData);
        setChapters(chaptersData.chapters);

        // Fetch progress for this subject
        try {
          const progressResponse = await fetch(
            `${API_URL}/api/progress/user/${params.board}/${params.class}/${params.subject}`,
            { headers: authHeaders.headers }
          );

          if (progressResponse.ok) {
            const progressData = await progressResponse.json();
            console.log('Fetched progress:', progressData);
            
            // Convert progress array to a map by chapter number
            const progressMap: Record<number, ChapterProgress> = {};
            if (progressData.progress && Array.isArray(progressData.progress)) {
              progressData.progress.forEach((chapterProgress: ChapterProgress) => {
                progressMap[chapterProgress.chapter_number] = chapterProgress;
              });
            }
            setProgress(progressMap);
          }
        } catch (progressError) {
          console.warn('Progress fetch error:', progressError);
          setProgress({});
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    if (params.board && params.class && params.subject) {
      fetchData();
    }
  }, [API_URL, params.board, params.class, params.subject, router, profile, authLoading]);

  const formatSubjectName = (subject: string) => {
    if (!subject) return '';
    
    // Check if we have a mapping for this subject code
    const mappedName = SUBJECT_CODE_TO_NAME[subject.toLowerCase()];
    if (mappedName) {
      return mappedName;
    }
    
    // Fall back to the original formatting logic for unknown codes
    const parts = subject.split('-');
    return parts.map(part => {
      if (/^[IVX]+$/i.test(part)) return part.toUpperCase();
      return part.charAt(0).toUpperCase() + part.slice(1);
    }).join(' ');
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-yellow-500';
    if (percentage >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const handleChapterClick = (chapterNumber: number) => {
    router.push(`/${params.board}/${params.class}/${params.subject}/chapter-${chapterNumber}`);
  };

  const handlePerformanceClick = (chapterNumber: number) => {
    router.push(`/${params.board}/${params.class}/${params.subject}/chapter-${chapterNumber}/performance`);
  };

  const toggleDropdown = (event: React.MouseEvent, chapterNumber: number) => {
    event.stopPropagation(); // Prevent chapter navigation
    setActiveDropdown(activeDropdown === chapterNumber ? null : chapterNumber);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveDropdown(null);
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

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
        <div className="max-w-5xl mx-auto w-full">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-medium mb-2">
                {formatSubjectName(params.subject)}
              </h1>
              <p className="text-neutral-600">
                {boardDisplayName} {classDisplayName}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Navigation />
            </div>
          </div>
          
          {/* Chapters List */}
          <div className="mb-6">
            <h2 className="text-xl font-medium mb-5">Chapters</h2>
            
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
              {chapters.map((chapter, index) => {
                const chapterProgress = progress[chapter.number];
                const hasProgress = chapterProgress && chapterProgress.attempted_questions > 0;
                const completionPercentage = chapterProgress?.completion_percentage || 0;
                const averageScore = chapterProgress?.average_score || 0;
                const attemptedQuestions = chapterProgress?.attempted_questions || 0;
                const totalQuestions = chapterProgress?.total_questions || 0;
                const isDropdownActive = activeDropdown === chapter.number;
                
                return (
                  <div key={chapter.number} className="relative">
                    <div 
                      className={`border-b border-neutral-100 last:border-b-0 ${index === 0 ? '' : ''}`}
                    >
                      <div 
                        className="flex items-center justify-between p-6 cursor-pointer hover:bg-neutral-50 transition-colors duration-200"
                        onClick={() => handleChapterClick(chapter.number)}
                      >
                        <div className="flex items-center flex-1">
                          <div className={`flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold mr-4 flex-shrink-0 ${
                            hasProgress 
                              ? 'bg-blue-100 text-blue-600' 
                              : 'bg-neutral-200 text-neutral-600'
                          }`}>
                            {chapter.number}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                              {chapter.name}
                            </h3>
                            <p className="text-sm text-neutral-600">
                              Chapter {chapter.number}
                            </p>
                          </div>
                        </div>
                        
                        <button
                          className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-all duration-200 ${
                            isDropdownActive
                              ? 'bg-blue-500 text-white border-blue-500'
                              : 'bg-neutral-100 text-neutral-600 border-neutral-200 hover:bg-neutral-200'
                          }`}
                          onClick={(e) => toggleDropdown(e, chapter.number)}
                        >
                          <span>Progress</span>
                          <ChevronDown 
                            className={`w-4 h-4 transition-transform duration-200 ${
                              isDropdownActive ? 'rotate-180' : ''
                            }`} 
                          />
                        </button>
                      </div>
                      
                      {/* Progress Dropdown */}
                      {isDropdownActive && (
                        <div className="absolute top-full right-6 bg-white border border-neutral-200 rounded-lg shadow-lg p-4 w-72 z-10 animate-in slide-in-from-top-2 duration-200">
                          {hasProgress ? (
                            <>
                              <div className="flex items-center gap-2 mb-3">
                                <BarChart3 className="w-4 h-4 text-neutral-600" />
                                <span className="font-semibold text-neutral-900">
                                  Chapter {chapter.number} Progress
                                </span>
                              </div>
                              
                              <div className="w-full bg-neutral-200 rounded-full h-1.5 mb-3">
                                <div
                                  className={`h-1.5 rounded-full transition-all duration-300 ${getProgressColor(completionPercentage)}`}
                                  style={{ width: `${completionPercentage}%` }}
                                ></div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-3 mb-3">
                                <div className="text-center p-2 bg-neutral-50 rounded-lg">
                                  <div className="text-lg font-semibold text-neutral-900">
                                    {averageScore.toFixed(1)}
                                  </div>
                                  <div className="text-xs text-neutral-500 uppercase tracking-wide">
                                    Avg Score
                                  </div>
                                </div>
                                <div className="text-center p-2 bg-neutral-50 rounded-lg">
                                  <div className="text-lg font-semibold text-neutral-900">
                                    {completionPercentage.toFixed(0)}%
                                  </div>
                                  <div className="text-xs text-neutral-500 uppercase tracking-wide">
                                    Complete
                                  </div>
                                </div>
                              </div>
                              
                              <div className="text-center text-sm text-neutral-600 pb-3 border-b border-neutral-100">
                                {attemptedQuestions} of {totalQuestions} questions attempted
                              </div>
                              
                              <div className="pt-3 text-center">
                                <button
                                  onClick={() => handlePerformanceClick(chapter.number)}
                                  className="inline-flex items-center gap-2 text-sm text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-neutral-200 hover:border-blue-200 transition-all duration-200"
                                >
                                  <TrendingUp className="w-4 h-4" />
                                  View Detailed Report
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="text-center py-4">
                              <BookOpen className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                              <p className="text-neutral-600 text-sm">
                                No progress yet. Start practicing to see your stats!
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}