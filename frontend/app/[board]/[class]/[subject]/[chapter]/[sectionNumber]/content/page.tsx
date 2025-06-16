// frontend/app/[board]/[class]/[subject]/[chapter]/[sectionNumber]/content/page.tsx
// UPDATED: Section Content Page with new URL structure

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

// ✅ UPDATED: Floating Navigation Component with new URL structure
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
    router.push(`/${params.board}/${params.class}/${params.subject}/${params.chapter}/${sectionNumber}/questions`);
  };

  const handlePreviousSection = () => {
    if (currentSectionIndex > 0) {
      const prevSection = sections[currentSectionIndex - 1];
      router.push(`/${params.board}/${params.class}/${params.subject}/${params.chapter}/${prevSection.number}/content`);
    }
  };

  const handleNextSection = () => {
    if (currentSectionIndex < sections.length - 1) {
      const nextSection = sections[currentSectionIndex + 1];
      router.push(`/${params.board}/${params.class}/${params.subject}/${params.chapter}/${nextSection.number}/content`);
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
  
  // ✅ UPDATED: Extract section and chapter numbers without "section-" prefix
  const extractSectionNumber = (): string => {
    if (params.sectionNumber && params.sectionNumber !== 'undefined') {
      return params.sectionNumber.toString();
    }
    
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      // Updated regex to match new URL structure without "section-" prefix
      const match = pathname.match(/\/(\d+)\/content$/);
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

  // ✅ UPDATED: Load from cached data with new cache key structure
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

      // ✅ FETCH HTML CONTENT using chapter-based folder suffix (same as chapter page)
      const subjectBase = params.subject.substring(0, 5);
      
      // Derive folder suffix from chapter number (2-digit padded)
      const folderSuffix = chapterNumber.toString().padStart(2, '0');

      const tryPattern = async (): Promise<string | null> => {
        const subjectFolder = `${subjectBase}${folderSuffix}`;
        const filename = `section_${chapterNumber}_${sectionNumber}.html`;
        
        const htmlPath = `/interactive/${params.board}/${params.class}/${params.subject}/${subjectFolder}/${filename}`;
        
        try {
          const response = await fetch(htmlPath);
          if (response.ok) {
            const content = await response.text();
            console.log(`✅ Found content from: ${htmlPath}`);
            return content;
          }
        } catch (error) {
          // Silent fail
        }
        return null;
      };

      // Search for HTML content
      let fetchedHtmlContent = '';
      let fileFound = false;

      // Try file prefixes from '01' to '30'
      // for (let i = 1; i <= 30 && !fileFound; i++) {
      //   const filePrefix = i.toString().padStart(2, '0');
        
      // }

      const content = await tryPattern();
      if (content) {
        fetchedHtmlContent = content;
        fileFound = true;
      }
      
      // If no prefixed file found, try without prefix
      // if (!fileFound) {
      //   const content = await tryPattern();
      //   if (content) {
      //     fetchedHtmlContent = content;
      //     fileFound = true;
      //   }
      // }

      if (!fileFound) {
        console.log(`🔧 Content being prepared for section ${sectionNumber} - showing practice mode`);
        fetchedHtmlContent = `
          <div style="
            padding: 40px; 
            text-align: center; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            min-height: 50vh; 
            display: flex; 
            flex-direction: column; 
            justify-content: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            position: relative;
            overflow: hidden;
          ">
            <style>
              @keyframes float {
                0%, 100% { transform: translateY(0px) rotate(0deg); }
                33% { transform: translateY(-10px) rotate(1deg); }
                66% { transform: translateY(5px) rotate(-1deg); }
              }
              
              @keyframes pulse {
                0%, 100% { opacity: 0.8; transform: scale(1); }
                50% { opacity: 1; transform: scale(1.05); }
              }
              
              @keyframes shimmer {
                0% { background-position: -200px 0; }
                100% { background-position: 200px 0; }
              }
              
              @keyframes fadeInUp {
                from { opacity: 0; transform: translateY(30px); }
                to { opacity: 1; transform: translateY(0); }
              }
              
              .floating-icon {
                animation: float 3s ease-in-out infinite;
                font-size: 4rem;
                margin-bottom: 20px;
                display: inline-block;
              }
              
              .content-card {
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
                border-radius: 20px;
                padding: 30px;
                margin: 20px auto;
                max-width: 500px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                animation: fadeInUp 0.8s ease-out;
              }
              
              .practice-button {
                background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
                color: white;
                border: none;
                padding: 15px 30px;
                border-radius: 50px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                margin: 10px;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
              }
              
              .practice-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
              }
              
              .shimmer-text {
                background: linear-gradient(90deg, #4f46e5, #06b6d4, #4f46e5);
                background-size: 200px 100%;
                background-clip: text;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                animation: shimmer 2s infinite;
                font-weight: 700;
              }
              
              .progress-dots {
                display: flex;
                justify-content: center;
                gap: 8px;
                margin: 20px 0;
              }
              
              .dot {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: #4f46e5;
                animation: pulse 1.5s infinite;
              }
              
              .dot:nth-child(2) { animation-delay: 0.3s; }
              .dot:nth-child(3) { animation-delay: 0.6s; }
            </style>
            
            <div class="floating-icon">🚀</div>
            
            <div class="content-card">
              <h2 style="color: #1f2937; margin-bottom: 15px; font-size: 2rem;">
                <span class="shimmer-text">We're Building Something Amazing!</span>
              </h2>
              
              <p style="color: #6b7280; margin: 20px 0; font-size: 18px; line-height: 1.6;">
                Chapter ${chapterNumber}, Section ${sectionNumber} content is being crafted with care. 
                While we perfect it, why not sharpen your skills?
              </p>
              
              <div class="progress-dots">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
              </div>
              
              <div style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); padding: 25px; border-radius: 15px; margin: 25px 0; border: 1px solid #d1d5db;">
                <p style="color: #374151; font-size: 14px; margin: 0; line-height: 1.5;">
                  <strong style="color: #1f2937;">📚 Subject:</strong> ${params.subject}<br>
                  <strong style="color: #1f2937;">📖 Chapter:</strong> ${chapterNumber}<br>
                  <strong style="color: #1f2937;">📝 Section:</strong> ${sectionNumber}
                </p>
              </div>
              
              <div style="margin-top: 30px;">
                <button class="practice-button" onclick="window.location.href='#practice-questions'">
                  🎯 Practice Questions
                </button>
                <button class="practice-button" onclick="window.location.href='#review-notes'">
                  📋 Review Notes
                </button>
              </div>
              
              <p style="color: #9ca3af; font-size: 14px; margin-top: 25px; font-style: italic;">
                ✨ Great things take time. Your learning journey continues!
              </p>
            </div>
            
            <!-- Floating background elements -->
            <div style="
              position: absolute; 
              top: 10%; 
              left: 10%; 
              width: 100px; 
              height: 100px; 
              background: rgba(255, 255, 255, 0.1); 
              border-radius: 50%; 
              animation: float 4s ease-in-out infinite;
              z-index: -1;
            "></div>
            <div style="
              position: absolute; 
              bottom: 15%; 
              right: 15%; 
              width: 60px; 
              height: 60px; 
              background: rgba(255, 255, 255, 0.08); 
              border-radius: 50%; 
              animation: float 3.5s ease-in-out infinite reverse;
              z-index: -1;
            "></div>
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
    <>
      {/* Floating Navigation */}
      <FloatingNavigation 
        params={params} 
        sectionNumber={sectionNumber}
        sections={sections}
        currentSectionIndex={currentSectionIndex}
      />

      {/* Content - No wrapper div to preserve HTML body styles */}
      {isContentReady && htmlContent ? (
        <HTMLContentRenderer 
          htmlContent={htmlContent}
          className=""
          style={{}}
        />
      ) : (
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="text-gray-600">Preparing interactive content...</p>
          </div>
        </div>
      )}
    </>
  );
}