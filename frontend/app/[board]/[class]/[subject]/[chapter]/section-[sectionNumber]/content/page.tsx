// frontend/app/[board]/[class]/[subject]/[chapter]/section-[sectionNumber]/content/page.tsx
// FIXED: Section Content Page - Proper parameter extraction and scope handling

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navigation from '../../../../../../components/navigation/Navigation';
import { getAuthHeaders } from '../../../../../../utils/auth';
import { useSupabaseAuth } from '../../../../../../contexts/SupabaseAuthContext';
import { userTokenService } from '../../../../../../utils/userTokenService';

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

// Board and class display names
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

// ✅ FIXED: Content Navigation Component with proper props
const ContentNavigation = ({ params, sectionNumber }: { 
  params: PerformancePageParams; 
  sectionNumber: string;
}) => {
  const router = useRouter();
  
  const handleQuestionsClick = () => {
    router.push(`/${params.board}/${params.class}/${params.subject}/${params.chapter}/section-${sectionNumber}/questions`);
  };

  const handlePerformanceClick = () => {
    router.push(`/${params.board}/${params.class}/${params.subject}/${params.chapter}/section-${sectionNumber}/performance`);
  };

  const handleBackToChapter = () => {
    router.push(`/${params.board}/${params.class}/${params.subject}/${params.chapter}`);
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {/* Back to Chapter */}
      <button
        onClick={handleBackToChapter}
        className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-lg hover:from-gray-200 hover:to-gray-300 transition-all duration-300 shadow-sm hover:shadow-md"
        title="Back to Chapter"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span className="hidden sm:inline">Chapter</span>
      </button>

      {/* Content Icon (Current Page) */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg shadow-md">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
        </svg>
        <span className="hidden sm:inline">Learning</span>
      </div>

      {/* Questions Icon */}
      <button
        onClick={handleQuestionsClick}
        className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 rounded-lg hover:from-blue-200 hover:to-indigo-200 transition-all duration-300 shadow-sm hover:shadow-md"
        title="Practice Questions"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="hidden sm:inline">Questions</span>
      </button>

      {/* Performance Icon */}
      <button
        onClick={handlePerformanceClick}
        className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-lg hover:from-purple-200 hover:to-pink-200 transition-all duration-300 shadow-sm hover:shadow-md"
        title="View Performance"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span className="hidden sm:inline">Performance</span>
      </button>

      {/* Main Navigation */}
      <Navigation />
    </div>
  );
};

// Loading skeleton
const ContentLoadingSkeleton = () => (
  <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-50/30 to-transparent opacity-50"></div>
    
    <div className="relative z-10 p-6 space-y-4">
      <div className="h-8 bg-gradient-to-r from-green-200 to-emerald-200 rounded w-2/3 animate-pulse"></div>
      <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-full animate-pulse"></div>
      <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-3/4 animate-pulse" style={{animationDelay: '0.1s'}}></div>
      <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-5/6 animate-pulse" style={{animationDelay: '0.2s'}}></div>
      
      <div className="space-y-3 pt-4">
        <div className="h-32 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg animate-pulse" style={{animationDelay: '0.3s'}}></div>
        <div className="h-24 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg animate-pulse" style={{animationDelay: '0.4s'}}></div>
      </div>
    </div>
  </div>
);

export default function SectionContentPage() {
  const params = useParams() as unknown as PerformancePageParams;
  const router = useRouter();
  const { profile, loading: authLoading } = useSupabaseAuth();
  
  const [sectionInfo, setSectionInfo] = useState<SectionInfo | null>(null);
  const [chapterInfo, setChapterInfo] = useState<ChapterInfo | null>(null);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  
  // ✅ FIXED: Proper parameter extraction
  console.log('🔍 Route parameter analysis:', {
    'params': params,
    'params.sectionNumber': params.sectionNumber,
    'params.chapter': params.chapter,
    'typeof params.sectionNumber': typeof params.sectionNumber,
    'URL pathname': typeof window !== 'undefined' ? window.location.pathname : 'SSR'
  });

  // ✅ FIXED: Simplified parameter extraction
  const rawSectionNumber = params.sectionNumber;
  const rawChapter = params.chapter;
  
  // For Next.js dynamic routes, params.sectionNumber should already be just the number
  // No need to remove 'section-' prefix as it's already extracted by Next.js
  const sectionNumber = rawSectionNumber ? rawSectionNumber.toString() : '';
  const chapterNumber = rawChapter ? rawChapter.toString().replace('chapter-', '') : '';
  
  console.log('🔍 Parameter extraction result:', {
    rawSectionNumber,
    rawChapter,
    finalSectionNumber: sectionNumber,
    finalChapterNumber: chapterNumber
  });
  
  // ✅ FIXED: Better validation with fallback
  const validateAndExtractSectionNumber = (): string => {
    // First try the direct parameter
    if (sectionNumber && !isNaN(Number(sectionNumber))) {
      console.log('✅ Using direct parameter:', sectionNumber);
      return sectionNumber;
    }
    
    // Fallback: parse from URL if parameter is missing or invalid
    if (typeof window !== 'undefined') {
      const pathParts = window.location.pathname.split('/').filter(Boolean);
      const sectionPart = pathParts.find(part => part.startsWith('section-'));
      const extractedNumber = sectionPart?.replace('section-', '');
      
      if (extractedNumber && !isNaN(Number(extractedNumber))) {
        console.log('✅ Using URL fallback:', extractedNumber);
        return extractedNumber;
      }
    }
    
    console.error('❌ No valid section number found');
    return '';
  };
  
  const finalSectionNumber = validateAndExtractSectionNumber();
  
  // Early return if section number is invalid
  if (!finalSectionNumber) {
    console.error('❌ Section number is missing or invalid:', {
      params,
      sectionNumber,
      finalSectionNumber,
      urlPath: typeof window !== 'undefined' ? window.location.pathname : 'N/A'
    });
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-red-200/30 rounded-full animate-pulse" 
               style={{animationDuration: '3s'}} />
          <div className="absolute bottom-1/4 right-1/4 w-16 h-16 bg-yellow-200/25 rounded-full animate-bounce" 
               style={{animationDuration: '4s'}} />
        </div>
        
        <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg max-w-md text-center border border-red-200 relative z-10">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="font-semibold text-red-800 mb-2">Invalid Section</h3>
          <p className="text-red-700 mb-4">Section number is missing or invalid in the URL.</p>
          <div className="bg-gray-100 p-3 rounded mb-4 text-left">
            <p className="text-sm text-gray-600 mb-2"><strong>Current URL:</strong></p>
            <code className="text-xs break-all">{typeof window !== 'undefined' ? window.location.pathname : 'N/A'}</code>
            <p className="text-sm text-gray-600 mt-2 mb-1"><strong>Expected format:</strong></p>
            <code className="text-xs">/board/class/subject/chapter-X/section-Y/content</code>
          </div>
          <button 
            onClick={() => router.push(`/${params.board}/${params.class}/${params.subject}/${params.chapter}`)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
          >
            Back to Chapter
          </button>
        </div>
      </div>
    );
  }
  
  // Format subject name
  const formatSubjectName = (subject: string) => {
    if (!subject) return '';
    
    const mappedName = SUBJECT_CODE_TO_NAME[subject.toLowerCase()];
    if (mappedName) {
      return mappedName;
    }
    
    const parts = subject.split('-');
    return parts.map(part => {
      if (/^[IVX]+$/i.test(part)) return part.toUpperCase();
      return part.charAt(0).toUpperCase() + part.slice(1);
    }).join(' ');
  };

  // Get friendly display names
  const boardDisplayName = BOARD_DISPLAY_NAMES[params.board?.toLowerCase()] || params.board?.toUpperCase() || '';
  const classDisplayName = CLASS_DISPLAY_NAMES[params.class?.toLowerCase()] || params.class?.toUpperCase() || '';

  useEffect(() => {
    const fetchData = async () => {
      if (authLoading) return;
      if (!profile) {
        router.push('/login');
        return;
      }

      try {
        setLoading(true);
        setError(null);

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

        // Fetch chapter info
        const chaptersResponse = await fetch(
          `${API_URL}/api/subjects/${params.board}/${params.class}/${params.subject}/chapters`,
          { headers }
        );
        
        if (chaptersResponse.ok) {
          const chaptersData = await chaptersResponse.json();
          const chapter = chaptersData.chapters?.find(
            (ch: any) => ch.number === parseInt(chapterNumber)
          );
          if (chapter) {
            setChapterInfo(chapter);
          }
        }

        // Fetch section info
        const sectionsResponse = await fetch(
          `${API_URL}/api/subjects/${params.board}/${params.class}/${params.subject}/${chapterNumber}/sections`,
          { headers }
        );
        
        if (sectionsResponse.ok) {
          const sectionsData = await sectionsResponse.json();
          const section = sectionsData.sections?.find(
            (s: any) => s.number === parseInt(finalSectionNumber)
          );
          if (section) {
            setSectionInfo(section);
          }
        }

        // ✅ FIXED: HTML content fetching with better error handling
        console.log(`🔍 Fetching content for: Chapter ${chapterNumber}, Section ${finalSectionNumber}`);
        
        const subjectBase = params.subject.substring(0, 5); // e.g., "lech1" from "lech1dd"
        
        // Common patterns for efficient search
        const commonPatterns = [
          { folderSuffix: '01', filePrefixes: ['06', '01', '02', '03', '04', '05'] },
          { folderSuffix: '02', filePrefixes: ['06', '01', '02', '03', '04', '05'] },
          { folderSuffix: '12', filePrefixes: ['06', '01', '02', '03', '04', '05'] },
          { folderSuffix: '10', filePrefixes: ['06', '01', '02', '03', '04', '05'] },
          { folderSuffix: '11', filePrefixes: ['06', '01', '02', '03', '04', '05'] },
        ];
        
        // Try pattern function
        const tryPattern = async (folderSuffix: string, filePrefix: string): Promise<string | null> => {
          const subjectFolder = `${subjectBase}${folderSuffix}`;
          const filename = filePrefix 
            ? `${filePrefix}_section_${chapterNumber}_${finalSectionNumber}.html`
            : `section_${chapterNumber}_${finalSectionNumber}.html`;
          
          const htmlPath = `/interactive/${params.board}/${params.class}/${params.subject}/${subjectFolder}/${filename}`;
          
          try {
            const response = await fetch(htmlPath);
            if (response.ok) {
              const content = await response.text();
              console.log(`✅ Found content at: ${htmlPath}`);
              return content;
            }
          } catch (error) {
            // Silent fail, continue trying
          }
          return null;
        };
        
        // Efficient search
        let htmlContent = '';
        let fileFound = false;
        
        console.log(`🔍 Smart search for: Chapter ${chapterNumber}, Section ${finalSectionNumber}`);
        
        // Try common patterns first
        for (const pattern of commonPatterns) {
          if (fileFound) break;
          
          for (const filePrefix of pattern.filePrefixes) {
            const content = await tryPattern(pattern.folderSuffix, filePrefix);
            if (content) {
              htmlContent = content;
              fileFound = true;
              break;
            }
          }
          
          // Also try without prefix
          if (!fileFound) {
            const content = await tryPattern(pattern.folderSuffix, '');
            if (content) {
              htmlContent = content;
              fileFound = true;
              break;
            }
          }
        }
        
        if (!fileFound) {
          console.warn(`❌ No content found for: Chapter ${chapterNumber}, Section ${finalSectionNumber}`);
          htmlContent = `
            <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
              <h2 style="color: #dc2626;">📁 Content Not Found</h2>
              <p style="color: #6b7280; margin: 20px 0;">
                Unable to locate learning content for Chapter ${chapterNumber}, Section ${finalSectionNumber}.
              </p>
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: left;">
                <h3 style="color: #374151; margin-top: 0;">Search Details:</h3>
                <p style="color: #6b7280; font-size: 14px; margin: 10px 0;">
                  <strong>Subject:</strong> ${params.subject} (${subjectBase}XX)<br>
                  <strong>Chapter:</strong> ${chapterNumber}<br>
                  <strong>Section:</strong> ${finalSectionNumber}<br>
                  <strong>Pattern:</strong> /interactive/${params.board}/${params.class}/${params.subject}/${subjectBase}XX/YY_section_${chapterNumber}_${finalSectionNumber}.html
                </p>
              </div>
              <button 
                onclick="window.location.reload()" 
                style="background: #3b82f6; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer;"
              >
                🔄 Retry Search
              </button>
            </div>
          `;
        }
        
        setHtmlContent(htmlContent);

        // Initialize token service
        userTokenService.fetchUserTokenStatus();

      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load section content');
      } finally {
        setLoading(false);
      }
    };

    if (params.board && params.class && params.subject && params.chapter && finalSectionNumber) {
      fetchData();
    }
  }, [params, router, profile, authLoading, API_URL, chapterNumber, finalSectionNumber]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-4 -right-4 w-16 h-16 sm:w-24 sm:h-24 bg-red-200/30 rounded-full animate-pulse" 
               style={{animationDuration: '3s'}} />
          <div className="absolute bottom-1/4 right-1/4 w-12 h-12 sm:w-16 sm:h-16 bg-yellow-200/25 rounded-full animate-bounce" 
               style={{animationDuration: '4s'}} />
          <div className="absolute top-1/2 left-1/4 w-8 h-8 sm:w-12 sm:h-12 bg-orange-200/20 rounded-full animate-ping" 
               style={{animationDuration: '2s'}} />
        </div>

        <div className="container-fluid px-4 sm:px-8 py-4 sm:py-6 relative z-10">
          <div className="max-w-[1600px] mx-auto">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
              <div>
                <h1 className="text-2xl sm:text-3xl font-medium mb-2 text-gray-800">
                  {formatSubjectName(params.subject)} - Chapter {chapterNumber}, Section {finalSectionNumber}
                </h1>
                <p className="text-sm sm:text-base text-gray-600">Loading learning content...</p>
              </div>
              <div className="flex gap-4 items-center relative z-[100] justify-end">
                <ContentNavigation params={params} sectionNumber={finalSectionNumber} />
              </div>
            </div>

            <div className="max-w-5xl mx-auto">
              <ContentLoadingSkeleton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-red-200/30 rounded-full animate-pulse" 
               style={{animationDuration: '3s'}} />
          <div className="absolute bottom-1/4 right-1/4 w-16 h-16 bg-yellow-200/25 rounded-full animate-bounce" 
               style={{animationDuration: '4s'}} />
        </div>
        
        <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg max-w-md text-center border border-red-200 relative z-10">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="font-semibold text-red-800 mb-2">Error Loading Content</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 relative">
      {/* Animated background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-4 -right-4 w-16 h-16 sm:w-24 sm:h-24 bg-red-200/30 rounded-full animate-pulse" 
             style={{animationDuration: '3s'}} />
        <div className="absolute bottom-1/4 right-1/4 w-12 h-12 sm:w-16 sm:h-16 bg-yellow-200/25 rounded-full animate-bounce" 
             style={{animationDuration: '4s'}} />
        <div className="absolute top-1/2 left-1/4 w-8 h-8 sm:w-12 sm:h-12 bg-orange-200/20 rounded-full animate-ping" 
             style={{animationDuration: '2s'}} />
      </div>

      <div className="container-fluid px-4 sm:px-8 py-4 sm:py-6 relative z-10">
        <div className="max-w-[1600px] mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-medium mb-2 text-gray-800">
                {formatSubjectName(params.subject)} - Chapter {chapterNumber}, Section {finalSectionNumber}
                {sectionInfo?.name && (
                  <span className="block sm:inline sm:ml-2 text-orange-600 text-lg sm:text-xl lg:text-2xl mt-1 sm:mt-0">
                    : {sectionInfo.name}
                  </span>
                )}
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                {boardDisplayName} {classDisplayName} • Learning Content
              </p>
            </div>
            <div className="flex gap-4 items-center relative z-[100] justify-end">
              <ContentNavigation params={params} sectionNumber={finalSectionNumber} />
            </div>
          </div>

          {/* HTML Content Container */}
          <div className="max-w-6xl mx-auto">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-50/20 to-transparent opacity-30"></div>
              
              <div className="relative z-10">
                {/* ✅ HTML Content Display */}
                <div 
                  className="prose prose-lg max-w-none p-6 sm:p-8"
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                  style={{
                    // Override prose styles for better integration
                    color: 'inherit',
                    lineHeight: '1.6'
                  }}
                />
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push(`/${params.board}/${params.class}/${params.subject}/${params.chapter}/section-${finalSectionNumber}/questions`)}
                className="flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Practice Questions
              </button>

              <button
                onClick={() => router.push(`/${params.board}/${params.class}/${params.subject}/${params.chapter}`)}
                className="flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-lg hover:from-gray-200 hover:to-gray-300 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Chapter
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}