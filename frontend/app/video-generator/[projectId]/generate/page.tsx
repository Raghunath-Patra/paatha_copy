// File: frontend/app/video-generator/[projectId]/generate/page.tsx (Complete Generate video page)
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSupabaseAuth } from '../../../contexts/SupabaseAuthContext';
import Navigation from '../../../components/navigation/Navigation';
import EnhancedSpinner from '../../../components/common/EnhancedSpinner';
import VideoGeneration from '../../components/video-generator/VideoGeneration';
import { getAuthHeaders } from '../../../utils/auth';

// TypeScript interfaces
interface Slide {
  speaker: string;
  title: string;
  content: string;
  content2?: string;
  narration: string;
  visualDuration: number;
  isComplex: boolean;
  visual?: {
    type: string;
    params: any[];
  } | null;
}

interface Speaker {
  voice: string;
  model: string;
  name: string;
  color: string;
  gender: string;
}

interface Project {
  id: string;
  title: string;
  lessonSteps: Slide[];
  speakers: Record<string, Speaker>;
  visualFunctions: Record<string, Function>;
  status: string;
}

export default function GenerateVideoPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useSupabaseAuth();
  
  const [project, setProject] = useState<Project | null>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const projectId = params.projectId as string;
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    fetchProject();
  }, [user, projectId]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const { headers, isAuthorized } = await getAuthHeaders();
      
      if (!isAuthorized) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}/api/video-generator/project/${projectId}`, {
        headers
      });
      
      const result = await response.json();
      
      if (result.success && result.project) {
        const { project, speakers, visualFunctions, lessonSteps } = result.project;
        
        // Transform data for VideoGeneration component
        const transformedProject: Project = {
          id: project.id,
          title: project.title,
          lessonSteps: lessonSteps.map((step: any): Slide => ({
            speaker: step.speaker,
            title: step.title,
            content: step.content,
            content2: step.content2,
            narration: step.narration,
            visualDuration: step.visual_duration,
            isComplex: step.is_complex,
            visual: step.visual_type ? {
              type: step.visual_type,
              params: step.visual_params || []
            } : null
          })),
          speakers: speakers.reduce((acc: Record<string, Speaker>, speaker: any) => {
            acc[speaker.speaker_key] = {
              voice: speaker.voice,
              model: speaker.model,
              name: speaker.name,
              color: speaker.color,
              gender: speaker.gender
            };
            return acc;
          }, {}),
          visualFunctions: visualFunctions.reduce((acc: Record<string, Function>, vf: any) => {
            try {
              acc[vf.function_name] = new Function('ctx', 'param1', 'param2', 'param3', 
                vf.function_code.replace(/^function\s+\w+\s*\([^)]*\)\s*\{/, '').replace(/\}$/, '')
              );
            } catch (error) {
              console.error(`Error reconstructing function ${vf.function_name}:`, error);
            }
            return acc;
          }, {}),
          status: project.status
        };
        
        setProject(transformedProject);
        setSlides(transformedProject.lessonSteps);
      } else {
        throw new Error(result.error || 'Failed to load project');
      }
    } catch (error) {
      console.error('Error fetching project:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleVideoGenerated = () => {
    // Redirect to play page with video URL
    //router.push(`/video-generator/${projectId}/play`);
  };

  const handleBackToEditor = () => {
    router.push(`/video-generator/${projectId}/edit`);
  };

  const handleBackToProjects = () => {
    router.push('/video-generator');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
        <EnhancedSpinner size="lg" message="Loading your project..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
        <div className="bg-white rounded-lg p-8 shadow-lg text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Project</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleBackToProjects}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
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
            <h1 className="text-2xl font-bold text-gray-800">Generate Video: {project.title}</h1>
          </div>
          <Navigation />
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden p-6">
          <VideoGeneration
            project={project}
            slides={slides}
            onVideoGenerated={handleVideoGenerated}
            onBackToEditor={handleBackToEditor}
            onBackToProjects={handleBackToProjects}
          />
        </div>
      </div>
    </div>
  );
}