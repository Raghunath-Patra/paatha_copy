// File: frontend/app/video-generator/[projectId]/generate/page.tsx (Optimized Generate video page)
'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSupabaseAuth } from '../../../contexts/SupabaseAuthContext';
import Navigation from '../../../components/navigation/Navigation';
import CreditDisplay from '../../components/credits/CreditDisplay';
import VideoGeneration from '../../components/video-generator/VideoGeneration';

export default function GenerateVideoPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useSupabaseAuth();

  const projectId = params.projectId as string;

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const handleBackToEditor = () => {
    router.push(`/video-generator/${projectId}/edit`);
  };

  const handleBackToProjects = () => {
    router.push('/video-generator');
  };

  // Show loading state while checking authentication
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBackToEditor}
              className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
            >
              <svg 
                className="w-5 h-5 transition-transform group-hover:-translate-x-1" 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              <span>Back to Editor</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-800">
              Generate Video
            </h1>
          </div>
          <div className="flex items-center space-x-3 sm:space-x-4">
            <CreditDisplay />
            <Navigation />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden p-6">
          <VideoGeneration
            projectId={projectId}
            onBackToEditor={handleBackToEditor}
            onBackToProjects={handleBackToProjects}
          />
        </div>
      </div>
    </div>
  );
}