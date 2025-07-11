// frontend/app/components/progress/SubjectProgress.tsx - Fixed chapter navigation
'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthHeaders } from '../../utils/auth';
import { ChevronDown, ChevronUp, BookOpen, Target, TrendingUp } from 'lucide-react';

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
  const [animateProgress, setAnimateProgress] = useState(false);
  const router = useRouter();

  // Add debugging logs
  console.log('SubjectProgress props:', { board, classLevel, subjects, progress });
  console.log('Progress keys:', Object.keys(progress || {}));

  // Trigger progress animation after component mounts and data is loaded
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimateProgress(true);
    }, 300); // Small delay to ensure smooth animation

    return () => clearTimeout(timer);
  }, [subjects, progress]);

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

  // ✅ FIXED: Simplified chapter click handler - no more question fetching
  const handleChapterClick = async (subject: string, chapterNum: number) => {
    try {
      // Get the subject code if available, otherwise use the display name
      const normalizedSubject = subject.toLowerCase().replace(/\s+/g, '-');
      const subjectObj = subjects.find(s => s.name.toLowerCase() === subject.toLowerCase());
      
      // Use code if available, otherwise use the normalized name
      const subjectParam = subjectObj?.code || normalizedSubject;
      
      console.log(`✅ Navigating to chapter overview: ${subjectParam}, chapter ${chapterNum}`);
      
      // ✅ FIXED: Direct navigation to chapter overview page (no question ID)
      const chapterUrl = `/${board}/${classLevel}/${subjectParam}/chapter-${chapterNum}`;
      
      console.log(`🔗 Chapter URL: ${chapterUrl}`);
      router.push(chapterUrl);
      
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
                          
                          {/* Enhanced Progress Bar with Width Animation */}
                          <div className="w-full bg-gray-200/80 rounded-full h-2.5 sm:h-3 relative overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ease-out ${getProgressColor(chapterProgress.averageScore)}`}
                              style={{ 
                                width: animateProgress 
                                  ? getProgressWidth(chapterProgress.attempted, chapterProgress.total)
                                  : '0%',
                                transitionProperty: 'width, background-color',
                                transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
                                transitionDelay: `${chapterIndex * 100}ms` // Staggered animation
                              }}
                            />
                            {/* Shimmer effect for active progress bars */}
                            {chapterProgress.attempted > 0 && animateProgress && (
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                            )}
                            {/* Subtle pulse for empty progress bars */}
                            {chapterProgress.attempted === 0 && (
                              <div className="absolute inset-0 bg-gradient-to-r from-red-100/50 via-orange-100/50 to-yellow-100/50 rounded-full animate-pulse opacity-30"></div>
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
                            <ChevronUp size={18} className="text-gray-600 group-hover/arrow:text-gray-800 transition-colors" />
                          ) : (
                            <ChevronDown size={18} className="text-gray-600 group-hover/arrow:text-gray-800 transition-colors" />
                          )}
                        </button>
                      </div>
                      
                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-gray-200/60 animate-fadeIn">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm mb-4">
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
                          
                          {/* Performance Report Link */}
                          {chapterProgress.attempted > 0 && (
                            <div className="flex justify-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const normalizedSubject = subject.name.toLowerCase().replace(/\s+/g, '-');
                                  const subjectObj = subjects.find(s => s.name.toLowerCase() === subject.name.toLowerCase());
                                  const subjectParam = subjectObj?.code || normalizedSubject;
                                  const performanceUrl = `/${board}/${classLevel}/${subjectParam}/chapter-${chapter.number}/performance`;
                                  router.push(performanceUrl);
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg text-sm font-medium"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                View Performance Report
                              </button>
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