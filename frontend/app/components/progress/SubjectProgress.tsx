// frontend/components/progress/SubjectProgress.tsx
// Updated to navigate to chapter sections page instead of directly to questions

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Chapter {
  number: number;
  name: string;
}

interface Subject {
  name: string;
  code: string;
  chapters: Chapter[];
}

interface SubjectProgressProps {
  board: string;
  classLevel: string;
  subjects: Subject[];
  progress: any;
}

interface ChapterProgressData {
  attempted_questions: number;
  total_questions: number;
  average_score: number;
  completion_percentage: number;
  best_score: number;
  last_attempt: string | null;
}

const SubjectProgress: React.FC<SubjectProgressProps> = ({
  board,
  classLevel,
  subjects,
  progress
}) => {
  const router = useRouter();
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());

  const toggleSubjectExpansion = (subjectCode: string) => {
    const newExpanded = new Set(expandedSubjects);
    if (newExpanded.has(subjectCode)) {
      newExpanded.delete(subjectCode);
    } else {
      newExpanded.add(subjectCode);
    }
    setExpandedSubjects(newExpanded);
  };

  const getProgressForChapter = (subjectCode: string, chapterNumber: number): ChapterProgressData => {
    const chapterProgress = progress[`${subjectCode}_chapter_${chapterNumber}`] || {};
    return {
      attempted_questions: chapterProgress.attempted_questions || 0,
      total_questions: chapterProgress.total_questions || 0,
      average_score: chapterProgress.average_score || 0,
      completion_percentage: chapterProgress.completion_percentage || 0,
      best_score: chapterProgress.best_score || 0,
      last_attempt: chapterProgress.last_attempt || null
    };
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'from-green-400 to-emerald-500';
    if (percentage >= 60) return 'from-yellow-400 to-orange-500';
    if (percentage >= 40) return 'from-orange-400 to-red-500';
    if (percentage > 0) return 'from-red-400 to-red-500';
    return 'from-gray-300 to-gray-400';
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-700 bg-green-50 border-green-200';
    if (score >= 6) return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    if (score >= 4) return 'text-orange-700 bg-orange-50 border-orange-200';
    return 'text-red-700 bg-red-50 border-red-200';
  };

  const formatLastAttempt = (dateString: string | null) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6 pb-6">
      {subjects.map((subject) => {
        const isExpanded = expandedSubjects.has(subject.code);
        
        return (
          <div
            key={subject.code}
            className="bg-white/90 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-lg border border-white/50 relative overflow-hidden"
          >
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-50/30 to-transparent opacity-50"></div>
            
            <div className="relative z-10">
              {/* Subject header */}
              <div className="flex items-center mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 flex items-center gap-3">
                  {subject.name}
                  <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {subject.chapters.length}
                  </div>
                </h2>
              </div>
              
              {/* Chapters list */}
              <div className="space-y-3">
                {subject.chapters.map((chapter) => {
                  const chapterProgress = getProgressForChapter(subject.code, chapter.number);
                  
                  return (
                    <div
                      key={chapter.number}
                      className="border border-gray-200/60 rounded-lg p-3 sm:p-4 bg-white/60 backdrop-blur-sm hover:shadow-md transition-all duration-200 group relative overflow-hidden"
                    >
                      {/* Hover gradient */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-50/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      <div className="relative z-10">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            {/* Chapter name and number */}
                            <div className="flex items-center mb-2">
                              <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full font-semibold text-xs sm:text-sm mr-2 sm:mr-3">
                                {chapter.number}
                              </div>
                              <h3 className="text-sm sm:text-lg font-medium text-gray-800 group-hover:text-blue-700 transition-colors">
                                {chapter.name}
                              </h3>
                            </div>
                            
                            {/* Progress info */}
                            {chapterProgress.attempted_questions > 0 && (
                              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 text-xs sm:text-sm">
                                <span className="text-blue-600 font-medium">
                                  {chapterProgress.attempted_questions} attempted
                                </span>
                                
                                {chapterProgress.average_score > 0 && (
                                  <span className={`px-2 py-1 rounded-full text-xs border font-medium ${getScoreColor(chapterProgress.average_score)}`}>
                                    Avg: {chapterProgress.average_score.toFixed(1)}/10
                                  </span>
                                )}
                                
                                <span className="text-gray-500">
                                  Last: {formatLastAttempt(chapterProgress.last_attempt)}
                                </span>
                              </div>
                            )}
                            
                            {/* Progress bar */}
                            <div className="w-full bg-gray-200/80 rounded-full h-2.5 relative overflow-hidden">
                              <div 
                                className={`h-full bg-gradient-to-r ${getProgressColor(chapterProgress.completion_percentage)} rounded-full transition-all duration-500 relative`}
                                style={{ width: `${Math.min(chapterProgress.completion_percentage, 100)}%` }}
                              >
                                {/* Shimmer effect for active progress */}
                                {chapterProgress.completion_percentage > 0 && (
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex justify-between items-center text-xs text-gray-600 mt-1">
                              <span>{chapterProgress.completion_percentage.toFixed(0)}% completed</span>
                              {chapterProgress.best_score > 0 && (
                                <span>Best: {chapterProgress.best_score}/10</span>
                              )}
                            </div>
                          </div>
                          
                          {/* Action buttons */}
                          <div className="ml-4 flex items-center gap-2">
                            {/* ✅ UPDATED: Navigate to chapter sections page instead of directly to questions */}
                            <button
                              onClick={() => {
                                router.push(`/${board}/${classLevel}/${subject.code}/chapter-${chapter.number}`);
                              }}
                              className="px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 shadow-md hover:shadow-lg text-xs sm:text-sm font-medium"
                            >
                              {chapterProgress.attempted_questions > 0 ? 'Continue' : 'Start'}
                            </button>
                            
                            {/* Performance button - only show if user has attempted questions */}
                            {chapterProgress.attempted_questions > 0 && (
                              <button
                                onClick={() => {
                                  router.push(`/${board}/${classLevel}/${subject.code}/chapter-${chapter.number}/performance`);
                                }}
                                className="px-3 sm:px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-lg hover:from-purple-200 hover:to-pink-200 transition-all duration-200 border border-purple-200 text-xs sm:text-sm font-medium"
                              >
                                Stats
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
      
      {/* Enhanced CSS */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default SubjectProgress;