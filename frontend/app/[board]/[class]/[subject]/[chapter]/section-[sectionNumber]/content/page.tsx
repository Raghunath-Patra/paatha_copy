// frontend/app/[board]/[class]/[subject]/[chapter]/section-[sectionNumber]/content/page.tsx
// UPDATED: Minimal Section Content Page with Floating Navigation

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navigation from '../../../../../../components/navigation/Navigation';
import { getAuthHeaders } from '../../../../../../utils/auth';
import { useSupabaseAuth } from '../../../../../../contexts/SupabaseAuthContext';
import { userTokenService } from '../../../../../../utils/userTokenService';
import HTMLContentRenderer from '../../../../../../components/questions/HTMLContentRenderer';

interface SectionInfo {
  number: number;
  name: string;
}

interface ChapterInfo {
  number: number;
  name: string;
}

interface PerformancePageParams {
  board: string;
  class: string;
  subject: string;
  chapter: string;
  sectionNumber: string;
}

interface SectionContentData {
  sectionInfo: SectionInfo;
  htmlContent: string;
  chapterNumber: string;
  timestamp: number;
}

// Subject mapping
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

// Floating Navigation Component
const FloatingNavigation = ({ 
  params, 
  sectionNumber, 
  sections,
  currentSectionIndex 
}: { 
  params: PerformancePageParams; 
  sectionNumber: string;
  sections: SectionInfo[];
  currentSectionIndex: number;
}) => {
  const router = useRouter();
  
  const handleBackToChapter = () => {
    router.push(`/${params.board}/${params.class}/${params.subject}/${params.chapter}`);
  };

  const handleQuestionsClick = () => {
    router.push(`/${params.board}/${params.class}/${params.subject}/${params.chapter}/section-${sectionNumber}/questions`);
  };

  const handlePreviousSection = () => {
    if (currentSectionIndex > 0) {
      const prevSection = sections[currentSectionIndex - 1];
      router.push(`/${params.board}/${params.class}/${params.subject}/${params.chapter}/section-${prevSection.number}/content`);
    }
  };

  const handleNextSection = () => {
    if (currentSectionIndex < sections.length - 1) {
      const nextSection = sections[currentSectionIndex + 1];
      router.push(`/${params.board}/${params.class}/${params.subject}/${params.chapter}/section-${nextSection.number}/content`);
    }
  };

  const hasPrevious = currentSectionIndex > 0;
  const hasNext = currentSectionIndex < sections.length - 1;

  return (
    <>
      {/* Top Left - Back to Chapter */}
      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={handleBackToChapter}
          className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm text-gray-700 rounded-lg hover:bg-white transition-all duration-300 shadow-lg hover:shadow-xl border border-gray-200"
          title="Back to Chapter"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="font-medium">Chapter</span>
        </button>
      </div>

      {/* Top Right - Main Navigation */}
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200">
          <Navigation />
        </div>
      </div>

      {/* Bottom Left - Section Navigation */}
      <div className="fixed bottom-4 left-4 z-50 flex gap-2">
        {hasPrevious && (
          <button
            onClick={handlePreviousSection}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500/90 backdrop-blur-sm text-white rounded-lg hover:bg-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl"
            title="Previous Section"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Previous</span>
          </button>
        )}
        
        {hasNext && (
          <button
            onClick={handleNextSection}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500/90 backdrop-blur-sm text-white rounded-lg hover:bg-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl"
            title="Next Section"
          >
            <span className="font-medium">Next</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Bottom Right - Questions Button */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={handleQuestionsClick}
          className="flex items-center gap-2 px-4 py-2 bg-green-500/90 backdrop-blur-sm text-white rounded-lg hover:bg-green-600 transition-all duration-300 shadow-lg hover:shadow-xl"
          title="Practice Questions"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">Questions</span>
        </button>
      </div>
    </>
  );
};

// Simple loading spinner
const SimpleLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-white">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      <p className="text-gray-600">Loading content...</p>
    </div>
  </div>
);

// Simple error display
const SimpleError = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <div className="min-h-screen flex items-center justify-center bg-white">
    <div className="text-center p-6 max-w-md">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h3 className="font-semibold text-red-800 mb-2">Error Loading Content</h3>
      <p className="text-red-700 mb-4">{error}</p>
      <button 
        onClick={onRetry}
        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
      >
        Retry
      </button>
    </div>
  </div>
);

