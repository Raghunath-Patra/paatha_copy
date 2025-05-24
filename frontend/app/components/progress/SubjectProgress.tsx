// frontend/app/components/progress/SubjectProgress.tsx

'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthHeaders } from '../../utils/auth';
import { ChevronDown, ChevronUp } from 'lucide-react';

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
    if (score >= 8) return 'bg-green-500';
    if (score >= 6) return 'bg-yellow-500';
    return 'bg-red-500';
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

  return (
    <div className="space-y-6 pb-6">
      {subjects.map((subject) => (
        <div key={subject.name} className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-medium mb-4 text-gray-800">
            {subject.name}:
          </h2>
          
          <div className="space-y-3">
            {subject.chapters.map((chapter) => {
              const chapterProgress = getChapterProgress(subject.name, chapter.number);
              const isExpanded = isChapterExpanded(subject.name, chapter.number);

              return (
                <div key={chapter.number} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => handleChapterClick(subject.name, chapter.number)}
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
                    
                    {/* Dropdown Arrow */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleChapterExpansion(subject.name, chapter.number);
                      }}
                      className="ml-4 p-1 hover:bg-gray-200 rounded-full transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown size={20} className="text-gray-600" />
                      ) : (
                        <ChevronRight size={20} className="text-gray-600" />
                      )}
                    </button>
                  </div>
                  
                  {/* Expanded Details */}
                  {isExpanded && (
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
            })}
          </div>
        </div>
      ))}
    </div>
  );
}