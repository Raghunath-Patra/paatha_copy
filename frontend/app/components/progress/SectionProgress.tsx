// frontend/components/progress/SectionProgress.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

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

interface SectionProgressProps {
  board: string;
  classLevel: string;
  subject: string;
  chapter: string;
  sections: Section[];
  progress: any;
}

interface SectionProgressData {
  attempted_questions: number;
  total_questions: number;
  average_score: number;
  completion_percentage: number;
  best_score: number;
  last_attempt: string | null;
}

const SectionProgress: React.FC<SectionProgressProps> = ({
  board,
  classLevel,
  subject,
  chapter,
  sections,
  progress
}) => {
  const router = useRouter();
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());

  const toggleSectionExpansion = (sectionNumber: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionNumber)) {
      newExpanded.delete(sectionNumber);
    } else {
      newExpanded.add(sectionNumber);
    }
    setExpandedSections(newExpanded);
  };

  const getProgressForSection = (sectionNumber: number): SectionProgressData => {
    const sectionProgress = progress[`section_${sectionNumber}`] || {};
    return {
      attempted_questions: sectionProgress.attempted_questions || 0,
      total_questions: sectionProgress.total_questions || 0,
      average_score: sectionProgress.average_score || 0,
      completion_percentage: sectionProgress.completion_percentage || 0,
      best_score: sectionProgress.best_score || 0,
      last_attempt: sectionProgress.last_attempt || null
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

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return (
          <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'medium':
        return (
          <div className="w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        );
      case 'hard':
        return (
          <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {sections.map((section) => {
        const sectionProgress = getProgressForSection(section.number);
        const isExpanded = expandedSections.has(section.number);
        
        return (
          <div
            key={section.number}
            className="border border-gray-200/60 rounded-lg bg-white/90 backdrop-blur-sm hover:shadow-md transition-all duration-300 overflow-hidden relative group"
          >
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="relative z-10">
              {/* Main section info */}
              <div 
                className="p-4 sm:p-6 cursor-pointer"
                onClick={() => toggleSectionExpansion(section.number)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    {/* Section header */}
                    <div className="flex items-center mb-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full font-semibold text-sm mr-3">
                        {section.number}
                      </div>
                      <h3 className="text-lg sm:text-xl font-medium text-gray-800 group-hover:text-blue-700 transition-colors">
                        {section.name}
                      </h3>
                    </div>
                    
                    {/* Quick stats */}
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-3 text-sm">
                      <span className="text-gray-600">
                        {section.question_count} questions
                      </span>
                      
                      {sectionProgress.attempted_questions > 0 && (
                        <>
                          <span className="text-blue-600 font-medium">
                            {sectionProgress.attempted_questions} attempted
                          </span>
                          
                          {sectionProgress.average_score > 0 && (
                            <span className={`px-2 py-1 rounded-full text-xs border font-medium ${getScoreColor(sectionProgress.average_score)}`}>
                              Avg: {sectionProgress.average_score.toFixed(1)}/10
                            </span>
                          )}
                          
                          <span className="text-gray-500">
                            Last: {formatLastAttempt(sectionProgress.last_attempt)}
                          </span>
                        </>
                      )}
                    </div>
                    
                    {/* Progress bar */}
                    <div className="w-full bg-gray-200/80 rounded-full h-2.5 mb-2 relative overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${getProgressColor(sectionProgress.completion_percentage)} rounded-full transition-all duration-500 relative`}
                        style={{ width: `${Math.min(sectionProgress.completion_percentage, 100)}%` }}
                      >
                        {/* Shimmer effect for active progress */}
                        {sectionProgress.completion_percentage > 0 && (
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs text-gray-600">
                      <span>{sectionProgress.completion_percentage.toFixed(0)}% completed</span>
                      {sectionProgress.best_score > 0 && (
                        <span>Best: {sectionProgress.best_score}/10</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Expand/Collapse icon */}
                  <div className="ml-4 flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/${board}/${classLevel}/${subject}/chapter-${chapter}/section-${section.number}`);
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 shadow-md hover:shadow-lg text-sm font-medium"
                    >
                      Start
                    </button>
                    
                    <svg 
                      className={`w-5 h-5 text-gray-400 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
              
              {/* Expanded content */}
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              }`}>
                {isExpanded && (
                  <div className="px-4 sm:px-6 pb-4 sm:pb-6 border-t border-gray-100">
                    <div className="pt-4 space-y-4">
                      {/* Difficulty distribution */}
                      {section.difficulty_distribution && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Question Difficulty
                          </h4>
                          <div className="flex flex-wrap gap-3">
                            {section.difficulty_distribution.easy > 0 && (
                              <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full border border-green-200">
                                {getDifficultyIcon('easy')}
                                <span className="text-sm text-green-700 font-medium">
                                  {section.difficulty_distribution.easy} Easy
                                </span>
                              </div>
                            )}
                            {section.difficulty_distribution.medium > 0 && (
                              <div className="flex items-center gap-2 px-3 py-1 bg-yellow-50 rounded-full border border-yellow-200">
                                {getDifficultyIcon('medium')}
                                <span className="text-sm text-yellow-700 font-medium">
                                  {section.difficulty_distribution.medium} Medium
                                </span>
                              </div>
                            )}
                            {section.difficulty_distribution.hard > 0 && (
                              <div className="flex items-center gap-2 px-3 py-1 bg-red-50 rounded-full border border-red-200">
                                {getDifficultyIcon('hard')}
                                <span className="text-sm text-red-700 font-medium">
                                  {section.difficulty_distribution.hard} Hard
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Performance details */}
                      {sectionProgress.attempted_questions > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            Your Performance
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                              <div className="text-xs text-blue-600 font-medium">Attempted</div>
                              <div className="text-lg font-bold text-blue-800">
                                {sectionProgress.attempted_questions}
                              </div>
                            </div>
                            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                              <div className="text-xs text-green-600 font-medium">Average</div>
                              <div className="text-lg font-bold text-green-800">
                                {sectionProgress.average_score.toFixed(1)}/10
                              </div>
                            </div>
                            <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                              <div className="text-xs text-purple-600 font-medium">Best Score</div>
                              <div className="text-lg font-bold text-purple-800">
                                {sectionProgress.best_score}/10
                              </div>
                            </div>
                            <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                              <div className="text-xs text-orange-600 font-medium">Progress</div>
                              <div className="text-lg font-bold text-orange-800">
                                {sectionProgress.completion_percentage.toFixed(0)}%
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Action buttons */}
                      <div className="flex flex-wrap gap-3 pt-2">
                        <button
                          onClick={() => {
                            router.push(`/${board}/${classLevel}/${subject}/chapter-${chapter}/section-${section.number}`);
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 shadow-md hover:shadow-lg text-sm font-medium"
                        >
                          {sectionProgress.attempted_questions > 0 ? 'Continue Practice' : 'Start Section'}
                        </button>
                        
                        {sectionProgress.attempted_questions > 0 && (
                          <button
                            onClick={() => {
                              router.push(`/${board}/${classLevel}/${subject}/chapter-${chapter}/section-${section.number}/performance`);
                            }}
                            className="px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-lg hover:from-purple-200 hover:to-pink-200 transition-all duration-200 border border-purple-200 text-sm font-medium"
                          >
                            View Performance
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
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

export default SectionProgress;