export default function SectionContentPage() {
  const params = useParams() as unknown as PerformancePageParams;
  const router = useRouter();
  const { profile, loading: authLoading } = useSupabaseAuth();
  
  const [sectionInfo, setSectionInfo] = useState<SectionInfo | null>(null);
  const [sections, setSections] = useState<SectionInfo[]>([]);
  const [chapterInfo, setChapterInfo] = useState<ChapterInfo | null>(null);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isContentReady, setIsContentReady] = useState(false);
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  
  // Extract section and chapter numbers
  const extractSectionNumber = (): string => {
    if (params.sectionNumber && params.sectionNumber !== 'undefined') {
      return params.sectionNumber.toString();
    }
    
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const match = pathname.match(/\/section-(\d+)\//);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return '';
  };

  const extractChapterNumber = (): string => {
    if (params.chapter) {
      return params.chapter.toString().replace('chapter-', '');
    }
    
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const match = pathname.match(/\/chapter-(\d+)\//);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return '';
  };
  
  const sectionNumber = extractSectionNumber();
  const chapterNumber = extractChapterNumber();

  // Get current section index for navigation
  const currentSectionIndex = sections.findIndex(s => s.number === parseInt(sectionNumber));

  // Load from cached data
  const loadFromCachedData = (): boolean => {
    try {
      const cacheKey = `section_content_${params.board}_${params.class}_${params.subject}_${chapterNumber}_${sectionNumber}`;
      const cachedData = sessionStorage.getItem(cacheKey);
      
      if (cachedData) {
        const contentData: SectionContentData = JSON.parse(cachedData);
        
        const dataAge = Date.now() - contentData.timestamp;
        const maxAge = 30 * 60 * 1000; // 30 minutes
        
        if (dataAge < maxAge) {
          setSectionInfo(contentData.sectionInfo);
          setHtmlContent(contentData.htmlContent);
          sessionStorage.removeItem(cacheKey);
          return true;
        } else {
          sessionStorage.removeItem(cacheKey);
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error loading cached data:', error);
      return false;
    }
  };

  // Fetch data normally
  const fetchDataNormally = async (): Promise<void> => {
    try {
      const { headers, isAuthorized } = await getAuthHeaders();
      if (!isAuthorized) {
        router.push('/login');
        return;
      }

      // Sync user data
      await fetch(`${API_URL}/api/auth/sync-user`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email: profile?.email,
          full_name: profile?.full_name,
          board: profile?.board,
          class_level: profile?.class_level
        })
      });

      // Fetch sections for navigation
      const sectionsResponse = await fetch(
        `${API_URL}/api/subjects/${params.board}/${params.class}/${params.subject}/${chapterNumber}/sections`,
        { headers }
      );
      
      if (sectionsResponse.ok) {
        const sectionsData = await sectionsResponse.json();
        setSections(sectionsData.sections || []);
        
        const section = sectionsData.sections?.find(
          (s: any) => s.number === parseInt(sectionNumber)
        );
        if (section) {
          setSectionInfo(section);
        } else {
          setSectionInfo({
            number: parseInt(sectionNumber),
            name: `Section ${sectionNumber}`
          });
        }
      }

      // Fetch HTML content
      const subjectBase = params.subject.substring(0, 5);
      const commonPatterns = [
        { folderSuffix: '01', filePrefixes: ['06', '01', '02', '03', '04', '05'] },
        { folderSuffix: '02', filePrefixes: ['06', '01', '02', '03', '04', '05'] },
        { folderSuffix: '12', filePrefixes: ['06', '01', '02', '03', '04', '05'] },
        { folderSuffix: '10', filePrefixes: ['06', '01', '02', '03', '04', '05'] },
        { folderSuffix: '11', filePrefixes: ['06', '01', '02', '03', '04', '05'] },
      ];

      const tryPattern = async (folderSuffix: string, filePrefix: string): Promise<string | null> => {
        const subjectFolder = `${subjectBase}${folderSuffix}`;
        const filename = filePrefix 
          ? `${filePrefix}_section_${chapterNumber}_${sectionNumber}.html`
          : `section_${chapterNumber}_${sectionNumber}.html`;
        
        const htmlPath = `/interactive/${params.board}/${params.class}/${params.subject}/${subjectFolder}/${filename}`;
        
        try {
          const response = await fetch(htmlPath);
          if (response.ok) {
            return await response.text();
          }
        } catch (error) {
          // Silent fail
        }
        return null;
      };

      let fetchedHtmlContent = '';
      let fileFound = false;

      for (const pattern of commonPatterns) {
        if (fileFound) break;
        
        for (const filePrefix of pattern.filePrefixes) {
          const content = await tryPattern(pattern.folderSuffix, filePrefix);
          if (content) {
            fetchedHtmlContent = content;
            fileFound = true;
            break;
          }
        }
        
        if (!fileFound) {
          const content = await tryPattern(pattern.folderSuffix, '');
          if (content) {
            fetchedHtmlContent = content;
            fileFound = true;
            break;
          }
        }
      }

      if (!fileFound) {
        fetchedHtmlContent = `
          <div style="padding: 40px; text-align: center; font-family: Arial, sans-serif; min-height: 50vh; display: flex; flex-direction: column; justify-content: center;">
            <h2 style="color: #dc2626; margin-bottom: 20px;">📁 Content Not Found</h2>
            <p style="color: #6b7280; margin: 20px 0; font-size: 16px;">
              Unable to locate learning content for Chapter ${chapterNumber}, Section ${sectionNumber}.
            </p>
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px auto; max-width: 400px; border: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                <strong>Subject:</strong> ${params.subject}<br>
                <strong>Chapter:</strong> ${chapterNumber}<br>
                <strong>Section:</strong> ${sectionNumber}
              </p>
            </div>
          </div>
        `;
      }

      setHtmlContent(fetchedHtmlContent);

    } catch (error) {
      console.error('Error in normal data fetch:', error);
      setError(error instanceof Error ? error.message : 'Failed to load section content');
    }
  };

  // Main useEffect
  useEffect(() => {
    const initializeContent = async () => {
      if (authLoading) return;
      if (!profile) {
        router.push('/login');
        return;
      }

      if (!sectionNumber || !chapterNumber) {
        setError('Invalid section or chapter number');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setIsContentReady(false);

        // Try cache first
        const cacheSuccess = loadFromCachedData();
        if (cacheSuccess) {
          setIsContentReady(true);
          setLoading(false);
          return;
        }

        // Fallback to normal loading
        await fetchDataNormally();
        setIsContentReady(true);

        // Initialize token service
        userTokenService.fetchUserTokenStatus();

      } catch (error) {
        console.error('Error in content initialization:', error);
        setError(error instanceof Error ? error.message : 'Failed to load section content');
      } finally {
        setLoading(false);
      }
    };

    if (params.board && params.class && params.subject && params.chapter) {
      initializeContent();
    }
  }, [params, router, profile, authLoading, sectionNumber, chapterNumber, API_URL]);

  // Handle retry
  const handleRetry = () => {
    window.location.reload();
  };

  // Early returns for invalid parameters, loading, and error states
  if (!sectionNumber || !chapterNumber) {
    return (
      <SimpleError 
        error="Section or chapter number is missing from the URL." 
        onRetry={() => router.push(`/${params.board}/${params.class}/${params.subject}/${params.chapter}`)}
      />
    );
  }

  if (loading) {
    return <SimpleLoader />;
  }

  if (error) {
    return <SimpleError error={error} onRetry={handleRetry} />;
  }

  // Main content display
  return (
    <div className="min-h-screen bg-white">
      {/* Floating Navigation */}
      <FloatingNavigation 
        params={params} 
        sectionNumber={sectionNumber}
        sections={sections}
        currentSectionIndex={currentSectionIndex}
      />

      {/* Content */}
      {isContentReady && htmlContent ? (
        <HTMLContentRenderer 
          htmlContent={htmlContent}
          className=""
          style={{}}
        />
      ) : (
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="text-gray-600">Preparing interactive content...</p>
          </div>
        </div>
      )}
    </div>
  );
}