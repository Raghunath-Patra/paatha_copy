// File: frontend/app/video-generator/page.tsx (Updated main page - Projects List)
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import Navigation from '../components/navigation/Navigation';
import EnhancedSpinner from '../components/common/EnhancedSpinner';
import { getAuthHeaders } from '../utils/auth';
import VideoProjectBrowser from './components/video-generator/VideoProjectBrowser';

// Define the Project interface
interface Project {
  projectId: string;
  title: string;
  createdAt: string;
  status: string;
  lessonStepsCount: number;
  speakers: string[];
  visualFunctions: string[];
  hasVideo: boolean;
  videoFiles: string[];
}

export default function VideoGeneratorPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useSupabaseAuth();
  // Fix: Properly type the projects state
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleProjectAction = (projectId: string, action: string) => {
    switch (action) {
      case 'edit':
        router.push(`/video-generator/${projectId}/edit`);
        break;
      case 'play':
        router.push(`/video-generator/${projectId}/play`);
        break;
      case 'download':
        router.push(`/video-generator/${projectId}/download`);
        break;
      case 'continue':
        router.push(`/video-generator/${projectId}/continue`);
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const handleCreateNew = () => {
    router.push('/video-generator/create');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
        <EnhancedSpinner size="lg" message="Loading video generator..." />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">🎬 Video Generator</h1>
          <Navigation />
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <VideoProjectBrowser
            projects={projects}
            setProjects={setProjects}
            onProjectAction={handleProjectAction}
            onCreateNew={handleCreateNew}
          />
        </div>
      </div>
    </div>
  );
}