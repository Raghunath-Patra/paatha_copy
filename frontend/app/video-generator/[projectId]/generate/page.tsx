// File: frontend/app/video-generator/[projectId]/generate/page.tsx (Generate video)
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSupabaseAuth } from '../../../contexts/SupabaseAuthContext';
import Navigation from '../../../components/navigation/Navigation';
import VideoGeneration from '../../components/video-generator/VideoGeneration';
import { getAuthHeaders } from '../../../utils/auth';

export default function GenerateVideoPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useSupabaseAuth();
  const [project, setProject] = useState(null);
  const [slides, setSlides] = useState([]);

  const projectId = params.projectId as string;

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    // Load project data (similar to edit page)
    fetchProject();
  }, [user, projectId]);

  const fetchProject = async () => {
    // Similar fetch logic as edit page
    // ... (implementation similar to edit page)
  };

  const handleVideoGenerated = () => {
    router.push(`/video-generator/${projectId}/play`);
  };

  const handleBackToEditor = () => {
    router.push(`/video-generator/${projectId}/edit`);
  };

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
            <h1 className="text-2xl font-bold text-gray-800">Generate Video</h1>
          </div>
          <Navigation />
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden p-6">
          {project && (
            <VideoGeneration
              project={project}
              slides={slides}
              onVideoGenerated={handleVideoGenerated}
              onBackToEditor={handleBackToEditor}
            />
          )}
        </div>
      </div>
    </div>
  );
}
