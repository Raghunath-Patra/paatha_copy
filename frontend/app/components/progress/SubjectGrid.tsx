// frontend/app/components/progress/SubjectGrid.tsx

'use client';

import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import { getAuthHeaders } from '../../utils/auth';

interface Chapter {
  number: number;
  name: string;
}

interface Subject {
  name: string;
  chapters: Chapter[];
}

interface SubjectGridProps {
  board: string;
  classLevel: string;
}

const SubjectGrid = ({ board, classLevel }: SubjectGridProps) => {
  const [activeCard, setActiveCard] = useState<number | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const { profile } = useSupabaseAuth();
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

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

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoading(true);
        const { headers, isAuthorized } = await getAuthHeaders();
        
        if (!isAuthorized) {
          console.log('No auth headers');
          return;
        }

        const response = await fetch(
          `${API_URL}/api/subjects/${board}/${classLevel}`,
          { headers }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch subjects');
        }

        const data = await response.json();
        setSubjects(data.subjects || []);
      } catch (error) {
        console.error('Error fetching subjects:', error);
      } finally {
        setLoading(false);
      }
    };

    if (board && classLevel) {
      fetchSubjects();
    }
  }, [board, classLevel, API_URL]);

  const getChapterListPosition = (index: number, totalSubjects: number) => {
    if (isMobile) {
      // For mobile, use a full-width dropdown below the card
      return "absolute bg-white rounded-lg shadow-lg p-4 left-0 right-0 top-full mt-2 z-50";
    }
    
    const isLastRow = index >= totalSubjects - 3;
    const isRightColumn = (index + 1) % 3 === 0;

    let className = "absolute bg-white rounded-lg shadow-lg p-4 w-[280px] z-50 ";
    
    if (isRightColumn) {
      className += "right-full mr-2 top-0 ";
    } else {
      className += "left-full ml-2 top-0 ";
    }

    if (isLastRow) {
      className += "bottom-0 ";
    }

    return className;
  };

  // Function to handle subject card click on mobile
  const handleSubjectClick = (index: number) => {
    if (isMobile) {
      // Toggle the card on mobile
      setActiveCard(activeCard === index ? null : index);
    }
  };

  // Conditionally set event handlers based on device type
  const getCardEventHandlers = (index: number) => {
    if (isMobile) {
      // On mobile, use click/tap instead of hover
      return {
        onClick: () => handleSubjectClick(index)
      };
    } else {
      // On desktop, use hover
      return {
        onMouseEnter: () => setActiveCard(index),
        onMouseLeave: () => setActiveCard(null)
      };
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((placeholder) => (
          <div 
            key={placeholder}
            className="flex flex-col items-center p-6 bg-white rounded-lg shadow-sm animate-pulse"
          >
            <div className="w-12 h-12 mb-4 bg-gray-200 rounded-full"></div>
            <div className="h-6 w-32 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {subjects.map((subject, index) => (
        <div 
          key={index} 
          className="relative"
          {...getCardEventHandlers(index)}
        >
          <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 mb-4 flex items-center justify-center text-neutral-700">
              📚
            </div>
            <h3 className="text-lg font-medium text-neutral-900">{subject.name}</h3>
            {isMobile && (
              <div className="mt-2 text-sm text-blue-600">
                {activeCard === index ? 'Hide chapters' : 'View chapters'}
              </div>
            )}
          </div>
          
          {activeCard === index && (
            <div className={getChapterListPosition(index, subjects.length)}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Chapters</h4>
                {isMobile && (
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation();
                      setActiveCard(null);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                )}
              </div>
              <div className={`${isMobile ? 'max-h-[40vh]' : 'max-h-[60vh]'} overflow-y-auto`}>
                {subject.chapters.map((chapter) => (
                  <a
                    key={chapter.number}
                    href={`/${board}/${classLevel}/${subject.name.toLowerCase()}/chapter-${chapter.number}`}
                    className="block p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                  >
                    Chapter {chapter.number}: {chapter.name}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default SubjectGrid;