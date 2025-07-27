// File: frontend/app/video-generator/[projectId]/generate/page.tsx (Optimized Generate video page)
'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSupabaseAuth } from '../../../contexts/SupabaseAuthContext';
import Navigation from '../../../components/navigation/Navigation';
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
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              ← Back to Editor
            </button>
            <h1 className="text-2xl font-bold text-gray-800">
              Generate Video
              <span className="text-sm text-gray-500 ml-2">
                (ID: {projectId.substring(0, 8)}...)
              </span>
            </h1>
          </div>
          <Navigation />
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