// frontend/app/components/progress/SubjectProgress.tsx

'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthHeaders } from '../../utils/auth';

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
  const [hoveredChapter, setHoveredChapter] = useState<{subject: string, chapter: Chapter} | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Check initially
    checkMobile();
    
    // Listen for resize events
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Add debugging logs
  console.log('SubjectProgress props:', { board, classLevel, subjects, progress });
  console.log('Progress keys:', Object.keys(progress || {}));

  const getProgressColor = (score: number) => {
    if (score >= 8) return 'bg-green-500';
    if (score >= 6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getProgressHeight = (attempted: number, total: number) => {
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

  // Improved tooltip positioning that takes screen boundaries into account
  const handleMouseEnter = (
    event: React.MouseEvent, 
    subject: string, 
    chapter: Chapter
  ) => {
    // Capture the target element's bounding rectangle
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    
    // Get window dimensions
    const windowWidth = window.innerWidth;
    
    // Calculate initial position (centered above the element)
    let x = rect.left + (rect.width / 2);
    let y = rect.top - 10;
    
    // Store position
    setTooltipPosition({ x, y });
    setHoveredChapter({ subject, chapter });
  };

  // Effect to adjust tooltip position if it would be cut off
  useEffect(() => {
    if (hoveredChapter && tooltipRef.current) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      
      let newX = tooltipPosition.x;
      let newY = tooltipPosition.y;
      
      // Adjust horizontal position if tooltip would go off-screen
      if (tooltipRect.right > windowWidth - 20) {
        // If on mobile, center the tooltip
        if (isMobile) {
          newX = windowWidth / 2;
        } else {
          // If not mobile, shift it left
          newX = windowWidth - tooltipRect.width / 2 - 20;
        }
      } else if (tooltipRect.left < 20) {
        newX = tooltipRect.width / 2 + 20;
      }
      
      // Adjust vertical position if needed
      if (tooltipRect.top < 20) {
        // If tooltip would go above screen, position it below the element
        newY = tooltipRect.height + 30;
      }
      
      // Update position if changed
      if (newX !== tooltipPosition.x || newY !== tooltipPosition.y) {
        setTooltipPosition({ x: newX, y: newY });
      }
    }
  }, [hoveredChapter, isMobile, tooltipPosition]);

  // Get a className for the tooltip that respects screen boundaries
  const getTooltipClassName = () => {
    let className = "fixed z-[100] w-64 pointer-events-none transform -translate-y-full";
    
    // On mobile, center the tooltip and make it wider
    if (isMobile) {
      className = "fixed z-[100] w-[85vw] max-w-md pointer-events-none transform -translate-y-full -translate-x-1/2";
    } else {
      className = "fixed z-[100] w-64 pointer-events-none transform -translate-y-full -translate-x-1/2";
    }
    
    return className;
  };

  return (
    <div className="space-y-6 pb-6 relative overflow-visible">
      {subjects.map((subject) => (
        <div key={subject.name} className="bg-white rounded-lg p-4 shadow-sm relative overflow-visible">
          <div className={`flex ${isMobile ? 'flex-col items-center' : 'items-start gap-8'}`}>
            <h2 className={`font-medium ${isMobile ? 'text-xl mb-4 text-center' : 'text-lg w-48 pt-2'}`}>
              {subject.name}
            </h2>
            
            <div className={`${isMobile ? 'w-full' : 'flex-1'} relative overflow-visible`}>
              <div className="text-sm font-medium text-gray-600 mb-3 text-center">Chapters</div>
              <div className={`flex flex-wrap gap-3 ${isMobile ? 'justify-center' : ''}`}>
                {subject.chapters.map((chapter) => {
                  const chapterProgress = getChapterProgress(subject.name, chapter.number);

                  return (
                    <div 
                      key={chapter.number}
                      className="relative w-14 h-20 overflow-visible z-10"
                      onMouseEnter={(e) => handleMouseEnter(e, subject.name, chapter)}
                      onMouseLeave={() => setHoveredChapter(null)}
                      onClick={() => handleChapterClick(subject.name, chapter.number)}
                    >
                      <div className="absolute inset-0 bg-gray-100 rounded cursor-pointer 
                                  hover:bg-gray-50 transition-colors border border-gray-200">
                        <div 
                          className={`absolute bottom-0 w-full transition-all duration-300 ${
                            getProgressColor(chapterProgress.averageScore)}`}
                          style={{ 
                            height: getProgressHeight(chapterProgress.attempted, chapterProgress.total),
                            opacity: 0.7
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center text-sm font-medium">
                          {chapter.number}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ))}
      
      {/* Tooltip - repositioned for visibility */}
      {hoveredChapter && (
        <div 
          ref={tooltipRef}
          className={getTooltipClassName()}
          style={{ 
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`
          }}>
          <div className="bg-gray-800 text-white rounded-lg p-3 shadow-lg">
            <p className="font-medium text-sm break-words">
              Chapter {hoveredChapter.chapter.number}: {hoveredChapter.chapter.name}
            </p>
            <p className="text-xs mt-1">
              {(() => {
                const chapterProgress = getChapterProgress(
                  hoveredChapter.subject, 
                  hoveredChapter.chapter.number
                );
                return (
                  <>
                    Progress: {chapterProgress.attempted}/{Math.max(chapterProgress.attempted, chapterProgress.total)} questions
                    <br />
                    Average Score: {chapterProgress.averageScore.toFixed(1)}/10
                  </>
                );
              })()}
            </p>
            <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-full">
              <div className="border-4 border-transparent border-t-gray-800" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}