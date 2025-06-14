// frontend/app/[board]/[class]/[subject]/[chapter]/[sectionNumber]/questions/q/[questionId]/page.tsx

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SectionQuestionPage() {
  const params = useParams();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const redirect = async () => {
      try {
        // Validate that we have the required parameters
        if (!params.board || !params.class || !params.subject || !params.chapter || !params.sectionNumber || !params.questionId) {
          setError('Missing required parameters');
          return;
        }

        // Small delay to ensure params are fully ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Construct the section questions URL with the question ID as a query parameter
        const sectionQuestionsUrl = `/${params.board}/${params.class}/${params.subject}/${params.chapter}/${params.sectionNumber}/questions?q=${params.questionId}`;
        
        console.log('🔀 Redirecting to section questions page:', sectionQuestionsUrl);
        
        // Replace the current URL without adding to history stack
        router.replace(sectionQuestionsUrl);
      } catch (err) {
        console.error('❌ Redirect error:', err);
        setError('Failed to redirect to section questions page');
      }
    };

    redirect();
  }, [params, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
        <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg max-w-md text-center border border-red-200">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="font-semibold text-red-800 mb-2">Redirect Error</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      <div className="text-center">
        <div className="relative mb-8">
          <div className="w-16 h-16 border-4 border-red-200 rounded-full animate-spin border-t-red-500 mx-auto"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent rounded-full animate-ping border-t-red-300 mx-auto"></div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-center space-x-1">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
          <p className="text-gray-600">Loading section question...</p>
          <p className="text-gray-500 text-sm">
            Section {params.sectionNumber} • Question ID: {params.questionId}
          </p>
        </div>
      </div>
    </div>
  );
}