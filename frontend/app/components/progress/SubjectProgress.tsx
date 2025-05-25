// frontend/app/components/progress/SubjectProgress.tsx - Enhanced with theme
'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthHeaders } from '../../utils/auth';
import { ChevronDown, ChevronRight, BookOpen, Target, TrendingUp } from 'lucide-react';

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
  code?: string;
  chapters: Chapter[];
}

interface Props {
  board: string;
  classLevel: string;
  subjects: Subject[];
  progress: {
    [subject: string]: {
      [chapter: string]: ChapterProgress;
    };
  };
}

export default function SubjectProgress({ board, classLevel, subjects, progress }: Props) {
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const router = useRouter();

  // Add debugging logs
  console.log('SubjectProgress props:', { board, classLevel, subjects, progress });
  console.log('Progress keys:', Object.keys(progress || {}));

  const getProgressColor = (score: number) => {
    if (score >= 8) return 'bg-gradient-to-r from-green-400 to-green-500';
    if (score >= 6) return 'bg-gradient-to-r from-yellow-400 to-orange-400';
    return 'bg-gradient-to-r from-red-400 to-red-500';
  };

  const getProgressWidth = (attempted: number, total: number) => {
    if (total === 0) {
      // If there are attempts but no questions found, show full progress
      if (attempted > 0) return '100%';
      return '0%';
    }
    const percentage = Math.min((attempted / total) * 100, 100);
    return `${percentage}%`;
  };

  const getChapterProgress = useCallback((subject: string, chapterNum: number): ChapterProgress => {
    // First create a map of subject codes and normalized names for lookup
    const subjectMappings = new Map();
    
    // Map both ways - from code to name and name to code
    subjects.forEach(subj => {
      const normalizedName = subj.name.toLowerCase().replace(/\s+/g, '-');
      const subjectCode = subj.code?.toLowerCase();
      
      if (subjectCode) {
        subjectMappings.set(subjectCode, normalizedName);
        subjectMappings.set(normalizedName, subjectCode);
        // Also map space-separated version
        subjectMappings.set(subj.name.toLowerCase().replace(/\s+/g, ' '), subjectCode);
        
        // Handle shared subjects between Karnataka and CBSE
        if (board === 'karnataka') {
          // Map Karnataka subject names/codes to CBSE subject codes
          const sharedSubjectMappings: Record<string, string> = {
            'science': classLevel === '8th' ? 'hesc1dd' : 
                        classLevel === '9th' ? 'iesc1dd' : 
                        classLevel === '10th' ? 'jesc1dd' : '',
            'mathematics': classLevel === '8th' ? 'hemh1dd' : 
                            classLevel === '9th' ? 'iemh1dd' : 
                            classLevel === '10th' ? 'jemh1dd' : '',
            'physics': 'keph1dd',
            'chemistry': 'kech1dd',
            'chemistry-1': 'lech1dd',
            'chemistry-2': 'lech2dd',
            'physics-1': 'leph1dd',
            'physics-2': 'leph2dd',
            'biology': 'kebo1dd',
            'mathematics-1': 'lemh1dd',
            'mathematics-2': 'lemh2dd',
          };
          
          const cbseCode = sharedSubjectMappings[subjectCode];
          if (cbseCode) {
            // Add mapping from Karnataka code/name to CBSE code
            subjectMappings.set(subjectCode, cbseCode);
            subjectMappings.set(normalizedName, cbseCode);
            subjectMappings.set(subj.name.toLowerCase().replace(/\s+/g, ' '), cbseCode);

            // IMPORTANT: Also add reverse mapping from CBSE code back to Karnataka code
            subjectMappings.set(cbseCode, subjectCode);
          }
        }
      }
    });
    
    // Normalize the input subject
    const normalizedSubject = subject.toLowerCase().replace(/\s+/g, '-');
    
    // Try all possible keys for this subject
    const possibleKeys = [
      normalizedSubject, // As provided
      normalizedSubject.replace(/-/g, ' '), // Replace dashes with spaces
      subjectMappings.get(normalizedSubject), // Map to code (now includes source subject)
    ];
    
    // Add all possible mappings we can find
    let currentKey = normalizedSubject;
    while (subjectMappings.has(currentKey) && !possibleKeys.includes(subjectMappings.get(currentKey))) {
      currentKey = subjectMappings.get(currentKey);
      possibleKeys.push(currentKey);
    }
    
    // Filter out undefined values
    const validKeys = possibleKeys.filter(Boolean);
    
    console.log(`Looking for progress for subject: ${subject}, normalized: ${normalizedSubject}`);
    console.log('Possible keys to try:', validKeys);
    console.log('Available progress keys:', Object.keys(progress || {}));
    
    // Look for progress using all possible keys
    for (const key of validKeys) {
      if (key && progress?.[key]?.[chapterNum]) {
        console.log(`Found progress with key: ${key}`);
        return progress[key][chapterNum];
      }
    }
    // Default empty progress
    return {
      attempted: 0,
      total: 0,
      averageScore: 0
    };
  }, [subjects, progress, board, classLevel]);

  const handleChapterClick = async (subject: string, chapterNum: number) => {
    try {
      // Get the subject code if available, otherwise use the display name
      const normalizedSubject = subject.toLowerCase().replace(/\s+/g, '-');
      const subjectObj = subjects.find(s => s.name.toLowerCase() === subject.toLowerCase());
      
      // Use code if available, otherwise use the normalized name
      const subjectParam = subjectObj?.code || normalizedSubject;
      
      console.log(`Navigating to chapter with subject: ${subjectParam}`);
      const chapterUrl = `/${board}/${classLevel}/${subjectParam}/chapter-${chapterNum}`;
      
      const { headers, isAuthorized } = await getAuthHeaders();
      if (!isAuthorized) {
        router.push('/login');
        return;
      }
      const API_URL = process.env.NEXT_PUBLIC_API_URL;

      // First try to get a random question for this chapter
      try {
        const response = await fetch(
          `${API_URL}/api/questions/${board}/${classLevel}/${subjectParam}/chapter-${chapterNum}/random`,
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

  const toggleChapterExpansion = (subject: string, chapterNum: number) => {
    const key = `${subject}-${chapterNum}`;
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

  const isChapterExpanded = (subject: string, chapterNum: number) => {
    return expandedChapters.has(`${subject}-${chapterNum}`);
  };

  const getSubjectIcon = (subjectName: string) => {
    const name = subjectName.toLowerCase();
    if (name.includes('math')) return '🔢';
    if (name.includes('science') || name.includes('physics') || name.includes('chemistry') || name.includes('biology')) return '🧪';
    if (name.includes('english') || name.includes('language')) return '📚';
    if (name.includes('history') || name.includes('social')) return '🏛️';
    if (name.includes('geography')) return '🌍';
    return '📖';
  };

  return (
    <div className="space-y-6 pb-6">
      {subjects.map((subject, subjectIndex) => (
        <div 
          key={subject.name} 
          className="bg-white/90 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
          style={{
            animationDelay: `${subjectIndex * 100}ms`
          }}
        >
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-50/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          {/* Decorative corner */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-red-100/30 to-transparent rounded-bl-full"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center gap-3">
                <div className="text-2xl sm:text-3xl">{getSubjectIcon(subject.name)}</div>
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800 group-hover:text-red-600 transition-colors">
                    {subject.name}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500">
                    {subject.chapters.length} chapters available
                  </p>
                </div>
              </div>
              
              {/* Subject stats */}
              <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  <span>Progress</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              {subject.chapters.map((chapter, chapterIndex) => {
                const chapterProgress = getChapterProgress(subject.name, chapter.number);
                const isExpanded = isChapterExpanded(subject.name, chapter.number);

                return (
                  <div 
                    key={chapter.number} 
                    className="border border-gray-200/60 rounded-lg bg-white/80 backdrop-blur-sm hover:shadow-md transition-all duration-200 overflow-hidden group/chapter"
                    style={{
                      animationDelay: `${(chapterIndex * 50)}ms`
                    }}
                  >
                    <div className="p-3 sm:p-4">
                      <div className="flex items-center justify-between">
                        <div 
                          className="flex-1 cursor-pointer group/click"
                          onClick={() => handleChapterClick(subject.name, chapter.number)}
                        >
                          <div className="flex items-center mb-2 sm:mb-3">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <span className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs sm:text-sm font-bold rounded-full">
                                {chapter.number}
                              </span>
                              <span className="text-sm sm:text-base font-medium text-gray-800 group-hover/click:text-blue-600 transition-colors">
                                {chapter.name}
                              </span>
                            </div>
                          </div>
                          
                          {/* Enhanced Progress Bar */}
                          <div className="w-full bg-gray-200/80 rounded-full h-2.5 sm:h-3 relative overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-700 ease-out ${getProgressColor(chapterProgress.averageScore)}`}
                              style={{ 
                                width: getProgressWidth(chapterProgress.attempted, chapterProgress.total),
                              }}
                            />
                            {/* Shimmer effect for active progress bars */}
                            {chapterProgress.attempted > 0 && (
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                            )}
                          </div>
                          
                          {/* Quick stats */}
                          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                            <div className="flex items-center gap-3">
                              <span>{chapterProgress.attempted}/{Math.max(chapterProgress.attempted, chapterProgress.total)} questions</span>
                              {chapterProgress.averageScore > 0 && (
                                <span className="flex items-center gap-1">
                                  <TrendingUp className="w-3 h-3" />
                                  {chapterProgress.averageScore.toFixed(1)}/10
                                </span>
                              )}
                            </div>
                            <span className="text-blue-600 opacity-0 group-hover/click:opacity-100 transition-opacity">
                              Click to start →
                            </span>
                          </div>
                        </div>
                        
                        {/* Dropdown Arrow */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleChapterExpansion(subject.name, chapter.number);
                          }}
                          className="ml-4 p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors group/arrow"
                        >
                          {isExpanded ? (
                            <ChevronDown size={18} className="text-gray-600 group-hover/arrow:text-gray-800 transition-colors" />
                          ) : (
                            <ChevronRight size={18} className="text-gray-600 group-hover/arrow:text-gray-800 transition-colors" />
                          )}
                        </button>
                      </div>
                      
                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-gray-200/60 animate-fadeIn">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                            <div className="bg-blue-50/80 rounded-lg p-3 text-center">
                              <div className="font-semibold text-blue-700">Progress</div>
                              <div className="text-blue-600 mt-1">
                                {chapterProgress.attempted}/{Math.max(chapterProgress.attempted, chapterProgress.total)}
                              </div>
                            </div>
                            <div className="bg-green-50/80 rounded-lg p-3 text-center">
                              <div className="font-semibold text-green-700">Average Score</div>
                              <div className="text-green-600 mt-1">
                                {chapterProgress.averageScore.toFixed(1)}/10
                              </div>
                            </div>
                            <div className="bg-purple-50/80 rounded-lg p-3 text-center col-span-2 sm:col-span-1">
                              <div className="font-semibold text-purple-700">Status</div>
                              <div className="text-purple-600 mt-1">
                                {chapterProgress.attempted === 0 ? 'Not Started' : 
                                 chapterProgress.averageScore >= 8 ? 'Excellent' :
                                 chapterProgress.averageScore >= 6 ? 'Good' : 'Needs Practice'}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
      
      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}