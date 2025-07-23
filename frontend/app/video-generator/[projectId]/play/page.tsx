// File: frontend/app/video-generator/[projectId]/play/page.tsx (Play video)
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSupabaseAuth } from '../../../contexts/SupabaseAuthContext';
import Navigation from '../../../components/navigation/Navigation';
import VideoPlayerPopup from '../../components/video-generator/VideoPlayerPopup';
import { getAuthHeaders } from '../../../utils/auth';

export default function PlayVideoPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useSupabaseAuth();
  const [project, setProject] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(true);

  const projectId = params.projectId as string;
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    loadVideoUrl();
  }, [user, projectId]);

  const loadVideoUrl = async () => {
    try {
      const { headers, isAuthorized } = await getAuthHeaders();
      if (!isAuthorized) throw new Error('Not authenticated');

      // Get project details
      const projectResponse = await fetch(`${API_URL}/api/video-generator/project/${projectId}`, { headers });
      const projectResult = await projectResponse.json();
      
      if (projectResult.success) {
        setProject(projectResult.project.project);
      }

      // Get video stream URL
      const streamResponse = await fetch(`${API_URL}/api/video-generator/stream/${projectId}`, { headers });
      const streamResult = await streamResponse.json();
      
      if (streamResult.success) {
        setVideoUrl(streamResult.streamUrl);
      }
    } catch (error) {
      console.error('Error loading video:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToProjects = () => {
    router.push('/video-generator');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p>Loading video...</p>
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
              onClick={handleBackToProjects}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              ← Back to Projects
            </button>
            <h1 className="text-2xl font-bold text-gray-800">
              {project ? `Playing: ${project.title}` : 'Video Player'}
            </h1>
          </div>
          <Navigation />
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden p-6">
          {videoUrl && project && (
            <VideoPlayerPopup
              isOpen={true}
              onClose={handleBackToProjects}
              videoUrl={videoUrl}
              projectTitle={project.title}
              projectId={projectId}
            />
          )}
        </div>
      </div>
    </div>
  );
}
