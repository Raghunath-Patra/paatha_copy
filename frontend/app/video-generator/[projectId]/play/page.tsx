// File: frontend/app/video-generator/[projectId]/play/page.tsx (Play video)
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSupabaseAuth } from '../../../contexts/SupabaseAuthContext';
import Navigation from '../../../components/navigation/Navigation';
import CreditDisplay from '../../components/credits/CreditDisplay';
import VideoPlayerPopup from '../../components/video-generator/VideoPlayerPopup';
import { getAuthHeaders } from '../../../utils/auth';

// Define proper TypeScript interface for project
interface ProjectData {
  id: string;
  title: string;
  status: string;
  created_at: string;
  // Add other project properties as needed
}

export default function PlayVideoPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useSupabaseAuth();
  
  // Use proper TypeScript types
  const [project, setProject] = useState<ProjectData | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
      setLoading(true);
      setError(null);
      
      const { headers, isAuthorized } = await getAuthHeaders();
      if (!isAuthorized) {
        throw new Error('Not authenticated');
      }

      // Get project details
      const projectResponse = await fetch(`${API_URL}/api/video-generator/project/${projectId}`, { 
        headers 
      });
      
      if (!projectResponse.ok) {
        throw new Error(`Failed to load project: ${projectResponse.status}`);
      }
      
      const projectResult = await projectResponse.json();
      
      if (projectResult.success && projectResult.project?.project) {
        const projectData: ProjectData = {
          id: projectResult.project.project.id,
          title: projectResult.project.project.title,
          status: projectResult.project.project.status,
          created_at: projectResult.project.project.created_at
        };
        setProject(projectData);
      } else {
        throw new Error('Project not found or invalid response');
      }

      // Get video stream URL
      const streamResponse = await fetch(`${API_URL}/api/video-generator/stream/${projectId}`, { 
        headers 
      });
      
      if (!streamResponse.ok) {
        if (streamResponse.status === 404) {
          throw new Error('Video not found. The video may still be processing.');
        } else if (streamResponse.status === 403) {
          throw new Error('Access denied to this video.');
        } else {
          throw new Error(`Failed to load video: ${streamResponse.status}`);
        }
      }
      
      const streamResult = await streamResponse.json();
      
      if (streamResult.success && streamResult.streamUrl) {
        setVideoUrl(streamResult.streamUrl);
      } else {
        throw new Error('Failed to get video stream URL');
      }
      
    } catch (error) {
      console.error('Error loading video:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToProjects = () => {
    router.push('/video-generator');
  };

  const handleClosePlayer = () => {
    router.push('/video-generator');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading video...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
        <div className="bg-white rounded-lg p-8 shadow-lg text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Video</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={loadVideoUrl}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              🔄 Retry
            </button>
            <button
              onClick={handleBackToProjects}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
            >
              ← Back to Projects
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!project || !videoUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
        <div className="bg-white rounded-lg p-8 shadow-lg text-center max-w-md">
          <div className="text-yellow-500 text-6xl mb-4">📽️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Video Not Available</h2>
          <p className="text-gray-600 mb-4">
            This project doesn't have a video yet, or it's still being processed.
          </p>
          <button
            onClick={handleBackToProjects}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg"
          >
            ← Back to Projects
          </button>
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
          <div className="flex items-center space-x-3 sm:space-x-4">
            <CreditDisplay />
            <Navigation />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden p-6">
          {videoUrl && project && (
            <VideoPlayerPopup
              isOpen={true}
              onClose={handleClosePlayer}
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