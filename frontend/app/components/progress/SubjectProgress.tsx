// frontend/app/components/progress/SubjectProgress.tsx

'use client';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthHeaders } from '../../utils/auth';
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react';

interface ChapterProgress {
  attempted: number;
  total: number;
  averageScore: number;
}

interface Chapter {
  number: number;
  name: string;
}

interface Subject {
  name: string;
  code: string;
}

interface Props {
  board: string;
  classLevel: string;
  subjects: Subject[]; // Now only contains name and code, no chapters
  fetchSubjectChapters: (subjectCode: string) => Promise<Chapter[] | null>;
  fetchSubjectProgress: (subjectCode: string) => Promise<any>;
}

interface LoadedSubjectData {
  chapters: Chapter[];
  progress: { [chapter: string]: ChapterProgress };
}

export default function SubjectProgress({ 
  board, 
  classLevel, 
  subjects, 
  fetchSubjectChapters, 
  fetchSubjectProgress 
}: Props) {
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [loadedSubjects, setLoadedSubjects] = useState<Map<string, LoadedSubjectData>>(new Map());
  const [loadingSubjects, setLoadingSubjects] = useState<Set<string>>(new Set());
  const router = useRouter();

  const getProgressColor = (score: number) => {
    if (score >= 8) return 'bg-green-500';
    if (score >= 6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getProgressWidth = (attempted: number, total: number) => {
    if (total === 0) {
      if (attempted > 0) return '100%';
      return '0%';
    }
    const percentage = Math.min((attempted / total) * 100, 100);
    return `${percentage}%`;
  };

  const getChapterProgress = useCallback((subjectCode: string, chapterNum: number): ChapterProgress => {
    const subjectData = loadedSubjects.get(subjectCode);
    if (!subjectData?.progress) {
      return { attempted: 0, total: 0, averageScore: 0 };
    }
    
    return subjectData.progress[chapterNum] || { attempted: 0, total: 0, averageScore: 0 };
  }, [loadedSubjects]);

  const handleChapterClick = async (subjectCode: string, chapterNum: number) => {
    try {
      console.log(`Navigating to chapter with subject: ${subjectCode}`);
      const chapterUrl = `/${board}/${classLevel}/${subjectCode}/chapter-${chapterNum}`;
      
      const { headers, isAuthorized } = await getAuthHeaders();
      if (!isAuthorized) {
        router.push('/login');
        return;
      }
      const API_URL = process.env.NEXT_PUBLIC_API_URL;

      // First try to get a random question for this chapter
      try {
        const response = await fetch(
          `${API_URL}/api/questions/${board}/${classLevel}/${subjectCode}/chapter-${chapterNum}/random`,
          { headers }
        );
        
        if (response.ok) {
          const question = await response.json();
          router.push(`${chapterUrl}?q=${question.id}`);
        } else {
          console.log('No random question available, going to chapter page');
          router.push(chapterUrl);
        }
      } catch (error) {
        console.error('Error fetching initial question:', error);
        router.push(chapterUrl);
      }
    } catch (error) {
      console.error('Error handling chapter click:', error);
      router.push(`/${board}/${classLevel}`);
    }
  };

  const toggleSubjectExpansion = async (subject: Subject) => {
    const isCurrentlyExpanded = expandedSubjects.has(subject.code);
    
    if (isCurrentlyExpanded) {
      // Collapse subject
      setExpandedSubjects(prev => {
        const newSet = new Set(prev);
        newSet.delete(subject.code);
        return newSet;
      });
    } else {
      // Expand subject
      setExpandedSubjects(prev => new Set(prev).add(subject.code));
      
      // If not already loaded, fetch chapters and progress
      if (!loadedSubjects.has(subject.code)) {
        setLoadingSubjects(prev => new Set(prev).add(subject.code));
        
        try {
          const [chapters, progress] = await Promise.all([
            fetchSubjectChapters(subject.code),
            fetchSubjectProgress(subject.code)
          ]);

          if (chapters) {
            setLoadedSubjects(prev => new Map(prev).set(subject.code, {
              chapters,
              progress: progress || {}
            }));
          }
        } catch (error) {
          console.error('Error loading subject data:', error);
        } finally {
          setLoadingSubjects(prev => {
            const newSet = new Set(prev);
            newSet.delete(subject.code);
            return newSet;
          });
        }
      }
    }
  };

  const toggleChapterExpansion = (subjectCode: string, chapterNum: number) => {
    const key = `${subjectCode}-${chapterNum}`;
    setExpandedChapters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const isSubjectExpanded = (subjectCode: string) => {
    return expandedSubjects.has(subjectCode);
  };

  const isChapterExpanded = (subjectCode: string, chapterNum: number) => {
    return expandedChapters.has(`${subjectCode}-${chapterNum}`);
  };

  const isSubjectLoading = (subjectCode: string) => {
    return loadingSubjects.has(subjectCode);
  };

  return (
    <div className="space-y-4 pb-6">
      {subjects.map((subject) => {
        const isExpanded = isSubjectExpanded(subject.code);
        const isLoading = isSubjectLoading(subject.code);
        const subjectData = loadedSubjects.get(subject.code);

        return (
          <div key={subject.code} className="bg-white rounded-lg p-6 shadow-sm">
            {/* Subject Header */}
            <div 
              className="flex items-center justify-between cursor-pointer hover:bg-gray-50 -m-2 p-2 rounded"
              onClick={() => toggleSubjectExpansion(subject)}
            >
              <h2 className="text-xl font-medium text-gray-800">
                {subject.name}:
              </h2>
              
              <div className="flex items-center">
                {isLoading && (
                  <Loader2 size={20} className="text-gray-400 animate-spin mr-2" />
                )}
                {isExpanded ? (
                  <ChevronDown size={24} className="text-gray-600" />
                ) : (
                  <ChevronRight size={24} className="text-gray-600" />
                )}
              </div>
            </div>
            
            {/* Chapters List */}
            {isExpanded && (
              <div className="mt-4 space-y-3">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={24} className="animate-spin text-gray-400 mr-2" />
                    <span className="text-gray-600">Loading chapters...</span>
                  </div>
                ) : subjectData?.chapters ? (
                  subjectData.chapters.map((chapter) => {
                    const chapterProgress = getChapterProgress(subject.code, chapter.number);
                    const chapterExpanded = isChapterExpanded(subject.code, chapter.number);

                    return (
                      <div key={chapter.number} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div 
                            className="flex-1 cursor-pointer"
                            onClick={() => handleChapterClick(subject.code, chapter.number)}
                          >
                            <div className="flex items-center mb-2">
                              <span className="text-gray-600 text-sm font-medium mr-2">
                                {chapter.number}.
                              </span>
                              <span className="text-gray-800 font-medium">
                                {chapter.name}
                              </span>
                            </div>
                            
                            {/* Horizontal Progress Bar */}
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  getProgressColor(chapterProgress.averageScore)}`}
                                style={{ 
                                  width: getProgressWidth(chapterProgress.attempted, chapterProgress.total),
                                  opacity: 0.8
                                }}
                              />
                            </div>
                          </div>
                          
                          {/* Chapter Dropdown Arrow */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleChapterExpansion(subject.code, chapter.number);
                            }}
                            className="ml-4 p-1 hover:bg-gray-200 rounded-full transition-colors"
                          >
                            {chapterExpanded ? (
                              <ChevronDown size={16} className="text-gray-600" />
                            ) : (
                              <ChevronRight size={16} className="text-gray-600" />
                            )}
                          </button>
                        </div>
                        
                        {/* Chapter Expanded Details */}
                        {chapterExpanded && (
                          <div className="mt-3 pt-3 border-t border-gray-200 text-sm text-gray-600">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <span className="font-medium">Progress:</span>
                                <span className="ml-2">
                                  {chapterProgress.attempted}/{Math.max(chapterProgress.attempted, chapterProgress.total)} questions
                                </span>
                              </div>
                              <div>
                                <span className="font-medium">Average Score:</span>
                                <span className="ml-2">
                                  {chapterProgress.averageScore.toFixed(1)}/10
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    Failed to load chapters. Please try again.
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}