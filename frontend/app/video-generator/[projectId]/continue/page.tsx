// File: frontend/app/video-generator/[projectId]/continue/page.tsx (Continue project)
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSupabaseAuth } from '../../../contexts/SupabaseAuthContext';
import Navigation from '../../../components/navigation/Navigation';
import EnhancedSpinner from '../../../components/common/EnhancedSpinner';
import { getAuthHeaders } from '../../../utils/auth';

// Define TypeScript interfaces (reusing from edit page)
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
  inputData?: any; // For storing original input data
}

export default function ContinueProjectPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useSupabaseAuth();
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

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
        
        // Transform data similar to edit page
        const transformedProject: Project = {
          id: project.id,
          title: project.title,
          lessonSteps: lessonSteps?.map((step: any): Slide => ({
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
          })) || [],
          speakers: speakers?.reduce((acc: Record<string, Speaker>, speaker: any) => {
            acc[speaker.speaker_key] = {
              voice: speaker.voice,
              model: speaker.model,
              name: speaker.name,
              color: speaker.color,
              gender: speaker.gender
            };
            return acc;
          }, {}) || {},
          visualFunctions: visualFunctions?.reduce((acc: Record<string, Function>, vf: any) => {
            try {
              acc[vf.function_name] = new Function('ctx', 'param1', 'param2', 'param3', 
                vf.function_code.replace(/^function\s+\w+\s*\([^)]*\)\s*\{/, '').replace(/\}$/, '')
              );
            } catch (error) {
              console.error(`Error reconstructing function ${vf.function_name}:`, error);
            }
            return acc;
          }, {}) || {},
          status: project.status,
          inputData: project.input_data // Store original input for continuation
        };
        
        setProject(transformedProject);
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

  const handleContinueProcessing = async () => {
    if (!project) return;

    try {
      setProcessing(true);
      const { headers, isAuthorized } = await getAuthHeaders();
      
      if (!isAuthorized) {
        throw new Error('Not authenticated');
      }

      // Call API to continue processing the project
      const response = await fetch(`${API_URL}/api/video-generator/continue/${projectId}`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Redirect to edit page after successful processing
        router.push(`/video-generator/${projectId}/edit`);
      } else {
        throw new Error(result.error || 'Failed to continue processing');
      }
    } catch (error) {
      console.error('Error continuing project:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setProcessing(false);
    }
  };

  const handleBackToProjects = () => {
    router.push('/video-generator');
  };

  const handleEditInput = () => {
    // Navigate to input/create page with existing data
    router.push(`/video-generator/create?edit=${projectId}`);
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
        <div className="bg-white rounded-lg p-8 shadow-lg text-center max-w-md">
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
              onClick={handleBackToProjects}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              ← Back to Projects
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Continue: {project.title}</h1>
          </div>
          <Navigation />
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden p-6">
          <div className="text-center py-8">
            {/* Project Status Info */}
            <div className="mb-8">
              <div className="text-6xl mb-4">⏸️</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Project Paused</h2>
              <p className="text-gray-600 mb-4">
                This project contains input data but hasn't been fully processed yet.
              </p>
              
              {/* Project Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left max-w-2xl mx-auto">
                <h3 className="font-semibold text-gray-800 mb-2">Project Details:</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div><strong>Title:</strong> {project.title}</div>
                  <div><strong>Status:</strong> {project.status}</div>
                  <div><strong>Lesson Steps:</strong> {project.lessonSteps.length || 'Not generated yet'}</div>
                  <div><strong>Speakers:</strong> {Object.keys(project.speakers).length || 'Not configured yet'}</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={handleContinueProcessing}
                disabled={processing}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-8 py-3 rounded-lg font-semibold transition-all transform hover:-translate-y-0.5 disabled:transform-none flex items-center space-x-2"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>▶️</span>
                    <span>Continue Processing</span>
                  </>
                )}
              </button>

              <button
                onClick={handleEditInput}
                className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-8 py-3 rounded-lg font-semibold transition-all transform hover:-translate-y-0.5 flex items-center space-x-2"
              >
                <span>✏️</span>
                <span>Edit Input</span>
              </button>
            </div>

            {/* Help Text */}
            <div className="mt-8 text-sm text-gray-500 max-w-2xl mx-auto">
              <p>
                <strong>Continue Processing:</strong> Generate the script and prepare the project for video creation.
              </p>
              <p className="mt-2">
                <strong>Edit Input:</strong> Modify the original input data before processing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}